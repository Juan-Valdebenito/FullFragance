const path = require("path");
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const apiRoutes = require("./routes");
const { notFoundHandler, errorHandler } = require("./middleware/errorHandler");

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.use("/api", apiRoutes);

// Sirve el frontend estático (misma capa: sin problemas de CORS ni puertos distintos)
const frontendPath = path.join(__dirname, "..", "..", "frontend");
app.use(express.static(frontendPath));
app.get("*", (req, res, next) => {
  if (req.originalUrl.startsWith("/api")) return next();
  res.sendFile(path.join(frontendPath, "index.html"));
});

app.use("/api", notFoundHandler);
app.use(errorHandler);

module.exports = app;
