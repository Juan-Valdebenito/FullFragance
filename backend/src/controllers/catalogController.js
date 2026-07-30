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
    const allProducts = await catalogRepository.getProducts();
    const products = allProducts
      .filter((p) => p.available && p.basePrice > 0 && p.offers && p.offers.length > 1);

    if (!products.length) {
      // Fallback: producto disponible con mayor basePrice (más exclusivo)
      const fallback = allProducts
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
