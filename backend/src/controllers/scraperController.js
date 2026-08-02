const { upsertProduct, listProducts, replaceProducts } = require("../data/catalogDatabase");
const { scrapeProductOrFallback, scrapePerfumeCatalog } = require("../services/falabellaScraper");
const {
  scrapeProductOrFallback: scrapeRipleyProductOrFallback,
  scrapePerfumeCatalog: scrapeRipleyPerfumeCatalog,
} = require("../services/ripleyScraper");
const { startCatalogSync, getCatalogSyncJob } = require("../services/catalogSyncJob");
const {
  scrapeProductOrFallback: scrapeAlishaProductOrFallback,
  scrapePerfumeCatalog: scrapeAlishaPerfumeCatalog,
} = require("../services/alishaScraper");
const {
  scrapeProductOrFallback: scrapeSilkProductOrFallback,
  scrapePerfumeCatalog: scrapeSilkPerfumeCatalog,
} = require("../services/silkScraper");
const {
  scrapeProductOrFallback: scrapeEliteProductOrFallback,
  scrapePerfumeCatalog: scrapeElitePerfumeCatalog,
} = require("../services/eliteScraper");
const {
  scrapeProductOrFallback: scrapeCosmeticProductOrFallback,
  scrapePerfumeCatalog: scrapeCosmeticPerfumeCatalog,
} = require("../services/cosmeticScraper");
const {
  scrapePerfumeCatalog: scrapeParisPerfumeCatalog,
} = require("../services/parisScraper");
const {
  scrapePerfumeCatalog: scrapeAbcPerfumeCatalog,
} = require("../services/abcScraper");
const {
  scrapePerfumeCatalog: scrapePreunicPerfumeCatalog,
} = require("../services/preunicScraper");
const {
  scrapePerfumeCatalog: scrapeLodoroPerfumeCatalog,
} = require("../services/lodoroScraper");

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

