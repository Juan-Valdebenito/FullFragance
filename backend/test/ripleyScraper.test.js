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
  assert.equal(product.raw.fallback, true);
  assert.equal(product.raw.mockPrice, true);
});
