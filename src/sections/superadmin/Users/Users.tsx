import { useMemo, useState } from "react";
import {
  FiUsers,
  FiUserPlus,
  FiSearch,
  FiEdit2,
  FiTrash2,
  FiPauseCircle,
  FiPlayCircle,
  FiMoreVertical,
  FiMail,
  FiKey,
  FiX,
  FiCheck,
  FiUpload,
  FiDownload,
} from "react-icons/fi";
import "./Users.css";

type UserRole =
  | "Owner"
  | "Client Admin"
  | "Helpdesk Admin"
  | "Agent"
  | "Analyst"
  | "Billing"
  | "Viewer";

type UserStatus = "active" | "suspended" | "invited";

type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  lastActive: string | null; // ISO or null
  createdAt: string; // ISO
  ticketsResolved: number;
  teams: string[];
  avatarUrl?: string;
};

type SortKey = "recent" | "name" | "role" | "activity";
type ConfirmKind = "delete" | "suspend" | "activate";

// --- Seed data
const seed: User[] = [
  {
    id: "u1",
    name: "Brian Odhiambo",
    email: "brian@juakali.co.ke",
    role: "Client Admin",
    status: "active",
    lastActive: "2025-08-12T09:33:00Z",
    createdAt: "2024-12-10T10:00:00Z",
    ticketsResolved: 432,
    teams: ["Admin"],
    avatarUrl: "",
  },
  {
    id: "u2",
    name: "Grace Wanjiru",
    email: "grace@ushindi.co.ke",
    role: "Helpdesk Admin",
    status: "active",
    lastActive: "2025-08-15T18:21:00Z",
    createdAt: "2024-11-02T10:00:00Z",
    ticketsResolved: 120,
    teams: ["Operations"],
  },
  {
    id: "u3",
    name: "Kevin Kiptoo",
    email: "kevin@kijani.africa",
    role: "Agent",
    status: "invited",
    lastActive: null,
    createdAt: "2025-06-01T10:00:00Z",
    ticketsResolved: 0,
    teams: ["Tier 1"],
  },
  {
    id: "u4",
    name: "Amina Hassan",
    email: "amina@simba-logistics.co.ke",
    role: "Analyst",
    status: "suspended",
    lastActive: "2025-07-12T07:10:00Z",
    createdAt: "2024-10-01T10:00:00Z",
    ticketsResolved: 88,
    teams: ["Insights"],
  },
  {
    id: "u5",
    name: "Peter Njoroge",
    email: "peter@majisafi.co.ke",
    role: "Billing",
    status: "active",
    lastActive: "2025-08-14T12:09:00Z",
    createdAt: "2025-02-05T10:00:00Z",
    ticketsResolved: 15,
    teams: ["Finance"],
  },
  {
    id: "u6",
    name: "Joy Achieng",
    email: "joy@rafikiretail.co.ke",
    role: "Agent",
    status: "active",
    lastActive: "2025-08-16T10:15:00Z",
    createdAt: "2024-09-05T10:00:00Z",
    ticketsResolved: 640,
    teams: ["Tier 2", "Escalations"],
  },
];

const ALL_ROLES: UserRole[] = [
  "Owner",
  "Client Admin",
  "Helpdesk Admin",
  "Agent",
  "Analyst",
  "Billing",
  "Viewer",
];

