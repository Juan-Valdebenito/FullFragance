const {
  cosmeticUserAgent,
  cosmeticMinDelayMs,
  cosmeticMaxDelayMs,
  cosmeticRequestTimeoutMs,
  cosmeticUcpEndpoint,
  cosmeticUcpAgentProfile,
} = require("../config/env");
const { inferBrandFromName } = require("../models/productMatcher");

// Cosmetic solicita explícitamente UCP/MCP para el catálogo. Este servicio es
// estrictamente de lectura: usa search_catalog y nunca crea carrito ni checkout.
const PAGE_SIZE = 24;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let lastRequestAt = 0;
let cursorCache = { expiresAt: 0, cursors: new Map([[1, null]]) };

function assertCosmeticUrl(value) {
  const url = new URL(value);
  if (url.protocol !== "https:" || !/(^|\.)cosmetic\.cl$/i.test(url.hostname)) {
    throw new Error("La URL debe pertenecer a https://cosmetic.cl.");
  }
  const blocked = [
    /^\/admin(?:\/|$)/i,
    /^\/(?:cart|carts|orders|checkouts?|account)(?:\/|$)/i,
    /^\/services(?:\/|$)/i,
    /^\/sf_/i,
    /^\/recommendations\/products(?:\/|$)/i,
  ];
  if (blocked.some((pattern) => pattern.test(url.pathname))) {
    throw new Error("La URL está excluida por robots.txt de Cosmetic.");
  }
  return url.toString();
}

function buildCosmeticUcpEndpoint() {
  const url = new URL(cosmeticUcpEndpoint);
  const permittedHosts = new Set(["cosmetic.cl", "www.cosmetic.cl", "cosmetic-chile.myshopify.com"]);
  if (url.protocol !== "https:" || !permittedHosts.has(url.hostname) || url.pathname !== "/api/ucp/mcp") {
    throw new Error("El endpoint UCP de Cosmetic debe ser HTTPS y usar /api/ucp/mcp.");
  }
  return url.toString();
}

function ucpMeta() {
  return {
    "ucp-agent": {
      // Perfil público compatible de Shopify para la negociación de capacidades UCP.
      profile: cosmeticUcpAgentProfile,
    },
  };
}

async function waitForRateLimit() {
  const min = Math.max(0, cosmeticMinDelayMs);
  const max = Math.max(min, cosmeticMaxDelayMs);
  const delay = min + Math.floor(Math.random() * (max - min + 1));
  await sleep(Math.max(0, lastRequestAt + delay - Date.now()));
}

function parseMcpResult(response) {
  if (response?.error) throw new Error(`Cosmetic UCP: ${response.error.message || "error desconocido"}.`);
  const result = response?.result;
  if (!result) throw new Error("Cosmetic UCP no devolvió un resultado de catálogo.");
  if (result.isError) {
    const message = result.content?.find((item) => item.type === "text")?.text;
    throw new Error(`Cosmetic UCP: ${message || "la operación de catálogo falló"}.`);
  }
  if (result.structuredContent) return result.structuredContent;
  const text = result.content?.find((item) => item.type === "text")?.text;
  if (text) return JSON.parse(text);
  throw new Error("Cosmetic UCP no devolvió contenido estructurado.");
}

async function callCatalogTool(name, catalog, retryCount = 0) {
  await waitForRateLimit();
  lastRequestAt = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), cosmeticRequestTimeoutMs);
  let response;
  try {
    response = await fetch(buildCosmeticUcpEndpoint(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
        "User-Agent": cosmeticUserAgent,
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: `fullfragrance-${Date.now()}`,
        method: "tools/call",
        params: { name, arguments: { meta: ucpMeta(), catalog } },
      }),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }

  if (response.status === 429 && retryCount < 1) {
    const retryAfter = Number(response.headers.get("retry-after") || 0);
    await sleep(Math.max(1000, Math.min(retryAfter || 2, 60) * 1000));
    return callCatalogTool(name, catalog, retryCount + 1);
  }
  if (response.status === 429) throw new Error("Cosmetic limitó temporalmente las solicitudes UCP (HTTP 429).");
  if (!response.ok) throw new Error(`Cosmetic UCP respondió HTTP ${response.status}.`);
  return parseMcpResult(await response.json());
}

