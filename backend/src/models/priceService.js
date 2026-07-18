const { getProducts, getProductById } = require("./catalogRepository");
const { getStoresForCity } = require("./storeService");
const { seededRandom, hashSeed } = require("../utils/geo");

// IMPORTANTE: estos precios son simulados con un generador determinista
// (misma ciudad + producto + tienda -> siempre el mismo precio) para que la
// demo se sienta consistente. El punto de reemplazo real es esta función:
// cuando exista una fuente de datos de precios real, esta es la pieza a cambiar.
function priceFor(cityName, storeId, product) {
  const rng = seededRandom(hashSeed(`${cityName}|${storeId}|${product.id}`));
  const variation = (rng() - 0.5) * 0.35; // +/-17.5%
  return Math.max(300, Math.round(product.basePrice * (1 + variation)));
}

function getComparisonForCity({ cityName, lat, lon }, productFilter) {
  const stores = getStoresForCity({ cityName, lat, lon });
  const products = getProducts().filter((p) => {
    if (!productFilter) return true;
    const q = productFilter.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      (p.brand && p.brand.toLowerCase().includes(q)) ||
      (p.category && p.category.toLowerCase().includes(q))
    );
  });

  return products.map((product) => {
    const prices = stores
      .map((store) => ({
        storeId: store.id,
        storeName: store.name,
        price: priceFor(cityName, store.id, product),
      }))
      .sort((a, b) => a.price - b.price);

    return {
      product,
      prices,
      minPrice: prices[0]?.price ?? null,
      maxPrice: prices[prices.length - 1]?.price ?? null,
    };
  });
}

function getComparisonForProduct({ cityName, lat, lon }, productId) {
  const product = getProductById(productId);
  if (!product) return null;
  const stores = getStoresForCity({ cityName, lat, lon });
  const prices = stores
    .map((store) => ({
      storeId: store.id,
      storeName: store.name,
      price: priceFor(cityName, store.id, product),
    }))
    .sort((a, b) => a.price - b.price);
  return { product, prices };
}

module.exports = { getComparisonForCity, getComparisonForProduct };
