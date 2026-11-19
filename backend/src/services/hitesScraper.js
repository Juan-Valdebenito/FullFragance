const fs = require("fs/promises");
const path = require("path");
const {
  hitesUserAgent,
  hitesMinDelayMs,
  hitesMaxDelayMs,
  hitesRequestTimeoutMs,
  hitesFixtureDir,
  hitesPerfumesUrl,
} = require("../config/env");

// Hites (Salesforce Commerce Cloud) entrega el listado completo en HTML SSR.
// robots.txt prohíbe srule, pmin/pmax, prefn/prefv, pmid y los endpoints
// Search-UpdateGrid/Search-Show, así que sólo se recorre la categoría pública
// con la paginación permitida (?sz=48&start=N).
const PAGE_SIZE = 48;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let lastRequestAt = 0;

function assertHitesUrl(value) {
  const url = new URL(value);
  if (url.protocol !== "https:" || !/(^|\.)hites\.com$/i.test(url.hostname)) {
    throw new Error("La URL debe pertenecer a https://www.hites.com.");
  }
  const blockedPaths = [
    /bolsa-de-compra/i,
    /^\/(?:mi-cuenta|checkout|iniciarcheckout|mis-ordenes|favoritos|perfil|test|iniciarsesion|ordenconfirmacion|ordendetalle|busqueda)/i,
    /^\/producto-de-prueba/i,
    /search-updategrid|search-show/i,
  ];
  const blockedParams = ["srule", "pmin", "pmax", "pmid", "q", "prefn1", "prefn2", "prefn3", "prefn4", "prefv1", "prefv2", "prefv3", "prefv4"];
  if (
    blockedPaths.some((pattern) => pattern.test(url.pathname)) ||
    blockedParams.some((param) => url.searchParams.has(param)) ||
    /^root$/i.test(url.searchParams.get("cgid") || "")
  ) {
    throw new Error("La URL está excluida por robots.txt de Hites.");
  }
  return url.toString();
}

function buildHitesCatalogPageUrl(page = 1) {
  if (!Number.isInteger(page) || page < 1) throw new Error("La página de Hites debe ser un entero positivo.");
  const url = new URL(assertHitesUrl(hitesPerfumesUrl));
  if (!/^\/belleza\/perfumes\/?$/i.test(url.pathname)) {
    throw new Error("El catálogo de Hites debe usar exclusivamente /belleza/perfumes/.");
  }
  url.search = "";
  url.searchParams.set("sz", String(PAGE_SIZE));
  url.searchParams.set("start", String((page - 1) * PAGE_SIZE));
  return url.toString();
}

async function waitForRateLimit() {
  const min = Math.max(0, hitesMinDelayMs);
  const max = Math.max(min, hitesMaxDelayMs);
  const delay = min + Math.floor(Math.random() * (max - min + 1));
  await sleep(Math.max(0, lastRequestAt + delay - Date.now()));
}

async function fetchPage(url) {
  const safeUrl = assertHitesUrl(url);
  if (hitesFixtureDir) {
    return {
      html: await fs.readFile(path.resolve(hitesFixtureDir, "catalog.html"), "utf8"),
      finalUrl: safeUrl,
    };
  }

  await waitForRateLimit();
  lastRequestAt = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), hitesRequestTimeoutMs);
  let response;
  try {
    response = await fetch(safeUrl, {
      headers: {
        "User-Agent": hitesUserAgent,
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "es-CL,es;q=0.9",
        Referer: "https://www.hites.com/",
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
    throw new Error("Hites limitó temporalmente las solicitudes (HTTP 429).");
  }
  if (response.status === 403) throw new Error("Hites bloqueó la consulta automática (HTTP 403 / Cloudflare).");
  if (!response.ok) throw new Error(`Hites respondió HTTP ${response.status}.`);
  const html = await response.text();
  if (/<title>\s*Attention Required! \| Cloudflare/i.test(html)) {
    throw new Error("Hites bloqueó la consulta automática (HTTP 403 / Cloudflare).");
  }
  return { html, finalUrl: response.url };
}

function decodeHtml(value) {
  return String(value || "")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&aacute;/gi, "á")
    .replace(/&eacute;/gi, "é")
    .replace(/&iacute;/gi, "í")
    .replace(/&oacute;/gi, "ó")
    .replace(/&uacute;/gi, "ú")
    .replace(/&ntilde;/gi, "ñ")
    .replace(/&iexcl;/gi, "¡")
    .replace(/&#(\d+);/g, (_match, code) => String.fromCharCode(Number(code)))
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&amp;/gi, "&");
}

function parsePrice(value) {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value === "number") return Number.isFinite(value) ? Math.round(value) : null;
  const digits = String(value).replace(/[^\d]/g, "");
  return digits ? Number(digits) : null;
}

function extractPresentation(name) {
  const match = String(name || "").match(/\b\d+(?:[,.]\d+)?\s*(?:ml|mL|g|kg|oz|unidades?|u)\b/i);
  return match ? match[0] : null;
}

function attribute(openingTag, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = openingTag.match(new RegExp(`\\b${escaped}="([^"]*)"`, "i"));
  return match ? decodeHtml(match[1]) : null;
}

function extractTiles(html) {
  const source = String(html || "");
  const pattern = /<div\b[^>]*\bclass="[^"]*\bplp-grid-tile\b[^"]*"[^>]*\bdata-pid="[^"]*"[^>]*>/gi;
  const starts = [...source.matchAll(pattern)].map((match) => match.index);
  return starts.map((start, index) => source.slice(start, starts[index + 1] ?? source.length));
}