async function searchCatalog({ query = "perfume", cursor = null, limit = PAGE_SIZE } = {}) {
  const safeLimit = Math.min(Math.max(Number(limit) || PAGE_SIZE, 1), PAGE_SIZE);
  const catalog = {
    query,
    context: { address_country: "CL", currency: "CLP" },
    pagination: { limit: safeLimit, ...(cursor ? { cursor } : {}) },
  };
  const result = await callCatalogTool("search_catalog", catalog);
  if (!Array.isArray(result.products)) throw new Error("Cosmetic UCP no devolvió productos de catálogo.");
  return result;
}

function parsePrice(value) {
  if (value === undefined || value === null || value === "") return null;
  const raw = typeof value === "object" ? value.amount : value;
  const amount = Number(String(raw).replace(",", "."));
  return Number.isFinite(amount) ? Math.round(amount) : null;
}

function extractPresentation(name, variantTitle = "") {
  const match = `${name || ""} ${variantTitle || ""}`.match(/\b\d+(?:[,.]\d+)?\s*(?:ml|g|kg|oz|unidades?|u)\b/i);
  return match ? match[0] : null;
}

function gidTail(value) {
  const match = String(value || "").match(/\/(\d+)$/);
  return match ? match[1] : String(value || "").trim() || null;
}

function stripHtml(value) {
  return String(value || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanBrand(value) {
  return String(value || "")
    .replace(/^marca\s*:\s*/i, "")
    .replace(/\b(?:perfumes?|parfums?|fragrances?)\b\.?$/i, "")
    .replace(/[.,;:]+$/g, "")
    .replace(/\s+/g, " ")
    .trim() || null;
}

function brandFromCollections(collections) {
  for (const collection of collections || []) {
    const title = String(collection?.title || "").trim();
    if (!title) continue;
    const perfumePrefix = title.match(/^perfumes?\s+(.+)$/i);
    if (perfumePrefix) {
      const candidate = perfumePrefix[1];
      if (!/^(?:para|entre|hasta|sobre|arabes?|tradicional(?:es)?|destacados?|invierno|otoñ|verano|hombre|mujer|unisex)/i.test(candidate)) {
        return cleanBrand(candidate);
      }
      continue;
    }
    if (/^(?:perfumes?|tienda|todos los productos disponibles|te avisamos cuando lleguen|regalos|novedades|ofertas|sets?)$/i.test(title)) continue;
    return cleanBrand(title);
  }
  return null;
}

function brandFromDescription(description) {
  const text = stripHtml(description);
  const labelled = text.match(/\bmarca\s*:\s*([^\n.]+?)(?=\s+(?:género|genero|tipo|tamañ|aroma|notas)\s*:|$)/i);
  if (labelled) return cleanBrand(labelled[1]);
  const fromFragrance = text.match(/\bde\s+([A-ZÁÉÍÓÚÑ][\p{L}\d&.'-]*(?:\s+[A-ZÁÉÍÓÚÑ][\p{L}\d&.'-]*){0,3})\s*(?:,|es\s+una|es\s+un|son\s+)/u);
  return fromFragrance ? cleanBrand(fromFragrance[1]) : null;
}

function brandFromTitle(title) {
  const match = String(title || "").match(/\bde\s+([A-ZÁÉÍÓÚÑ][\p{L}\d&.'-]*(?:\s+[A-ZÁÉÍÓÚÑ][\p{L}\d&.'-]*){0,3})\s*$/u);
  return match ? cleanBrand(match[1]) : null;
}

