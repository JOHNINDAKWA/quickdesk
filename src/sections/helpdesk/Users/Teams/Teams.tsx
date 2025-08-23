import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  FiPlus,
  FiUsers,
  FiUser,
  FiGrid,
  FiMoreVertical,
  FiEdit3,
  FiArchive,
  FiLayers,
  FiX,
  FiTrash2,
} from "react-icons/fi";
import "./Teams.css";

/* ===========================
   Types & mock
   =========================== */
export type Team = {
  id: string;
  name: string;
  department: string;
  lead?: string;
  users: number;
  createdAt: string; // ISO
  archived?: boolean;
};

type SortKey = "name" | "department" | "lead" | "users" | "createdAt";
type SortDir = "asc" | "desc";

const SEED_TEAMS: Team[] = [
  { id: "t1", name: "Tier 1",     department: "Support",    lead: "Jane Apondi",  users: 9, createdAt: new Date(Date.now()-86_400_000*340).toISOString() },
  { id: "t2", name: "Tier 2",     department: "Support",    lead: "Mary Wanjiru", users: 6, createdAt: new Date(Date.now()-86_400_000*280).toISOString() },
  { id: "t3", name: "Platform",   department: "Engineering",lead: "Brian Otieno", users: 5, createdAt: new Date(Date.now()-86_400_000*500).toISOString() },
  { id: "t4", name: "Payments",   department: "Billing",    lead: "Peter Njoroge",users: 4, createdAt: new Date(Date.now()-86_400_000*210).toISOString() },
];

/* ===========================
   Page
   =========================== */
