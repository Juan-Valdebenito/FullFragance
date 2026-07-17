const { Router } = require("express");
const storeController = require("../controllers/storeController");
const { requireAuth } = require("../middleware/authMiddleware");

const router = Router();

router.get("/", requireAuth, storeController.listStores);

module.exports = router;
