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
      let pdfBuffer = req.file ? fs.readFileSync(req.file.path) : null;
      let pdfName = req.file?.originalname || null;

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
        pdfBuffer = Buffer.from(response.data);
        pdfName = fileName;
        fs.writeFileSync(resolvedFilePath, pdfBuffer);
      }

      if (!resolvedFilePath) return res.status(400).json({ msg: "No file uploaded" });
      if (!pdfBuffer) pdfBuffer = fs.readFileSync(resolvedFilePath);

      const text = await extractText(resolvedFilePath);
      const caseId = await Case.saveUpload({
        case_id: req.body.case_id ? Number(req.body.case_id) : null,
        user_id: req.user.id,
        file_path: resolvedFilePath,
        pdf_blob: pdfBuffer,
        pdf_mime: "application/pdf",
        pdf_name: pdfName || path.basename(resolvedFilePath),
        extracted_text: text,
      });

      return res.json({ caseId, text, filePath: resolvedFilePath, pdfStored: true });
    } catch (error) {
      console.error("PDF upload failed:", error.message);
      return res.status(500).json({ msg: error.message || "PDF extraction failed" });
    }
  });
};

exports.getStoredPdf = async (req, res) => {
  try {
    const caseId = Number(req.params.caseId);
    if (!caseId) return res.status(400).json({ msg: "Valid caseId is required" });

    const row = await Case.getPdfByCaseId(caseId, req.user.id);
    if (!row) return res.status(404).json({ msg: "Case not found" });

    if (row.pdf_blob) {
      res.setHeader("Content-Type", row.pdf_mime || "application/pdf");
      const disposition = String(req.query?.download || "") === "1" ? "attachment" : "inline";
      res.setHeader(
        "Content-Disposition",
        `${disposition}; filename="${(row.pdf_name || `case-${caseId}.pdf`).replace(/"/g, "")}"`
      );
      return res.end(row.pdf_blob);
    }

    if (row.file_path && fs.existsSync(row.file_path)) {
      return res.sendFile(path.resolve(row.file_path));
    }

    return res.status(404).json({ msg: "Stored PDF not found for this case" });
  } catch (error) {
    return res.status(500).json({ msg: "Failed to load stored PDF" });
  }
};
