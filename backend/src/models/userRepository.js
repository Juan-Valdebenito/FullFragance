const { v4: uuid } = require("uuid");
const { readDb, writeDb } = require("../data/database");
const { adminEmails } = require("../config/env");

function findByEmail(email) {
  const db = readDb();
  return db.users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
}

function findById(id) {
  const db = readDb();
  return db.users.find((u) => u.id === id) || null;
}

const DEFAULT_ADMIN_EMAILS = ["admin@gmial.com", "admin@gmail.com", "fullfragance@gmail.com"];

function roleForEmail(email) {
  const normalized = String(email).toLowerCase();
  return DEFAULT_ADMIN_EMAILS.includes(normalized) || adminEmails.includes(normalized) ? "admin" : "customer";
}

function create({ name, email, passwordHash }) {
  const db = readDb();
  const user = {
    id: uuid(),
    name,
    email,
    passwordHash,
    role: roleForEmail(email),
    city: null,
    favorites: [],
    scentPreferences: null,
    createdAt: new Date().toISOString(),
  };
  db.users.push(user);
  writeDb(db);
  return user;
}

function updateCity(userId, city) {
  const db = readDb();
  const user = db.users.find((u) => u.id === userId);
  if (!user) return null;
  user.city = city;
  writeDb(db);
  return user;
}

function toggleFavorite(userId, productId, aliases = []) {
  const db = readDb();
  const user = db.users.find((u) => u.id === userId);
  if (!user) return null;

  user.favorites = user.favorites || [];
  const equivalentIds = new Set([productId, ...aliases]);
  const alreadyFavorite = user.favorites.some((id) => equivalentIds.has(id));
  if (alreadyFavorite) {
    user.favorites = user.favorites.filter((id) => !equivalentIds.has(id));
  } else {
    user.favorites.push(productId);
  }
  writeDb(db);
  return user;
}

function saveScentPreferences(userId, scores) {
  const db = readDb();
  const user = db.users.find((u) => u.id === userId);
  if (!user) return null;

  user.scentPreferences = {
    scores,
    completedAt: new Date().toISOString(),
  };
  writeDb(db);
  return user;
}

function toPublic(user) {
  if (!user) return null;
  const { passwordHash, ...publicUser } = user;
  return {
    ...publicUser,
    role: roleForEmail(publicUser.email) === "admin" ? "admin" : publicUser.role || "customer",
    favorites: publicUser.favorites || [],
    scentPreferences: publicUser.scentPreferences ?? null,
  };
}

module.exports = {
  findByEmail,
  findById,
  roleForEmail,
  create,
  updateCity,
  toggleFavorite,
  saveScentPreferences,
  toPublic,
};
