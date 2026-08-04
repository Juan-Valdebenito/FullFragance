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

// El frontend React se sirve como servicio separado en Railway.
// Este backend solo expone la API REST en /api.
app.get("/", (_req, res) =>
  res.json({ name: "FullFragrance API", status: "ok" })
);

app.use("/api", notFoundHandler);
app.use(errorHandler);

module.exports = app;
