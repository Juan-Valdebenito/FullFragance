const fs = require("fs/promises");
const path = require("path");
const {
  parisUserAgent,
  parisMinDelayMs,
  parisMaxDelayMs,
  parisRequestTimeoutMs,
  parisFixtureDir,
  parisPerfumesUrl,
} = require("../config/env");

// Paris entrega 30 productos por página en el listado SSR. Usar ese listado
// evita recorrer el sitemap y luego abrir una ficha individual por producto.
const PAGE_SIZE = 30;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let nextRequestAt = 0;

function assertParisUrl(value) {
  const url = new URL(value);
  if (url.protocol !== "https:" || !/(^|\.)paris\.cl$/i.test(url.hostname)) {
    throw new Error("La URL debe pertenecer a https://www.paris.cl.");
  }
  if (/^\/(?:admin|account|cart|checkout|login)(?:\/|$)/i.test(url.pathname)) {
    throw new Error("La URL está excluida del scraper de Paris.");
  }
  return url.toString();
}

function buildParisCatalogPageUrl(page = 1) {
  if (!Number.isInteger(page) || page < 1) throw new Error("La página de Paris debe ser un entero positivo.");
  const url = new URL(assertParisUrl(parisPerfumesUrl));
  if (!/^\/belleza\/perfumes\/?$/i.test(url.pathname)) {
    throw new Error("El catálogo de Paris debe usar exclusivamente /belleza/perfumes/.");
  }
  url.searchParams.set("page", String(page));
  url.searchParams.set("sortby", "relevance");
  // Faceta pública de Paris: false significa "Vendido por Paris". Así no se
  // importan publicaciones de vendedores del marketplace.
  url.searchParams.set("isMarketplace", "false");
  return url.toString();
}

async function waitForRateLimit() {
  const min = Math.max(0, parisMinDelayMs);
  const max = Math.max(min, parisMaxDelayMs);
  const delay = min + Math.floor(Math.random() * (max - min + 1));
  // Reserva cada inicio de request. Así se mantienen solicitudes espaciadas,
  // pero las respuestas pueden resolverse en paralelo.
  const scheduledAt = Math.max(Date.now(), nextRequestAt);
  nextRequestAt = scheduledAt + delay;
  await sleep(Math.max(0, scheduledAt - Date.now()));
}

async function fetchPage(url) {
  const safeUrl = assertParisUrl(url);
  if (parisFixtureDir) {
    const parsed = new URL(safeUrl);
    const sitemapMatch = parsed.pathname.match(/sitemap_products_es_cl_(\d+)\.xml$/i);
    const productSku = parsed.pathname.match(/-([a-z0-9]+)\.html$/i)?.[1];
    const pageNumber = Math.max(1, Number(parsed.searchParams.get("page") || 1));
    const filename = parsed.pathname.endsWith("sitemap_index.xml")
      ? "sitemap-index.xml"
      : sitemapMatch
        ? `sitemap-${sitemapMatch[1]}.xml`
        : productSku
          ? `${productSku}.html`
          : `page-${pageNumber}.html`;
    return { html: await fs.readFile(path.resolve(parisFixtureDir, filename), "utf8"), finalUrl: safeUrl };
  }

  await waitForRateLimit();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), parisRequestTimeoutMs);
  let response;
  try {
    response = await fetch(safeUrl, {
      headers: {
        "User-Agent": parisUserAgent,
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "es-CL,es;q=0.9",
        Referer: "https://www.paris.cl/",
      },
      redirect: "follow",
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }

  if (response.status === 429) {
    const retryAfter = Number(response.headers.get("retry-after") || 0);
    if (retryAfter > 0 && retryAfter <= 60) {
      await sleep(retryAfter * 1000);
      return fetchPage(safeUrl);
    }
    throw new Error("Paris limitó temporalmente las solicitudes (HTTP 429).");
  }
  if (response.status === 403) throw new Error("Paris bloqueó la consulta automática (HTTP 403).");
  if (!response.ok) throw new Error(`Paris respondió HTTP ${response.status}.`);
  return { html: await response.text(), finalUrl: response.url };
}

function parsePrice(value) {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value === "number" && Number.isFinite(value)) return Math.round(value);
  const digits = String(value).replace(/[^\d]/g, "");
  return digits ? Number(digits) : null;
}

function extractPresentation(name) {
  const match = String(name || "").match(/\b\d+(?:[,.]\d+)?\s*(?:ml|mL|g|kg|oz|unidades?|u)\b/i);
  return match ? match[0] : null;
}

