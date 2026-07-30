const { query } = require("./pgDatabase");

async function upsertProduct(product) {
  const now = new Date().toISOString();
  const rawJson = JSON.stringify(product.raw || {});
  
  await query(
    `INSERT INTO scraped_products (
      source, sku, brand, name, price, currency, presentation, image_url,
      available, product_url, raw_json, first_seen_at, last_seen_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
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
    [
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
      rawJson,
      now,
      now,
    ]
  );
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
  await query("DELETE FROM scraped_products WHERE source = $1", [source]);
  for (const product of products) {
    await upsertProduct(product);
  }
}

module.exports = { upsertProduct, listProducts, replaceProducts };
