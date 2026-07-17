const { Router } = require("express");
const priceController = require("../controllers/priceController");
const { requireAuth } = require("../middleware/authMiddleware");

const router = Router();

router.get("/products", requireAuth, priceController.listProducts);
router.get("/prices", requireAuth, priceController.comparePrices);
router.get("/prices/:productId", requireAuth, priceController.compareOneProduct);

module.exports = router;
