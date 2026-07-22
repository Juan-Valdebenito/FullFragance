const { falabellaUserAgent, falabellaMinDelayMs, falabellaMaxDelayMs } = require("../config/env");

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
  await waitForRateLimit();
  lastRequestAt = Date.now();
  const response = await fetch(url, {
    headers: {
      "User-Agent": falabellaUserAgent,
      Accept: "text/html,application/xhtml+xml",
      "Accept-Language": "es-CL,es;q=0.9",
    },
    redirect: "follow",
  });

  if (response.status === 429) {
    const retryAfter = Number(response.headers.get("retry-after") || 0);
    if (retryAfter > 0 && retryAfter <= 60) {
      await sleep(retryAfter * 1000);
      return fetchPage(url);
    }
    throw new Error("Falabella limitó temporalmente las solicitudes (HTTP 429).");
  }
  if (!response.ok) throw new Error(`Falabella respondió HTTP ${response.status}.`);
  return { html: await response.text(), finalUrl: response.url };
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

module.exports = { scrapeProduct };
