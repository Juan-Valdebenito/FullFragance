const { frontendOrigins, isProduction } = require("../config/env");

function securityHeaders(req, res, next) {
  res.set({
    "Content-Security-Policy": "default-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'",
    "Permissions-Policy": "camera=(), geolocation=(), microphone=(), payment=(), usb=()",
    "Referrer-Policy": "no-referrer",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Cross-Origin-Opener-Policy": "same-origin",
  });

  // Sólo debe enviarse cuando la aplicación está detrás de HTTPS.
  if (isProduction) res.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  next();
}

function corsOptions() {
  return {
    origin(origin, callback) {
      // Requests de servidor a servidor, curl y health checks no llevan Origin.
      if (!origin || frontendOrigins.includes(origin)) return callback(null, true);
      const error = new Error("Origen no permitido por la política CORS.");
      error.status = 403;
      return callback(error);
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Authorization", "Content-Type"],
    maxAge: 600,
    optionsSuccessStatus: 204,
  };
}

module.exports = { securityHeaders, corsOptions };
