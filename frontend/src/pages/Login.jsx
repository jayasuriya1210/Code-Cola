import { useState } from "react";
import API from "../services/api";
import { useNavigate } from "react-router-dom";

export default function Login() {
    const nav = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const login = async () => {
        setLoading(true);
        try {
            const res = await API.post("/auth/login", { email, password });
            localStorage.setItem("token", res.data.token);
            localStorage.setItem("user", JSON.stringify(res.data.user || {}));
            nav("/dashboard");
        } catch {
            alert("Invalid login");
        } finally {
            setLoading(false);
        }
    };

    return (
      <div className="auth-wrap">
        <div className="auth-card">
          <div className="auth-panel">
            <h2 className="auth-title">Welcome back</h2>
            <p className="auth-subtitle">Sign in to access case search, summary, audio and notes.</p>

            <div className="field">
              <label className="label">Email</label>
              <input className="input" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
            </div>

            <div className="field">
              <label className="label">Password</label>
              <input className="input" placeholder="Enter password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
            </div>

            <div className="row">
              <button className="btn btn-primary" onClick={login} disabled={loading}>
                {loading ? "Logging in..." : "Login"}
              </button>
              <button className="btn btn-secondary" onClick={() => nav("/register")}>
                Create account
              </button>
            </div>
          </div>
          <div className="auth-visual" aria-hidden="true" />
        </div>
      </div>
    );
}
