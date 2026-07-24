const { Router } = require("express");
const { requireAuth } = require("../middleware/authMiddleware");
const scraperController = require("../controllers/scraperController");

const router = Router();
router.get("/falabella/products", requireAuth, scraperController.listFalabella);
router.post("/falabella/sync", requireAuth, scraperController.syncFalabella);
router.post("/falabella/sync-perfumes", requireAuth, scraperController.syncPerfumeCatalog);
router.get("/ripley/products", requireAuth, scraperController.listRipley);
router.post("/ripley/sync", requireAuth, scraperController.syncRipley);
router.post("/ripley/sync-perfumes", requireAuth, scraperController.syncRipleyPerfumeCatalog);
router.get("/sync-jobs/:jobId", requireAuth, scraperController.getSyncJob);

module.exports = router;
