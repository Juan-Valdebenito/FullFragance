const test = require("node:test");
const assert = require("node:assert/strict");
const {
  assertSilkUrl,
  buildSilkCatalogPageUrl,
  normalizeProduct,
} = require("../src/services/silkScraper");

const product = {
  id: 8540615704793,
  title: "Lattafa Yara EDP 100 ml",
  handle: "lattafa-yara-edp-100-ml",
  vendor: "Lattafa",
  product_type: "Perfumes Árabes",
  tags: ["Mujer", "Árabe"],
  variants: [{
    id: 44693984477401,
    sku: "LTTF62",
    available: true,
    price: "19990",
    compare_at_price: "43990",
  }],
  images: [{ src: "https://cdn.shopify.com/yara.png" }],
};

test("normaliza un perfume público de Silk", () => {
  const normalized = normalizeProduct(product);
  assert.equal(normalized.source, "silk-cl");
  assert.equal(normalized.sku, "LTTF62");
  assert.equal(normalized.brand, "Lattafa");
  assert.equal(normalized.price, 19990);
  assert.equal(normalized.presentation, "100 ml");
  assert.equal(normalized.available, true);
  assert.equal(normalized.raw.compareAtPrice, 43990);
  assert.equal(normalized.url, "https://silkperfumes.cl/products/lattafa-yara-edp-100-ml");
});

test("construye páginas sobre la colección autorizada", () => {
  const url = new URL(buildSilkCatalogPageUrl(2, 100));
  assert.equal(url.pathname, "/collections/perfumes/products.json");
  assert.equal(url.searchParams.get("page"), "2");
  assert.equal(url.searchParams.get("limit"), "100");
});

test("rechaza otro dominio y rutas excluidas por robots.txt", () => {
  assert.throws(() => assertSilkUrl("https://example.com/products/test"), /silkperfumes\.cl/);
  for (const pathname of ["/admin", "/cart", "/checkout", "/account", "/orders/1", "/search?q=yara"]) {
    assert.throws(
      () => assertSilkUrl(`https://silkperfumes.cl${pathname}`),
      /robots\.txt/
    );
  }
});
