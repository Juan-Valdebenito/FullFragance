const { readDb } = require("../data/database");
const { listProducts: listScrapedProducts } = require("../data/catalogDatabase");

function inferGender(name) {
  const value = String(name || "").toLowerCase();
  if (/mujer|femenin|woman|lady/.test(value)) return "Femenino";
  if (/hombre|masculin|man\b/.test(value)) return "Masculino";
  return "Unisex";
}

function toCatalogProduct(product) {
  return {
    id: `falabella-${product.sku}`,
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
  };
}

function getProducts() {
  const scraped = listScrapedProducts("falabella-cl").map(toCatalogProduct);
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

module.exports = { getProducts, getProductById, getChains, getOlfactoryNotes, getNoteById };