async function syncAlisha(req, res, next) {
  try {
    const urls = req.body?.productUrls;
    if (!Array.isArray(urls) || urls.length < 1 || urls.length > 25 || urls.some((url) => typeof url !== "string")) {
      return res.status(400).json({ error: "productUrls debe ser un arreglo de 1 a 25 URLs de producto." });
    }
    const results = [];
    for (const url of urls) {
      try {
        const { product, warning } = await scrapeAlishaProductOrFallback(url);
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

async function syncAlishaPerfumeCatalog(req, res, next) {
  try {
    if (req.body?.fullCatalog) {
      return res.status(202).json({ job: startCatalogSync("alisha-cl") });
    }
    const maxProducts = Number(req.body?.maxProducts || 12);
    if (!Number.isInteger(maxProducts) || maxProducts < 1 || maxProducts > 250) {
      return res.status(400).json({ error: "maxProducts debe ser un entero entre 1 y 250." });
    }
    const results = await scrapeAlishaPerfumeCatalog(maxProducts);
    results.filter((result) => result.ok).forEach((result) => upsertProduct(result.product));
    res.status(results.every((result) => result.ok) ? 200 : 207).json({ results });
  } catch (error) {
    next(error);
  }
}

function listAlisha(_req, res) {
  res.json({ products: listProducts("alisha-cl") });
}

async function syncSilk(req, res, next) {
  try {
    const urls = req.body?.productUrls;
    if (!Array.isArray(urls) || urls.length < 1 || urls.length > 25 || urls.some((url) => typeof url !== "string")) {
      return res.status(400).json({ error: "productUrls debe ser un arreglo de 1 a 25 URLs de producto." });
    }
    const results = [];
    for (const url of urls) {
      try {
        const { product, warning } = await scrapeSilkProductOrFallback(url);
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

async function syncSilkPerfumeCatalog(req, res, next) {
  try {
    if (req.body?.fullCatalog) {
      return res.status(202).json({ job: startCatalogSync("silk-cl") });
    }
    const maxProducts = Number(req.body?.maxProducts || 12);
    if (!Number.isInteger(maxProducts) || maxProducts < 1 || maxProducts > 250) {
      return res.status(400).json({ error: "maxProducts debe ser un entero entre 1 y 250." });
    }
    const results = await scrapeSilkPerfumeCatalog(maxProducts);
    results.filter((result) => result.ok).forEach((result) => upsertProduct(result.product));
    res.status(results.every((result) => result.ok) ? 200 : 207).json({ results });
  } catch (error) {
    next(error);
  }
}

function listSilk(_req, res) {
  res.json({ products: listProducts("silk-cl") });
}

async function syncElite(req, res, next) {
  try {
    const urls = req.body?.productUrls;
    if (!Array.isArray(urls) || urls.length < 1 || urls.length > 25 || urls.some((url) => typeof url !== "string")) {
      return res.status(400).json({ error: "productUrls debe ser un arreglo de 1 a 25 URLs de producto." });
    }
    const results = [];
    for (const url of urls) {
      try {
        const { product, warning } = await scrapeEliteProductOrFallback(url);
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

async function syncElitePerfumeCatalog(req, res, next) {
  try {
    if (req.body?.fullCatalog) {
      return res.status(202).json({ job: startCatalogSync("elite-cl") });
    }
    const maxProducts = Number(req.body?.maxProducts || 12);
    if (!Number.isInteger(maxProducts) || maxProducts < 1 || maxProducts > 250) {
      return res.status(400).json({ error: "maxProducts debe ser un entero entre 1 y 250." });
    }
    const results = await scrapeElitePerfumeCatalog(maxProducts);
    results.filter((result) => result.ok).forEach((result) => upsertProduct(result.product));
    res.status(results.every((result) => result.ok) ? 200 : 207).json({ results });
  } catch (error) {
    next(error);
  }
}

function listElite(_req, res) {
  res.json({ products: listProducts("elite-cl") });
}

async function syncCosmetic(req, res, next) {
  try {
    const urls = req.body?.productUrls;
    if (!Array.isArray(urls) || urls.length < 1 || urls.length > 25 || urls.some((url) => typeof url !== "string")) {
      return res.status(400).json({ error: "productUrls debe ser un arreglo de 1 a 25 URLs de producto." });
    }
    const results = [];
    for (const url of urls) {
      try {
        const { product, warning } = await scrapeCosmeticProductOrFallback(url);
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

async function syncCosmeticPerfumeCatalog(req, res, next) {
  try {
    if (req.body?.fullCatalog) {
      return res.status(202).json({ job: startCatalogSync("cosmetic-cl") });
    }
    const maxProducts = Number(req.body?.maxProducts || 12);
    if (!Number.isInteger(maxProducts) || maxProducts < 1 || maxProducts > 250) {
      return res.status(400).json({ error: "maxProducts debe ser un entero entre 1 y 250." });
    }
    const results = await scrapeCosmeticPerfumeCatalog(maxProducts);
    results.filter((result) => result.ok).forEach((result) => upsertProduct(result.product));
    res.status(results.every((result) => result.ok) ? 200 : 207).json({ results });
  } catch (error) {
    next(error);
  }
}

function listCosmetic(_req, res) {
  res.json({ products: listProducts("cosmetic-cl") });
}

async function syncParis(req, res, next) {
  try {
    const maxProducts = Number(req.body?.maxProducts || 12);
    if (!Number.isInteger(maxProducts) || maxProducts < 1 || maxProducts > 24) {
      return res.status(400).json({ error: "maxProducts debe ser un entero entre 1 y 24." });
    }
    const results = await scrapeParisPerfumeCatalog(maxProducts);
    const products = results.filter((result) => result.ok).map((result) => result.product);
    if (products.length) replaceProducts("paris-cl", products);
    res.status(200).json({ results });
  } catch (error) {
    next(error);
  }
}

async function syncParisPerfumeCatalog(req, res, next) {
  try {
    if (req.body?.fullCatalog) {
      return res.status(202).json({ job: startCatalogSync("paris-cl") });
    }
    return syncParis(req, res, next);
  } catch (error) {
    next(error);
  }
}

function listParis(_req, res) {
  res.json({ products: listProducts("paris-cl") });
}

async function syncAbc(req, res, next) {
  try {
    const maxProducts = Number(req.body?.maxProducts || 12);
    if (!Number.isInteger(maxProducts) || maxProducts < 1 || maxProducts > 48) {
      return res.status(400).json({ error: "maxProducts debe ser un entero entre 1 y 48." });
    }
    const results = await scrapeAbcPerfumeCatalog(maxProducts);
    const products = results.filter((result) => result.ok).map((result) => result.product);
    if (products.length) replaceProducts("abc-cl", products);
    res.status(200).json({ results });
  } catch (error) {
    next(error);
  }
}

async function syncAbcPerfumeCatalog(req, res, next) {
  try {
    if (req.body?.fullCatalog) {
      return res.status(202).json({ job: startCatalogSync("abc-cl") });
    }
    return syncAbc(req, res, next);
  } catch (error) {
    next(error);
  }
}

function listAbc(_req, res) {
  res.json({ products: listProducts("abc-cl") });
}

async function syncPreunic(req, res, next) {
  try {
    const maxProducts = Number(req.body?.maxProducts || 24);
    if (!Number.isInteger(maxProducts) || maxProducts < 1 || maxProducts > 250) {
      return res.status(400).json({ error: "maxProducts debe ser un entero entre 1 y 250." });
    }
    const results = await scrapePreunicPerfumeCatalog(maxProducts);
    const products = results.filter((result) => result.ok).map((result) => result.product);
    if (products.length) replaceProducts("preunic-cl", products);
    res.status(200).json({ results });
  } catch (error) {
    next(error);
  }
}

async function syncPreunicPerfumeCatalog(req, res, next) {
  try {
    if (req.body?.fullCatalog) {
      return res.status(202).json({ job: startCatalogSync("preunic-cl") });
    }
    return syncPreunic(req, res, next);
  } catch (error) {
    next(error);
  }
}

function listPreunic(_req, res) {
  res.json({ products: listProducts("preunic-cl") });
}

async function syncLodoro(req, res, next) {
  try {
    const maxProducts = Number(req.body?.maxProducts || 24);
    if (!Number.isInteger(maxProducts) || maxProducts < 1 || maxProducts > 24) {
      return res.status(400).json({ error: "maxProducts debe ser un entero entre 1 y 24." });
    }
    const results = await scrapeLodoroPerfumeCatalog(maxProducts);
    const products = results.filter((result) => result.ok).map((result) => result.product);
    if (products.length) replaceProducts("lodoro-cl", products);
    res.status(200).json({ results });
  } catch (error) {
    next(error);
  }
}

async function syncLodoroPerfumeCatalog(req, res, next) {
  try {
    if (req.body?.fullCatalog) {
      return res.status(202).json({ job: startCatalogSync("lodoro-cl") });
    }
    return syncLodoro(req, res, next);
  } catch (error) {
    next(error);
  }
}

function listLodoro(_req, res) {
  res.json({ products: listProducts("lodoro-cl") });
}

module.exports = {
  syncFalabella,
  syncPerfumeCatalog,
  listFalabella,
  syncRipley,
  syncRipleyPerfumeCatalog,
  listRipley,
  syncAlisha,
  syncAlishaPerfumeCatalog,
  listAlisha,
  syncSilk,
  syncSilkPerfumeCatalog,
  listSilk,
  syncElite,
  syncElitePerfumeCatalog,
  listElite,
  syncCosmetic,
  syncCosmeticPerfumeCatalog,
  listCosmetic,
  syncParis,
  syncParisPerfumeCatalog,
  listParis,
  syncAbc,
  syncAbcPerfumeCatalog,
  listAbc,
  syncPreunic,
  syncPreunicPerfumeCatalog,
  listPreunic,
  syncLodoro,
  syncLodoroPerfumeCatalog,
  listLodoro,
  getSyncJob,
};
