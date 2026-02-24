const router = require("express").Router();
const controller = require("../controllers/caseController");
const auth = require("../middleware/auth");

router.get("/list", auth, controller.listCases);
router.get("/:caseId", auth, controller.getCase);

module.exports = router;
