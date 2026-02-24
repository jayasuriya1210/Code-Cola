const multer = require("multer");
const path = require("path");
const fs = require("fs");
const axios = require("axios");
const { extractText } = require("../services/pdf/pdfExtract");
const Case = require("../models/caseModel");

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const target = path.join(__dirname, "../../../uploads/pdf");
    fs.mkdirSync(target, { recursive: true });
    cb(null, target);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      cb(new Error("Only PDF files are allowed"));
      return;
    }
    cb(null, true);
  },
}).single("pdfFile");

exports.uploadPDF = (req, res) => {
  upload(req, res, async (err) => {
    try {
      if (err) return res.status(400).json({ msg: err.message || "Upload error" });

      let resolvedFilePath = req.file?.path;

      // Support extracting directly from selected case PDF URL when local file is not chosen.
      if (!resolvedFilePath && req.body?.pdf_url) {
        const pdfUrl = String(req.body.pdf_url).trim();
        if (!/^https?:\/\//i.test(pdfUrl)) {
          return res.status(400).json({ msg: "Invalid pdf_url" });
        }

        const response = await axios.get(pdfUrl, {
          responseType: "arraybuffer",
          timeout: 25000,
        });

        const contentType = (response.headers["content-type"] || "").toLowerCase();
        if (!contentType.includes("pdf")) {
          return res.status(400).json({ msg: "Provided URL did not return a PDF file." });
        }

        const fileName = `${Date.now()}-remote.pdf`;
        resolvedFilePath = path.join(__dirname, "../../../uploads/pdf", fileName);
        fs.writeFileSync(resolvedFilePath, Buffer.from(response.data));
      }

      if (!resolvedFilePath) return res.status(400).json({ msg: "No file uploaded" });

      const text = await extractText(resolvedFilePath);
      const caseId = await Case.saveUpload({
        case_id: req.body.case_id ? Number(req.body.case_id) : null,
        user_id: req.user.id,
        file_path: resolvedFilePath,
        extracted_text: text,
      });

      return res.json({ caseId, text, filePath: resolvedFilePath });
    } catch (error) {
      console.error("PDF upload failed:", error.message);
      return res.status(500).json({ msg: error.message || "PDF extraction failed" });
    }
  });
};
