import { useEffect, useState } from "react";
import API from "../services/api";
import { useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell";

export default function SummaryPage() {
    const nav = useNavigate();
    const rawText = localStorage.getItem("rawText");
    const caseId = localStorage.getItem("caseId");
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [summaryId, setSummaryId] = useState(localStorage.getItem("summaryId") || "");

    useEffect(() => {
        async function load() {
            if (!rawText || !caseId) return;
            setLoading(true);
            setError("");
            try {
              const res = await API.post("/summary/generate", { text: rawText, case_id: caseId });
              setSummary(res.data.summary);
              setSummaryId(String(res.data.summaryId));
              localStorage.setItem("summary", JSON.stringify(res.data.summary));
              localStorage.setItem("summaryId", String(res.data.summaryId));
            } catch (err) {
              setError(err?.response?.data?.msg || "Summary generation failed.");
            } finally {
              setLoading(false);
            }
        }
        load();
    }, [rawText, caseId]);

    return (
      <AppShell title="Structured Summary" subtitle="AI-generated summary with legal reasoning and final outcome.">
        {loading ? <p className="status info">Generating summary...</p> : null}
        {error ? <p className="status warn">{error}</p> : null}

        {summary ? (
          <div className="summary-grid">
            <section className="summary-block">
              <h4>Case Background</h4>
              <p>{summary.background || "Not available"}</p>
            </section>
            <section className="summary-block">
              <h4>Legal Issues</h4>
              <p>{summary.legalIssues || "Not available"}</p>
            </section>
            <section className="summary-block">
              <h4>Arguments</h4>
              <p>{summary.arguments || "Not available"}</p>
            </section>
            <section className="summary-block">
              <h4>Court Reasoning</h4>
              <p>{summary.courtReasoning || "Not available"}</p>
            </section>
            <section className="summary-block">
              <h4>Judgment Outcome</h4>
              <p>{summary.judgmentOutcome || "Not available"}</p>
            </section>
          </div>
        ) : null}

        <hr className="divider" />
        <div className="actions-end">
          <button className="btn btn-primary" onClick={() => nav("/audio")} disabled={!summary || !summaryId}>
            Convert to Audio
          </button>
        </div>
      </AppShell>
    );
}
