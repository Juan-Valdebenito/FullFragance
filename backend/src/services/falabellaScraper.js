const fs = require("fs/promises");
const path = require("path");
const {
  falabellaUserAgent,
  falabellaMinDelayMs,
  falabellaMaxDelayMs,
  falabellaRequestTimeoutMs,
  falabellaFixtureDir,
  falabellaPerfumesUrl,
  falabellaPdpSitemapIndexUrl,
  falabellaSitemapFilesToScan,
  scraperMockPrices,
} = require("../config/env");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let lastRequestAt = 0;

function waitForRateLimit() {
  const min = Math.max(0, falabellaMinDelayMs);
  const max = Math.max(min, falabellaMaxDelayMs);
  const delay = min + Math.floor(Math.random() * (max - min + 1));
  const wait = Math.max(0, lastRequestAt + delay - Date.now());
  return sleep(wait);
}

function assertFalabellaUrl(value) {
  const url = new URL(value);
  if (url.protocol !== "https:" || !/(^|\.)falabella\.com$/i.test(url.hostname)) {
    throw new Error("La URL debe pertenecer a https://www.falabella.com.");
  }
  return url.toString();
}

async function fetchPage(url) {
  if (falabellaFixtureDir) {
    const productId = new URL(url).pathname.match(/\/product\/(\d+)/)?.[1];
    const fixturePath = path.resolve(falabellaFixtureDir, productId ? `${productId}.html` : "catalog.html");
    return { html: await fs.readFile(fixturePath, "utf8"), finalUrl: url };
  }

  await waitForRateLimit();
  lastRequestAt = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), falabellaRequestTimeoutMs);
  let response;
  try {
    response = await fetch(url, {
      headers: {
        "User-Agent": falabellaUserAgent,
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "es-CL,es;q=0.9",
        Referer: "https://www.falabella.com/",
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
      return fetchPage(url);
    }
    throw new Error("Falabella limitó temporalmente las solicitudes (HTTP 429).");
  }
  if (response.status === 403) {
    throw new Error("Falabella bloqueó la consulta automática (HTTP 403 / Cloudflare).");
  }
  if (!response.ok) throw new Error(`Falabella respondió HTTP ${response.status}.`);
  return { html: await response.text(), finalUrl: response.url };
}

function findProductUrls(html, baseUrl, limit) {
  const urls = new Set();
  const decodeSafely = (value) => {
    let decoded = String(value || "");
    for (let i = 0; i < 2; i += 1) {
      try {
        const candidate = decodeURIComponent(decoded);
        if (candidate === decoded) break;
        decoded = candidate;
      } catch {
        break;
      }
    }
    return decoded;
  };

  const normalizeCandidate = (value) => decodeSafely(
    String(value || "")
      .replace(/\\u002F/gi, "/")
      .replace(/\\\//g, "/")
      .replace(/&amp;/g, "&")
  );

  const addUrl = (candidate) => {
    const href = normalizeCandidate(candidate);
    if (!/\/product\/\d+/i.test(href) || urls.size >= limit) return;
    try {
      const url = new URL(href, baseUrl);
      if (!/(^|\.)falabella\.com$/i.test(url.hostname)) return;
      url.search = "";
      url.hash = "";
      urls.add(url.toString());
    } catch {
      // Se ignora un enlace malformado y se continúa con el siguiente.
    }
  };

  // SSR tradicional y los resultados actuales de Falabella (incluidos en __NEXT_DATA__).
  for (const match of html.matchAll(/href=["']([^"']+)["']/gi)) addUrl(match[1]);
  for (const match of html.matchAll(/https?:\\?\/\\?\/[^"'<>\s]+?\\?\/product\\?\/\d+[^"'<>\s]*/gi)) {
    addUrl(match[0]);
  }
  const normalizedHtml = normalizeCandidate(html);
  for (const match of normalizedHtml.matchAll(/(?:https?:\/\/[^\s"'<>]*|\/[^\s"'<>]*)\/product\/\d+[^\s"'<>]*/gi)) {
    addUrl(match[0]);
  }
  return [...urls];
}

function findXmlLocs(xml) {
  return [...String(xml || "").matchAll(/<loc>([^<]+)<\/loc>/gi)].map((match) => match[1].trim());
}

function isPerfumeProductUrl(url) {
  const pathname = decodeURIComponent(new URL(url).pathname).toLowerCase();
  if (!/\/product\/\d+\//.test(pathname)) return false;
  return /(?:^|[-/])(perfume|parfum|fragancia|colonia|eau|edp|edt|extrait|body-splash)(?:[-/]|$)/i.test(pathname);
}

async function discoverPerfumeUrlsFromSitemaps(limit) {
  const sitemapIndexUrl = assertFalabellaUrl(falabellaPdpSitemapIndexUrl);
  const { html: indexXml } = await fetchPage(sitemapIndexUrl);
  const sitemapUrls = findXmlLocs(indexXml);
  if (!sitemapUrls.length) {
    throw new Error("El sitemap de productos de Falabella no contiene archivos para recorrer.");
  }

  const maxSitemaps = Math.max(1, Math.min(Number(falabellaSitemapFilesToScan) || 8, sitemapUrls.length));
  const collectedUrls = new Set();
  for (const sitemapUrl of sitemapUrls.slice(0, maxSitemaps)) {
    const safeSitemapUrl = assertFalabellaUrl(sitemapUrl);
    const { html: sitemapXml } = await fetchPage(safeSitemapUrl);
    for (const productUrl of findXmlLocs(sitemapXml)) {
      if (collectedUrls.size >= limit) break;
      if (!isPerfumeProductUrl(productUrl)) continue;
      const safeUrl = assertFalabellaUrl(productUrl);
      collectedUrls.add(safeUrl);
    }
    if (collectedUrls.size >= limit) break;
  }

  return [...collectedUrls];
}

function findProductJsonLd(html) {
  const scripts = html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  for (const match of scripts) {
    try {
      const value = JSON.parse(match[1].trim());
      const candidates = Array.isArray(value) ? value : value["@graph"] || [value];
      const product = candidates.find((item) => item && (item["@type"] === "Product" || item["@type"]?.includes?.("Product")));
      if (product) return product;
    } catch {
      // Algunas etiquetas no contienen JSON válido; se prueba la siguiente.
    }
  }
  return null;
}

function extractPresentation(name, description) {
  const match = `${name || ""} ${description || ""}`.match(/\b\d+(?:[,.]\d+)?\s*(?:ml|mL|g|kg|oz|unidades?|u)\b/i);
  return match ? match[0] : null;
}

function titleCase(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/(^|\s)([a-záéíóúñ])/g, (_match, space, letter) => `${space}${letter.toUpperCase()}`);
}

function cleanProductSlug(slug) {
  return titleCase(
    decodeURIComponent(String(slug || ""))
      .replace(/[-_]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  );
}

function inferBrandFromName(name) {
  const tokens = String(name || "").split(" ").filter(Boolean);
  if (!tokens.length) return null;
  const ignore = new Set(["Perfume", "Mujer", "Hombre", "Unisex", "Edp", "Edt", "Parfum", "Ml", "De"]);
  for (let i = tokens.length - 1; i >= 0; i -= 1) {
    if (!ignore.has(tokens[i]) && !/^\d+$/.test(tokens[i])) return tokens[i];
  }
  return null;
}

function demoPriceForSku(sku) {
  const seed = String(sku || "")
    .split("")
    .reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return 29990 + (seed % 18) * 5000;
}

function productFromUrl(productUrl, reason = "Detalle bloqueado por Falabella.") {
  const url = new URL(assertFalabellaUrl(productUrl));
  const parts = url.pathname.split("/").filter(Boolean);
  const productIndex = parts.findIndex((part) => part === "product");
  const sku = parts[productIndex + 1];
  const slug = parts[productIndex + 2] || `Producto Falabella ${sku}`;
  if (!sku || !/^\d+$/.test(sku)) {
    throw new Error("No se pudo inferir el SKU desde la URL de Falabella.");
  }

  const name = cleanProductSlug(slug);
  return {
    source: "falabella-cl",
    sku,
    brand: inferBrandFromName(name),
    name,
    price: scraperMockPrices ? demoPriceForSku(sku) : null,
    currency: "CLP",
    presentation: extractPresentation(name, ""),
    imageUrl: buildFalabellaImageUrl(sku),
    available: Boolean(scraperMockPrices),
    url: url.toString(),
    raw: { fallback: true, mockPrice: Boolean(scraperMockPrices), reason },
  };
}

function isCloudflareBlockError(error) {
  return /HTTP 403|Cloudflare/i.test(error?.message || "");
}

function buildFalabellaImageUrl(sku) {
  const value = String(sku || "").trim();
  return value ? `https://media.falabella.com/falabellaCL/${value}_1/public` : null;
}

function parseClPrice(value) {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value === "number" && Number.isFinite(value)) return Math.round(value);
  const digits = String(value).replace(/[^\d]/g, "");
  return digits ? Number(digits) : null;
}

function extractPriceFromCard(prices) {
  if (!Array.isArray(prices) || !prices.length) return null;
  const priority = ["internetPrice", "eventPrice", "cmrPrice", "salePrice"];
  for (const type of priority) {
    const entry = prices.find((item) => item?.type === type && !item.crossed);
    const parsed = parseClPrice(entry?.price?.[0]);
    if (parsed) return parsed;
  }
  const uncrossed = prices
    .filter((item) => !item?.crossed)
    .map((item) => parseClPrice(item?.price?.[0]))
    .filter(Boolean);
  if (uncrossed.length) return Math.min(...uncrossed);
  const anyPrice = prices.map((item) => parseClPrice(item?.price?.[0])).filter(Boolean);
  return anyPrice.length ? Math.min(...anyPrice) : null;
}

function extractImageFromCard(card) {
  if (Array.isArray(card?.mediaUrls) && card.mediaUrls[0]) return card.mediaUrls[0];
  return buildFalabellaImageUrl(card?.productId || card?.skuId || card?.sku);
}

function inferAvailabilityFromCard(availability) {
  if (!availability || typeof availability !== "object") return true;
  const values = Object.values(availability).map((value) => String(value || "").toLowerCase());
  if (values.some((value) => /outofstock|agotado|sin stock/.test(value))) return false;
  return true;
}

function findNextData(html) {
  const match = html.match(/<script id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i);
  if (!match) return null;
  try {
    return JSON.parse(match[1].trim());
  } catch {
    return null;
  }
}

function extractPageResults(html) {
  const results = findNextData(html)?.props?.pageProps?.results;
  return Array.isArray(results) ? results : [];
}

function collectProductCards(node, hits = [], seen = new Set()) {
  if (!node || hits.length >= 200) return hits;
  if (Array.isArray(node)) {
    for (const item of node) collectProductCards(item, hits, seen);
    return hits;
  }
  if (typeof node === "object") {
    const sku = String(node.productId || node.skuId || node.sku || "").trim();
    const name = node.displayName || node.name || node.productName;
    const hasPrices = Array.isArray(node.prices) && node.prices.length;
    const hasMedia = Array.isArray(node.mediaUrls) && node.mediaUrls.length;
    if (sku && /^\d+$/.test(sku) && name && (hasPrices || hasMedia) && !seen.has(sku)) {
      seen.add(sku);
      hits.push(node);
    }
    for (const value of Object.values(node)) collectProductCards(value, hits, seen);
  }
  return hits;
}

function extractCollectionProductCards(html) {
  const nextData = findNextData(html);
  if (!nextData) return [];
  return collectProductCards(nextData);
}

function normalizeCollectionProduct(card) {
  const sku = String(card.productId || card.skuId || card.sku || "").trim();
  const url = card.url || `https://www.falabella.com/falabella-cl/product/${sku}`;
  const name = String(card.displayName || card.name || card.productName || "").trim();
  return {
    source: "falabella-cl",
    sku,
    brand: card.brand || inferBrandFromName(name),
    name,
    price: extractPriceFromCard(card.prices),
    currency: "CLP",
    presentation: extractPresentation(name, ""),
    imageUrl: extractImageFromCard(card),
    available: inferAvailabilityFromCard(card.availability),
    url,
    raw: {
      collectionCard: true,
      prices: card.prices || [],
      sellerId: card.sellerId || null,
      sellerName: card.sellerName || null,
    },
  };
}

function extractImageFromHtml(html, sku) {
  const ogMatch =
    html.match(/property=["']og:image["'][^>]+content=["']([^"']+)/i) ||
    html.match(/content=["']([^"']+)["'][^>]+property=["']og:image/i);
  if (ogMatch?.[1]) return ogMatch[1];

  for (const card of extractCollectionProductCards(html)) {
    const cardSku = String(card.productId || card.skuId || card.sku || "").trim();
    if (!sku || cardSku === String(sku)) {
      const imageUrl = extractImageFromCard(card);
      if (imageUrl) return imageUrl;
    }
  }
  return buildFalabellaImageUrl(sku);
}

function extractPriceFromHtml(html, sku) {
  for (const card of extractCollectionProductCards(html)) {
    const cardSku = String(card.productId || card.skuId || card.sku || "").trim();
    if (!sku || cardSku === String(sku)) {
      const price = extractPriceFromCard(card.prices);
      if (price) return price;
    }
  }
  return null;
}

function extractImage(image, pageUrl, sku) {
  const candidate = Array.isArray(image) ? image[0] : image;
  if (typeof candidate === "string") {
    try {
      return new URL(candidate, pageUrl).toString();
    } catch {
      return candidate;
    }
  }
  if (candidate && typeof candidate === "object") {
    const value = candidate.url || candidate.contentUrl;
    if (!value) return buildFalabellaImageUrl(sku);
    try {
      return new URL(value, pageUrl).toString();
    } catch {
      return value;
    }
  }
  return buildFalabellaImageUrl(sku);
}

function normalizeProduct(jsonLd, url, html = "") {
  const offer = Array.isArray(jsonLd.offers) ? jsonLd.offers[0] : jsonLd.offers || {};
  const sku = String(jsonLd.sku || jsonLd.mpn || jsonLd.productID || "").trim();
  if (!sku) throw new Error("La página no expone un SKU público en sus datos estructurados.");
  const availability = String(offer.availability || "").toLowerCase();
  const jsonLdPrice = offer.price === undefined ? null : Math.round(Number(offer.price));
  const htmlPrice = extractPriceFromHtml(html, sku);
  return {
    source: "falabella-cl",
    sku,
    brand: typeof jsonLd.brand === "object" ? jsonLd.brand.name : jsonLd.brand || null,
    name: jsonLd.name?.trim(),
    price: htmlPrice ?? jsonLdPrice,
    currency: offer.priceCurrency || "CLP",
    presentation: extractPresentation(jsonLd.name, jsonLd.description),
    imageUrl: extractImage(jsonLd.image, url, sku) || extractImageFromHtml(html, sku),
    available: /instock|in stock|limitedavailability/.test(availability),
    url,
    raw: jsonLd,
  };
}

async function scrapeProductsFromCollection(limit) {
  const catalogUrl = assertFalabellaUrl(falabellaPerfumesUrl);
  const { html } = await fetchPage(catalogUrl);
  return extractCollectionProductCards(html)
    .filter((card) => {
      const productUrl = card.url || `https://www.falabella.com/falabella-cl/product/${card.productId || card.skuId}`;
      return isPerfumeProductUrl(productUrl);
    })
    .slice(0, limit)
    .map((card) => normalizeCollectionProduct(card));
}

async function scrapeDirectCatalogPage(page = 1) {
  const url = new URL(assertFalabellaUrl(falabellaPerfumesUrl));
  if (page > 1) url.searchParams.set("page", String(page));
  const { html } = await fetchPage(url.toString());
  const nextData = findNextData(html);
  const pagination = nextData?.props?.pageProps?.pagination || {};
  const cards = extractPageResults(html);
  const products = cards
    .filter((card) => card.sellerId === "FALABELLA_CHILE" || String(card.sellerName).toUpperCase() === "FALABELLA")
    .map((card) => normalizeCollectionProduct(card));
  const totalPages = Math.max(1, Math.ceil(Number(pagination.count || cards.length) / Number(pagination.perPage || 48)));
  return { products, page, totalPages, scanned: cards.length };
}

async function findProductInCollection(sku) {
  const cards = await scrapeProductsFromCollection(120);
  return cards.find((product) => product.sku === String(sku)) || null;
}

async function scrapeProduct(productUrl) {
  const safeUrl = assertFalabellaUrl(productUrl);
  const { html, finalUrl } = await fetchPage(safeUrl);
  const jsonLd = findProductJsonLd(html);
  if (jsonLd) return normalizeProduct(jsonLd, finalUrl, html);

  const cards = extractCollectionProductCards(html);
  const sku = new URL(finalUrl).pathname.match(/\/product\/(\d+)/)?.[1];
  const card = cards.find((item) => String(item.productId || item.skuId || item.sku) === String(sku));
  if (card) return normalizeCollectionProduct({ ...card, url: finalUrl });

  throw new Error("No se encontró el bloque Product JSON-LD en la página.");
}

async function scrapeProductOrFallback(productUrl) {
  try {
    return { product: await scrapeProduct(productUrl), warning: null };
  } catch (error) {
    if (!isCloudflareBlockError(error)) throw error;
    try {
      const sku = new URL(assertFalabellaUrl(productUrl)).pathname.match(/\/product\/(\d+)/)?.[1];
      const fromCollection = sku ? await findProductInCollection(sku) : null;
      if (fromCollection) {
        return {
          product: { ...fromCollection, url: assertFalabellaUrl(productUrl) },
          warning: "Detalle bloqueado; precio e imagen tomados del listado de Falabella.",
        };
      }
    } catch {
      // Si el listado también falla, se usa el fallback parcial desde la URL.
    }
    return {
      product: productFromUrl(productUrl, error.message),
      warning: "Falabella bloqueó el detalle; se guardó un producto parcial desde la URL.",
    };
  }
}

async function scrapePerfumeCatalog(maxProducts = 12) {
  const limit = Math.min(Math.max(Number(maxProducts) || 12, 1), 24);

  try {
    const collectionProducts = await scrapeProductsFromCollection(limit);
    if (collectionProducts.length) {
      return collectionProducts.map((product) => ({ url: product.url, ok: true, product }));
    }
  } catch {
    // Si el listado no responde, se intenta el flujo anterior por URL individual.
  }

  const catalogUrl = assertFalabellaUrl(falabellaPerfumesUrl);
  let productUrls = [];
  let collectionError = null;

  try {
    const { html, finalUrl } = await fetchPage(catalogUrl);
    productUrls = findProductUrls(html, finalUrl, limit);
  } catch (error) {
    collectionError = error;
  }

  if (!productUrls.length) {
    productUrls = await discoverPerfumeUrlsFromSitemaps(limit);
  }

  if (!productUrls.length) {
    const reason = collectionError ? ` Último error al consultar la colección: ${collectionError.message}` : "";
    throw new Error(`No se encontraron URLs de perfumes en Falabella.${reason}`);
  }
  const results = [];
  for (const url of productUrls) {
    try {
      const { product, warning } = await scrapeProductOrFallback(url);
      results.push({ url, ok: true, product, ...(warning ? { warning } : {}) });
    } catch (error) {
      results.push({ url, ok: false, error: error.message });
    }
  }
  return results;
}

module.exports = {
  scrapeProduct,
  scrapeProductOrFallback,
  scrapePerfumeCatalog,
  scrapeProductsFromCollection,
  findProductUrls,
  normalizeProduct,
  normalizeCollectionProduct,
  extractPriceFromCard,
  productFromUrl,
  isPerfumeProductUrl,
  buildFalabellaImageUrl,
  scrapeDirectCatalogPage,
};
