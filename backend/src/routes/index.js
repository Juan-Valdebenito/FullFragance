const { Router } = require("express");

const authRoutes = require("./authRoutes");
const userRoutes = require("./userRoutes");
const storeRoutes = require("./storeRoutes");
const priceRoutes = require("./priceRoutes");

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/stores", storeRoutes);
router.use("/", priceRoutes); // expone /api/products, /api/prices

module.exports = router;
