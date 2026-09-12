const app = require("./app");
const { port } = require("./config/env");
const { initDatabase } = require("./data/pgDatabase");
const { startScraperScheduler } = require("./services/scraperScheduler");

async function start() {
  await initDatabase();
  app.listen(port, () => {
    console.log(`FullFragrance backend escuchando en http://localhost:${port}`);
  });
  startScraperScheduler();
}

start().catch((error) => {
  console.error("No se pudo iniciar PostgreSQL. Revisa DATABASE_URL o las variables PG*.", error.message);
  process.exit(1);
});
