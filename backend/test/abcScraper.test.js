const test = require("node:test");
const assert = require("node:assert/strict");
const {
  assertAbcUrl,
  buildAbcCatalogUrl,
  extractCatalogProducts,
  extractTotalProducts,
  isPerfumeProductUrl,
  normalizeProductPage,
  parsePrice,
} = require("../src/services/abcScraper");

const catalogHtml = `
  <span>537 Productos</span>
  <div class="lp-product-tile js-lp-product-tile" data-gtm-click="{&quot;ecommerce&quot;:{&quot;click&quot;:{&quot;products&quot;:[{&quot;name&quot;:&quot;Perfume Calvin Klein CK One EDT 50 ml&quot;,&quot;id&quot;:&quot;17470469&quot;,&quot;price&quot;:&quot;19.990&quot;,&quot;brand&quot;:&quot;CALVIN KLEIN&quot;,&quot;category&quot;:&quot;Sales Catalog &gt; Belleza &gt; Perfumes&quot;}]}}}">
    <a class="image-link w-100" href="/perfume-calvin-klein-ck-one-edt-50-ml/17470469.html">
      <img src="https://www.abc.cl/images/17470469.jpg" alt="Perfume Calvin Klein CK One EDT 50 ml">
    </a>
    <p class="internet price"><span class="price-value" data-value="19990.0">$19.990</span></p>
    <p class="normal price"><span class="price-value" data-value="52990.0">$52.990</span></p>
    <p class="promotion-badge">68%</p>
  </div>`;

test("extrae una tarjeta SSR de perfumes de ABC", () => {
  const products = extractCatalogProducts(catalogHtml, "https://www.abc.cl/belleza/perfumes/");
  assert.equal(products.length, 1);
  assert.equal(products[0].source, "abc-cl");
  assert.equal(products[0].sku, "17470469");
  assert.equal(products[0].brand, "CALVIN KLEIN");
  assert.equal(products[0].price, 19990);
  assert.equal(products[0].presentation, "50 ml");
  assert.equal(products[0].available, true);
  assert.equal(products[0].raw.normalPrice, 52990);
  assert.equal(products[0].url, "https://www.abc.cl/perfume-calvin-klein-ck-one-edt-50-ml/17470469.html");
  assert.equal(extractTotalProducts(catalogHtml), 537);
});

test("usa sólo la categoría permitida de ABC y rechaza URLs excluidas", () => {
  assert.equal(buildAbcCatalogUrl(), "https://www.abc.cl/belleza/perfumes/");
  assert.throws(() => assertAbcUrl("https://www.abc.cl/belleza/perfumes/?page=2"), /parámetros/);
  assert.throws(() => assertAbcUrl("https://www.abc.cl/on/demandware.store/Sites-Abc-Site"), /robots\.txt/);
  assert.throws(() => assertAbcUrl("https://example.com/belleza/perfumes/"), /abc\.cl/);
});

test("convierte precios chilenos de ABC", () => {
  assert.equal(parsePrice("$19.990"), 19990);
  assert.equal(parsePrice("29990.0"), 29990);
  assert.equal(parsePrice(null), null);
});

test("normaliza una ficha pública descubierta desde el sitemap de ABC", () => {
  const html = `
    <div class="product-wrapper product-detail" data-pid="564885" data-gtm="{&quot;ecommerce&quot;:{&quot;detail&quot;:{&quot;products&quot;:[{&quot;name&quot;:&quot;Perfume Quorum EDT 100 ml&quot;,&quot;price&quot;:&quot;15.990&quot;,&quot;id&quot;:&quot;564885&quot;,&quot;brand&quot;:&quot;QUORUM&quot;,&quot;category&quot;:&quot;Sales Catalog &gt; Belleza &gt; Perfumes&quot;}]}}}">
      <div class="primary-images-wrapper">
        <img src="https://www.abc.cl/badges/cuotas.svg" alt="18 cuotas">
        <div class="primary-images pdp-carousel"><img src="https://www.abc.cl/images/564885.jpg" itemprop="image"></div>
      </div>
      <p class="internet price"><span class="price-value" data-value="15990.0">$15.990</span></p>
      <p class="normal price"><span class="price-value" data-value="19990.0">$19.990</span></p>
      <link itemprop="availability" href="http://schema.org/InStock" />
    </div>`;
  const product = normalizeProductPage(html, "https://www.abc.cl/perfume-quorum-edt-100-ml/564885.html");
  assert.equal(product.sku, "564885");
  assert.equal(product.brand, "QUORUM");
  assert.equal(product.price, 15990);
  assert.equal(product.raw.normalPrice, 19990);
  assert.equal(product.available, true);
  assert.equal(product.imageUrl, "https://www.abc.cl/images/564885.jpg");
});

test("selecciona sólo fichas públicas de perfumes desde el sitemap", () => {
  assert.equal(isPerfumeProductUrl("https://www.abc.cl/perfume-quorum-edt-100-ml/564885.html"), true);
  assert.equal(isPerfumeProductUrl("https://www.abc.cl/fragancia-be-delicious-250-ml-dkny/29488118.html"), true);
  assert.equal(isPerfumeProductUrl("https://www.abc.cl/cama-europea-flex-2-plazas-black-set--colonia/28970846.html"), false);
  assert.equal(isPerfumeProductUrl("https://www.abc.cl/combo-cama-europea-flex-1.5-plazas-paradise-set-colonia/29152810.html"), false);
  assert.equal(isPerfumeProductUrl("https://www.abc.cl/celular-android/123.html"), false);
  assert.equal(isPerfumeProductUrl("https://www.abc.cl/perfume-quorum/564885.html?pid=564885"), false);
});
