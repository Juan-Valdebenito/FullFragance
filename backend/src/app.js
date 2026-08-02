const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const swaggerUi = require("swagger-ui-express");

const openapi = require("./docs/openapi");
const apiRoutes = require("./routes");
const { notFoundHandler, errorHandler } = require("./middleware/errorHandler");
const imageController = require("./controllers/imageController");
const { isProduction, trustProxy } = require("./config/env");
const { createRateLimiter, authKey } = require("./middleware/rateLimit");
const { securityHeaders, corsOptions } = require("./middleware/security");

const app = express();

app.disable("x-powered-by");
app.set("trust proxy", trustProxy);
app.use(securityHeaders);
app.use(cors(corsOptions()));
app.use(express.json({ limit: "100kb", strict: true }));
app.use(morgan("dev"));

const apiLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 600 });
const loginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  keyGenerator: authKey,
  message: "Demasiados intentos de inicio de sesión. Inténtalo nuevamente en 15 minutos.",
});
const registrationLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: "Demasiados registros desde esta red. Inténtalo nuevamente más tarde.",
});
const analyticsLimiter = createRateLimiter({ windowMs: 60 * 1000, max: 60 });

app.use("/api", apiLimiter);
app.use("/api/auth/login", loginLimiter);
app.use("/api/auth/google", loginLimiter);
app.use("/api/auth/register", registrationLimiter);
app.use("/api/analytics/page-view", analyticsLimiter);

app.get("/api/images/ripley/:sku?", imageController.ripleyImage);
if (!isProduction) {
  app.get("/api/openapi.json", (_req, res) => res.json(openapi));
  app.use(
    "/api/docs",
    swaggerUi.serve,
    swaggerUi.setup(openapi, {
      customSiteTitle: "FullFragrance API - Swagger",
      swaggerOptions: { persistAuthorization: false },
    })
  );
}

app.use("/api", apiRoutes);
app.get("/", (_req, res) => res.json({ name: "FullFragrance API", frontend: "http://localhost:3001" }));

app.use("/api", notFoundHandler);
app.use(errorHandler);

module.exports = app;
