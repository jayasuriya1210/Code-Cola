import { useState } from "react";
import API from "../services/api";
import { useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell";

export default function NotesPage() {
    const nav = useNavigate();
    const [text, setText] = useState("");
    const [pdfPath, setPdfPath] = useState("");
    const [saving, setSaving] = useState(false);
    const audio = localStorage.getItem("audioURL");
    const caseId = localStorage.getItem("caseId");

    const saveNotes = async () => {
        if (!text.trim()) return;
        setSaving(true);
        try {
          const res = await API.post("/notes/create", { text, case_id: caseId });
          setPdfPath(res.data.pdfPath);
          alert("Notes saved and PDF exported");
        } catch {
          alert("Failed to save notes");
        } finally {
          setSaving(false);
        }
    };

    return (
      <AppShell title="Notes and Export" subtitle="Write observations while listening and export notes as PDF.">
        <div className="field">
          <label className="label">Audio player</label>
          <audio controls src={audio} style={{ width: "100%" }} />
        </div>

        <div className="field">
          <label className="label">Your legal notes</label>
          <textarea
            className="textarea"
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Write key points, important legal arguments, and observations..."
          />
        </div>

        {pdfPath ? (
          <p className="status info">
            Download:{" "}
            <a href={`http://localhost:5000/${pdfPath.replace(/^\.\//, "")}`} target="_blank" rel="noreferrer">
              Notes PDF
            </a>
          </p>
        ) : null}

        <div className="actions-end">
          <button className="btn btn-primary" onClick={saveNotes} disabled={saving}>
            {saving ? "Saving..." : "Export PDF"}
          </button>
          <button className="btn btn-secondary" onClick={() => nav("/history")}>View History</button>
        </div>
      </AppShell>
    );
}
