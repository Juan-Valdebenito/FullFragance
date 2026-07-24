const { readDb } = require("../data/database");
const { listProducts: listScrapedProducts } = require("../data/catalogDatabase");
const { samePerfume } = require("./productMatcher");

function inferGender(name) {
  const value = String(name || "").toLowerCase();
  if (/mujer|femenin|woman|lady/.test(value)) return "Femenino";
  if (/hombre|masculin|man\b/.test(value)) return "Masculino";
  return "Unisex";
}

function toCatalogProduct(product) {
  return {
    id: `${product.source.replace(/-cl$/, "")}-${product.sku.toLowerCase()}`,
    name: product.name,
    brand: product.brand || "Sin marca",
    unit: product.presentation || "Presentación no informada",
    basePrice: product.price || 0,
    category: "Perfumes",
    gender: inferGender(product.name),
    notes: [],
    source: product.source,
    sourceUrl: product.url,
    imageUrl: product.imageUrl || null,
    available: product.available,
    priceIsMock: Boolean(product.raw?.mockPrice),
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
  const groups = [];
  for (const product of products) {
    const group = groups.find((candidate) => candidate.some((item) => samePerfume(item, product)));
    if (group) group.push(product);
    else groups.push([product]);
  }

  return groups.map((group) => {
    const converted = group.map(toCatalogProduct);
    const representative = converted.find((product) => product.source === "falabella-cl") || converted[0];
    const offers = converted.flatMap((product) => product.offers);
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
    };
  });
}

function getProducts() {
  const rawScraped = ["falabella-cl", "ripley-cl"].flatMap((source) => listScrapedProducts(source));
  const scraped = mergeScrapedProducts(rawScraped);
  return [...scraped, ...readDb().products];
}

function getProductById(id) {
  return getProducts().find((product) => product.id === id) || null;
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

module.exports = { getProducts, getProductById, getChains, getOlfactoryNotes, getNoteById, mergeScrapedProducts };
