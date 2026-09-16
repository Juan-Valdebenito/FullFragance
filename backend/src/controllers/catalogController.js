const catalogRepository = require("../models/catalogRepository");

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

async function getBestDeals() {
  const allProducts = await catalogRepository.getProducts();
  const products = allProducts
    .filter((product) => product.available && product.basePrice > 0 && product.offers?.length > 1)
    .map((product) => {
      const prices = product.offers.map((offer) => offer.price).filter((price) => price > 0);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      const savings = maxPrice - minPrice;
      const savingsPct = maxPrice > 0 ? Math.round((savings / maxPrice) * 100) : 0;
      return { product, minPrice, maxPrice, savings, savingsPct };
    })
    .filter((deal) => Number.isFinite(deal.minPrice) && Number.isFinite(deal.maxPrice))
    .sort((first, second) => second.savings - first.savings || second.savingsPct - first.savingsPct);

  if (products.length) return products.slice(0, 5);

  const fallback = allProducts
    .filter((product) => product.available && product.basePrice > 0)
    .sort((first, second) => (second.matchedStores || 0) - (first.matchedStores || 0) || first.basePrice - second.basePrice)
    .slice(0, 5)
    .map((product) => ({
      product,
      minPrice: product.basePrice,
      maxPrice: product.basePrice,
      savings: 0,
      savingsPct: 0,
    }));

  return fallback;
}

module.exports = { listNotes, listProducts, featuredProducts, dealOfDay, dealsOfDay, catalogCacheHeader };
