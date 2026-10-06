const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");

// Reemplaza módulos reales por dobles antes de cargar el job: así la prueba no
// toca Postgres, el respaldo local ni la red.
function stubModule(relativePath, exports) {
  const file = require.resolve(path.join(__dirname, "..", relativePath));
  require.cache[file] = { id: file, filename: file, loaded: true, exports };
}

const events = [];
let replaceImpl = async () => {};

stubModule("src/data/catalogDatabase", {
  replaceProducts: (...args) => replaceImpl(...args),
});
stubModule("src/models/catalogRepository", {
  invalidateCatalogCache: () => events.push("invalidate"),
});
stubModule("src/services/parisScraper", {
  scrapeDirectCatalogPage: async (page) => ({
    products: [{ source: "paris-cl", sku: `sku-${page}`, name: `Perfume ${page}` }],
    page,
    totalPages: 2,
    scanned: 1,
  }),
});

const { startCatalogSync, getCatalogSyncJob } = require("../src/services/catalogSyncJob");

async function waitForJob(id) {
  for (let attempt = 0; attempt < 200; attempt += 1) {
    const job = getCatalogSyncJob(id);
    if (job.status !== "running") return job;
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
  throw new Error("El job no terminó a tiempo.");
}

// Las dos pruebas comparten el job de paris-cl: se ejecutan en orden.
test("sincronización completa del catálogo", async (t) => {
  await t.test("no marca el job como completado hasta guardar todos los productos", async () => {
    events.length = 0;
    replaceImpl = async (source, products) => {
      events.push("replace:start");
      await new Promise((resolve) => setTimeout(resolve, 40));
      events.push(`replace:end:${source}:${products.length}`);
    };

    const job = await waitForJob(startCatalogSync("paris-cl").id);

    assert.equal(job.status, "completed");
    assert.equal(job.imported, 2);
    // La caché del catálogo se invalida solo con los datos ya guardados.
    assert.deepEqual(events, ["replace:start", "replace:end:paris-cl:2", "invalidate"]);
  });

  await t.test("marca el job como fallido si no se pudo guardar el catálogo", async () => {
    events.length = 0;
    replaceImpl = async () => {
      throw new Error("conexión perdida");
    };

    const job = await waitForJob(startCatalogSync("paris-cl").id);

    assert.equal(job.status, "failed");
    assert.match(job.error, /conexión perdida/);
    assert.deepEqual(events, []);
  });
});
