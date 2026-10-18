const test = require("node:test");
const assert = require("node:assert/strict");
const { upsertProduct } = require("../src/data/catalogDatabase");

function product(overrides = {}) {
  return {
    source: "paris-cl",
    sku: "sku-1",
    brand: "Marca",
    name: "Perfume",
    price: 59990,
    currency: "CLP",
    presentation: "100 ml",
    imageUrl: null,
    available: true,
    url: "https://example.com/perfume",
    raw: {},
    ...overrides,
  };
}

test("al guardar un producto registra una observación diaria de precio", async () => {
  const calls = [];
  await upsertProduct(product(), async (sql, params) => calls.push({ sql, params }));

  assert.equal(calls.length, 2);
  assert.match(calls[1].sql, /INSERT INTO price_history/);
  assert.deepEqual(calls[1].params.slice(0, 2), ["paris-cl", "sku-1"]);
  assert.equal(calls[1].params[3], 59990);
  assert.equal(calls[1].params[5], true);
});

test("no registra precios simulados en el historial", async () => {
  const calls = [];
  await upsertProduct(product({ raw: { mockPrice: true } }), async (sql) => calls.push(sql));

  assert.equal(calls.length, 1);
  assert.doesNotMatch(calls[0], /price_history/);
});
