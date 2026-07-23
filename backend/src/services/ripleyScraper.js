const fs = require("fs/promises");
const path = require("path");
const {
  ripleyUserAgent,
  ripleyMinDelayMs,
  ripleyMaxDelayMs,
  ripleyRequestTimeoutMs,
  ripleyFixtureDir,
  ripleyPerfumesUrl,
  scraperMockPrices,
} = require("../config/env");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let lastRequestAt = 0;

const SEED_PERFUME_URLS = [
  "https://simple.ripley.cl/perfume-dior-homme-hombre-edt-100-ml-2000378702900p",
  "https://simple.ripley.cl/perfume-dkny-men-hombre-edt-100-ml-2000397748217p",
  "https://simple.ripley.cl/perfume-hombre-tommy-hilfiger-tommy-edt-100-ml-2000403434585p",
  "https://simple.ripley.cl/perfume-yves-saint-laurent-l-homme-hombre-edt-100-ml-2000319589355p",
  "https://simple.ripley.cl/perfume-lacoste-lhomme-hombre-edt-100-ml-2000368344738p",
  "https://simple.ripley.cl/perfume-calvin-klein-free-edt-100ml-hombre-mpm10003217931",
  "https://simple.ripley.cl/perfume-guess-dare-hombre-edt-100-ml-mpm10000597635",
  "https://simple.ripley.cl/perfume-hombre-man-edt-100-ml-hugo-boss-100-ml-mpm10000400543",
  "https://simple.ripley.cl/tommy-men-edt-100-ml-hombre-caja-formal-sin-celofan-mpm10000144508",
];

function waitForRateLimit() {
  const min = Math.max(0, ripleyMinDelayMs);
  const max = Math.max(min, ripleyMaxDelayMs);
  const delay = min + Math.floor(Math.random() * (max - min + 1));
  const wait = Math.max(0, lastRequestAt + delay - Date.now());
  return sleep(wait);
}

function assertRipleyUrl(value) {
  const url = new URL(value);
  if (url.protocol !== "https:" || !/(^|\.)ripley\.cl$/i.test(url.hostname)) {
    throw new Error("La URL debe pertenecer a https://simple.ripley.cl.");
  }
  return url.toString();
}

function ripleyProductIdFromUrl(value) {
  const url = new URL(value);
  const slug = url.pathname.split("/").filter(Boolean).at(-1) || "";
  const match = slug.match(/(?:^|-)(mpm\d+|\d+p?)$/i);
  return match ? match[1].toUpperCase() : null;
}

