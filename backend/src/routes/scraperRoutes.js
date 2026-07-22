const { Router } = require("express");
const { requireAuth } = require("../middleware/authMiddleware");
const scraperController = require("../controllers/scraperController");

const router = Router();
router.get("/falabella/products", requireAuth, scraperController.listFalabella);
router.post("/falabella/sync", requireAuth, scraperController.syncFalabella);
router.post("/falabella/sync-perfumes", requireAuth, scraperController.syncPerfumeCatalog);

module.exports = router;
