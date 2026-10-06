const test = require("node:test");
const assert = require("node:assert/strict");

// Se reemplaza getComparison para probar la búsqueda sin base de datos.
const priceService = require("../src/models/priceService");
function item(id, overrides = {}) {
  const { prices = [{ storeId: "a", storeName: "Falabella", price: 10000 }], ...product } = overrides;
  const sorted = [...prices].sort((a, b) => a.price - b.price);
  return {
    product: { id, name: `Perfume ${id}`, brand: "Dior", unit: "100 ml", basePrice: sorted[0]?.price ?? 0, category: "Perfumes", gender: "Masculino", matchedStores: prices.length, aliases: [id], ...product },
    prices: sorted,
    minPrice: sorted[0]?.price ?? null,
    maxPrice: sorted.at(-1)?.price ?? null,
  };
}
const catalog = [
  item("sauvage", { name: "Sauvage EDT", prices: [{ storeName: "Falabella", price: 90000 }, { storeName: "Paris", price: 80000 }] }),
  item("asad", { brand: "Lattafa", name: "Asad EDP", prices: [{ storeName: "Silk Perfumes", price: 25000 }] }),
  item("aventus", { brand: "Creed", name: "Aventus EDP", gender: "Masculino", prices: [{ storeName: "Paris", price: 300000 }] }),
  item("set-good-girl", { brand: "Carolina Herrera", name: "Set Good Girl EDP 80 ml + 10 ml", gender: "Femenino", aliases: ["silk-123"] }),
];
// El módulo guarda la referencia a getComparison al cargarse; se cambia el
// catálogo actual a través de esta variable.
let currentCatalog = catalog;
priceService.getComparison = async () => currentCatalog;
const { searchCatalog, suggest, comparisonsByIds, parseSearchParams, similarComparables: searchSimilar } = require("../src/models/catalogSearch");

test("pagina resultados y respeta el tamaño máximo de página", async () => {
  const first = await searchCatalog({ pageSize: "2" });
  assert.equal(first.total, 4);
  assert.equal(first.totalPages, 2);
  assert.equal(first.items.length, 2);
  // Una página fuera de rango se ajusta a la última en vez de devolver vacío.
  const last = await searchCatalog({ pageSize: "2", page: "99" });
  assert.equal(last.page, 2);
  assert.equal(parseSearchParams({ pageSize: "5000" }).pageSize, 48);
});

test("aplica filtros de segmento, tienda, precio, presentación y comparación", async () => {
  const ids = async (query) => (await searchCatalog(query)).items.map((entry) => entry.product.id);
  assert.deepEqual(await ids({ segment: "arabic" }), ["asad"]);
  assert.deepEqual(await ids({ segment: "niche" }), ["aventus"]);
  assert.deepEqual(await ids({ store: "Paris", sort: "price" }), ["sauvage", "aventus"]);
  assert.deepEqual(await ids({ maxPrice: "30000" }), ["set-good-girl", "asad"]);
  assert.deepEqual(await ids({ presentation: "set" }), ["set-good-girl"]);
  assert.deepEqual(await ids({ comparison: "multiple" }), ["sauvage"]);
  assert.deepEqual(await ids({ gender: "Femenino" }), ["set-good-girl"]);
});

test("busca por texto y arma las opciones de los selectores desde esa búsqueda", async () => {
  const result = await searchCatalog({ q: "perfume asad", brand: "Dior" });
  assert.equal(result.total, 0);
  assert.deepEqual(result.facets.brands, ["Lattafa"]);
  assert.deepEqual(result.facets.stores, ["Silk Perfumes"]);
});

test("ordena por más tiendas primero en el orden recomendado", async () => {
  const { items } = await searchCatalog({});
  assert.equal(items[0].product.id, "sauvage");
});

test("devuelve favoritos por id o por alias de tienda", async () => {
  const result = await comparisonsByIds(["silk-123", "no-existe"]);
  assert.deepEqual(result.map((entry) => entry.product.id), ["set-good-girl"]);
});

