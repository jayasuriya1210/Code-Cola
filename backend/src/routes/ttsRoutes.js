const router = require("express").Router();
const controller = require("../controllers/ttsController");
const auth = require("../middleware/auth");

router.post("/generate", auth, controller.textToAudio);
router.get("/proxy", controller.proxyAudio);
router.get("/health", controller.health);

module.exports = router;
