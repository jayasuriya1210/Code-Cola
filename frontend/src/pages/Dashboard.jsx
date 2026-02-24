import { useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell";

export default function Dashboard() {
    const nav = useNavigate();
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    return (
      <AppShell
        title="Dashboard"
        subtitle={user?.name ? `Welcome, ${user.name}` : "Welcome to your legal intelligence workspace"}
      >
        <div className="tile-grid">
          <div className="tile">
            <h3>AI Case Search</h3>
            <p>Search legal judgments from web sources using optimized legal terms.</p>
            <button className="btn btn-primary" onClick={() => nav("/search")}>Search cases</button>
          </div>

          <div className="tile">
            <h3>Upload and Extract</h3>
            <p>Upload downloaded judgment PDFs and extract case text for analysis.</p>
            <button className="btn btn-primary" onClick={() => nav("/upload")}>Upload PDF</button>
          </div>

          <div className="tile">
            <h3>History and Exports</h3>
            <p>View past summaries, audio sessions, and exported notes PDFs.</p>
            <button className="btn btn-primary" onClick={() => nav("/history")}>Open history</button>
          </div>
        </div>
      </AppShell>
    );
}