function emailOk(v: string) {
  return /^\S+@\S+\.\S+$/.test(v);
}
function initials(name: string) {
  const p = name.trim().split(/\s+/);
  return ((p[0]?.[0] || "") + (p[1]?.[0] || "")).toUpperCase();
}
function fmtDate(iso: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function SAUsers() {
  const [users, setUsers] = useState<User[]>(seed);
  const [q, setQ] = useState("");
  const [role, setRole] = useState<UserRole | "all">("all");
  const [status, setStatus] = useState<UserStatus | "all">("all");
  const [sort, setSort] = useState<SortKey>("recent");

  const [selected, setSelected] = useState<Record<string, boolean>>({});

  // modals
  const [showForm, setShowForm] = useState<null | { mode: "add" | "edit"; user?: User }>(null);
  const [confirmModal, setConfirmModal] = useState<null | { type: ConfirmKind; user: User }>(null);

  const filtered = useMemo(() => {
    let out = users.filter((u) => {
      const hitQ =
        !q ||
        u.name.toLowerCase().includes(q.toLowerCase()) ||
        u.email.toLowerCase().includes(q.toLowerCase());
      const hitRole = role === "all" || u.role === role;
      const hitStatus = status === "all" || u.status === status;
      return hitQ && hitRole && hitStatus;
    });

    out = [...out].sort((a, b) => {
      switch (sort) {
        case "name":
          return a.name.localeCompare(b.name);
        case "role":
          return a.role.localeCompare(b.role);
        case "activity":
          return b.ticketsResolved - a.ticketsResolved;
        case "recent":
        default:
          return +new Date(b.createdAt) - +new Date(a.createdAt);
      }
    });

    return out;
  }, [users, q, role, status, sort]);

  const selectedIds = useMemo(
    () => Object.entries(selected).filter(([, v]) => v).map(([k]) => k),
    [selected]
  );

  function toggleSelectAll(checked: boolean) {
    const next: Record<string, boolean> = {};
    if (checked) filtered.forEach((u) => (next[u.id] = true));
    setSelected(next);
  }

  // --- CRUD helpers (split add / update to satisfy TS)
  function addUser(input: {
    name: string;
    email: string;
    role?: UserRole;
    status?: UserStatus;
    teams?: string[];
    avatarUrl?: string;
  }) {
    const nu: User = {
      id: Math.random().toString(36).slice(2),
      name: input.name,
      email: input.email,
      role: input.role ?? "Agent",
      status: input.status ?? "active",
      lastActive: null,
      createdAt: new Date().toISOString(),
      ticketsResolved: 0,
      teams: input.teams ?? [],
      avatarUrl: input.avatarUrl ?? "",
    };
    setUsers((prev) => [nu, ...prev]);
  }

  function updateUser(id: string, patch: Partial<User>) {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...patch } : u)));
  }

  function removeUser(id: string) {
    setUsers((prev) => prev.filter((u) => u.id !== id));
    setSelected((s) => {
      const { [id]: _, ...rest } = s;
      return rest;
    });
  }

  function bulkUpdate(next: Partial<User>) {
    setUsers((prev) =>
      prev.map((u) => (selectedIds.includes(u.id) ? { ...u, ...next } : u))
    );
    setSelected({});
  }

  function exportCSV() {
    const header = [
      "name",
      "email",
      "role",
      "status",
      "lastActive",
      "createdAt",
      "ticketsResolved",
      "teams",
    ].join(",");
    const rows = users.map((u) =>
      [
        `"${u.name.replace(/"/g, '""')}"`,
        u.email,
        u.role,
        u.status,
        u.lastActive || "",
        u.createdAt,
        u.ticketsResolved,
        `"${u.teams.join(";").replace(/"/g, '""')}"`,
      ].join(",")
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "users.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="qdus-page">
      {/* Header */}
      <section className="panel qdus-hero">
        <div className="qdus-hero__left">
          <h1 className="qdus-title">Users</h1>
          <p className="qdus-sub">Manage all user accounts across QuickDesk.</p>
        </div>
        <div className="qdus-hero__actions">
          <button className="btn" onClick={exportCSV} title="Export CSV">
            <FiDownload /> Export
          </button>
          <button
            className="btn"
            onClick={() => alert("Import coming soon")}
            title="Import CSV"
          >
            <FiUpload /> Import
          </button>
          <button
            className="btn btn-primary"
            onClick={() => setShowForm({ mode: "add" })}
          >
            <FiUserPlus /> Add User
          </button>
        </div>
      </section>

      {/* Bulk bar */}
      {selectedIds.length > 0 && (
        <section className="panel qdus-bulkbar">
          <div>{selectedIds.length} selected</div>
          <div className="qdus-bulkbar__actions">
            <button className="btn" onClick={() => bulkUpdate({ status: "active" })}>
              <FiPlayCircle /> Activate
            </button>
            <button
              className="btn"
              onClick={() => bulkUpdate({ status: "suspended" })}
            >
              <FiPauseCircle /> Suspend
            </button>
            <button
              className="btn"
              onClick={() => {
                const nextRole = prompt(
                  "Set role to (Owner, Client Admin, Helpdesk Admin, Agent, Analyst, Billing, Viewer):",
                  "Agent"
                ) as UserRole | null;
                if (nextRole && ALL_ROLES.includes(nextRole)) {
                  bulkUpdate({ role: nextRole });
                }
              }}
            >
              Role…
            </button>
            <button
              className="btn"
              onClick={() => {
                if (!window.confirm("Delete selected users? This cannot be undone.")) return;
                setUsers((prev) => prev.filter((u) => !selectedIds.includes(u.id)));
                setSelected({});
              }}
            >
              <FiTrash2 /> Delete
            </button>
          </div>
        </section>
      )}

      {/* Filters */}
      <section className="panel qdus-filters">
        <div className="qdus-search">
          <FiSearch />
          <input
            placeholder="Search by name or email…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <div className="qdus-selects">
          <label className="qdus-mini">
            <span>Role</span>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole | "all")}
            >
              <option value="all">All</option>
              {ALL_ROLES.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </label>

          <label className="qdus-mini">
            <span>Status</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as UserStatus | "all")}
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="invited">Invited</option>
              <option value="suspended">Suspended</option>
            </select>
          </label>

          <label className="qdus-mini">
            <span>Sort</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
            >
              <option value="recent">Most recent</option>
              <option value="name">Name (A–Z)</option>
              <option value="role">Role</option>
              <option value="activity">Most tickets resolved</option>
            </select>
          </label>
        </div>
      </section>

      {/* Table */}
      <section className="panel qdus-tablewrap">
        <table className="qdus-table">
          <thead>
            <tr>
              <th className="w-check">
                <input
                  type="checkbox"
                  checked={
                    filtered.length > 0 &&
                    selectedIds.length === filtered.length
                  }
                  onChange={(e) => toggleSelectAll(e.currentTarget.checked)}
                  aria-label="Select all"
                />
              </th>
              <th>User</th>
              <th>Role</th>
              <th>Status</th>
              <th>Teams</th>
              <th>Tickets Resolved</th>
              <th>Last Active</th>
              <th className="w-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.id} className="qdus-row">
                <td className="w-check">
                  <input
                    type="checkbox"
                    checked={!!selected[u.id]}
                    onChange={(e) =>
                      setSelected((s) => ({ ...s, [u.id]: e.currentTarget.checked }))
                    }
                    aria-label={`Select ${u.name}`}
                  />
                </td>

                <td>
                  <div className="qdus-usercell">
                    <div
                      className="qdus-avatar"
                      style={{ background: "var(--surface-3)" }}
                    >
                      {u.avatarUrl ? (
                        <img src={u.avatarUrl} alt="" />
                      ) : (
                        <span>{initials(u.name)}</span>
                      )}
                    </div>
                    <div className="qdus-usermeta">
                      <div className="qdus-username">{u.name}</div>
                      <div className="qdus-useremail">
                        <FiMail /> {u.email}
                      </div>
                    </div>
                  </div>
                </td>

                <td>
                  <span className="qdus-chip">
                    <FiUsers /> {u.role}
                  </span>
                </td>

                <td>
                  <span className={`qdus-status qdus-status--${u.status}`}>
                    {u.status}
                  </span>
                </td>

                <td>
                  {u.teams.length ? (
                    <div className="qdus-teamlist">
                      {u.teams.map((t) => (
                        <span className="qdus-chip qdus-chip--soft" key={t}>
                          {t}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-muted">—</span>
                  )}
                </td>

                <td>{Intl.NumberFormat().format(u.ticketsResolved)}</td>
                <td className="spu-date">{fmtDate(u.lastActive)}</td>

                <td className="w-actions">
                  <div className="qdus-rowactions">
                    {u.status === "suspended" ? (
                      <button
                        className="btn btn-ghost"
                        onClick={() =>
                          setConfirmModal({ type: "activate", user: u })
                        }
                      >
                        <FiPlayCircle /> Activate
                      </button>
                    ) : (
                      <button
                        className="btn btn-ghost warn"
                        onClick={() =>
                          setConfirmModal({ type: "suspend", user: u })
                        }
                      >
                        <FiPauseCircle /> Suspend
                      </button>
                    )}
                    <button
                      className="btn btn-ghost"
                      onClick={() => setShowForm({ mode: "edit", user: u })}
                      title="Edit"
                    >
                      <FiEdit2 />
                    </button>
                    <button
                      className="btn btn-ghost danger"
                      onClick={() => setConfirmModal({ type: "delete", user: u })}
                      title="Delete"
                    >
                      <FiTrash2 />
                    </button>
                    <button
                      className="btn btn-icon"
                      title="Send reset password link"
                      onClick={() => alert("Reset password link sent!")}
                    >
                      <FiKey />
                    </button>
                    <button className="btn btn-icon" title="More">
                      <FiMoreVertical />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="qdus-empty">
                  No users match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      {/* Add/Edit Modal */}
      {showForm && (
        <UserFormModal
          mode={showForm.mode}
          user={showForm.user}
          onClose={() => setShowForm(null)}
          onSave={(payload) => {
            if (showForm.user) {
              // edit
              updateUser(showForm.user.id, {
                name: payload.name,
                email: payload.email,
                role: payload.role,
                status: payload.status,
                teams: payload.teams,
                avatarUrl: payload.avatarUrl,
              });
            } else {
              // add
              addUser({
                name: payload.name,
                email: payload.email,
                role: payload.role,
                status: payload.status,
                teams: payload.teams,
                avatarUrl: payload.avatarUrl,
              });
            }
            setShowForm(null);
          }}
        />
      )}

      {/* Confirm Modals */}
      {confirmModal && (
        <ConfirmModal
          kind={confirmModal.type}
          user={confirmModal.user}
          onClose={() => setConfirmModal(null)}
          onConfirm={() => {
            const u = confirmModal.user;
            if (confirmModal.type === "delete") removeUser(u.id);
            if (confirmModal.type === "suspend") updateUser(u.id, { status: "suspended" });
            if (confirmModal.type === "activate") updateUser(u.id, { status: "active" });
            setConfirmModal(null);
          }}
        />
      )}
    </div>
  );
}

/* ----------------- Modals ----------------- */

function UserFormModal({
  mode,
  user,
  onClose,
  onSave,
}: {
  mode: "add" | "edit";
  user?: User;
  onClose: () => void;
  onSave: (payload: {
    name: string;
    email: string;
    role: UserRole;
    status: UserStatus;
    teams: string[];
    avatarUrl?: string;
  }) => void;
}) {
  const [form, setForm] = useState<{
    name: string;
    email: string;
    role: UserRole;
    status: UserStatus;
    teams: string[];
    avatarUrl?: string;
  }>({
    name: user?.name ?? "",
    email: user?.email ?? "",
    role: user?.role ?? "Agent",
    status: user?.status ?? "active",
    teams: user?.teams ?? [],
    avatarUrl: user?.avatarUrl ?? "",
  });

  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const errs = {
    name: !form.name.trim(),
    email: !emailOk(form.email),
    password: mode === "add" ? pwd.length < 8 || pwd !== pwd2 : false,
  };
  const hasErrors = Object.values(errs).some(Boolean);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (hasErrors) return;
    onSave({
      name: form.name.trim(),
      email: form.email.trim(),
      role: form.role,
      status: form.status,
      teams: form.teams,
      avatarUrl: form.avatarUrl,
    });
  }

  return (
    <div className="qdus-modal" role="dialog" aria-modal="true">
      <form className="qdus-modal__panel" onSubmit={submit}>
        <div className="qdus-modal__head">
          <h3>{mode === "add" ? "Add User" : "Edit User"}</h3>
          <button className="btn btn-icon" type="button" onClick={onClose} aria-label="Close">
            <FiX />
          </button>
        </div>

        <div className="qdus-form">
          <div className="qdus-grid-2">
            <label className={`qdus-field ${touched.name && errs.name ? "is-error" : ""}`}>
              <span className="qdus-label">Full Name</span>
              <div className="qdus-input">
                <input
                  value={form.name}
                  onBlur={() => setTouched((t) => ({ ...t, name: true }))}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Jane Doe"
                  required
                />
              </div>
              {touched.name && errs.name && <div className="qdus-hint">Name is required.</div>}
            </label>

            <label className={`qdus-field ${touched.email && errs.email ? "is-error" : ""}`}>
              <span className="qdus-label">Email</span>
              <div className="qdus-input">
                <input
                  type="email"
                  value={form.email}
                  onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="user@company.co.ke"
                  required
                />
              </div>
              {touched.email && errs.email && <div className="qdus-hint">Enter a valid email.</div>}
            </label>
          </div>

          <div className="qdus-grid-3">
            <label className="qdus-field">
              <span className="qdus-label">Role</span>
              <div className="qdus-input">
                <select
                  value={form.role}
                  onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as UserRole }))}
                >
                  {ALL_ROLES.map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
              </div>
            </label>

            <label className="qdus-field">
              <span className="qdus-label">Status</span>
              <div className="qdus-input">
                <select
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as UserStatus }))}
                >
                  <option value="active">Active</option>
                  <option value="invited">Invited</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            </label>

            <label className="qdus-field">
              <span className="qdus-label">Teams (comma separated)</span>
              <div className="qdus-input">
                <input
                  value={form.teams.join(", ")}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      teams: e.target.value
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean),
                    }))
                  }
                  placeholder="Tier 1, Escalations"
                />
              </div>
            </label>
          </div>

          {mode === "add" && (
            <>
              <div className="qdus-grid-2">
                <label className={`qdus-field ${touched.password && errs.password ? "is-error" : ""}`}>
                  <span className="qdus-label">Temporary Password</span>
                  <div className="qdus-input">
                    <input
                      type="password"
                      value={pwd}
                      onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                      onChange={(e) => setPwd(e.target.value)}
                      placeholder="At least 8 characters"
                      minLength={8}
                      required
                    />
                  </div>
                </label>

                <label className={`qdus-field ${touched.password && errs.password ? "is-error" : ""}`}>
                  <span className="qdus-label">Confirm Password</span>
                  <div className="qdus-input">
                    <input
                      type="password"
                      value={pwd2}
                      onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                      onChange={(e) => setPwd2(e.target.value)}
                      minLength={8}
                      required
                    />
                  </div>
                  {touched.password && errs.password && (
                    <div className="qdus-hint">Passwords must match and be at least 8 characters.</div>
                  )}
                </label>
              </div>

              <label className="qdus-check">
                <input type="checkbox" defaultChecked />{" "}
                <span>Require password reset on first login</span>
              </label>
            </>
          )}
        </div>

        <div className="qdus-modal__actions">
          <button type="button" className="btn" onClick={onClose}>
            <FiX /> Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={hasErrors}>
            <FiCheck /> Save
          </button>
        </div>
      </form>
      <div className="qdus-modal__backdrop" onClick={onClose} />
    </div>
  );
}

