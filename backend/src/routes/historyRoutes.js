const router = require("express").Router();
const controller = require("../controllers/historyController");
const auth = require("../middleware/auth");

router.post("/add", auth, controller.addHistory);
router.get("/list", auth, controller.getHistory);
router.delete("/clear", auth, controller.clearAllHistory);
router.delete("/:caseId/audio", auth, controller.deleteCaseAudio);
router.delete("/:caseId", auth, controller.deleteCaseRecord);

module.exports = router;
