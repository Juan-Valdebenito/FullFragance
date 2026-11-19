const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");

// Base de datos simulada: reproduce sólo las consultas de reseñas.
const db = require("../src/data/pgDatabase");
let reviews = [];
db.query = async (sql, values = []) => {
  if (sql.startsWith("INSERT INTO reviews")) {
    const row = { id: String(reviews.length + 1), name: values[0], body: values[1], approved: false, created_at: new Date() };
    reviews.push(row);
    return { rows: [row], rowCount: 1 };
  }
  if (sql.includes("FROM reviews WHERE approved = true")) return { rows: reviews.filter(r => r.approved) };
  if (sql.includes("FROM reviews WHERE approved = false")) return { rows: reviews.filter(r => !r.approved) };
  if (sql.startsWith("UPDATE reviews")) {
    const row = reviews.find(r => r.id === values[0]);
    if (row) row.approved = true;
    return { rows: row ? [row] : [], rowCount: row ? 1 : 0 };
  }
  if (sql.startsWith("DELETE FROM reviews")) {
    const before = reviews.length;
    reviews = reviews.filter(r => r.id !== values[0]);
    return { rows: [], rowCount: before - reviews.length };
  }
  return { rows: [], rowCount: 0 };
};

const app = require("../src/app");

async function withServer(fn) {
  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const base = `http://127.0.0.1:${server.address().port}/api/reviews`;
  try {
    await fn(base);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
}

const post = (url, body) => fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

test("una reseña nueva queda pendiente y no se publica hasta aprobarla", async () => {
  reviews = [];
  await withServer(async base => {
    const created = await post(base, { name: "  Camila   R. ", body: "Encontré mi perfume mucho más barato que en la tienda." });
    assert.equal(created.status, 201);
    assert.equal(reviews.length, 1);
    assert.equal(reviews[0].name, "Camila R.");
    assert.equal(reviews[0].approved, false);

    const publicList = await (await fetch(base)).json();
    assert.deepEqual(publicList.reviews, []);

    reviews[0].approved = true;
    const afterApproval = await (await fetch(base)).json();
    assert.equal(afterApproval.reviews.length, 1);
    assert.equal(afterApproval.reviews[0].name, "Camila R.");
  });
});

test("rechaza nombres o reseñas fuera de los límites y descarta bots del campo trampa", async () => {
  reviews = [];
  await withServer(async base => {
    assert.equal((await post(base, { name: "A", body: "Una reseña suficientemente larga." })).status, 400);
    assert.equal((await post(base, { name: "Ana", body: "corta" })).status, 400);
    const bot = await post(base, { name: "Bot", body: "Compra seguidores baratos aquí", website: "http://spam.test" });
    assert.equal(bot.status, 201);
    assert.equal(reviews.length, 0);
  });
});

test("limita los envíos por IP", async () => {
  await withServer(async base => {
    // Los tests anteriores ya hicieron 4 envíos desde esta IP (límite: 5/hora).
    assert.equal((await post(base, { name: "Luis", body: "Quinta reseña dentro del límite." })).status, 201);
    assert.equal((await post(base, { name: "Luis", body: "Sexta reseña, ya fuera del límite." })).status, 429);
  });
});

test("las rutas de moderación exigen sesión de administrador", async () => {
  await withServer(async base => {
    assert.equal((await fetch(`${base}/admin`)).status, 401);
    assert.equal((await post(`${base}/admin/1/approve`, {})).status, 401);
    assert.equal((await fetch(`${base}/admin/1`, { method: "DELETE" })).status, 401);
  });
});

test("el administrador aprueba y elimina reseñas", async () => {
  reviews = [];
  const controller = require("../src/controllers/reviewController");
  const response = () => ({
    status(code) { this.code = code; return this; },
    json(data) { this.data = data; return this; },
    send() { return this; },
  });
  const fail = error => { throw error; };
  reviews.push({ id: "1", name: "Ana", body: "Muy útil para comparar.", approved: false, created_at: new Date() });

  const listed = response();
  await controller.listForAdmin({}, listed, fail);
  assert.equal(listed.data.pending.length, 1);

  const approved = response();
  await controller.approve({ params: { id: "1" } }, approved, fail);
  assert.equal(approved.data.review.approved, true);

  const missing = response();
  await controller.approve({ params: { id: "abc" } }, missing, fail);
  assert.equal(missing.code, 404);

  const removed = response();
  await controller.remove({ params: { id: "1" } }, removed, fail);
  assert.equal(removed.code, 204);
  assert.equal(reviews.length, 0);
});
