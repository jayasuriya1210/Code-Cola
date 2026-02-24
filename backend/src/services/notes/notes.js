const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

function createNotesPDF(content) {
    const dir = path.join(".", "notes", "pdf");
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    const filePath = path.join(dir, `${Date.now()}.pdf`);

    const doc = new PDFDocument();
    doc.pipe(fs.createWriteStream(filePath));

    doc.fontSize(14).text(content || "", 72, 72, { width: 460 });
    doc.end();

    return filePath;
}

module.exports = { createNotesPDF };
