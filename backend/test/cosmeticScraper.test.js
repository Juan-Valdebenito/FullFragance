const test = require("node:test");
const assert = require("node:assert/strict");
const {
  assertCosmeticUrl,
  buildCosmeticUcpEndpoint,
  normalizeProduct,
  parsePrice,
  extractPresentation,
} = require("../src/services/cosmeticScraper");
const { samePerfume } = require("../src/models/productMatcher");

const ucpProduct = {
  id: "gid://shopify/Product/7099799732357",
  title: "Perfume Liquid Brun French Avenue EDP 100 ml",
  url: "https://cosmetic.cl/products/fragrance-world-liquid-brun-french-avenue-edp-100-ml",
  handle: "fragrance-world-liquid-brun-french-avenue-edp-100-ml",
  price_range: { min: { amount: 29990, currency: "CLP" } },
  list_price_range: { min: { amount: 39990, currency: "CLP" } },
  tags: ["Perfume", "Perfume Hombre"],
  collections: [{ handle: "perfumes", title: "Perfumes" }],
  description: { html: "Liquid Brun de French Avenue es una fragancia amaderada para Hombres." },
  media: [{ type: "image", url: "https://cdn.shopify.com/liquid-brun.png" }],
  variants: [{
    id: "gid://shopify/ProductVariant/41063580991621",
    sku: "COS4197",
    title: "Default Title",
    price: { amount: 29990, currency: "CLP" },
    list_price: { amount: 39990, currency: "CLP" },
    availability: { available: true },
  }],
};

test("normaliza un producto de catálogo UCP de Cosmetic", () => {
  const product = normalizeProduct(ucpProduct);
  assert.equal(product.source, "cosmetic-cl");
  assert.equal(product.sku, "COS4197");
  assert.equal(product.brand, "French Avenue");
  assert.equal(product.price, 29990);
  assert.equal(product.presentation, "100 ml");
  assert.equal(product.available, true);
  assert.equal(product.imageUrl, "https://cdn.shopify.com/liquid-brun.png");
  assert.equal(product.raw.compareAtPrice, 39990);
  assert.equal(product.raw.catalogProtocol, "UCP/MCP 2026-04-08");
  assert.equal(product.raw.brandSource, "description");
  assert.equal(samePerfume(product, {
    source: "abc-cl",
    brand: "French Avenue",
    name: "Liquid Brun French Avenue EDP 100 ml",
    presentation: "100 ml",
  }), true);
});

test("usa exclusivamente el endpoint MCP autorizado y bloquea rutas privadas", () => {
  assert.equal(buildCosmeticUcpEndpoint(), "https://cosmetic-chile.myshopify.com/api/ucp/mcp");
  assert.throws(() => assertCosmeticUrl("https://cosmetic.cl/cart/123"), /robots\.txt/);
  assert.throws(() => assertCosmeticUrl("https://example.com/products/perfume"), /cosmetic\.cl/);
});

test("extrae precios y presentaciones del modelo UCP", () => {
  assert.equal(parsePrice({ amount: 19990, currency: "CLP" }), 19990);
  assert.equal(parsePrice(null), null);
  assert.equal(extractPresentation("Perfume Lattafa Asad EDP 100 ml"), "100 ml");
});

test("marca sin stock cuando ninguna variante UCP está disponible", () => {
  const product = normalizeProduct({
    ...ucpProduct,
    variants: [{ id: "gid://shopify/ProductVariant/1", sku: "SIN-STOCK", price: { amount: 19990 }, availability: { available: false } }],
  });
  assert.equal(product.available, false);
  assert.equal(product.price, 19990);
});

test("prioriza una colección de marca de Cosmetic cuando está disponible", () => {
  const product = normalizeProduct({
    ...ucpProduct,
    title: "Perfume The Most Wanted EDP Intense 100 ml Hombre de Azzaro",
    collections: [{ handle: "perfumes", title: "Perfumes" }, { handle: "perfumes-azzaro", title: "Perfumes Azzaro" }],
  });
  assert.equal(product.brand, "Azzaro");
  assert.equal(product.raw.brandSource, "collection");
});

test("reconoce marcas conocidas presentes en el título cuando faltan otras señales UCP", () => {
  const product = normalizeProduct({
    ...ucpProduct,
    title: "Fragrance World Cocktail Intense EDP 100 ml Unisex",
    description: { html: "Perfume de larga duración." },
    collections: [{ handle: "perfumes", title: "Perfumes" }],
  });
  assert.equal(product.brand, "Fragrance World");
  assert.equal(product.raw.brandSource, "known-title");
});

test("reconoce una marca de Cosmetic que sólo aparece en el título", () => {
  const product = normalizeProduct({
    ...ucpProduct,
    title: "Perfume Sospiro Liberto EDP 100 ml Unisex",
    description: { html: "Perfume de larga duración." },
    collections: [{ handle: "perfumes", title: "Perfumes" }],
  });
  assert.equal(product.brand, "Sospiro");
  assert.equal(product.raw.brandSource, "known-title");
});
