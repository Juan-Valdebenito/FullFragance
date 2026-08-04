const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");
const env = require("../config/env");

let pool = null;
let isInitialized = false;
let initPromise = null;
let useMemoryFallback = false;

// Fallback en memoria si PG no está disponible (ej. durante npm test sin servicio pg activo)
const memoryStore = {
  users: [],
  olfactoryNotes: [],
  baseProducts: [],
  chains: [],
  scrapedProducts: new Map(), // key: `${source}:${sku}`
  appMetadata: new Map(),
  analyticsEvents: [],
};

function getPool() {
  if (!pool) {
    const config = env.databaseUrl
      ? { connectionString: env.databaseUrl }
      : {
          host: env.pgHost,
          port: env.pgPort,
          database: env.pgDatabase,
          user: env.pgUser,
          password: env.pgPassword,
        };
    
    // Connection timeout corto para detectar rápidamente si no hay servidor PG activo
    pool = new Pool({
      ...config,
      connectionTimeoutMillis: 2000,
      max: 10,
    });

    pool.on("error", (err) => {
      console.error("Error inesperado en cliente de PostgreSQL pool:", err.message);
    });
  }
  return pool;
}

async function query(text, params) {
  await ensureInitialized();
  if (useMemoryFallback) {
    return memoryQuery(text, params);
  }
  const p = getPool();
  return p.query(text, params);
}

async function initDatabase() {
  if (isInitialized) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const p = getPool();
      // Test de conexión
      const client = await p.connect();
      client.release();

      // Crear esquemas en PostgreSQL. Todas las tablas usan IF NOT EXISTS para
      // que ejecutar la migración más de una vez no borre ni duplique datos.
      await p.query(`
        CREATE TABLE IF NOT EXISTS olfactory_notes (
          id VARCHAR(50) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          family VARCHAR(255) NOT NULL,
          description TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS base_products (
          id VARCHAR(50) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          brand VARCHAR(255) NOT NULL,
          unit VARCHAR(100) NOT NULL,
          base_price INTEGER NOT NULL,
          category VARCHAR(100) NOT NULL,
          gender VARCHAR(50) NOT NULL,
          description TEXT NOT NULL,
          notes JSONB NOT NULL DEFAULT '[]'::jsonb
        );

        CREATE TABLE IF NOT EXISTS chains (
          id VARCHAR(50) PRIMARY KEY,
          name VARCHAR(255) NOT NULL
        );

        CREATE TABLE IF NOT EXISTS users (
          id VARCHAR(255) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash TEXT,
          google_id VARCHAR(255),
          picture TEXT,
          role VARCHAR(50) NOT NULL DEFAULT 'customer',
          session_version INTEGER NOT NULL DEFAULT 0,
          favorites JSONB NOT NULL DEFAULT '[]'::jsonb,
          scent_preferences JSONB,
          created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        ALTER TABLE users DROP COLUMN IF EXISTS city;

        CREATE TABLE IF NOT EXISTS scraped_products (
          source VARCHAR(100) NOT NULL,
          sku VARCHAR(255) NOT NULL,
          brand VARCHAR(255),
          name VARCHAR(255) NOT NULL,
          price INTEGER,
          currency VARCHAR(10) NOT NULL DEFAULT 'CLP',
          presentation VARCHAR(255),
          image_url TEXT,
          available BOOLEAN NOT NULL DEFAULT FALSE,
          product_url TEXT NOT NULL,
          raw_json JSONB,
          first_seen_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
          last_seen_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (source, sku)
        );

        CREATE INDEX IF NOT EXISTS idx_scraped_products_source_seen
          ON scraped_products(source, last_seen_at DESC);

        CREATE TABLE IF NOT EXISTS app_metadata (
          key VARCHAR(100) PRIMARY KEY,
          value TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS analytics_events (
          id BIGSERIAL PRIMARY KEY,
          event_type VARCHAR(30) NOT NULL,
          page VARCHAR(160) NOT NULL,
          occurred_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_analytics_events_occurred_at
          ON analytics_events(occurred_at DESC);

        CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google_id
          ON users(google_id) WHERE google_id IS NOT NULL;
      `);

      // Compatible con instalaciones creadas antes de la revocación de sesiones.
      await p.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS session_version INTEGER NOT NULL DEFAULT 0");

      // Migrar datos legados desde db.json y catalog.sqlite si existen y la BD está limpia
      await seedAndMigrateFromLegacy(p);
      isInitialized = true;
    } catch (err) {
      const allowMemoryFallback = process.env.NODE_ENV === "test" || process.env.ALLOW_MEMORY_FALLBACK === "true";
      if (allowMemoryFallback) {
        console.warn("PostgreSQL no disponible, activando modo memoria para continuar:", err.message);
        useMemoryFallback = true;
        seedMemoryFromLegacy();
        isInitialized = true;
      } else {
        console.error("Error inicializando base de datos PostgreSQL:", err);
        throw err;
      }
    }
  })();

  return initPromise;
}

