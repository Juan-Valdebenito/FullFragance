/**
 * Reduce el tamaño de la base en Supabase para no exceder los 500 MB del plan
 * gratuito.
 *
 *   npm run db:optimize            -> sólo muestra el tamaño de cada tabla
 *   npm run db:optimize -- --apply -> aplica la limpieza y muestra el resultado
 *
 * Qué hace --apply:
 *   1. Copia a price_history el último precio diario de price_observations que
 *      falte (no se pierde historial diario) y elimina price_observations, que
 *      guardaba cada sincronización y ya no se lee.
 *   2. Elimina el índice idx_price_history_product_date, duplicado de la PK.
 *   3. Deja raw_json de scraped_products sólo con { mockPrice } cuando aplica.
 *   4. VACUUM FULL de las tablas tocadas para devolver el espacio al disco.
 *
 * Usa DATABASE_URL (backend/.env o variable de entorno).
 */
require("dotenv").config();
const { Pool } = require("pg");

const apply = process.argv.includes("--apply");
if (!process.env.DATABASE_URL) {
  console.error("Falta DATABASE_URL (usa la URL del Session pooler de Supabase).");
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: /localhost|127\.0\.0\.1/.test(process.env.DATABASE_URL) ? false : { rejectUnauthorized: false },
  max: 1,
});

async function report(client, title) {
  const { rows } = await client.query(`
    SELECT c.relname AS tabla,
      pg_size_pretty(pg_total_relation_size(c.oid)) AS total,
      pg_size_pretty(pg_relation_size(c.oid)) AS datos,
      pg_size_pretty(pg_indexes_size(c.oid)) AS indices,
      c.reltuples::bigint AS filas_aprox
    FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'r'
    ORDER BY pg_total_relation_size(c.oid) DESC
  `);
  const { rows: [db] } = await client.query("SELECT pg_size_pretty(pg_database_size(current_database())) AS size");
  console.log(`\n${title}: base completa ${db.size}`);
  console.table(rows);
}

async function step(client, label, sql) {
  const started = Date.now();
  const result = await client.query(sql);
  const affected = result.rowCount != null ? ` (${result.rowCount} filas)` : "";
  console.log(`✔ ${label}${affected} en ${((Date.now() - started) / 1000).toFixed(1)} s`);
}

async function main() {
  const client = await pool.connect();
  try {
    await report(client, "Antes");
    if (!apply) {
      console.log("\nSólo lectura. Ejecuta con --apply para limpiar.");
      return;
    }

    // Al pasar la cuota, Supabase deja la base en sólo lectura; esta sesión
    // necesita escribir para poder liberar espacio.
    await client.query("SET default_transaction_read_only = off");

    const { rows: [{ exists }] } = await client.query("SELECT to_regclass('public.price_observations') IS NOT NULL AS exists");
    if (exists) {
      await step(client, "Último precio diario copiado a price_history", `
        INSERT INTO price_history (source, sku, observed_on, price, currency, available, observed_at)
        SELECT DISTINCT ON (source, sku, observed_on) source, sku, observed_on, price, currency, available, observed_at
        FROM price_observations
        ORDER BY source, sku, observed_on, observed_at DESC
        ON CONFLICT (source, sku, observed_on) DO NOTHING`);
      await step(client, "price_observations eliminada", "DROP TABLE price_observations");
    }
    await step(client, "Índice duplicado eliminado", "DROP INDEX IF EXISTS idx_price_history_product_date");
    await step(client, "raw_json reducido", `
      UPDATE scraped_products
      SET raw_json = CASE WHEN raw_json->>'mockPrice' = 'true' THEN '{"mockPrice":true}'::jsonb ELSE '{}'::jsonb END
      WHERE raw_json IS DISTINCT FROM
        CASE WHEN raw_json->>'mockPrice' = 'true' THEN '{"mockPrice":true}'::jsonb ELSE '{}'::jsonb END`);
    await step(client, "VACUUM FULL scraped_products", "VACUUM FULL scraped_products");
    await step(client, "VACUUM FULL price_history", "VACUUM FULL price_history");

    await report(client, "Después");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error("La optimización falló:", error.message);
  process.exitCode = 1;
});
