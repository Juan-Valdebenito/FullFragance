const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(__dirname, "db.json");
const CATALOG_VERSION = 2;

const DEFAULT_DATA = {
  catalogVersion: CATALOG_VERSION,
  users: [],
  olfactoryNotes: [
    { id: "n1", name: "Bergamota", family: "Cítricos", description: "Cítrico fresco y luminoso, muy usado en fragancias masculinas y unisex." },
    { id: "n2", name: "Limón", family: "Cítricos", description: "Nota ácida y vibrante que aporta energía y limpieza al inicio." },
    { id: "n3", name: "Naranja", family: "Cítricos", description: "Dulce y jugosa, aporta calidez sin perder frescura." },
    { id: "n4", name: "Rosa", family: "Florales", description: "Clásica y elegante, corazón romántico de innumerables perfumes." },
    { id: "n5", name: "Jazmín", family: "Florales", description: "Intenso y sensual, aporta profundidad floral nocturna." },
    { id: "n6", name: "Lavanda", family: "Florales", description: "Herbácea y relajante, equilibra frescura y suavidad." },
    { id: "n7", name: "Iris", family: "Florales", description: "Polvorosa y refinada, nota sofisticada de alta perfumería." },
    { id: "n8", name: "Cedro", family: "Amaderados", description: "Madera seca y elegante, base masculina muy popular." },
    { id: "n9", name: "Sándalo", family: "Amaderados", description: "Cremoso y cálido, envolvente en el secado." },
    { id: "n10", name: "Vetiver", family: "Amaderados", description: "Terroso y ahumado, aporta carácter y persistencia." },
    { id: "n11", name: "Vainilla", family: "Gourmand", description: "Dulce y reconfortante, base gourmand por excelencia." },
    { id: "n12", name: "Café", family: "Gourmand", description: "Amargo y adictivo, moderno en fragancias orientales." },
    { id: "n13", name: "Cacao", family: "Gourmand", description: "Profundo y seductor, aporta densidad y calidez." },
    { id: "n14", name: "Ámbar", family: "Orientales", description: "Resinoso y cálido, envolvente en el fondo del perfume." },
    { id: "n15", name: "Incienso", family: "Orientales", description: "Místico y ahumado, aporta solemnidad y profundidad." },
    { id: "n16", name: "Pimienta", family: "Especiados", description: "Picante y vibrante, despierta el inicio de la fragancia." },
    { id: "n17", name: "Canela", family: "Especiados", description: "Cálida y especiada, sensual en combinación con dulces." },
    { id: "n18", name: "Acuático", family: "Frescos", description: "Marino y limpio, evoca brisa y frescura moderna." },
    { id: "n19", name: "Menta", family: "Frescos", description: "Helada y vigorizante, ideal para fragancias veraniegas." },
    { id: "n20", name: "Manzana", family: "Afrutados", description: "Jugosa y crujiente, aporta dulzura natural al inicio." },
    { id: "n21", name: "Pera", family: "Afrutados", description: "Suave y delicada, floral-frutal muy versátil." },
    { id: "n22", name: "Piña", family: "Afrutados", description: "Tropical y chispeante, aporta carácter distintivo." }
  ],
  products: [
    { id: "p1", name: "Sauvage", brand: "Dior", unit: "EDT 100 ml", basePrice: 89990, category: "Amaderado especiado", gender: "Masculino", notes: ["n1", "n16", "n14", "n8"] },
    { id: "p2", name: "N°5", brand: "Chanel", unit: "EDP 100 ml", basePrice: 145000, category: "Floral aldehídico", gender: "Femenino", notes: ["n4", "n5", "n7", "n9"] },
    { id: "p3", name: "Bleu de Chanel", brand: "Chanel", unit: "EDP 100 ml", basePrice: 119990, category: "Amaderado aromático", gender: "Masculino", notes: ["n2", "n8", "n15", "n10"] },
    { id: "p4", name: "La Vie Est Belle", brand: "Lancôme", unit: "EDP 75 ml", basePrice: 94990, category: "Floral gourmand", gender: "Femenino", notes: ["n21", "n7", "n11", "n13"] },
    { id: "p5", name: "Acqua di Giò", brand: "Giorgio Armani", unit: "EDT 100 ml", basePrice: 79990, category: "Acuático fresco", gender: "Masculino", notes: ["n18", "n2", "n6", "n8"] },
    { id: "p6", name: "Black Opium", brand: "Yves Saint Laurent", unit: "EDP 90 ml", basePrice: 98990, category: "Oriental gourmand", gender: "Femenino", notes: ["n12", "n11", "n5", "n14"] },
    { id: "p7", name: "Aventus", brand: "Creed", unit: "EDP 100 ml", basePrice: 289990, category: "Chipre afrutado", gender: "Masculino", notes: ["n22", "n1", "n10", "n8"] },
    { id: "p8", name: "Flowerbomb", brand: "Viktor & Rolf", unit: "EDP 100 ml", basePrice: 109990, category: "Floral gourmand", gender: "Femenino", notes: ["n4", "n5", "n11", "n13"] },
    { id: "p9", name: "Good Girl", brand: "Carolina Herrera", unit: "EDP 80 ml", basePrice: 92990, category: "Floral oriental", gender: "Femenino", notes: ["n13", "n5", "n11", "n14"] },
    { id: "p10", name: "Light Blue", brand: "Dolce & Gabbana", unit: "EDT 100 ml", basePrice: 69990, category: "Cítrico floral", gender: "Femenino", notes: ["n2", "n20", "n4", "n8"] },
    { id: "p11", name: "1 Million", brand: "Paco Rabanne", unit: "EDT 100 ml", basePrice: 84990, category: "Especiado cuero", gender: "Masculino", notes: ["n3", "n17", "n16", "n14"] },
    { id: "p12", name: "Terre d'Hermès", brand: "Hermès", unit: "EDT 100 ml", basePrice: 124990, category: "Amaderado cítrico", gender: "Masculino", notes: ["n3", "n10", "n15", "n8"] }
  ],
  chains: [
    { id: "c1", name: "Sephora" },
    { id: "c2", name: "Falabella" },
    { id: "c3", name: "Ripley" },
    { id: "c4", name: "Paris" },
    { id: "c5", name: "La Polar" }
  ]
};

function ensureDbFile() {
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify(DEFAULT_DATA, null, 2));
    return;
  }

  const db = JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
  let changed = false;

  if (!db.catalogVersion || db.catalogVersion < CATALOG_VERSION) {
    db.catalogVersion = CATALOG_VERSION;
    db.olfactoryNotes = DEFAULT_DATA.olfactoryNotes;
    db.products = DEFAULT_DATA.products;
    db.chains = DEFAULT_DATA.chains;
    changed = true;
  }

  if (!db.olfactoryNotes) {
    db.olfactoryNotes = DEFAULT_DATA.olfactoryNotes;
    changed = true;
  }

  const needsUserMigration = (db.users || []).some(
    (u) => u.favorites === undefined || u.scentPreferences === undefined
  );
  if (needsUserMigration) {
    db.users = (db.users || []).map((user) => ({
      ...user,
      favorites: user.favorites || [],
      scentPreferences: user.scentPreferences ?? null,
    }));
    changed = true;
  }

  if (changed) {
    writeDb(db);
  }
}

function readDb() {
  ensureDbFile();
  const raw = fs.readFileSync(DB_PATH, "utf-8");
  return JSON.parse(raw);
}

function writeDb(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

module.exports = { readDb, writeDb, DB_PATH, DEFAULT_DATA };
