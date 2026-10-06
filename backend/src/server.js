const app = require("./app");
const { port } = require("./config/env");
const { initDatabase } = require("./data/pgDatabase");
const { startScraperScheduler } = require("./services/scraperScheduler");
const { searchCatalog } = require("./models/catalogSearch");

async function start() {
  await initDatabase();
  app.listen(port, () => {
    console.log(`FullFragance backend escuchando en http://localhost:${port}`);
  });
  startScraperScheduler();

  // Pre-calienta el catálogo (merge de productos scrapeados) y el índice de
  // búsqueda al arrancar, para que el primer visitante real no pague ese costo.
  searchCatalog({})
    .then(({ total }) => console.log(`Catálogo pre-calentado: ${total} productos.`))
    .catch((error) => console.error("No se pudo pre-calentar el catálogo:", error.message));
}

start().catch((error) => {
  console.error("No se pudo iniciar PostgreSQL. Revisa DATABASE_URL o las variables PG*.", error.message);
  process.exit(1);
});
