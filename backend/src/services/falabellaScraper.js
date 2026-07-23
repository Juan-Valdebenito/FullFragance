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
    price: null,
    currency: "CLP",
    presentation: extractPresentation(name, ""),
    imageUrl: null,
    available: false,
    url: url.toString(),
    raw: { fallback: true, reason },
  };
}

function isCloudflareBlockError(error) {
  return /HTTP 403|Cloudflare/i.test(error?.message || "");
}

function extractImage(image) {
  const candidate = Array.isArray(image) ? image[0] : image;
  if (typeof candidate === "string") return candidate;
  if (candidate && typeof candidate === "object") return candidate.url || candidate.contentUrl || null;
  return null;
}

function normalizeProduct(jsonLd, url) {
  const offer = Array.isArray(jsonLd.offers) ? jsonLd.offers[0] : jsonLd.offers || {};
  const sku = String(jsonLd.sku || jsonLd.mpn || jsonLd.productID || "").trim();
  if (!sku) throw new Error("La página no expone un SKU público en sus datos estructurados.");
  const availability = String(offer.availability || "").toLowerCase();
  return {
    source: "falabella-cl",
    sku,
    brand: typeof jsonLd.brand === "object" ? jsonLd.brand.name : jsonLd.brand || null,
    name: jsonLd.name?.trim(),
    price: offer.price === undefined ? null : Math.round(Number(offer.price)),
    currency: offer.priceCurrency || "CLP",
    presentation: extractPresentation(jsonLd.name, jsonLd.description),
    imageUrl: extractImage(jsonLd.image),
    available: /instock|in stock|limitedavailability/.test(availability),
    url,
    raw: jsonLd,
  };
}

async function scrapeProduct(productUrl) {
  const safeUrl = assertFalabellaUrl(productUrl);
  const { html, finalUrl } = await fetchPage(safeUrl);
  const jsonLd = findProductJsonLd(html);
  if (!jsonLd) throw new Error("No se encontró el bloque Product JSON-LD en la página.");
  return normalizeProduct(jsonLd, finalUrl);
}

async function scrapeProductOrFallback(productUrl) {
  try {
    return { product: await scrapeProduct(productUrl), warning: null };
  } catch (error) {
    if (!isCloudflareBlockError(error)) throw error;
    return {
      product: productFromUrl(productUrl, error.message),
      warning: "Falabella bloqueó el detalle; se guardó un producto parcial desde la URL.",
    };
  }
}

async function scrapePerfumeCatalog(maxProducts = 12) {
  const limit = Math.min(Math.max(Number(maxProducts) || 12, 1), 24);
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
  findProductUrls,
  normalizeProduct,
  productFromUrl,
  isPerfumeProductUrl,
};
