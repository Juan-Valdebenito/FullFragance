const {
  silkUserAgent,
  silkMinDelayMs,
  silkMaxDelayMs,
  silkRequestTimeoutMs,
  silkCollectionUrl,
} = require("../config/env");

const PAGE_SIZE = 250;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let lastRequestAt = 0;

function assertSilkUrl(value) {
  const url = new URL(value);
  if (url.protocol !== "https:" || !/(^|\.)silkperfumes\.cl$/i.test(url.hostname)) {
    throw new Error("La URL debe pertenecer a https://silkperfumes.cl.");
  }
  const blocked = [
    /^\/a\/downloads\/-\//i,
    /^\/admin(?:\/|$)/i,
    /^\/(?:cart|carts|orders|checkouts?|account)(?:\/|$)/i,
    /^\/67496149209\/(?:checkouts|orders)(?:\/|$)/i,
    /^\/search(?:\/|$)/i,
    /^\/sf_private_access_tokens(?:\/|$)/i,
    /^\/recommendations\/products(?:\/|$)/i,
  ];
  if (blocked.some((pattern) => pattern.test(url.pathname))) {
    throw new Error("La URL está excluida por robots.txt de Silk Perfumes.");
  }
  return url.toString();
}

function buildSilkCatalogPageUrl(page = 1, limit = PAGE_SIZE) {
  const url = new URL(assertSilkUrl(silkCollectionUrl));
  if (!/^\/collections\/perfumes\/products\.json$/i.test(url.pathname)) {
    throw new Error("El catálogo de Silk debe usar /collections/perfumes/products.json.");
  }
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("page", String(page));
  return url.toString();
}

async function waitForRateLimit() {
  const min = Math.max(0, silkMinDelayMs);
  const max = Math.max(min, silkMaxDelayMs);
  const delay = min + Math.floor(Math.random() * (max - min + 1));
  await sleep(Math.max(0, lastRequestAt + delay - Date.now()));
}

async function fetchJson(url) {
  const safeUrl = assertSilkUrl(url);
  await waitForRateLimit();
  lastRequestAt = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), silkRequestTimeoutMs);
  let response;
  try {
    response = await fetch(safeUrl, {
      headers: {
        "User-Agent": silkUserAgent,
        Accept: "application/json",
        "Accept-Language": "es-CL,es;q=0.9",
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
      return fetchJson(safeUrl);
    }
    throw new Error("Silk Perfumes limitó temporalmente las solicitudes (HTTP 429).");
  }
  if (!response.ok) throw new Error(`Silk Perfumes respondió HTTP ${response.status}.`);
  return response.json();
}

function parsePrice(value) {
  if (value === undefined || value === null || value === "") return null;
  const amount = Number(String(value).replace(",", "."));
  return Number.isFinite(amount) ? Math.round(amount) : null;
}

function extractPresentation(name, variantTitle = "") {
  const match = `${name || ""} ${variantTitle || ""}`.match(/\b\d+(?:[,.]\d+)?\s*(?:ml|g|kg|oz|unidades?|u)\b/i);
  return match ? match[0] : null;
}

function normalizeProduct(product) {
  if (!product?.id || !product.handle || !product.title) {
    throw new Error("El producto de Silk no contiene id, handle y título.");
  }
  const variants = Array.isArray(product.variants) ? product.variants : [];
  const variant = variants.find((item) => item.available) || variants[0] || null;
  const sku = String(variant?.sku || variant?.id || product.id).trim();
  const price = parsePrice(variant?.price);
  return {
    source: "silk-cl",
    sku,
    brand: String(product.vendor || "").trim() || null,
    name: String(product.title).trim(),
    price,
    currency: "CLP",
    presentation: extractPresentation(product.title, variant?.title),
    imageUrl: product.images?.[0]?.src || variant?.featured_image?.src || null,
    available: Boolean(variant?.available && price !== null),
    url: `https://silkperfumes.cl/products/${encodeURIComponent(product.handle)}`,
    raw: {
      shopifyProductId: String(product.id),
      shopifyVariantId: variant?.id ? String(variant.id) : null,
      productType: product.product_type || null,
      compareAtPrice: parsePrice(variant?.compare_at_price),
      tags: Array.isArray(product.tags) ? product.tags : [],
      updatedAt: product.updated_at || null,
    },
  };
}

async function scrapeDirectCatalogPage(page = 1) {
  const data = await fetchJson(buildSilkCatalogPageUrl(page));
  const cards = Array.isArray(data.products) ? data.products : [];
  return {
    products: cards.map(normalizeProduct),
    page,
    totalPages: cards.length === PAGE_SIZE ? page + 1 : page,
    scanned: cards.length,
  };
}

async function scrapeProduct(productUrl) {
  const url = new URL(assertSilkUrl(productUrl));
  const match = url.pathname.match(/^\/products\/([^/]+?)(?:\.json)?$/i);
  if (!match) throw new Error("La URL debe apuntar a una ficha pública /products/{handle}.");
  const data = await fetchJson(new URL(`/products/${match[1]}.json`, url.origin).toString());
  return normalizeProduct(data.product);
}

async function scrapeProductOrFallback(productUrl) {
  return { product: await scrapeProduct(productUrl), warning: null };
}

async function scrapePerfumeCatalog(maxProducts = 12) {
  const limit = Math.min(Math.max(Number(maxProducts) || 12, 1), PAGE_SIZE);
  const data = await fetchJson(buildSilkCatalogPageUrl(1, limit));
  const products = (Array.isArray(data.products) ? data.products : []).slice(0, limit).map(normalizeProduct);
  return products.map((product) => ({ url: product.url, ok: true, product }));
}

module.exports = {
  assertSilkUrl,
  buildSilkCatalogPageUrl,
  normalizeProduct,
  scrapeDirectCatalogPage,
  scrapeProduct,
  scrapeProductOrFallback,
  scrapePerfumeCatalog,
  parsePrice,
  extractPresentation,
};
