import { useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  FiChevronLeft,
  FiUserPlus,
  FiEye,
  FiEyeOff,
  FiMail,
  FiPhone,
  FiBriefcase,
  FiShield,
  FiLayers,
  FiGrid,
  FiInfo,
  FiAlertTriangle,
  FiCheckCircle,
} from "react-icons/fi";
import { useOrg } from "../../../../app/org";
import "./NewUser.css";

/* =========================================================
   Types & mock catalogs
   ======================================================= */
type UserStatus = "active" | "invited" | "suspended";
type ScopeType = "org" | "department" | "team" | "none";

type RoleKey = "admin" | "agent" | "viewer" | "requester" | "kb_editor" | "report_analyst";
type PermissionKey =
  | "tickets.read" | "tickets.create" | "tickets.update" | "tickets.assign" | "tickets.merge" | "tickets.delete"
  | "users.read" | "users.create" | "users.update" | "users.delete"
  | "kb.read" | "kb.create" | "kb.update" | "kb.publish" | "kb.delete"
  | "workflows.read" | "workflows.update"
  | "sla.read" | "sla.update"
  | "reports.read" | "reports.export"
  | "org.settings.read" | "org.settings.update";

type PermissionDef = { key: PermissionKey; label: string; group: string; desc?: string; };
type RoleDef = {
  key: RoleKey;
  name: string;
  description: string;
  scope: ScopeType;            // how this role can be scoped
  perms: PermissionKey[];
  system?: boolean;
};

/** Permission catalog (grouped) */
const PERMISSIONS: PermissionDef[] = [
  { key: "tickets.read",    label: "Read Tickets",    group: "Tickets" },
  { key: "tickets.create",  label: "Create Tickets",  group: "Tickets" },
  { key: "tickets.update",  label: "Update Tickets",  group: "Tickets" },
  { key: "tickets.assign",  label: "Assign Tickets",  group: "Tickets" },
  { key: "tickets.merge",   label: "Merge Tickets",   group: "Tickets" },
  { key: "tickets.delete",  label: "Delete Tickets",  group: "Tickets" },

  { key: "users.read",      label: "Read Users",      group: "Users" },
  { key: "users.create",    label: "Create Users",    group: "Users" },
  { key: "users.update",    label: "Update Users",    group: "Users" },
  { key: "users.delete",    label: "Delete Users",    group: "Users" },

  { key: "kb.read",         label: "Read Articles",   group: "Knowledge Base" },
  { key: "kb.create",       label: "Create Articles", group: "Knowledge Base" },
  { key: "kb.update",       label: "Update Articles", group: "Knowledge Base" },
  { key: "kb.publish",      label: "Publish Articles",group: "Knowledge Base" },
  { key: "kb.delete",       label: "Delete Articles", group: "Knowledge Base" },

  { key: "workflows.read",  label: "Read Workflows",  group: "Automation & Workflows" },
  { key: "workflows.update",label: "Edit Workflows",  group: "Automation & Workflows" },

  { key: "sla.read",        label: "View SLA",        group: "SLA" },
  { key: "sla.update",      label: "Edit SLA",        group: "SLA" },

  { key: "reports.read",    label: "View Reports",    group: "Reports" },
  { key: "reports.export",  label: "Export Reports",  group: "Reports" },

  { key: "org.settings.read",   label: "View Org Settings",   group: "Administration" },
  { key: "org.settings.update", label: "Edit Org Settings",   group: "Administration" },
];

/** Role catalog (mock). Scope defines what selector to show. */
const ROLES: RoleDef[] = [
  {
    key: "admin",
    name: "Admin",
    description: "Full administrative access across the organization.",
    scope: "org",
    system: true,
    perms: [
      "tickets.read","tickets.create","tickets.update","tickets.assign","tickets.merge","tickets.delete",
      "users.read","users.create","users.update","users.delete",
      "kb.read","kb.create","kb.update","kb.publish","kb.delete",
      "workflows.read","workflows.update",
      "sla.read","sla.update",
      "reports.read","reports.export",
      "org.settings.read","org.settings.update",
    ],
  },
  {
    key: "agent",
    name: "Agent",
    description: "Work on tickets and knowledge base within assigned scope.",
    scope: "team",
    perms: [
      "tickets.read","tickets.create","tickets.update","tickets.assign",
      "kb.read","kb.create","kb.update",
      "reports.read",
    ],
  },
  {
    key: "viewer",
    name: "Viewer",
    description: "Read-only access for audits or observers.",
    scope: "department",
    perms: ["tickets.read","users.read","kb.read","reports.read"],
  },
  {
    key: "requester",
    name: "Requester",
    description: "Portal-only access to submit and view own tickets.",
    scope: "none",
    perms: ["tickets.create","tickets.read","kb.read"],
  },
  {
    key: "kb_editor",
    name: "KB Editor",
    description: "Create and publish KB content.",
    scope: "org",
    perms: ["kb.read","kb.create","kb.update","kb.publish"],
  },
  {
    key: "report_analyst",
    name: "Report Analyst",
    description: "View and export reports.",
    scope: "org",
    perms: ["reports.read","reports.export"],
  },
];

