const fs = require("fs/promises");
const path = require("path");
const {
  falabellaUserAgent,
  falabellaMinDelayMs,
  falabellaMaxDelayMs,
  falabellaRequestTimeoutMs,
  falabellaFixtureDir,
  falabellaPerfumesUrl,
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
  const addUrl = (candidate) => {
    const href = candidate.replace(/\\u002F/gi, "/").replace(/\\\//g, "/").replace(/&amp;/g, "&");
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
  return [...urls];
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

async function scrapePerfumeCatalog(maxProducts = 12) {
  const limit = Math.min(Math.max(Number(maxProducts) || 12, 1), 24);
  const catalogUrl = assertFalabellaUrl(falabellaPerfumesUrl);
  const { html, finalUrl } = await fetchPage(catalogUrl);
  const productUrls = findProductUrls(html, finalUrl, limit);
  if (!productUrls.length) {
    throw new Error("No se encontraron enlaces de productos en la colección de perfumes de Falabella.");
  }
  const results = [];
  for (const url of productUrls) {
    try {
      results.push({ url, ok: true, product: await scrapeProduct(url) });
    } catch (error) {
      results.push({ url, ok: false, error: error.message });
    }
  }
  return results;
}

module.exports = { scrapeProduct, scrapePerfumeCatalog, findProductUrls, normalizeProduct };
