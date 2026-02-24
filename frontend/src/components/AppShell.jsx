import { Link, useLocation, useNavigate } from "react-router-dom";

const links = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/search", label: "Search" },
  { to: "/upload", label: "Upload PDF" },
  { to: "/history", label: "History" },
];

export default function AppShell({ title, subtitle, actions, children }) {
  const location = useLocation();
  const nav = useNavigate();

  const logout = () => {
    localStorage.clear();
    nav("/");
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-dot" />
          <div>
            <h1>CaseLaw Audio Intelligence</h1>
            <p>AI Search, Summary, Audio and Notes</p>
          </div>
        </div>
        <nav className="topnav">
          {links.map((item) => (
            <Link
              key={item.to}
              className={`topnav-link ${location.pathname === item.to ? "active" : ""}`}
              to={item.to}
            >
              {item.label}
            </Link>
          ))}
          <button className="btn btn-ghost" onClick={logout}>
            Logout
          </button>
        </nav>
      </header>

      <main className="page-wrap">
        <section className="page-head">
          <div>
            <h2>{title}</h2>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
          {actions ? <div className="page-head-actions">{actions}</div> : null}
        </section>
        <section className="card">{children}</section>
      </main>
    </div>
  );
}
