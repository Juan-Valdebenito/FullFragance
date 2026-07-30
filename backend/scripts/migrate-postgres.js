const { initDatabase, getPool } = require("../src/data/pgDatabase");

async function migrate() {
  await initDatabase();
  const pool = getPool();
  const { rows } = await pool.query(`
    SELECT
      (SELECT COUNT(*) FROM users) AS users,
      (SELECT COUNT(*) FROM olfactory_notes) AS olfactory_notes,
      (SELECT COUNT(*) FROM base_products) AS base_products,
      (SELECT COUNT(*) FROM chains) AS chains,
      (SELECT COUNT(*) FROM scraped_products) AS scraped_products
  `);
  console.table(rows);
  await pool.end();
}

migrate().catch((error) => {
  console.error("La migración a PostgreSQL falló; no se eliminó ningún dato legado.", error);
  process.exitCode = 1;
});
