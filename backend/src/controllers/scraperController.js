const { scraperApiKey } = require("../config/env");
const { upsertProduct, listProducts } = require("../data/catalogDatabase");
const { scrapeProduct } = require("../services/falabellaScraper");

async function syncFalabella(req, res, next) {
  try {
    if (scraperApiKey && req.get("x-scraper-key") !== scraperApiKey) {
      return res.status(403).json({ error: "Clave de sincronización inválida." });
    }
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
    const allSuccessful = results.every((result) => result.ok);
    res.status(allSuccessful ? 200 : 207).json({ results });
  } catch (error) {
    next(error);
  }
}

function listFalabella(_req, res) {
  res.json({ products: listProducts("falabella-cl") });
}

module.exports = { syncFalabella, listFalabella };
