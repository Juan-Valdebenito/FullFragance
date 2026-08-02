const { v4: uuid } = require("uuid");
const { query } = require("../data/pgDatabase");
const { adminEmails } = require("../config/env");

function roleForEmail(email) {
  if (!email) return "customer";
  const normalized = String(email).toLowerCase();
  return adminEmails.includes(normalized) ? "admin" : "customer";
}

function rowToUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    passwordHash: row.password_hash || null,
    googleId: row.google_id || null,
    picture: row.picture || null,
    role: row.role || roleForEmail(row.email),
    sessionVersion: Number(row.session_version || 0),
    city: typeof row.city === "string" ? JSON.parse(row.city) : row.city,
    favorites: typeof row.favorites === "string" ? JSON.parse(row.favorites) : (row.favorites || []),
    scentPreferences: typeof row.scent_preferences === "string" ? JSON.parse(row.scent_preferences) : (row.scent_preferences || null),
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
  };
}

async function findByEmail(email) {
  if (!email) return null;
  const res = await query("SELECT * FROM users WHERE LOWER(email) = LOWER($1)", [email]);
  return res.rows.length ? rowToUser(res.rows[0]) : null;
}

async function findById(id) {
  if (!id) return null;
  const res = await query("SELECT * FROM users WHERE id = $1", [id]);
  return res.rows.length ? rowToUser(res.rows[0]) : null;
}

async function create({ name, email, passwordHash }) {
  const user = {
    id: uuid(),
    name,
    email,
    passwordHash: passwordHash || null,
    role: roleForEmail(email),
    sessionVersion: 0,
    city: null,
    favorites: [],
    scentPreferences: null,
    createdAt: new Date().toISOString(),
  };

  await query(
    `INSERT INTO users (id, name, email, password_hash, role, city, favorites, scent_preferences, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      user.id,
      user.name,
      user.email,
      user.passwordHash,
      user.role,
      null,
      JSON.stringify(user.favorites),
      null,
      user.createdAt,
    ]
  );

  return user;
}

async function updateCity(userId, city) {
  const user = await findById(userId);
  if (!user) return null;

  await query("UPDATE users SET city = $2 WHERE id = $1", [userId, JSON.stringify(city)]);
  user.city = city;
  return user;
}

async function updateName(userId, name) {
  const user = await findById(userId);
  if (!user) return null;

  await query("UPDATE users SET name = $2 WHERE id = $1", [userId, name]);
  user.name = name;
  return user;
}

async function updatePassword(userId, passwordHash) {
  const user = await findById(userId);
  if (!user) return null;

  await query("UPDATE users SET password_hash = $2 WHERE id = $1", [userId, passwordHash]);
  user.passwordHash = passwordHash;
  return user;
}

async function invalidateSessions(userId) {
  const result = await query(
    "UPDATE users SET session_version = session_version + 1 WHERE id = $1 RETURNING session_version",
    [userId]
  );
  return result.rows.length ? Number(result.rows[0].session_version) : null;
}

async function deleteById(userId) {
  const result = await query("DELETE FROM users WHERE id = $1", [userId]);
  return result.rowCount > 0;
}

async function toggleFavorite(userId, productId, aliases = []) {
  const user = await findById(userId);
  if (!user) return null;

  user.favorites = user.favorites || [];
  const equivalentIds = new Set([productId, ...aliases]);
  const alreadyFavorite = user.favorites.some((id) => equivalentIds.has(id));
  if (alreadyFavorite) {
    user.favorites = user.favorites.filter((id) => !equivalentIds.has(id));
  } else {
    user.favorites.push(productId);
  }

  await query("UPDATE users SET favorites = $2 WHERE id = $1", [userId, JSON.stringify(user.favorites)]);
  return user;
}

async function saveScentPreferences(userId, scores) {
  const user = await findById(userId);
  if (!user) return null;

  const scentPreferences = {
    scores,
    completedAt: new Date().toISOString(),
  };

  await query("UPDATE users SET scent_preferences = $2 WHERE id = $1", [userId, JSON.stringify(scentPreferences)]);
  user.scentPreferences = scentPreferences;
  return user;
}

async function findOrCreateGoogleUser({ name, email, googleId, picture }) {
  let user = await findByEmail(email);

  if (user) {
    let updated = false;
    if (googleId && !user.googleId) { user.googleId = googleId; updated = true; }
    if (picture && !user.picture) { user.picture = picture; updated = true; }
    if (updated) {
      await query(
        "UPDATE users SET google_id = COALESCE($1, google_id), picture = COALESCE($2, picture) WHERE id = $3",
        [user.googleId, user.picture, user.id]
      );
    }
    return user;
  }

  user = {
    id: uuid(),
    name: name || email.split("@")[0],
    email,
    passwordHash: null,
    googleId: googleId || null,
    picture: picture || null,
    role: roleForEmail(email),
    sessionVersion: 0,
    city: null,
    favorites: [],
    scentPreferences: null,
    createdAt: new Date().toISOString(),
  };

  await query(
    `INSERT INTO users (id, name, email, password_hash, google_id, picture, role, city, favorites, scent_preferences, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
    [
      user.id,
      user.name,
      user.email,
      null,
      user.googleId,
      user.picture,
      user.role,
      null,
      JSON.stringify(user.favorites),
      null,
      user.createdAt,
    ]
  );

  return user;
}

function toPublic(user) {
  if (!user) return null;
  const { passwordHash, ...publicUser } = user;
  return {
    ...publicUser,
    hasPassword: Boolean(passwordHash),
    role: publicUser.role || "customer",
    favorites: publicUser.favorites || [],
    scentPreferences: publicUser.scentPreferences ?? null,
  };
}

module.exports = {
  findByEmail,
  findById,
  roleForEmail,
  create,
  findOrCreateGoogleUser,
  updateName,
  updatePassword,
  invalidateSessions,
  deleteById,
  updateCity,
  toggleFavorite,
  saveScentPreferences,
  toPublic,
};
