import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  FiPlus,
  FiMoreVertical,
  FiUser,
  FiUsers,
  FiGrid,
  FiEdit3,
  FiArchive,
  FiChevronDown,
  FiChevronRight,
  FiLayers,
  FiX,
  FiTrash2,
} from "react-icons/fi";
import "./Departments.css";

/* ===========================
   Types & mock data
   =========================== */
export type Department = {
  id: string;
  name: string;
  manager?: string;
  teams: number;
  users: number;
  createdAt: string; // ISO
  archived?: boolean;
};

type Team = { id: string; name: string; members: number };

type SortKey = "name" | "manager" | "teams" | "users" | "createdAt";
type SortDir = "asc" | "desc";

/** Departments */
const SEED_DEPTS: Department[] = [
  { id: "d1", name: "Support",    manager: "Jane Apondi",  teams: 3, users: 18, createdAt: new Date(Date.now()-86_400_000*400).toISOString() },
  { id: "d2", name: "Engineering",manager: "Brian Otieno", teams: 2, users: 14, createdAt: new Date(Date.now()-86_400_000*620).toISOString() },
  { id: "d3", name: "IT",         manager: "Mary Wanjiru", teams: 1, users: 6,  createdAt: new Date(Date.now()-86_400_000*200).toISOString() },
  { id: "d4", name: "Billing",    manager: "Peter Njoroge",teams: 1, users: 7,  createdAt: new Date(Date.now()-86_400_000*120).toISOString() },
  { id: "d5", name: "Customer Success", manager: "Aisha Noor", teams: 1, users: 9, createdAt: new Date(Date.now()-86_400_000*300).toISOString() },
];

/** Example nested teams per department (mock) */
const TEAMS_BY_DEPT: Record<string, Team[]> = {
  Support: [
    { id: "t1", name: "Tier 1", members: 9 },
    { id: "t2", name: "Tier 2", members: 6 },
    { id: "t3", name: "QA & Escalations", members: 3 },
  ],
  Engineering: [
    { id: "t4", name: "Platform", members: 5 },
    { id: "t5", name: "Web/App", members: 9 },
  ],
  IT: [{ id: "t6", name: "Service Desk", members: 6 }],
  Billing: [{ id: "t7", name: "Payments", members: 7 }],
  "Customer Success": [{ id: "t8", name: "Onboarding", members: 9 }],
};

