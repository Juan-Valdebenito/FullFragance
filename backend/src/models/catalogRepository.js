const { readDb } = require("../data/database");
const { listProducts: listScrapedProducts } = require("../data/catalogDatabase");
const { normalizeBrand, samePerfume, tokenScore, isSet } = require("./productMatcher");

let cachedProducts = null;

function invalidateCatalogCache() {
  cachedProducts = null;
}

function inferGender(name) {
  const value = String(name || "").toLowerCase();
  if (/mujer|femenin|woman|lady/.test(value)) return "Femenino";
  if (/hombre|masculin|man\b/.test(value)) return "Masculino";
  return "Unisex";
}

function scentProfileFor(product, profiles) {
  return profiles.find((profile) =>
    normalizeBrand(profile.brand) === normalizeBrand(product.brand) &&
    tokenScore(profile, product) >= 0.6
  ) || null;
}

function toCatalogProduct(product, profiles = readDb().products) {
  const profile = scentProfileFor(product, profiles);
  return {
    id: `${product.source.replace(/-cl$/, "")}-${product.sku.toLowerCase()}`,
    name: product.name,
    brand: product.brand || "Sin marca",
    unit: product.presentation || "Presentación no informada",
    basePrice: product.price || 0,
    category: "Perfumes",
    gender: inferGender(product.name),
    notes: profile?.notes || [],
    source: product.source,
    sourceUrl: product.url,
    imageUrl: product.imageUrl || null,
    available: product.available,
    priceIsMock: Boolean(product.raw?.mockPrice),
    isSet: isSet(product),
    offers: [{
      source: product.source,
      sku: product.sku,
      price: product.price || 0,
      available: product.available,
      productUrl: product.url,
      priceIsMock: Boolean(product.raw?.mockPrice),
    }],
  };
}

function mergeScrapedProducts(products) {
  const profiles = readDb().products;

  // 1. Agrupar por marca normalizada para evitar comparaciones N^2 entre marcas distintas
  const byBrand = new Map();
  for (const product of products) {
    const brandKey = normalizeBrand(product.brand) || "unknown";
    let list = byBrand.get(brandKey);
    if (!list) {
      list = [];
      byBrand.set(brandKey, list);
    }
    list.push(product);
  }

  // 2. Realizar matching solo dentro del grupo de cada marca
  const groups = [];
  for (const brandProducts of byBrand.values()) {
    const brandGroups = [];
    for (const product of brandProducts) {
      const group = brandGroups.find((candidate) => candidate.some((item) => samePerfume(item, product)));
      if (group) group.push(product);
      else brandGroups.push([product]);
    }
    groups.push(...brandGroups);
  }

  return groups.map((group) => {
    const converted = group.map((product) => toCatalogProduct(product, profiles));
    const representative = converted.find((product) => product.source === "falabella-cl") || converted[0];
    // Un mismo scraper puede encontrar una ficha más de una vez al recorrer el
    // catálogo. Para comparar tiendas, sólo debe existir una oferta por cadena.
    const offersBySource = new Map();
    for (const offer of converted.flatMap((product) => product.offers)) {
      const current = offersBySource.get(offer.source);
      const shouldReplace = !current
        || (offer.available && !current.available)
        || (offer.available === current.available && offer.price > 0 && (!current.price || offer.price < current.price));
      if (shouldReplace) offersBySource.set(offer.source, offer);
    }
    const offers = [...offersBySource.values()];
    const positivePrices = offers.filter((offer) => offer.price > 0).map((offer) => offer.price);
    return {
      ...representative,
      source: offers.length > 1 ? "multi-store" : representative.source,
      sourceUrl: offers.length > 1 ? null : representative.sourceUrl,
      basePrice: positivePrices.length ? Math.min(...positivePrices) : 0,
      available: offers.some((offer) => offer.available),
      priceIsMock: offers.every((offer) => offer.priceIsMock),
      offers,
      matchedStores: offers.length,
      aliases: converted.map((product) => product.id),
    };
  });
}

function getProducts() {
  if (cachedProducts) return cachedProducts;
  const rawScraped = ["falabella-cl", "ripley-cl", "alisha-cl", "silk-cl"].flatMap((source) => listScrapedProducts(source));
  const scraped = mergeScrapedProducts(rawScraped);
  cachedProducts = [...scraped, ...readDb().products];
  return cachedProducts;
}

function getProductById(id) {
  return getProducts().find((product) => product.id === id || product.aliases?.includes(id)) || null;
}

function getChains() {
  return readDb().chains;
}

function getOlfactoryNotes() {
  return readDb().olfactoryNotes || [];
}

function getNoteById(id) {
  return getOlfactoryNotes().find((note) => note.id === id) || null;
}

module.exports = {
  getProducts,
  getProductById,
  getChains,
  getOlfactoryNotes,
  getNoteById,
  mergeScrapedProducts,
  invalidateCatalogCache,
};
