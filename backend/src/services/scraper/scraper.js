const axios = require("axios");

function toAbsoluteCourtListenerUrl(url) {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith("/")) return `https://www.courtlistener.com${url}`;
  return `https://www.courtlistener.com/${url}`;
}

function normalizeCaseRow(row) {
  return {
    title: row.title || "Untitled Case",
    link: toAbsoluteCourtListenerUrl(row.link),
    pdf: toAbsoluteCourtListenerUrl(row.pdf),
    dateFiled: row.dateFiled || null,
    court: row.court || null,
  };
}

async function scrapeCasesViaApi(query) {
  const token = process.env.COURTLISTENER_API_KEY || process.env.COURTLISTENER_API_TOKEN;

  if (token) {
    try {
      const res = await axios.get("https://www.courtlistener.com/api/rest/v4/search/", {
        timeout: 20000,
        params: { q: query, type: "o", page_size: 20 },
        headers: { Authorization: `Token ${token}` },
      });

      const results = (res.data.results || []).map((row) => {
        const opinions = Array.isArray(row.opinions) ? row.opinions : [];
        const firstPdf = opinions.find((op) => op && (op.download_url || op.local_path)) || null;
        return normalizeCaseRow({
          title: row.caseName || row.caseNameFull,
          link: row.absolute_url,
          pdf: firstPdf ? (firstPdf.download_url || firstPdf.local_path) : null,
          dateFiled: row.dateFiled,
          court: row.court_citation_string,
        });
      });

      return {
        provider: "courtlistener-auth-api",
        pdfLinksGuaranteed: results.some((item) => Boolean(item.pdf)),
        results,
      };
    } catch (_error) {
      // fall through to public API
    }
  }

  try {
    const res = await axios.get("https://www.courtlistener.com/api/rest/v4/search/", {
      timeout: 20000,
      params: { q: query, type: "o", page_size: 20 },
    });

    const results = (res.data.results || []).map((row) => normalizeCaseRow({
      title: row.caseName || row.caseNameFull,
      link: row.absolute_url,
      pdf: null,
      dateFiled: row.dateFiled,
      court: row.court_citation_string,
    }));

    return {
      provider: "courtlistener-public-api",
      pdfLinksGuaranteed: false,
      results,
    };
  } catch (_error) {
    return {
      provider: "courtlistener-api-failed",
      pdfLinksGuaranteed: false,
      results: [],
    };
  }
}

async function loadPlaywrightChromium() {
  try {
    const { chromium } = require("playwright");
    return chromium;
  } catch (_error) {
    return null;
  }
}

async function enrichPdfLinks(browser, items, timeoutMs, maxEnrichCount) {
  const targets = items.filter((r) => !r.pdf && r.link).slice(0, maxEnrichCount);
  if (!targets.length) return;

  for (const item of targets) {
    const page = await browser.newPage();
    try {
      await page.goto(item.link, { waitUntil: "domcontentloaded", timeout: timeoutMs });
      const pdf = await page.evaluate(() => {
        const candidates = [
          "a[href$='.pdf']",
          "a[href*='/pdf/']",
          "a[href*='download']",
          "a[title*='PDF']",
          "a[href*='/opinion/'][href*='.pdf']",
        ];
        for (const selector of candidates) {
          const el = document.querySelector(selector);
          if (el && el.href) return el.href;
        }
        return null;
      });
      if (pdf) item.pdf = toAbsoluteCourtListenerUrl(pdf);
    } catch (_error) {
      // ignore per-item failures
    } finally {
      await page.close();
    }
  }
}

