const test = require("node:test");
const assert = require("node:assert/strict");
const { inferBrandFromName, canonicalBrandNames, cleanBrand, samePerfume, isSet, volumeOf, identityTokens, productSignature } = require("../src/models/productMatcher");
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

test("infiere marcas desde títulos de Cosmetic y permite matchear registros históricos", async () => {
  assert.equal(inferBrandFromName("Perfume Sospiro Liberto EDP 100 ml Unisex"), "Sospiro");
  assert.equal(inferBrandFromName("Perfume Verbena EDT 120ml Hombre de Adolfo Dominguez"), "Adolfo Dominguez");
  assert.equal(inferBrandFromName("Si Giorgio Armani EDP 30 ml"), "Giorgio Armani");

  const products = await mergeScrapedProducts([
    perfume("cosmetic-cl", { brand: "Sin marca", name: "Perfume Sospiro Liberto EDP 100 ml Unisex" }),
    perfume("falabella-cl", { brand: "Sospiro", name: "Sospiro Liberto EDP 100 ml Unisex" }),
  ]);
  assert.equal(products.length, 1);
  assert.equal(products[0].brand, "Sospiro");
  assert.equal(products[0].matchedStores, 2);
});

test("agrupa ofertas de Falabella y Ripley y conserva ambos precios", async () => {
  const products = await mergeScrapedProducts([perfume("falabella-cl"), perfume("ripley-cl")]);
  assert.equal(products.length, 1);
  assert.equal(products[0].source, "multi-store");
  assert.equal(products[0].matchedStores, 2);
  assert.deepEqual(products[0].offers.map((offer) => offer.price), [129990, 119990]);
});

test("usa la imagen de otra tienda cuando la oferta representante no la tiene", async () => {
  const products = await mergeScrapedProducts([
    perfume("falabella-cl", { imageUrl: null }),
    perfume("ripley-cl", { imageUrl: "https://rimage.ripley.cl/producto.jpg" }),
    perfume("silk-cl", { imageUrl: "https://cdn.shopify.com/producto.jpg" }),
  ]);
  assert.equal(products.length, 1);
  assert.equal(products[0].imageUrl, "https://rimage.ripley.cl/producto.jpg");
  assert.deepEqual(products[0].imageUrls, [
    "https://rimage.ripley.cl/producto.jpg",
    "https://cdn.shopify.com/producto.jpg",
  ]);
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
  assert.equal(isSet({ name: "Perfume Hombre Wanted Edp 100 Ml", presentation: "100 ml" }), false);
});

// ── Nuevas fuentes: unidades, tipos y condiciones comerciales ─────────────

test("reconoce equivalencias entre onzas y mililitros", () => {
  assert.equal(volumeOf(perfume("alisha-cl", { name: "Dior Homme EDT 1 oz", presentation: "1 oz" })), 29.57);
  assert.equal(samePerfume(
    perfume("alisha-cl", { name: "Dior Homme EDT 1 oz", presentation: "1 oz" }),
    perfume("silk-cl", { name: "Dior Homme EDT 30 ml", presentation: "30 ml" })
  ), true);
});

test("no mezcla sets con composiciones diferentes", () => {
  assert.equal(samePerfume(
    perfume("alisha-cl", { name: "Set Dior Homme EDT 100 ml + 10 ml" }),
    perfume("silk-cl", { name: "Set Dior Homme EDT 100 ml + 5 ml" })
  ), false);
});

test("no mezcla perfume, desodorante ni tester", () => {
  assert.equal(samePerfume(
    perfume("alisha-cl", { name: "Dior Homme EDT 100 ml" }),
    perfume("silk-cl", { name: "Dior Homme Deodorant 100 ml" })
  ), false);
  assert.equal(samePerfume(
    perfume("alisha-cl", { name: "Dior Homme EDT 100 ml" }),
    perfume("silk-cl", { name: "Dior Homme EDT Tester 100 ml" })
  ), false);
});

