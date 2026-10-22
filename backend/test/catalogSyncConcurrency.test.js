const test = require('node:test');
const assert = require('node:assert/strict');
const stub = (file, exports) => {
  const id = require.resolve(file);
  require.cache[id] = { id, filename: id, loaded: true, exports };
};
let active = 0;
let peak = 0;
const releases = [];
stub('../src/data/catalogDatabase', { replaceProducts: async () => {} });
stub('../src/models/catalogRepository', { invalidateCatalogCache: () => {} });
for (const name of ['paris', 'abc', 'silk', 'elite']) {
  stub(`../src/services/${name}Scraper`, { scrapeDirectCatalogPage: async () => {
    active++;
    peak = Math.max(peak, active);
    await new Promise(resolve => releases.push(resolve));
    active--;
    if (name === 'abc') throw new Error('store unavailable');
    return { products: [], totalPages: 1, scanned: 0 };
  } });
}
const { startCatalogSync, getCatalogSyncJob } = require('../src/services/catalogSyncJob');
const tick = () => new Promise(resolve => setImmediate(resolve));

test('queue limits concurrent stores, deduplicates and releases slots after failure', async () => {
  const jobs = ['paris', 'abc', 'silk', 'elite'].map(name => startCatalogSync(`${name}-cl`));
  assert.equal(startCatalogSync('elite-cl').id, jobs[3].id);
  await tick();
  assert.equal(active, 3);
  assert.equal(getCatalogSyncJob(jobs[3].id).phase, 'queued');
  releases[1]();
  await tick();
  assert.equal(getCatalogSyncJob(jobs[1].id).status, 'failed');
  assert.equal(getCatalogSyncJob(jobs[3].id).phase, 'scraping');
  releases.forEach(release => release());
  await tick();
  assert.equal(peak, 3);
  for (const index of [0, 2, 3]) {
    const job = getCatalogSyncJob(jobs[index].id);
    assert.equal(job.status, 'completed');
    assert.ok(job.scrapeDurationMs >= 0);
    assert.ok(job.saveDurationMs >= 0);
  }
});
