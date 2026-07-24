const { Router } = require("express");
const storeController = require("../controllers/storeController");

const router = Router();

router.get("/", storeController.listStores);

module.exports = router;
