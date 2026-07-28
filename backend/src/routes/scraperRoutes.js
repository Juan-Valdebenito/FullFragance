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
router.get("/alisha/products", requireAdmin, scraperController.listAlisha);
router.post("/alisha/sync", requireAdmin, scraperController.syncAlisha);
router.post("/alisha/sync-perfumes", requireAdmin, scraperController.syncAlishaPerfumeCatalog);
router.get("/silk/products", requireAdmin, scraperController.listSilk);
router.post("/silk/sync", requireAdmin, scraperController.syncSilk);
router.post("/silk/sync-perfumes", requireAdmin, scraperController.syncSilkPerfumeCatalog);
router.get("/elite/products", requireAdmin, scraperController.listElite);
router.post("/elite/sync", requireAdmin, scraperController.syncElite);
router.post("/elite/sync-perfumes", requireAdmin, scraperController.syncElitePerfumeCatalog);
router.get("/sync-jobs/:jobId", requireAdmin, scraperController.getSyncJob);

module.exports = router;
