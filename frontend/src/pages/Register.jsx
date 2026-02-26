import { useState } from "react";
import API from "../services/api";
import { useNavigate } from "react-router-dom";

export default function Register() {
    const nav = useNavigate();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const register = async () => {
        setLoading(true);
        try {
          await API.post("/auth/register", { name, email, password });
          alert("Registered");
          nav("/");
        } catch (err) {
          alert(err?.response?.data?.msg || "Registration failed");
        } finally {
          setLoading(false);
        }
    };

    return (
      <div className="auth-wrap">
        <div className="auth-card">
          <div className="auth-panel">
            <h2 className="auth-title">Create account</h2>
            <p className="auth-subtitle">Register to start AI-powered case analysis.</p>

            <div className="field">
              <label className="label">Name</label>
              <input className="input" placeholder="Full name" value={name} onChange={e => setName(e.target.value)} />
            </div>

            <div className="field">
              <label className="label">Email</label>
              <input className="input" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
            </div>

            <div className="field">
              <label className="label">Password</label>
              <input className="input" placeholder="Minimum 6 characters" type="password" value={password} onChange={e => setPassword(e.target.value)} />
            </div>

            <div className="row">
              <button className="btn btn-primary" onClick={register} disabled={loading}>
                {loading ? "Creating account..." : "Register"}
              </button>
              <button className="btn btn-secondary" onClick={() => nav("/")}>
                Back to login
              </button>
            </div>
          </div>
          <div className="auth-visual" aria-hidden="true" />
        </div>
      </div>
    );
}
