try {
  require("dotenv").config();
} catch (error) {
  if (error.code !== "MODULE_NOT_FOUND") throw error;
}

module.exports = {
  port: process.env.PORT || 3000,
  jwtSecret: process.env.JWT_SECRET || "dev-secret-no-usar-en-produccion",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  sqlitePath: process.env.SQLITE_PATH || "./data/catalog.sqlite",
  scraperApiKey: process.env.SCRAPER_API_KEY || "",
  falabellaUserAgent:
    process.env.FALABELLA_USER_AGENT ||
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
  falabellaMinDelayMs: Number(process.env.FALABELLA_MIN_DELAY_MS || 1500),
  falabellaMaxDelayMs: Number(process.env.FALABELLA_MAX_DELAY_MS || 3000),
  falabellaRequestTimeoutMs: Number(process.env.FALABELLA_REQUEST_TIMEOUT_MS || 20000),
  falabellaFixtureDir: process.env.FALABELLA_FIXTURE_DIR || "",
  falabellaPerfumesUrl:
    process.env.FALABELLA_PERFUMES_URL ||
    "https://www.falabella.com/falabella-cl/collection/oferta-perfumes",
  falabellaPdpSitemapIndexUrl:
    process.env.FALABELLA_PDP_SITEMAP_INDEX_URL ||
    "https://www.falabella.com/static/site/sitemaps/pdp/pdp_cl_FA_COM-index.xml",
  falabellaSitemapFilesToScan: Number(process.env.FALABELLA_SITEMAP_FILES_TO_SCAN || 8),
};
