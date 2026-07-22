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

function upsertProduct(product) {
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO scraped_products (
      source, sku, brand, name, price, currency, presentation, available,
      product_url, raw_json, first_seen_at, last_seen_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(source, sku) DO UPDATE SET
      brand = excluded.brand, name = excluded.name, price = excluded.price,
      currency = excluded.currency, presentation = excluded.presentation,
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
    product.available ? 1 : 0,
    product.url,
    JSON.stringify(product.raw || {}),
    now,
    now
  );
}

function listProducts(source, limit = 100) {
  return db
    .prepare(`SELECT source, sku, brand, name, price, currency, presentation,
      available, product_url AS url, first_seen_at AS firstSeenAt,
      last_seen_at AS lastSeenAt
      FROM scraped_products WHERE source = ? ORDER BY last_seen_at DESC LIMIT ?`)
    .all(source, limit)
    .map((product) => ({ ...product, available: Boolean(product.available) }));
}

module.exports = { upsertProduct, listProducts, databasePath };
