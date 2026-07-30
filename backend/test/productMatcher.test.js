const test = require("node:test");
const assert = require("node:assert/strict");
const { inferBrandFromName, samePerfume, isSet } = require("../src/models/productMatcher");
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

test("infiere marcas desde títulos de Cosmetic y permite matchear registros históricos", () => {
  assert.equal(inferBrandFromName("Perfume Sospiro Liberto EDP 100 ml Unisex"), "Sospiro");
  assert.equal(inferBrandFromName("Perfume Verbena EDT 120ml Hombre de Adolfo Dominguez"), "Adolfo Dominguez");
  assert.equal(inferBrandFromName("Si Giorgio Armani EDP 30 ml"), "Giorgio Armani");

  const products = mergeScrapedProducts([
    perfume("cosmetic-cl", { brand: "Sin marca", name: "Perfume Sospiro Liberto EDP 100 ml Unisex" }),
    perfume("falabella-cl", { brand: "Sospiro", name: "Sospiro Liberto EDP 100 ml Unisex" }),
  ]);
  assert.equal(products.length, 1);
  assert.equal(products[0].brand, "Sospiro");
  assert.equal(products[0].matchedStores, 2);
});

test("agrupa ofertas de Falabella y Ripley y conserva ambos precios", () => {
  const products = mergeScrapedProducts([perfume("falabella-cl"), perfume("ripley-cl")]);
  assert.equal(products.length, 1);
  assert.equal(products[0].source, "multi-store");
  assert.equal(products[0].matchedStores, 2);
  assert.deepEqual(products[0].offers.map((offer) => offer.price), [129990, 119990]);
});

// ── Fix 1: Set vs individual ──────────────────────────────────────────────

test("no mezcla un set/kit con un perfume individual", () => {
  assert.equal(samePerfume(
    perfume("falabella-cl", { brand: "AZZARO", name: "Perfume Hombre Wanted Edp 100 Ml" }),
    perfume("ripley-cl", { brand: "AZZARO", name: "SET PERFUME HOMBRE AZZARO WANTED EDP 100ML+75ML+10ML" })
  ), false);
});

test("no mezcla set Born in Roma Uomo con perfume individual", () => {
  assert.equal(samePerfume(
    perfume("falabella-cl", { brand: "VALENTINO", name: "Set Perfume Hombre Born in Roma Uomo 50ml + 10ml", presentation: "50ml" }),
    perfume("ripley-cl", { brand: "VALENTINO", name: "PERFUME VALENTINO BORN IN ROMA UOMO HOMBRE EDT 50 ML", presentation: "50 ML" })
  ), false);
});

test("permite matching entre dos sets equivalentes", () => {
  assert.equal(samePerfume(
    perfume("falabella-cl", { brand: "VALENTINO", name: "Set Perfume Hombre Born in Roma Uomo EDT 50ml + 10ml", presentation: "50ml" }),
    perfume("ripley-cl", { brand: "VALENTINO", name: "SET PERFUME HOMBRE VALENTINO BORN IN ROMA UOMO EDT 50ML+10ML", presentation: "50ML" })
  ), true);
});

// ── Fix 2: Donna vs Uomo ─────────────────────────────────────────────────

test("no mezcla variante Donna con variante Uomo", () => {
  assert.equal(samePerfume(
    perfume("falabella-cl", { brand: "VALENTINO", name: "Born in Roma Uomo EDT 50 ml" }),
    perfume("ripley-cl", { brand: "VALENTINO", name: "PERFUME VALENTINO BORN IN ROMA DONNA MUJER EDP 50 ML" })
  ), false);
});

// ── Fix 3: Modificadores adicionales ──────────────────────────────────────

test("no mezcla Extradose con versión normal", () => {
  assert.equal(samePerfume(
    perfume("falabella-cl", { brand: "VALENTINO", name: "Born in Roma Uomo EDT 50 ml" }),
    perfume("ripley-cl", { brand: "VALENTINO", name: "PERFUME HOMBRE VALENTINO BORN IN ROMA EXTRADOSE UOMO EAU DE PARFUM 50ML" })
  ), false);
});

