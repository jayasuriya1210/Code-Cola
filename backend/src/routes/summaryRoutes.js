const router = require("express").Router();
const controller = require("../controllers/summaryController");
const auth = require("../middleware/auth");

router.post("/generate", auth, controller.summarize);
router.get("/:caseId/latest", auth, controller.getLatestSummary);

module.exports = router;
