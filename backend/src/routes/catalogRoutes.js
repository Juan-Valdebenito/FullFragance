const { Router } = require("express");
const catalogController = require("../controllers/catalogController");

const router = Router();

router.get("/notes", catalogController.listNotes);
router.get("/search", catalogController.searchProducts);
router.get("/suggest", catalogController.suggest);
router.get("/ids", catalogController.productIds);
router.get("/stats", catalogController.stats);
router.get("/similar/:productId", catalogController.similarProducts);
router.get("/featured", catalogController.featuredProducts);
router.get("/deals-of-day", catalogController.dealsOfDay);
router.get("/deal-of-day", catalogController.dealOfDay);

module.exports = router;
