const { Router } = require("express");

const authRoutes = require("./authRoutes");
const userRoutes = require("./userRoutes");
const storeRoutes = require("./storeRoutes");
const priceRoutes = require("./priceRoutes");
const catalogRoutes = require("./catalogRoutes");

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/stores", storeRoutes);
router.use("/catalog", catalogRoutes);
router.use("/", priceRoutes); // expone /api/products, /api/prices

module.exports = router;