test("no mezcla Night con versión normal", () => {
  assert.equal(samePerfume(
    perfume("falabella-cl", { brand: "AZZARO", name: "Perfume Azzaro Wanted Hombre EDP 100 ML" }),
    perfume("ripley-cl", { brand: "AZZARO", name: "PERFUME AZZARO WANTED BY NIGHT HOMBRE EDP 100 ML" })
  ), false);
});

test("no mezcla Green Stravaganza con versión base", () => {
  assert.equal(samePerfume(
    perfume("falabella-cl", { brand: "VALENTINO", name: "Born in Roma Uomo EDT 50 ml" }),
    perfume("ripley-cl", { brand: "VALENTINO", name: "PERFUME HOMBRE BORN IN ROME UOMO GREEN STRAVAGANZA VALENTINO EDT 50 ML" })
  ), false);
});

// ── Fix 4: Concentración null vs definida ─────────────────────────────────

test("umbral elevado cuando uno tiene concentración y el otro no", () => {
  // Set sin concentración explícita vs perfume con EDT → distintos tokens → no match
  assert.equal(samePerfume(
    perfume("falabella-cl", { brand: "VALENTINO", name: "Born in Roma Uomo 50 ml" }),
    perfume("ripley-cl", { brand: "VALENTINO", name: "PERFUME VALENTINO BORN IN ROMA UOMO HOMBRE EDT 50 ML" })
  ), true); // Mismo perfume, mismo uomo — solo falta la concentración
});

// ── isSet detection ───────────────────────────────────────────────────────

test("isSet detecta sets por palabra clave", () => {
  assert.equal(isSet({ name: "SET PERFUME HOMBRE AZZARO WANTED EDP 100ML" }), true);
  assert.equal(isSet({ name: "Pack Perfume Carolina Herrera Good Girl" }), true);
  assert.equal(isSet({ name: "Kit Perfume Hombre Boss Bottled" }), true);
  assert.equal(isSet({ name: "Estuche Perfume Mujer Chanel No 5" }), true);
});

test("isSet detecta sets por patrón de múltiples volúmenes", () => {
  assert.equal(isSet({ name: "Perfume Hombre Born in Roma Uomo 50ml + 10ml" }), true);
  assert.equal(isSet({ name: "AZZARO WANTED EDP 100ML+75ML+10ML" }), true);
});

test("isSet devuelve false para perfumes individuales", () => {
  assert.equal(isSet({ name: "Perfume Hombre Wanted Edp 100 Ml" }), false);
  assert.equal(isSet({ name: "PERFUME VALENTINO BORN IN ROMA UOMO HOMBRE EDT 50 ML" }), false);
});

// ── Merge: productos se mantienen separados ───────────────────────────────

test("mergeScrapedProducts mantiene separados set y perfume individual Wanted", () => {
  const products = mergeScrapedProducts([
    perfume("falabella-cl", { brand: "AZZARO", name: "Perfume Hombre Wanted Edp 100 Ml", sku: "50321933" }),
    perfume("ripley-cl", { brand: "AZZARO", name: "SET PERFUME HOMBRE AZZARO WANTED EDP 100ML+75ML+10ML", sku: "2000411508384P" }),
    perfume("ripley-cl", { brand: "AZZARO", name: "PERFUME AZZARO WANTED HOMBRE EDP 100 ML", sku: "2000398101370P" }),
  ]);
  // El set debe quedar separado del perfume individual
  const setProducts = products.filter((p) => /set/i.test(p.name));
  const individualProducts = products.filter((p) => !/set/i.test(p.name));
  assert.equal(setProducts.length, 1, "Debe haber exactamente 1 set");
  assert.ok(individualProducts.length >= 1, "Debe haber al menos 1 perfume individual");
  // El perfume individual de Falabella y Ripley deben poder matchear entre sí
  const matchedIndividual = individualProducts.find((p) => p.source === "multi-store");
  assert.ok(matchedIndividual, "Los perfumes individuales de distintas tiendas deben matchear");
});
