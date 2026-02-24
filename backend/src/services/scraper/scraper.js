const axios = require("axios");

async function scrapeCases(query) {
  const token =
    process.env.COURTLISTENER_API_KEY ||
    process.env.COURTLISTENER_API_TOKEN;

  // -------------------------------
  // 1. AUTHENTICATED SEARCH (v4 API)
  // -------------------------------
  if (token) {
    try {
      const url = "https://www.courtlistener.com/api/rest/v4/opinions/";

      const res = await axios.get(url, {
        timeout: 20000,
        params: {
          search: query,
          page_size: 20,        // fetch more results
          cluster__docket__court: undefined,
        },
        headers: {
          Authorization: `Token ${token}`,
        },
      });

      const results = res.data.results || [];

      return results.map((op) => ({
        title: op.case_name || "Untitled Case",
        link: op.absolute_url
          ? `https://www.courtlistener.com${op.absolute_url}`
          : null,
        pdf: op.download_url || op.local_path || null,
        dateFiled: op.date_filed || null,
        court: op.court || op.court_citation_string || null,
      }));
    } catch (err) {
      console.log("CourtListener AUTH v4 error:", err.message);
    }
  }

  // --------------------------------------
  // 2. PUBLIC FALLBACK SEARCH (No API Key)
  // --------------------------------------
  try {
    const url = "https://www.courtlistener.com/api/rest/v4/search/";

    const res = await axios.get(url, {
      timeout: 20000,
      params: {
        q: query,
        type: "o", // search opinions
        page_size: 20,
      },
    });

    const results = res.data.results || [];

    return results.map((row) => ({
      title: row.caseName || row.caseNameFull || "Untitled Case",
      link: row.absolute_url
        ? `https://www.courtlistener.com${row.absolute_url}`
        : null,
      pdf: null, // public fallback doesn't give PDF links
      dateFiled: row.dateFiled || null,
      court: row.court_citation_string || null,
    }));
  } catch (err) {
    console.log("CourtListener PUBLIC fallback error:", err.message);
    return [];
  }
}

module.exports = { scrapeCases };