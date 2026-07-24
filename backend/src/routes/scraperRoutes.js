const { Router } = require("express");
const { requireAdmin } = require("../middleware/authMiddleware");
const scraperController = require("../controllers/scraperController");

const router = Router();
router.get("/falabella/products", requireAdmin, scraperController.listFalabella);
router.post("/falabella/sync", requireAdmin, scraperController.syncFalabella);
router.post("/falabella/sync-perfumes", requireAdmin, scraperController.syncPerfumeCatalog);
router.get("/ripley/products", requireAdmin, scraperController.listRipley);
router.post("/ripley/sync", requireAdmin, scraperController.syncRipley);
router.post("/ripley/sync-perfumes", requireAdmin, scraperController.syncRipleyPerfumeCatalog);
router.get("/sync-jobs/:jobId", requireAdmin, scraperController.getSyncJob);

module.exports = router;
