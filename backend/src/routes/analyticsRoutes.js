const { Router } = require("express");
const analyticsController = require("../controllers/analyticsController");
const { requireAdmin } = require("../middleware/authMiddleware");

const router = Router();

router.post("/page-view", analyticsController.trackPageView);
router.get("/metrics", requireAdmin, analyticsController.getMetrics);
router.put("/ad-revenue", requireAdmin, analyticsController.setAdRevenue);

module.exports = router;
