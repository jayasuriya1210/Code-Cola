const router = require("express").Router();
const controller = require("../controllers/ttsController");
const auth = require("../middleware/auth");

router.post("/generate", auth, controller.textToAudio);

module.exports = router;
