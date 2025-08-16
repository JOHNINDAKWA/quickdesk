import { useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import {
  FiZap,
  FiChevronRight,
  FiHome,
  FiBriefcase,
  FiUsers,
  FiCreditCard,
  FiSettings,
  FiBarChart2,
  FiList,
  FiShield,
  FiSun,
  FiMoon,
  FiMenu,
  FiX,
} from "react-icons/fi";
import "./Layout.css";
import { FaPlug } from "react-icons/fa";

export default function SuperAdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
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

  // Close the drawer when navigating (mobile)
  function onNavSelect() {
    setMobileOpen(false);
  }

  return (
    <div
      data-app="superadmin"
      className={`sa-app ${collapsed ? "is-collapsed" : ""} ${mobileOpen ? "is-mobile-open" : ""}`}
    >
      {/* Sidebar (desktop column / mobile drawer) */}
      <aside className="sa-sidebar" aria-label="Primary">


<div className="sa-sidebar__top">
  {collapsed && (
  <button
    className="sa-expand"
    onClick={() => setCollapsed(false)}
    title="Expand sidebar"
    aria-label="Expand sidebar"
  >
    <FiChevronRight />
  </button>
)}

  <div
    className="sa-logo"
    aria-label="QuickDesk"
    role="button"
    tabIndex={0}
    title={collapsed ? "Expand sidebar" : "QuickDesk"}
    onClick={() => collapsed && setCollapsed(false)}
    onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && collapsed && setCollapsed(false)}
  >
    <FiZap size={22} />
  </div>

  {/* collapse button hidden when collapsed; logo acts as expand */}
  {!collapsed && (
    <button
      className="sa-iconbtn sa-collapse"
      onClick={() => setCollapsed(true)}
      title="Collapse sidebar"
      aria-label="Collapse sidebar"
    >
      <FiChevronRight className="chev rot" />
    </button>
  )}

  {/* mobile drawer close stays as-is */}
  <button
    className="sa-iconbtn sa-drawer-close"
    onClick={() => setMobileOpen(false)}
    aria-label="Close menu"
    title="Close menu"
  >
    <FiX />
  </button>
</div>




        <nav className="sa-nav">
          <NavItem to="/admin" label="Dashboard" icon={<FiHome />} onSelect={onNavSelect} />
          <NavItem
            to="/admin/organizations"
            label="Organizations"
            icon={<FiBriefcase />}
            onSelect={onNavSelect}
          />

          <div className="sa-nav__section">Manage</div>
          <NavItem to="/admin/users" label="Users" icon={<FiUsers />} onSelect={onNavSelect} />
          <NavItem to="/admin/plans" label="Plans & Pricing" icon={<FiCreditCard />} onSelect={onNavSelect} />
          <NavItem to="/admin/settings" label="Settings" icon={<FiSettings />} onSelect={onNavSelect} />

          <div className="sa-nav__section">Insights & Controls</div>
          <NavItem to="/admin/analytics" label="Analytics" icon={<FiBarChart2 />} onSelect={onNavSelect} />
          <NavItem to="/admin/integrations" label="Integrations" icon={<FaPlug />} onSelect={onNavSelect} />
          <NavItem to="/admin/audit-logs" label="Audit Logs" icon={<FiList />} onSelect={onNavSelect} />
          <NavItem to="/admin/security" label="Security" icon={<FiShield />} onSelect={onNavSelect} />
        </nav>

        <div className="sa-sidebar__bottom">
          <button className="sa-iconbtn" onClick={toggleTheme} title="Toggle theme" aria-label="Toggle theme">
            {theme === "dark" ? <FiSun /> : <FiMoon />}
          </button>
          <div className="sa-avatar" title="You">
            SA
          </div>
        </div>
      </aside>

      {/* Backdrop for mobile drawer */}
      <div
        className="sa-backdrop"
        onClick={() => setMobileOpen(false)}
        aria-hidden={mobileOpen ? "false" : "true"}
      />

      {/* Topbar */}
      <header className="sa-topbar">
        <div className="sa-topbar__inner">
          <div className="sa-topbar__left">
            {/* Hamburger (mobile only) */}
            <button
              className="sa-iconbtn sa-menu"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              title="Open menu"
            >
              <FiMenu />
            </button>

            <div className="sa-breadcrumb">
              <span className="sa-dot" /> SuperAdmin
            </div>
          </div>

          <div className="sa-search">
            <input placeholder="Search organizations, users..." />
          </div>

          <div className="sa-actions">
            <button className="btn btn-primary">Add Organization</button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="sa-main">
        <Outlet />
      </main>
    </div>
  );
}

function NavItem({
  to,
  label,
  icon,
  onSelect,
}: {
  to: string;
  label: string;
  icon: React.ReactNode;
  onSelect?: () => void;
}) {
  return (
    <NavLink
      to={to}
      end
      onClick={onSelect}
      className={({ isActive }) => "sa-nav__item" + (isActive ? " is-active" : "")}
      title={label}
    >
      <span className="sa-nav__icon" aria-hidden>
        {icon}
      </span>
      <span className="sa-nav__label">{label}</span>
    </NavLink>
  );
}
