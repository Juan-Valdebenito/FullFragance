const { Router } = require("express");
const userController = require("../controllers/userController");
const { requireAuth } = require("../middleware/authMiddleware");

const router = Router();

router.put("/me/city", requireAuth, userController.setCity);

module.exports = router;
