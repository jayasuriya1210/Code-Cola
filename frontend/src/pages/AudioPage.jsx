import { useEffect, useState } from "react";
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
    const [audio, setAudio] = useState("");
    const [audioQueue, setAudioQueue] = useState([]);
    const [queueIndex, setQueueIndex] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        async function load() {
            if (!summaryObj || !caseId) return;
            setLoading(true);
            setError("");
            try {
              const res = await API.post("/tts/generate", {
                text: summaryObj.fullText || "",
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
              localStorage.setItem("audioURL", res.data.audioURL);
              localStorage.setItem("audioURLs", JSON.stringify(queue));
            } catch (err) {
              setError(err?.response?.data?.msg || "Audio generation failed.");
            } finally {
              setLoading(false);
            }
        }
        load();
    }, [summaryRaw, caseId, summaryId, caseTitle]);

    useEffect(() => {
      if (audioQueue.length && queueIndex < audioQueue.length) {
        setAudio(audioQueue[queueIndex]);
      }
    }, [queueIndex, audioQueue]);

    const onAudioEnded = () => {
      setQueueIndex((prev) => (prev + 1 < audioQueue.length ? prev + 1 : prev));
    };

    return (
      <AppShell title="Audio Playback" subtitle="Listen to the AI-generated case summary.">
        {loading ? <p className="status info">Generating audio...</p> : null}
        {error ? <p className="status warn">{error}</p> : null}
        {audioQueue.length > 1 ? <p className="status info">Playing part {queueIndex + 1} of {audioQueue.length}</p> : null}
        <div className="field">
          <label className="label">Audio player</label>
          <audio controls src={audio} style={{ width: "100%" }} onEnded={onAudioEnded} />
        </div>

        <div className="actions-end">
          <button className="btn btn-primary" onClick={() => nav("/notes")} disabled={!audio}>Write Notes</button>
        </div>
      </AppShell>
    );
}
