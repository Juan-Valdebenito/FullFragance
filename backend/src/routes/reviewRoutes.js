const { Router } = require("express");
const reviewController = require("../controllers/reviewController");
const { requireAdmin } = require("../middleware/authMiddleware");
const { createRateLimiter } = require("../middleware/rateLimit");

const router = Router();

// Sin cuenta cualquiera puede escribir: se limita por IP para frenar spam.
const submitLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: "Ya enviaste varias reseñas. Inténtalo nuevamente en una hora.",
});

router.get("/", reviewController.listPublic);
router.post("/", submitLimiter, reviewController.create);

router.get("/admin", requireAdmin, reviewController.listForAdmin);
router.post("/admin/:id/approve", requireAdmin, reviewController.approve);
router.delete("/admin/:id", requireAdmin, reviewController.remove);

module.exports = router;
