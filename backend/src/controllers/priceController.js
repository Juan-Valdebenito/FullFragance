const { getComparison, getComparisonForProduct } = require("../models/priceService");
const { getProductsPayload } = require("../models/catalogRepository");
const { catalogCacheHeader } = require("./catalogController");

async function listProducts(req, res, next) {
  try {
    catalogCacheHeader(res);
    const payload = await getProductsPayload();
    // Servimos el JSON ya serializado (y gzipeado si el cliente lo acepta) en
    // vez de volver a stringify+comprimir en cada visita: bajo trafico alto
    // (cyberday) es la diferencia entre milisegundos y varios segundos de CPU
    // por request en un servidor de un solo proceso.
    if (req.acceptsEncodings("gzip") === "gzip") {
      res.set("Content-Encoding", "gzip");
      res.type("json").send(payload.gzip);
    } else {
      res.type("json").send(payload.json);
    }
  } catch (err) {
    next(err);
  }
}

async function comparePrices(req, res, next) {
  try {
    const { q } = req.query;
    const comparison = await getComparison(q);
    catalogCacheHeader(res);
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
    catalogCacheHeader(res);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = { listProducts, comparePrices, compareOneProduct };
