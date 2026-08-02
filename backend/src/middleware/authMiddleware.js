const { verifyToken } = require("../utils/jwt");
const userRepository = require("../models/userRepository");

async function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "No autenticado. Falta el token." });
  }

  let payload;
  try {
    payload = verifyToken(token);
  } catch (err) {
    return res.status(401).json({ error: "Token inválido o expirado." });
  }

  try {
    const user = await userRepository.findById(payload.sub);
    if (!user || Number(payload.sv || 0) !== user.sessionVersion) {
      return res.status(401).json({ error: "La sesión ya no es válida. Inicia sesión nuevamente." });
    }
    req.userId = payload.sub;
    req.user = userRepository.toPublic(user);
    next();
  } catch (err) {
    next(err);
  }
}

function requireAdmin(req, res, next) {
  requireAuth(req, res, async () => {
    try {
      if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({ error: "Se requiere rol administrador." });
      }
      next();
    } catch (err) {
      next(err);
    }
  });
}

module.exports = { requireAuth, requireAdmin };
