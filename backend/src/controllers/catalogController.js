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

function dealOfDay(_req, res, next) {
  try {
    const products = catalogRepository.getProducts()
      .filter((p) => p.available && p.basePrice > 0 && p.offers && p.offers.length > 1);

    if (!products.length) {
      // Fallback: producto disponible con mayor basePrice (más exclusivo)
      const fallback = catalogRepository.getProducts()
        .filter((p) => p.available && p.basePrice > 0)
        .sort((a, b) => b.matchedStores - a.matchedStores || a.basePrice - b.basePrice)
        .slice(0, 1)[0] || null;
      return res.json({ deal: fallback });
    }

    // Elige el producto con mayor diferencia de precio entre tiendas
    const best = products
      .map((p) => {
        const prices = p.offers.map((o) => o.price).filter((price) => price > 0);
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        const savings = maxPrice - minPrice;
        const savingsPct = minPrice > 0 ? Math.round((savings / maxPrice) * 100) : 0;
        return { product: p, minPrice, maxPrice, savings, savingsPct };
      })
      .sort((a, b) => b.savings - a.savings)[0];

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

module.exports = { listNotes, listProducts, featuredProducts, dealOfDay };
