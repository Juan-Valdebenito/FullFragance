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
  "leparis-cl": { storeId: "leparis-online", storeName: "Le Paris Parfums" },
  "dreams-cl": { storeId: "dreams-online", storeName: "Dreams Parfums" },
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

// Primero las tiendas con stock y, dentro de cada grupo, de más barata a más
// cara: así prices[0] es siempre la mejor compra posible y una tienda sin stock
// no aparece como "más barata" en la tarjeta ni en el detalle.
function byAvailabilityThenPrice(a, b) {
  return Number(b.available) - Number(a.available) || a.price - b.price;
}

// Rango de precios de lo que se puede comprar. Si ninguna tienda tiene stock se
// usa el rango completo para no dejar el perfume sin precio.
function priceRange(prices) {
  const buyable = prices.filter((price) => price.available);
  const pool = (buyable.length ? buyable : prices).map((price) => price.price);
  return pool.length ? { min: Math.min(...pool), max: Math.max(...pool) } : { min: null, max: null };
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
      .sort(byAvailabilityThenPrice);
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

// El listado sólo alimenta las tarjetas del catálogo. La descripción generada,
// las notas olfativas resueltas y las ofertas crudas (ya representadas en
// `prices`) sumaban la mayor parte de los bytes enviados y sólo las usa el
// detalle, que se pide producto a producto.
function listProduct(product) {
  return {
    id: product.id,
    name: product.name,
    brand: product.brand,
    unit: product.unit,
    basePrice: product.basePrice,
    category: product.category,
    gender: product.gender,
    notes: product.notes,
    source: product.source,
    imageUrl: product.imageUrl,
    imageUrls: product.imageUrls,
    available: product.available,
    priceIsMock: product.priceIsMock,
    matchedStores: product.matchedStores,
    aliases: product.aliases,
  };
}

// El catálogo sin filtro es lo que piden el explorador, favoritos y el panel
// admin en cada visita. `getProducts()` devuelve siempre el mismo arreglo hasta
// que un scraper invalida el caché, así que su identidad sirve de marca de
// versión: si cambia, este resultado se recomputa solo.
let cachedComparison = null;
let cachedComparisonSource = null;

async function getComparison(productFilter) {
  const catalogProducts = await getProducts();
  if (!productFilter && cachedComparisonSource === catalogProducts) return cachedComparison;

  const matches = catalogProducts.filter((product) => matchesProduct(product, productFilter));
  // Al haber datos reales, el catálogo debe priorizarlos frente al demo simulado.
  const realProducts = matches.filter((product) => SOURCE_STORES[product.source] || product.source === "multi-store");
  const products = realProducts.length ? realProducts : matches;
  const comparison = products.map((product) => {
    const prices = pricesForProduct(product);
    const range = priceRange(prices);
    return {
      product: listProduct(product),
      // La tarjeta imprime tienda, precio y si hay stock (para no destacar una
      // tienda agotada); el enlace y la etiqueta de oportunidad viven en el
      // detalle, que se pide por producto.
      prices: prices.map(({ storeId, storeName, price, available }) => ({ storeId, storeName, price, available })),
      minPrice: range.min,
      maxPrice: range.max,
    };
  });

  if (!productFilter) {
    cachedComparisonSource = catalogProducts;
    cachedComparison = comparison;
  }
  return comparison;
}

const HISTORY_DAYS = 90;

// Serie de precios sin fechas: el listado sólo necesita los números para
// deducir la etiqueta de oportunidad. Construir los 90 Date + toISOString por
// producto costaba más que todo el resto del endpoint junto y se descartaba.
function priceSeries(productId, currentMinPrice) {
  const price = currentMinPrice || 50000;
  const seed = hashSeed(`history|${productId}`);
  const prices = [];

  for (let i = HISTORY_DAYS - 1; i >= 0; i--) {
    if (i === 0) {
      prices.push(price);
      continue;
    }
    const rng = seededRandom(seed + i * 17);
    const wave = Math.sin(i / 6) * 0.08;
    const noise = (rng() - 0.5) * 0.06;
    const flashSale = (i % 23 === 0) ? -0.15 : 0;
    const factor = 1 + wave + noise + flashSale;
    prices.push(Math.max(1000, Math.round((price * factor) / 100) * 100));
  }

  return prices;
}

function priceStats(prices) {
  const prices30 = prices.slice(60);
  return {
    min30d: Math.min(...prices30),
    min90d: Math.min(...prices),
    avg30d: Math.round(prices30.reduce((total, value) => total + value, 0) / prices30.length),
  };
}

function opportunityFor(price, { min30d, min90d, avg30d }) {
  if (price <= min30d) return { code: "lowest_30", label: "🔥 Precio más bajo en 30 días", type: "lowest_30" };
  if (price <= min90d) return { code: "lowest_90", label: "🔥 Precio más bajo en 90 días", type: "lowest_90" };
  if (price < avg30d * 0.95) {
    const pct = Math.round(((avg30d - price) / avg30d) * 100);
    return { code: "great_deal", label: `📉 ${pct}% más barato que el promedio`, type: "great_deal" };
  }
  if (price > avg30d * 1.05) return { code: "trending_up", label: "📈 Precio en alza", type: "trending_up" };
  return { code: "stable", label: "📊 Precio estable", type: "stable" };
}

function generatePriceHistory(productId, currentMinPrice) {
  const prices = priceSeries(productId, currentMinPrice);
  const today = new Date();
  const history = prices.map((price, index) => {
    const day = new Date(today);
    day.setDate(day.getDate() - (HISTORY_DAYS - 1 - index));
    return { date: day.toISOString().split("T")[0], price };
  });

  const points30 = history.slice(60);
  const stats = priceStats(prices);

  return {
    history,
    history30d: points30,
    history90d: history,
    ...stats,
    opportunity: opportunityFor(currentMinPrice || 50000, stats),
  };
}

async function getComparisonForProduct(productId) {
  const product = await getProductById(productId);
  if (!product) return null;
  const prices = pricesForProduct(product);
  const range = priceRange(prices);

  const currentMinPrice = range.min || product.basePrice || 0;
  const historyData = generatePriceHistory(product.id, currentMinPrice);

  return {
    product,
    prices,
    minPrice: currentMinPrice,
    maxPrice: range.max || currentMinPrice,
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

module.exports = { getComparison, getComparisonForProduct, generatePriceHistory, pricesForProduct, priceRange };
