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
    const scraped = await scrapeCases(aiQuery.optimized);
    const user_id = req.user.id;

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
      provider: "courtlistener",
      pdfLinksGuaranteed: Boolean(
        process.env.COURTLISTENER_API_KEY || process.env.COURTLISTENER_API_TOKEN
      ),
      results,
    });
  } catch (error) {
    return res.status(500).json({ msg: "Search failed" });
  }
};
