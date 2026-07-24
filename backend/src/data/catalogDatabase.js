const fs = require("fs");
const path = require("path");
const { DatabaseSync } = require("node:sqlite");
const { sqlitePath } = require("../config/env");

const databasePath = path.resolve(__dirname, "..", sqlitePath);
fs.mkdirSync(path.dirname(databasePath), { recursive: true });

const db = new DatabaseSync(databasePath);
db.exec(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS scraped_products (
    source TEXT NOT NULL,
    sku TEXT NOT NULL,
    brand TEXT,
    name TEXT NOT NULL,
    price INTEGER,
    currency TEXT NOT NULL DEFAULT 'CLP',
    presentation TEXT,
    image_url TEXT,
    available INTEGER NOT NULL DEFAULT 0,
    product_url TEXT NOT NULL,
    raw_json TEXT,
    first_seen_at TEXT NOT NULL,
    last_seen_at TEXT NOT NULL,
    PRIMARY KEY (source, sku)
  );
  CREATE INDEX IF NOT EXISTS idx_scraped_products_source_seen
    ON scraped_products(source, last_seen_at DESC);
`);

const columns = db.prepare("PRAGMA table_info(scraped_products)").all();
if (!columns.some((column) => column.name === "image_url")) {
  db.exec("ALTER TABLE scraped_products ADD COLUMN image_url TEXT");
}

function upsertProduct(product) {
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO scraped_products (
      source, sku, brand, name, price, currency, presentation, image_url,
      available, product_url, raw_json, first_seen_at, last_seen_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(source, sku) DO UPDATE SET
      brand = excluded.brand, name = excluded.name, price = excluded.price,
      currency = excluded.currency, presentation = excluded.presentation,
      image_url = excluded.image_url,
      available = excluded.available, product_url = excluded.product_url,
      raw_json = excluded.raw_json, last_seen_at = excluded.last_seen_at
  `).run(
    product.source,
    product.sku,
    product.brand || null,
    product.name,
    product.price ?? null,
    product.currency || "CLP",
    product.presentation || null,
    product.imageUrl || null,
    product.available ? 1 : 0,
    product.url,
    JSON.stringify(product.raw || {}),
    now,
    now
  );
}

function listProducts(source, limit = 10000) {
  return db
    .prepare(`SELECT source, sku, brand, name, price, currency, presentation,
      image_url AS imageUrl,
      available, product_url AS url, raw_json AS rawJson, first_seen_at AS firstSeenAt,
      last_seen_at AS lastSeenAt
      FROM scraped_products WHERE source = ? ORDER BY last_seen_at DESC LIMIT ?`)
    .all(source, limit)
    .map((product) => {
      let raw = {};
      try {
        raw = product.rawJson ? JSON.parse(product.rawJson) : {};
      } catch {
        raw = {};
      }
      const { rawJson, ...rest } = product;
      return { ...rest, raw, available: Boolean(product.available) };
    });
}

function replaceProducts(source, products) {
  if (!source || products.some((product) => product.source !== source)) {
    throw new Error("La fuente de los productos no coincide con el catálogo a reemplazar.");
  }
  db.exec("BEGIN");
  try {
    db.prepare("DELETE FROM scraped_products WHERE source = ?").run(source);
    products.forEach(upsertProduct);
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

module.exports = { upsertProduct, listProducts, replaceProducts, databasePath };