function productBrand(product) {
  const declared = cleanBrand(product?.brand?.name || product?.brand || product?.vendor || product?.metadata?.brand);
  if (declared) return { brand: declared, source: "declared" };
  const collectionBrand = brandFromCollections(product?.collections);
  if (collectionBrand) return { brand: collectionBrand, source: "collection" };
  const descriptionBrand = brandFromDescription(product?.description?.html || product?.description?.text || product?.description);
  if (descriptionBrand) return { brand: descriptionBrand, source: "description" };
  const knownBrand = inferBrandFromName(`${product?.title || ""} ${stripHtml(product?.description?.html || product?.description?.text || product?.description)}`);
  if (knownBrand) return { brand: knownBrand, source: "known-title" };
  const titleBrand = brandFromTitle(product?.title);
  return { brand: titleBrand, source: titleBrand ? "title" : null };
}

function normalizeProduct(product) {
  if (!product?.id || !product?.title || !product?.url) {
    throw new Error("El producto UCP de Cosmetic no contiene id, título o URL.");
  }
  const variants = Array.isArray(product.variants) ? product.variants : [];
  const variant = variants.find((item) => item?.availability?.available) || variants[0] || null;
  const price = parsePrice(variant?.price ?? product.price_range?.min);
  const sku = String(variant?.sku || gidTail(variant?.id) || gidTail(product.id) || "").trim();
  if (!sku) throw new Error("El producto UCP de Cosmetic no contiene SKU o identificador de variante.");
  const productUrl = assertCosmeticUrl(product.url);
  const brand = productBrand(product);
  const imageUrl = product.media?.find((media) => media?.type === "image")?.url
    || variant?.media?.find((media) => media?.type === "image")?.url
    || null;
  const available = Boolean(variant?.availability?.available && price !== null);
  return {
    source: "cosmetic-cl",
    sku,
    brand: brand.brand,
    name: String(product.title).trim(),
    price,
    currency: String(variant?.price?.currency || product.price_range?.min?.currency || "CLP").trim() || "CLP",
    presentation: extractPresentation(product.title, variant?.title),
    imageUrl,
    available,
    url: productUrl,
    raw: {
      ucpProductId: String(product.id),
      ucpVariantId: variant?.id ? String(variant.id) : null,
      compareAtPrice: parsePrice(variant?.list_price ?? product.list_price_range?.min),
      tags: Array.isArray(product.tags) ? product.tags : [],
      collections: (product.collections || []).map((collection) => collection.handle || collection.title).filter(Boolean),
      brandSource: brand.source,
      catalogProtocol: "UCP/MCP 2026-04-08",
    },
  };
}

function resetCursorCache() {
  cursorCache = { expiresAt: Date.now() + 15 * 60 * 1000, cursors: new Map([[1, null]]) };
}

async function scrapeDirectCatalogPage(page = 1) {
  if (!Number.isInteger(page) || page < 1) throw new Error("La página de Cosmetic debe ser un entero positivo.");
  if (cursorCache.expiresAt <= Date.now()) resetCursorCache();
  if (!cursorCache.cursors.has(page)) {
    throw new Error("No se puede saltar páginas UCP: la sincronización debe recorrer sus cursores en orden.");
  }
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

async function scrapeProduct(productUrl) {
  const url = new URL(assertCosmeticUrl(productUrl));
  const handle = url.pathname.match(/^\/products\/([^/]+)\/?$/i)?.[1];
  if (!handle) throw new Error("La URL debe apuntar a una ficha pública /products/{handle}.");
  const data = await searchCatalog({ query: decodeURIComponent(handle), limit: PAGE_SIZE });
  const product = data.products.find((item) => item.handle === handle || item.url === url.toString());
  if (!product) throw new Error("Cosmetic UCP no encontró el producto solicitado.");
  return normalizeProduct(product);
}

async function scrapeProductOrFallback(productUrl) {
  return { product: await scrapeProduct(productUrl), warning: null };
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
  assertCosmeticUrl,
  buildCosmeticUcpEndpoint,
  parsePrice,
  extractPresentation,
  gidTail,
  productBrand,
  normalizeProduct,
  searchCatalog,
  scrapeDirectCatalogPage,
  scrapeProduct,
  scrapeProductOrFallback,
  scrapePerfumeCatalog,
};