function ConfirmModal({
  kind,
  user,
  onClose,
  onConfirm,
}: {
  kind: ConfirmKind;
  user: User;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const titles: Record<ConfirmKind, string> = {
    delete: "Delete user?",
    suspend: "Suspend user?",
    activate: "Activate user?",
  };
  const descs: Record<ConfirmKind, string> = {
    delete: "This permanently removes the user and their access.",
    suspend: "User will be unable to sign in until activated.",
    activate: "User will immediately regain access.",
  };

  return (
    <div className="qdus-modal" role="dialog" aria-modal="true">
      <div className="qdus-modal__panel">
        <div className="qdus-modal__head">
          <h3>{titles[kind]}</h3>
          <button className="btn btn-icon" onClick={onClose} aria-label="Close">
            <FiX />
          </button>
        </div>

        <p className="text-muted">
          <strong>{user.name}</strong> &lt;{user.email}&gt; — {descs[kind]}
        </p>

        <div className="qdus-modal__actions">
          <button className="btn" onClick={onClose}>
            <FiX /> Cancel
          </button>
          <button
            className={`btn ${
              kind === "delete" ? "btn-danger" : kind === "suspend" ? "warn" : "btn-primary"
            }`}
            onClick={onConfirm}
          >
            {kind === "delete" ? <FiTrash2 /> : kind === "suspend" ? <FiPauseCircle /> : <FiPlayCircle />}
            {kind === "delete" ? "Delete" : kind === "suspend" ? "Suspend" : "Activate"}
          </button>
        </div>
      </div>
      <div className="qdus-modal__backdrop" onClick={onClose} />
    </div>
  );
}
