const test = require("node:test");
const assert = require("node:assert/strict");
const { samePerfume } = require("../src/models/productMatcher");
const { mergeScrapedProducts } = require("../src/models/catalogRepository");

function perfume(source, overrides = {}) {
  return {
    source,
    sku: `${source}-1`,
    brand: "Dior",
    name: "Perfume Dior Homme Hombre EDT 100 ml",
    presentation: "100 ml",
    price: source === "falabella-cl" ? 129990 : 119990,
    currency: "CLP",
    available: true,
    url: `https://example.com/${source}`,
    raw: {},
    ...overrides,
  };
}

test("reconoce el mismo perfume aunque las tiendas cambien palabras comerciales", () => {
  assert.equal(samePerfume(
    perfume("falabella-cl", { name: "Dior Homme EDT 100ML" }),
    perfume("ripley-cl", { name: "PERFUME DIOR HOMME HOMBRE EDT 100 ML" })
  ), true);
});

test("no mezcla concentraciones ni tamaños diferentes", () => {
  assert.equal(samePerfume(
    perfume("falabella-cl", { name: "Dior Homme EDP 100 ml" }),
    perfume("ripley-cl", { name: "Dior Homme EDT 100 ml" })
  ), false);
  assert.equal(samePerfume(
    perfume("falabella-cl"),
    perfume("ripley-cl", { name: "Dior Homme EDT 50 ml", presentation: "50 ml" })
  ), false);
});

test("reconoce variantes habituales del nombre de una marca", () => {
  assert.equal(samePerfume(
    perfume("falabella-cl", { brand: "Armani", name: "My Way EDP 90 ml" }),
    perfume("ripley-cl", { brand: "GIORGIO ARMANI", name: "Perfume My Way mujer EDP 90 ML" })
  ), true);
});

test("agrupa ofertas de Falabella y Ripley y conserva ambos precios", () => {
  const products = mergeScrapedProducts([perfume("falabella-cl"), perfume("ripley-cl")]);
  assert.equal(products.length, 1);
  assert.equal(products[0].source, "multi-store");
  assert.equal(products[0].matchedStores, 2);
  assert.deepEqual(products[0].offers.map((offer) => offer.price), [129990, 119990]);
});
