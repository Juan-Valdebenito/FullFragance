const test = require("node:test");
const assert = require("node:assert/strict");
const {
  assertHitesUrl,
  buildHitesCatalogPageUrl,
  extractCatalogProducts,
  extractTotalPages,
  parsePrice,
} = require("../src/services/hitesScraper");

function tile({ pid, name, brand, marketplace = "HITES", sales, list, onlyNormal = false, outOfStock = false }) {
  const item = `{&quot;item_id&quot;:&quot;${pid}&quot;,&quot;item_name&quot;:&quot;${name}&quot;,&quot;item_brand&quot;:&quot;${brand}&quot;,&quot;item_category&quot;:&quot;Perfumes Mujer&quot;,&quot;price&quot;:${sales || list},&quot;marketplace&quot;:&quot;${marketplace}&quot;,&quot;report_familia&quot;:&quot;REGULAR MUJER&quot;}`;
  return `
  <div class="h-100 plp-grid-tile" data-pid="${pid}">
    <div class="product-tile h-100 js-product-tile-container " data-gtmselectitem="{&quot;event&quot;:&quot;select_item&quot;,&quot;item&quot;:${item},&quot;marketplace&quot;:&quot;${marketplace}&quot;}" data-pid="${pid}">
      <a class="image-item js-tile-image-container is-loading" href="/perfume-${pid}.html">
        <img class="img-fluid w-100 tile-image js-image1" src="https://www.hites.com/dw/image/v2/BDPN_PRD/images/${pid}_1.jpg?sw=306&amp;sh=306" />
      </a>
      <span class="discount-badge bl-badge">32%</span>
      <div class="oos-tags${outOfStock ? " " : " d-none"}"><span class="tag-item outofstock">&iexcl;SIN STOCK!</span></div>
      <div class="price">
        ${sales ? `<h5 class="price-item sales "><span class="discount-badge pruebaaa discount-price ">32%</span><span class="value" content="${sales}">$${sales}</span></h5>` : ""}
        <span class="price-item list strike-through ${onlyNormal ? "only-normal-price" : ""}"><span class="value" content="${list}">Normal $${list}</span></span>
      </div>
    </div>
  </div>`;
}

const catalogHtml = `
  ${tile({ pid: "885845001", name: "Perfume mujer 212 Heroes Carolina Herrera / 30 Ml / Eau De Parfum", brand: "Carolina Herrera", sales: 46990, list: 68990 })}
  ${tile({ pid: "961436001", name: "Maison Al Hambra Salvo Edp 100ml", brand: "Maison Alhambra", list: 19990, onlyNormal: true })}
  ${tile({ pid: "977404001", name: "Perfume mujer Big Pony 2 Ralph Lauren 100 Ml", brand: "Ralph Lauren", sales: 31990, list: 63990, outOfStock: true })}
  ${tile({ pid: "10074000324001", name: "Hugo Boss Bottled Night Men Edt 100ml", brand: "Hugo Boss", marketplace: "Dpg", sales: 53990, list: 92990 })}
  <ul class="pagination">
    <li><a href="https://www.hites.com/belleza/perfumes/?sz=48&amp;start=48">2</a></li>
    <li><a href="https://www.hites.com/belleza/perfumes/?sz=48&amp;start=2400">51</a></li>
  </ul>`;

test("extrae tarjetas SSR de perfumes vendidos por Hites", () => {
  const products = extractCatalogProducts(catalogHtml);
  assert.equal(products.length, 3);
  const [heroes, salvo, pony] = products;
  assert.equal(heroes.source, "hites-cl");
  assert.equal(heroes.sku, "885845001");
  assert.equal(heroes.brand, "Carolina Herrera");
  assert.equal(heroes.price, 46990);
  assert.equal(heroes.currency, "CLP");
  assert.equal(heroes.presentation, "30 Ml");
  assert.equal(heroes.available, true);
  assert.equal(heroes.url, "https://www.hites.com/perfume-885845001.html");
  assert.equal(heroes.imageUrl, "https://www.hites.com/dw/image/v2/BDPN_PRD/images/885845001_1.jpg");
  assert.equal(heroes.raw.normalPrice, 68990);
  assert.equal(heroes.raw.discount, "32%");
  assert.equal(heroes.raw.seller, "HITES");

  assert.equal(salvo.price, 19990);
  assert.equal(salvo.raw.normalPrice, null);
  assert.equal(salvo.presentation, "100ml");

  assert.equal(pony.available, false);
});

test("descarta vendedores del marketplace salvo que se pida lo contrario", () => {
  assert.ok(!extractCatalogProducts(catalogHtml).some((product) => product.sku === "10074000324001"));
  const all = extractCatalogProducts(catalogHtml, { onlyHites: false });
  assert.equal(all.find((product) => product.sku === "10074000324001").raw.seller, "Dpg");
});

test("calcula el total de páginas desde la paginación", () => {
  assert.equal(extractTotalPages(catalogHtml, 1), 51);
  assert.equal(extractTotalPages("<div></div>", 3), 3);
});

test("usa sólo la paginación permitida por robots.txt de Hites", () => {
  assert.equal(buildHitesCatalogPageUrl(1), "https://www.hites.com/belleza/perfumes/?sz=48&start=0");
  assert.equal(buildHitesCatalogPageUrl(3), "https://www.hites.com/belleza/perfumes/?sz=48&start=96");
  assert.throws(() => assertHitesUrl("https://www.hites.com/belleza/perfumes/?srule=best-matches"), /robots\.txt/);
  assert.throws(() => assertHitesUrl("https://www.hites.com/on/demandware.store/Sites-HITES-Site/default/Search-UpdateGrid"), /robots\.txt/);
  assert.throws(() => assertHitesUrl("https://www.hites.com/checkout"), /robots\.txt/);
  assert.throws(() => assertHitesUrl("https://example.com/belleza/perfumes/"), /hites\.com/);
});

test("convierte precios chilenos de Hites", () => {
  assert.equal(parsePrice("46990"), 46990);
  assert.equal(parsePrice("$46.990"), 46990);
  assert.equal(parsePrice(null), null);
});
