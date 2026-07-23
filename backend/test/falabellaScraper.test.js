const path = require("path");
const test = require("node:test");
const assert = require("node:assert/strict");

process.env.FALABELLA_FIXTURE_DIR = path.join(__dirname, "fixtures", "falabella");
const {
  scrapePerfumeCatalog,
  findProductUrls,
  isPerfumeProductUrl,
  normalizeProduct,
  productFromUrl,
} = require("../src/services/falabellaScraper");

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

test("descubre URLs de producto en bloques JSON escapados", () => {
  const html = '<script>{"items":[{"url":"\\/falabella-cl\\/product\\/124801336\\/LACOSTE-L1212-ROSE-EDP-100ML"},{"url":"https%3A%2F%2Fwww.falabella.com%2Ffalabella-cl%2Fproduct%2F80041755%2FPerfume-Mujer-Good-Girl"}]}</script>';
  assert.deepEqual(
    findProductUrls(html, "https://www.falabella.com/falabella-cl/collection/oferta-perfumes", 4),
    [
      "https://www.falabella.com/falabella-cl/product/124801336/LACOSTE-L1212-ROSE-EDP-100ML",
      "https://www.falabella.com/falabella-cl/product/80041755/Perfume-Mujer-Good-Girl",
    ]
  );
});

test("filtra URLs de sitemap para perfumes", () => {
  assert.equal(isPerfumeProductUrl("https://www.falabella.com/falabella-cl/product/124801336/LACOSTE-L1212-ROSE-EDP-100ML"), true);
  assert.equal(isPerfumeProductUrl("https://www.falabella.com/falabella-cl/product/142318685/Zapatillas-deportivas-ninos-y-ninas/142368389"), false);
});

test("conserva la imagen y URL comercial del producto para el frontend", () => {
  const product = normalizeProduct({
    sku: "sku-1",
    name: "Perfume de prueba 100 ml",
    brand: { name: "Marca" },
    image: ["https://falabella.scene7.com/is/image/Falabella/sku-1"],
    offers: { price: 49990, priceCurrency: "CLP", availability: "https://schema.org/InStock" },
  }, "https://www.falabella.com/falabella-cl/product/123/perfume");

  assert.equal(product.imageUrl, "https://falabella.scene7.com/is/image/Falabella/sku-1");
  assert.equal(product.url, "https://www.falabella.com/falabella-cl/product/123/perfume");
});

test("crea un producto parcial desde la URL cuando el detalle queda bloqueado", () => {
  const product = productFromUrl(
    "https://www.falabella.com/falabella-cl/product/50285241/Perfume-Hombre-Eros-Flame-EDP-200Ml-Versace",
    "Falabella bloqueó la consulta automática (HTTP 403 / Cloudflare)."
  );

  assert.equal(product.source, "falabella-cl");
  assert.equal(product.sku, "50285241");
  assert.equal(product.name, "Perfume Hombre Eros Flame Edp 200ml Versace");
  assert.equal(product.brand, "Versace");
  assert.equal(product.presentation, "200ml");
  assert.equal(product.price, 104990);
  assert.equal(product.raw.fallback, true);
  assert.equal(product.raw.mockPrice, true);
});