function extractJsonLd(html) {
  const documents = [];
  const addDocument = (value) => {
    try {
      const parsed = JSON.parse(value);
      documents.push(...(Array.isArray(parsed) ? parsed : [parsed]));
    } catch {
      // Paris incluye otros scripts que no siempre contienen JSON válido.
    }
  };

  for (const match of String(html || "").matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    addDocument(match[1].trim());
  }
  for (const match of String(html || "").matchAll(/"type":"application\/ld\+json","children":"((?:\\.|[^"\\])*)"/g)) {
    try {
      addDocument(JSON.parse(`"${match[1]}"`));
    } catch {
      // Se ignora un payload RSC incompleto.
    }
  }
  return documents;
}

function itemListsFromJsonLd(documents) {
  const lists = [];
  const visit = (value) => {
    if (!value || typeof value !== "object") return;
    if (value["@type"] === "ItemList" && Array.isArray(value.itemListElement)) lists.push(value);
    if (value.mainEntity) visit(value.mainEntity);
    if (Array.isArray(value["@graph"])) value["@graph"].forEach(visit);
  };
  documents.forEach(visit);
  return lists;
}

function productsFromJsonLd(documents) {
  const products = [];
  const visit = (value) => {
    if (!value || typeof value !== "object") return;
    const types = Array.isArray(value["@type"]) ? value["@type"] : [value["@type"]];
    if (types.includes("Product")) products.push(value);
    if (value.mainEntity) visit(value.mainEntity);
    if (Array.isArray(value["@graph"])) value["@graph"].forEach(visit);
  };
  documents.forEach(visit);
  return products;
}

function hasPerfumeBreadcrumb(documents) {
  const breadcrumbs = [];
  const visit = (value) => {
    if (!value || typeof value !== "object") return;
    if (value["@type"] === "BreadcrumbList") {
      for (const item of value.itemListElement || []) breadcrumbs.push(String(item?.name || "").toLowerCase());
    }
    if (Array.isArray(value["@graph"])) value["@graph"].forEach(visit);
  };
  documents.forEach(visit);
  return breadcrumbs.some((name) => /perfumes?|perfumer[ií]a/.test(name));
}

function offersSoldByParis(product) {
  const offers = Array.isArray(product?.offers) ? product.offers : [product?.offers];
  return offers.filter((offer) => {
    const seller = String(offer?.seller?.name || offer?.seller || "")
      .trim()
      .toUpperCase()
      .replace(/\s+/g, " ");
    return seller === "PARIS" || seller === "PARIS.CL";
  });
}

function normalizeProduct(product, baseUrl) {
  const sku = String(product?.sku || product?.productID || "").trim();
  const name = String(product?.name || "").trim();
  const offers = (Array.isArray(product?.offers) ? product.offers : [product?.offers])
    .filter(Boolean);
  // Paris publica el precio normal, el de internet y a veces uno promocional.
  // Se conserva la oferta disponible más conveniente, igual que el comparador.
  const offer = offers
    .filter((candidate) => parsePrice(candidate?.price) !== null)
    .sort((first, second) => parsePrice(first.price) - parsePrice(second.price))[0] || offers[0] || {};
  const url = new URL(offer.url || product?.url || "", baseUrl);
  const brand = typeof product?.brand === "string" ? product.brand : product?.brand?.name || null;
  const availability = String(offer.availability || "");

  if (!sku || !name || !url.pathname.endsWith(".html")) {
    throw new Error("El producto de Paris no contiene SKU, nombre o URL pública.");
  }
  assertParisUrl(url.toString());
  return {
    source: "paris-cl",
    sku,
    brand: String(brand || "").trim() || null,
    name,
    price: parsePrice(offer.price),
    currency: String(offer.priceCurrency || "CLP").trim() || "CLP",
    presentation: extractPresentation(name),
    imageUrl: Array.isArray(product.image) ? product.image[0] || null : product.image || null,
    available: !availability || /InStock$/i.test(availability),
    url: url.toString(),
    raw: {
      collectionCard: true,
      availability: availability || null,
      rating: product.aggregateRating?.ratingValue ?? null,
      reviewCount: product.aggregateRating?.reviewCount ?? null,
    },
  };
}

function extractCatalogProducts(html, baseUrl) {
  const products = new Map();
  for (const list of itemListsFromJsonLd(extractJsonLd(html))) {
    for (const entry of list.itemListElement || []) {
      try {
        const product = normalizeProduct(entry?.item || entry, baseUrl);
        products.set(product.sku, product);
      } catch {
        // Un elemento malformado no debe cancelar el catálogo completo.
      }
    }
  }
  return [...products.values()];
}

