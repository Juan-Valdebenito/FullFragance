const {
  dreamsUserAgent,
  dreamsMinDelayMs,
  dreamsMaxDelayMs,
  dreamsRequestTimeoutMs,
  dreamsMcpEndpoint,
} = require("../config/env");

// Dreams Parfums es una tienda Jumpseller que publica un endpoint MCP en su
// robots.txt. Este scraper usa solo las herramientas de lectura list_products y
// get_product: no toca carrito, checkout ni cuentas de cliente.
const PAGE_SIZE = 100;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let lastRequestAt = 0;

function assertDreamsUrl(value) {
  const url = new URL(value);
  if (url.protocol !== "https:" || !/^(?:www\.)?dreamsparfums\.cl$/i.test(url.hostname)) {
    throw new Error("La URL debe pertenecer a https://dreamsparfums.cl.");
  }
  const blocked = [
    /^\/(?:[^/]+\/)?(?:cart|checkout|v2\/checkout|customer|search|back_in_stock|wishlists|recipient|quote)(?:\/|$)/i,
    /^\/admin(?:\/|$)/i,
    /^\/api\/(?:analytics|cart)(?:\/|$)/i,
  ];
  if (blocked.some((pattern) => pattern.test(url.pathname)) || /preview=/i.test(url.search)) {
    throw new Error("La URL está excluida por robots.txt de Dreams Parfums.");
  }
  return url.toString();
}

function buildDreamsMcpEndpoint() {
  const url = new URL(assertDreamsUrl(dreamsMcpEndpoint));
  if (url.pathname !== "/api/mcp") {
    throw new Error("El endpoint MCP de Dreams Parfums debe usar /api/mcp.");
  }
  return url.toString();
}

async function waitForRateLimit() {
  const min = Math.max(0, dreamsMinDelayMs);
  const max = Math.max(min, dreamsMaxDelayMs);
  const delay = min + Math.floor(Math.random() * (max - min + 1));
  await sleep(Math.max(0, lastRequestAt + delay - Date.now()));
}

function parseMcpResult(response) {
  if (response?.error) throw new Error(`Dreams Parfums MCP: ${response.error.message || "error desconocido"}.`);
  const result = response?.result;
  const text = result?.content?.find((item) => item.type === "text")?.text;
  if (!result || result.isError) {
    throw new Error(`Dreams Parfums MCP: ${text || "la consulta de catálogo falló"}.`);
  }
  if (result.structuredContent) return result.structuredContent;
  if (text) return JSON.parse(text);
  throw new Error("Dreams Parfums MCP no devolvió contenido.");
}

async function callTool(name, args, retryCount = 0) {
  await waitForRateLimit();
  lastRequestAt = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), dreamsRequestTimeoutMs);
  let response;
  try {
    response = await fetch(buildDreamsMcpEndpoint(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
        "User-Agent": dreamsUserAgent,
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: `fullfragrance-dreams-${Date.now()}`,
        method: "tools/call",
        params: { name, arguments: args },
      }),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
  if (response.status === 429 && retryCount < 1) {
    const retryAfter = Number(response.headers.get("retry-after") || 0);
    await sleep(Math.max(1000, Math.min(retryAfter || 2, 60) * 1000));
    return callTool(name, args, retryCount + 1);
  }
  if (response.status === 429) throw new Error("Dreams Parfums limitó temporalmente las solicitudes MCP (HTTP 429).");
  if (!response.ok) throw new Error(`Dreams Parfums MCP respondió HTTP ${response.status}.`);
  return parseMcpResult(await response.json());
}

async function listProductsPage(page = 1, limit = PAGE_SIZE) {
  const safeLimit = Math.min(Math.max(Number(limit) || PAGE_SIZE, 1), PAGE_SIZE);
  const items = await callTool("list_products", { page, limit: safeLimit });
  if (!Array.isArray(items)) throw new Error("Dreams Parfums MCP no devolvió una lista de productos.");
  return items.map((item) => item?.product ?? item);
}

function parsePrice(value) {
  if (value === undefined || value === null || value === "") return null;
  const amount = Number(String(value).replace(",", "."));
  return Number.isFinite(amount) && amount > 0 ? Math.round(amount) : null;
}

function extractPresentation(name) {
  const match = String(name || "").match(/\b\d+(?:[,.]\d+)?\s*(?:ml|g|kg|oz|unidades?|u)\b/i);
  return match ? match[0] : null;
}

function gidTail(value) {
  const match = String(value || "").match(/\/(\d+)$/);
  return match ? match[1] : String(value || "").trim() || null;
}

function normalizeProduct(product) {
  if (!product?.id || !product?.name || !product?.permalink) {
    throw new Error("El producto de Dreams Parfums no contiene id, permalink y nombre.");
  }
  const variants = Array.isArray(product.variants) ? product.variants : [];
  const variant = variants.find((item) => item?.stock_available) || variants[0] || null;
  const price = parsePrice(variant?.price ?? product.price);
  const sku = String(variant?.sku || product.sku || gidTail(product.id) || "").trim();
  const available = variant ? variant.stock_available !== false : product.stock_available !== false;
  return {
    source: "dreams-cl",
    sku,
    brand: String(product.brand || "").trim() || null,
    name: String(product.name).trim(),
    price,
    currency: String(product.currency || "CLP").trim() || "CLP",
    presentation: extractPresentation(product.name),
    imageUrl: (Array.isArray(product.images) ? product.images[0] : null) || null,
    available: Boolean(available && price !== null),
    url: assertDreamsUrl(product.url || `https://dreamsparfums.cl/${product.permalink}`),
    raw: {
      jumpsellerProductId: gidTail(product.id),
      barcode: product.barcode || null,
      compareAtPrice: parsePrice(variant?.compare_at_price ?? product.compare_at_price),
      categories: Array.isArray(product.categories) ? product.categories : [],
      catalogProtocol: "Jumpseller MCP",
    },
  };
}

async function scrapeDirectCatalogPage(page = 1) {
  if (!Number.isInteger(page) || page < 1) throw new Error("La página de Dreams Parfums debe ser un entero positivo.");
  const items = await listProductsPage(page);
  return {
    products: items.map(normalizeProduct),
    page,
    totalPages: items.length === PAGE_SIZE ? page + 1 : page,
    scanned: items.length,
  };
}

async function scrapeProduct(productUrl) {
  const url = new URL(assertDreamsUrl(productUrl));
  const permalink = url.pathname.replace(/^\/+|\/+$/g, "");
  if (!permalink || permalink.includes("/")) {
    throw new Error("La URL debe apuntar a una ficha pública de producto de Dreams Parfums.");
  }
  const data = await callTool("get_product", { product: permalink });
  return normalizeProduct(data?.product ?? data);
}

async function scrapeProductOrFallback(productUrl) {
  return { product: await scrapeProduct(productUrl), warning: null };
}

async function scrapePerfumeCatalog(maxProducts = 12) {
  const limit = Math.min(Math.max(Number(maxProducts) || 12, 1), PAGE_SIZE);
  const items = await listProductsPage(1, limit);
  return items.slice(0, limit).map((product) => {
    try {
      const normalized = normalizeProduct(product);
      return { url: normalized.url, ok: true, product: normalized };
    } catch (error) {
      return { url: product?.url || null, ok: false, error: error.message };
    }
  });
}

module.exports = {
  assertDreamsUrl,
  buildDreamsMcpEndpoint,
  parsePrice,
  extractPresentation,
  normalizeProduct,
  scrapeDirectCatalogPage,
  scrapeProduct,
  scrapeProductOrFallback,
  scrapePerfumeCatalog,
};
