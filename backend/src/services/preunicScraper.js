const fs = require("fs/promises");
const path = require("path");
const {
  preunicUserAgent,
  preunicMinDelayMs,
  preunicMaxDelayMs,
  preunicRequestTimeoutMs,
  preunicFixtureDir,
  preunicPerfumesUrl,
  preunicCatalogApiUrl,
} = require("../config/env");

// El sitio de Preunic carga esta colección desde su API pública de búsqueda.
// Se consulta sólo la categoría entregada por el usuario y a 24 ítems por
// página, que es el tamaño de página que utiliza su propio listado.
const PAGE_SIZE = 24;
const PERFUME_CATEGORY_FILTER = "filterCategory:perfumes-y-fragancias";
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let lastRequestAt = 0;

function assertPreunicCollectionUrl(value) {
  const url = new URL(value);
  if (url.protocol !== "https:" || !/(^|\.)preunic\.cl$/i.test(url.hostname)) {
    throw new Error("La URL debe pertenecer a https://preunic.cl.");
  }
  if (url.pathname !== "/t/perfumes-y-fragancias" || url.search || url.hash) {
    throw new Error("El scraper de Preunic sólo usa /t/perfumes-y-fragancias.");
  }
  return url.toString();
}

function buildPreunicCatalogPageUrl(page = 1) {
  if (!Number.isInteger(page) || page < 1) throw new Error("La página de Preunic debe ser un entero positivo.");
  assertPreunicCollectionUrl(preunicPerfumesUrl);

  const url = new URL(preunicCatalogApiUrl);
  if (url.protocol !== "https:" || url.hostname !== "api.empathy.co" || url.pathname !== "/search/v1/query/preunic/browse") {
    throw new Error("La API de catálogo de Preunic no es válida.");
  }
  url.searchParams.set("browseField", "state");
  url.searchParams.set("browseValue", "active");
  url.searchParams.set("lang", "es");
  url.searchParams.set("rows", String(PAGE_SIZE));
  url.searchParams.set("start", String((page - 1) * PAGE_SIZE));
  url.searchParams.set("facets", "true");
  url.searchParams.set("scope", "desktop");
  url.searchParams.append("filter", PERFUME_CATEGORY_FILTER);
  return url.toString();
}

async function waitForRateLimit() {
  const min = Math.max(0, preunicMinDelayMs);
  const max = Math.max(min, preunicMaxDelayMs);
  const delay = min + Math.floor(Math.random() * (max - min + 1));
  await sleep(Math.max(0, lastRequestAt + delay - Date.now()));
}

async function fetchCatalogPage(url, page) {
  if (preunicFixtureDir) {
    return JSON.parse(await fs.readFile(path.resolve(preunicFixtureDir, `page-${page}.json`), "utf8"));
  }

  await waitForRateLimit();
  lastRequestAt = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), preunicRequestTimeoutMs);
  let response;
  try {
    response = await fetch(url, {
      headers: {
        "User-Agent": preunicUserAgent,
        Accept: "application/json",
        "Accept-Language": "es-CL,es;q=0.9",
        Referer: assertPreunicCollectionUrl(preunicPerfumesUrl),
      },
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }

  if (response.status === 429) throw new Error("Preunic limitó temporalmente las solicitudes (HTTP 429).");
  if (response.status === 403) throw new Error("Preunic bloqueó la consulta automática (HTTP 403).");
  if (!response.ok) throw new Error(`Preunic respondió HTTP ${response.status}.`);
  return response.json();
}

function parsePrice(value) {
  if (typeof value === "number" && Number.isFinite(value)) return Math.round(value);
  const digits = String(value || "").replace(/[^\d]/g, "");
  return digits ? Number(digits) : null;
}

function extractPresentation(name) {
  const match = String(name || "").match(/\b\d+(?:[,.]\d+)?\s*(?:ml|mL|g|kg|oz|unidades?|u)\b/i);
  return match ? match[0] : null;
}

function safeImageUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function isPerfumeProduct(item) {
  return (item?.categories || []).some((category) => /perfumes?\s+y\s+fragancias?/i.test(String(category)));
}

function normalizeProduct(item) {
  const sku = String(item?.sku || item?.id || "").trim();
  const name = String(item?.name || "").trim();
  const slug = String(item?.slug || "").trim();
  if (!sku || !name || !slug || !/^[a-z0-9-]+$/i.test(slug) || !isPerfumeProduct(item)) {
    throw new Error("El producto de Preunic no es un perfume válido del catálogo.");
  }
  const price = parsePrice(item.offerPrice ?? item.price ?? item.cardPrice);
  return {
    source: "preunic-cl",
    sku,
    brand: String(item.brand || "").trim() || null,
    name,
    price,
    currency: "CLP",
    presentation: extractPresentation(name),
    imageUrl: safeImageUrl(item.image),
    available: item.state === "active" && price !== null,
    url: `https://preunic.cl/products/${slug}`,
    raw: {
      collectionCard: true,
      categories: item.categories || [],
      regularPrice: parsePrice(item.cardPrice),
      offerPrice: parsePrice(item.offerPrice),
      storeExclusive: Boolean(item.storeExclusive),
    },
  };
}

function extractCatalogProducts(payload) {
  const products = new Map();
  for (const item of payload?.catalog?.content || []) {
    try {
      const product = normalizeProduct(item);
      products.set(product.sku, product);
    } catch {
      // Una tarjeta incompleta no debe interrumpir el resto de la colección.
    }
  }
  return [...products.values()];
}

function extractTotalProducts(payload) {
  const total = Number(payload?.catalog?.pagination?.total ?? payload?.catalog?.numFound);
  return Number.isFinite(total) && total > 0 ? total : null;
}

async function scrapeDirectCatalogPage(page = 1) {
  const payload = await fetchCatalogPage(buildPreunicCatalogPageUrl(page), page);
  const total = extractTotalProducts(payload);
  if (!total) throw new Error("Preunic no informó el total de perfumes del catálogo.");
  const products = extractCatalogProducts(payload);
  return {
    products,
    page,
    totalPages: Math.ceil(total / PAGE_SIZE),
    scanned: payload?.catalog?.content?.length || 0,
    directTotal: total,
  };
}

async function scrapePerfumeCatalog(maxProducts = 24) {
  const limit = Math.min(Math.max(Number(maxProducts) || 24, 1), 250);
  const products = [];
  let page = 1;
  let totalPages = 1;
  while (page <= totalPages && products.length < limit) {
    const result = await scrapeDirectCatalogPage(page);
    totalPages = result.totalPages;
    products.push(...result.products);
    page += 1;
  }
  return products.slice(0, limit).map((product) => ({ url: product.url, ok: true, product }));
}

module.exports = {
  PAGE_SIZE,
  PERFUME_CATEGORY_FILTER,
  assertPreunicCollectionUrl,
  buildPreunicCatalogPageUrl,
  parsePrice,
  extractPresentation,
  isPerfumeProduct,
  normalizeProduct,
  extractCatalogProducts,
  extractTotalProducts,
  scrapeDirectCatalogPage,
  scrapePerfumeCatalog,
};
