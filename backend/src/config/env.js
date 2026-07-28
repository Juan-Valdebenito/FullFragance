try {
  require("dotenv").config();
} catch (error) {
  if (error.code !== "MODULE_NOT_FOUND") throw error;
}

module.exports = {
  port: process.env.PORT || 3000,
  jwtSecret: process.env.JWT_SECRET || "dev-secret-no-usar-en-produccion",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  adminEmails: (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean),
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
    "https://www.falabella.com/falabella-cl/search?Ntt=perfume",
  falabellaPdpSitemapIndexUrl:
    process.env.FALABELLA_PDP_SITEMAP_INDEX_URL ||
    "https://www.falabella.com/static/site/sitemaps/pdp/pdp_cl_FA_COM-index.xml",
  falabellaSitemapFilesToScan: Number(process.env.FALABELLA_SITEMAP_FILES_TO_SCAN || 8),
  ripleyUserAgent:
    process.env.RIPLEY_USER_AGENT ||
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
  ripleyMinDelayMs: Number(process.env.RIPLEY_MIN_DELAY_MS || 1200),
  ripleyMaxDelayMs: Number(process.env.RIPLEY_MAX_DELAY_MS || 2500),
  ripleyRequestTimeoutMs: Number(process.env.RIPLEY_REQUEST_TIMEOUT_MS || 20000),
  ripleyCurlFallback: process.env.RIPLEY_CURL_FALLBACK !== "false",
  ripleyFixtureDir: process.env.RIPLEY_FIXTURE_DIR || "",
  ripleyPerfumesUrl:
    process.env.RIPLEY_PERFUMES_URL ||
    "https://simple.ripley.cl/belleza/perfumeria?source=menu&s=mdco",
  alishaUserAgent:
    process.env.ALISHA_USER_AGENT ||
    "FullFragranceCatalogBot/1.0 (+catalog comparison; contact: admin@fullfragrance.local)",
  alishaMinDelayMs: Number(process.env.ALISHA_MIN_DELAY_MS || 500),
  alishaMaxDelayMs: Number(process.env.ALISHA_MAX_DELAY_MS || 1000),
  alishaRequestTimeoutMs: Number(process.env.ALISHA_REQUEST_TIMEOUT_MS || 20000),
  alishaFixtureDir: process.env.ALISHA_FIXTURE_DIR || "",
  alishaCollectionUrl:
    process.env.ALISHA_COLLECTION_URL ||
    "https://alishaperfumes.cl/collections/perfumes/products.json",
  silkUserAgent:
    process.env.SILK_USER_AGENT ||
    "FullFragranceCatalogBot/1.0 (+catalog comparison; contact: admin@fullfragrance.local)",
  silkMinDelayMs: Number(process.env.SILK_MIN_DELAY_MS || 500),
  silkMaxDelayMs: Number(process.env.SILK_MAX_DELAY_MS || 1000),
  silkRequestTimeoutMs: Number(process.env.SILK_REQUEST_TIMEOUT_MS || 20000),
  silkCollectionUrl:
    process.env.SILK_COLLECTION_URL ||
    "https://silkperfumes.cl/collections/perfumes/products.json",
  eliteUserAgent:
    process.env.ELITE_USER_AGENT ||
    "FullFragranceCatalogBot/1.0 (+catalog comparison; contact: admin@fullfragrance.local)",
  eliteMinDelayMs: Number(process.env.ELITE_MIN_DELAY_MS || 500),
  eliteMaxDelayMs: Number(process.env.ELITE_MAX_DELAY_MS || 1000),
  eliteRequestTimeoutMs: Number(process.env.ELITE_REQUEST_TIMEOUT_MS || 20000),
  eliteCollectionUrl:
    process.env.ELITE_COLLECTION_URL ||
    "https://www.eliteperfumes.cl/collections/perfumes/products.json",
  scraperMockPrices: process.env.SCRAPER_MOCK_PRICES !== "false" && process.env.NODE_ENV !== "production",
};
