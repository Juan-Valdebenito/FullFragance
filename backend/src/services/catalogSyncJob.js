const { randomUUID } = require("crypto");
const { replaceProducts } = require("../data/catalogDatabase");
const { invalidateCatalogCache } = require("../models/catalogRepository");
const { scrapeDirectCatalogPage: scrapeFalabellaPage } = require("./falabellaScraper");
const { scrapeDirectCatalogPage: scrapeRipleyPage } = require("./ripleyScraper");
const { scrapeDirectCatalogPage: scrapeAlishaPage } = require("./alishaScraper");
const { scrapeDirectCatalogPage: scrapeSilkPage } = require("./silkScraper");
const { scrapeDirectCatalogPage: scrapeElitePage } = require("./eliteScraper");
const { scrapeDirectCatalogPage: scrapeLeparisPage } = require("./leparisScraper");
const { scrapeDirectCatalogPage: scrapeDreamsPage } = require("./dreamsScraper");
const { scrapeDirectCatalogPage: scrapeCosmeticPage } = require("./cosmeticScraper");
const { scrapeDirectCatalogPage: scrapeParisPage } = require("./parisScraper");
const { scrapeDirectCatalogPage: scrapeAbcPage } = require("./abcScraper");
const { scrapeDirectCatalogPage: scrapePreunicPage } = require("./preunicScraper");
const { scrapeDirectCatalogPage: scrapeLodoroPage } = require("./lodoroScraper");

const jobs = new Map();
const activeBySource = new Map();
const pending = [];
const MAX_CONCURRENT = 3;
let runningCount = 0;

function drainQueue() {
  while (runningCount < MAX_CONCURRENT && pending.length) {
    const job = pending.shift();
    runningCount += 1;
    void run(job).finally(() => {
      runningCount -= 1;
      drainQueue();
    });
  }
}
const scrapers = {
  "falabella-cl": scrapeFalabellaPage,
  "ripley-cl": scrapeRipleyPage,
  "alisha-cl": scrapeAlishaPage,
  "silk-cl": scrapeSilkPage,
  "elite-cl": scrapeElitePage,
  "leparis-cl": scrapeLeparisPage,
  "dreams-cl": scrapeDreamsPage,
  "cosmetic-cl": scrapeCosmeticPage,
  "paris-cl": scrapeParisPage,
  "abc-cl": scrapeAbcPage,
  "preunic-cl": scrapePreunicPage,
  "lodoro-cl": scrapeLodoroPage,
};

function publicJob(job) {
  return {
    id: job.id,
    source: job.source,
    status: job.status,
    currentPage: job.currentPage,
    totalPages: job.totalPages,
    scanned: job.scanned,
    imported: job.imported,
    targetProducts: job.targetProducts || null,
    startedAt: job.startedAt,
    finishedAt: job.finishedAt || null,
    error: job.error || null,
    phase: job.phase,
    scrapeDurationMs: job.scrapeDurationMs ?? null,
    saveDurationMs: job.saveDurationMs ?? null,
  };
}

async function run(job) {
  const products = new Map();
  const scrapeStarted = Date.now();
  let saveStarted;
  job.phase = "scraping";
  try {
    for (let page = 1; page <= job.totalPages; page += 1) {
      const result = await scrapers[job.source](page);
      job.totalPages = result.totalPages;
      job.currentPage = page;
      job.scanned += result.scanned;
      if (result.directTotal) job.targetProducts = result.directTotal;
      result.products.forEach((product) => products.set(product.sku, product));
      job.imported = products.size;
    }
    job.scrapeDurationMs = Date.now() - scrapeStarted;
    job.phase = "saving";
    saveStarted = Date.now();
    await replaceProducts(job.source, [...products.values()]);
    job.saveDurationMs = Date.now() - saveStarted;
    invalidateCatalogCache();
    job.status = "completed";
  } catch (error) {
    job.status = "failed";
    job.error = error.message;
  } finally {
    if (saveStarted === undefined) job.scrapeDurationMs = Date.now() - scrapeStarted;
    else job.saveDurationMs = Date.now() - saveStarted;
    job.phase = job.status;
    job.finishedAt = new Date().toISOString();
    console.info("[catalog-sync]", JSON.stringify(publicJob(job)));
    activeBySource.delete(job.source);
  }
}

function startCatalogSync(source) {
  if (!scrapers[source]) throw new Error("Fuente de catálogo no soportada.");
  const activeId = activeBySource.get(source);
  if (activeId) return publicJob(jobs.get(activeId));
  const job = {
    id: randomUUID(),
    source,
    status: "running",
    phase: "queued",
    currentPage: 0,
    totalPages: 1,
    scanned: 0,
    imported: 0,
    targetProducts: null,
    startedAt: new Date().toISOString(),
  };
  jobs.set(job.id, job);
  activeBySource.set(source, job.id);
  pending.push(job);
  setImmediate(drainQueue);
  return publicJob(job);
}

function getCatalogSyncJob(id) {
  const job = jobs.get(id);
  return job ? publicJob(job) : null;
}

module.exports = { startCatalogSync, getCatalogSyncJob, SUPPORTED_SOURCES: Object.keys(scrapers) };
