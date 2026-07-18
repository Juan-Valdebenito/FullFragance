const { Router } = require("express");
const catalogController = require("../controllers/catalogController");
const { requireAuth } = require("../middleware/authMiddleware");

const router = Router();

router.get("/notes", requireAuth, catalogController.listNotes);

module.exports = router;
