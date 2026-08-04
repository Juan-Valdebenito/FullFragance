const { getComparison, getComparisonForProduct } = require("../models/priceService");
const { getProducts } = require("../models/catalogRepository");

async function listProducts(req, res, next) {
  try {
    res.json({ products: await getProducts() });
  } catch (err) {
    next(err);
  }
}

async function comparePrices(req, res, next) {
  try {
    const { q } = req.query;
    const comparison = await getComparison(q);
    res.json({ comparison });
  } catch (err) {
    next(err);
  }
}

async function compareOneProduct(req, res, next) {
  try {
    const { productId } = req.params;
    const result = await getComparisonForProduct(productId);
    if (!result) return res.status(404).json({ error: "Producto no encontrado." });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = { listProducts, comparePrices, compareOneProduct };
