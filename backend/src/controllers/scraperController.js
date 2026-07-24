const { upsertProduct, listProducts, replaceProducts } = require("../data/catalogDatabase");
const { scrapeProductOrFallback, scrapePerfumeCatalog } = require("../services/falabellaScraper");
const {
  scrapeProductOrFallback: scrapeRipleyProductOrFallback,
  scrapePerfumeCatalog: scrapeRipleyPerfumeCatalog,
} = require("../services/ripleyScraper");
const { startCatalogSync, getCatalogSyncJob } = require("../services/catalogSyncJob");

async function syncFalabella(req, res, next) {
  try {
    const urls = req.body?.productUrls;
    if (!Array.isArray(urls) || urls.length < 1 || urls.length > 25 || urls.some((url) => typeof url !== "string")) {
      return res.status(400).json({ error: "productUrls debe ser un arreglo de 1 a 25 URLs de producto." });
    }
    const results = [];
    for (const url of urls) {
      try {
        const { product, warning } = await scrapeProductOrFallback(url);
        upsertProduct(product);
        results.push({ url, ok: true, product, ...(warning ? { warning } : {}) });
      } catch (error) {
        results.push({ url, ok: false, error: error.message });
      }
    }
    res.status(results.every((result) => result.ok) ? 200 : 207).json({ results });
  } catch (error) {
    next(error);
  }
}

async function syncPerfumeCatalog(req, res, next) {
  try {
    if (req.body?.fullCatalog) {
      return res.status(202).json({ job: startCatalogSync("falabella-cl") });
    }
    const maxProducts = Number(req.body?.maxProducts || (req.body?.fullCatalog ? 24 : 12));
    if (!Number.isInteger(maxProducts) || maxProducts < 1 || maxProducts > 24) {
      return res.status(400).json({ error: "maxProducts debe ser un entero entre 1 y 24." });
    }
    const results = await scrapePerfumeCatalog(maxProducts);
    results.filter((result) => result.ok).forEach((result) => upsertProduct(result.product));
    res.status(results.every((result) => result.ok) ? 200 : 207).json({ results });
  } catch (error) {
    next(error);
  }
}

function listFalabella(_req, res) {
  res.json({ products: listProducts("falabella-cl") });
}

async function syncRipley(req, res, next) {
  try {
    const urls = req.body?.productUrls;
    if (!Array.isArray(urls) || urls.length < 1 || urls.length > 25 || urls.some((url) => typeof url !== "string")) {
      return res.status(400).json({ error: "productUrls debe ser un arreglo de 1 a 25 URLs de producto." });
    }
    const results = [];
    for (const url of urls) {
      try {
        const { product, warning } = await scrapeRipleyProductOrFallback(url);
        upsertProduct(product);
        results.push({ url, ok: true, product, ...(warning ? { warning } : {}) });
      } catch (error) {
        results.push({ url, ok: false, error: error.message });
      }
    }
    res.status(results.every((result) => result.ok) ? 200 : 207).json({ results });
  } catch (error) {
    next(error);
  }
}

async function syncRipleyPerfumeCatalog(req, res, next) {
  try {
    if (req.body?.fullCatalog) {
      return res.status(202).json({ job: startCatalogSync("ripley-cl") });
    }
    const maxProducts = Number(req.body?.maxProducts || (req.body?.fullCatalog ? 60 : 12));
    if (!Number.isInteger(maxProducts) || maxProducts < 1 || maxProducts > 60) {
      return res.status(400).json({ error: "maxProducts debe ser un entero entre 1 y 60." });
    }
    const results = await scrapeRipleyPerfumeCatalog(maxProducts);
    const products = results.filter((result) => result.ok).map((result) => result.product);
    if (products.length) replaceProducts("ripley-cl", products);
    res.status(results.every((result) => result.ok) ? 200 : 207).json({ results });
  } catch (error) {
    next(error);
  }
}

function getSyncJob(req, res) {
  const job = getCatalogSyncJob(req.params.jobId);
  if (!job) return res.status(404).json({ error: "Sincronización no encontrada." });
  res.json({ job });
}

function listRipley(_req, res) {
  res.json({ products: listProducts("ripley-cl") });
}

module.exports = {
  syncFalabella,
  syncPerfumeCatalog,
  listFalabella,
  syncRipley,
  syncRipleyPerfumeCatalog,
  listRipley,
  getSyncJob,
};
