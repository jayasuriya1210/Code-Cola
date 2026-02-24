const fs = require("fs");
const { PDFParse } = require("pdf-parse");

async function extractText(filePath) {
  try {
    const pdfData = fs.readFileSync(filePath);
    if (!PDFParse) {
      throw new Error("PDF parser dependency is not available.");
    }

    const parser = new PDFParse({ data: pdfData });
    const parsed = await parser.getText();
    await parser.destroy();

    return (parsed?.text || "").trim();
  } catch (error) {
    const raw = String(error?.message || error);

    if (raw.toLowerCase().includes("password") || raw.toLowerCase().includes("encrypted")) {
      throw new Error("PDF is encrypted/password-protected. Please upload an unlocked PDF.");
    }

    throw new Error(`Could not extract text from this PDF. ${raw}`);
  }
}

module.exports = { extractText };
