const { Router } = require("express");
const priceController = require("../controllers/priceController");

const router = Router();

router.get("/products", priceController.listProducts);
router.get("/prices", priceController.comparePrices);
router.get("/prices/:productId", priceController.compareOneProduct);

module.exports = router;
