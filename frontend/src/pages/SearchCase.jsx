import { useState } from "react";
import API from "../services/api";
import { useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell";

export default function SearchCase() {
    const nav = useNavigate();
    const [query, setQuery] = useState("");
    const [data, setData] = useState([]);
    const [optimizedQuery, setOptimizedQuery] = useState("");
    const [pdfModeInfo, setPdfModeInfo] = useState("");
    const [loading, setLoading] = useState(false);

    const search = async () => {
      if (!query.trim()) return;
      setLoading(true);
      try {
        const res = await API.post("/scrape/search", { query });
        setOptimizedQuery(res.data.optimizedQuery || "");
        setData(res.data.results || []);
        if (!res.data.pdfLinksGuaranteed) {
          setPdfModeInfo("CourtListener API key is not configured, so some PDF links may be unavailable. Case links still work.");
        } else {
          setPdfModeInfo("");
        }
      } catch {
        alert("Search failed. Please login again and retry.");
      } finally {
        setLoading(false);
      }
    };

    const useCase = (item) => {
      localStorage.setItem("caseId", String(item.caseId));
      localStorage.setItem("caseTitle", item.title || "");
      localStorage.setItem("casePdfUrl", item.pdf || "");
      localStorage.setItem("caseSourceUrl", item.link || "");
      nav("/upload");
    };

    return (
      <AppShell title="Search Cases" subtitle="Find case judgments from legal sources using AI-optimized query terms.">
        <div className="field">
          <label className="label">Case keyword</label>
          <div className="row">
            <input
              className="input"
              placeholder="Example: murder conviction appeal"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
            <button className="btn btn-primary" onClick={search} disabled={loading}>
              {loading ? "Searching..." : "Search"}
            </button>
          </div>
        </div>

        {optimizedQuery ? <p className="status info"><b>AI search terms:</b> {optimizedQuery}</p> : null}
        {pdfModeInfo ? <p className="status warn">{pdfModeInfo}</p> : null}

        <div className="list">
          {data.map((c) => (
            <article key={c.caseId} className="list-item">
              <h4>{c.title}</h4>
              <p>{c.court || "Court not specified"} {c.dateFiled ? `| ${c.dateFiled}` : ""}</p>
              <div className="row">
                {c.link ? <a href={c.link} target="_blank" rel="noreferrer">Open case page</a> : null}
                {c.pdf ? <a href={c.pdf} target="_blank" rel="noreferrer">Open/Download PDF</a> : <span className="muted">PDF not available</span>}
                <button className="btn btn-secondary" onClick={() => useCase(c)}>Use this case</button>
              </div>
            </article>
          ))}
        </div>
      </AppShell>
    );
}
