const catalogRepository = require("../models/catalogRepository");
const catalogSearch = require("../models/catalogSearch");

// El catálogo se refresca por cron cada varias horas, así que el navegador y el
// CDN pueden servirlo sin volver a golpear el backend durante la navegación.
function catalogCacheHeader(res) {
  res.set("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
}

async function listNotes(_req, res, next) {
  try {
    const notes = await catalogRepository.getOlfactoryNotes();
    catalogCacheHeader(res);
    res.json({ notes });
  } catch (err) {
    next(err);
  }
}

async function listProducts(_req, res, next) {
  try {
    const products = await catalogRepository.getProducts();
    catalogCacheHeader(res);
    res.json({ products });
  } catch (err) {
    next(err);
  }
}

async function featuredProducts(_req, res, next) {
  try {
    const allProducts = await catalogRepository.getProducts();
    const products = allProducts
      .filter((product) => product.available && product.basePrice > 0)
      .sort((first, second) => {
        const comparison = (second.matchedStores || 0) - (first.matchedStores || 0);
        return comparison || first.basePrice - second.basePrice;
      })
      .slice(0, 10);
    catalogCacheHeader(res);
    res.json({ products });
  } catch (err) {
    next(err);
  }
}

async function dealOfDay(_req, res, next) {
  try {
    const best = (await getBestDeals())[0];

    if (!best) return res.json({ deal: null });

    catalogCacheHeader(res);
    res.json({
      deal: best.product,
      minPrice: best.minPrice,
      maxPrice: best.maxPrice,
      savings: best.savings,
      savingsPct: best.savingsPct,
    });
  } catch (err) {
    next(err);
  }
}

async function dealsOfDay(_req, res, next) {
  try {
    const deals = await getBestDeals();
    catalogCacheHeader(res);
    res.json({
      deals: deals.map(({ product, minPrice, maxPrice, savings, savingsPct }) => ({
        deal: product,
        minPrice,
        maxPrice,
        savings,
        savingsPct,
      })),
    });
  } catch (err) {
    next(err);
  }
}

// Cantidad de ofertas que se envían al frontend; el cliente las baraja y
// muestra solo algunas, así la portada no repite siempre los mismos perfumes.
const DEALS_POOL_SIZE = 30;
// Algunas tiendas publican precios de relleno (ej. $9.999.999) en productos sin
// stock real. Se descartan los precios absurdos y, con 3+ tiendas, los que se
// alejan demasiado de la mediana del producto.
const MAX_REALISTIC_PRICE = 3000000;
const OUTLIER_FACTOR = 3;
const MAX_REALISTIC_SAVINGS_PCT = 80;

function median(values) {
  const sorted = [...values].sort((first, second) => first - second);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function realisticPrices(offers) {
  const prices = offers.map((offer) => offer.price).filter((price) => price > 0 && price < MAX_REALISTIC_PRICE);
  if (prices.length < 3) return prices;
  const reference = median(prices);
  return prices.filter((price) => price <= reference * OUTLIER_FACTOR && price >= reference / OUTLIER_FACTOR);
}

async function getBestDeals() {
  const allProducts = await catalogRepository.getProducts();
  const products = allProducts
    .filter((product) => product.available && product.basePrice > 0)
    // El ahorro se mide solo entre tiendas con stock: comparar contra una
    // tienda agotada inflaba el descuento de la oferta.
    .map((product) => ({ product, offers: (product.offers ?? []).filter((offer) => offer.available) }))
    .filter(({ offers }) => offers.length > 1)
    .map(({ product, offers }) => {
      const prices = realisticPrices(offers);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      const savings = maxPrice - minPrice;
      const savingsPct = maxPrice > 0 ? Math.round((savings / maxPrice) * 100) : 0;
      return { product, minPrice, maxPrice, savings, savingsPct };
    })
    .filter((deal) => Number.isFinite(deal.minPrice) && Number.isFinite(deal.maxPrice))
    .filter((deal) => deal.savings > 0 && deal.savingsPct <= MAX_REALISTIC_SAVINGS_PCT)
    .sort((first, second) => second.savings - first.savings || second.savingsPct - first.savingsPct);

  if (products.length) return products.slice(0, DEALS_POOL_SIZE);

  const fallback = allProducts
    .filter((product) => product.available && product.basePrice > 0)
    .sort((first, second) => (second.matchedStores || 0) - (first.matchedStores || 0) || first.basePrice - second.basePrice)
    .slice(0, DEALS_POOL_SIZE)
    .map((product) => ({
      product,
      minPrice: product.basePrice,
      maxPrice: product.basePrice,
      savings: 0,
      savingsPct: 0,
    }));

  return fallback;
}

// Búsqueda paginada del catálogo: filtros, orden y opciones de los selectores
// se resuelven aquí y sólo viaja la página pedida.
async function searchProducts(req, res, next) {
  try {
    const result = await catalogSearch.searchCatalog(req.query);
    catalogCacheHeader(res);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function similarProducts(req, res, next) {
  try {
    const items = await catalogSearch.similarComparables(req.params.productId);
    if (!items) return res.status(404).json({ error: "Producto no encontrado." });
    catalogCacheHeader(res);
    res.json({ items });
  } catch (err) {
    next(err);
  }
}

// Ids para el sitemap: evita descargar el catálogo completo sólo para listar URLs.
async function productIds(_req, res, next) {
  try {
    const ids = await catalogSearch.catalogIds();
    catalogCacheHeader(res);
    res.json({ ids });
  } catch (err) {
    next(err);
  }
}

module.exports = { listNotes, listProducts, featuredProducts, dealOfDay, dealsOfDay, searchProducts, productIds, similarProducts, catalogCacheHeader };
