const test = require("node:test");
const assert = require("node:assert/strict");

process.env.ADMIN_EMAILS = "owner@example.test";
const db = require("../src/data/pgDatabase");
let rows = [];
let writes = [];
db.query = async (sql, values) => {
  if (sql.startsWith("SELECT")) return { rows };
  writes.push({ sql, values });
  return { rows: [], rowCount: 1 };
};
const repository = require("../src/models/userRepository");
const auth = require("../src/controllers/authController");
const { signToken, verifyToken } = require("../src/utils/jwt");
const jwt = require("jsonwebtoken");
const { jwtSecret } = require("../src/config/env");

test("public registration cannot obtain admin, even calling repository directly", async () => {
  writes = [];
  const user = await repository.create({ name: "Owner", email: "owner@example.test", passwordHash: "hash" });
  assert.equal(user.role, "customer");
  const response = { status(code) { this.code = code; return this; }, json(data) { this.data = data; } };
  await auth.register({ body: { name: "Owner", email: "owner@example.test", password: "TestPassword123" } }, response, error => { throw error; });
  assert.equal(response.code, 403);
});

test("Google cannot claim a password account or mismatched Google identity", async () => {
  rows = [{ id: "u1", email: "user@example.test", password_hash: "existing" }];
  writes = [];
  await assert.rejects(repository.findOrCreateGoogleUser({ email: "user@example.test", googleId: "google-new" }), { status: 409 });
  rows[0].google_id = "google-existing";
  await assert.rejects(repository.findOrCreateGoogleUser({ email: "user@example.test", googleId: "google-new" }), { status: 409 });
  assert.equal(writes.length, 0);
  const user = await repository.findOrCreateGoogleUser({ email: "user@example.test", googleId: "google-existing" });
  assert.equal(user.id, "u1");
});

test("new verified Google identities can receive the configured admin role", async () => {
  rows = [];
  const user = await repository.findOrCreateGoogleUser({ email: "owner@example.test", googleId: "verified-subject", name: "Owner" });
  assert.equal(user.role, "admin");
  assert.equal(user.passwordHash, null);
});

test("legacy tokens are invalidated while new tokens retain session version", () => {
  const legacy = jwt.sign({ sub: "u1", sv: 3 }, jwtSecret, { algorithm: "HS256" });
  assert.throws(() => verifyToken(legacy), /Sesión anterior/);
  assert.equal(verifyToken(signToken({ sub: "u1", sv: 3 })).sv, 3);
});
