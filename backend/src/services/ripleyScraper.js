const fs = require("fs/promises");
const path = require("path");
const { execFile } = require("child_process");
const { promisify } = require("util");
const {
  ripleyUserAgent,
  ripleyMinDelayMs,
  ripleyMaxDelayMs,
  ripleyRequestTimeoutMs,
  ripleyCurlFallback,
  ripleyFixtureDir,
  ripleyPerfumesUrl,
  scraperMockPrices,
} = require("../config/env");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const execFileAsync = promisify(execFile);
let lastRequestAt = 0;

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

function buildRipleyCatalogPageUrl(page = 1) {
  const url = new URL(assertRipleyUrl(ripleyPerfumesUrl));
  if (!/^\/belleza\/perfumeria\/?$/i.test(url.pathname)) {
    throw new Error("El catálogo de Ripley debe usar exclusivamente /belleza/perfumeria.");
  }
  url.searchParams.set("source", "menu");
  url.searchParams.set("s", "mdco");
  if (page > 1) url.searchParams.set("page", String(page));
  else url.searchParams.delete("page");
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
    if (!ripleyCurlFallback) {
      throw new Error("Ripley bloqueó la consulta automática (HTTP 403).");
    }
    try {
      const { stdout } = await execFileAsync("curl", [
        "--fail",
        "--location",
        "--compressed",
        "--silent",
        "--show-error",
        "--max-time",
        String(Math.ceil(ripleyRequestTimeoutMs / 1000)),
        "--user-agent",
        ripleyUserAgent,
        "--header",
        "Accept: text/html,application/xhtml+xml",
        url,
      ], { maxBuffer: 8 * 1024 * 1024 });
      return { html: stdout, finalUrl: url };
    } catch {
      throw new Error("Ripley bloqueó la consulta automática (HTTP 403).");
    }
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

function findNextData(html) {
  const match = String(html || "").match(/<script[^>]+id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i);
  if (!match) return null;
  try {
    return JSON.parse(match[1].trim());
  } catch {
    return null;
  }
}

function extractCollectionProducts(html) {
  const nextData = findNextData(html);
  const products = nextData?.props?.pageProps?.findabilityProps?.data?.products;
  return Array.isArray(products) ? products : [];
}

async function scrapeDirectCatalogPage(page = 1) {
  const pageUrl = buildRipleyCatalogPageUrl(page);
  const { html, finalUrl } = await fetchPage(pageUrl);
  const nextData = findNextData(html);
  const data = nextData?.props?.pageProps?.findabilityProps?.data || {};
  const cards = extractCollectionProducts(html);
  const productUrls = findProductUrls(html, finalUrl, cards.length + 20);
  const products = cards
    .filter((card) => String(card.seller || "").toUpperCase() === "RIPLEY")
    .filter((card, index, all) => all.findIndex((candidate) =>
      String(candidate.parentProductID || candidate.sku) === String(card.parentProductID || card.sku)
    ) === index)
    .map((card) => normalizeCollectionProduct(card, finalUrl, productUrls));
  const totalPages = Math.max(1, Math.ceil(Number(data.total || cards.length) / Number(data.limit || 48)));
  const sellerFacet = data.aggregations?.facets?.find((facet) => facet.code === "seller_facet");
  const directTotal = Number(sellerFacet?.values?.find((value) => String(value.code).toLowerCase() === "ripley")?.count) || null;
  return { products, page, totalPages, scanned: cards.length, directTotal };
}

function normalizeCollectionProduct(card, pageUrl, productUrls = []) {
  const sku = String(card.parentProductID || card.sku || "").trim().toUpperCase();
  if (!sku) throw new Error("El listado de Ripley no expone un SKU.");
  const name = String(card.name || card.description || "").trim();
  const matchedUrl = productUrls.find((candidate) => ripleyProductIdFromUrl(candidate) === sku);
  const fallbackSlug = normalizeCandidate(name)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return {
    source: "ripley-cl",
    sku,
    brand: card.brand || inferBrandFromName(name),
    name,
    price: Number(card.priceNumber) || parsePrice(card.price) || parsePrice(card.ripleyPrice),
    currency: "CLP",
    presentation: extractPresentation(name, card.description),
    imageUrl: card.primaryImage || card.images?.[0] || buildRipleyImageUrl(sku),
    available: (Number(card.priceNumber) || parsePrice(card.price) || 0) > 0,
    url: matchedUrl || new URL(`/${fallbackSlug}-${sku.toLowerCase()}`, pageUrl).toString(),
    raw: { collectionCard: true, seller: card.seller || card.shop?.shopName || null },
  };
}

function stripTags(html) {
  return String(html || "").replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ");
}

function parsePrice(value) {
  const digits = String(value || "").replace(/[^\d]/g, "");
  return digits ? Number(digits) : null;
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

function buildRipleyImageUrl(sku) {
  const value = String(sku || "").trim().replace(/P$/i, "");
  return /^\d+$/.test(value) ? `https://ripley.scene7.com/is/image/Ripley/${value}` : null;
}

function extractImageFromHtml(html, sku) {
  const match =
    String(html || "").match(/property=["']og:image["'][^>]+content=["']([^"']+)/i) ||
    String(html || "").match(/content=["']([^"']+)["'][^>]+property=["']og:image/i);
  return match?.[1] || buildRipleyImageUrl(sku);
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
    imageUrl: buildRipleyImageUrl(sku),
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
    imageUrl: extractImage(jsonLd.image) || extractImageFromHtml(html, sku),
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
    return {
      ...fallback,
      price,
      imageUrl: extractImageFromHtml(html, fallback.sku),
      available: true,
      raw: { ...fallback.raw, fallback: true, mockPrice: false },
    };
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
  const limit = Math.min(Math.max(Number(maxProducts) || 12, 1), 60);
  const catalogUrl = buildRipleyCatalogPageUrl(1);
  let productUrls = [];
  let discoveryError = null;
  try {
    const { html, finalUrl } = await fetchPage(catalogUrl);
    productUrls = findProductUrls(html, finalUrl, limit);
    const collectionCards = extractCollectionProducts(html)
      .filter((card, index, cards) => cards.findIndex((candidate) =>
        String(candidate.parentProductID || candidate.sku) === String(card.parentProductID || card.sku)
      ) === index)
      .slice(0, limit);
    const collectionProducts = collectionCards
      .map((card) => normalizeCollectionProduct(card, finalUrl, productUrls));
    if (collectionProducts.length) {
      return collectionProducts.map((product) => ({ url: product.url, ok: true, product }));
    }
  } catch (error) {
    discoveryError = error;
  }
  if (!productUrls.length) {
    const reason = discoveryError ? ` Último error: ${discoveryError.message}` : "";
    throw new Error(`No se encontraron productos reales en Ripley.${reason}`);
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
  priceFromText,
  buildRipleyImageUrl,
  extractImageFromHtml,
  extractCollectionProducts,
  normalizeCollectionProduct,
  scrapeDirectCatalogPage,
  buildRipleyCatalogPageUrl,
};
