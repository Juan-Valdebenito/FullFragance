const test = require("node:test");
const assert = require("node:assert/strict");
const {
  assertAlishaUrl,
  buildAlishaCatalogPageUrl,
  normalizeProduct,
  parsePrice,
  extractPresentation,
} = require("../src/services/alishaScraper");

const shopifyProduct = {
  id: 9911588061466,
  title: "GRANDEUR TUBBEES COOKIES & CREAM EDP 50ML",
  handle: "grandeur-tubbees-cookies-cream-edp-50ml",
  vendor: "TUBBEES",
  product_type: "Perfumes",
  tags: ["Arabes", "Perfumes"],
  updated_at: "2026-07-27T23:21:12-04:00",
  variants: [{
    id: 50714749272346,
    sku: "5055810039158",
    available: true,
    price: "4990",
    compare_at_price: "18990",
    title: "Default Title",
  }],
  images: [{ src: "https://cdn.shopify.com/product.jpg" }],
};

test("normaliza un producto Shopify de Alisha", () => {
  const product = normalizeProduct(shopifyProduct);
  assert.equal(product.source, "alisha-cl");
  assert.equal(product.sku, "5055810039158");
  assert.equal(product.brand, "TUBBEES");
  assert.equal(product.price, 4990);
  assert.equal(product.presentation, "50ML");
  assert.equal(product.available, true);
  assert.equal(product.imageUrl, "https://cdn.shopify.com/product.jpg");
  assert.equal(product.raw.compareAtPrice, 18990);
  assert.equal(
    product.url,
    "https://alishaperfumes.cl/products/grandeur-tubbees-cookies-cream-edp-50ml"
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

test("construye únicamente la colección pública de perfumes", () => {
  const url = new URL(buildAlishaCatalogPageUrl(3, 100));
  assert.equal(url.pathname, "/collections/perfumes/products.json");
  assert.equal(url.searchParams.get("page"), "3");
  assert.equal(url.searchParams.get("limit"), "100");
  assert.throws(
    () => assertAlishaUrl("https://example.com/products/perfume"),
    /alishaperfumes\.cl/
  );
});

test("extrae precios y presentaciones chilenas", () => {
  assert.equal(parsePrice("21990"), 21990);
  assert.equal(parsePrice(null), null);
  assert.equal(extractPresentation("Perfume de prueba EDP 100 ml"), "100 ml");
});

test("marca sin stock cuando ninguna variante está disponible", () => {
  const product = normalizeProduct({
    ...shopifyProduct,
    variants: [{ id: 1, sku: "SIN-STOCK", available: false, price: "4990" }],
  });
  assert.equal(product.available, false);
  assert.equal(product.price, 4990);
});
