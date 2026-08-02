const test = require("node:test");
const assert = require("node:assert/strict");
const {
  assertLodoroUrl,
  buildLodoroUcpEndpoint,
  normalizeProduct,
  parsePrice,
} = require("../src/services/lodoroScraper");

const ucpProduct = {
  id: "gid://shopify/Product/1328296558688",
  title: "Lancome La Vie Est Belle EDP 100 Ml Mujer",
  url: "https://www.lodoro.cl/products/la-vie-belle-by-lancome-edp-100ml-mujer",
  price_range: { min: { amount: 94900, currency: "CLP" } },
  list_price_range: { min: { amount: 149900, currency: "CLP" } },
  tags: ["Contenido_100 ml", "Marca_Lancome", "Perfume_EDP", "Tipo_Perfumes"],
  collections: [{ handle: "perfumes", title: "Perfumes" }],
  media: [{ type: "image", url: "https://cdn.shopify.com/la-vie-est-belle.png" }],
  variants: [{
    id: "gid://shopify/ProductVariant/12255014060128",
    sku: "1LANVBELLE100-I",
    title: "Default Title",
    price: { amount: 94900, currency: "CLP" },
    list_price: { amount: 149900, currency: "CLP" },
    availability: { available: true },
  }],
};

test("normaliza un perfume del catálogo UCP de L'Odoro", () => {
  const product = normalizeProduct(ucpProduct);
  assert.equal(product.source, "lodoro-cl");
  assert.equal(product.sku, "1LANVBELLE100-I");
  assert.equal(product.brand, "Lancôme");
  assert.equal(product.price, 94900);
  assert.equal(product.presentation, "100 Ml");
  assert.equal(product.available, true);
  assert.equal(product.raw.compareAtPrice, 149900);
  assert.equal(product.raw.catalogProtocol, "UCP/MCP 2026-04-08");
});

test("usa el endpoint UCP autorizado y excluye rutas transaccionales", () => {
  assert.equal(buildLodoroUcpEndpoint(), "https://lodoro.myshopify.com/api/ucp/mcp");
  assert.throws(() => assertLodoroUrl("https://www.lodoro.cl/cart/123"), /robots\.txt/);
  assert.throws(() => assertLodoroUrl("https://example.com/products/perfume"), /lodoro/);
});

test("convierte precios UCP a CLP", () => {
  assert.equal(parsePrice({ amount: 22900, currency: "CLP" }), 22900);
  assert.equal(parsePrice(null), null);
});
