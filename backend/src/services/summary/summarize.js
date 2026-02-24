const { callLLM } = require("../ai/llm");

function pickChunk(text, start, end) {
  const words = (text || "").replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  return words.slice(start, end).join(" ");
}

function fallbackSummary(text) {
  const source = (text || "").replace(/\s+/g, " ").trim();

  if (!source) {
    return {
      background: "",
      legalIssues: "",
      arguments: "",
      courtReasoning: "",
      judgmentOutcome: "",
      fullText: "",
    };
  }

  const background = pickChunk(source, 0, 120);
  const legalIssues = pickChunk(source, 120, 230);
  const arguments = pickChunk(source, 230, 360);
  const courtReasoning = pickChunk(source, 360, 510);
  const judgmentOutcome = pickChunk(source, 510, 620);

  const fullText = [
    `Case background: ${background}`,
    `Legal issues: ${legalIssues}`,
    `Arguments: ${arguments}`,
    `Court reasoning: ${courtReasoning}`,
    `Judgment outcome: ${judgmentOutcome}`,
  ].join("\n\n");

  return {
    background,
    legalIssues,
    arguments,
    courtReasoning,
    judgmentOutcome,
    fullText,
  };
}

async function summarizeText(text) {
  const fallback = fallbackSummary(text);
  const cleanText = (text || "").replace(/\s+/g, " ").trim();
  if (!cleanText) return fallback;

  try {
    const content = await callLLM({
      system:
        "You summarize legal judgments into strict JSON with keys: background, legalIssues, arguments, courtReasoning, judgmentOutcome, fullText.",
      user: `Summarize this legal judgment text:\n${cleanText.slice(0, 12000)}`,
      responseFormat: "json",
      maxTokens: 700,
    });

    if (!content) return fallback;
    const parsed = JSON.parse(content);
    const background = String(parsed.background || "").trim();
    const legalIssues = String(parsed.legalIssues || "").trim();
    const argumentsText = String(parsed.arguments || "").trim();
    const courtReasoning = String(parsed.courtReasoning || "").trim();
    const judgmentOutcome = String(parsed.judgmentOutcome || "").trim();
    let fullText = String(parsed.fullText || "").trim();

    if (!fullText) {
      fullText = [
        `Case background: ${background}`,
        `Legal issues: ${legalIssues}`,
        `Arguments: ${argumentsText}`,
        `Court reasoning: ${courtReasoning}`,
        `Judgment outcome: ${judgmentOutcome}`,
      ]
        .filter((line) => line.split(": ")[1])
        .join("\n\n");
    }

    return {
      background,
      legalIssues,
      arguments: argumentsText,
      courtReasoning,
      judgmentOutcome,
      fullText: fullText || fallback.fullText,
    };
  } catch (error) {
    return fallback;
  }
}

module.exports = { summarizeText };
