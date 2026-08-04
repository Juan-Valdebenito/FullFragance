const { Router } = require("express");
const userController = require("../controllers/userController");
const { requireAuth } = require("../middleware/authMiddleware");

const router = Router();

router.put("/me/profile", requireAuth, userController.updateProfile);
router.put("/me/password", requireAuth, userController.changePassword);
router.delete("/me", requireAuth, userController.deleteAccount);
router.get("/me/favorites", requireAuth, userController.getFavorites);
router.post("/me/favorites/:productId", requireAuth, userController.toggleFavorite);
router.post("/me/scent-quiz", requireAuth, userController.saveScentQuiz);
router.get("/me/recommendations", requireAuth, userController.getRecommendations);

module.exports = router;
