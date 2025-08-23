import { useMemo, useState } from "react";
import {
  FiPlus,
  FiShield,
  FiUsers,
  FiEdit3,
  FiArchive,
  FiTrash2,
  FiSearch,
  FiX,
  FiCheck,
} from "react-icons/fi";
import { FaClone } from "react-icons/fa6";

import "./Roles.css";

/* =========================================================
   Types
   ======================================================= */
type PermissionKey =
  // Tickets
  | "tickets.view"
  | "tickets.reply"
  | "tickets.assign"
  | "tickets.escalate"
  | "tickets.update"
  | "tickets.delete"
  // Users
  | "users.view"
  | "users.create"
  | "users.edit"
  | "users.suspend"
  | "users.delete"
  // Depts/Teams
  | "org.depts.view"
  | "org.depts.manage"
  | "org.teams.view"
  | "org.teams.manage"
  // Knowledge
  | "kb.view"
  | "kb.edit"
  | "kb.publish"
  // Reports
  | "reports.view"
  | "reports.export"
  // Settings / Admin
  | "settings.view"
  | "settings.manage"
  | "roles.manage";

type Role = {
  id: string;
  name: string;
  description?: string;
  usersCount: number;
  system?: boolean;     // built-in; limit deletion
  archived?: boolean;
  permissions: Record<PermissionKey, boolean>;
};

type Category = {
  key: string;
  label: string;
  perms: { key: PermissionKey; label: string; hint?: string }[];
};

/* =========================================================
   Permission Catalog (grouped)
   ======================================================= */
const CATS: Category[] = [
  {
    key: "tickets",
    label: "Tickets",
    perms: [
      { key: "tickets.view", label: "View", hint: "See tickets" },
      { key: "tickets.reply", label: "Reply", hint: "Public/internal replies" },
      { key: "tickets.assign", label: "Assign", hint: "Change assignee/teams" },
      { key: "tickets.escalate", label: "Escalate" },
      { key: "tickets.update", label: "Update", hint: "Edit metadata" },
      { key: "tickets.delete", label: "Delete", hint: "Hard delete" },
    ],
  },
  {
    key: "users",
    label: "Users",
    perms: [
      { key: "users.view", label: "View" },
      { key: "users.create", label: "Create" },
      { key: "users.edit", label: "Edit" },
      { key: "users.suspend", label: "Suspend" },
      { key: "users.delete", label: "Delete" },
    ],
  },
  {
    key: "org",
    label: "Departments & Teams",
    perms: [
      { key: "org.depts.view", label: "View Departments" },
      { key: "org.depts.manage", label: "Manage Departments" },
      { key: "org.teams.view", label: "View Teams" },
      { key: "org.teams.manage", label: "Manage Teams" },
    ],
  },
  {
    key: "kb",
    label: "Knowledge Base",
    perms: [
      { key: "kb.view", label: "View Articles" },
      { key: "kb.edit", label: "Edit Drafts" },
      { key: "kb.publish", label: "Publish" },
    ],
  },
  {
    key: "reports",
    label: "Reports",
    perms: [
      { key: "reports.view", label: "View Reports" },
      { key: "reports.export", label: "Export CSV" },
    ],
  },
  {
    key: "admin",
    label: "Admin & Settings",
    perms: [
      { key: "settings.view", label: "View Settings" },
      { key: "settings.manage", label: "Manage Settings" },
      { key: "roles.manage", label: "Manage Roles & Permissions" },
    ],
  },
];

/* =========================================================
   Seed roles
   ======================================================= */
const allPerms: PermissionKey[] = CATS.flatMap((c) => c.perms.map((p) => p.key));

function allowAll(): Record<PermissionKey, boolean> {
  return Object.fromEntries(allPerms.map((k) => [k, true])) as Record<PermissionKey, boolean>;
}
function none(): Record<PermissionKey, boolean> {
  return Object.fromEntries(allPerms.map((k) => [k, false])) as Record<PermissionKey, boolean>;
}

const SEED_ROLES: Role[] = [
  {
    id: "r-admin",
    name: "Admin",
    description: "Full access to everything.",
    usersCount: 3,
    system: true,
    permissions: allowAll(),
  },
  {
    id: "r-agent",
    name: "Agent",
    description: "Work tickets, limited org visibility.",
    usersCount: 14,
    permissions: {
      ...none(),
      "tickets.view": true,
      "tickets.reply": true,
      "tickets.assign": true,
      "tickets.escalate": true,
      "tickets.update": true,
      "users.view": true,
      "org.depts.view": true,
      "org.teams.view": true,
      "kb.view": true,
      "kb.edit": true,
      "reports.view": true,
      "settings.view": true,
    },
  },
  {
    id: "r-viewer",
    name: "Viewer",
    description: "Read-only across tickets and reports.",
    usersCount: 5,
    permissions: {
      ...none(),
      "tickets.view": true,
      "kb.view": true,
      "reports.view": true,
      "settings.view": true,
    },
  },
  {
    id: "r-billing",
    name: "Billing Analyst",
    description: "Focused on payments and reports.",
    usersCount: 2,
    permissions: {
      ...none(),
      "tickets.view": true,
      "reports.view": true,
      "reports.export": true,
    },
  },
];

