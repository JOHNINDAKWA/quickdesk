import { NavLink, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { useOrg } from "../../../app/org";

import {
  FiMenu, FiX, FiSun, FiMoon, FiSearch, FiChevronDown, FiBell,
  FiHome, FiInbox, FiUserCheck, FiList, FiMessageSquare,
  FiClock, FiArchive, FiAlertTriangle, FiBookOpen, FiDatabase,
  FiBarChart2, FiUsers, FiSettings, FiSliders
} from "react-icons/fi";

import "./Layout.css";

// Layout.tsx
import type { ReactNode } from 'react';

type NavItem = { to: string; label: string; icon: ReactNode; exact?: boolean };


type NavSection = { label: string; items: NavItem[] };

export default function HelpdeskLayout() {
  const org = useOrg();
  const [navOpen, setNavOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("dark");

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

  const SECTIONS: NavSection[] = [
    {
      label: "Overview",
      items: [
        { to: ".", label: "Dashboard", icon: <FiHome />, exact: true },
        { to: "notifications", label: "Notifications", icon: <FiBell /> },
      ],
    },
    {
      label: "Tickets",
      items: [
        { to: "tickets", label: "My Tickets", icon: <FiUserCheck /> },
        { to: "tickets?view=all", label: "All Tickets", icon: <FiList /> },
        { to: "tickets?f=open", label: "Open Tickets", icon: <FiInbox /> },
        { to: "tickets?f=replied", label: "Replied Tickets", icon: <FiMessageSquare /> },
        { to: "tickets?f=overdue", label: "Overdue Tickets", icon: <FiClock /> },
        { to: "tickets?f=closed", label: "Closed Tickets", icon: <FiArchive /> },
        { to: "tickets?f=escalations", label: "Escalations", icon: <FiAlertTriangle /> },
      ],
    },
    {
      label: "Knowledge",
      items: [{ to: "kb", label: "Knowledge Base", icon: <FiBookOpen /> }],
    },
    {
      label: "Reports & Admin",
      items: [
        { to: "sla", label: "SLA Monitor", icon: <FiSliders /> },
        { to: "workflows", label: "Workflow Assignment", icon: <FiDatabase /> },
        { to: "reports", label: "Reports", icon: <FiBarChart2 /> },
        { to: "users", label: "Manage Users", icon: <FiUsers /> },
        { to: "settings", label: "Settings", icon: <FiSettings /> },
      ],
    },
  ];

  return (
    <div
      data-app="helpdesk"
      className={`app-helpdesk ${collapsed ? "is-collapsed" : ""} ${navOpen ? "is-mobile-open" : ""}`}
    >
      {/* Sidebar / Drawer */}
      <aside className="hd-sidebar">
        <div className="hd-sidebar__top">
          <button className="hd-iconbtn hd-drawer-close" onClick={() => setNavOpen(false)} aria-label="Close menu">
            <FiX />
          </button>

          <div className="hd-brand" title={org.name}>
            <div className="hd-logo">
              {org.logo ? <img src={org.logo} alt="" /> : (org.name?.[0] ?? "Q")}
            </div>
            <div className="hd-brand__meta">
              <div className="hd-brand__name">{org.name}</div>
              <div className="hd-brand__slug">@{org.slug}</div>
            </div>
          </div>

          <button
            className="hd-iconbtn hd-collapse"
            onClick={() => setCollapsed((v) => !v)}
            aria-label="Collapse sidebar"
            title="Collapse sidebar"
          >
            <span className="chev" />
          </button>
        </div>

        <nav className="hd-nav">
          {SECTIONS.map((s) => (
            <div key={s.label} className="hd-navSec">
              <div className="hd-navSec__label">{s.label}</div>
              {s.items.map((it) => (
                <NavLink
                  key={it.label}
                  to={it.to}
                  end={it.exact}
                  className="hd-navItem"
                  onClick={() => setNavOpen(false)}
                >
                  <span className="hd-navItem__icon">{it.icon}</span>
                  <span className="hd-navItem__label">{it.label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
      </aside>

      {/* Top bar – now a direct grid child */}
      <header className="hd-topbar">
        <div className="hd-topbar__inner">
          <div className="hd-left">
            <button className="hd-iconbtn hd-menu" onClick={() => setNavOpen(true)} aria-label="Open menu">
              <FiMenu />
            </button>

            <button className="hd-orgswitch" title={org.name}>
              <span className="hd-orgdot" />
              <span className="hd-orgname">{org.name}</span>
              <FiChevronDown />
            </button>
          </div>

          <div className="hd-search">
            <FiSearch className="hd-search__icon" />
            <input placeholder="Search tickets, users, articles…" />
          </div>

          <div className="hd-right">
            <button className="hd-iconbtn" aria-label="Notifications">
              <FiBell />
              <span className="hd-dot" />
            </button>
            <button className="hd-iconbtn" onClick={toggleTheme} aria-label="Toggle theme">
              {theme === "dark" ? <FiSun /> : <FiMoon />}
            </button>

            <div className="hd-user">
              <span className="hd-user__avatar">{initials("Agent Jane")}</span>
              <div className="hd-user__meta">
                <div className="hd-user__name">Agent Jane</div>
                <div className="hd-user__email">jane@{org.slug}.co.ke</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="hd-main">
        <Outlet />
      </main>

      {/* Mobile backdrop */}
      <div className="hd-backdrop" onClick={() => setNavOpen(false)} />
    </div>
  );
}

function initials(name: string) {
  const [a = "", b = ""] = name.trim().split(/\s+/, 2);
  return (a[0] || "").toUpperCase() + (b[0] || "").toUpperCase();
}
