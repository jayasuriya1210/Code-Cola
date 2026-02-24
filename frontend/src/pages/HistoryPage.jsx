import { useEffect, useState } from "react";
import API from "../services/api";
import AppShell from "../components/AppShell";

export default function HistoryPage() {
    const [data, setData] = useState([]);
    const [cases, setCases] = useState([]);

    useEffect(() => {
        async function load() {
            try {
              const [historyRes, casesRes] = await Promise.all([
                API.get("/history/list"),
                API.get("/cases/list"),
              ]);
              setData(historyRes.data || []);
              setCases(casesRes.data || []);
            } catch {
              alert("Failed to load history");
            }
        }
        load();
    }, []);

    return (
      <AppShell title="History" subtitle="Review listening sessions and saved case artifacts anytime.">
        <h3>Listening History</h3>
        <div className="list">
          {data.map((h, i) => (
            <article key={`${h.id}-${i}`} className="list-item">
              <h4>{h.case_title || h.case_db_title || "Untitled case"}</h4>
              <p>{h.listened_at} | Language: {h.language || "en"}</p>
            </article>
          ))}
        </div>

        <hr className="divider" />
        <h3>Saved Case Records</h3>
        <div className="list">
          {cases.map((c) => (
            <article key={c.id} className="list-item">
              <h4>{c.title || `Case #${c.id}`}</h4>
              <p>{c.full_summary ? "Summary saved" : "No summary yet"}</p>
              <div className="row">
                {c.audio_url ? <a href={c.audio_url} target="_blank" rel="noreferrer">Open Audio</a> : <span className="muted">No audio</span>}
                {c.notes_path ? (
                  <a href={`http://localhost:5000/${c.notes_path.replace(/^\.\//, "")}`} target="_blank" rel="noreferrer">Download Notes PDF</a>
                ) : <span className="muted">No notes</span>}
              </div>
            </article>
          ))}
        </div>
      </AppShell>
    );
}