test("sugiere otras versiones comparables de la misma fragancia, sin mezclar líneas", async () => {
  // Arreglo nuevo: el índice se cachea por identidad del catálogo.
  const extended = [...catalog,
    item("eros-edp-single", { brand: "Versace", name: "Versace Eros Pour Homme EDP 100 ml", prices: [{ storeName: "Paris", price: 70000 }] }),
    item("eros-edt", { brand: "Versace", name: "Perfume Hombre Eros EDT 100Ml", prices: [{ storeName: "Paris", price: 60000 }, { storeName: "Falabella", price: 65000 }] }),
    item("eros-femme", { brand: "Versace", name: "Perfume Mujer Eros Pour Femme EDT 100Ml", gender: "Femenino", prices: [{ storeName: "Paris", price: 60000 }, { storeName: "Falabella", price: 65000 }] }),
    item("eros-flame", { brand: "Versace", name: "Eros Flame EDP 100 ml", prices: [{ storeName: "Paris", price: 60000 }, { storeName: "Ripley", price: 65000 }] }),
  ];
  currentCatalog = extended;
  const similar = await searchSimilar("eros-edp-single");
  assert.deepEqual(similar.map((entry) => entry.product.id), ["eros-edt"]);
  assert.equal(await searchSimilar("no-existe"), null);
  currentCatalog = catalog;
});

test("informa cuántos comparables hay dentro de los filtros activos", async () => {
  const all = await searchCatalog({ store: "Paris" });
  const onlyComparable = await searchCatalog({ store: "Paris", comparison: "multiple" });
  assert.equal(all.unfilteredTotal, all.total);
  assert.equal(onlyComparable.total, all.comparableTotal);
  assert.equal(onlyComparable.unfilteredTotal, all.total);
});

test("aplica la intención escrita como filtros y la informa", async () => {
  const result = await searchCatalog({ q: "perfume arabe bajo 30 mil" });
  assert.deepEqual(result.items.map((entry) => entry.product.id), ["asad"]);
  assert.deepEqual(result.intent.map((chip) => chip.key), ["segment", "maxPrice"]);
  // Un filtro explícito en la URL gana sobre la intención escrita.
  const explicit = await searchCatalog({ q: "nicho", segment: "arabic" });
  assert.deepEqual(explicit.items.map((entry) => entry.product.id), ["asad"]);
  assert.deepEqual(explicit.intent, []);
});

test("corrige errores de tipeo cuando no hay coincidencias exactas", async () => {
  const result = await searchCatalog({ q: "sauvaje" });
  assert.deepEqual(result.items.map((entry) => entry.product.id), ["sauvage"]);
  assert.equal(result.correctedQuery, "sauvage");
  assert.equal((await searchCatalog({ q: "sauvage" })).correctedQuery, null);
});

test("sugiere perfumes y marcas mientras se escribe", async () => {
  const result = await suggest("lat");
  assert.deepEqual(result.brands, [{ name: "Lattafa", count: 1 }]);
  assert.deepEqual(result.products.map((product) => product.id), ["asad"]);
  assert.equal(result.products[0].minPrice, 25000);

  const typo = await suggest("carolina herera");
  assert.equal(typo.correctedQuery, "carolina herrera");
  assert.deepEqual(typo.products.map((product) => product.id), ["set-good-girl"]);

  const intent = await suggest("perfume de mujer");
  assert.equal(intent.text, "");
  assert.deepEqual(intent.chips.map((chip) => chip.label), ["Mujer"]);
  assert.equal(intent.total, 1);
});

test("deduce el género desde el nombre cuando el catálogo no lo trae", async () => {
  currentCatalog = [...catalog,
    item("eros-sin-genero", { brand: "Versace", name: "Eros Pour Homme EDT 100 ml", gender: "", prices: [{ storeName: "Paris", price: 60000 }] }),
    item("idole-sin-genero", { brand: "Lancome", name: "Perfume Mujer Idole EDP 50 ml", gender: undefined, prices: [{ storeName: "Paris", price: 70000 }] }),
  ];
  const ids = async (query) => (await searchCatalog(query)).items.map((entry) => entry.product.id).sort();
  assert.deepEqual(await ids({ gender: "Masculino", q: "eros" }), ["eros-sin-genero"]);
  assert.deepEqual(await ids({ q: "perfume de mujer" }), ["idole-sin-genero", "set-good-girl"]);
  currentCatalog = catalog;
});
