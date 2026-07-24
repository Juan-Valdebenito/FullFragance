const { getProducts, getProductById } = require("./catalogRepository");
const { getStoresForCity } = require("./storeService");
const { seededRandom, hashSeed } = require("../utils/geo");
const { normalize } = require("./productMatcher");

const SOURCE_STORES = {
  "falabella-cl": { storeId: "falabella-online", storeName: "Falabella" },
  "ripley-cl": { storeId: "ripley-online", storeName: "Ripley" },
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
    return { product, prices, minPrice: prices[0]?.price ?? null, maxPrice: prices[prices.length - 1]?.price ?? null };
  });
}

async function getComparisonForProduct({ cityName, lat, lon }, productId) {
  const product = getProductById(productId);
  if (!product) return null;
  if (SOURCE_STORES[product.source] || product.source === "multi-store") {
    return { product, prices: pricesForRealProduct(product) };
  }
  const stores = await getStoresForCity({ cityName, lat, lon });
  return { product, prices: pricesForProduct(cityName, stores, product) };
}

module.exports = { getComparisonForCity, getComparisonForProduct };
