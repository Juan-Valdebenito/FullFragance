const { getProducts, getProductById } = require("./catalogRepository");
const { getStoresForCity } = require("./storeService");
const { seededRandom, hashSeed } = require("../utils/geo");

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
  const query = productFilter.toLowerCase();
  return [product.name, product.brand, product.category, product.unit]
    .filter(Boolean)
    .some((value) => value.toLowerCase().includes(query));
}

function pricesForRealProduct(product) {
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
  if (SOURCE_STORES[product.source]) return pricesForRealProduct(product);
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
  const realProducts = matches.filter((product) => SOURCE_STORES[product.source]);
  const products = realProducts.length ? realProducts : matches;
  let stores = [];
  if (products.some((product) => !SOURCE_STORES[product.source])) {
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
  if (SOURCE_STORES[product.source]) {
    return { product, prices: pricesForRealProduct(product) };
  }
  const stores = await getStoresForCity({ cityName, lat, lon });
  return { product, prices: pricesForProduct(cityName, stores, product) };
}

module.exports = { getComparisonForCity, getComparisonForProduct };
