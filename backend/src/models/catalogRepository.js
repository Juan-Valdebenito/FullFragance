const { readDb } = require("../data/database");

function getProducts() {
  return readDb().products;
}

function getProductById(id) {
  return readDb().products.find((p) => p.id === id) || null;
}

function getChains() {
  return readDb().chains;
}

module.exports = { getProducts, getProductById, getChains };
