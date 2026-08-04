const app = require("./app");
const { port } = require("./config/env");
const { initDatabase } = require("./data/pgDatabase");

async function start() {
  try {
    await initDatabase();
    console.log("✓ Base de datos conectada");
  } catch (error) {
    console.warn("⚠ Base de datos no disponible al iniciar, continuando sin BD:", error.message);
    console.warn("Las requests que requieren BD fallarán hasta que se conecte");
  }

  app.listen(port, () => {
    console.log(`FullFragance backend escuchando en http://localhost:${port}`);
  });
}

start().catch((error) => {
  console.error("Error fatal al iniciar:", error.message);
  process.exit(1);
});