function analyticsItem(tileHtml) {
  const tag = tileHtml.match(/<div\b[^>]*\bdata-gtmselectitem="[^"]*"[^>]*>/i)?.[0];
  const payload = tag ? attribute(tag, "data-gtmselectitem") : null;
  if (!payload) return null;
  try {
    const data = JSON.parse(payload);
    return data?.item ? { ...data.item, marketplace: data.item.marketplace || data.marketplace || null } : null;
  } catch {
    return null;
  }
}

function priceFromTile(tileHtml, className) {
  const match = tileHtml.match(
    new RegExp(`class="price-item ${className}\\b[^"]*"[\\s\\S]*?<span\\b[^>]*\\bclass="value"[^>]*\\bcontent="([^"]+)"`, "i")
  );
  return match ? parsePrice(match[1]) : null;
}

function productUrlFromTile(tileHtml) {
  const match = tileHtml.match(/href="(\/[^"?#]+\.html)"/i);
  return match ? assertHitesUrl(new URL(decodeHtml(match[1]), "https://www.hites.com").toString()) : null;
}

function imageUrlFromTile(tileHtml) {
  const match = tileHtml.match(/<img\b(?=[^>]*\bjs-image1\b)[^>]*\bsrc="([^"]+)"/i);
  if (!match) return null;
  // Se guarda la imagen original, sin el redimensionado del listado (sw/sh).
  const url = new URL(decodeHtml(match[1]));
  url.search = "";
  return url.toString();
}

function isSoldByHites(item) {
  return String(item?.marketplace || "").trim().toUpperCase() === "HITES";
}

function normalizeTile(tileHtml) {
  const item = analyticsItem(tileHtml);
  const sku = String(attribute(tileHtml.slice(0, 300), "data-pid") || item?.item_id || "").trim();
  const name = decodeHtml(item?.item_name || "").trim();
  const url = productUrlFromTile(tileHtml);
  if (!item || !sku || !name || !url) {
    throw new Error("Una tarjeta de Hites no contiene SKU, nombre o enlace público.");
  }
  const salePrice = priceFromTile(tileHtml, "sales");
  const normalPrice = priceFromTile(tileHtml, "list");
  const price = salePrice ?? normalPrice ?? parsePrice(item.price);
  // La etiqueta "¡SIN STOCK!" existe en todas las tarjetas; sólo se muestra
  // (sin la clase d-none) cuando el producto está agotado.
  const outOfStock = /class="oos-tags(?![^"]*\bd-none\b)[^"]*"/i.test(tileHtml);
  return {
    source: "hites-cl",
    sku,
    brand: decodeHtml(item.item_brand || "").trim() || null,
    name,
    price,
    currency: "CLP",
    presentation: extractPresentation(name),
    imageUrl: imageUrlFromTile(tileHtml),
    available: !outOfStock && price !== null,
    url,
    raw: {
      collectionCard: true,
      normalPrice: normalPrice !== price ? normalPrice : null,
      discount: decodeHtml(tileHtml.match(/class="[^"]*\bdiscount-price\b[^"]*">([^<]*)</i)?.[1] || "").trim() || null,
      category: decodeHtml(item.item_category || "") || null,
      family: item.report_familia || null,
      seller: item.marketplace || null,
    },
  };
}

function extractCatalogProducts(html, { onlyHites = true } = {}) {
  const products = new Map();
  for (const tileHtml of extractTiles(html)) {
    if (onlyHites && !isSoldByHites(analyticsItem(tileHtml))) continue;
    try {
      const product = normalizeTile(tileHtml);
      products.set(product.sku, product);
    } catch {
      // Una tarjeta malformada no debe cancelar el catálogo completo.
    }
  }
  return [...products.values()];
}

function extractTotalPages(html, currentPage = 1) {
  const starts = [...String(html || "").matchAll(/[?&](?:amp;)?start=(\d+)/gi)].map((match) => Number(match[1]));
  const lastStart = Math.max(0, ...starts.filter(Number.isFinite));
  return Math.max(currentPage, Math.floor(lastStart / PAGE_SIZE) + 1);
}

async function scrapeDirectCatalogPage(page = 1) {
  const { html } = await fetchPage(buildHitesCatalogPageUrl(page));
  const tiles = extractTiles(html);
  return {
    products: extractCatalogProducts(html),
    page,
    // Una página vacía significa que se terminó el catálogo aunque la
    // paginación anuncie más (Hites recalcula el total entre consultas).
    totalPages: tiles.length ? extractTotalPages(html, page) : page,
    scanned: tiles.length,
  };
}

async function scrapePerfumeCatalog(maxProducts = 12) {
  const limit = Math.min(Math.max(Number(maxProducts) || 12, 1), PAGE_SIZE);
  const { html } = await fetchPage(buildHitesCatalogPageUrl(1));
  return extractCatalogProducts(html)
    .slice(0, limit)
    .map((product) => ({ url: product.url, ok: true, product }));
}

module.exports = {
  assertHitesUrl,
  buildHitesCatalogPageUrl,
  parsePrice,
  extractPresentation,
  extractCatalogProducts,
  extractTotalPages,
  isSoldByHites,
  normalizeTile,
  scrapeDirectCatalogPage,
  scrapePerfumeCatalog,
};