async function ensureInitialized() {
  if (!isInitialized) {
    await initDatabase();
  }
}

async function seedAndMigrateFromLegacy(p) {
  const notesCount = await p.query("SELECT COUNT(*) FROM olfactory_notes");
  if (parseInt(notesCount.rows[0].count, 10) === 0) {
    const dbPath = path.join(__dirname, "database.js");
    let legacyData = null;
    try {
      const { DEFAULT_DATA, DB_PATH } = require("./database");
      if (fs.existsSync(DB_PATH)) {
        legacyData = JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
      } else {
        legacyData = DEFAULT_DATA;
      }
    } catch {
      // Ignorar si no existe
    }

    if (legacyData) {
      // Insertar notas olfativas
      for (const note of legacyData.olfactoryNotes || []) {
        await p.query(
          "INSERT INTO olfactory_notes (id, name, family, description) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO NOTHING",
          [note.id, note.name, note.family, note.description]
        );
      }

      // Insertar productos base
      for (const prod of legacyData.products || []) {
        await p.query(
          "INSERT INTO base_products (id, name, brand, unit, base_price, category, gender, description, notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) ON CONFLICT (id) DO NOTHING",
          [prod.id, prod.name, prod.brand, prod.unit, prod.basePrice, prod.category, prod.gender, prod.description, JSON.stringify(prod.notes || [])]
        );
      }

      // Insertar cadenas
      for (const chain of legacyData.chains || []) {
        await p.query(
          "INSERT INTO chains (id, name) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING",
          [chain.id, chain.name]
        );
      }

      // Migrar usuarios si existen en db.json
      for (const user of legacyData.users || []) {
        await p.query(
          `INSERT INTO users (id, name, email, password_hash, google_id, picture, role, favorites, scent_preferences, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           ON CONFLICT (email) DO NOTHING`,
          [
            user.id,
            user.name,
            user.email,
            user.passwordHash || null,
            user.googleId || null,
            user.picture || null,
            user.role || "customer",
            JSON.stringify(user.favorites || []),
            user.scentPreferences ? JSON.stringify(user.scentPreferences) : null,
            user.createdAt || new Date().toISOString(),
          ]
        );
      }
    }

    // Migrar productos escaneados desde catalog.sqlite si existe
    const sqlitePath = path.resolve(__dirname, "..", env.sqlitePath);
    if (fs.existsSync(sqlitePath)) {
      try {
        const { DatabaseSync } = require("node:sqlite");
        const sqliteDb = new DatabaseSync(sqlitePath);
        const rows = sqliteDb.prepare("SELECT * FROM scraped_products").all();
        for (const row of rows) {
          let rawJson = {};
          try {
            rawJson = row.raw_json ? JSON.parse(row.raw_json) : {};
          } catch {
            rawJson = {};
          }
          await p.query(
            `INSERT INTO scraped_products (
              source, sku, brand, name, price, currency, presentation, image_url, available, product_url, raw_json, first_seen_at, last_seen_at
             ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
             ON CONFLICT (source, sku) DO UPDATE SET
               brand = EXCLUDED.brand, name = EXCLUDED.name, price = EXCLUDED.price, currency = EXCLUDED.currency,
               presentation = EXCLUDED.presentation, image_url = EXCLUDED.image_url, available = EXCLUDED.available,
               product_url = EXCLUDED.product_url, raw_json = EXCLUDED.raw_json, last_seen_at = EXCLUDED.last_seen_at`,
            [
              row.source,
              row.sku,
              row.brand || null,
              row.name,
              row.price ?? null,
              row.currency || "CLP",
              row.presentation || null,
              row.image_url || null,
              Boolean(row.available),
              row.product_url,
              JSON.stringify(rawJson),
              row.first_seen_at || new Date().toISOString(),
              row.last_seen_at || new Date().toISOString(),
            ]
          );
        }
      } catch (err) {
        console.warn("No se pudo migrar automáticamente catalog.sqlite:", err.message);
      }
    }
  }
}

