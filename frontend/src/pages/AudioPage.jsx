import { useEffect, useMemo, useState } from "react";
import API from "../services/api";
import { useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell";

export default function AudioPage() {
    const nav = useNavigate();
    const summaryRaw = localStorage.getItem("summary");
    const summaryId = localStorage.getItem("summaryId");
    const caseId = localStorage.getItem("caseId");
    const caseTitle = localStorage.getItem("caseTitle");
    let summaryObj = null;
    try {
      summaryObj = summaryRaw ? JSON.parse(summaryRaw) : null;
    } catch {
      summaryObj = null;
    }
    const [audio, setAudio] = useState(localStorage.getItem("audioURL") || "");
    const [audioQueue, setAudioQueue] = useState(() => {
      try {
        return JSON.parse(localStorage.getItem("audioURLs") || "[]");
      } catch {
        return [];
      }
    });
    const [ttsProvider, setTtsProvider] = useState(localStorage.getItem("ttsProvider") || "");
    const [queueIndex, setQueueIndex] = useState(0);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [notesText, setNotesText] = useState(localStorage.getItem("notesDraft") || "");
    const [notesPdfPath, setNotesPdfPath] = useState("");
    const [error, setError] = useState("");

    const resolvedAudioUrl = useMemo(() => {
      if (!audio) return "";
      if (audio.startsWith("http://") || audio.startsWith("https://")) return audio;
      return `http://localhost:5000${audio.startsWith("/") ? "" : "/"}${audio}`;
    }, [audio]);

    useEffect(() => {
        async function load() {
            if (audio) return;
            if (!summaryObj || !caseId) return;
            setLoading(true);
            setError("");
            try {
              const ttsText = summaryObj.audioText || summaryObj.background || summaryObj.fullText || "";
              const res = await API.post("/tts/generate", {
                text: ttsText,
                lang: "en",
                case_id: caseId,
                summary_id: summaryId,
                case_title: caseTitle || "",
              });
              const queue = Array.isArray(res.data.audioURLs) && res.data.audioURLs.length
                ? res.data.audioURLs
                : [res.data.audioURL].filter(Boolean);
              setAudioQueue(queue);
              setQueueIndex(0);
              setAudio(queue[0] || "");
              setTtsProvider(res.data.ttsProvider || "");
              localStorage.setItem("audioURL", queue[0] || "");
              localStorage.setItem("audioURLs", JSON.stringify(queue));
              localStorage.setItem("ttsProvider", res.data.ttsProvider || "");
            } catch (err) {
              setError(err?.response?.data?.msg || "Audio generation failed.");
            } finally {
              setLoading(false);
            }
        }
        load();
    }, [audio, summaryRaw, caseId, summaryId, caseTitle]);

    useEffect(() => {
      if (!audioQueue.length) return;
      setAudio(audioQueue[queueIndex] || audioQueue[0]);
    }, [audioQueue, queueIndex]);

    const saveNotes = async () => {
      if (!notesText.trim() || !caseId) return;
      setSaving(true);
      try {
        const res = await API.post("/notes/create", {
          text: notesText,
          case_id: caseId,
        });
        setNotesPdfPath(res.data.pdfPath || "");
        localStorage.removeItem("notesDraft");
      } catch {
        alert("Failed to export notes PDF.");
      } finally {
        setSaving(false);
      }
    };

    const onNotesChange = (value) => {
      setNotesText(value);
      localStorage.setItem("notesDraft", value);
    };

    const onEnded = () => {
      if (!audioQueue.length) return;
      setQueueIndex((prev) => (prev + 1 < audioQueue.length ? prev + 1 : prev));
    };

    return (
      <AppShell title="Audio + Notes Workspace" subtitle="Listen to case audio, take notes, and export notes to PDF.">
        {loading ? <p className="status info">Generating audio...</p> : null}
        {error ? <p className="status warn">{error}</p> : null}
        {audioQueue.length > 1 ? <p className="status info">Playing audio part {queueIndex + 1} of {audioQueue.length}</p> : null}
        {ttsProvider ? <p className="status info">TTS engine: {ttsProvider}</p> : null}
        <div className="field">
          <label className="label">Audio player</label>
          <audio controls src={resolvedAudioUrl} style={{ width: "100%" }} onEnded={onEnded} />
          {resolvedAudioUrl ? (
            <div className="row">
              <a href={resolvedAudioUrl} target="_blank" rel="noreferrer">Open audio</a>
              <a href={resolvedAudioUrl} download>Download audio</a>
            </div>
          ) : null}
        </div>

        <div className="field">
          <label className="label">Case notes while listening</label>
          <textarea
            className="textarea"
            value={notesText}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder="Write notes while listening to the case audio..."
          />
        </div>

        {notesPdfPath ? (
          <p className="status info">
            Notes PDF ready:{" "}
            <a href={`http://localhost:5000/${notesPdfPath.replace(/^\.\//, "")}`} target="_blank" rel="noreferrer">
              Open notes PDF
            </a>
          </p>
        ) : null}

        <div className="actions-end">
          <button className="btn btn-primary" onClick={saveNotes} disabled={saving || !notesText.trim() || !caseId}>
            {saving ? "Exporting..." : "Export Notes PDF"}
          </button>
          <button className="btn btn-secondary" onClick={() => nav("/history")}>Open History</button>
        </div>
      </AppShell>
    );
}