/* Utility */
function timeAgo(iso: string) {
  const now = Date.now();
  const t = new Date(iso).getTime();
  const s = Math.max(0, Math.floor((now - t) / 1000));
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

/* ===========================
   Component
   =========================== */
export default function DepartmentsTab() {
  const [sp, setSp] = useSearchParams();

  // URL state
  const q = sp.get("dept_q") || "";
  const sortKey = (sp.get("dept_sortKey") as SortKey) || "name";
  const sortDir = (sp.get("dept_sortDir") as SortDir) || "asc";
  const page = Math.max(1, parseInt(sp.get("dept_page") || "1", 10));
  const pageSize = 10;

  // local state
  const [rows, setRows] = useState<Department[]>(SEED_DEPTS);
  const [open, setOpen] = useState<Record<string, boolean>>({}); // expanded rows

  // modal state
  type ModalType = "create" | "edit" | "archive" | "delete" | null;
  const [modal, setModal] = useState<ModalType>(null);
  const [active, setActive] = useState<Department | null>(null);

  const managerOptions = useMemo(
    () =>
      Array.from(new Set(rows.map(r => r.manager).filter(Boolean) as string[])).sort(),
    [rows]
  );

  function update(k: string, v: string) {
    const next = new URLSearchParams(sp);
    if (!v) next.delete(k); else next.set(k, v);
    if (["dept_q", "dept_sortKey", "dept_sortDir"].includes(k)) next.set("dept_page", "1");
    setSp(next, { replace: true });
  }
  function toggleSort(k: SortKey) {
    if (sortKey !== k) { update("dept_sortKey", k); update("dept_sortDir", "asc"); }
    else update("dept_sortDir", sortDir === "asc" ? "desc" : "asc");
  }
  function goto(p: number) {
    const next = new URLSearchParams(sp);
    next.set("dept_page", String(p));
    setSp(next, { replace: true });
  }

  const filtered = useMemo(() => {
    const qn = q.trim().toLowerCase();
    return rows
      .filter(d => !qn || d.name.toLowerCase().includes(qn) || (d.manager || "").toLowerCase().includes(qn))
      .sort((a, b) => {
        const dir = sortDir === "asc" ? 1 : -1;
        switch (sortKey) {
          case "name": return a.name.localeCompare(b.name) * dir;
          case "manager": return (a.manager || "").localeCompare(b.manager || "") * dir;
          case "teams": return (a.teams - b.teams) * dir;
          case "users": return (a.users - b.users) * dir;
          case "createdAt": return ((+new Date(a.createdAt)) - (+new Date(b.createdAt))) * dir;
        }
      });
  }, [rows, q, sortKey, sortDir]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const p = Math.min(page, totalPages);
  const start = (p - 1) * pageSize;
  const end = Math.min(start + pageSize, total);
  const pageItems = filtered.slice(start, end);

  /* ----- actions ----- */
  const openCreate = () => { setActive(null); setModal("create"); };
  const openEdit = (d: Department) => { setActive(d); setModal("edit"); };
  const openArchive = (d: Department) => { setActive(d); setModal("archive"); };
  const openDelete = (d: Department) => { setActive(d); setModal("delete"); };

  function createRow(payload: { name: string; manager?: string }) {
    const now = new Date().toISOString();
    setRows(list => [
      { id: Math.random().toString(36).slice(2,9), name: payload.name, manager: payload.manager, teams: 0, users: 0, createdAt: now, archived: false },
      ...list,
    ]);
    setModal(null);
  }
  function editRow(payload: { name: string; manager?: string }) {
    if (!active) return;
    setRows(list => list.map(r => r.id === active.id ? { ...r, ...payload } : r));
    setModal(null);
  }
  function archiveRowConfirm() {
    if (!active) return;
    setRows(list => list.map(r => r.id === active.id ? { ...r, archived: !r.archived } : r));
    setModal(null);
  }
  function deleteRowConfirm() {
    if (!active) return;
    setRows(list => list.filter(r => r.id !== active.id));
    setModal(null);
  }

  function jumpToUsers(filter: string) {
    const next = new URLSearchParams(sp);
    next.set("tab","users");
    next.set("q", filter);
    next.delete("dept_q");
    setSp(next, { replace: true });
  }

  return (
    <div className="dept-root">
      {/* Top bar */}
      <div className="dept-bar">
        <div className="dept-search">
          <input
            value={q}
            onChange={(e) => update("dept_q", e.target.value)}
            placeholder="Search departments or managers…"
          />
        </div>
        <div className="dept-actions">
          <button className="btn btn-primary" onClick={openCreate}>
            <FiPlus /> New Department
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="dept-table">
        <div className="dept-head">
          {/* spacer for the expander column */}
          <div className="h expander" aria-hidden="true" />

          <button className="h name" onClick={() => toggleSort("name")}><FiGrid /> Department</button>
          <button className="h manager" onClick={() => toggleSort("manager")}><FiUser /> Manager</button>
          <button className="h num" onClick={() => toggleSort("teams")}>Teams</button>
          <button className="h num" onClick={() => toggleSort("users")}><FiUsers /> Users</button>
          <button className="h created" onClick={() => toggleSort("createdAt")}>Created</button>
          <div className="h act" />
        </div>

        {/* Rows */}
        {pageItems.map((d) => {
          const isOpen = !!open[d.id];
          const teams = TEAMS_BY_DEPT[d.name] || [];
          return (
            <div key={d.id} className={`dept-group ${isOpen ? "open" : ""}`}>
              <div className={`dept-row ${d.archived ? "is-archived" : ""}`}>
                <button
                  className="cell expander"
                  onClick={() => setOpen(o => ({ ...o, [d.id]: !o[d.id] }))}
                  aria-label={isOpen ? "Collapse" : "Expand"}
                  title={isOpen ? "Collapse" : "Expand"}
                >
                  {isOpen ? <FiChevronDown /> : <FiChevronRight />}
                </button>

                <div className="cell name">
                  <div className="title" onClick={() => jumpToUsers(d.name)}>{d.name}</div>
                  <div className="meta">
                    <span className={`badge ${d.archived ? "arch" : "ok"}`}>{d.archived ? "Archived" : "Active"}</span>
                    <span className="dot">•</span>
                    <span className="muted">Updated {timeAgo(d.createdAt)}</span>
                  </div>
                </div>

                <div className="cell manager">{d.manager || "—"}</div>
                <div className="cell num">{d.teams}</div>
                <div className="cell num">{d.users}</div>
                <div className="cell created">{timeAgo(d.createdAt)}</div>

                <div className="cell act">
                  <button className="iconbtn" title="Edit" onClick={() => openEdit(d)}><FiEdit3 /></button>
                  <button className="iconbtn" title={d.archived ? "Unarchive" : "Archive"} onClick={() => openArchive(d)}><FiArchive /></button>
                  <button className="iconbtn" title="Delete" onClick={() => openDelete(d)}><FiTrash2 /></button>
                  <button className="iconbtn" title="More"><FiMoreVertical /></button>
                </div>
              </div>

              {/* Nested teams panel */}
              {isOpen && (
                <div className="dept-nested">
                  {teams.length === 0 ? (
                    <div className="nested-empty">
                      <FiLayers />
                      <span>No teams yet</span>
                      <button className="btn small" onClick={() => alert("Add team (mock)")}>
                        <FiPlus /> Add Team
                      </button>
                    </div>
                  ) : (
                    <div className="teams-grid">
                      {teams.map((t) => (
                        <div key={t.id} className="team-chip">
                          <div className="left">
                            <span className="dot" />
                            <span className="name">{t.name}</span>
                          </div>
                          <div className="right">
                            <button className="mini" title="View users in this team" onClick={() => jumpToUsers(t.name)}>
                              <FiUsers /> {t.members}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {total === 0 && (
          <div className="dept-empty">
            <div className="icon"><FiGrid /></div>
            <h3>No departments found</h3>
            <p className="text-muted">Try clearing search or create a new department.</p>
          </div>
        )}
      </div>

      {/* Pager */}
      <div className="dept-pager">
        <div className="info">
          {total > 0 ? <>Showing <b>{start + 1}</b>–<b>{end}</b> of <b>{total}</b></> : "No results"}
        </div>
        <div className="ctrls">
          <button className="btn" disabled={p <= 1} onClick={() => goto(1)}>« First</button>
          <button className="btn" disabled={p <= 1} onClick={() => goto(p - 1)}>‹ Prev</button>
          <span className="pg">{p}/{totalPages}</span>
          <button className="btn" disabled={p >= totalPages} onClick={() => goto(p + 1)}>Next ›</button>
          <button className="btn" disabled={p >= totalPages} onClick={() => goto(totalPages)}>Last »</button>
        </div>
      </div>

      {/* ===== Modals ===== */}
      {modal === "create" && (
        <DepartmentEditorModal
          title="Create Department"
          managerOptions={managerOptions}
          onCancel={() => setModal(null)}
          onSubmit={(vals) => createRow(vals)}
        />
      )}

      {modal === "edit" && active && (
        <DepartmentEditorModal
          title="Edit Department"
          managerOptions={managerOptions}
          initial={{ name: active.name, manager: active.manager || "" }}
          onCancel={() => { setActive(null); setModal(null); }}
          onSubmit={(vals) => editRow(vals)}
        />
      )}

      {modal === "archive" && active && (
        <ConfirmModal
          tone={active.archived ? "neutral" : "warning"}
          title={active.archived ? "Unarchive department?" : "Archive department?"}
          body={
            active.archived
              ? <>This department will be restored and visible to agents.</>
              : <>The department <b>{active.name}</b> will be archived. You can unarchive it later.</>
          }
          confirmLabel={active.archived ? "Unarchive" : "Archive"}
          onCancel={() => { setActive(null); setModal(null); }}
          onConfirm={() => archiveRowConfirm()}
        />
      )}

      {modal === "delete" && active && (
        <ConfirmModal
          tone="danger"
          title="Delete department?"
          body={<>This action cannot be undone. The department <b>{active.name}</b> will be permanently deleted.</>}
          confirmLabel="Delete"
          onCancel={() => { setActive(null); setModal(null); }}
          onConfirm={() => deleteRowConfirm()}
        />
      )}
    </div>
  );
}

/* ===========================
   Modal components
   =========================== */

function DepartmentEditorModal({
  title,
  initial,
  managerOptions,
  onCancel,
  onSubmit,
}: {
  title: string;
  initial?: { name: string; manager?: string };
  managerOptions: string[];
  onCancel: () => void;
  onSubmit: (v: { name: string; manager?: string }) => void;
}) {
  const [name, setName] = useState(initial?.name || "");
  const [manager, setManager] = useState(initial?.manager || "");

  const valid = name.trim().length > 1;

  function submit() {
    if (!valid) return;
    onSubmit({ name: name.trim(), manager: manager.trim() || undefined });
  }

  return (
    <>
      <div className="dm-modal__backdrop" onClick={onCancel} />
      <div className="dm-modal panel" role="dialog" aria-modal="true" aria-label={title}>
        <div className="dm-modal__head">
          <h3>{title}</h3>
          <button className="iconbtn" onClick={onCancel} aria-label="Close"><FiX /></button>
        </div>

        <div className="dm-modal__body">
          <div className="grid">
            <div className="field">
              <label>Department name <span className="req">*</span></label>
              <input className="dm-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Customer Success" />
            </div>
            <div className="field">
              <label>Manager</label>
              <input className="dm-input" list="dept-managers" value={manager} onChange={(e) => setManager(e.target.value)} placeholder="Optional" />
              <datalist id="dept-managers">
                {managerOptions.map(m => <option key={m} value={m} />)}
              </datalist>
            </div>
          </div>
        </div>

        <div className="dm-modal__foot">
          <button className="btn" onClick={onCancel}>Cancel</button>
          <button className="btn btn-primary" disabled={!valid} onClick={submit}>Save</button>
        </div>
      </div>
    </>
  );
}

function ConfirmModal({
  tone = "neutral",
  title,
  body,
  confirmLabel,
  onCancel,
  onConfirm,
}: {
  tone?: "neutral" | "warning" | "danger";
  title: string;
  body: React.ReactNode;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <>
      <div className="dm-modal__backdrop" onClick={onCancel} />
      <div className={`dm-modal panel ${tone}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="dm-modal__head">
          <h3>{title}</h3>
          <button className="iconbtn" onClick={onCancel} aria-label="Close"><FiX /></button>
        </div>

        <div className="dm-modal__body">
          <p className="text-muted" style={{ margin: 0 }}>{body}</p>
        </div>

        <div className="dm-modal__foot">
          <button className="btn" onClick={onCancel}>Cancel</button>
          <button
            className={`btn ${tone === "danger" ? "btn-danger" : "btn-primary"}`}
            onClick={onConfirm}
          >
            {tone === "danger" ? <FiTrash2 /> : <FiArchive />} {confirmLabel}
          </button>
        </div>
      </div>
    </>
  );
}
