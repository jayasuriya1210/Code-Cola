const fs = require("fs");
const { PDFParse } = require("pdf-parse");

async function extractWithPdfParse(pdfData) {
  if (!PDFParse) return "";
  const parser = new PDFParse({ data: pdfData });
  try {
    const parsed = await parser.getText();
    return (parsed?.text || "").trim();
  } finally {
    await parser.destroy();
  }
}

async function extractWithPdfJs(pdfData) {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(pdfData),
    useSystemFonts: true,
    disableWorker: true,
  });

  const doc = await loadingTask.promise;
  const pageTexts = [];

  for (let page = 1; page <= doc.numPages; page += 1) {
    const p = await doc.getPage(page);
    const textContent = await p.getTextContent();
    const text = textContent.items
      .map((item) => (item && typeof item.str === "string" ? item.str : ""))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    if (text) pageTexts.push(text);
  }

  return pageTexts.join("\n\n").trim();
}

async function extractText(filePath) {
  try {
    const pdfData = fs.readFileSync(filePath);
    const parsedPrimary = await extractWithPdfParse(pdfData);
    if (parsedPrimary.length > 40) return parsedPrimary;

    const parsedSecondary = await extractWithPdfJs(pdfData);
    if (parsedSecondary.length > 40) return parsedSecondary;

    throw new Error("No readable text found. This PDF may be image-only/scanned.");
  } catch (error) {
    const raw = String(error?.message || error);

    if (raw.toLowerCase().includes("password") || raw.toLowerCase().includes("encrypted")) {
      throw new Error("PDF is encrypted/password-protected. Please upload an unlocked PDF.");
    }

    throw new Error(`Could not extract text from this PDF. ${raw}`);
  }
}

module.exports = { extractText };
