import { useNavigate } from "react-router-dom";

export default function Navbar() {
    const nav = useNavigate();

    return (
        <div style={{
            background: "#1e1e1e",
            padding: "10px",
            color: "white",
            marginBottom: "20px"
        }}>
            <span style={{ marginRight: "20px", cursor: "pointer" }} onClick={() => nav("/dashboard")}>Dashboard</span>
            <span style={{ marginRight: "20px", cursor: "pointer" }} onClick={() => nav("/search")}>Search</span>
            <span style={{ marginRight: "20px", cursor: "pointer" }} onClick={() => nav("/upload")}>Upload PDF</span>
            <span style={{ marginRight: "20px", cursor: "pointer" }} onClick={() => nav("/history")}>History</span>
        </div>
    );
}