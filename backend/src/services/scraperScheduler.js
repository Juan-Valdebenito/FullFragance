const cron = require("node-cron");
const { startCatalogSync, SUPPORTED_SOURCES } = require("./catalogSyncJob");
const {
  scraperCronEnabled,
  scraperCronSchedule,
  scraperCronStaggerMs,
  scraperCronTimezone,
} = require("../config/env");

function runAllSources() {
  console.log(`[scraper-cron] Iniciando sincronización de ${SUPPORTED_SOURCES.length} tiendas...`);
  SUPPORTED_SOURCES.forEach((source, index) => {
    setTimeout(() => {
      try {
        startCatalogSync(source);
        console.log(`[scraper-cron] Sincronización iniciada: ${source}`);
      } catch (error) {
        console.error(`[scraper-cron] Error al iniciar ${source}:`, error.message);
      }
    }, index * scraperCronStaggerMs);
  });
}

function startScraperScheduler() {
  if (!scraperCronEnabled) {
    console.log("[scraper-cron] Deshabilitado (SCRAPER_CRON_ENABLED != 'true').");
    return null;
  }
  if (!cron.validate(scraperCronSchedule)) {
    console.error(`[scraper-cron] Expresión cron inválida: "${scraperCronSchedule}". Scheduler no iniciado.`);
    return null;
  }
  console.log(
    `[scraper-cron] Activo: "${scraperCronSchedule}" (${scraperCronTimezone}) para ${SUPPORTED_SOURCES.length} tiendas, stagger de ${scraperCronStaggerMs}ms.`
  );
  return cron.schedule(scraperCronSchedule, runAllSources, { timezone: scraperCronTimezone });
}

module.exports = { startScraperScheduler, runAllSources };
