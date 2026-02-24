const { callLLM } = require("./llm");

const LEGAL_HINTS = [
  "judgment",
  "opinion",
  "court",
  "appellate",
  "supreme court",
  "legal precedent",
];

function normalizeQuery(text) {
  return (text || "")
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function fallbackSearchTerms(query) {
  const normalized = normalizeQuery(query);
  if (!normalized) {
    return { original: query || "", optimized: "", terms: [] };
  }

  const baseTerms = normalized.split(" ").filter(Boolean);
  const enriched = [...new Set([...baseTerms, ...LEGAL_HINTS])];
  const optimized = enriched.join(" ");

  return {
    original: query,
    optimized,
    terms: enriched,
  };
}

async function buildSearchTerms(query) {
  const fallback = fallbackSearchTerms(query);
  if (!query || !query.trim()) return fallback;

  try {
    const content = await callLLM({
      system:
        "You optimize legal case search queries. Return strict JSON with keys optimized and terms (array of strings).",
      user: `User query: "${query}". Create concise legal search terms for public case-law websites.`,
      responseFormat: "json",
      maxTokens: 180,
    });

    if (!content) return fallback;
    const parsed = JSON.parse(content);
    const optimized = String(parsed.optimized || "").trim();
    const terms = Array.isArray(parsed.terms) ? parsed.terms.map((t) => String(t).trim()).filter(Boolean) : [];

    if (!optimized) return fallback;
    return {
      original: query,
      optimized,
      terms: terms.length ? terms : optimized.split(" "),
    };
  } catch (error) {
    return fallback;
  }
}

module.exports = { buildSearchTerms };
