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

function getOlfactoryNotes() {
  return readDb().olfactoryNotes || [];
}

function getNoteById(id) {
  return getOlfactoryNotes().find((n) => n.id === id) || null;
}

module.exports = {
  getProducts,
  getProductById,
  getChains,
  getOlfactoryNotes,
  getNoteById,
};
