const fs = require("fs/promises");
const path = require("path");
const {
  abcUserAgent,
  abcMinDelayMs,
  abcMaxDelayMs,
  abcRequestTimeoutMs,
  abcFixtureDir,
  abcPerfumesUrl,
  abcSitemapIndexUrl,
  abcSitemapCacheTtlMs,
} = require("../config/env");

// ABC prohíbe expresamente las URLs con ?page= y las fichas con ?pid=.
// Para cubrir el catálogo completo se usa su sitemap permitido y sólo se leen
// fichas públicas con URL limpia, nunca endpoints de Demandware.
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let lastRequestAt = 0;
let sitemapCache = { urls: null, expiresAt: 0 };
const SITEMAP_PAGE_SIZE = 12;

function assertAbcUrl(value) {
  const url = new URL(value);
  if (url.protocol !== "https:" || !/(^|\.)abc\.cl$/i.test(url.hostname)) {
    throw new Error("La URL debe pertenecer a https://www.abc.cl.");
  }
  if (url.search || url.hash) {
    throw new Error("El scraper de ABC no usa URLs con parámetros ni fragmentos, según robots.txt.");
  }
  if (/^\/(?:Cuenta|Checkout|Bolsa|bolsat|Busqueda|on\/demandware\.store)(?:\/|$)/i.test(url.pathname)) {
    throw new Error("La URL está excluida por robots.txt de ABC.");
  }
  return url.toString();
}

function buildAbcCatalogUrl() {
  const url = new URL(assertAbcUrl(abcPerfumesUrl));
  if (!/^\/belleza\/perfumes\/?$/i.test(url.pathname)) {
    throw new Error("El catálogo de ABC debe usar exclusivamente /belleza/perfumes/.");
  }
  return url.toString();
}

function buildAbcSitemapIndexUrl() {
  const url = new URL(assertAbcUrl(abcSitemapIndexUrl));
  if (url.pathname !== "/sitemap_index.xml") {
    throw new Error("El sitemap de ABC debe usar exclusivamente /sitemap_index.xml.");
  }
  return url.toString();
}

async function waitForRateLimit() {
  const min = Math.max(0, abcMinDelayMs);
  const max = Math.max(min, abcMaxDelayMs);
  const delay = min + Math.floor(Math.random() * (max - min + 1));
  await sleep(Math.max(0, lastRequestAt + delay - Date.now()));
}

