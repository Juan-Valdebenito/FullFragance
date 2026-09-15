const app = require("./app");
const { port } = require("./config/env");
const { initDatabase } = require("./data/pgDatabase");
const { startScraperScheduler } = require("./services/scraperScheduler");
const { getProducts } = require("./models/catalogRepository");

async function start() {
  await initDatabase();
  app.listen(port, () => {
    console.log(`FullFragrance backend escuchando en http://localhost:${port}`);
  });
  startScraperScheduler();

  // Pre-calienta el catálogo (merge de productos scrapeados) al arrancar para
  // que el primer visitante real no pague el costo del cómputo inicial.
  getProducts()
    .then((products) => console.log(`Catálogo pre-calentado: ${products.length} productos.`))
    .catch((error) => console.error("No se pudo pre-calentar el catálogo:", error.message));
}

start().catch((error) => {
  console.error("No se pudo iniciar PostgreSQL. Revisa DATABASE_URL o las variables PG*.", error.message);
  process.exit(1);
});
