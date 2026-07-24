const { Router } = require("express");
const catalogController = require("../controllers/catalogController");

const router = Router();

router.get("/notes", catalogController.listNotes);
router.get("/featured", catalogController.featuredProducts);

module.exports = router;
