const {
  lodoroUserAgent,
  lodoroMinDelayMs,
  lodoroMaxDelayMs,
  lodoroRequestTimeoutMs,
  lodoroUcpEndpoint,
  lodoroUcpAgentProfile,
} = require("../config/env");
const { inferBrandFromName } = require("../models/productMatcher");

// L'Odoro solicita usar UCP/MCP. Este scraper realiza exclusivamente
// search_catalog: no crea carrito, checkout ni transacciones.
const PAGE_SIZE = 24;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let lastRequestAt = 0;
let cursorCache = { expiresAt: 0, cursors: new Map([[1, null]]) };

function assertLodoroUrl(value) {
  const url = new URL(value);
  if (url.protocol !== "https:" || !/(^|\.)(?:lodoro\.cl|lodoro\.myshopify\.com)$/i.test(url.hostname)) {
    throw new Error("La URL debe pertenecer a https://www.lodoro.cl.");
  }
  if (/^\/(?:admin|cart|checkout|checkouts|orders|account|services|sf_)(?:\/|$)/i.test(url.pathname)) {
    throw new Error("La URL está excluida por robots.txt de L'Odoro.");
  }
  return url.toString();
}

function buildLodoroUcpEndpoint() {
  const url = new URL(lodoroUcpEndpoint);
  if (url.protocol !== "https:" || url.hostname !== "lodoro.myshopify.com" || url.pathname !== "/api/ucp/mcp") {
    throw new Error("El endpoint UCP de L'Odoro debe ser HTTPS y usar /api/ucp/mcp.");
  }
  return url.toString();
}

function ucpMeta() {
  return { "ucp-agent": { profile: lodoroUcpAgentProfile } };
}

async function waitForRateLimit() {
  const min = Math.max(0, lodoroMinDelayMs);
  const max = Math.max(min, lodoroMaxDelayMs);
  const delay = min + Math.floor(Math.random() * (max - min + 1));
  await sleep(Math.max(0, lastRequestAt + delay - Date.now()));
}

function parseMcpResult(response) {
  if (response?.error) throw new Error(`L'Odoro UCP: ${response.error.message || "error desconocido"}.`);
  const result = response?.result;
  if (!result || result.isError) {
    const message = result?.content?.find((item) => item.type === "text")?.text;
    throw new Error(`L'Odoro UCP: ${message || "la consulta de catálogo falló"}.`);
  }
  if (result.structuredContent) return result.structuredContent;
  const text = result.content?.find((item) => item.type === "text")?.text;
  if (text) return JSON.parse(text);
  throw new Error("L'Odoro UCP no devolvió contenido estructurado.");
}

async function callCatalogTool(catalog, retryCount = 0) {
  await waitForRateLimit();
  lastRequestAt = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), lodoroRequestTimeoutMs);
  let response;
  try {
    response = await fetch(buildLodoroUcpEndpoint(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
        "User-Agent": lodoroUserAgent,
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: `fullfragrance-lodoro-${Date.now()}`,
        method: "tools/call",
        params: {
          name: "search_catalog",
          arguments: { meta: ucpMeta(), catalog },
        },
      }),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
  if (response.status === 429 && retryCount < 1) {
    const retryAfter = Number(response.headers.get("retry-after") || 0);
    await sleep(Math.max(1000, Math.min(retryAfter || 2, 60) * 1000));
    return callCatalogTool(catalog, retryCount + 1);
  }
  if (response.status === 429) throw new Error("L'Odoro limitó temporalmente las solicitudes UCP (HTTP 429).");
  if (!response.ok) throw new Error(`L'Odoro UCP respondió HTTP ${response.status}.`);
  return parseMcpResult(await response.json());
}

async function searchCatalog({ query = "perfume", cursor = null, limit = PAGE_SIZE } = {}) {
  const safeLimit = Math.min(Math.max(Number(limit) || PAGE_SIZE, 1), PAGE_SIZE);
  const catalog = {
    query,
    context: { address_country: "CL", currency: "CLP" },
    pagination: { limit: safeLimit, ...(cursor ? { cursor } : {}) },
  };
  const result = await callCatalogTool(catalog);
  if (!Array.isArray(result.products)) throw new Error("L'Odoro UCP no devolvió productos de catálogo.");
  return result;
}

function parsePrice(value) {
  if (value === undefined || value === null || value === "") return null;
  const amount = typeof value === "object" ? value.amount : value;
  const number = Number(String(amount).replace(",", "."));
  return Number.isFinite(number) ? Math.round(number) : null;
}

