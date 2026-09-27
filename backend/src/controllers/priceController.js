const { getComparison, getComparisonForProduct } = require("../models/priceService");
const { getProducts } = require("../models/catalogRepository");
const { comparisonsByIds } = require("../models/catalogSearch");
const { requireAdmin } = require("../middleware/authMiddleware");
const { catalogCacheHeader } = require("./catalogController");

const PRODUCTS_PAGE_SIZE = 50;
const MAX_PRODUCTS_PAGE_SIZE = 200;
const MAX_QUERY_RESULTS = 100;
const MAX_IDS = 200;

function clampInt(value, fallback, min, max) {
  const number = Number.parseInt(value, 10);
  return Number.isFinite(number) ? Math.min(Math.max(number, min), max) : fallback;
}

// Antes devolvía los ~11.000 productos completos (~20 MB sin comprimir) en cada
// llamada. Ahora es paginado; para recorrer el catálogo se usa /catalog/search.
async function listProducts(req, res, next) {
  try {
    const products = await getProducts();
    const pageSize = clampInt(req.query.pageSize, PRODUCTS_PAGE_SIZE, 1, MAX_PRODUCTS_PAGE_SIZE);
    const totalPages = Math.max(1, Math.ceil(products.length / pageSize));
    const page = clampInt(req.query.page, 1, 1, totalPages);
    catalogCacheHeader(res);
    res.json({
      products: products.slice((page - 1) * pageSize, page * pageSize),
      total: products.length,
      page,
      pageSize,
      totalPages,
    });
  } catch (err) {
    next(err);
  }
}

async function comparePrices(req, res, next) {
  try {
    const ids = typeof req.query.ids === "string"
      ? req.query.ids.split(",").map((id) => id.trim()).filter(Boolean).slice(0, MAX_IDS)
      : [];
    if (ids.length) {
      catalogCacheHeader(res);
      return res.json({ comparison: await comparisonsByIds(ids) });
    }

    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
    if (q) {
      const comparison = await getComparison(q);
      catalogCacheHeader(res);
      return res.json({ comparison: comparison.slice(0, MAX_QUERY_RESULTS), total: comparison.length });
    }

    // El catálogo completo sólo lo necesita el panel de administración; el
    // público usa /catalog/search, que devuelve una página a la vez.
    return requireAdmin(req, res, async () => {
      try {
        res.set("Cache-Control", "private, no-store");
        res.json({ comparison: await getComparison("") });
      } catch (err) {
        next(err);
      }
    });
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