/* Mock Department/Team pickers; replace with API lists */
const DEPARTMENTS = ["Support", "IT", "Engineering", "Billing", "Customer Success"];
const TEAMS = [
  { name: "Tier 1", department: "Support" },
  { name: "Tier 2", department: "Support" },
  { name: "Platform", department: "Engineering" },
  { name: "Payments", department: "Billing" },
];

/* =========================================================
   Page
   ======================================================= */
export default function NewUserPage() {
  const { orgSlug } = useParams();
  const org = useOrg();
  const navigate = useNavigate();

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<UserStatus>("active");
  const [phone, setPhone] = useState("");
  const [title, setTitle] = useState("");
  const [department, setDepartment] = useState<string>("");
  const [team, setTeam] = useState<string>("");
  const [invite, setInvite] = useState(true);
  const [notify, setNotify] = useState(true);
  const [pwdVisible, setPwdVisible] = useState(false);
  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");

  // Role selections + per-role scope
  const [selectedRoles, setSelectedRoles] = useState<RoleKey[]>(["agent"]);
  const [roleScopes, setRoleScopes] = useState<Record<RoleKey, { department?: string; team?: string }>>({});

  // Derived: Effective permissions (union of selected roles)
  const effectivePerms = useMemo(() => {
    const set = new Set<PermissionKey>();
    selectedRoles.forEach(rk => {
      const r = ROLES.find(x => x.key === rk);
      r?.perms.forEach(p => set.add(p));
    });
    return Array.from(set.values());
  }, [selectedRoles]);

  const groupedPerms = useMemo(() => {
    const groups: Record<string, PermissionDef[]> = {};
    PERMISSIONS.forEach(p => {
      if (!groups[p.group]) groups[p.group] = [];
      groups[p.group].push(p);
    });
    return groups;
  }, []);

  // Basic client validation
  const errors: string[] = [];
  if (!name.trim()) errors.push("Name is required.");
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim() || "")) errors.push("A valid email is required.");
  if (!invite && (!pwd || pwd.length < 8)) errors.push("Password must be at least 8 characters (or enable Invite).");
  if (!invite && pwd !== pwd2) errors.push("Passwords do not match.");

  // Submit
  async function handleCreate(kind: "invite" | "create") {
    if (errors.length) return;

    const payload = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim() || null,
      title: title.trim() || null,
      department: department || null,
      team: team || null,
      status,
      invite: kind === "invite",
      notify,
      roles: selectedRoles.map(rk => ({
        key: rk,
        scope: roleScopeFor(rk),
      })),
      // Only when not inviting:
      password: kind === "create" ? pwd : undefined,
    };

    // TODO: POST /api/orgs/:slug/users
    await new Promise(r => setTimeout(r, 450)); // demo
    navigate(`/${orgSlug}/console/users?tab=users`);
  }

  function roleScopeFor(rk: RoleKey) {
    const role = ROLES.find(r => r.key === rk)!;
    const rs = roleScopes[rk] || {};
    if (role.scope === "org" || role.scope === "none") return { type: role.scope, ref: null as any };
    if (role.scope === "department") return { type: "department", ref: rs.department || department || null };
    if (role.scope === "team") return { type: "team", ref: rs.team || team || null };
    return { type: "none", ref: null as any };
  }

  function updateRoleScope(rk: RoleKey, patch: { department?: string; team?: string }) {
    setRoleScopes(prev => ({ ...prev, [rk]: { ...prev[rk], ...patch } }));
  }

  function toggleRole(rk: RoleKey) {
    setSelectedRoles(prev => prev.includes(rk) ? prev.filter(x => x !== rk) : [...prev, rk]);
  }

  const roleIsSelected = (rk: RoleKey) => selectedRoles.includes(rk);

  return (
    <div className="nu-root">
      {/* Header bar */}
      <div className="nu-head panel">
        <div className="nu-left">
          <Link className="btn" to={`/${orgSlug}/console/users?tab=users`}>
            <FiChevronLeft /> Back to Users
          </Link>
          <h2 className="nu-title"><FiUserPlus /> Create User</h2>
        </div>
        <div className="nu-right">
          <button
            className="btn btn-secondary"
            onClick={() => handleCreate("create")}
            disabled={errors.length > 0 || (invite && !email)}
            title="Create user without sending an invite"
          >
            Save without invite
          </button>
          <button
            className="btn btn-primary"
            onClick={() => handleCreate("invite")}
            disabled={errors.length > 0}
            title="Create and send invite"
          >
            Create & Invite
          </button>
        </div>
      </div>

      {/* Main 2-column layout */}
      <div className="nu-main">
        {/* Left column: form */}
        <section className="nu-form panel">
          {/* Profile */}
          <div className="nu-group">
            <div className="nu-sechead">
              <h3><FiUserPlus /> Profile</h3>
              <span className="muted">Organization: <b>{org.name}</b></span>
            </div>

            <div className="nu-grid">
              <label className="field">
                <span>Name <b className="req">*</b></span>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Jane Apondi" />
              </label>

              <label className="field">
                <span>Email <b className="req">*</b></span>
                <div className="withicon">
                  <FiMail />
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jane@company.co.ke" />
                </div>
              </label>

              <label className="field">
                <span>Phone</span>
                <div className="withicon">
                  <FiPhone />
                  <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+254 7xx xxx xxx" />
                </div>
              </label>

              <label className="field">
                <span>Job Title</span>
                <div className="withicon">
                  <FiBriefcase />
                  <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Customer Support Agent" />
                </div>
              </label>

              <label className="field">
                <span>Department</span>
                <div className="withicon">
                  <FiGrid />
                  <select value={department} onChange={e => setDepartment(e.target.value)}>
                    <option value="">—</option>
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </label>

              <label className="field">
                <span>Team</span>
                <div className="withicon">
                  <FiLayers />
                  <select value={team} onChange={e => setTeam(e.target.value)}>
                    <option value="">—</option>
                    {TEAMS
                      .filter(t => !department || t.department === department)
                      .map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
                  </select>
                </div>
              </label>

              <label className="field">
                <span>Status</span>
                <select value={status} onChange={e => setStatus(e.target.value as UserStatus)}>
                  <option value="active">Active</option>
                  <option value="invited">Invited</option>
                  <option value="suspended">Suspended</option>
                </select>
              </label>
            </div>
          </div>

          {/* Invite & Password */}
          <div className="nu-group">
            <div className="nu-sechead">
              <h3><FiMail /> Invitation</h3>
              <span className="muted">Send an invite or set a password now.</span>
            </div>

            <div className="nu-row">
              <label className="switch2">
                <input type="checkbox" checked={invite} onChange={e => setInvite(e.target.checked)} />
                <span>Send invite email to the user</span>
              </label>
              <label className="switch2">
                <input type="checkbox" checked={notify} onChange={e => setNotify(e.target.checked)} disabled={!invite} />
                <span>Notify me when the user accepts invite</span>
              </label>
            </div>

            {!invite && (
              <div className="nu-grid">
                <label className="field">
                  <span>Password <b className="req">*</b></span>
                  <div className="withbtn">
                    <input type={pwdVisible ? "text" : "password"} value={pwd} onChange={e => setPwd(e.target.value)} placeholder="••••••••" />
                    <button type="button" className="iconbtn" onClick={() => setPwdVisible(v => !v)}>{pwdVisible ? <FiEyeOff /> : <FiEye />}</button>
                  </div>
                </label>

                <label className="field">
                  <span>Confirm Password <b className="req">*</b></span>
                  <input type={pwdVisible ? "text" : "password"} value={pwd2} onChange={e => setPwd2(e.target.value)} placeholder="••••••••" />
                </label>
              </div>
            )}
          </div>

          {/* Roles & Scopes */}
          <div className="nu-group">
            <div className="nu-sechead">
              <h3><FiShield /> Roles & Scope</h3>
              <span className="muted">Assign one or more roles. Roles can be scoped to Org, Department, or Team.</span>
            </div>

            <div className="roles-grid">
              {ROLES.map(role => (
                <div key={role.key} className={`rolecard ${roleIsSelected(role.key) ? "is-selected" : ""}`}>
                  <div className="rolecard__head">
                    <label className="checkbox">
                      <input
                        type="checkbox"
                        checked={roleIsSelected(role.key)}
                        onChange={() => toggleRole(role.key)}
                      />
                      <span className="role-name">{role.name}</span>
                    </label>
                    {role.system && <span className="badge sys">system</span>}
                  </div>
                  <div className="role-desc">{role.description}</div>

                  <div className="role-scope">
                    <span className="label">Scope:</span>
                    {role.scope === "org" && <span className="pill">Organization</span>}
                    {role.scope === "none" && <span className="pill">Not scoped</span>}

                    {role.scope === "department" && (
                      <select
                        value={roleScopes[role.key]?.department || ""}
                        onChange={e => updateRoleScope(role.key, { department: e.target.value })}
                      >
                        <option value="">Choose department</option>
                        {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    )}

                    {role.scope === "team" && (
                      <select
                        value={roleScopes[role.key]?.team || ""}
                        onChange={e => updateRoleScope(role.key, { team: e.target.value })}
                      >
                        <option value="">Choose team</option>
                        {TEAMS.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
                      </select>
                    )}
                  </div>

                  <details className="role-perms">
                    <summary><FiInfo /> View permissions</summary>
                    <ul>
                      {role.perms.map(pk => {
                        const def = PERMISSIONS.find(p => p.key === pk);
                        return <li key={pk}><span className="perm">{def?.label || pk}</span><span className="muted group">{def?.group}</span></li>;
                      })}
                    </ul>
                  </details>
                </div>
              ))}
            </div>
          </div>

          {/* Errors */}
          {errors.length > 0 && (
            <div className="nu-errors">
              <FiAlertTriangle />
              <div>
                <b>Please fix the following:</b>
                <ul>{errors.map((e, i) => <li key={i}>{e}</li>)}</ul>
              </div>
            </div>
          )}
        </section>

        {/* Right column: live preview */}
        <aside className="nu-preview panel">
          <h3 className="pv-title"><FiCheckCircle /> Effective Access</h3>
          <div className="pv-user">
            <div className="avatar">{initials(name || "New User")}</div>
            <div className="meta">
              <div className="name">{name || "New User"}</div>
              <div className="sub">{email || "email@domain.com"}</div>
              {title && <div className="sub">{title}</div>}
            </div>
          </div>

          <div className="pv-rows">
            <div className="pv-row">
              <span className="label">Department</span>
              <span className="value">{department || "—"}</span>
            </div>
            <div className="pv-row">
              <span className="label">Team</span>
              <span className="value">{team || "—"}</span>
            </div>
            <div className="pv-row">
              <span className="label">Status</span>
              <span className={`value badge badge-${status}`}>{uc(status)}</span>
            </div>
          </div>

          <div className="pv-block">
            <div className="pv-block__head">Roles</div>
            {selectedRoles.length === 0 ? (
              <div className="muted">No roles selected.</div>
            ) : (
              <div className="pv-chips">
                {selectedRoles.map(rk => {
                  const r = ROLES.find(x => x.key === rk)!;
                  const s = roleScopeFor(rk);
                  let scopeText = "Org";
                  if (r.scope === "team") scopeText = s.ref || "Team?";
                  if (r.scope === "department") scopeText = s.ref || "Dept?";
                  if (r.scope === "none") scopeText = "—";
                  return <span key={rk} className="chip">{r.name}<em>{scopeText}</em></span>;
                })}
              </div>
            )}
          </div>

          <div className="pv-block">
            <div className="pv-block__head">Permissions (read-only)</div>
            <div className="pv-perms">
              {Object.entries(groupedPerms).map(([group, items]) => {
                const groupHasAny = items.some(p => effectivePerms.includes(p.key));
                return (
                  <div key={group} className={`pv-group ${groupHasAny ? "on" : ""}`}>
                    <div className="pv-group__title">{group}</div>
                    <ul className="pv-list">
                      {items.map(p => (
                        <li key={p.key} className={effectivePerms.includes(p.key) ? "on" : "off"}>
                          <span className="dot" />
                          {p.label}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>
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
