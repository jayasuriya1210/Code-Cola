const router = require("express").Router();
const controller = require("../controllers/historyController");
const auth = require("../middleware/auth");

router.post("/add", auth, controller.addHistory);
router.get("/list", auth, controller.getHistory);

module.exports = router;
