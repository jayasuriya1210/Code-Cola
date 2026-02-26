import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import AppShell from "../components/AppShell";

const BACKEND_BASE = "http://localhost:5000";

function formatDate(value) {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function resolveUrl(url) {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${BACKEND_BASE}${url.startsWith("/") ? "" : "/"}${url}`;
}

export default function HistoryPage() {
  const nav = useNavigate();
  const [cases, setCases] = useState([]);
  const [selectedCaseId, setSelectedCaseId] = useState(null);
  const [selectedSummary, setSelectedSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [busyAction, setBusyAction] = useState("");

  const selected = useMemo(
    () => cases.find((row) => Number(row.case_id) === Number(selectedCaseId)) || null,
    [cases, selectedCaseId]
  );

  const refreshHistory = async (preferredCaseId) => {
    const res = await API.get("/history/list");
    const rows = res.data || [];
    setCases(rows);

    if (!rows.length) {
      setSelectedCaseId(null);
      return;
    }

    const next = rows.find((row) => Number(row.case_id) === Number(preferredCaseId)) || rows[0];
    setSelectedCaseId(next.case_id);
  };

  useEffect(() => {
    refreshHistory().catch(() => {
      alert("Failed to load history.");
    });
  }, []);

  useEffect(() => {
    async function loadSummary() {
      if (!selected?.case_id) {
        setSelectedSummary(null);
        return;
      }

      setSummaryLoading(true);
      try {
        const res = await API.get(`/summary/${selected.case_id}/latest`);
        setSelectedSummary(res.data || null);
      } catch {
        setSelectedSummary(null);
      } finally {
        setSummaryLoading(false);
      }
    }

    loadSummary();
  }, [selected?.case_id]);

  const openCaseFile = () => {
    if (!selected) return;
    const token = localStorage.getItem("token");
    const dbPdfUrl = selected.case_id
      ? `${BACKEND_BASE}/api/pdf/${selected.case_id}/file?token=${encodeURIComponent(token || "")}`
      : "";
    const url = dbPdfUrl || selected.pdf_url || selected.source_url || "";
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const downloadCaseFile = () => {
    if (!selected?.case_id) return;
    const token = localStorage.getItem("token");
    const url = `${BACKEND_BASE}/api/pdf/${selected.case_id}/file?download=1&token=${encodeURIComponent(token || "")}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const openAudioWorkspace = () => {
    if (!selected) return;
    localStorage.setItem("caseId", String(selected.case_id));
    localStorage.setItem("caseTitle", selected.case_title || "");
    if (selected.audio_url) {
      localStorage.setItem("audioURL", selected.audio_url);
    } else {
      localStorage.removeItem("audioURL");
    }
    try {
      const queue = JSON.parse(selected.audio_urls_json || "[]");
      localStorage.setItem("audioURLs", JSON.stringify(Array.isArray(queue) ? queue : []));
    } catch {
      localStorage.removeItem("audioURLs");
    }

    if (selectedSummary?.summary) {
      localStorage.setItem("summary", JSON.stringify(selectedSummary.summary));
      localStorage.setItem("summaryId", String(selectedSummary.id || ""));
    }

    nav("/audio");
  };

  const deleteCaseAudio = async () => {
    if (!selected?.case_id) return;
    setBusyAction("delete-audio");
    try {
      await API.delete(`/history/${selected.case_id}/audio`);
      await refreshHistory(selected.case_id);
    } catch {
      alert("Failed to delete audio.");
    } finally {
      setBusyAction("");
    }
  };

  const deleteCaseRecord = async () => {
    if (!selected?.case_id) return;
    const proceed = window.confirm("Delete this case from history with its audio, notes, and summary files?");
    if (!proceed) return;

    setBusyAction("delete-case");
    try {
      await API.delete(`/history/${selected.case_id}`);
      await refreshHistory();
    } catch {
      alert("Failed to delete case record.");
    } finally {
      setBusyAction("");
    }
  };

  const clearAllHistory = async () => {
    const proceed = window.confirm("Delete all history files (cases, audio, notes, and summaries)?");
    if (!proceed) return;

    setBusyAction("clear-all");
    try {
      await API.delete("/history/clear");
      await refreshHistory();
    } catch {
      alert("Failed to clear all history.");
    } finally {
      setBusyAction("");
    }
  };

  const notesUrl = selected?.notes_path ? resolveUrl(`/${selected.notes_path.replace(/^\.\//, "")}`) : "";
  const audioUrl = selected?.audio_url ? resolveUrl(selected.audio_url) : "";
  const summaryPreview = selectedSummary?.summary?.fullText
    ? selectedSummary.summary.fullText.slice(0, 1500)
    : "";

  return (
    <AppShell
      title="History Library"
      subtitle="Cases you searched and processed. Open files anytime, play audio, open notes, or delete records."
      actions={
        <button className="btn btn-danger" onClick={clearAllHistory} disabled={busyAction === "clear-all"}>
          {busyAction === "clear-all" ? "Deleting..." : "Clear All History Files"}
        </button>
      }
    >
      <div className="history-layout">
        <section className="history-panel">
          <h3>Saved Case Files</h3>
          <div className="list">
            {cases.map((row) => (
              <article
                key={row.case_id}
                className={`list-item clickable ${Number(row.case_id) === Number(selectedCaseId) ? "active-item" : ""}`}
                onClick={() => setSelectedCaseId(row.case_id)}
              >
                <h4>{row.case_title || "Untitled case"}</h4>
                <p>Last activity: {formatDate(row.listened_at || row.uploaded_at)}</p>
              </article>
            ))}
            {!cases.length ? <p className="muted">No case history found.</p> : null}
          </div>
        </section>

        <section className="history-panel">
          <h3>Case Actions</h3>
          {!selected ? (
            <p className="muted">Select a case file to view available actions.</p>
          ) : (
            <div className="list-item">
              <h4>{selected.case_title || "Untitled case"}</h4>
              <p>Uploaded: {formatDate(selected.uploaded_at)}</p>
              <p>Last listened: {formatDate(selected.listened_at)}</p>

              <div className="row">
                <button className="btn btn-secondary" onClick={openCaseFile}>
                  Open Case File
                </button>
                <button className="btn btn-secondary" onClick={downloadCaseFile}>
                  Download Case PDF
                </button>
                <button className="btn btn-primary" onClick={openAudioWorkspace}>
                  Open Audio
                </button>
                <a
                  className={`btn btn-secondary ${notesUrl ? "" : "btn-disabled"}`}
                  href={notesUrl || undefined}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => {
                    if (!notesUrl) e.preventDefault();
                  }}
                >
                  Open Notes
                </a>
              </div>

              {audioUrl ? (
                <div className="field">
                  <label className="label">Latest Audio</label>
                  <audio controls src={audioUrl} style={{ width: "100%" }} />
                </div>
              ) : (
                <p className="muted">Audio not generated yet for this case.</p>
              )}

              <div className="row">
                <button className="btn btn-danger" onClick={deleteCaseAudio} disabled={busyAction === "delete-audio"}>
                  {busyAction === "delete-audio" ? "Deleting..." : "Delete Audio"}
                </button>
                <button className="btn btn-danger" onClick={deleteCaseRecord} disabled={busyAction === "delete-case"}>
                  {busyAction === "delete-case" ? "Deleting..." : "Delete Case Record"}
                </button>
              </div>

              <hr className="divider" />
              <label className="label">Summary Text</label>
              {summaryLoading ? <p className="muted">Loading summary...</p> : null}
              {!summaryLoading && summaryPreview ? <p>{summaryPreview}</p> : null}
              {!summaryLoading && !summaryPreview ? <p className="muted">Summary not available.</p> : null}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
