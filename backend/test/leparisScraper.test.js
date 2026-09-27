const test = require("node:test");
const assert = require("node:assert/strict");
const {
  assertLeparisUrl,
  buildLeparisCatalogPageUrl,
  normalizeProduct,
} = require("../src/services/leparisScraper");

const product = {
  id: 15065227264364,
  title: "Afnan 9AM Dive EDP 100ml",
  handle: "afnan-9am-dive-edp-100ml",
  vendor: "Afnan",
  product_type: "",
  tags: [],
  variants: [{
    id: 53399780524396,
    sku: "AFN9AMD",
    available: true,
    price: "49990",
    compare_at_price: "79990",
  }],
  images: [{ src: "https://cdn.shopify.com/afnan.png" }],
};

test("normaliza un perfume público de Le Paris Parfums", () => {
  const normalized = normalizeProduct(product);
  assert.equal(normalized.source, "leparis-cl");
  assert.equal(normalized.sku, "AFN9AMD");
  assert.equal(normalized.brand, "Afnan");
  assert.equal(normalized.price, 49990);
  assert.equal(normalized.presentation, "100ml");
  assert.equal(normalized.available, true);
  assert.equal(normalized.raw.compareAtPrice, 79990);
  assert.equal(normalized.url, "https://leparisparfums.com/products/afnan-9am-dive-edp-100ml");
});

test("construye páginas sobre la colección autorizada", () => {
  const url = new URL(buildLeparisCatalogPageUrl(2, 100));
  assert.equal(url.pathname, "/collections/all/products.json");
  assert.equal(url.searchParams.get("page"), "2");
  assert.equal(url.searchParams.get("limit"), "100");
});

test("rechaza otro dominio y rutas excluidas por robots.txt", () => {
  assert.throws(() => assertLeparisUrl("https://example.com/products/test"), /leparisparfums\.com/);
  for (const pathname of ["/admin", "/cart", "/checkout", "/account", "/orders/1"]) {
    assert.throws(
      () => assertLeparisUrl(`https://leparisparfums.com${pathname}`),
      /robots\.txt/
    );
  }
});
