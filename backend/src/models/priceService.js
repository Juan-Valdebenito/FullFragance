const { getProducts, getProductById } = require("./catalogRepository");
const { getStoresForCity } = require("./storeService");
const { seededRandom, hashSeed } = require("../utils/geo");
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
};

function priceFor(cityName, storeId, product) {
  const rng = seededRandom(hashSeed(`${cityName}|${storeId}|${product.id}`));
  const variation = (rng() - 0.5) * 0.35;
  return Math.max(300, Math.round(product.basePrice * (1 + variation)));
}

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

function pricesForProduct(cityName, stores, product) {
  if (SOURCE_STORES[product.source] || product.source === "multi-store") return pricesForRealProduct(product);
  return stores.map((store) => ({
    storeId: store.id,
    storeName: store.name,
    price: priceFor(cityName, store.id, product),
    available: true,
  })).sort((a, b) => a.price - b.price);
}

async function getComparisonForCity({ cityName, lat, lon }, productFilter) {
  const matches = getProducts().filter((product) => matchesProduct(product, productFilter));
  // Al haber datos reales, el catálogo debe priorizarlos frente al demo simulado.
  const realProducts = matches.filter((product) => SOURCE_STORES[product.source] || product.source === "multi-store");
  const products = realProducts.length ? realProducts : matches;
  let stores = [];
  if (products.some((product) => !SOURCE_STORES[product.source] && product.source !== "multi-store")) {
    try {
      stores = await getStoresForCity({ cityName, lat, lon });
    } catch {
      // Un producto real de marketplace sigue siendo útil aunque falle la búsqueda de sucursales OSM.
    }
  }
  return products.map((product) => {
    const prices = pricesForProduct(cityName, stores, product);
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

async function getComparisonForProduct({ cityName, lat, lon }, productId) {
  const product = getProductById(productId);
  if (!product) return null;
  let prices = [];
  if (SOURCE_STORES[product.source] || product.source === "multi-store") {
    prices = pricesForRealProduct(product);
  } else {
    const stores = await getStoresForCity({ cityName, lat, lon });
    prices = pricesForProduct(cityName, stores, product);
  }

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

module.exports = { getComparisonForCity, getComparisonForProduct, generatePriceHistory };