export default function TeamsTab() {
  const [sp, setSp] = useSearchParams();
  const q = sp.get("team_q") || "";
  const sortKey = (sp.get("team_sortKey") as SortKey) || "name";
  const sortDir = (sp.get("team_sortDir") as SortDir) || "asc";
  const page = Math.max(1, parseInt(sp.get("team_page") || "1", 10));
  const pageSize = 10;

  const [rows, setRows] = useState<Team[]>(SEED_TEAMS);

  // Modal state
  type ModalType = "create" | "edit" | "archive" | "delete" | null;
  const [modal, setModal] = useState<ModalType>(null);
  const [active, setActive] = useState<Team | null>(null);

  const departmentOptions = useMemo(
    () => Array.from(new Set(rows.map((r) => r.department))).sort(),
    [rows]
  );

  function update(k: string, v: string) {
    const nx = new URLSearchParams(sp);
    if (!v) nx.delete(k);
    else nx.set(k, v);
    if (["team_q", "team_sortKey", "team_sortDir"].includes(k)) nx.set("team_page", "1");
    setSp(nx, { replace: true });
  }
  function toggleSort(k: SortKey) {
    if (sortKey !== k) { update("team_sortKey", k); update("team_sortDir", "asc"); }
    else update("team_sortDir", sortDir === "asc" ? "desc" : "asc");
  }
  function goto(p: number) {
    const nx = new URLSearchParams(sp);
    nx.set("team_page", String(p));
    setSp(nx, { replace: true });
  }

  const filtered = useMemo(() => {
    const qn = q.trim().toLowerCase();
    return rows
      .filter(t =>
        !qn ||
        t.name.toLowerCase().includes(qn) ||
        t.department.toLowerCase().includes(qn) ||
        (t.lead || "").toLowerCase().includes(qn)
      )
      .sort((a, b) => {
        const dir = sortDir === "asc" ? 1 : -1;
        switch (sortKey) {
          case "name": return a.name.localeCompare(b.name) * dir;
          case "department": return a.department.localeCompare(b.department) * dir;
          case "lead": return (a.lead || "").localeCompare(b.lead || "") * dir;
          case "users": return (a.users - b.users) * dir;
          case "createdAt": return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * dir;
        }
      });
  }, [rows, q, sortKey, sortDir]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const p = Math.min(page, totalPages);
  const start = (p - 1) * pageSize;
  const end = Math.min(start + pageSize, total);
  const pageItems = filtered.slice(start, end);

  /* ----- Row actions ----- */
  function openCreate() { setActive(null); setModal("create"); }
  function openEdit(t: Team) { setActive(t); setModal("edit"); }
  function openArchive(t: Team) { setActive(t); setModal("archive"); }
  function openDelete(t: Team) { setActive(t); setModal("delete"); }

  function jumpToUsers(filter: string) {
    const nx = new URLSearchParams(sp);
    nx.set("tab", "users");
    nx.set("q", filter);
    nx.delete("team_q");
    setSp(nx, { replace: true });
  }

  // Mutations
  function doCreate(payload: { name: string; department: string; lead?: string }) {
    const now = new Date().toISOString();
    setRows(list => [
      { id: Math.random().toString(36).slice(2, 9), users: 0, archived: false, createdAt: now, ...payload },
      ...list,
    ]);
    setModal(null);
  }
  function doEdit(payload: { name: string; department: string; lead?: string }) {
    if (!active) return;
    setRows(list => list.map(r => r.id === active.id ? { ...r, ...payload } : r));
    setModal(null);
  }
  function doArchive() {
    if (!active) return;
    setRows(list => list.map(r => r.id === active.id ? { ...r, archived: !r.archived } : r));
    setModal(null);
  }
  function doDelete() {
    if (!active) return;
    setRows(list => list.filter(r => r.id !== active.id));
    setModal(null);
  }

  return (
    <div className="team-root">
      {/* Top bar */}
      <div className="team-bar">
        <div className="team-search">
          <input
            value={q}
            onChange={(e) => update("team_q", e.target.value)}
            placeholder="Search teams, departments, leads…"
          />
        </div>
        <div className="team-actions">
          <button className="btn btn-primary" onClick={openCreate}>
            <FiPlus /> New Team
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="team-list">
        <div className="team-head">
          <button className="h name" onClick={() => toggleSort("name")}><FiLayers /> Team</button>
          <button className="h dept" onClick={() => toggleSort("department")}><FiGrid /> Department</button>
          <button className="h lead" onClick={() => toggleSort("lead")}><FiUser /> Lead</button>
          <button className="h users" onClick={() => toggleSort("users")}><FiUsers /> Users</button>
          <button className="h created" onClick={() => toggleSort("createdAt")}>Created</button>
          <div className="h act" />
        </div>

        {pageItems.map((t) => (
          <div key={t.id} className={`team-row ${t.archived ? "is-archived" : ""}`}>
            <button className="cell name" onClick={() => jumpToUsers(t.name)} title="Show users in this team">
              <div className="main">
                {t.name}
                {t.archived && <span className="arch-tag">Archived</span>}
              </div>
              <div className="sub">{t.department}</div>
            </button>

            <button className="cell dept link" onClick={() => jumpToUsers(t.department)}>{t.department}</button>
            <div className="cell lead">{t.lead || "—"}</div>
            <div className="cell users">{t.users}</div>
            <div className="cell created">{new Date(t.createdAt).toLocaleDateString()}</div>
            <div className="cell act">
              <button className="iconbtn" title="Edit" onClick={() => openEdit(t)}><FiEdit3 /></button>
              <button className="iconbtn" title={t.archived ? "Unarchive" : "Archive"} onClick={() => openArchive(t)}><FiArchive /></button>
              <button className="iconbtn" title="Delete" onClick={() => openDelete(t)}><FiTrash2 /></button>
              <button className="iconbtn" title="More"><FiMoreVertical /></button>
            </div>
          </div>
        ))}

        {total === 0 && (
          <div className="team-empty">
            <div className="icon"><FiLayers /></div>
            <h3>No teams found</h3>
            <p className="text-muted">Try clearing search or create a new team.</p>
          </div>
        )}
      </div>

      {/* Pager */}
      <div className="team-pager">
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
        <TeamEditorModal
          title="Create Team"
          departmentOptions={departmentOptions}
          onCancel={() => setModal(null)}
          onSubmit={(vals) => doCreate(vals)}
        />
      )}

      {modal === "edit" && active && (
        <TeamEditorModal
          title="Edit Team"
          departmentOptions={departmentOptions}
          initial={{ name: active.name, department: active.department, lead: active.lead || "" }}
          onCancel={() => { setActive(null); setModal(null); }}
          onSubmit={(vals) => doEdit(vals)}
        />
      )}

      {modal === "archive" && active && (
        <ConfirmModal
          tone={active.archived ? "neutral" : "warning"}
          title={active.archived ? "Unarchive team?" : "Archive team?"}
          body={
            active.archived
              ? <>This team will be restored and visible to agents.</>
              : <>The team <b>{active.name}</b> will be archived. You can unarchive it later.</>
          }
          confirmLabel={active.archived ? "Unarchive" : "Archive"}
          onCancel={() => { setActive(null); setModal(null); }}
          onConfirm={() => doArchive()}
        />
      )}

      {modal === "delete" && active && (
        <ConfirmModal
          tone="danger"
          title="Delete team?"
          body={
            <>This action cannot be undone. The team <b>{active.name}</b> will be permanently deleted.</>
          }
          confirmLabel="Delete"
          onCancel={() => { setActive(null); setModal(null); }}
          onConfirm={() => doDelete()}
        />
      )}
    </div>
  );
}

