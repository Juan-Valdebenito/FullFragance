const { getComparisonForCity, getComparisonForProduct } = require("../models/priceService");
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
    const { cityName, lat, lon, q } = req.query;
    if (!cityName || lat === undefined || lon === undefined) {
      return res.status(400).json({ error: "Se requiere cityName, lat y lon." });
    }
    const comparison = await getComparisonForCity({ cityName, lat, lon }, q);
    res.json({ comparison });
  } catch (err) {
    next(err);
  }
}

async function compareOneProduct(req, res, next) {
  try {
    const { cityName, lat, lon } = req.query;
    const { productId } = req.params;
    if (!cityName || lat === undefined || lon === undefined) {
      return res.status(400).json({ error: "Se requiere cityName, lat y lon." });
    }
    const result = await getComparisonForProduct({ cityName, lat, lon }, productId);
    if (!result) return res.status(404).json({ error: "Producto no encontrado." });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = { listProducts, comparePrices, compareOneProduct };
