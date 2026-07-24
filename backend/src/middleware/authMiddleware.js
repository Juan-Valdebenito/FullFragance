const { verifyToken } = require("../utils/jwt");
const userRepository = require("../models/userRepository");

function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "No autenticado. Falta el token." });
  }

  try {
    const payload = verifyToken(token);
    req.userId = payload.sub;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Token inválido o expirado." });
  }
}

function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    const user = userRepository.findById(req.userId);
    const publicUser = userRepository.toPublic(user);
    if (!publicUser || publicUser.role !== "admin") {
      return res.status(403).json({ error: "Se requiere rol administrador." });
    }
    req.user = publicUser;
    next();
  });
}

module.exports = { requireAuth, requireAdmin };
