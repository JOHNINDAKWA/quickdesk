import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams, useParams } from "react-router-dom";
import {
  FiUsers,
  FiUserPlus,
  FiMoreVertical,
  // FiUser,
  FiGrid,
  FiLayers,
  FiShield
} from "react-icons/fi";
import { LuArrowUpDown } from "react-icons/lu";

import { useOrg } from "../../../app/org";
import './Users.css'
import DepartmentsTab from "./Departments/Departments";
import TeamsTab from "./Teams/Teams";
import RolesTab from "./Roles/Roles";


/* =========================================================
   Types (adjust later to your API)
   ======================================================= */
type UserStatus = "active" | "invited" | "suspended";
type UserRole = "agent" | "admin" | "viewer" | "requester";

type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  department?: string;
  team?: string;
  lastLogin?: string;   // ISO
  createdAt: string;    // ISO
};

type SortKey = "name" | "email" | "role" | "status" | "lastLogin" | "createdAt";
type SortDir = "asc" | "desc";

/* =========================================================
   Mock data (replace with fetch)
   ======================================================= */
function seedUsers(): User[] {
  const now = Date.now();
  const mk = (i: number, role: UserRole, status: UserStatus): User => ({
    id: String(i),
    name: ["Jane Apondi", "Brian Otieno", "Mary Wanjiru", "Peter Njoroge", "Aisha Noor", "Kevin Ouma", "Lucy Muthoni"][i % 7] + ` ${i}`,
    email: `user${i}@example.co.ke`,
    role,
    status,
    department: ["Support", "Engineering", "IT", "Billing", "Success"][i % 5],
    team: ["Tier 1", "Tier 2", "Platform", "Payments"][i % 4],
    lastLogin: new Date(now - i * 36e5).toISOString(),
    createdAt: new Date(now - i * 864e5).toISOString(),
  });

  const list: User[] = [];
  for (let i = 1; i <= 28; i++) {
    const role = (["agent", "admin", "viewer", "requester"] as UserRole[])[i % 4];
    const status = (["active", "invited", "suspended"] as UserStatus[])[i % 3];
    list.push(mk(i, role, status));
  }
  return list;
}

/* =========================================================
   Tabs config
   ======================================================= */
const TABS = [
  { key: "users", label: "Users", icon: <FiUsers /> },
  { key: "departments", label: "Departments", icon: <FiGrid /> },
  { key: "teams", label: "Teams", icon: <FiLayers /> },
  { key: "roles", label: "Roles & Permissions", icon: <FiShield /> },
] as const;
type TabKey = typeof TABS[number]["key"];

/* =========================================================
   Page
   ======================================================= */
