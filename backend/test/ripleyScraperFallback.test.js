const test = require("node:test");
const assert = require("node:assert/strict");

process.env.RIPLEY_FIXTURE_DIR = "";
process.env.RIPLEY_MIN_DELAY_MS = "0";
process.env.RIPLEY_MAX_DELAY_MS = "0";
const { scrapePerfumeCatalog } = require("../src/services/ripleyScraper");

test("usa URLs semilla cuando la búsqueda de Ripley queda bloqueada", async (t) => {
  const originalFetch = global.fetch;
  t.after(() => {
    global.fetch = originalFetch;
  });
  global.fetch = async () => ({ status: 403, ok: false, headers: new Headers() });

  const results = await scrapePerfumeCatalog(2);
  assert.equal(results.length, 2);
  assert.equal(results[0].ok, true);
  assert.equal(results[0].product.source, "ripley-cl");
  assert.equal(results[0].product.raw.fallback, true);
  assert.equal(results[0].product.raw.mockPrice, true);
});
