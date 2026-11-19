const { query } = require("../data/pgDatabase");

const COLUMNS = "id, name, body, approved, created_at";

function toReview(row) {
  return {
    id: String(row.id),
    name: row.name,
    body: row.body,
    approved: Boolean(row.approved),
    createdAt: new Date(row.created_at).toISOString(),
  };
}

async function create({ name, body }) {
  const result = await query(`INSERT INTO reviews (name, body) VALUES ($1, $2) RETURNING ${COLUMNS}`, [name, body]);
  return toReview(result.rows[0]);
}

async function listApproved(limit = 30) {
  const result = await query(`SELECT ${COLUMNS} FROM reviews WHERE approved = true ORDER BY created_at DESC LIMIT $1`, [limit]);
  return (result.rows || []).map(toReview);
}

// Las pendientes se listan de la más antigua a la más nueva: así el admin
// revisa en el orden en que llegaron.
async function listPending() {
  const result = await query(`SELECT ${COLUMNS} FROM reviews WHERE approved = false ORDER BY created_at ASC LIMIT 200`);
  return (result.rows || []).map(toReview);
}

async function approve(id) {
  const result = await query(`UPDATE reviews SET approved = true WHERE id = $1 RETURNING ${COLUMNS}`, [id]);
  return result.rows?.[0] ? toReview(result.rows[0]) : null;
}

async function remove(id) {
  const result = await query("DELETE FROM reviews WHERE id = $1", [id]);
  return (result.rowCount || 0) > 0;
}

module.exports = { create, listApproved, listPending, approve, remove };
