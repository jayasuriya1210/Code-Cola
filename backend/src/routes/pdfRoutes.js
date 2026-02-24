const router = require("express").Router();
const controller = require("../controllers/pdfController");
const auth = require("../middleware/auth");

router.post("/upload", auth, controller.uploadPDF);

module.exports = router;
