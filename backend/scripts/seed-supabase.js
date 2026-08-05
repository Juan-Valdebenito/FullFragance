/**
 * Script de seed para Supabase.
 *
 * Conecta a la base de datos de Supabase usando DATABASE_URL y migra
 * los datos del catálogo interno (notas olfativas, productos base, cadenas)
 * y el catálogo scraping desde catalog.sqlite si existe.
 *
 * Uso:
 *   DATABASE_URL=postgresql://... node scripts/seed-supabase.js
 *
 * También puedes crear un archivo backend/.env con DATABASE_URL y ejecutar:
 *   npm run seed:supabase
 */

try { require("dotenv").config(); } catch {}

const { initDatabase, getPool } = require("../src/data/pgDatabase");

async function main() {
  console.log("🚀 Iniciando seed en Supabase...\n");

  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL no está definida.");
    console.error("   Agrégala a tu archivo backend/.env o como variable de entorno.\n");
    process.exit(1);
  }

  try {
    // initDatabase() ya maneja toda la lógica de migración:
    // - Crea tablas (IF NOT EXISTS)
    // - Migra datos de db.json (notas, productos, cadenas, usuarios)
    // - Migra catálogo desde catalog.sqlite si existe
    await initDatabase();

    const pool = getPool();

    // Conteos finales para verificar
    const [notes, products, chains, users, scraped] = await Promise.all([
      pool.query("SELECT COUNT(*) FROM olfactory_notes"),
      pool.query("SELECT COUNT(*) FROM base_products"),
      pool.query("SELECT COUNT(*) FROM chains"),
      pool.query("SELECT COUNT(*) FROM users"),
      pool.query("SELECT COUNT(*) FROM scraped_products"),
    ]);

    console.log("✅ Seed completado en Supabase:\n");
    console.log(`   📝 Notas olfativas:    ${notes.rows[0].count}`);
    console.log(`   🧴 Productos base:     ${products.rows[0].count}`);
    console.log(`   🏪 Cadenas:            ${chains.rows[0].count}`);
    console.log(`   👤 Usuarios:           ${users.rows[0].count}`);
    console.log(`   💰 Productos scraping: ${scraped.rows[0].count}`);
    console.log("\n🎉 Tu base de datos en Supabase está lista para producción.");

    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error("❌ Error durante el seed:", err.message);
    console.error("\nVerifica que DATABASE_URL sea correcta y que el proyecto de Supabase esté activo.\n");
    process.exit(1);
  }
}

main();
