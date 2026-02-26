import { useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell";

export default function Dashboard() {
    const nav = useNavigate();
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    return (
      <AppShell
        title="Workflow Dashboard"
        subtitle={user?.name ? `Welcome, ${user.name}` : "Case search, PDF intelligence, audio, and notes in one workflow"}
      >
        <div className="tile-grid">
          <div className="tile">
            <h3>1. Search Case Files</h3>
            <p>Search related cases, open/download source files, and pick a case for processing.</p>
            <button className="btn btn-primary" onClick={() => nav("/search")}>Search cases</button>
          </div>

          <div className="tile">
            <h3>2. Extract + Summarize</h3>
            <p>Upload or use source PDF, extract full content, and generate AI summary + audio.</p>
            <button className="btn btn-primary" onClick={() => nav("/upload")}>Upload PDF</button>
          </div>

          <div className="tile">
            <h3>3. Audio + History</h3>
            <p>Take listening notes, export PDF notes, and reopen or delete old case records.</p>
            <button className="btn btn-primary" onClick={() => nav("/history")}>Open history</button>
          </div>
        </div>
      </AppShell>
    );
}
