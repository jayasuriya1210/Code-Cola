import { useEffect, useMemo, useState } from "react";
import API from "../services/api";
import { useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell";

export default function SummaryPage() {
    const nav = useNavigate();
    const rawText = localStorage.getItem("rawText");
    const caseId = localStorage.getItem("caseId");
    const caseTitle = localStorage.getItem("caseTitle") || "";
    const [summary, setSummary] = useState(null);
    const [audio, setAudio] = useState(localStorage.getItem("audioURL") || "");
    const [ttsProvider, setTtsProvider] = useState(localStorage.getItem("ttsProvider") || "");
    const [audioQueue, setAudioQueue] = useState(() => {
      try {
        return JSON.parse(localStorage.getItem("audioURLs") || "[]");
      } catch {
        return [];
      }
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [summaryId, setSummaryId] = useState(localStorage.getItem("summaryId") || "");

    const previewText = useMemo(() => {
      if (!summary?.fullText) {
        return rawText ? rawText.slice(0, 2200) : "";
      }
      return summary.fullText.length > 2400
        ? `${summary.fullText.slice(0, 2400)}...`
        : summary.fullText;
    }, [summary?.fullText, rawText]);

    const resolvedAudioUrl = useMemo(() => {
      if (!audio) return "";
      if (audio.startsWith("http://") || audio.startsWith("https://")) return audio;
      return `http://localhost:5000${audio.startsWith("/") ? "" : "/"}${audio}`;
    }, [audio]);

    useEffect(() => {
        async function load() {
            if (!rawText || !caseId) return;
            setLoading(true);
            setError("");
            try {
              let res;
              try {
                res = await API.post("/workflow/realtime", {
                  text: rawText,
                  case_id: caseId,
                  lang: "en",
                  case_title: caseTitle,
                });
              } catch {
                res = await API.post("/summary/generate", {
                  text: rawText,
                  case_id: caseId,
                });
              }

              if (!res?.data?.summary) {
                throw new Error("Summary generation failed.");
              }

              if (!res.data.summaryId) {
                setSummary(res.data.summary);
                setSummaryId("");
                localStorage.setItem("summary", JSON.stringify(res.data.summary));
                localStorage.removeItem("summaryId");
                localStorage.removeItem("audioURL");
                localStorage.removeItem("audioURLs");
                return;
              }

              if (res.data.audioError) {
                setError(`Summary ready, but audio failed: ${res.data.audioError}`);
              }

              setSummary(res.data.summary);
              setSummaryId(String(res.data.summaryId));
              const queue = Array.isArray(res.data.audioURLs) && res.data.audioURLs.length
                ? res.data.audioURLs
                : [res.data.audioURL].filter(Boolean);
              setAudio(queue[0] || "");
              setAudioQueue(queue);
              setTtsProvider(res.data.ttsProvider || "");
              localStorage.setItem("summary", JSON.stringify(res.data.summary));
              localStorage.setItem("summaryId", String(res.data.summaryId));
              if (queue[0]) {
                localStorage.setItem("audioURL", queue[0]);
                localStorage.setItem("audioURLs", JSON.stringify(queue));
              }
              localStorage.setItem("ttsProvider", res.data.ttsProvider || "");
            } catch (err) {
              setError(err?.response?.data?.msg || err?.message || "Realtime workflow failed.");
            } finally {
              setLoading(false);
            }
        }
        load();
    }, [rawText, caseId, caseTitle]);

    return (
      <AppShell title="Structured Summary" subtitle="Realtime output: AI summary + generated audio in one workflow.">
        {loading ? <p className="status info">Generating summary and audio...</p> : null}
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
        <div className="summary-block">
          <h4>AI Summary Text From Full PDF Content</h4>
          <p>{previewText || "Processing extracted PDF text..."}</p>
          {summary?.fullText?.length > 2400 ? <p className="muted">Preview shown. Full text is saved in history for this case.</p> : null}
        </div>

        <hr className="divider" />
        <div className="field">
          <label className="label">Generated Audio</label>
          <audio controls src={resolvedAudioUrl || ""} style={{ width: "100%" }} />
          {ttsProvider ? <p className="muted">TTS engine: {ttsProvider}</p> : null}
          {audioQueue.length > 1 ? <p className="muted">Audio prepared in {audioQueue.length} parts for faster generation.</p> : null}
        </div>

        <hr className="divider" />
        <div className="actions-end">
          <button
            className="btn btn-primary"
            onClick={() => nav("/audio")}
            disabled={!audio && !summaryId}
          >
            Open Audio + Notes Workspace
          </button>
        </div>
      </AppShell>
    );
}
