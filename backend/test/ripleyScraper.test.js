const path = require("path");
const test = require("node:test");
const assert = require("node:assert/strict");

process.env.RIPLEY_FIXTURE_DIR = path.join(__dirname, "fixtures", "ripley");
const {
  scrapePerfumeCatalog,
  findProductUrls,
  isPerfumeProductUrl,
  productFromUrl,
  priceFromText,
  buildRipleyImageUrl,
  normalizeCollectionProduct,
  buildRipleyCatalogPageUrl,
} = require("../src/services/ripleyScraper");

test("descubre y normaliza perfumes de Ripley", async () => {
  const results = await scrapePerfumeCatalog(2);
  assert.equal(results.length, 2);
  assert.equal(results[0].ok, true);
  assert.equal(results[0].product.source, "ripley-cl");
  assert.equal(results[0].product.sku, "2000378702900P");
  assert.equal(results[0].product.price, 148800);
  assert.equal(results[0].product.available, true);
});

test("descubre URLs de producto Ripley en HTML", () => {
  const html = '<a href="/perfume-dior-homme-hombre-edt-100-ml-2000378702900p?cat=perfumeria">Dior</a>';
  assert.deepEqual(findProductUrls(html, "https://simple.ripley.cl/search/perfume", 4), [
    "https://simple.ripley.cl/perfume-dior-homme-hombre-edt-100-ml-2000378702900p",
  ]);
});

test("filtra URLs de Ripley para perfumes", () => {
  assert.equal(isPerfumeProductUrl("https://simple.ripley.cl/perfume-dior-homme-hombre-edt-100-ml-2000378702900p"), true);
  assert.equal(isPerfumeProductUrl("https://simple.ripley.cl/zapatillas-deportivas-ninos-2000000000000p"), false);
});

test("extrae precio Internet desde texto visible", () => {
  assert.equal(priceFromText("<div>Normal $39.990</div><div>Internet $29.990</div>"), 29990);
});

test("crea un producto parcial desde la URL de Ripley", () => {
  const product = productFromUrl(
    "https://simple.ripley.cl/perfume-tommy-hilfiger-tommy-edt-100-ml-2000403434585p",
    "Ripley respondió HTTP 403."
  );

  assert.equal(product.source, "ripley-cl");
  assert.equal(product.sku, "2000403434585P");
  assert.equal(product.name, "Perfume Tommy Hilfiger Tommy Edt 100 Ml");
  assert.equal(product.brand, "Tommy Hilfiger");
  assert.equal(product.presentation, "100 Ml");
  assert.equal(product.imageUrl, null);
  assert.equal(product.raw.fallback, true);
  assert.equal(product.raw.mockPrice, true);
});

test("genera imagen de Ripley desde el SKU para fallbacks", () => {
  assert.equal(
    buildRipleyImageUrl("2000378702900P"),
    "https://ripley.scene7.com/is/image/Ripley/2000378702900"
  );
});

test("pagina únicamente sobre la categoría de perfumería de Ripley", () => {
  const url = new URL(buildRipleyCatalogPageUrl(2));
  assert.equal(url.pathname, "/belleza/perfumeria");
  assert.equal(url.searchParams.get("source"), "menu");
  assert.equal(url.searchParams.get("s"), "mdco");
  assert.equal(url.searchParams.get("page"), "2");
});

test("normaliza productos directamente desde el listado SSR de Ripley", () => {
  const product = normalizeCollectionProduct({
    sku: "2000397524538",
    parentProductID: "2000397524538P",
    brand: "VERSACE",
    name: "PERFUME VERSACE VERSENSE MUJER EDT 100 ML",
    price: "$57.990",
    priceNumber: 57990,
    primaryImage: "https://home.ripley.cl/store/Attachment/producto.jpg",
    seller: "RIPLEY",
  }, "https://simple.ripley.cl/search/perfume", [
    "https://simple.ripley.cl/perfume-versace-versense-mujer-edt-100-ml-2000397524538p",
  ]);

  assert.equal(product.sku, "2000397524538P");
  assert.equal(product.brand, "VERSACE");
  assert.equal(product.price, 57990);
  assert.equal(product.presentation, "100 ML");
  assert.equal(product.raw.collectionCard, true);
});

test("no inventa imagen cuando Ripley no expone una real", () => {
  const product = normalizeCollectionProduct({
    sku: "2000000000000",
    parentProductID: "2000000000000P",
    brand: "MARCA",
    name: "PERFUME DE PRUEBA 100 ML",
    price: "$57.990",
    priceNumber: 57990,
  }, "https://simple.ripley.cl/search/perfume");

  assert.equal(product.imageUrl, null);
});
