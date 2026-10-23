const test = require('node:test');
const assert = require('node:assert/strict');

const calls = [];
let failure = false;
const dbPath = require.resolve('../src/data/pgDatabase');
require.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true, exports: {
  query: async () => { throw new Error('Query outside transaction'); },
  transaction: async fn => {
    calls.push({ sql: 'BEGIN' });
    try {
      await fn(async (sql, params) => {
        calls.push({ sql, params });
        if (failure && sql.includes('price_history')) throw new Error('write failed');
      });
      calls.push({ sql: 'COMMIT' });
    } catch (error) {
      calls.push({ sql: 'ROLLBACK' });
      throw error;
    }
  },
} };
const { replaceProducts } = require('../src/data/catalogDatabase');
const products = Array.from({ length: 501 }, (_, i) => ({
  source: 'silk-cl', sku: String(i), name: `Perfume ${i}`, price: i === 0 ? 0 : 1000,
  url: 'https://example.com', available: true, raw: { mockPrice: i === 1 },
}));

test('bulk replacement keeps every product and eligible price in one transaction', async () => {
  calls.length = 0;
  await replaceProducts('silk-cl', products);
  const catalog = calls.filter(c => c.sql.includes('INSERT INTO scraped_products'));
  const history = calls.filter(c => c.sql.includes('INSERT INTO price_history'));
  const observations = calls.filter(c => c.sql.includes('INSERT INTO price_observations'));
  assert.deepEqual(catalog.map(c => c.params.length / 13), [250, 250, 1]);
  assert.deepEqual(history.map(c => c.params.length / 7), [248, 250, 1]);
  assert.deepEqual(observations.map(c => c.params.length / 7), [248, 250, 1]);
  assert.deepEqual(catalog.flatMap(c => c.params.filter((_, i) => i % 13 === 1)), products.map(p => p.sku));
  for (const call of [...catalog, ...history, ...observations]) {
    const placeholders = [...call.sql.matchAll(/\$(\d+)/g)].map(m => Number(m[1]));
    assert.equal(Math.max(...placeholders), call.params.length);
    assert.equal(placeholders.length, call.params.length);
  }
  assert.equal(calls[0].sql, 'BEGIN');
  assert.equal(calls.at(-1).sql, 'COMMIT');
});

test('history failures propagate through the transaction and prevent commit', async () => {
  calls.length = 0;
  failure = true;
  await assert.rejects(replaceProducts('silk-cl', products), /write failed/);
  assert.equal(calls.at(-1).sql, 'ROLLBACK');
  assert.equal(calls.some(c => c.sql === 'COMMIT'), false);
  failure = false;
});

test('empty replacement and source validation remain supported', async () => {
  calls.length = 0;
  await replaceProducts('silk-cl', []);
  assert.equal(calls.length, 3);
  calls.length = 0;
  await assert.rejects(replaceProducts('abc-cl', products), /fuente/);
  assert.equal(calls.length, 0);
});