test("normaliza aliases de nombres entre tiendas", () => {
  assert.equal(samePerfume(
    perfume("alisha-cl", { brand: "Valentino", name: "Born in Roma Uomo EDT 100 ml" }),
    perfume("silk-cl", { brand: "Valentino", name: "Born in Rome Uomo EDT 100 ml" })
  ), true);
  assert.equal(samePerfume(
    perfume("alisha-cl", { brand: "Paco Rabanne", name: "One Million EDT 100 ml" }),
    perfume("silk-cl", { brand: "Rabanne", name: "1 Million EDT 100 ml" })
  ), true);
});

// ── Merge: productos se mantienen separados ───────────────────────────────

test("mergeScrapedProducts mantiene separados set y perfume individual Wanted", async () => {
  const products = await mergeScrapedProducts([
    perfume("falabella-cl", { brand: "AZZARO", name: "Perfume Hombre Wanted Edp 100 Ml", sku: "50321933" }),
    perfume("ripley-cl", { brand: "AZZARO", name: "SET PERFUME HOMBRE AZZARO WANTED EDP 100ML+75ML+10ML", sku: "2000411508384P" }),
    perfume("ripley-cl", { brand: "AZZARO", name: "PERFUME AZZARO WANTED HOMBRE EDP 100 ML", sku: "2000398101370P" }),
  ]);
  // El set debe quedar separado del perfume individual
  const setProducts = products.filter((p) => /set/i.test(p.name));
  const individualProducts = products.filter((p) => !/set/i.test(p.name));
  assert.equal(setProducts.length, 1, "Debe haber exactamente 1 set");
  assert.equal(setProducts[0].isSet, true, "El catálogo debe marcar el set para poder filtrarlo");
  assert.ok(individualProducts.length >= 1, "Debe haber al menos 1 perfume individual");
  // El perfume individual de Falabella y Ripley deben poder matchear entre sí
  const matchedIndividual = individualProducts.find((p) => p.source === "multi-store");
  assert.ok(matchedIndividual, "Los perfumes individuales de distintas tiendas deben matchear");
});

test("mergeScrapedProducts no une dos productos de la misma tienda por una coincidencia intermedia", async () => {
  const products = await mergeScrapedProducts([
    perfume("alisha-cl", { brand: "Dior", name: "Dior Homme EDT 100 ml", sku: "alisha-1" }),
    perfume("silk-cl", { brand: "Dior", name: "Dior Homme EDT 100 ml", sku: "silk-1" }),
    perfume("alisha-cl", { brand: "Dior", name: "Dior Homme Parfum 100 ml", sku: "alisha-2" }),
  ]);
  assert.equal(products.length, 2);
  assert.equal(products.find((product) => product.source === "multi-store")?.matchedStores, 2);
});

test("los números del nombre distinguen perfumes de una misma línea", () => {
  const izquierda = perfume("silk-cl", { brand: "Zak", name: "Zak Perfumes Hub No 28 EDP 100 ml" });
  const derecha = perfume("paris-cl", { brand: "Zak", name: "Zak Perfumes Hub No 33 EDP 100 ml" });
  assert.equal(samePerfume(izquierda, derecha), false);
});

test("el mismo perfume numerado se reconoce aunque cambie el formato del nombre", () => {
  assert.equal(samePerfume(
    perfume("silk-cl", { brand: "Zak", name: "Zak Perfumes Hub No 28 EDP 100 ml" }),
    perfume("paris-cl", { brand: "Zak", name: "ZAK PERFUMES HUB N° 28 EDP 100ML" })
  ), true);
});

test("no confunde dos perfumes distintos de la misma línea Elixir", () => {
  assert.equal(samePerfume(
    perfume("silk-cl", { brand: "Paco Rabanne", name: "PACO RABANNE PHANTOM ELIXIR MEN PARFUM INTENSE 100ML" }),
    perfume("paris-cl", { brand: "Paco Rabanne", name: "PACO RABANNE ONE MILLION ELIXIR PARFUM INTENSE MEN 100ML" })
  ), false);
});

