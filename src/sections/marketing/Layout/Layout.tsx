import { Outlet, NavLink, Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { FiZap, FiExternalLink } from "react-icons/fi";
import "./Layout.css";

export default function MarketingLayout() {
  const [slug, setSlug] = useState("");
  const loc = useLocation();

  // Seed slug from localStorage or a friendly default
  useEffect(() => {
    const last = localStorage.getItem("qd_last_org") || "";
    setSlug(last || "acme");
  }, []);

  // Keep latest in LS (so Console/Portal nav work even after refresh)
  useEffect(() => {
    if (slug) localStorage.setItem("qd_last_org", slug);
  }, [slug]);

  const portalHref = slug ? `/${slug}/portal` : "/";    // guarded
  const consoleHref = slug ? `/${slug}/console` : "/";  // guarded

  return (
    <div className="mk-app">
      <header className="mk-header">
        <div className="mk-container mk-bar">
          <Link to="/" className="mk-logo" aria-label="QuickDesk">
            <span className="mk-logo__icon"><FiZap /></span>
            <span className="mk-logo__text">QuickDesk</span>
          </Link>

          <nav className="mk-nav">
            <NavLink to="/" end>Home</NavLink>
            <a href={portalHref}>Portal</a>
            <a href={consoleHref}>Console</a>
            <NavLink to="/admin">SuperAdmin</NavLink>
          </nav>

          <div className="mk-orgctl">
            <label className="mk-orgctl__label" htmlFor="mk-org">Org</label>
            <input
              id="mk-org"
              className="mk-orgctl__input"
              value={slug}
              onChange={(e) =>
                setSlug(e.target.value.toLowerCase().trim().replace(/[^a-z0-9-]+/g, "-"))
              }
              placeholder="your-org"
              spellCheck={false}
            />
            <a className="mk-orgctl__go" href={consoleHref} title="Open Console">
              <FiExternalLink />
            </a>
          </div>
        </div>

        {/* subtle gradient backdrop only on the homepage */}
        {loc.pathname === "/" && <div className="mk-hero-glow" aria-hidden />}
      </header>

      <main className="mk-container mk-main">
        <Outlet />
      </main>

      <footer className="mk-footer">
        <div className="mk-container mk-footbar">
          <div>© {new Date().getFullYear()} QuickDesk</div>
          <div className="mk-footlinks">
            <a href={portalHref}>Portal</a>
            <a href={consoleHref}>Console</a>
            <Link to="/admin">SuperAdmin</Link>
            <a href="mailto:hello@quickdesk.com">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
