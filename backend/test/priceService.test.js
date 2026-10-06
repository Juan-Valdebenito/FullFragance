const test = require("node:test");
const assert = require("node:assert/strict");
const { pricesForProduct, priceRange } = require("../src/models/priceService");

const product = {
  id: "silk-jpg54",
  source: "multi-store",
  basePrice: 58990,
  offers: [
    { source: "silk-cl", price: 58990, available: false, productUrl: "https://silk.example" },
    { source: "leparis-cl", price: 149990, available: true, productUrl: "https://leparis.example" },
    { source: "paris-cl", price: 99990, available: true, productUrl: "https://paris.example" },
  ],
};

test("una tienda sin stock no queda primera aunque sea la más barata", () => {
  const prices = pricesForProduct(product);
  assert.deepEqual(prices.map((price) => [price.price, price.available]), [
    [99990, true],
    [149990, true],
    [58990, false],
  ]);
});

test("el rango de precios usa solo las tiendas con stock", () => {
  assert.deepEqual(priceRange(pricesForProduct(product)), { min: 99990, max: 149990 });
});

test("si ninguna tienda tiene stock, el rango usa todos los precios", () => {
  const soldOut = { ...product, offers: product.offers.map((offer) => ({ ...offer, available: false })) };
  assert.deepEqual(priceRange(pricesForProduct(soldOut)), { min: 58990, max: 149990 });
  assert.deepEqual(priceRange([]), { min: null, max: null });
});
