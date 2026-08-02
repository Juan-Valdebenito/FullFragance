const catalogRepository = require("../models/catalogRepository");

async function listNotes(_req, res, next) {
  try {
    const notes = await catalogRepository.getOlfactoryNotes();
    res.json({ notes });
  } catch (err) {
    next(err);
  }
}

async function listProducts(_req, res, next) {
  try {
    const products = await catalogRepository.getProducts();
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
    res.json({ products });
  } catch (err) {
    next(err);
  }
}

async function dealOfDay(_req, res, next) {
  try {
    const best = (await getBestDeals())[0];

    if (!best) return res.json({ deal: null });

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

module.exports = { listNotes, listProducts, featuredProducts, dealOfDay, dealsOfDay };