export default function UsersPage() {
  const org = useOrg();
  const { orgSlug } = useParams();
  const navigate = useNavigate();
  const [sp, setSp] = useSearchParams();

  // tab via URL (?tab=users|departments|teams|roles)
  const tab = (sp.get("tab") as TabKey) || "users";
  function setTab(next: TabKey) {
    const nextSp = new URLSearchParams(sp);
    nextSp.set("tab", next);
    setSp(nextSp, { replace: true });
  }

  // seed/mock
  const [users, setUsers] = useState<User[]>(() => seedUsers());
  useEffect(() => {
    // TODO: fetch `/api/orgs/:slug/users`
    // setUsers(await res.json());
  }, [org.slug]);

  return (
    <div className="panel" style={{ padding: 0 }}>
      {/* Top tabs */}
      <div className="u-tabs">
        {TABS.map(t => (
          <button
            key={t.key}
            className={`u-tab ${tab === t.key ? "active" : ""}`}
            onClick={() => setTab(t.key)}
            role="tab"
            aria-selected={tab === t.key}
          >
            <span className="u-tab__icon">{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}

        {tab === "users" && (
          <div className="u-tabs__right">
            <Link
              className="btn btn-primary"
              to={`/${orgSlug}/console/users/new`}
              title="Create new user"
            >
              <FiUserPlus /> New User
            </Link>
          </div>
        )}
      </div>

      {/* Tab panes */}
{tab === "users" && (
  <UsersTab
    users={users}
    onOpenUser={(u) => navigate(`/${orgSlug}/console/users/${u.id}`)}
  />
)}

{tab === "departments" && <DepartmentsTab />}

{tab === "teams" && <TeamsTab />}

{tab === "roles" && <RolesTab />}

    </div>
  );
}

/* =========================================================
   UsersTab — filters, sorting, list
   ======================================================= */
function UsersTab({
  users,
  onOpenUser,
}: {
  users: User[];
  onOpenUser: (u: User) => void;
}) {
  const [sp, setSp] = useSearchParams();

  // Search & filters in URL
  const q = sp.get("q") ?? "";
  const role = (sp.get("role") as UserRole) || "all";
  const status = (sp.get("status") as UserStatus) || "all";
  const sortKey = (sp.get("sortKey") as SortKey) || "name";
  const sortDir = (sp.get("sortDir") as SortDir) || "asc";

  // NEW: pagination in URL
  const page = Math.max(1, parseInt(sp.get("page") || "1", 10) || 1);
  const pageSize = (() => {
    const v = parseInt(sp.get("pageSize") || "10", 10);
    return [10, 20, 50, 100].includes(v) ? v : 10;
  })();

  function update(key: string, val: string) {
    const next = new URLSearchParams(sp);
    if (val === "" || val === "all") next.delete(key);
    else next.set(key, val);
    // reset to first page when filters or sort change
    if (["q", "role", "status", "sortKey", "sortDir", "pageSize"].includes(key)) {
      next.set("page", "1");
    }
    setSp(next, { replace: true });
  }
  function toggleSort(k: SortKey) {
    if (sortKey !== k) {
      update("sortKey", k);
      update("sortDir", "asc");
    } else {
      update("sortDir", sortDir === "asc" ? "desc" : "asc");
    }
  }

  // filter + sort
  const filtered = useMemo(() => {
    const qn = q.trim().toLowerCase();
    const base = users
      .filter(u =>
        (!qn ||
          u.name.toLowerCase().includes(qn) ||
          u.email.toLowerCase().includes(qn) ||
          (u.department || "").toLowerCase().includes(qn) ||
          (u.team || "").toLowerCase().includes(qn))
        && (role === "all" || u.role === role)
        && (status === "all" || u.status === status)
      )
      .sort((a, b) => {
        const dir = sortDir === "asc" ? 1 : -1;
        const cmp = (x: string, y: string) => x.localeCompare(y) * dir;
        switch (sortKey) {
          case "name": return cmp(a.name, b.name);
          case "email": return cmp(a.email, b.email);
          case "role": return cmp(a.role, b.role);
          case "status": return cmp(a.status, b.status);
          case "lastLogin": return ((new Date(a.lastLogin || 0).getTime() - new Date(b.lastLogin || 0).getTime()) * dir);
          case "createdAt": return ((new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * dir);
          default: return 0;
        }
      });
    return base;
  }, [users, q, role, status, sortKey, sortDir]);

  // paginate
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const startIdx = (safePage - 1) * pageSize;
  const endIdx = Math.min(startIdx + pageSize, total);
  const pageItems = filtered.slice(startIdx, endIdx);

  function goto(p: number) {
    const np = Math.max(1, Math.min(totalPages, p));
    const next = new URLSearchParams(sp);
    next.set("page", String(np));
    setSp(next, { replace: true });
  }

  return (
    <div className="u-wrap">
      {/* Filters */}
      <div className="u-filters">
        <div className="u-search">
          <input
            value={q}
            onChange={(e) => update("q", e.target.value)}
            placeholder="Search name, email, team…"
            aria-label="Search users"
          />
        </div>

        <div className="u-pills">
          <label className="u-pill">
            <span>Role</span>
            <select value={role} onChange={(e) => update("role", e.target.value)}>
              <option value="all">All</option>
              <option value="admin">Admin</option>
              <option value="agent">Agent</option>
              <option value="viewer">Viewer</option>
              <option value="requester">Requester</option>
            </select>
          </label>

          <label className="u-pill">
            <span>Status</span>
            <select value={status} onChange={(e) => update("status", e.target.value)}>
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="invited">Invited</option>
              <option value="suspended">Suspended</option>
            </select>
          </label>

          <div className="u-sort">
            <button className="btn" onClick={() => toggleSort("name")} title="Sort by name">
              <LuArrowUpDown /> Name {sortKey === "name" ? `(${sortDir})` : ""}
            </button>
            <button className="btn" onClick={() => toggleSort("createdAt")} title="Sort by created">
              <LuArrowUpDown /> Created {sortKey === "createdAt" ? `(${sortDir})` : ""}
            </button>
            <button className="btn" onClick={() => toggleSort("lastLogin")} title="Sort by last login">
              <LuArrowUpDown /> Last Login {sortKey === "lastLogin" ? `(${sortDir})` : ""}
            </button>
          </div>
        </div>

        <div className="u-filters__right">
          {/* Page size selector lives with filters on the right */}
          <label className="u-pill" title="Rows per page">
            <span>Rows</span>
            <select
              value={String(pageSize)}
              onChange={(e) => update("pageSize", e.target.value)}
            >
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </label>
        </div>
      </div>

      {/* List */}
      <div className="u-list">
        <div className="u-headrow">
          <div className="col name">Name</div>
          <div className="col email">Email</div>
          <div className="col role">Role</div>
          <div className="col status">Status</div>
          <div className="col dept">Department</div>
          <div className="col team">Team</div>
          <div className="col meta">Last Login</div>
          <div className="col actions" />
        </div>

        {pageItems.map(u => (
          <button
            key={u.id}
            className="u-row"
            onClick={() => onOpenUser(u)}
            title="Open user"
          >
            <div className="col name">
              <span className="avatar">{initials(u.name)}</span>
              <div className="meta">
                <div className="name">{u.name}</div>
                <div className="sub">{new Date(u.createdAt).toLocaleDateString()}</div>
              </div>
            </div>

            <div className="col email">{u.email}</div>
            <div className="col role"><span className={`chip role-${u.role}`}>{uc(u.role)}</span></div>
            <div className="col status"><span className={`badge badge-${u.status}`}>{uc(u.status)}</span></div>
            <div className="col dept">{u.department || "—"}</div>
            <div className="col team">{u.team || "—"}</div>
            <div className="col meta">{u.lastLogin ? timeAgo(u.lastLogin) : "—"}</div>

            <div className="col actions" onClick={(e) => e.stopPropagation()}>
              <a className="iconbtn" href="#" onClick={(e) => e.preventDefault()} title="More">
                <FiMoreVertical />
              </a>
            </div>
          </button>
        ))}

        {total === 0 && (
          <div className="u-empty">
            <div className="u-empty__icon"><FiUsers /></div>
            <h3>No users match your filters</h3>
            <p className="text-muted">Try clearing the search or changing filters.</p>
          </div>
        )}
      </div>

      {/* NEW: Pagination footer */}
      <div className="u-pager">
        <div className="u-pager__info">
          {total > 0 ? (
            <>Showing <b>{startIdx + 1}</b>–<b>{endIdx}</b> of <b>{total}</b></>
          ) : (
            <>No results</>
          )}
        </div>
        <div className="u-pager__ctrls" role="navigation" aria-label="Pagination">
          <button className="btn" disabled={safePage <= 1} onClick={() => goto(1)} aria-label="First page">« First</button>
          <button className="btn" disabled={safePage <= 1} onClick={() => goto(safePage - 1)} aria-label="Previous page">‹ Prev</button>

          {/* compact numeric window */}
          {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
            // center window around current page
            const half = 2;
            let start = Math.max(1, safePage - half);
            const end = Math.min(totalPages, start + 4);
            if (end - start < 4) start = Math.max(1, end - 4);
            const p = start + i;
            if (p > totalPages) return null;
            return (
              <button
                key={p}
                className={`btn u-pagebtn ${p === safePage ? "is-current" : ""}`}
                onClick={() => goto(p)}
                aria-current={p === safePage ? "page" : undefined}
              >
                {p}
              </button>
            );
          })}

          <button className="btn" disabled={safePage >= totalPages} onClick={() => goto(safePage + 1)} aria-label="Next page">Next ›</button>
          <button className="btn" disabled={safePage >= totalPages} onClick={() => goto(totalPages)} aria-label="Last page">Last »</button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   Utils
   ======================================================= */
function initials(name: string) {
  const [a = "", b = ""] = name.trim().split(/\s+/, 2);
  return (a[0] || "").toUpperCase() + (b[0] || "").toUpperCase();
}
function uc<T extends string>(s: T): string {
  return s.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}
function timeAgo(iso: string) {
  const now = Date.now();
  const t = new Date(iso).getTime();
  const s = Math.max(0, Math.floor((now - t) / 1000));
  if (s < 10) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  const w = Math.floor(d / 7);
  if (w < 5) return `${w}w ago`;
  return new Date(iso).toLocaleDateString();
}
