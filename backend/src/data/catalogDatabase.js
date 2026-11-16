const { query, transaction } = require("./pgDatabase");

async function upsertProduct(product, run = query) {
  return upsertProducts([product], run);
}

const BATCH_SIZE = 250;
function placeholders(count, width) {
  return Array.from({ length: count }, (_, row) =>
    `(${Array.from({ length: width }, (_, col) => `$${row * width + col + 1}`).join(', ')})`
  ).join(', ');
}

async function upsertProducts(products, run) {
  const now = new Date().toISOString();
  
  await run(
    `INSERT INTO scraped_products (
      source, sku, brand, name, price, currency, presentation, image_url,
      available, product_url, raw_json, first_seen_at, last_seen_at
    ) VALUES ${placeholders(products.length, 13)}
    ON CONFLICT (source, sku) DO UPDATE SET
      brand = EXCLUDED.brand,
      name = EXCLUDED.name,
      price = EXCLUDED.price,
      currency = EXCLUDED.currency,
      presentation = EXCLUDED.presentation,
      image_url = EXCLUDED.image_url,
      available = EXCLUDED.available,
      product_url = EXCLUDED.product_url,
      raw_json = EXCLUDED.raw_json,
      last_seen_at = EXCLUDED.last_seen_at`,
    products.flatMap(product => [
      product.source,
      product.sku,
      product.brand || null,
      product.name,
      product.price ?? null,
      product.currency || "CLP",
      product.presentation || null,
      product.imageUrl || null,
      Boolean(product.available),
      product.url,
      JSON.stringify(product.raw || {}),
      now,
      now,
    ])
  );

  // El resumen diario se conserva para las vistas existentes, mientras que
  // price_observations guarda cada sincronización para el historial completo.
  const priced = products.filter(product => product.price > 0 && !product.raw?.mockPrice);
  if (priced.length) {
    await run(
      `INSERT INTO price_history (source, sku, observed_on, price, currency, available, observed_at)
       VALUES ${placeholders(priced.length, 7)}
       ON CONFLICT (source, sku, observed_on) DO UPDATE SET
         price = EXCLUDED.price,
         currency = EXCLUDED.currency,
         available = EXCLUDED.available,
         observed_at = EXCLUDED.observed_at`,
      priced.flatMap(product => [product.source, product.sku, now.slice(0, 10), product.price, product.currency || "CLP", Boolean(product.available), now])
    );
    await run(
      `INSERT INTO price_observations (source, sku, observed_on, price, currency, available, observed_at)
       VALUES ${placeholders(priced.length, 7)}
       ON CONFLICT (source, sku, observed_at) DO NOTHING`,
      priced.flatMap(product => [product.source, product.sku, now.slice(0, 10), product.price, product.currency || "CLP", Boolean(product.available), now])
    );
  }
}

async function listPriceHistory(source, sku, days = 180) {
  const result = await query(
    `SELECT DISTINCT ON (observed_on) source, sku, observed_on::text AS date, price, currency, available,
      observed_at AS "observedAt"
     FROM price_observations WHERE source = $1 AND sku = $2
       AND observed_on >= CURRENT_DATE - $3::integer
     ORDER BY observed_on ASC, observed_at DESC`,
    [source, sku, days]
  );
  return result.rows.map((row) => ({
    ...row,
    date: row.date || row.observed_on,
    price: Number(row.price),
    available: Boolean(row.available),
  }));
}

// Precio de referencia por oferta para detectar bajas históricas: mediana y
// mínimo del último precio de cada día, excluyendo los días más recientes para
// que la propia rebaja no contamine la referencia.
async function listPriceStats({ days = 90, excludeRecentDays = 3, minDays = 7, maxPrice = 3000000 } = {}) {
  const result = await query(
    `WITH daily AS (
       SELECT DISTINCT ON (source, sku, observed_on) source, sku, observed_on, price
       FROM price_observations
       WHERE observed_on >= CURRENT_DATE - $1::integer
         AND observed_on < CURRENT_DATE - $2::integer
         AND price < $4::integer
       ORDER BY source, sku, observed_on, observed_at DESC
     )
     SELECT source, sku,
       PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY price) AS "refPrice",
       MIN(price) AS "minPrice",
       COUNT(*)::integer AS days
     FROM daily
     GROUP BY source, sku
     HAVING COUNT(*) >= $3::integer`,
    [days, excludeRecentDays, minDays, maxPrice]
  );
  return result.rows.map((row) => ({
    source: row.source,
    sku: row.sku,
    refPrice: Math.round(Number(row.refPrice)),
    minPrice: Number(row.minPrice),
    days: Number(row.days),
  }));
}

async function listProducts(source, limit = 10000) {
  const result = await query(
    `SELECT source, sku, brand, name, price, currency, presentation,
      image_url AS "imageUrl",
      available, product_url AS url, raw_json AS "rawJson", first_seen_at AS "firstSeenAt",
      last_seen_at AS "lastSeenAt"
      FROM scraped_products WHERE source = $1 ORDER BY last_seen_at DESC LIMIT $2`,
    [source, limit]
  );

  return result.rows.map((product) => {
    let raw = {};
    if (product.rawJson) {
      raw = typeof product.rawJson === "string" ? JSON.parse(product.rawJson) : product.rawJson;
    }
    const { rawJson, ...rest } = product;
    return { ...rest, raw, available: Boolean(product.available) };
  });
}

async function replaceProducts(source, products) {
  if (!source || products.some((product) => product.source !== source)) {
    throw new Error("La fuente de los productos no coincide con el catálogo a reemplazar.");
  }
  // Borrar e insertar en una sola transacción: si el proceso se corta a mitad
  // de camino se conserva el catálogo anterior en vez de quedar a medias.
  await transaction(async (run) => {
    await run("DELETE FROM scraped_products WHERE source = $1", [source]);
    for (let offset = 0; offset < products.length; offset += BATCH_SIZE) {
      await upsertProducts(products.slice(offset, offset + BATCH_SIZE), run);
    }
  });
}

module.exports = { upsertProduct, listProducts, replaceProducts, listPriceHistory, listPriceStats };
