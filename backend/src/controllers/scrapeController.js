const { scrapeCases } = require("../services/scraper/scraper");
const { buildSearchTerms } = require("../services/ai/searchTerms");
const Case = require("../models/caseModel");

exports.searchCases = async (req, res) => {
  try {
    const { query } = req.body;
    if (!query || !query.trim()) {
      return res.status(400).json({ msg: "query is required" });
    }

    const aiQuery = await buildSearchTerms(query);
    const scrapedPayload = await scrapeCases(aiQuery.optimized);
    const scraped = Array.isArray(scrapedPayload) ? scrapedPayload : (scrapedPayload.results || []);
    const user_id = req.user.id;
    const courtlistenerApiKeyConfigured = Boolean(
      process.env.COURTLISTENER_API_KEY || process.env.COURTLISTENER_API_TOKEN
    );

    const results = await Promise.all(
      scraped.slice(0, 25).map(async (item) => {
        const caseId = await Case.createFromSearch({
          user_id,
          title: item.title,
          source_url: item.link,
          pdf_url: item.pdf,
        });

        return { ...item, caseId };
      })
    );

    return res.json({
      query,
      optimizedQuery: aiQuery.optimized,
      provider: scrapedPayload.provider || "scraper",
      courtlistenerApiKeyConfigured,
      pdfLinksGuaranteed: Boolean(
        scrapedPayload.pdfLinksGuaranteed || results.some((item) => Boolean(item.pdf))
      ),
      results,
    });
  } catch (error) {
    return res.status(500).json({ msg: "Search failed" });
  }
};