function extractPresentation(name, variantTitle = "") {
  const match = `${name || ""} ${variantTitle || ""}`.match(/\b\d+(?:[,.]\d+)?\s*(?:ml|g|kg|oz|unidades?|u)\b/i);
  return match ? match[0] : null;
}

function gidTail(value) {
  const match = String(value || "").match(/\/(\d+)$/);
  return match ? match[1] : String(value || "").trim() || null;
}

function brandFromTags(tags) {
  const tag = (tags || []).map(String).find((value) => /^marca[_:]/i.test(value));
  return tag ? tag.replace(/^marca[_:]\s*/i, "").replace(/_/g, " ").trim() || null : null;
}

function productBrand(product) {
  return inferBrandFromName(product?.title || "") || brandFromTags(product?.tags) || null;
}

function isPerfumeProduct(product) {
  return (product?.collections || []).some((collection) => /perfumes?/i.test(`${collection?.handle || ""} ${collection?.title || ""}`))
    || (product?.tags || []).some((tag) => /(?:tipo[_:]?perfumes?|perfume[_:]|fragancia)/i.test(String(tag)));
}

function normalizeProduct(product) {
  if (!product?.id || !product?.title || !product?.url || !isPerfumeProduct(product)) {
    throw new Error("El producto UCP de L'Odoro no es un perfume válido.");
  }
  const variants = Array.isArray(product.variants) ? product.variants : [];
  const variant = variants.find((item) => item?.availability?.available) || variants[0] || null;
  const price = parsePrice(variant?.price ?? product.price_range?.min);
  const sku = String(variant?.sku || gidTail(variant?.id) || gidTail(product.id) || "").trim();
  if (!sku) throw new Error("El producto UCP de L'Odoro no contiene SKU o variante.");
  const imageUrl = product.media?.find((media) => media?.type === "image")?.url
    || variant?.media?.find((media) => media?.type === "image")?.url
    || null;
  return {
    source: "lodoro-cl",
    sku,
    brand: productBrand(product),
    name: String(product.title).trim(),
    price,
    currency: String(variant?.price?.currency || product.price_range?.min?.currency || "CLP").trim() || "CLP",
    presentation: extractPresentation(product.title, variant?.title),
    imageUrl,
    available: Boolean(variant?.availability?.available && price !== null),
    url: assertLodoroUrl(product.url),
    raw: {
      ucpProductId: String(product.id),
      ucpVariantId: variant?.id ? String(variant.id) : null,
      compareAtPrice: parsePrice(variant?.list_price ?? product.list_price_range?.min),
      tags: Array.isArray(product.tags) ? product.tags : [],
      collections: (product.collections || []).map((collection) => collection.handle || collection.title).filter(Boolean),
      catalogProtocol: "UCP/MCP 2026-04-08",
    },
  };
}

function resetCursorCache() {
  cursorCache = { expiresAt: Date.now() + 15 * 60 * 1000, cursors: new Map([[1, null]]) };
}

async function scrapeDirectCatalogPage(page = 1) {
  if (!Number.isInteger(page) || page < 1) throw new Error("La página de L'Odoro debe ser un entero positivo.");
  if (cursorCache.expiresAt <= Date.now()) resetCursorCache();
  if (!cursorCache.cursors.has(page)) throw new Error("La sincronización de L'Odoro debe recorrer los cursores UCP en orden.");
  const data = await searchCatalog({ cursor: cursorCache.cursors.get(page), limit: PAGE_SIZE });
  const pagination = data.pagination || { has_next_page: false };
  if (pagination.has_next_page && pagination.cursor) cursorCache.cursors.set(page + 1, pagination.cursor);
  const products = data.products.map(normalizeProduct);
  return {
    products,
    page,
    totalPages: pagination.has_next_page ? page + 1 : page,
    scanned: data.products.length,
    ...(Number.isInteger(pagination.total_count) ? { directTotal: pagination.total_count } : {}),
  };
}

async function scrapePerfumeCatalog(maxProducts = 12) {
  const limit = Math.min(Math.max(Number(maxProducts) || 12, 1), PAGE_SIZE);
  const data = await searchCatalog({ query: "perfume", limit });
  return data.products.map((product) => {
    try {
      const normalized = normalizeProduct(product);
      return { url: normalized.url, ok: true, product: normalized };
    } catch (error) {
      return { url: product?.url || null, ok: false, error: error.message };
    }
  });
}

module.exports = {
  assertLodoroUrl,
  buildLodoroUcpEndpoint,
  parsePrice,
  extractPresentation,
  gidTail,
  productBrand,
  normalizeProduct,
  searchCatalog,
  scrapeDirectCatalogPage,
  scrapePerfumeCatalog,
};
