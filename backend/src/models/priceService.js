const { getProducts, getProductById } = require("./catalogRepository");
const { seededRandom, hashSeed } = require("../utils/random");
const { normalize } = require("./productMatcher");

const SOURCE_STORES = {
  "falabella-cl": { storeId: "falabella-online", storeName: "Falabella" },
  "ripley-cl": { storeId: "ripley-online", storeName: "Ripley" },
  "alisha-cl": { storeId: "alisha-online", storeName: "Alisha Perfumes" },
  "silk-cl": { storeId: "silk-online", storeName: "Silk Perfumes" },
  "elite-cl": { storeId: "elite-online", storeName: "Elite Perfumes" },
  "cosmetic-cl": { storeId: "cosmetic-online", storeName: "Cosmetic" },
  "paris-cl": { storeId: "paris-online", storeName: "Paris" },
  "abc-cl": { storeId: "abc-online", storeName: "ABC" },
  "preunic-cl": { storeId: "preunic-online", storeName: "Preunic" },
  "lodoro-cl": { storeId: "lodoro-online", storeName: "L'Odoro" },
};

function matchesProduct(product, productFilter) {
  if (!productFilter) return true;
  const queryTokens = normalize(productFilter)
    .split(" ")
    .filter((token) => token && !["perfume", "fragancia", "de", "del", "la", "el", "los", "las"].includes(token));
  if (!queryTokens.length) return true;
  const haystack = normalize([product.brand, product.name, product.category, product.unit].filter(Boolean).join(" "));
  return queryTokens.every((token) => haystack.includes(token));
}

function pricesForRealProduct(product) {
  if (Array.isArray(product.offers)) {
    return product.offers
      .filter((offer) => offer.price > 0)
      .map((offer) => {
        const store = SOURCE_STORES[offer.source];
        return {
          storeId: store?.storeId || `${offer.source}-online`,
          storeName: store?.storeName || offer.source,
          price: offer.price,
          available: Boolean(offer.available),
          productUrl: offer.productUrl,
        };
      })
      .sort((a, b) => a.price - b.price);
  }
  const sourceStore = SOURCE_STORES[product.source];
  return product.price || product.basePrice
    ? [{
        storeId: sourceStore?.storeId || `${product.source}-online`,
        storeName: sourceStore?.storeName || product.source,
        price: product.basePrice,
        available: Boolean(product.available),
        productUrl: product.sourceUrl,
      }]
    : [];
}

function pricesForProduct(product) {
  if (SOURCE_STORES[product.source] || product.source === "multi-store") return pricesForRealProduct(product);
  if (!product.basePrice) return [];
  return [{
    storeId: "catalog-reference",
    storeName: "Precio referencial",
    price: product.basePrice,
    available: Boolean(product.available),
  }];
}

async function getComparison(productFilter) {
  const catalogProducts = await getProducts();
  const matches = catalogProducts.filter((product) => matchesProduct(product, productFilter));
  // Al haber datos reales, el catálogo debe priorizarlos frente al demo simulado.
  const realProducts = matches.filter((product) => SOURCE_STORES[product.source] || product.source === "multi-store");
  const products = realProducts.length ? realProducts : matches;
  return products.map((product) => {
    const prices = pricesForProduct(product);
    const minPrice = prices[0]?.price ?? null;
    const historyData = generatePriceHistory(product.id, minPrice || product.basePrice || 0);
    return {
      product,
      prices,
      minPrice,
      maxPrice: prices[prices.length - 1]?.price ?? null,
      opportunity: historyData.opportunity,
    };
  });
}

function generatePriceHistory(productId, currentMinPrice) {
  const price = currentMinPrice || 50000;
  const history = [];
  const today = new Date();
  const seed = hashSeed(`history|${productId}`);

  for (let i = 89; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];

    if (i === 0) {
      history.push({ date: dateStr, price });
      continue;
    }

    const rng = seededRandom(seed + i * 17);
    const wave = Math.sin(i / 6) * 0.08;
    const noise = (rng() - 0.5) * 0.06;
    const flashSale = (i % 23 === 0) ? -0.15 : 0;
    const factor = 1 + wave + noise + flashSale;
    
    const historicalPrice = Math.max(1000, Math.round((price * factor) / 100) * 100);
    history.push({ date: dateStr, price: historicalPrice });
  }

  const points30 = history.slice(60);
  const prices30 = points30.map((p) => p.price);
  const prices90 = history.map((p) => p.price);

  const min30 = Math.min(...prices30);
  const min90 = Math.min(...prices90);
  const avg30 = Math.round(prices30.reduce((a, b) => a + b, 0) / prices30.length);

  let opportunity = {
    code: "stable",
    label: "📊 Precio estable",
    type: "stable",
  };

  if (price <= min30) {
    opportunity = { code: "lowest_30", label: "🔥 Precio más bajo en 30 días", type: "lowest_30" };
  } else if (price <= min90) {
    opportunity = { code: "lowest_90", label: "🔥 Precio más bajo en 90 días", type: "lowest_90" };
  } else if (price < avg30 * 0.95) {
    const pct = Math.round(((avg30 - price) / avg30) * 100);
    opportunity = { code: "great_deal", label: `📉 ${pct}% más barato que el promedio`, type: "great_deal" };
  } else if (price > avg30 * 1.05) {
    opportunity = { code: "trending_up", label: "📈 Precio en alza", type: "trending_up" };
  }

  return {
    history,
    history30d: points30,
    history90d: history,
    min30d: min30,
    min90d: min90,
    avg30d: avg30,
    opportunity,
  };
}

async function getComparisonForProduct(productId) {
  const product = await getProductById(productId);
  if (!product) return null;
  const prices = pricesForProduct(product);

  const currentMinPrice = prices[0]?.price || product.basePrice || 0;
  const historyData = generatePriceHistory(product.id, currentMinPrice);

  return {
    product,
    prices,
    minPrice: currentMinPrice,
    maxPrice: prices[prices.length - 1]?.price || currentMinPrice,
    priceHistory: historyData.history90d,
    priceHistory30d: historyData.history30d,
    opportunity: historyData.opportunity,
    stats: {
      min30d: historyData.min30d,
      min90d: historyData.min90d,
      avg30d: historyData.avg30d,
    },
  };
}

module.exports = { getComparison, getComparisonForProduct, generatePriceHistory };
