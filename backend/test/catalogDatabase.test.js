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

test("al guardar un producto registra el precio del día en price_history", async () => {
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

test("raw_json guarda sólo la marca de precio simulado, no el JSON de la tienda", async () => {
  const calls = [];
  await upsertProduct(product({ raw: { "@type": "Product", offers: { price: 1 } } }), async (sql, params) => calls.push({ sql, params }));
  await upsertProduct(product({ raw: { mockPrice: true, fallback: true } }), async (sql, params) => calls.push({ sql, params }));
  const rawOf = (call) => JSON.parse(call.params[11]);
  assert.deepEqual(rawOf(calls[0]), {});
  assert.deepEqual(rawOf(calls.at(-1)), { mockPrice: true });
});

test("guarda la descripción de la tienda, acotada y sin espacios de sobra", async () => {
  const calls = [];
  await upsertProduct(product({ description: "  Con notas de bergamota y jazmín.  " }), async (sql, params) => calls.push({ sql, params }));
  assert.equal(calls[0].params[10], "Con notas de bergamota y jazmín.");

  calls.length = 0;
  const long = "a".repeat(700);
  await upsertProduct(product({ description: long }), async (sql, params) => calls.push({ sql, params }));
  assert.equal(calls[0].params[10].length, 601); // 600 + "…"
  assert.ok(calls[0].params[10].endsWith("…"));

  calls.length = 0;
  await upsertProduct(product({ description: null }), async (sql, params) => calls.push({ sql, params }));
  assert.equal(calls[0].params[10], null);
});
