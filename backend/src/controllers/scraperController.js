const { scraperApiKey } = require("../config/env");
const { upsertProduct, listProducts } = require("../data/catalogDatabase");
const { scrapeProduct, scrapePerfumeCatalog } = require("../services/falabellaScraper");

function hasAccess(req, res) {
  if (scraperApiKey && req.get("x-scraper-key") !== scraperApiKey) {
    res.status(403).json({ error: "Clave de sincronización inválida." });
    return false;
  }
  return true;
}

async function syncFalabella(req, res, next) {
  try {
    if (!hasAccess(req, res)) return;
    const urls = req.body?.productUrls;
    if (!Array.isArray(urls) || urls.length < 1 || urls.length > 25 || urls.some((url) => typeof url !== "string")) {
      return res.status(400).json({ error: "productUrls debe ser un arreglo de 1 a 25 URLs de producto." });
    }
    const results = [];
    for (const url of urls) {
      try {
        const product = await scrapeProduct(url);
        upsertProduct(product);
        results.push({ url, ok: true, product });
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
    if (!hasAccess(req, res)) return;
    const maxProducts = Number(req.body?.maxProducts || 12);
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

module.exports = { syncFalabella, syncPerfumeCatalog, listFalabella };
