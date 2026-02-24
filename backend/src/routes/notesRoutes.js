const router = require("express").Router();
const controller = require("../controllers/notesController");
const auth = require("../middleware/auth");

router.post("/create", auth, controller.generateNotes);
router.get("/list", auth, controller.getMyNotes);

module.exports = router;
