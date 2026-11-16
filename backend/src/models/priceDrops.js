const catalogRepository = require("./catalogRepository");
const { listPriceStats } = require("../data/catalogDatabase");

// Una baja menor a esto es ruido de redondeo o de cambio de stock, no una oferta.
const MIN_DROP_PCT = 5;
// Igual que en las ofertas del día: caídas mayores suelen ser errores de scraping.
const MAX_DROP_PCT = 80;
const MAX_REALISTIC_PRICE = 3000000;
const DROPS_POOL_SIZE = 30;
const CACHE_TTL_MS = 60 * 60 * 1000;

const offerKey = (source, sku) => `${source}\u0000${sku}`;

/**
 * Cruza los precios actuales del catálogo con la referencia histórica de cada
 * oferta y devuelve, por perfume, la tienda con la mayor baja respecto de su
 * precio habitual (mediana de los últimos días).
 */
function computePriceDrops(products, stats, { limit = DROPS_POOL_SIZE } = {}) {
  const statsByOffer = new Map(stats.map((row) => [offerKey(row.source, row.sku), row]));
  const drops = [];

  for (const product of products) {
    if (!product.available || product.priceIsMock) continue;
    let best = null;
    for (const offer of product.offers ?? []) {
      if (!offer.available || offer.priceIsMock || !(offer.price > 0) || offer.price >= MAX_REALISTIC_PRICE) continue;
      const history = statsByOffer.get(offerKey(offer.source, offer.sku));
      if (!history || !(history.refPrice > 0)) continue;
      const dropPct = Math.round((1 - offer.price / history.refPrice) * 100);
      if (dropPct < MIN_DROP_PCT || dropPct > MAX_DROP_PCT) continue;
      if (!best || dropPct > best.dropPct) {
        best = {
          deal: product,
          price: offer.price,
          refPrice: history.refPrice,
          savings: history.refPrice - offer.price,
          dropPct,
          isLowest: offer.price <= history.minPrice,
          source: offer.source,
          historyDays: history.days,
        };
      }
    }
    if (best) drops.push(best);
  }

  return drops
    .sort((first, second) => second.dropPct - first.dropPct || second.savings - first.savings)
    .slice(0, limit);
}

// La referencia histórica cambia lento: se cachea una hora. Los precios
// actuales salen del caché del catálogo, que se invalida en cada sincronización.
let statsCache = null;

async function cachedPriceStats() {
  if (!statsCache || Date.now() - statsCache.at > CACHE_TTL_MS) {
    const promise = listPriceStats();
    statsCache = { at: Date.now(), promise };
    promise.catch(() => { statsCache = null; });
  }
  return statsCache.promise;
}

async function getPriceDrops() {
  const [products, stats] = await Promise.all([catalogRepository.getProducts(), cachedPriceStats()]);
  return computePriceDrops(products, stats);
}

function clearPriceDropsCache() {
  statsCache = null;
}

module.exports = { computePriceDrops, getPriceDrops, clearPriceDropsCache };
