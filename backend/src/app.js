const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const swaggerUi = require("swagger-ui-express");

const openapi = require("./docs/openapi");
const apiRoutes = require("./routes");
const { notFoundHandler, errorHandler } = require("./middleware/errorHandler");
const imageController = require("./controllers/imageController");

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/api/openapi.json", (_req, res) => res.json(openapi));
app.get("/api/images/ripley/:sku", imageController.ripleyImage);
app.use(
  "/api/docs",
  swaggerUi.serve,
  swaggerUi.setup(openapi, {
    customSiteTitle: "FullFragrance API - Swagger",
    swaggerOptions: {
      persistAuthorization: true,
    },
  })
);

app.use("/api", apiRoutes);
app.get("/", (_req, res) => res.json({ name: "FullFragrance API", frontend: "http://localhost:3001" }));

app.use("/api", notFoundHandler);
app.use(errorHandler);

module.exports = app;
