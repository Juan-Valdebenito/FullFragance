/**
 * Limitador en memoria para desarrollo y despliegues de una sola instancia.
 * Si la API escala a varias instancias, sustituir el almacenamiento por Redis
 * para que el límite sea compartido entre procesos.
 */
function createRateLimiter({ windowMs, max, message, keyGenerator = (req) => req.ip || "unknown" }) {
  const entries = new Map();

  return function rateLimit(req, res, next) {
    const now = Date.now();
    const key = String(keyGenerator(req));
    const entry = entries.get(key);
    const current = !entry || entry.resetAt <= now ? { count: 0, resetAt: now + windowMs } : entry;

    current.count += 1;
    entries.set(key, current);

    // Limpieza oportunista para que el mapa no crezca indefinidamente.
    if (entries.size > 2_000) {
      for (const [storedKey, value] of entries) {
        if (value.resetAt <= now) entries.delete(storedKey);
      }
    }

    res.set("RateLimit-Limit", String(max));
    res.set("RateLimit-Remaining", String(Math.max(0, max - current.count)));
    res.set("RateLimit-Reset", String(Math.ceil(current.resetAt / 1000)));

    if (current.count > max) {
      res.set("Retry-After", String(Math.ceil((current.resetAt - now) / 1000)));
      return res.status(429).json({ error: message || "Demasiadas solicitudes. Inténtalo de nuevo más tarde." });
    }

    next();
  };
}

function authKey(req) {
  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  return `${req.ip || "unknown"}:${email}`;
}

module.exports = { createRateLimiter, authKey };
