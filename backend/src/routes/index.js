const { Router } = require("express");

const authRoutes = require("./authRoutes");
const userRoutes = require("./userRoutes");
const priceRoutes = require("./priceRoutes");
const catalogRoutes = require("./catalogRoutes");
const scraperRoutes = require("./scraperRoutes");
const analyticsRoutes = require("./analyticsRoutes");

const router = Router();

router.get("/", (_req, res) => res.json({ name: "FullFragrance API", status: "ok" }));

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/catalog", catalogRoutes);
router.use("/scrapers", scraperRoutes);
router.use("/analytics", analyticsRoutes);
router.use("/", priceRoutes); // expone /api/products, /api/prices

module.exports = router;
