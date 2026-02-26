import { useState } from "react";
import API from "../services/api";
import { useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell";

export default function UploadPDF() {
    const nav = useNavigate();
    const [pdf, setPdf] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const caseId = localStorage.getItem("caseId");
    const caseTitle = localStorage.getItem("caseTitle");
    const casePdfUrl = localStorage.getItem("casePdfUrl");

    const extractCaseText = async () => {
        setError("");
        setLoading(true);

        try {
            let res;

            if (pdf) {
              const form = new FormData();
              form.append("pdfFile", pdf);
              if (caseId) form.append("case_id", caseId);
              res = await API.post("/pdf/upload", form);
            } else if (casePdfUrl) {
              res = await API.post("/pdf/upload", { case_id: caseId, pdf_url: casePdfUrl });
            } else {
              setError("Please choose a PDF file first (or select a case that provides a PDF link).");
              return;
            }

            if (!res.data.text || !res.data.text.trim()) {
              setError("Upload succeeded but no readable text was extracted. The PDF may be scanned/image-only.");
              return;
            }
            localStorage.setItem("rawText", res.data.text || "");
            localStorage.setItem("caseId", String(res.data.caseId));
            nav("/summary");
        } catch (err) {
            setError(err?.response?.data?.msg || "Upload failed. Please try another PDF.");
        } finally {
            setLoading(false);
        }
    };

    const openRemotePdf = () => {
        if (casePdfUrl) window.open(casePdfUrl, "_blank", "noopener,noreferrer");
    };

    return (
      <AppShell
        title="Case PDF Intake"
        subtitle="Use selected case PDF, or upload your own file, to extract complete text for AI summary and audio generation."
        actions={casePdfUrl ? <button className="btn btn-secondary" onClick={openRemotePdf}>Open selected source PDF</button> : null}
      >
        {caseTitle ? <p className="status info"><b>Selected case:</b> {caseTitle}</p> : null}
        {error ? <p className="status warn">{error}</p> : null}

        <div className="field">
          <label className="label">PDF file</label>
          <input className="file-input" type="file" accept="application/pdf" onChange={e => setPdf(e.target.files[0])} />
        </div>

        <div className="actions-end">
          <button className="btn btn-primary" onClick={extractCaseText} disabled={loading}>
            {loading ? "Extracting..." : "Extract Text"}
          </button>
        </div>
      </AppShell>
    );
}
