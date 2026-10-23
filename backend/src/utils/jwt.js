const jwt = require("jsonwebtoken");
const { jwtSecret, jwtExpiresIn } = require("../config/env");

function signToken(payload) {
  return jwt.sign({ ...payload, version: 2 }, jwtSecret, { expiresIn: jwtExpiresIn, algorithm: "HS256" });
}

function verifyToken(token) {
  const payload = jwt.verify(token, jwtSecret, { algorithms: ["HS256"] });
  if (payload.version !== 2) throw new Error("Sesión anterior: inicia sesión nuevamente.");
  return payload;
}

module.exports = { signToken, verifyToken };