async function fetchPage(url) {
  if (ripleyFixtureDir) {
    const productId = ripleyProductIdFromUrl(url);
    const fixturePath = path.resolve(ripleyFixtureDir, productId ? `${productId}.html` : "catalog.html");
    return { html: await fs.readFile(fixturePath, "utf8"), finalUrl: url };
  }

  await waitForRateLimit();
  lastRequestAt = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ripleyRequestTimeoutMs);
  let response;
  try {
    response = await fetch(url, {
      headers: {
        "User-Agent": ripleyUserAgent,
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "es-CL,es;q=0.9",
        Referer: "https://simple.ripley.cl/",
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
    throw new Error("Ripley limitó temporalmente las solicitudes (HTTP 429).");
  }
  if (response.status === 403) {
    throw new Error("Ripley bloqueó la consulta automática (HTTP 403).");
  }
  if (!response.ok) throw new Error(`Ripley respondió HTTP ${response.status}.`);
  return { html: await response.text(), finalUrl: response.url };
}

function decodeSafely(value) {
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
}

function normalizeCandidate(value) {
  return decodeSafely(
    String(value || "")
      .replace(/\\u002F/gi, "/")
      .replace(/\\\//g, "/")
      .replace(/&amp;/g, "&")
  );
}

function isPerfumeProductUrl(url) {
  const parsed = new URL(url);
  if (!/(^|\.)ripley\.cl$/i.test(parsed.hostname)) return false;
  const pathname = decodeURIComponent(parsed.pathname).toLowerCase();
  if (!/(?:^|-)(?:mpm\d+|\d+p?)$/.test(pathname.split("/").filter(Boolean).at(-1) || "")) return false;
  return /(?:^|[-/])(perfume|parfum|fragancia|colonia|eau|edp|edt|extrait|body-splash)(?:[-/]|$)/i.test(pathname);
}

function findProductUrls(html, baseUrl, limit) {
  const urls = new Set();
  const addUrl = (candidate) => {
    if (urls.size >= limit) return;
    const href = normalizeCandidate(candidate);
    try {
      const url = new URL(href, baseUrl);
      url.search = "";
      url.hash = "";
      if (isPerfumeProductUrl(url.toString())) urls.add(url.toString());
    } catch {
      // Se ignora un enlace malformado y se continúa con el siguiente.
    }
  };

  for (const match of String(html || "").matchAll(/href=["']([^"']+)["']/gi)) addUrl(match[1]);
  const normalizedHtml = normalizeCandidate(html);
  for (const match of normalizedHtml.matchAll(/(?:https?:\/\/[^\s"'<>]*|\/[^\s"'<>]*)-(?:mpm\d+|\d+p?)(?:[?#][^\s"'<>]*)?/gi)) {
    addUrl(match[0]);
  }
  return [...urls];
}

function findProductJsonLd(html) {
  const scripts = String(html || "").matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
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

function stripTags(html) {
  return String(html || "").replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ");
}

function priceFromText(html) {
  const text = stripTags(html).replace(/\s+/g, " ");
  const internet = text.match(/Internet\s*\$?\s*([\d.]+)/i);
  const normal = text.match(/Normal\s*\$?\s*([\d.]+)/i);
  const generic = text.match(/\$\s*([\d.]{4,})/);
  const value = internet?.[1] || normal?.[1] || generic?.[1];
  return value ? Number(value.replace(/\./g, "")) : null;
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
      .replace(/-(?:mpm\d+|\d+p?)$/i, "")
      .replace(/[-_]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  );
}

function inferBrandFromName(name) {
  const normalized = String(name || "").replace(/\s+/g, " ").trim();
  const knownBrands = [
    "Dolce Gabbana",
    "Yves Saint Laurent",
    "Tommy Hilfiger",
    "Calvin Klein",
    "Hugo Boss",
    "Ralph Lauren",
    "Carolina Herrera",
    "Paco Rabanne",
    "Giorgio Armani",
    "Ariana Grande",
    "Jean Paul Gaultier",
  ];
  const found = knownBrands.find((brand) => normalized.toLowerCase().includes(brand.toLowerCase()));
  if (found) return found;
  const withoutCommon = normalized.replace(/\b(perfume|mujer|hombre|unisex|edp|edt|parfum|ml|set|mini|eau|de|toilette|pour)\b/gi, " ");
  return withoutCommon.split(" ").filter(Boolean).slice(0, 2).join(" ") || null;
}

function demoPriceForSku(sku) {
  const seed = String(sku || "")
    .split("")
    .reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return 24990 + (seed % 20) * 4500;
}

function extractImage(image) {
  const candidate = Array.isArray(image) ? image[0] : image;
  if (typeof candidate === "string") return candidate;
  if (candidate && typeof candidate === "object") return candidate.url || candidate.contentUrl || null;
  return null;
}

function productFromUrl(productUrl, reason = "Detalle no disponible desde Ripley.") {
  const url = new URL(assertRipleyUrl(productUrl));
  const slug = url.pathname.split("/").filter(Boolean).at(-1) || "";
  const sku = ripleyProductIdFromUrl(url.toString());
  if (!sku) throw new Error("No se pudo inferir el SKU desde la URL de Ripley.");
  const name = cleanProductSlug(slug);
  return {
    source: "ripley-cl",
    sku,
    brand: inferBrandFromName(name),
    name,
    price: scraperMockPrices ? demoPriceForSku(sku) : null,
    currency: "CLP",
    presentation: extractPresentation(name, ""),
    imageUrl: null,
    available: Boolean(scraperMockPrices),
    url: url.toString(),
    raw: { fallback: true, mockPrice: Boolean(scraperMockPrices), reason },
  };
}

function normalizeProduct(jsonLd, url, html = "") {
  const offer = Array.isArray(jsonLd.offers) ? jsonLd.offers[0] : jsonLd.offers || {};
  const sku = String(jsonLd.sku || jsonLd.mpn || jsonLd.productID || ripleyProductIdFromUrl(url) || "").trim();
  if (!sku) throw new Error("La página no expone un SKU público en sus datos estructurados.");
  const availability = String(offer.availability || "").toLowerCase();
  const name = jsonLd.name?.trim() || cleanProductSlug(new URL(url).pathname.split("/").filter(Boolean).at(-1));
  const price = offer.price === undefined ? priceFromText(html) : Math.round(Number(offer.price));
  return {
    source: "ripley-cl",
    sku: sku.toUpperCase(),
    brand: typeof jsonLd.brand === "object" ? jsonLd.brand.name : jsonLd.brand || inferBrandFromName(name),
    name,
    price,
    currency: offer.priceCurrency || "CLP",
    presentation: extractPresentation(name, jsonLd.description),
    imageUrl: extractImage(jsonLd.image),
    available: availability ? /instock|in stock|limitedavailability/.test(availability) : price !== null,
    url,
    raw: jsonLd,
  };
}

async function scrapeProduct(productUrl) {
  const safeUrl = assertRipleyUrl(productUrl);
  const { html, finalUrl } = await fetchPage(safeUrl);
  const jsonLd = findProductJsonLd(html);
  if (jsonLd) return normalizeProduct(jsonLd, finalUrl, html);
  const fallback = productFromUrl(finalUrl, "Ripley no expuso Product JSON-LD en la página.");
  const price = priceFromText(html);
  if (price) {
    return { ...fallback, price, available: true, raw: { ...fallback.raw, fallback: true, mockPrice: false } };
  }
  throw new Error("No se encontró precio ni bloque Product JSON-LD en la página de Ripley.");
}

async function scrapeProductOrFallback(productUrl) {
  try {
    return { product: await scrapeProduct(productUrl), warning: null };
  } catch (error) {
    return {
      product: productFromUrl(productUrl, error.message),
      warning: "No se pudo leer el detalle de Ripley; se guardó un producto parcial desde la URL.",
    };
  }
}

async function scrapePerfumeCatalog(maxProducts = 12) {
  const limit = Math.min(Math.max(Number(maxProducts) || 12, 1), 24);
  const catalogUrl = assertRipleyUrl(ripleyPerfumesUrl);
  let productUrls = [];
  let discoveryError = null;
  try {
    const { html, finalUrl } = await fetchPage(catalogUrl);
    productUrls = findProductUrls(html, finalUrl, limit);
  } catch (error) {
    discoveryError = error;
  }
  if (!productUrls.length && discoveryError && scraperMockPrices) {
    productUrls = SEED_PERFUME_URLS.slice(0, limit);
  }
  if (!productUrls.length) throw new Error("No se encontraron URLs de perfumes en Ripley.");

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
  priceFromText,
};
