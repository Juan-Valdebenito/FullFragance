const test = require("node:test");
const assert = require("node:assert/strict");
const {
  buildPreunicCatalogPageUrl,
  extractCatalogProducts,
  extractTotalProducts,
  normalizeProduct,
} = require("../src/services/preunicScraper");

const payload = {
  catalog: {
    content: [
      {
        id: "595067",
        sku: "595067",
        name: "Perfume Mujer Hot Vainilla EDP 100 ml",
        brand: "Plaisance",
        slug: "perfume-mujer-hot-vainilla-edp-100-ml-new",
        image: "https://static.preunic.cl/perfume-hot-vainilla.jpg",
        offerPrice: 13999,
        cardPrice: 15999,
        state: "active",
        categories: ["perfumes mujer", "perfumes y fragancias"],
      },
    ],
    pagination: { total: 525, rows: 24, start: 0 },
  },
};

test("consulta la categoría de perfumes de Preunic con paginación", () => {
  const url = new URL(buildPreunicCatalogPageUrl(3));
  assert.equal(url.hostname, "api.empathy.co");
  assert.equal(url.searchParams.get("rows"), "24");
  assert.equal(url.searchParams.get("start"), "48");
  assert.deepEqual(url.searchParams.getAll("filter"), ["filterCategory:perfumes-y-fragancias"]);
});

test("normaliza un perfume de la colección pública de Preunic", () => {
  const products = extractCatalogProducts(payload);
  assert.equal(products.length, 1);
  assert.equal(products[0].source, "preunic-cl");
  assert.equal(products[0].sku, "595067");
  assert.equal(products[0].price, 13999);
  assert.equal(products[0].presentation, "100 ml");
  assert.equal(products[0].imageUrl, "https://static.preunic.cl/perfume-hot-vainilla.jpg");
  assert.equal(products[0].url, "https://preunic.cl/products/perfume-mujer-hot-vainilla-edp-100-ml-new");
  assert.equal(products[0].raw.regularPrice, 15999);
  assert.equal(extractTotalProducts(payload), 525);
});

test("descarta productos fuera de la categoría de perfumes", () => {
  assert.throws(() => normalizeProduct({ ...payload.catalog.content[0], categories: ["cuidado capilar"] }), /no es un perfume/);
});
