require("dotenv").config();

module.exports = {
  port: process.env.PORT || 3000,
  jwtSecret: process.env.JWT_SECRET || "dev-secret-no-usar-en-produccion",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  sqlitePath: process.env.SQLITE_PATH || "./data/catalog.sqlite",
  scraperApiKey: process.env.SCRAPER_API_KEY || "",
  falabellaUserAgent:
    process.env.FALABELLA_USER_AGENT ||
    "FullFraganceCatalogBot/1.0 (+contacto@ejemplo.cl)",
  falabellaMinDelayMs: Number(process.env.FALABELLA_MIN_DELAY_MS || 1500),
  falabellaMaxDelayMs: Number(process.env.FALABELLA_MAX_DELAY_MS || 3000),
};
