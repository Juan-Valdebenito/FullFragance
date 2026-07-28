const fs = require("fs");
const path = require("path");

const bcrypt = require("bcryptjs");

const DB_PATH = path.join(__dirname, "db.json");
const CATALOG_VERSION = 3;

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
    { id: "p1", name: "Sauvage", brand: "Dior", unit: "EDT 100 ml", basePrice: 89990, category: "Amaderado especiado", gender: "Masculino", description: "Una composición de una frescura rotunda, dictada por una salida radiante de bergamota de Calabria y un fondo amaderado envuelto en pimienta Sichuan y ámbar de cetalox.", notes: ["n1", "n16", "n14", "n8"] },
    { id: "p2", name: "N°5", brand: "Chanel", unit: "EDP 100 ml", basePrice: 145000, category: "Floral aldehídico", gender: "Femenino", description: "El aroma mítico de la perfumería femenina. Un ramo floral abstracto sublimado por aldehídos, corazón seductores de jazmín de Grasse y rosa de mayo sobre un cálido sándalo.", notes: ["n4", "n5", "n7", "n9"] },
    { id: "p3", name: "Bleu de Chanel", brand: "Chanel", unit: "EDP 100 ml", basePrice: 119990, category: "Amaderado aromático", gender: "Masculino", description: "Un tributo a la libertad masculina en una fragancia amaderada aromática de estela cautivadora. Combina notas cítricas de limón con cedro seco y vetiver ahumado.", notes: ["n2", "n8", "n15", "n10"] },
    { id: "p4", name: "La Vie Est Belle", brand: "Lancôme", unit: "EDP 75 ml", basePrice: 94990, category: "Floral gourmand", gender: "Femenino", description: "Una declaración universal a la belleza de la vida. Destaca por su majestuoso corazón de iris, pera jugosa y un fondo envolvente de vainilla y praliné cacao.", notes: ["n21", "n7", "n11", "n13"] },
    { id: "p5", name: "Acqua di Giò", brand: "Giorgio Armani", unit: "EDT 100 ml", basePrice: 79990, category: "Acuático fresco", gender: "Masculino", description: "Inspirado en la costa salvaje del Mediterráneo. Una fragancia marina y fresca que combina notas acuáticas con cítricos, lavanda suave y elegante cedro.", notes: ["n18", "n2", "n6", "n8"] },
    { id: "p6", name: "Black Opium", brand: "Yves Saint Laurent", unit: "EDP 90 ml", basePrice: 98990, category: "Oriental gourmand", gender: "Femenino", description: "Una fragancia adictiva e hiper-sensual. El llamativo contraste entre el café negro amargo y las flores blancas de jazmín, rematado con vainilla gourmand y ámbar.", notes: ["n12", "n11", "n5", "n14"] },
    { id: "p7", name: "Aventus", brand: "Creed", unit: "EDP 100 ml", basePrice: 289990, category: "Chipre afrutado", gender: "Masculino", description: "Celebra la fuerza, el poder y el éxito. Abre con acordes chispeantes de piña fresca y bergamota, evolucionando hacia un corazón ahumado de vetiver y cedro.", notes: ["n22", "n1", "n10", "n8"] },
    { id: "p8", name: "Flowerbomb", brand: "Viktor & Rolf", unit: "EDP 100 ml", basePrice: 109990, category: "Floral gourmand", gender: "Femenino", description: "Una explosión floral voluptuosa y mágica. Un ramillete intenso de rosa, jazmín Sambac y orquídea fundido sobre una apetitosa base de vainilla y notas cacao.", notes: ["n4", "n5", "n11", "n13"] },
    { id: "p9", name: "Good Girl", brand: "Carolina Herrera", unit: "EDP 80 ml", basePrice: 92990, category: "Floral oriental", gender: "Femenino", description: "Icono de la dualidad femenina. Combina la luminosidad del jazmín tuberosa con la oscuridad misteriosa del cacao, haba tonka y dulce vainilla.", notes: ["n13", "n5", "n11", "n14"] },
    { id: "p10", name: "Light Blue", brand: "Dolce & Gabbana", unit: "EDT 100 ml", basePrice: 69990, category: "Cítrico floral", gender: "Femenino", description: "La alegría de vivir al estilo mediterráneo. Un perfume fresco y chispeante compuesto por manzana Granny Smith, limón siciliano y toques florales de rosa sobre cedro.", notes: ["n2", "n20", "n4", "n8"] },
    { id: "p11", name: "1 Million", brand: "Paco Rabanne", unit: "EDT 100 ml", basePrice: 84990, category: "Especiado cuero", gender: "Masculino", description: "Audaz, descarado y seductor. Notas de salida de mandarina cítrica y menta, un corazón especiado de canela y pimienta, con una cálida estela de ámbar y cuero.", notes: ["n3", "n17", "n16", "n14"] },
    { id: "p12", name: "Terre d'Hermès", brand: "Hermès", unit: "EDT 100 ml", basePrice: 124990, category: "Amaderado cítrico", gender: "Masculino", description: "Conecta al hombre con sus orígenes y con las fuerzas de la naturaleza. Una fragancia vegetal y mineral que une la amargura de la naranja con vetiver, incienso y cedro.", notes: ["n3", "n10", "n15", "n8"] },
    { id: "p13", name: "Boss Bottled", brand: "Hugo Boss", unit: "EDT 100 ml", basePrice: 76990, category: "Amaderado especiado", gender: "Masculino", description: "Un clásico contemporáneo para el hombre moderno. Salida afrutada de manzana verde y canela, con un elegante secado amaderado de cedro y sándalo.", notes: ["n20", "n17", "n8", "n9"] },
    { id: "p14", name: "Eros", brand: "Versace", unit: "EDT 100 ml", basePrice: 82990, category: "Oriental fresco", gender: "Masculino", description: "Inspirado en la mitología griega y la pasión desmedida. Notas refrescantes de menta helada y manzana verde combinadas con haba tonka, ambar y vainilla.", notes: ["n19", "n20", "n11", "n14"] },
    { id: "p15", name: "Libre", brand: "Yves Saint Laurent", unit: "EDP 90 ml", basePrice: 104990, category: "Floral aromático", gender: "Femenino", description: "El perfume de la libertad audaz. La tensión entre la sensualidad del flor de azahar y jazmín con la audacia de la lavanda francesa y la calidez de la vainilla.", notes: ["n6", "n5", "n11", "n1"] },
    { id: "p16", name: "Invictus", brand: "Paco Rabanne", unit: "EDT 100 ml", basePrice: 83990, category: "Acuático amaderado", gender: "Masculino", description: "La fragancia de la victoria. Un contraste entre la frescura marina del acorde acuático con la calidez del laurel, ámbar gris y madera de cedro.", notes: ["n18", "n1", "n8", "n14"] },
    { id: "p17", name: "212 VIP Black", brand: "Carolina Herrera", unit: "EDP 100 ml", basePrice: 89990, category: "Aromático especiado", gender: "Masculino", description: "Una fragancia nocturna exclusiva y rompedora. Abre con un acorde explosivo de absenta, lavanda aromática y una envolvente base de vainilla negra y almizcle.", notes: ["n6", "n11", "n14", "n16"] },
    { id: "p18", name: "Scandal", brand: "Jean Paul Gaultier", unit: "EDP 80 ml", basePrice: 96990, category: "Floral gourmand", gender: "Femenino", description: "Una sobredosis de placer sensual e irreverente. Una miel gourmand irresistible combinada con la elegancia de la gardenia, jazmín y la calidez del pachulí.", notes: ["n5", "n11", "n3", "n13"] }
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
    (u) => u.favorites === undefined || u.scentPreferences === undefined || u.role === undefined
  );
  if (needsUserMigration) {
    db.users = (db.users || []).map((user) => ({
      ...user,
      favorites: user.favorites || [],
      scentPreferences: user.scentPreferences ?? null,
      role: user.role || "customer",
    }));
    changed = true;
  }

  // Garantizar usuario administrador por defecto
  const adminEmail = "fullfragance@gmail.com";
  db.users = db.users || [];
  const existingAdmin = db.users.find((u) => u.email.toLowerCase() === adminEmail.toLowerCase());
  const adminPasswordHash = bcrypt.hashSync("123456", 10);

  if (!existingAdmin) {
    db.users.push({
      id: "admin-fullfragrance",
      name: "Administrador FullFragrance",
      email: adminEmail,
      passwordHash: adminPasswordHash,
      role: "admin",
      city: null,
      favorites: [],
      scentPreferences: null,
      createdAt: new Date().toISOString(),
    });
    changed = true;
  } else if (existingAdmin.role !== "admin" || !bcrypt.compareSync("123456", existingAdmin.passwordHash)) {
    existingAdmin.role = "admin";
    existingAdmin.passwordHash = adminPasswordHash;
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
