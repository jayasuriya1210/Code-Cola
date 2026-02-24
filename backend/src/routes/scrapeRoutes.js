const router = require("express").Router();
const controller = require("../controllers/scrapeController");
const auth = require("../middleware/auth");

router.post("/search", auth, controller.searchCases);

module.exports = router;
