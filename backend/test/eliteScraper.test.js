const test = require("node:test");
const assert = require("node:assert/strict");
const {
  assertEliteUrl,
  buildEliteCatalogPageUrl,
  normalizeProduct,
} = require("../src/services/eliteScraper");

const product = {
  id: 1589180039204,
  title: "Tommy Girl EDT 100 ML (M)",
  handle: "tommy-hilfiger-tommy-girl-edt-100-ml-m",
  vendor: "Tommy Hilfiger",
  tags: ["100 ML", "Mujer"],
  variants: [{
    id: 12236140216356,
    sku: "22548040126",
    available: true,
    price: "29990",
    compare_at_price: "49900",
  }],
  images: [{ src: "https://cdn.shopify.com/tommy.jpg" }],
};

test("normaliza un perfume público de Elite", () => {
  const normalized = normalizeProduct(product);
  assert.equal(normalized.source, "elite-cl");
  assert.equal(normalized.sku, "22548040126");
  assert.equal(normalized.brand, "Tommy Hilfiger");
  assert.equal(normalized.price, 29990);
  assert.equal(normalized.presentation, "100 ML");
  assert.equal(normalized.available, true);
  assert.equal(normalized.raw.compareAtPrice, 49900);
});

test("construye páginas sobre la colección autorizada", () => {
  const url = new URL(buildEliteCatalogPageUrl(4, 100));
  assert.equal(url.pathname, "/collections/perfumes/products.json");
  assert.equal(url.searchParams.get("page"), "4");
  assert.equal(url.searchParams.get("limit"), "100");
});

test("rechaza otro dominio y rutas privadas o transaccionales", () => {
  assert.throws(() => assertEliteUrl("https://example.com/products/test"), /eliteperfumes\.cl/);
  for (const pathname of ["/admin", "/cart/", "/checkout", "/checkouts/1", "/account", "/orders"]) {
    assert.throws(
      () => assertEliteUrl(`https://www.eliteperfumes.cl${pathname}`),
      /robots\.txt/
    );
  }
});
