/**
 * Sincroniza una tienda desde esta máquina hacia la base configurada en
 * DATABASE_URL, sin pasar por el backend de Render.
 *
 * Sirve para tiendas que bloquean las IPs de datacenter (Ripley, detrás de
 * Cloudflare, responde 403 desde Render pero no desde una conexión de casa).
 *
 * Uso: DATABASE_URL=postgresql://... node scripts/sync-store.js ripley-cl
 */
require("dotenv").config();

const { startCatalogSync, getCatalogSyncJob, SUPPORTED_SOURCES } = require("../src/services/catalogSyncJob");

const source = process.argv[2];
if (!SUPPORTED_SOURCES.includes(source)) {
  console.error(`Uso: node scripts/sync-store.js <tienda>\nTiendas: ${SUPPORTED_SOURCES.join(", ")}`);
  process.exit(1);
}
if (!process.env.DATABASE_URL) {
  console.error("Falta DATABASE_URL (usa la URL del Session pooler de Supabase).");
  process.exit(1);
}

const { id } = startCatalogSync(source);
let lastPage = -1;
const timer = setInterval(() => {
  const job = getCatalogSyncJob(id);
  if (job.currentPage !== lastPage) {
    lastPage = job.currentPage;
    console.log(`[${source}] página ${job.currentPage}/${job.totalPages} · ${job.imported} productos`);
  }
  if (job.status === "running") return;
  clearInterval(timer);
  if (job.status === "completed") {
    console.log(`[${source}] listo: ${job.imported} productos guardados.`);
    process.exit(0);
  }
  console.error(`[${source}] falló: ${job.error}`);
  process.exit(1);
}, 1000);
