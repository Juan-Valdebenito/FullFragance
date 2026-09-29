const test = require("node:test");
const assert = require("node:assert/strict");
const {
  assertDreamsUrl,
  buildDreamsMcpEndpoint,
  normalizeProduct,
} = require("../src/services/dreamsScraper");

const product = {
  id: "gid://jumpseller/Product/30619659",
  name: "AMBER OUD RUBY EDITION 120 ML EDP AL HARAMAIN ",
  price: 41610.0,
  compare_at_price: "60990.0",
  sku: "826012",
  brand: "AL HARAMAIN ",
  barcode: "6291100130276",
  stock_available: true,
  permalink: "amber-oud-ruby-edition-regular-120-ml-edp-de-al-haramain",
  url: "https://dreamsparfums.cl/amber-oud-ruby-edition-regular-120-ml-edp-de-al-haramain",
  categories: ["Perfumes", "AL HARAMAIN", "Perfumes árabes"],
  images: ["https://images.jumpseller.com/store/dreamsparfums-mayorista/30619659/amber.jpg"],
  variants: [],
  currency: "CLP",
};

test("normaliza un perfume de Dreams Parfums desde el MCP de Jumpseller", () => {
  const normalized = normalizeProduct(product);
  assert.equal(normalized.source, "dreams-cl");
  assert.equal(normalized.sku, "826012");
  assert.equal(normalized.brand, "AL HARAMAIN");
  assert.equal(normalized.name, "AMBER OUD RUBY EDITION 120 ML EDP AL HARAMAIN");
  assert.equal(normalized.price, 41610);
  assert.equal(normalized.presentation, "120 ML");
  assert.equal(normalized.available, true);
  assert.equal(normalized.raw.compareAtPrice, 60990);
  assert.equal(normalized.raw.jumpsellerProductId, "30619659");
  assert.equal(normalized.url, product.url);
});

test("marca como no disponible un producto sin stock o sin precio", () => {
  assert.equal(normalizeProduct({ ...product, stock_available: false }).available, false);
  assert.equal(normalizeProduct({ ...product, price: 0 }).available, false);
});

test("usa el endpoint MCP publicado en robots.txt", () => {
  assert.equal(buildDreamsMcpEndpoint(), "https://dreamsparfums.cl/api/mcp");
});

test("rechaza otro dominio y rutas excluidas por robots.txt", () => {
  assert.throws(() => assertDreamsUrl("https://example.com/perfume"), /dreamsparfums\.cl/);
  for (const pathname of ["/admin", "/cart", "/checkout", "/v2/checkout", "/customer/login", "/search?q=x", "/wishlists/1", "/api/cart"]) {
    assert.throws(
      () => assertDreamsUrl(`https://dreamsparfums.cl${pathname}`),
      /robots\.txt/
    );
  }
  assert.throws(() => assertDreamsUrl("https://dreamsparfums.cl/perfume?preview=1"), /robots\.txt/);
});