/* ===========================
   Modals
   =========================== */

function TeamEditorModal({
  title,
  initial,
  departmentOptions,
  onCancel,
  onSubmit,
}: {
  title: string;
  initial?: { name: string; department: string; lead?: string };
  departmentOptions: string[];
  onCancel: () => void;
  onSubmit: (v: { name: string; department: string; lead?: string }) => void;
}) {
  const [name, setName] = useState(initial?.name || "");
  const [dept, setDept] = useState(initial?.department || (departmentOptions[0] || ""));
  const [lead, setLead] = useState(initial?.lead || "");

  const valid = name.trim().length > 1 && dept.trim().length > 0;

  function submit() {
    if (!valid) return;
    onSubmit({ name: name.trim(), department: dept.trim(), lead: lead.trim() || undefined });
  }

  return (
    <>
      <div className="tm-modal__backdrop" onClick={onCancel} />
      <div className="tm-modal panel" role="dialog" aria-modal="true" aria-label={title}>
        <div className="tm-modal__head">
          <h3>{title}</h3>
          <button className="iconbtn" onClick={onCancel} aria-label="Close"><FiX /></button>
        </div>

        <div className="tm-modal__body">
          <div className="grid">
            <div className="field">
              <label>Team name <span className="req">*</span></label>
              <input className="tm-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Tier 3" />
            </div>
            <div className="field">
              <label>Department <span className="req">*</span></label>
              {/* text input + datalist for quick selection or free-typing */}
              <input className="tm-input" list="team-depts" value={dept} onChange={(e) => setDept(e.target.value)} placeholder="Select or type…" />
              <datalist id="team-depts">
                {departmentOptions.map((d) => <option key={d} value={d} />)}
              </datalist>
            </div>
            <div className="field">
              <label>Team lead</label>
              <input className="tm-input" value={lead} onChange={(e) => setLead(e.target.value)} placeholder="Optional" />
            </div>
          </div>
        </div>

        <div className="tm-modal__foot">
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
      <div className="tm-modal__backdrop" onClick={onCancel} />
      <div className={`tm-modal panel ${tone}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="tm-modal__head">
          <h3>{title}</h3>
          <button className="iconbtn" onClick={onCancel} aria-label="Close"><FiX /></button>
        </div>

        <div className="tm-modal__body">
          <p className="text-muted" style={{ margin: 0 }}>{body}</p>
        </div>

        <div className="tm-modal__foot">
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
