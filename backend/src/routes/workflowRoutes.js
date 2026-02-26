const router = require("express").Router();
const controller = require("../controllers/workflowController");
const auth = require("../middleware/auth");

router.post("/realtime", auth, controller.generateRealtime);

module.exports = router;