function seedMemoryFromLegacy() {
  try {
    const { DEFAULT_DATA, DB_PATH } = require("./database");
    let legacyData = DEFAULT_DATA;
    if (fs.existsSync(DB_PATH)) {
      legacyData = JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
    }
    memoryStore.olfactoryNotes = legacyData.olfactoryNotes || DEFAULT_DATA.olfactoryNotes;
    memoryStore.baseProducts = legacyData.products || DEFAULT_DATA.products;
    memoryStore.chains = legacyData.chains || DEFAULT_DATA.chains;
    memoryStore.users = legacyData.users || [];
  } catch {
    // Usar defaults
  }
}

// Emulador mínimo para memoria si PostgreSQL no está disponible
function memoryQuery(text, params = []) {
  const sql = text.trim();
  if (sql.startsWith("SELECT COUNT(*) FROM olfactory_notes")) {
    return { rows: [{ count: String(memoryStore.olfactoryNotes.length) }] };
  }
  if (sql.includes("FROM olfactory_notes")) {
    return { rows: memoryStore.olfactoryNotes };
  }
  if (sql.includes("FROM base_products")) {
    return {
      rows: memoryStore.baseProducts.map((p) => ({
        id: p.id,
        name: p.name,
        brand: p.brand,
        unit: p.unit,
        base_price: p.basePrice,
        category: p.category,
        gender: p.gender,
        description: p.description,
        notes: p.notes,
      })),
    };
  }
  if (sql.includes("FROM chains")) {
    return { rows: memoryStore.chains };
  }
  if (sql.includes("FROM users WHERE LOWER(email) = LOWER($1)")) {
    const email = params[0]?.toLowerCase();
    const user = memoryStore.users.find((u) => u.email.toLowerCase() === email);
    return { rows: user ? [userToPgRow(user)] : [] };
  }
  if (sql.includes("FROM users WHERE id = $1")) {
    const user = memoryStore.users.find((u) => u.id === params[0]);
    return { rows: user ? [userToPgRow(user)] : [] };
  }
  if (sql.includes("SELECT created_at FROM users")) {
    return { rows: memoryStore.users.map(user => ({ created_at: user.created_at || user.createdAt || new Date().toISOString() })) };
  }
  if (sql.includes("INSERT INTO analytics_events")) {
    memoryStore.analyticsEvents.push({ event_type: params[0], page: params[1], occurred_at: new Date().toISOString() });
    return { rows: [] };
  }
  if (sql.includes("FROM analytics_events WHERE occurred_at")) {
    const since = new Date(params[0]).getTime();
    return { rows: memoryStore.analyticsEvents.filter(event => new Date(event.occurred_at).getTime() >= since) };
  }
  if (sql.includes("FROM app_metadata WHERE key = $1")) {
    const value = memoryStore.appMetadata.get(params[0]);
    return { rows: value === undefined ? [] : [{ value }] };
  }
  if (sql.includes("INSERT INTO app_metadata")) {
    memoryStore.appMetadata.set(params[0], params[1]);
    return { rows: [] };
  }
  if (sql.includes("INSERT INTO users")) {
    const hasGoogleFields = sql.includes("google_id");
    const user = {
      id: params[0],
      name: params[1],
      email: params[2],
      password_hash: params[3],
      google_id: hasGoogleFields ? params[4] : null,
      picture: hasGoogleFields ? params[5] : null,
      role: hasGoogleFields ? params[6] : params[4],
      favorites: hasGoogleFields ? (params[7] ? JSON.parse(params[7]) : []) : (params[5] ? JSON.parse(params[5]) : []),
      scent_preferences: hasGoogleFields ? (params[8] ? JSON.parse(params[8]) : null) : (params[6] ? JSON.parse(params[6]) : null),
      created_at: hasGoogleFields ? params[9] : params[7],
    };
    memoryStore.users.push(user);
    return { rows: [userToPgRow(user)] };
  }
  if (sql.includes("UPDATE users SET name = $2 WHERE id = $1")) {
    const user = memoryStore.users.find((u) => u.id === params[0]);
    if (user) user.name = params[1];
    return { rows: user ? [userToPgRow(user)] : [] };
  }
  if (sql.includes("UPDATE users SET password_hash = $2 WHERE id = $1")) {
    const user = memoryStore.users.find((u) => u.id === params[0]);
    if (user) user.password_hash = params[1];
    return { rows: user ? [userToPgRow(user)] : [] };
  }
  if (sql.includes("UPDATE users SET session_version = session_version + 1 WHERE id = $1")) {
    const user = memoryStore.users.find((u) => u.id === params[0]);
    if (user) user.session_version = Number(user.session_version || user.sessionVersion || 0) + 1;
    return { rows: user ? [{ session_version: user.session_version }] : [] };
  }
  if (sql.includes("DELETE FROM users WHERE id = $1")) {
    const index = memoryStore.users.findIndex((u) => u.id === params[0]);
    if (index >= 0) memoryStore.users.splice(index, 1);
    return { rows: [], rowCount: index >= 0 ? 1 : 0 };
  }
  if (sql.includes("UPDATE users SET favorites = $2 WHERE id = $1")) {
    const user = memoryStore.users.find((u) => u.id === params[0]);
    if (user) user.favorites = params[1] ? JSON.parse(params[1]) : [];
    return { rows: user ? [userToPgRow(user)] : [] };
  }
  if (sql.includes("UPDATE users SET scent_preferences = $2 WHERE id = $1")) {
    const user = memoryStore.users.find((u) => u.id === params[0]);
    if (user) user.scent_preferences = params[1] ? JSON.parse(params[1]) : null;
    return { rows: user ? [userToPgRow(user)] : [] };
  }
  if (sql.includes("UPDATE users SET google_id =")) {
    const user = memoryStore.users.find((u) => u.id === params[params.length - 1]);
    if (user) {
      if (params[0]) user.google_id = params[0];
      if (params[1]) user.picture = params[1];
    }
    return { rows: user ? [userToPgRow(user)] : [] };
  }
  if (sql.includes("FROM scraped_products WHERE source = $1")) {
    const source = params[0];
    const limit = params[1] || 10000;
    const list = Array.from(memoryStore.scrapedProducts.values())
      .filter((p) => p.source === source)
      .slice(0, limit);
    return { rows: list };
  }
  if (sql.includes("INSERT INTO scraped_products")) {
    const key = `${params[0]}:${params[1]}`;
    const prod = {
      source: params[0],
      sku: params[1],
      brand: params[2],
      name: params[3],
      price: params[4],
      currency: params[5],
      presentation: params[6],
      image_url: params[7],
      available: params[8],
      product_url: params[9],
      raw_json: params[10] ? JSON.parse(params[10]) : {},
      first_seen_at: params[11],
      last_seen_at: params[12],
    };
    memoryStore.scrapedProducts.set(key, prod);
    return { rows: [prod] };
  }
  if (sql.includes("DELETE FROM scraped_products WHERE source = $1")) {
    const source = params[0];
    for (const [key, val] of memoryStore.scrapedProducts.entries()) {
      if (val.source === source) memoryStore.scrapedProducts.delete(key);
    }
    return { rows: [] };
  }
  return { rows: [] };
}

function userToPgRow(u) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    password_hash: u.password_hash || u.passwordHash,
    google_id: u.google_id || u.googleId || null,
    picture: u.picture || null,
    role: u.role || "customer",
    session_version: Number(u.session_version || u.sessionVersion || 0),
    favorites: typeof u.favorites === "string" ? JSON.parse(u.favorites) : (u.favorites || []),
    scent_preferences: typeof u.scent_preferences === "string" ? JSON.parse(u.scent_preferences) : (u.scent_preferences || u.scentPreferences || null),
    created_at: u.created_at || u.createdAt || new Date().toISOString(),
  };
}

module.exports = {
  query,
  initDatabase,
  getPool,
};