function extractTotalProducts(html) {
  const match = String(html || "").match(/productsCount-loading[^>]*>\s*([\d.\s]+)(?:<!--[\s\S]*?-->)?\s*<\/span>\s*productos encontrados/i);
  if (!match) return null;
  const total = Number(match[1].replace(/[^\d]/g, ""));
  return Number.isFinite(total) && total > 0 ? total : null;
}

function findXmlLocs(xml) {
  return [...String(xml || "").matchAll(/<loc>([^<]+)<\/loc>/gi)].map((match) => match[1].trim());
}

function isParisPerfumeProductUrl(value) {
  try {
    const url = new URL(value);
    if (!/(^|\.)paris\.cl$/i.test(url.hostname) || !/\.html$/i.test(url.pathname)) return false;
    const pathname = decodeURIComponent(url.pathname).toLowerCase();
    return /(?:^|[-/])(?:perfume|parfum|fragrance|colonia|cologne|edp|edt|extrait|body-splash)(?:[-/]|$)/i.test(pathname);
  } catch {
    return false;
  }
}

async function discoverPerfumeUrlsFromSitemap() {
  const { html: indexXml } = await fetchPage("https://www.paris.cl/sitemap_index.xml");
  const sitemapUrls = findXmlLocs(indexXml)
    .filter((url) => /\/sitemap_products_es_cl_\d+\.xml$/i.test(url));
  if (!sitemapUrls.length) throw new Error("El sitemap de Paris no contiene archivos de productos.");

  const productUrls = new Set();
  for (const sitemapUrl of sitemapUrls) {
    const { html: sitemapXml } = await fetchPage(sitemapUrl);
    for (const productUrl of findXmlLocs(sitemapXml)) {
      if (isParisPerfumeProductUrl(productUrl)) productUrls.add(assertParisUrl(productUrl));
    }
  }
  if (!productUrls.size) throw new Error("No se encontraron fichas de perfume en el sitemap de Paris.");
  return [...productUrls];
}

async function scrapeProduct(productUrl) {
  const { html, finalUrl } = await fetchPage(productUrl);
  const documents = extractJsonLd(html);
  if (!hasPerfumeBreadcrumb(documents)) return null;
  const products = productsFromJsonLd(documents);
  const product = products.find((candidate) => candidate.sku && candidate.name && candidate.offers);
  if (!product) throw new Error("Paris no expuso datos estructurados en la ficha de producto.");
  const parisOffers = offersSoldByParis(product);
  if (!parisOffers.length) return null;
  return normalizeProduct({ ...product, offers: parisOffers }, finalUrl);
}

async function scrapeProductBatch(productUrls) {
  const settled = await Promise.allSettled(productUrls.map((url) => scrapeProduct(url)));
  return settled.flatMap((result) => result.status === "fulfilled" && result.value ? [result.value] : []);
}

async function scrapeDirectCatalogPage(page = 1) {
  const pageUrl = buildParisCatalogPageUrl(page);
  const { html, finalUrl } = await fetchPage(pageUrl);
  const products = extractCatalogProducts(html, finalUrl);
  const directTotal = extractTotalProducts(html);
  if (!products.length && page === 1) {
    throw new Error("Paris no expuso productos estructurados en el catálogo de perfumes.");
  }
  return {
    products,
    page,
    totalPages: Math.max(1, Math.ceil((directTotal || products.length) / PAGE_SIZE)),
    scanned: products.length,
    directTotal: directTotal || products.length,
  };
}

async function scrapePerfumeCatalog(maxProducts = 12) {
  const { products } = await scrapeDirectCatalogPage(1);
  return products.slice(0, Math.max(1, Number(maxProducts) || 12)).map((product) => ({
    url: product.url,
    ok: true,
    product,
  }));
}

module.exports = {
  PAGE_SIZE,
  assertParisUrl,
  buildParisCatalogPageUrl,
  parsePrice,
  extractPresentation,
  extractJsonLd,
  extractCatalogProducts,
  extractTotalProducts,
  findXmlLocs,
  isParisPerfumeProductUrl,
  hasPerfumeBreadcrumb,
  offersSoldByParis,
  discoverPerfumeUrlsFromSitemap,
  scrapeProduct,
  scrapeProductBatch,
  normalizeProduct,
  scrapeDirectCatalogPage,
  scrapePerfumeCatalog,
};
