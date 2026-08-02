const jwt = require("jsonwebtoken");
const { jwtSecret, jwtExpiresIn } = require("../config/env");

function signToken(payload) {
  return jwt.sign(payload, jwtSecret, { expiresIn: jwtExpiresIn, algorithm: "HS256" });
}

function verifyToken(token) {
  return jwt.verify(token, jwtSecret, { algorithms: ["HS256"] });
}

module.exports = { signToken, verifyToken };
