const test = require("node:test");
const assert = require("node:assert/strict");
const {
  assertCosmeticUrl,
  buildCosmeticCatalogPageUrl,
  normalizeProduct,
  parsePrice,
  extractPresentation,
} = require("../src/services/cosmeticScraper");

const shopifyProduct = {
  id: 6830081310853,
  title: "Perfume ASAD de Lattafa EDP 100 ML",
  handle: "lattafa-asad-edp-100-ml-hombre",
  vendor: "Lattafa",
  product_type: "Perfume Hombre",
  tags: ["Perfume", "Perfume Hombre", "Perfumes arabes"],
  updated_at: "2026-07-28T01:06:36-04:00",
  variants: [
    {
      id: 40229875024005,
      sku: "COS2099",
      available: true,
      price: "19990",
      compare_at_price: "59990",
      title: "Default Title",
    },
  ],
  images: [{ src: "https://cdn.shopify.com/s/files/1/0353/2659/1109/files/asad.jpg" }],
};

test("normaliza un producto Shopify de Cosmetic", () => {
  const product = normalizeProduct(shopifyProduct);
  assert.equal(product.source, "cosmetic-cl");
  assert.equal(product.sku, "COS2099");
  assert.equal(product.brand, "Lattafa");
  assert.equal(product.name, "Perfume ASAD de Lattafa EDP 100 ML");
  assert.equal(product.price, 19990);
  assert.equal(product.presentation, "100 ML");
  assert.equal(product.available, true);
  assert.equal(product.imageUrl, "https://cdn.shopify.com/s/files/1/0353/2659/1109/files/asad.jpg");
  assert.equal(product.raw.compareAtPrice, 59990);
  assert.equal(
    product.url,
    "https://cosmetic.cl/products/lattafa-asad-edp-100-ml-hombre"
  );
});

test("prefiere una variante disponible", () => {
  const product = normalizeProduct({
    ...shopifyProduct,
    variants: [
      { id: 1, sku: "AGOTADO", available: false, price: "19990" },
      { id: 2, sku: "DISPONIBLE", available: true, price: "21990" },
    ],
  });
  assert.equal(product.sku, "DISPONIBLE");
  assert.equal(product.price, 21990);
  assert.equal(product.available, true);
});

test("construye únicamente la colección pública de perfumes para Cosmetic", () => {
  const url = new URL(buildCosmeticCatalogPageUrl(2, 50));
  assert.equal(url.pathname, "/collections/perfumes/products.json");
  assert.equal(url.searchParams.get("page"), "2");
  assert.equal(url.searchParams.get("limit"), "50");
  assert.throws(
    () => assertCosmeticUrl("https://example.com/products/perfume"),
    /cosmetic\.cl/
  );
});

test("extrae precios y presentaciones de Cosmetic", () => {
  assert.equal(parsePrice("19990"), 19990);
  assert.equal(parsePrice(null), null);
  assert.equal(extractPresentation("Perfume Lattafa Asad EDP 100 ml"), "100 ml");
});

test("marca sin stock cuando ninguna variante de Cosmetic está disponible", () => {
  const product = normalizeProduct({
    ...shopifyProduct,
    variants: [{ id: 1, sku: "SIN-STOCK", available: false, price: "19990" }],
  });
  assert.equal(product.available, false);
  assert.equal(product.price, 19990);
});
