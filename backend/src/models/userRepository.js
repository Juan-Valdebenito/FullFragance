const { v4: uuid } = require("uuid");
const { readDb, writeDb } = require("../data/database");

function findByEmail(email) {
  const db = readDb();
  return db.users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
}

function findById(id) {
  const db = readDb();
  return db.users.find((u) => u.id === id) || null;
}

function create({ name, email, passwordHash }) {
  const db = readDb();
  const user = {
    id: uuid(),
    name,
    email,
    passwordHash,
    city: null, // { name, country, lat, lon }
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

function toPublic(user) {
  if (!user) return null;
  const { passwordHash, ...publicUser } = user;
  return publicUser;
}

module.exports = { findByEmail, findById, create, updateCity, toPublic };
