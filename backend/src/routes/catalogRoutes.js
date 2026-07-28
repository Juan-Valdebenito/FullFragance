const { Router } = require("express");
const catalogController = require("../controllers/catalogController");

const router = Router();

router.get("/notes", catalogController.listNotes);
router.get("/featured", catalogController.featuredProducts);
router.get("/deal-of-day", catalogController.dealOfDay);

module.exports = router;
