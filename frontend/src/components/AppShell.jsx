import { Link, useLocation, useNavigate } from "react-router-dom";

const links = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/search", label: "Search" },
  { to: "/upload", label: "Upload PDF" },
  { to: "/audio", label: "Audio + Notes" },
  { to: "/history", label: "History" },
];

export default function AppShell({ title, subtitle, actions, children }) {
  const location = useLocation();
  const nav = useNavigate();
  const mediaByRoute = {
    "/dashboard":
      "url('https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1400&q=80')",
    "/search":
      "url('https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1400&q=80')",
    "/upload":
      "url('https://images.unsplash.com/photo-1457694587812-e8bf29a43845?auto=format&fit=crop&w=1400&q=80')",
    "/summary":
      "url('https://images.unsplash.com/photo-1436450412740-6b988f486c6b?auto=format&fit=crop&w=1400&q=80')",
    "/audio":
      "url('https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=1400&q=80')",
    "/history":
      "url('https://images.unsplash.com/photo-1505664194779-8beaceb93744?auto=format&fit=crop&w=1400&q=80')",
  };
  const pageMedia = mediaByRoute[location.pathname] || mediaByRoute["/dashboard"];

  const logout = () => {
    localStorage.clear();
    nav("/");
  };

  return (
    <div className="workspace">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-dot" />
          <div>
            <h1>CaseLaw Intelligence</h1>
            <p>Search, PDF AI, Audio, Notes</p>
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
        </nav>
        <button className="btn btn-ghost" onClick={logout}>
            Logout
        </button>
      </aside>

      <main className="page-wrap">
        <section className="page-head">
          <div className="page-head-copy">
            <h2>{title}</h2>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
          <div className="page-media" style={{ backgroundImage: pageMedia }} />
          {actions ? <div className="page-head-actions">{actions}</div> : null}
        </section>
        <section className="card">{children}</section>
      </main>
    </div>
  );
}