/* =========================================================
   Page
   ======================================================= */
export default function RolesTab() {
  const [roles, setRoles] = useState<Role[]>(SEED_ROLES);
  const [q, setQ] = useState("");
  const [selectedId, setSelectedId] = useState<string>(roles[0]?.id || "");
  const selected = roles.find((r) => r.id === selectedId) || null;

  // Editing buffer for the selected role
  const [draft, setDraft] = useState<Role | null>(selected ? { ...selected, permissions: { ...selected.permissions } } : null);
  const dirty = useMemo(() => {
    if (!selected || !draft) return false;
    if (selected.name !== draft.name || (selected.description || "") !== (draft.description || "")) return true;
    for (const k of allPerms) {
      if (!!selected.permissions[k] !== !!draft.permissions[k]) return true;
    }
    return false;
  }, [selected, draft]);

  // Modal state
  type ModalKind = "create" | "editMeta" | "clone" | "archive" | "delete" | null;
  const [modal, setModal] = useState<ModalKind>(null);

  // Sync draft when selection changes
  function pickRole(id: string) {
    const r = roles.find((x) => x.id === id) || null;
    setSelectedId(id);
    setDraft(r ? { ...r, permissions: { ...r.permissions } } : null);
  }

  // Roles list (filter)
  const filtered = useMemo(() => {
    const qn = q.trim().toLowerCase();
    return roles
      .filter((r) => !qn || r.name.toLowerCase().includes(qn) || (r.description || "").toLowerCase().includes(qn))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [roles, q]);

  // Permission helpers
  function togglePerm(k: PermissionKey) {
    if (!draft) return;
    setDraft({ ...draft, permissions: { ...draft.permissions, [k]: !draft.permissions[k] } });
  }
  function setCategory(cat: Category, v: boolean) {
    if (!draft) return;
    const next = { ...draft.permissions };
    for (const p of cat.perms) next[p.key] = v;
    setDraft({ ...draft, permissions: next });
  }
  function isCatAll(cat: Category) {
    if (!draft) return false;
    return cat.perms.every((p) => !!draft.permissions[p.key]);
  }
  function isCatSome(cat: Category) {
    if (!draft) return false;
    const vals = cat.perms.map((p) => !!draft.permissions[p.key]);
    return vals.some(Boolean) && !vals.every(Boolean);
  }

  // Presets (quick apply)
  function applyPreset(kind: "viewer" | "agent" | "admin") {
    if (!draft) return;
    if (kind === "admin") setDraft({ ...draft, permissions: allowAll() });
    else if (kind === "viewer")
      setDraft({
        ...draft,
        permissions: {
          ...none(),
          "tickets.view": true,
          "kb.view": true,
          "reports.view": true,
          "settings.view": true,
        },
      });
    else if (kind === "agent")
      setDraft({
        ...draft,
        permissions: {
          ...none(),
          "tickets.view": true,
          "tickets.reply": true,
          "tickets.assign": true,
          "tickets.escalate": true,
          "tickets.update": true,
          "users.view": true,
          "org.depts.view": true,
          "org.teams.view": true,
          "kb.view": true,
          "kb.edit": true,
          "reports.view": true,
          "settings.view": true,
        },
      });
  }

  // Save / mutations
  function save() {
    if (!selected || !draft) return;
    setRoles((list) => list.map((r) => (r.id === selected.id ? { ...draft } : r)));
  }
  function createRole(payload: { name: string; description?: string }) {
    const id = Math.random().toString(36).slice(2, 9);
    const role: Role = { id, name: payload.name.trim(), description: payload.description?.trim(), usersCount: 0, permissions: none() };
    setRoles((list) => [role, ...list]);
    setModal(null);
    pickRole(id);
  }
  function editMeta(payload: { name: string; description?: string }) {
    if (!selected || !draft) return;
    setDraft({ ...draft, name: payload.name.trim(), description: payload.description?.trim() });
    setRoles((list) => list.map((r) => (r.id === selected.id ? { ...r, name: payload.name.trim(), description: payload.description?.trim() } : r)));
    setModal(null);
  }
  function cloneRole(payload: { name: string; description?: string }) {
    if (!selected || !draft) return;
    const id = Math.random().toString(36).slice(2, 9);
    const role: Role = {
      id,
      name: payload.name.trim(),
      description: payload.description?.trim() || draft.description,
      usersCount: 0,
      permissions: { ...draft.permissions },
    };
    setRoles((list) => [role, ...list]);
    setModal(null);
    pickRole(id);
  }
  function toggleArchive() {
    if (!selected) return;
    setRoles((list) => list.map((r) => (r.id === selected.id ? { ...r, archived: !r.archived } : r)));
    setModal(null);
  }
  function deleteRole() {
    if (!selected) return;
    const next = roles.filter((r) => r.id !== selected.id);
    setRoles(next);
    setModal(null);
    if (next.length) pickRole(next[0].id);
    else {
      setSelectedId("");
      setDraft(null);
    }
  }

  return (
    <div className="roles-root panel" style={{ padding: 0 }}>
      {/* Top bar */}
      <div className="roles-top">
        <div className="roles-search">
          <FiSearch className="icon" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search roles…" />
        </div>
        <div className="roles-actions">
          <button className="btn btn-primary" onClick={() => setModal("create")}>
            <FiPlus /> New Role
          </button>
        </div>
      </div>

      {/* Two-pane */}
      <div className="roles-main">
        {/* Left: roles list */}
        <aside className="roles-list">
          <div className="roles-list__head">
            <span><FiShield /> Roles</span>
            <span className="muted">{filtered.length}</span>
          </div>

          <div className="roles-scroll">
            {filtered.map((r) => (
              <button
                key={r.id}
                className={`role-item ${r.id === selectedId ? "active" : ""} ${r.archived ? "archived" : ""}`}
                onClick={() => pickRole(r.id)}
              >
                <div className="title">
                  {r.name}
                  {r.system && <span className="chip sys">System</span>}
                  {r.archived && <span className="chip arch">Archived</span>}
                </div>
                {r.description && <div className="desc">{r.description}</div>}
                <div className="meta"><FiUsers /> {r.usersCount} users</div>
              </button>
            ))}

            {filtered.length === 0 && (
              <div className="roles-empty">
                <FiShield />
                <p>No roles match.</p>
              </div>
            )}
          </div>
        </aside>

        {/* Right: editor */}
        <section className="roles-editor">
          {!selected || !draft ? (
            <div className="roles-empty big">
              <FiShield />
              <p>Select a role on the left, or create one.</p>
            </div>
          ) : (
            <>
              {/* Header / meta */}
              <div className="re-head">
                <div className="re-title">
                  <h3>{draft.name}</h3>
                  {draft.description ? <p className="text-muted">{draft.description}</p> : null}
                </div>

                <div className="re-actions">
                  <button className="btn" onClick={() => setModal("editMeta")}><FiEdit3 /> Edit</button>
                  <button className="btn" onClick={() => setModal("clone")}><FaClone /> Clone</button>
                  <button className="btn" onClick={() => setModal("archive")}>
                    <FiArchive /> {selected.archived ? "Unarchive" : "Archive"}
                  </button>
                  <button className="btn btn-danger" disabled={selected.system} onClick={() => setModal("delete")}>
                    <FiTrash2 /> Delete
                  </button>
                </div>
              </div>

              {/* Presets */}
              <div className="re-presets">
                <span className="muted">Quick presets:</span>
                <div className="preset-row">
                  <button className="tag" onClick={() => applyPreset("viewer")}>Viewer</button>
                  <button className="tag" onClick={() => applyPreset("agent")}>Agent</button>
                  <button className="tag" onClick={() => applyPreset("admin")}>Admin</button>
                </div>
              </div>

              {/* Permission matrix */}
              <div className="perm-grid">
                {CATS.map((cat) => {
                  const all = isCatAll(cat);
                  const some = isCatSome(cat);
                  return (
                    <div key={cat.key} className="perm-card">
                      <div className="perm-card__head">
                        <div className="title">{cat.label}</div>
                        <button
                          className={`switch ${all ? "on" : some ? "mixed" : ""}`}
                          onClick={() => setCategory(cat, !all)}
                          aria-pressed={all}
                          title={all ? "Disable all in category" : "Enable all in category"}
                        >
                          <span />
                        </button>
                      </div>

                      <div className="perm-list">
                        {cat.perms.map((p) => {
                          const on = !!draft.permissions[p.key];
                          return (
                            <label key={p.key} className="perm-row">
                              <div className="info">
                                <div className="name">{p.label}</div>
                                {p.hint && <div className="hint">{p.hint}</div>}
                              </div>
                              <button
                                type="button"
                                className={`toggle ${on ? "on" : ""}`}
                                aria-pressed={on}
                                onClick={() => togglePerm(p.key)}
                              >
                                <span className="knob" />
                              </button>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Save bar */}
              <div className={`savebar ${dirty ? "show" : ""}`}>
                <div className="state">
                  {dirty ? (
                    <>
                      <span className="dot" /> Unsaved changes
                    </>
                  ) : (
                    <>
                      <FiCheck /> All changes saved
                    </>
                  )}
                </div>
                <div className="actions">
                  <button className="btn" disabled={!dirty} onClick={() => pickRole(selectedId)}>Reset</button>
                  <button className="btn btn-primary" disabled={!dirty} onClick={save}>Save changes</button>
                </div>
              </div>
            </>
          )}
        </section>
      </div>

      {/* =================== Modals =================== */}
      {modal === "create" && (
        <RoleMetaModal
          title="Create Role"
          onCancel={() => setModal(null)}
          onSubmit={(v) => createRole(v)}
        />
      )}
      {modal === "editMeta" && selected && (
        <RoleMetaModal
          title="Edit Role"
          initial={{ name: draft?.name || selected.name, description: draft?.description || selected.description || "" }}
          onCancel={() => setModal(null)}
          onSubmit={(v) => editMeta(v)}
        />
      )}
      {modal === "clone" && selected && (
        <RoleMetaModal
          title="Clone Role"
          initial={{ name: `${draft?.name || selected.name} (Copy)`, description: draft?.description || selected.description || "" }}
          onCancel={() => setModal(null)}
          onSubmit={(v) => cloneRole(v)}
        />
      )}
      {modal === "archive" && selected && (
        <ConfirmModal
          tone={selected.archived ? "neutral" : "warning"}
          title={selected.archived ? "Unarchive role?" : "Archive role?"}
          body={
            selected.archived
              ? <>This role will be restored and usable again.</>
              : <>The role <b>{selected.name}</b> will be archived. You can unarchive it later.</>
          }
          confirmLabel={selected.archived ? "Unarchive" : "Archive"}
          onCancel={() => setModal(null)}
          onConfirm={toggleArchive}
        />
      )}
      {modal === "delete" && selected && (
        <ConfirmModal
          tone="danger"
          title="Delete role?"
          body={<>This action cannot be undone. The role <b>{selected.name}</b> will be permanently deleted.</>}
          confirmLabel="Delete"
          onCancel={() => setModal(null)}
          onConfirm={deleteRole}
          disabled={selected.system}
        />
      )}
    </div>
  );
}

/* =========================================================
   Modal components
   ======================================================= */
function RoleMetaModal({
  title,
  initial,
  onCancel,
  onSubmit,
}: {
  title: string;
  initial?: { name: string; description?: string };
  onCancel: () => void;
  onSubmit: (v: { name: string; description?: string }) => void;
}) {
  const [name, setName] = useState(initial?.name || "");
  const [desc, setDesc] = useState(initial?.description || "");
  const valid = name.trim().length > 1;

  function submit() {
    if (!valid) return;
    onSubmit({ name: name.trim(), description: desc.trim() || undefined });
  }

  return (
    <>
      <div className="roles-modal__backdrop" onClick={onCancel} />
      <div className="roles-modal panel" role="dialog" aria-modal="true" aria-label={title}>
        <div className="roles-modal__head">
          <h3>{title}</h3>
          <button className="iconbtn" onClick={onCancel} aria-label="Close"><FiX /></button>
        </div>
        <div className="roles-modal__body">
          <div className="grid">
            <div className="field">
              <label>Role name <span className="req">*</span></label>
              <input className="r-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Supervisor" />
            </div>
            <div className="field">
              <label>Description</label>
              <textarea className="r-textarea" rows={3} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Optional notes about this role" />
            </div>
          </div>
        </div>
        <div className="roles-modal__foot">
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
  disabled,
}: {
  tone?: "neutral" | "warning" | "danger";
  title: string;
  body: React.ReactNode;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
  disabled?: boolean;
}) {
  return (
    <>
      <div className="roles-modal__backdrop" onClick={onCancel} />
      <div className={`roles-modal panel ${tone}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="roles-modal__head">
          <h3>{title}</h3>
          <button className="iconbtn" onClick={onCancel} aria-label="Close"><FiX /></button>
        </div>
        <div className="roles-modal__body">
          <p className="text-muted" style={{ margin: 0 }}>{body}</p>
        </div>
        <div className="roles-modal__foot">
          <button className="btn" onClick={onCancel}>Cancel</button>
          <button
            className={`btn ${tone === "danger" ? "btn-danger" : "btn-primary"}`}
            onClick={onConfirm}
            disabled={disabled}
          >
            {tone === "danger" ? <FiTrash2 /> : <FiArchive />} {confirmLabel}
          </button>
        </div>
      </div>
    </>
  );
}
