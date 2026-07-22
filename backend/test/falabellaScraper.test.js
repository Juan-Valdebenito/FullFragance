const path = require("path");
const test = require("node:test");
const assert = require("node:assert/strict");

process.env.FALABELLA_FIXTURE_DIR = path.join(__dirname, "fixtures", "falabella");
const { scrapePerfumeCatalog, findProductUrls } = require("../src/services/falabellaScraper");

test("descubre y normaliza un perfume de la colección", async () => {
  const results = await scrapePerfumeCatalog(4);
  assert.equal(results.length, 1);
  assert.equal(results[0].ok, true);
  assert.equal(results[0].product.sku, "80041755");
  assert.equal(results[0].product.price, 99990);
  assert.equal(results[0].product.available, true);
});

test("descubre URLs dentro de __NEXT_DATA__", () => {
  const html = '<script id="__NEXT_DATA__">{"url":"https://www.falabella.com/falabella-cl/product/50285241/Perfume-Hombre"}</script>';
  assert.deepEqual(findProductUrls(html, "https://www.falabella.com/falabella-cl/collection/oferta-perfumes", 4), ["https://www.falabella.com/falabella-cl/product/50285241/Perfume-Hombre"]);
});
