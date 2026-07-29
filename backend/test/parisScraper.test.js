const test = require("node:test");
const assert = require("node:assert/strict");
const {
  assertParisUrl,
  buildParisCatalogPageUrl,
  extractCatalogProducts,
  extractTotalProducts,
  hasPerfumeBreadcrumb,
  offersSoldByParis,
  parsePrice,
} = require("../src/services/parisScraper");

const catalog = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  mainEntity: {
    "@type": "ItemList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        item: {
          "@type": "Product",
          name: "Perfume La Vie Est Belle EDP 100 ml Lancôme",
          url: "https://www.paris.cl/perfume-la-vie-est-belle-edp-100-ml-lancome-390910999.html",
          image: "https://images.paris.cl/390910999.jpg",
          sku: "390910999",
          brand: { "@type": "Brand", name: "Lancôme" },
          offers: {
            "@type": "Offer",
            price: 89990,
            priceCurrency: "CLP",
            availability: "https://schema.org/InStock",
          },
          aggregateRating: { ratingValue: 4.8, reviewCount: 123 },
        },
      },
    ],
  },
};

test("extrae los productos SSR de Paris desde el JSON-LD de Next", () => {
  const payload = JSON.stringify(catalog);
  const html = `<script>(self.__next_s=self.__next_s||[]).push([0,{"type":"application/ld+json","children":${JSON.stringify(payload)}}])</script><span data-testid="productsCount-loading">13.725<!-- --> </span>productos encontrados`;
  const products = extractCatalogProducts(html, "https://www.paris.cl/belleza/perfumes/?page=1&isMarketplace=false");

  assert.equal(products.length, 1);
  assert.equal(products[0].source, "paris-cl");
  assert.equal(products[0].sku, "390910999");
  assert.equal(products[0].brand, "Lancôme");
  assert.equal(products[0].price, 89990);
  assert.equal(products[0].presentation, "100 ml");
  assert.equal(products[0].available, true);
  assert.equal(extractTotalProducts(html), 13725);
});

test("pagina sólo perfumes vendidos por Paris", () => {
  const url = new URL(buildParisCatalogPageUrl(3));
  assert.equal(url.pathname, "/belleza/perfumes/");
  assert.equal(url.searchParams.get("page"), "3");
  assert.equal(url.searchParams.get("sortby"), "relevance");
  assert.equal(url.searchParams.get("isMarketplace"), "false");
  assert.throws(() => assertParisUrl("https://example.com/perfume.html"), /paris\.cl/);
  assert.throws(() => assertParisUrl("https://www.paris.cl/admin/orders"), /excluida/);
});

test("convierte precios de Paris a CLP", () => {
  assert.equal(parsePrice("$89.990"), 89990);
  assert.equal(parsePrice(89990), 89990);
  assert.equal(parsePrice(null), null);
});

test("acepta sólo fichas cuya categoría estructurada es perfumería", () => {
  assert.equal(hasPerfumeBreadcrumb([{ "@type": "BreadcrumbList", itemListElement: [{ name: "Belleza" }, { name: "Perfumes" }] }]), true);
  assert.equal(hasPerfumeBreadcrumb([{ "@type": "BreadcrumbList", itemListElement: [{ name: "Tecnología" }, { name: "Audífonos" }] }]), false);
});

test("prioriza la oferta vigente más baja de una ficha Paris", () => {
  const { normalizeProduct } = require("../src/services/parisScraper");
  const product = normalizeProduct({
    ...catalog.mainEntity.itemListElement[0].item,
    offers: [
      { price: 156990, priceCurrency: "CLP", availability: "https://schema.org/InStock" },
      { price: 89990, priceCurrency: "CLP", availability: "https://schema.org/InStock" },
      { price: 84990, priceCurrency: "CLP", availability: "https://schema.org/InStock" },
    ],
  }, "https://www.paris.cl/");
  assert.equal(product.price, 84990);
});

test("descarta ofertas marketplace y conserva sólo las vendidas por Paris", () => {
  const offers = offersSoldByParis({
    offers: [
      { price: 79990, seller: { name: "Vendedor Marketplace" } },
      { price: 84990, seller: { name: "Paris" } },
      { price: 82990, seller: { name: "PARIS.CL" } },
    ],
  });
  assert.deepEqual(offers.map((offer) => offer.price), [84990, 82990]);
});