async function fetchPage(url) {
  const safeUrl = assertAbcUrl(url);
  if (abcFixtureDir) {
    return {
      html: await fs.readFile(path.resolve(abcFixtureDir, "catalog.html"), "utf8"),
      finalUrl: safeUrl,
    };
  }

  await waitForRateLimit();
  lastRequestAt = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), abcRequestTimeoutMs);
  let response;
  try {
    response = await fetch(safeUrl, {
      headers: {
        "User-Agent": abcUserAgent,
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "es-CL,es;q=0.9",
        Referer: "https://www.abc.cl/",
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
    throw new Error("ABC limitó temporalmente las solicitudes (HTTP 429).");
  }
  if (response.status === 403) throw new Error("ABC bloqueó la consulta automática (HTTP 403).");
  if (!response.ok) throw new Error(`ABC respondió HTTP ${response.status}.`);
  return { html: await response.text(), finalUrl: response.url };
}

function decodeHtml(value) {
  return String(value || "")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function stripHtml(value) {
  return decodeHtml(String(value || "").replace(/<[^>]*>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function parsePrice(value) {
  if (value === undefined || value === null || value === "") return null;
  const raw = String(value).replace(/[^\d.,-]/g, "");
  // data-value usa punto decimal (29990.0); el texto visible usa puntos de
  // miles ($29.990). Se conserva el primero y se elimina el segundo.
  const normalized = /[.,]\d{1,2}$/.test(raw)
    ? raw.replace(/,(?=\d{1,2}$)/, ".").replace(/(?<=\d)\.(?=\d{3}(?:[.,]|$))/g, "")
    : raw.replace(/[.,]/g, "");
  const amount = Number(normalized);
  return Number.isFinite(amount) ? Math.round(amount) : null;
}

function extractPresentation(name) {
  const match = String(name || "").match(/\b\d+(?:[,.]\d+)?\s*(?:ml|mL|g|kg|oz|unidades?|u)\b/i);
  return match ? match[0] : null;
}

function attribute(openingTag, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = openingTag.match(new RegExp(`\\b${escaped}=["']([^"']*)["']`, "i"));
  return match ? decodeHtml(match[1]) : null;
}

function extractTileStarts(html) {
  const starts = [];
  const pattern = /<div\b[^>]*\bclass=["'][^"']*\blp-product-tile\b[^"']*["'][^>]*>/gi;
  for (const match of String(html || "").matchAll(pattern)) {
    starts.push({ index: match.index, openingTag: match[0] });
  }
  return starts;
}

function analyticsProduct(openingTag, attributeName = "data-gtm-click") {
  const payload = attribute(openingTag, attributeName);
  if (!payload) return null;
  try {
    const ecommerce = JSON.parse(payload)?.ecommerce;
    return ecommerce?.click?.products?.[0] || ecommerce?.detail?.products?.[0] || null;
  } catch {
    return null;
  }
}

function productUrlFromTile(tileHtml, baseUrl) {
  const match = tileHtml.match(/href=["']([^"']*\/\d+\.html)["']/i);
  if (!match) return null;
  const url = new URL(decodeHtml(match[1]), baseUrl);
  // No se consulta esta URL; se conserva sólo como enlace público de salida.
  return assertAbcUrl(url.toString());
}

function imageUrlFromTile(tileHtml) {
  const match = tileHtml.match(/<img\b[^>]*\bsrc=["']([^"']+)["']/i);
  return match ? decodeHtml(match[1]) : null;
}

function priceFromTile(tileHtml, className) {
  const section = tileHtml.match(new RegExp(`<p\\b[^>]*\\bclass=["'][^"']*\\b${className}\\b[^"']*["'][^>]*>[\\s\\S]*?<\\/p>`, "i"));
  if (!section) return null;
  const dataValue = section[0].match(/<span\b[^>]*\bclass=["'][^"']*\bprice-value\b[^"']*["'][^>]*\bdata-value=["']([^"']+)["']/i);
  return dataValue ? parsePrice(dataValue[1]) : parsePrice(stripHtml(section[0]));
}

function normalizeTile(product, tileHtml, baseUrl) {
  const sku = String(product?.id || "").trim();
  const name = String(product?.name || "").trim();
  const url = productUrlFromTile(tileHtml, baseUrl);
  if (!sku || !name || !url) {
    throw new Error("Una tarjeta de ABC no contiene SKU, nombre o enlace público.");
  }
  const internetPrice = priceFromTile(tileHtml, "internet");
  const normalPrice = priceFromTile(tileHtml, "normal");
  const promotion = stripHtml(tileHtml.match(/<p\b[^>]*\bclass=["'][^"']*\bpromotion-badge\b[^"']*["'][^>]*>([\s\S]*?)<\/p>/i)?.[1]);
  return {
    source: "abc-cl",
    sku,
    brand: String(product.brand || "").trim() || null,
    name,
    price: internetPrice ?? parsePrice(product.price),
    currency: "CLP",
    presentation: extractPresentation(name),
    imageUrl: imageUrlFromTile(tileHtml),
    available: !/\b(?:agotado|sin\s+stock)\b/i.test(stripHtml(tileHtml)),
    url,
    raw: {
      collectionCard: true,
      normalPrice,
      promotion: promotion || null,
      category: product.category || null,
    },
  };
}

function extractCatalogProducts(html, baseUrl) {
  const products = new Map();
  const tiles = extractTileStarts(html);
  tiles.forEach((tile, index) => {
    const product = analyticsProduct(tile.openingTag);
    if (!product) return;
    const end = tiles[index + 1]?.index ?? String(html).length;
    try {
      const normalized = normalizeTile(product, String(html).slice(tile.index, end), baseUrl);
      products.set(normalized.sku, normalized);
    } catch {
      // Una tarjeta malformada no debe cancelar el catálogo permitido.
    }
  });
  return [...products.values()];
}

function extractTotalProducts(html) {
  const match = String(html || "").match(/\b([\d.]+)\s+Productos\b/i);
  const total = match ? Number(match[1].replace(/\D/g, "")) : null;
  return Number.isFinite(total) && total > 0 ? total : null;
}

function findXmlLocs(xml) {
  return [...String(xml || "").matchAll(/<loc>([^<]+)<\/loc>/gi)].map((match) => match[1].trim());
}

function isPerfumeProductUrl(value) {
  try {
    const url = new URL(value);
    if (url.search || url.hash) return false;
    if (!/^\/[^/]+\/\d+\.html$/i.test(url.pathname)) return false;
    const pathname = decodeURIComponent(url.pathname).toLowerCase();
    return /(?:^|[-/])(perfume|parfum|fragancia|colonia|eau)(?:[-/]|$)/i.test(pathname);
  } catch {
    return false;
  }
}

async function discoverPerfumeUrlsFromSitemaps() {
  if (sitemapCache.urls && sitemapCache.expiresAt > Date.now()) return sitemapCache.urls;

  const { html: indexXml } = await fetchPage(buildAbcSitemapIndexUrl());
  const sitemapUrls = findXmlLocs(indexXml)
    .filter((url) => /\/sitemap_\d+-product\.xml$/i.test(new URL(url).pathname));
  if (!sitemapUrls.length) throw new Error("El sitemap de ABC no contiene archivos de productos.");

  const productUrls = new Set();
  for (const sitemapUrl of sitemapUrls) {
    const safeSitemapUrl = assertAbcUrl(sitemapUrl);
    const { html: sitemapXml } = await fetchPage(safeSitemapUrl);
    for (const productUrl of findXmlLocs(sitemapXml)) {
      if (!isPerfumeProductUrl(productUrl)) continue;
      productUrls.add(assertAbcUrl(productUrl));
    }
  }
  const urls = [...productUrls];
  if (!urls.length) throw new Error("No se encontraron perfumes públicos en el sitemap de ABC.");
  sitemapCache = {
    urls,
    expiresAt: Date.now() + Math.max(0, abcSitemapCacheTtlMs),
  };
  return urls;
}

function productPageOpeningTag(html) {
  const match = String(html || "").match(/<div\b[^>]*\bclass=["'][^"']*\bproduct-wrapper\b[^"']*["'][^>]*>/i);
  return match ? match[0] : null;
}

function productNameFromPage(html) {
  return stripHtml(String(html || "").match(/<h1\b[^>]*\bitemprop=["']name["'][^>]*>([\s\S]*?)<\/h1>/i)?.[1]);
}

function productBrandFromPage(html) {
  const match = String(html || "").match(/<div\b[^>]*\bitemprop=["']brand["'][^>]*>[\s\S]*?<span\b[^>]*\bitemprop=["']name["'][^>]*>([\s\S]*?)<\/span>/i);
  return stripHtml(match?.[1]);
}

function productImageFromPage(html) {
  const match = String(html || "").match(/<div\b[^>]*\bclass=["'][^"']*\bprimary-images\b[^"']*["'][^>]*>[\s\S]*?<img\b[^>]*\bsrc=["']([^"']+)["']/i);
  return match ? decodeHtml(match[1]) : null;
}

function normalizeProductPage(html, productUrl) {
  const openingTag = productPageOpeningTag(html);
  const analytics = openingTag ? analyticsProduct(openingTag, "data-gtm") : null;
  const sku = String(analytics?.id || attribute(openingTag || "", "data-pid") || "").trim();
  const name = String(analytics?.name || productNameFromPage(html) || "").trim();
  const brand = String(analytics?.brand || productBrandFromPage(html) || "").trim() || null;
  const url = assertAbcUrl(productUrl);
  if (!sku || !name) throw new Error("La ficha pública de ABC no contiene SKU o nombre.");

  const internetPrice = priceFromTile(html, "internet");
  const normalPrice = priceFromTile(html, "normal");
  return {
    source: "abc-cl",
    sku,
    brand,
    name,
    price: internetPrice ?? parsePrice(analytics?.price),
    currency: "CLP",
    presentation: extractPresentation(name),
    imageUrl: productImageFromPage(html),
    available: /schema\.org\/InStock/i.test(html),
    url,
    raw: {
      productPage: true,
      normalPrice,
      category: analytics?.category || null,
    },
  };
}

async function scrapeProduct(productUrl) {
  const { html, finalUrl } = await fetchPage(assertAbcUrl(productUrl));
  return normalizeProductPage(html, finalUrl);
}

async function scrapeDirectCatalogPage(page = 1) {
  if (!Number.isInteger(page) || page < 1) throw new Error("La página de ABC debe ser un entero positivo.");
  const urls = await discoverPerfumeUrlsFromSitemaps();
  const start = (page - 1) * SITEMAP_PAGE_SIZE;
  const pageUrls = urls.slice(start, start + SITEMAP_PAGE_SIZE);
  const products = [];
  for (const productUrl of pageUrls) {
    try {
      products.push(await scrapeProduct(productUrl));
    } catch {
      // Un producto retirado o malformado no debe abortar toda la sincronización.
    }
  }
  return {
    products,
    page,
    totalPages: Math.ceil(urls.length / SITEMAP_PAGE_SIZE),
    scanned: pageUrls.length,
    directTotal: urls.length,
  };
}

async function scrapePerfumeCatalog(maxProducts = 12) {
  const limit = Math.min(Math.max(Number(maxProducts) || 12, 1), 48);
  const urls = (await discoverPerfumeUrlsFromSitemaps()).slice(0, limit);
  const results = [];
  for (const url of urls) {
    try {
      results.push({ url, ok: true, product: await scrapeProduct(url) });
    } catch (error) {
      results.push({ url, ok: false, error: error.message });
    }
  }
  return results;
}

module.exports = {
  assertAbcUrl,
  buildAbcCatalogUrl,
  buildAbcSitemapIndexUrl,
  parsePrice,
  extractPresentation,
  extractCatalogProducts,
  extractTotalProducts,
  findXmlLocs,
  isPerfumeProductUrl,
  discoverPerfumeUrlsFromSitemaps,
  normalizeProductPage,
  scrapeProduct,
  scrapeDirectCatalogPage,
  scrapePerfumeCatalog,
};
