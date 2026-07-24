const catalogRepository = require("../models/catalogRepository");

function listNotes(_req, res, next) {
  try {
    res.json({ notes: catalogRepository.getOlfactoryNotes() });
  } catch (err) {
    next(err);
  }
}

function listProducts(_req, res, next) {
  try {
    res.json({ products: catalogRepository.getProducts() });
  } catch (err) {
    next(err);
  }
}

function featuredProducts(_req, res, next) {
  try {
    const products = catalogRepository.getProducts()
      .filter((product) => product.available && product.basePrice > 0)
      .sort((first, second) => {
        const comparison = (second.matchedStores || 0) - (first.matchedStores || 0);
        return comparison || first.basePrice - second.basePrice;
      })
      .slice(0, 3);
    res.json({ products });
  } catch (err) {
    next(err);
  }
}

module.exports = { listNotes, listProducts, featuredProducts };
