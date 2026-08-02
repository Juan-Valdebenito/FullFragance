try {
  require("dotenv").config();
} catch (error) {
  if (error.code !== "MODULE_NOT_FOUND") throw error;
}

const isProduction = process.env.NODE_ENV === "production";
const configuredJwtSecret = process.env.JWT_SECRET || "";

if (isProduction && configuredJwtSecret.length < 32) {
  throw new Error("JWT_SECRET debe estar configurado y tener al menos 32 caracteres en producción.");
}

function parseOrigins(value) {
  const defaults = ["http://localhost:3001", "http://127.0.0.1:3001"];
  const origins = (value || "")
    .split(",")
    .map((origin) => origin.trim().replace(/\/$/, ""))
    .filter(Boolean);
  return origins.length ? origins : defaults;
}

module.exports = {
  port: process.env.PORT || 3000,
  isProduction,
  jwtSecret: configuredJwtSecret || "dev-secret-no-usar-en-produccion",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1d",
  googleClientId: process.env.GOOGLE_CLIENT_ID || "",
  adminEmails: (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean),
  frontendOrigins: parseOrigins(process.env.FRONTEND_ORIGINS),
  trustProxy: process.env.TRUST_PROXY === "true" ? 1 : false,
  databaseUrl: process.env.DATABASE_URL || "",
  pgHost: process.env.PGHOST || "localhost",
  pgPort: Number(process.env.PGPORT || 5432),
  pgDatabase: process.env.PGDATABASE || "fullfragance",
  pgUser: process.env.PGUSER || "postgres",
  pgPassword: process.env.PGPASSWORD || "postgres",
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
  cosmeticUserAgent:
    process.env.COSMETIC_USER_AGENT ||
    "FullFragranceCatalogBot/1.0 (+catalog comparison; contact: admin@fullfragrance.local)",
  cosmeticMinDelayMs: Number(process.env.COSMETIC_MIN_DELAY_MS || 500),
  cosmeticMaxDelayMs: Number(process.env.COSMETIC_MAX_DELAY_MS || 1000),
  cosmeticRequestTimeoutMs: Number(process.env.COSMETIC_REQUEST_TIMEOUT_MS || 20000),
  cosmeticUcpEndpoint:
    process.env.COSMETIC_UCP_ENDPOINT ||
    "https://cosmetic-chile.myshopify.com/api/ucp/mcp",
  cosmeticUcpAgentProfile:
    process.env.COSMETIC_UCP_AGENT_PROFILE ||
    "https://shopify.dev/ucp/agent-profiles/2026-04-08/valid-with-capabilities.json",
  parisUserAgent:
    process.env.PARIS_USER_AGENT ||
    "FullFragranceCatalogBot/1.0 (+catalog comparison; contact: admin@fullfragrance.local)",
  parisMinDelayMs: Number(process.env.PARIS_MIN_DELAY_MS || 150),
  parisMaxDelayMs: Number(process.env.PARIS_MAX_DELAY_MS || 300),
  parisRequestTimeoutMs: Number(process.env.PARIS_REQUEST_TIMEOUT_MS || 20000),
  parisFixtureDir: process.env.PARIS_FIXTURE_DIR || "",
  parisPerfumesUrl:
    process.env.PARIS_PERFUMES_URL ||
    "https://www.paris.cl/belleza/perfumes/",
  parisSearchApiUrl:
    process.env.PARIS_SEARCH_API_URL ||
    "https://be-paris-backend-cl-ms-search.ccom.paris.cl/products/",
  parisApplicationId:
    process.env.PARIS_APPLICATION_ID ||
    "34bb8686968a85a272a6c546ddcb9860db1ea14ee72f5207ef0c028280a6e7bc",
  abcUserAgent:
    process.env.ABC_USER_AGENT ||
    "FullFragranceCatalogBot/1.0 (+catalog comparison; contact: admin@fullfragrance.local)",
  abcMinDelayMs: Number(process.env.ABC_MIN_DELAY_MS || 1500),
  abcMaxDelayMs: Number(process.env.ABC_MAX_DELAY_MS || 3000),
  abcRequestTimeoutMs: Number(process.env.ABC_REQUEST_TIMEOUT_MS || 20000),
  abcFixtureDir: process.env.ABC_FIXTURE_DIR || "",
  abcPerfumesUrl:
    process.env.ABC_PERFUMES_URL ||
    "https://www.abc.cl/belleza/perfumes/",
  abcSitemapIndexUrl:
    process.env.ABC_SITEMAP_INDEX_URL ||
    "https://www.abc.cl/sitemap_index.xml",
  abcSitemapCacheTtlMs: Number(process.env.ABC_SITEMAP_CACHE_TTL_MS || 900000),
  preunicUserAgent:
    process.env.PREUNIC_USER_AGENT ||
    "FullFragranceCatalogBot/1.0 (+catalog comparison; contact: admin@fullfragrance.local)",
  preunicMinDelayMs: Number(process.env.PREUNIC_MIN_DELAY_MS || 350),
  preunicMaxDelayMs: Number(process.env.PREUNIC_MAX_DELAY_MS || 750),
  preunicRequestTimeoutMs: Number(process.env.PREUNIC_REQUEST_TIMEOUT_MS || 20000),
  preunicFixtureDir: process.env.PREUNIC_FIXTURE_DIR || "",
  preunicPerfumesUrl:
    process.env.PREUNIC_PERFUMES_URL ||
    "https://preunic.cl/t/perfumes-y-fragancias",
  preunicCatalogApiUrl:
    process.env.PREUNIC_CATALOG_API_URL ||
    "https://api.empathy.co/search/v1/query/preunic/browse",
  lodoroUserAgent:
    process.env.LODORO_USER_AGENT ||
    "FullFragranceCatalogBot/1.0 (+catalog comparison; contact: admin@fullfragrance.local)",
  lodoroMinDelayMs: Number(process.env.LODORO_MIN_DELAY_MS || 500),
  lodoroMaxDelayMs: Number(process.env.LODORO_MAX_DELAY_MS || 1000),
  lodoroRequestTimeoutMs: Number(process.env.LODORO_REQUEST_TIMEOUT_MS || 20000),
  lodoroUcpEndpoint:
    process.env.LODORO_UCP_ENDPOINT ||
    "https://lodoro.myshopify.com/api/ucp/mcp",
  lodoroUcpAgentProfile:
    process.env.LODORO_UCP_AGENT_PROFILE ||
    "https://shopify.dev/ucp/agent-profiles/2026-04-08/valid-with-capabilities.json",
  scraperMockPrices: process.env.SCRAPER_MOCK_PRICES !== "false" && process.env.NODE_ENV !== "production",
};
