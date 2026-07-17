const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(__dirname, "db.json");

const DEFAULT_DATA = {
  users: [],
  products: [
    { id: "p1", name: "Pan hallulla", unit: "por kg", basePrice: 1900, category: "Panadería" },
    { id: "p2", name: "Leche entera", unit: "1 L", basePrice: 1150, category: "Lácteos" },
    { id: "p3", name: "Arroz grado 2", unit: "1 kg", basePrice: 1350, category: "Abarrotes" },
    { id: "p4", name: "Aceite vegetal", unit: "1 L", basePrice: 2600, category: "Abarrotes" },
    { id: "p5", name: "Bebida cola", unit: "1.5 L", basePrice: 1700, category: "Bebidas" },
    { id: "p6", name: "Huevos", unit: "12 unidades", basePrice: 3200, category: "Lácteos" },
    { id: "p7", name: "Café instantáneo", unit: "170 g", basePrice: 5400, category: "Abarrotes" },
    { id: "p8", name: "Papel higiénico", unit: "12 rollos", basePrice: 6200, category: "Hogar" },
    { id: "p9", name: "Palta hass", unit: "por kg", basePrice: 2900, category: "Frutas y verduras" },
    { id: "p10", name: "Detergente líquido", unit: "1 kg", basePrice: 4300, category: "Hogar" }
  ],
  chains: [
    { id: "c1", name: "Líder" },
    { id: "c2", name: "Jumbo" },
    { id: "c3", name: "Santa Isabel" },
    { id: "c4", name: "Unimarc" },
    { id: "c5", name: "Tottus" }
  ]
};

function ensureDbFile() {
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify(DEFAULT_DATA, null, 2));
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

module.exports = { readDb, writeDb, DB_PATH };