async function scrapeCasesViaPlaywright(query) {
  const chromium = await loadPlaywrightChromium();
  if (!chromium) {
    return {
      provider: "playwright-unavailable",
      pdfLinksGuaranteed: false,
      results: [],
    };
  }

  const timeoutMs = Number(process.env.PLAYWRIGHT_TIMEOUT_MS || 18000);
  const maxResults = Number(process.env.PLAYWRIGHT_MAX_RESULTS || 20);
  const maxEnrichCount = Number(process.env.PLAYWRIGHT_ENRICH_PDF_COUNT || 6);
  const headless = process.env.PLAYWRIGHT_HEADLESS !== "false";

  const browser = await chromium.launch({ headless });
  try {
    const page = await browser.newPage({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    });

    const searchUrl = `https://www.courtlistener.com/?q=${encodeURIComponent(query)}&type=o`;
    await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: timeoutMs });
    await page.waitForTimeout(900);

    const results = await page.evaluate((limit) => {
      const cards = Array.from(document.querySelectorAll("article, .search-result, .result, li")).slice(0, 220);
      const rows = [];

      for (const card of cards) {
        const anchor =
          card.querySelector("h2 a, h3 a, h4 a, a[href*='/opinion/'], a[href*='/case/']") ||
          card.querySelector("a");
        if (!anchor || !anchor.href) continue;

        const href = anchor.href || "";
        if (!/\/opinion\/\d+/i.test(href)) continue;

        const title = (anchor.textContent || "").trim();
        if (!title || /search case law/i.test(title)) continue;
        const rawText = (card.textContent || "").replace(/\s+/g, " ").trim();
        const dateMatch = rawText.match(/\b(19|20)\d{2}-\d{2}-\d{2}\b/);
        const pdfAnchor =
          card.querySelector("a[href$='.pdf'], a[href*='/pdf/'], a[href*='download'], a[title*='PDF']") || null;

        rows.push({
          title: title || "Untitled Case",
          link: href,
          pdf: pdfAnchor ? pdfAnchor.href : null,
          dateFiled: dateMatch ? dateMatch[0] : null,
          court: rawText.slice(0, 160) || null,
        });
        if (rows.length >= limit) break;
      }

      return rows;
    }, maxResults);

    const normalized = results
      .map(normalizeCaseRow)
      .filter((r) => r.link && /\/opinion\/\d+/i.test(r.link));
    const deduped = [];
    const seen = new Set();
    for (const row of normalized) {
      if (seen.has(row.link)) continue;
      seen.add(row.link);
      deduped.push(row);
    }
    await enrichPdfLinks(browser, deduped, timeoutMs, maxEnrichCount);

    return {
      provider: "playwright-courtlistener",
      pdfLinksGuaranteed: deduped.some((r) => Boolean(r.pdf)),
      results: deduped,
    };
  } catch (error) {
    return {
      provider: `playwright-error:${error.name || "error"}`,
      pdfLinksGuaranteed: false,
      results: [],
    };
  } finally {
    await browser.close();
  }
}

async function scrapeCases(query) {
  const provider = String(process.env.SCRAPER_PROVIDER || "playwright").toLowerCase();
  const allowApiFallback = String(process.env.SCRAPER_ALLOW_API_FALLBACK || "false").toLowerCase() === "true";

  if (provider === "api") {
    return scrapeCasesViaApi(query);
  }

  const playwrightResult = await scrapeCasesViaPlaywright(query);
  if (playwrightResult.results.length) {
    return playwrightResult;
  }

  // Always recover with API fallback when Playwright runtime is unavailable or fails.
  if (String(playwrightResult.provider || "").startsWith("playwright-")) {
    const apiResult = await scrapeCasesViaApi(query);
    return {
      ...apiResult,
      provider: `${playwrightResult.provider}->${apiResult.provider}`,
    };
  }

  if (!allowApiFallback) {
    return {
      provider: playwrightResult.provider,
      pdfLinksGuaranteed: playwrightResult.pdfLinksGuaranteed,
      results: [],
    };
  }

  const apiResult = await scrapeCasesViaApi(query);
  return {
    ...apiResult,
    provider: `${playwrightResult.provider}->${apiResult.provider}`,
  };
}

module.exports = { scrapeCases };
