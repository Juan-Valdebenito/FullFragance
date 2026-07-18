const { Router } = require("express");
const userController = require("../controllers/userController");
const { requireAuth } = require("../middleware/authMiddleware");

const router = Router();

router.put("/me/city", requireAuth, userController.setCity);
router.get("/me/favorites", requireAuth, userController.getFavorites);
router.post("/me/favorites/:productId", requireAuth, userController.toggleFavorite);
router.post("/me/scent-quiz", requireAuth, userController.saveScentQuiz);
router.get("/me/recommendations", requireAuth, userController.getRecommendations);

module.exports = router;
