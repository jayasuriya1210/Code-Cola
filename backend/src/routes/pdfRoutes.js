const router = require("express").Router();
const controller = require("../controllers/pdfController");
const auth = require("../middleware/auth");

router.post("/upload", auth, controller.uploadPDF);
router.get("/:caseId/file", auth, controller.getStoredPdf);

module.exports = router;
