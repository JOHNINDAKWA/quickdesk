import { Outlet, NavLink, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { FiMenu, FiX, FiSun, FiMoon } from "react-icons/fi";
import { useOrg } from "../../../app/org"; // <- same hook you use on Home
import "./Layout.css";

export default function PortalLayout() {
  const [navOpen, setNavOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  // Tenant/org from loader/context (slug, name, logo, brandColor)
  const org = useOrg();

  // Theme mount
  useEffect(() => {
    const saved = (localStorage.getItem("qd_theme") as "light" | "dark") || null;
    const initial =
      saved ?? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    document.documentElement.setAttribute("data-theme", initial);
    setTheme(initial);
  }, []);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("qd_theme", next);
    setTheme(next);
  }

  // Optional per-org accent override (works with your global tokens)
  const brandStyle = org.brandColor ? ({ ["--brand" as any]: org.brandColor } as React.CSSProperties) : undefined;

  return (
    <div
      data-app="portal"
      className={`app-portal ${navOpen ? "is-nav-open" : ""}`}
      style={brandStyle}
    >
      <header className="pt-header">
        <div className="pt-container pt-bar">
          <div className="pt-left">
            <button
              className="pt-iconbtn pt-menu"
              onClick={() => setNavOpen(true)}
              aria-label="Open menu"
            >
              <FiMenu />
            </button>

            {/* Brand: link to the portal home for THIS org (relative path) */}
            <Link to="." className="pt-org" aria-label={`${org.name} Portal`}>
              <span className="pt-org__logo" aria-hidden>
                {org.logo ? <img src={org.logo} alt="" /> : initials(org.name)}
              </span>
              <span className="pt-org__meta">
                <span className="pt-org__name">{org.name} Portal</span>
                <br />
                <span className="pt-org__slug">@{org.slug}</span>
              </span>
            </Link>
          </div>

          {/* Tenant-aware nav: use RELATIVE links so it stays under /:org/portal */}
          <nav className="pt-nav">
            <NavLink to="." end>
              Home
            </NavLink>
            <NavLink to="new-request">
              New Request
            </NavLink>
          </nav>

          <div className="pt-right">
            <button className="pt-iconbtn" onClick={toggleTheme} aria-label="Toggle theme">
              {theme === "dark" ? <FiSun /> : <FiMoon />}
            </button>

            {/* Demo signed-in user (replace with real session later) */}
            <div className="pt-user">
              <span className="pt-user__initials">{initials("John Doe")}</span>
              <div>
                <div className="pt-user__name">John Doe</div>
                <div className="pt-user__email">john@{org.slug}.co.ke</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile drawer keeps org context + relative links */}
      <aside className="pt-drawer" aria-label="Menu">
        <button
          className="pt-iconbtn pt-close"
          onClick={() => setNavOpen(false)}
          aria-label="Close menu"
        >
          <FiX />
        </button>

        <div className="pt-drawer__org">
          <span className="pt-org__logo" aria-hidden>
            {org.logo ? <img src={org.logo} alt="" /> : initials(org.name)}
          </span>
          <div className="pt-org__meta">
            <div className="pt-org__name">{org.name} Portal</div>
            <div className="pt-org__slug">@{org.slug}</div>
          </div>
        </div>

        <nav className="pt-drawer__nav" onClick={() => setNavOpen(false)}>
          <NavLink to="." end>
            Home
          </NavLink>
          <NavLink to="new-request">
            New Request
          </NavLink>
        </nav>
      </aside>
      <div className="pt-backdrop" onClick={() => setNavOpen(false)} />

      <main className="pt-container pt-main">
        <Outlet />
      </main>
    </div>
  );
}

function initials(name: string) {
  const [a = "", b = ""] = name.trim().split(/\s+/);
  return (a[0] ?? "").concat(b[0] ?? "").toUpperCase();
}
