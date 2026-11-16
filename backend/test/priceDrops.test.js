const test = require("node:test");
const assert = require("node:assert/strict");
const { computePriceDrops } = require("../src/models/priceDrops");

function product(id, offers, overrides = {}) {
  return { id, name: id, brand: "Marca", available: true, priceIsMock: false, offers, ...overrides };
}

const offer = (source, sku, price, extra = {}) => ({ source, sku, price, available: true, priceIsMock: false, ...extra });
const stat = (source, sku, refPrice, minPrice = refPrice, days = 30) => ({ source, sku, refPrice, minPrice, days });

test("ordena por la mayor baja respecto del precio habitual y elige la mejor tienda", () => {
  const products = [
    product("a", [offer("paris", "1", 80000), offer("ripley", "2", 60000)]),
    product("b", [offer("paris", "3", 50000)]),
  ];
  const stats = [stat("paris", "1", 100000), stat("ripley", "2", 100000, 70000), stat("paris", "3", 100000, 40000)];

  const drops = computePriceDrops(products, stats);

  assert.deepEqual(drops.map((drop) => [drop.deal.id, drop.source, drop.dropPct]), [["b", "paris", 50], ["a", "ripley", 40]]);
  assert.equal(drops[1].refPrice, 100000);
  assert.equal(drops[1].savings, 40000);
  assert.equal(drops[1].isLowest, true);
  assert.equal(drops[0].isLowest, false);
});

test("descarta ofertas sin historia, sin stock, simuladas, bajas mínimas y caídas irreales", () => {
  const products = [
    product("sin-historia", [offer("paris", "x", 10000)]),
    product("agotada", [offer("paris", "1", 50000, { available: false })]),
    product("simulada", [offer("paris", "2", 50000, { priceIsMock: true })]),
    product("ruido", [offer("paris", "3", 98000)]),
    product("error", [offer("paris", "4", 10000)]),
    product("subio", [offer("paris", "5", 120000)]),
  ];
  const stats = ["1", "2", "3", "4", "5"].map((sku) => stat("paris", sku, 100000));

  assert.deepEqual(computePriceDrops(products, stats), []);
});

test("respeta el límite pedido", () => {
  const products = Array.from({ length: 5 }, (_, index) => product(`p${index}`, [offer("paris", String(index), 50000 + index * 1000)]));
  const stats = products.map((_, index) => stat("paris", String(index), 100000));

  assert.equal(computePriceDrops(products, stats, { limit: 2 }).length, 2);
});
