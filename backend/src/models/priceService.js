const { getProducts, getProductById } = require("./catalogRepository");
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
    notesInferred: product.notesInferred,
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

async function getComparisonForProduct(productId) {
  const product = await getProductById(productId);
  if (!product) return null;
  const prices = pricesForProduct(product);
  const range = priceRange(prices);

  const currentMinPrice = range.min || product.basePrice || 0;

  // Sin historial: todavía no se guardan precios por día, y una serie simulada
  // se mostraría como si fuera real.
  return {
    product,
    prices,
    minPrice: currentMinPrice,
    maxPrice: range.max || currentMinPrice,
  };
}

module.exports = { getComparison, getComparisonForProduct, pricesForProduct, priceRange };