test("agrupa un 212 escrito por tiendas distintas", () => {
  assert.equal(samePerfume(
    perfume("silk-cl", { brand: "Carolina Herrera", name: "Perfume Carolina Herrera 212 EDT 30 ml", presentation: "30 ml" }),
    perfume("paris-cl", { brand: "Carolina Herrera", name: "Perfume Mujer 212 Edt 30Ml", presentation: "30 ml" })
  ), true);
});

test("no mezcla 212 con 212 VIP", () => {
  assert.equal(samePerfume(
    perfume("silk-cl", { brand: "Carolina Herrera", name: "Carolina Herrera 212 Men EDT 100 ml" }),
    perfume("paris-cl", { brand: "Carolina Herrera", name: "Carolina Herrera 212 VIP Men EDT 100 ml" })
  ), false);
});

test("un volumen sin unidad no se confunde con un número del nombre", () => {
  assert.deepEqual(
    identityTokens(perfume("silk-cl", { brand: "Dior", name: "Perfume Hombre Eau Fraiche Extreme EDP 100", presentation: "" })),
    identityTokens(perfume("paris-cl", { brand: "Dior", name: "Perfume Eau Fraiche Extreme EDP Hombre 100 ml", presentation: "100 ml" }))
  );
});

test("la clave de bloqueo nunca separa dos productos que samePerfume considera iguales", () => {
  const izquierda = perfume("silk-cl", { brand: "Dior", name: "Dior Homme EDT 100 ml" });
  const derecha = perfume("paris-cl", { brand: "Dior", name: "PERFUME DIOR HOMME HOMBRE EDT 100 ML" });
  assert.equal(samePerfume(izquierda, derecha), true);
  assert.equal(
    productSignature(izquierda).blockingKey,
    productSignature(derecha).blockingKey,
    "Si dos productos matchean, deben caer en la misma cubeta o el merge nunca los compararía"
  );
});

test("unifica las distintas escrituras de una misma marca", () => {
  const names = canonicalBrandNames(["HUGO BOSS", "Hugo Boss", "HUGOBOSS", "AGATHA RUIZ DE LA PRADA", "Agatha ruiz de la prada", "DKNY", "MAISON ALHAMBRA"]);
  assert.equal(names.get("HUGOBOSS"), "Hugo Boss");
  assert.equal(names.get("Agatha ruiz de la prada"), "Agatha Ruiz de la Prada");
  assert.equal(names.get("DKNY"), "DKNY");
  assert.equal(names.get("MAISON ALHAMBRA"), "Maison Alhambra");
});

test("agrupa marcas escritas distinto y toma el género de cualquier tienda", async () => {
  const [product, ...rest] = await mergeScrapedProducts([
    perfume("falabella-cl", { brand: "HUGO BOSS", name: "Boss Bottled EDT 100 ml" }),
    perfume("elite-cl", { brand: "Hugo Boss", name: "Boss Bottled EDT 100 ML (H)" }),
  ]);
  assert.equal(rest.length, 0);
  assert.equal(product.brand, "Hugo Boss");
  assert.equal(product.gender, "Masculino");
});

test("unifica marcas mal escritas o con entidades HTML", () => {
  const names = canonicalBrandNames(["Dolce & Gabbanna", "Dolce Gabanna", "Lataffa", "Aghata Ruiz de la Prada", "Billie Elish", "Y.S.Laurent", "Victor & Rolf", "Thierry Mugler", "Christian Dior", "Blvgari"]);
  assert.equal(names.get("Dolce & Gabbanna"), "Dolce & Gabbana");
  assert.equal(names.get("Dolce Gabanna"), "Dolce & Gabbana");
  assert.equal(names.get("Lataffa"), "Lattafa");
  assert.equal(names.get("Aghata Ruiz de la Prada"), "Agatha Ruiz de la Prada");
  assert.equal(names.get("Billie Elish"), "Billie Eilish");
  assert.equal(names.get("Y.S.Laurent"), "Yves Saint Laurent");
  assert.equal(names.get("Victor & Rolf"), "Viktor & Rolf");
  assert.equal(names.get("Thierry Mugler"), "Mugler");
  assert.equal(names.get("Christian Dior"), "Dior");
  assert.equal(names.get("Blvgari"), "Bvlgari");
  assert.equal(cleanBrand("DOLCE &amp; GABBANNA"), "DOLCE & GABBANNA");
  assert.equal(cleanBrand("BENJAMIN VICU&Ntilde;A"), "BENJAMIN VICUÑA");
});

