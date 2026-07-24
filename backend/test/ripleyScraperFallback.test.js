const test = require("node:test");
const assert = require("node:assert/strict");

process.env.RIPLEY_FIXTURE_DIR = "";
process.env.RIPLEY_MIN_DELAY_MS = "0";
process.env.RIPLEY_MAX_DELAY_MS = "0";
process.env.RIPLEY_CURL_FALLBACK = "false";
const { scrapePerfumeCatalog } = require("../src/services/ripleyScraper");

test("no inventa productos ni precios cuando Ripley bloquea la búsqueda", async (t) => {
  const originalFetch = global.fetch;
  t.after(() => {
    global.fetch = originalFetch;
  });
  global.fetch = async () => ({ status: 403, ok: false, headers: new Headers() });

  await assert.rejects(
    scrapePerfumeCatalog(2),
    /No se encontraron productos reales en Ripley/
  );
});