test("descarta textos de tienda que no son marcas", async () => {
  for (const junk of ["Despacho Gratis RM", "Ultimas Unidades", "Tester", "Sin marca", "Recién Llegados Todos Los Productos", "Gen&#201;rica", "Varios"]) {
    assert.equal(cleanBrand(junk), null, junk);
  }
  const [product] = await mergeScrapedProducts([perfume("silk-cl", { brand: "Ultimas Unidades", name: "Lattafa Asad EDP 100 ml" })]);
  assert.equal(product.brand, "Lattafa");
});

test("descarta un precio absurdamente bajo frente al resto de las tiendas", async () => {
  const odyssey = (source, price) => perfume(source, { brand: "Armaf", name: "Armaf Odyssey Mandarin Sky EDP 200 ml", presentation: "200 ml", price });
  const [product] = await mergeScrapedProducts([
    odyssey("lodoro-cl", 3900),
    odyssey("silk-cl", 39990),
    odyssey("leparis-cl", 59990),
  ]);
  assert.deepEqual(product.offers.map((offer) => offer.source).sort(), ["leparis-cl", "silk-cl"]);
  assert.equal(product.matchedStores, 2);
  assert.equal(product.basePrice, 39990);

  // Con una sola tienda de referencia no hay base para decidir: se conserva.
  const [pair] = await mergeScrapedProducts([odyssey("lodoro-cl", 3900), odyssey("silk-cl", 39990)]);
  assert.equal(pair.matchedStores, 2);
});

test("no inventa descripción y marca las notas deducidas del nombre", async () => {
  const [product] = await mergeScrapedProducts([perfume("silk-cl", { brand: "Lattafa", name: "Lattafa Asad EDP 100 ml" })]);
  assert.equal(product.description, null);
  assert.equal(product.notesInferred, true);
});

test("no pliega submarcas de Armani al mostrar el nombre", () => {
  const names = canonicalBrandNames(["EMPORIO ARMANI", "Armani Exchange", "ARMANI", "DIOR", "ZARA"]);
  assert.equal(names.get("EMPORIO ARMANI"), "Emporio Armani");
  assert.equal(names.get("Armani Exchange"), "Armani Exchange");
  assert.equal(names.get("ARMANI"), "Giorgio Armani");
  assert.equal(names.get("DIOR"), "Dior");
  assert.equal(names.get("ZARA"), "Zara");
});

test("detecta género por palabras en inglés y no depende del orden de las tiendas", async () => {
  const [leMale] = await mergeScrapedProducts([perfume("paris-cl", { brand: "Jean Paul Gaultier", name: "Le Male EDT 125 ml" })]);
  assert.equal(leMale.gender, "Masculino");

  const mixed = (order) => mergeScrapedProducts(order.map((source) => perfume(source, {
    brand: "Hugo Boss",
    name: source === "elite-cl" ? "Boss Bottled EDT 100 ML (U)" : "Boss Bottled Hombre EDT 100 ml",
  })));
  const [first] = await mixed(["falabella-cl", "paris-cl", "elite-cl"]);
  const [second] = await mixed(["elite-cl", "paris-cl", "falabella-cl"]);
  assert.equal(first.gender, "Masculino");
  assert.equal(second.gender, "Masculino");
});

test("el marcador (M) sólo significa mujer en Elite", async () => {
  const [other] = await mergeScrapedProducts([perfume("paris-cl", { brand: "Armaf", name: "Armaf Club de Nuit EDT 105 ml (M)" })]);
  assert.equal(other.gender, "");
  const [elite] = await mergeScrapedProducts([perfume("elite-cl", { brand: "Armaf", name: "Armaf Club de Nuit EDT 105 ml (M)" })]);
  assert.equal(elite.gender, "Femenino");
});
