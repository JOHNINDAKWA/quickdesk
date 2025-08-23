import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  FiChevronLeft,
  FiEdit3,
  FiMail,
  FiPhone,
  FiBriefcase,
  FiGrid,
  FiLayers,
  FiShield,
  FiClock,
  FiRefreshCw,
  FiSlash,
  FiCheck,
  FiTrash2,
  FiUser,
  FiUsers,
  FiInfo,
  FiEye,
  FiEyeOff,
  FiAlertTriangle,
  FiCheckCircle,
  FiTrash,
} from "react-icons/fi";
import { useOrg } from "../../../../app/org";
import "./UserDetail.css";

/* =========================================================
   Types
   ======================================================= */
type UserStatus = "active" | "invited" | "suspended";
type RoleKey =
  | "admin"
  | "agent"
  | "viewer"
  | "requester"
  | "kb_editor"
  | "report_analyst";
type PermissionKey =
  | "tickets.read" | "tickets.create" | "tickets.update" | "tickets.assign" | "tickets.merge" | "tickets.delete"
  | "users.read" | "users.create" | "users.update" | "users.delete"
  | "kb.read" | "kb.create" | "kb.update" | "kb.publish" | "kb.delete"
  | "workflows.read" | "workflows.update"
  | "sla.read" | "sla.update"
  | "reports.read" | "reports.export"
  | "org.settings.read" | "org.settings.update";

type ScopeType = "org" | "department" | "team" | "none";
type RoleScope = { type: ScopeType; ref?: string | null };

type UserRole = { key: RoleKey; scope?: RoleScope };

type Decision = "inherit" | "allow" | "deny";

/** Permanent, per-user override (NEW) */
type UserOverride = {
  id: string;
  permKey: PermissionKey;
  decision: Exclude<Decision, "inherit">; // allow | deny
  scope: ScopeType;
  ref?: string | null;                   // when scope is department/team
  reason?: string;
};

type GrantType = "acting_role" | "perm_override";
type Grant = {
  id: string;
  type: GrantType;
  roleKey?: RoleKey;
  permKey?: PermissionKey;
  allow?: boolean;
  scope: ScopeType;
  ref?: string | null;
  startAt?: string;
  endAt?: string;
  reason?: string;
  approvedBy?: string;
};

type User = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  title?: string;
  department?: string;
  team?: string;
  status: UserStatus;
  createdAt: string;
  lastLogin?: string;
  roles: UserRole[];
  /** Permanent per-user overrides (NEW) */
  overrides?: UserOverride[];
  /** Optional temporary stuff (still supported) */
  grants?: Grant[];
};

type Activity = {
  id: string;
  when: string;
  actor: string;
  event: string;
  severity?: "info" | "warn" | "danger";
};

type RoleDef = {
  key: RoleKey;
  name: string;
  description: string;
  scope: ScopeType;
  system?: boolean;
  perms: PermissionKey[];
};

type PermissionDef = { key: PermissionKey; label: string; group: string };

/* =========================================================
   Catalogs (mock)
   ======================================================= */
const DEPARTMENTS = ["Support", "IT", "Engineering", "Billing", "Customer Success"];
const TEAMS = [
  { name: "Tier 1", department: "Support" },
  { name: "Tier 2", department: "Support" },
  { name: "Platform", department: "Engineering" },
  { name: "Payments", department: "Billing" },
];

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
    perms: ["tickets.read","tickets.create","tickets.update","tickets.assign","kb.read","kb.create","kb.update","reports.read"],
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

/* =========================================================
   Helpers
   ======================================================= */
function nid() { return Math.random().toString(36).slice(2, 9); }
function initials(name: string) {
  const [a = "", b = ""] = name.trim().split(/\s+/, 2);
  return (a[0] || "").toUpperCase() + (b[0] || "").toUpperCase();
}
function uc<T extends string>(s: T): string {
  return s.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}
function timeAgo(iso?: string) {
  if (!iso) return "—";
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
function unionPerms(roleKeys: RoleKey[]) {
  const set = new Set<PermissionKey>();
  roleKeys.forEach(rk => {
    const r = ROLES.find(x => x.key === rk);
    r?.perms.forEach(p => set.add(p));
  });
  return Array.from(set.values());
}
function isActiveGrant(g: Grant, now = Date.now()) {
  const start = g.startAt ? new Date(g.startAt).getTime() : -Infinity;
  const end = g.endAt ? new Date(g.endAt).getTime() : Infinity;
  return now >= start && now <= end;
}
function scopeMatches(scope: ScopeType, ref: string | null | undefined, ctx: { department?: string; team?: string }) {
  if (scope === "org" || scope === "none") return true;
  if (scope === "department") return (ref || "") === (ctx.department || "");
  if (scope === "team") return (ref || "") === (ctx.team || "");
  return false;
}

/** Effective permissions with precedence:
 * - Start with role-derived perms
 * - Add any ALLOW from permanent overrides & active temp grants
 * - Remove any DENY from permanent overrides & active temp grants
 * - Explicit DENY wins over everything.
 */
function computeEffectivePermissions(
  baseRoles: RoleKey[],
  overrides: UserOverride[],
  grants: Grant[],
  ctx: { department?: string; team?: string }
): PermissionKey[] {
  const base = new Set<PermissionKey>(unionPerms(baseRoles));

  const add = new Set<PermissionKey>();
  const deny = new Set<PermissionKey>();

  // Permanent overrides
  for (const o of overrides) {
    if (!scopeMatches(o.scope, o.ref, ctx)) continue;
    if (o.decision === "allow") add.add(o.permKey);
    else deny.add(o.permKey);
  }

  // Temporary grants (still supported)
  for (const g of grants) {
    if (!isActiveGrant(g)) continue;
    if (!scopeMatches(g.scope, g.ref, ctx)) continue;
    if (g.type === "acting_role" && g.roleKey) {
      unionPerms([g.roleKey]).forEach(p => add.add(p));
    } else if (g.type === "perm_override" && g.permKey) {
      if (g.allow) add.add(g.permKey);
      else deny.add(g.permKey);
    }
  }

  // Apply: base ∪ add, then subtract deny
  const final = new Set<PermissionKey>([...base, ...add]);
  deny.forEach(p => final.delete(p));
  return Array.from(final.values());
}

/* =========================================================
   Mock user
   ======================================================= */
function seedUser(id: string): User {
  const idx = Number(id) || 1;
  const now = Date.now();
  const baseName = ["Jane Apondi", "Brian Otieno", "Mary Wanjiru", "Peter Njoroge", "Aisha Noor", "Kevin Ouma", "Lucy Muthoni"][idx % 7];
  const team = TEAMS[idx % TEAMS.length].name;

  return {
    id,
    name: baseName,
    email: `user${idx}@example.co.ke`,
    phone: "+254 7xx xxx xxx",
    title: "Support Agent",
    department: DEPARTMENTS[idx % DEPARTMENTS.length],
    team,
    status: (["active","invited","suspended"] as UserStatus[])[idx % 3],
    createdAt: new Date(now - 60 * 864e5).toISOString(),
    lastLogin: new Date(now - 6 * 36e5).toISOString(),
    roles: [
      { key: "agent", scope: { type: "team", ref: team } },
    ],
    /** Example permanent per-user rights (what you asked for) */
    overrides: [
      { id: nid(), permKey: "kb.publish",      decision: "allow", scope: "org", ref: null, reason: "Trusted publisher" },
      { id: nid(), permKey: "workflows.read",  decision: "allow", scope: "org", ref: null, reason: "Ops visibility" },
    ],
    /** Optional time-bound stuff still works */
    grants: [],
  };
}

/* =========================================================
   Page
   ======================================================= */
export default function UserDetailPage() {
  const { id = "1", orgSlug } = useParams();
  const org = useOrg();
  const nav = useNavigate();
  const [sp, setSp] = useSearchParams();
  const tab = (sp.get("tab") || "profile") as "profile" | "roles" | "activity" | "security";

  // Load user (mock)
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User>(() => seedUser(id));
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      await new Promise(r => setTimeout(r, 200));
      if (!alive) return;
      setUser(seedUser(id));
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [id]);

  // Editable profile
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(user.phone || "");
  const [title, setTitle] = useState(user.title || "");
  const [department, setDepartment] = useState(user.department || "");
  const [team, setTeam] = useState(user.team || "");
  const [status, setStatus] = useState<UserStatus>(user.status);

  // Roles + scopes
  const [selectedRoles, setSelectedRoles] = useState<RoleKey[]>(user.roles.map(r => r.key));
  const [roleScopes, setRoleScopes] = useState<Record<RoleKey, { department?: string; team?: string }>>(() => {
    const map: Record<RoleKey, { department?: string; team?: string }> = {} as any;
    user.roles.forEach(r => {
      if (r.scope?.type === "team") map[r.key] = { team: String(r.scope.ref || "") };
      if (r.scope?.type === "department") map[r.key] = { department: String(r.scope.ref || "") };
    });
    return map;
  });

  // Permanent overrides (NEW)
  const [overrides, setOverrides] = useState<UserOverride[]>(user.overrides || []);

  // Temporary (still supported)
  const [grants, setGrants] = useState<Grant[]>(user.grants || []);

  // Security
  const [pwdVisible, setPwdVisible] = useState(false);
  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");

  // Activity
  const [activity, setActivity] = useState<Activity[]>(() => [
    { id: nid(), when: new Date(Date.now()-2*36e5).toISOString(), actor: "System", event: "Login success from 41.90.x.x", severity: "info" },
  ]);

  // Sync on user load
  useEffect(() => {
    setName(user.name);
    setEmail(user.email);
    setPhone(user.phone || "");
    setTitle(user.title || "");
    setDepartment(user.department || "");
    setTeam(user.team || "");
    setStatus(user.status);
    setSelectedRoles(user.roles.map(r => r.key));
    const scopes: Record<RoleKey, { department?: string; team?: string }> = {} as any;
    user.roles.forEach(r => {
      if (r.scope?.type === "team") scopes[r.key] = { team: String(r.scope.ref || "") };
      if (r.scope?.type === "department") scopes[r.key] = { department: String(r.scope.ref || "") };
    });
    setRoleScopes(scopes);
    setOverrides(user.overrides || []);
    setGrants(user.grants || []);
  }, [user]);

  // Derived
  const effPerms = useMemo(
    () => computeEffectivePermissions(selectedRoles, overrides, grants, { department, team }),
    [selectedRoles, overrides, grants, department, team]
  );
  const permGroups = useMemo(() => {
    const groups: Record<string, PermissionDef[]> = {};
    PERMISSIONS.forEach(p => {
      if (!groups[p.group]) groups[p.group] = [];
      groups[p.group].push(p);
    });
    return groups;
  }, []);

  // Tabs
  function setTab(next: typeof tab) {
    const nx = new URLSearchParams(sp);
    nx.set("tab", next);
    setSp(nx, { replace: true });
  }

  // Mutators
  function toggleRole(rk: RoleKey) {
    setSelectedRoles(prev => prev.includes(rk) ? prev.filter(x => x !== rk) : [...prev, rk]);
  }
  function updateRoleScope(rk: RoleKey, patch: { department?: string; team?: string }) {
    setRoleScopes(prev => ({ ...prev, [rk]: { ...prev[rk], ...patch } }));
  }

  // Overrides: derive map
  const overridesByPerm = useMemo(() => {
    const map = new Map<PermissionKey, UserOverride>();
    overrides.forEach(o => map.set(o.permKey, o));
    return map;
  }, [overrides]);

  function setOverride(permKey: PermissionKey, decision: Decision, scope: ScopeType, ref?: string | null, reason?: string) {
    setOverrides(prev => {
      const existing = prev.find(o => o.permKey === permKey);
      if (decision === "inherit") {
        return existing ? prev.filter(o => o.permKey !== permKey) : prev;
      }
      const next: UserOverride = {
        id: existing?.id || nid(),
        permKey,
        decision: decision === "allow" ? "allow" : "deny",
        scope,
        ref: scope === "department" || scope === "team" ? (ref || "") : null,
        reason: reason || existing?.reason,
      };
      if (existing) return prev.map(o => (o.permKey === permKey ? next : o));
      return [next, ...prev];
    });
  }

  function clearAllOverrides() {
    if (!confirm("Clear all user-specific overrides?")) return;
    setOverrides([]);
  }

  // Dirty detection
  function normalizeRoles(keys: RoleKey[], scopes: Record<RoleKey, { department?: string; team?: string }>) {
    const list: string[] = [];
    keys.forEach(rk => {
      const def = ROLES.find(r => r.key === rk)!;
      const scope: RoleScope =
        def.scope === "org" ? { type: "org", ref: null } :
        def.scope === "none" ? { type: "none", ref: null } :
        def.scope === "department" ? { type: "department", ref: (scopes[rk]?.department || department || null) } :
        def.scope === "team" ? { type: "team", ref: (scopes[rk]?.team || team || null) } :
        { type: "none", ref: null };
      list.push(`${rk}|${scope.type}|${scope.ref || ""}`);
    });
    return list.sort().join(",");
  }
  const currentRolesNorm = normalizeRoles(selectedRoles, roleScopes);
  const savedRolesNorm = normalizeRoles(
    user.roles.map(r => r.key),
    user.roles.reduce((acc, r) => {
      if (r.scope?.type === "department") acc[r.key as RoleKey] = { department: String(r.scope.ref || "") };
      if (r.scope?.type === "team") acc[r.key as RoleKey] = { team: String(r.scope.ref || "") };
      return acc;
    }, {} as Record<RoleKey, { department?: string; team?: string }>)
  );
  const overridesNorm = JSON.stringify([...overrides].sort((a,b)=>a.permKey.localeCompare(b.permKey)));
  const savedOverridesNorm = JSON.stringify([...(user.overrides || [])].sort((a,b)=>a.permKey.localeCompare(b.permKey)));

  const dirty =
    name !== user.name ||
    email !== user.email ||
    (phone || "") !== (user.phone || "") ||
    (title || "") !== (user.title || "") ||
    (department || "") !== (user.department || "") ||
    (team || "") !== (user.team || "") ||
    status !== user.status ||
    currentRolesNorm !== savedRolesNorm ||
    overridesNorm !== savedOverridesNorm;

  // Save
  async function saveAll() {
    const rolesPayload: UserRole[] = selectedRoles.map(rk => {
      const def = ROLES.find(r => r.key === rk)!;
      const rs = roleScopes[rk] || {};
      const scope: RoleScope =
        def.scope === "org" ? { type: "org", ref: null } :
        def.scope === "none" ? { type: "none", ref: null } :
        def.scope === "department" ? { type: "department", ref: rs.department || department || null } :
        def.scope === "team" ? { type: "team", ref: rs.team || team || null } :
        { type: "none", ref: null };
      return { key: rk, scope };
    });

    const payload: Partial<User> = {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
      title: title.trim() || undefined,
      department: department || undefined,
      team: team || undefined,
      status,
      roles: rolesPayload,
      overrides,  // NEW: persistent, per-user rights
      grants,     // still here if you ever use temporary access
    };

    // TODO: PUT /api/orgs/:slug/users/:id
    await new Promise(r => setTimeout(r, 350));
    setUser(u => ({ ...u, ...payload } as User));
    setActivity(a => [{ id: nid(), when: new Date().toISOString(), actor: "You", event: "Updated user & overrides", severity: "info" }, ...a]);
  }

  // Admin actions (mock)
  async function resendInvite() {
    await new Promise(r => setTimeout(r, 250));
    alert("Invite email re-sent.");
  }
  async function resetPassword() {
    if (!pwd || pwd.length < 8 || pwd !== pwd2) return;
    await new Promise(r => setTimeout(r, 250));
    setPwd(""); setPwd2("");
    setActivity(a => [{ id: nid(), when: new Date().toISOString(), actor: "You", event: "Password reset", severity: "warn" }, ...a]);
    alert("Password reset.");
  }
  async function suspendToggle() {
    await new Promise(r => setTimeout(r, 200));
    setStatus(s => s === "suspended" ? "active" : "suspended");
  }
  async function deleteUser() {
    if (!confirm("Delete this user? This cannot be undone.")) return;
    await new Promise(r => setTimeout(r, 250));
    nav(`/${orgSlug}/console/users?tab=users`);
  }

  if (loading) {
    return (
      <div className="panel" style={{ margin: 16 }}>
        <p>Loading user…</p>
      </div>
    );
  }

  return (
    <div className="ud-root">
      {/* Header */}
      <div className="ud-head panel">
        <div className="ud-left">
          <Link className="btn" to={`/${orgSlug}/console/users?tab=users`}>
            <FiChevronLeft /> Back to Users
          </Link>
          <div className="ud-hero">
            <div className="avatar">{initials(user.name)}</div>
            <div className="meta">
              <div className="name">{user.name}</div>
              <div className="sub">{user.email}</div>
              <div className="sub"><FiClock /> Last login {timeAgo(user.lastLogin)}</div>
            </div>
          </div>
        </div>

        <div className="ud-right">
          <button className="btn btn-secondary" disabled={!dirty} onClick={saveAll} title="Save changes">
            <FiCheck /> Save Changes
          </button>
          <button className="btn" onClick={resendInvite} title="Resend invite email" disabled={user.status !== "invited"}>
            <FiRefreshCw /> Resend Invite
          </button>
          <button className="btn" onClick={suspendToggle} title={status === "suspended" ? "Activate user" : "Suspend user"}>
            {status === "suspended" ? <FiCheck /> : <FiSlash />} {status === "suspended" ? "Activate" : "Suspend"}
          </button>
          <button className="btn btn-danger" onClick={deleteUser} title="Delete user">
            <FiTrash2 /> Delete
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="ud-tabs panel">
        <button className={`ud-tab ${tab === "profile" ? "active" : ""}`} onClick={() => setTab("profile")}><FiUser /> Profile</button>
        <button className={`ud-tab ${tab === "roles" ? "active" : ""}`} onClick={() => setTab("roles")}><FiShield /> Roles & Permissions</button>
        <button className={`ud-tab ${tab === "activity" ? "active" : ""}`} onClick={() => setTab("activity")}><FiInfo /> Activity</button>
        <button className={`ud-tab ${tab === "security" ? "active" : ""}`} onClick={() => setTab("security")}><FiUsers /> Security</button>
      </div>

      {/* Main */}
      <div className="ud-main">
        {/* Left */}
        <section className="ud-content panel">
          {/* PROFILE */}
          {tab === "profile" && (
            <>
              <h3 className="section-title"><FiEdit3 /> Edit Profile</h3>
              <div className="grid2">
                <label className="field">
                  <span>Name</span>
                  <input value={name} onChange={e => setName(e.target.value)} />
                </label>
                <label className="field">
                  <span>Email</span>
                  <div className="withicon">
                    <FiMail />
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} />
                  </div>
                </label>
                <label className="field">
                  <span>Phone</span>
                  <div className="withicon">
                    <FiPhone />
                    <input value={phone} onChange={e => setPhone(e.target.value)} />
                  </div>
                </label>
                <label className="field">
                  <span>Title</span>
                  <div className="withicon">
                    <FiBriefcase />
                    <input value={title} onChange={e => setTitle(e.target.value)} />
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
                      {TEAMS.filter(t => !department || t.department === department).map(t => (
                        <option key={t.name} value={t.name}>{t.name}</option>
                      ))}
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
            </>
          )}

          {/* ROLES & PERMISSIONS */}
          {tab === "roles" && (
            <>
              <h3 className="section-title"><FiShield /> Roles & Scope</h3>
              <div className="roles-grid">
                {ROLES.map(role => {
                  const selected = selectedRoles.includes(role.key);
                  return (
                    <div key={role.key} className={`rolecard ${selected ? "is-selected" : ""}`}>
                      <div className="rolecard__head">
                        <label className="checkbox">
                          <input
                            type="checkbox"
                            checked={selected}
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
                  );
                })}
              </div>

              {/* ===== Permanent per-user overrides (NEW) ===== */}
              <UserOverridesEditor
                overrides={overrides}
                onChange={setOverrides}
                setOverride={setOverride}
                clearAll={clearAllOverrides}
                permGroups={permGroups}
                overridesByPerm={overridesByPerm}
              />

              {/* ===== Optional: Temporary access still available ===== */}
              {false && (
                <div className="panel" style={{ marginTop: 12 }}>
                  <div className="text-muted">Temporary access UI hidden in this build. You can re-enable when needed.</div>
                </div>
              )}
            </>
          )}

          {/* ACTIVITY */}
          {tab === "activity" && (
            <>
              <h3 className="section-title"><FiInfo /> Activity</h3>
              <ul className="ud-activity">
                {activity.map(a => (
                  <li key={a.id} className={`act ${a.severity || "info"}`}>
                    <div className="when">{timeAgo(a.when)}</div>
                    <div className="event"><b>{a.actor}</b> — {a.event}</div>
                  </li>
                ))}
              </ul>
            </>
          )}

          {/* SECURITY */}
          {tab === "security" && (
            <>
              <h3 className="section-title"><FiUsers /> Security</h3>
              <div className="grid2">
                <div className="field">
                  <span>Set new password</span>
                  <div className="withbtn">
                    <input
                      type={pwdVisible ? "text" : "password"}
                      value={pwd}
                      onChange={e => setPwd(e.target.value)}
                      placeholder="••••••••"
                    />
                    <button className="iconbtn" onClick={() => setPwdVisible(v => !v)}>{pwdVisible ? <FiEyeOff /> : <FiEye />}</button>
                  </div>
                </div>
                <label className="field">
                  <span>Confirm password</span>
                  <input
                    type={pwdVisible ? "text" : "password"}
                    value={pwd2}
                    onChange={e => setPwd2(e.target.value)}
                    placeholder="••••••••"
                  />
                </label>
              </div>

              <div className="ud-actions">
                <button className="btn btn-secondary" disabled={!pwd || pwd.length < 8 || pwd !== pwd2} onClick={resetPassword}>
                  <FiRefreshCw /> Reset Password
                </button>
                <button className="btn" onClick={resendInvite} disabled={user.status !== "invited"}>
                  <FiMail /> Resend Invite
                </button>
                <button className="btn btn-danger" onClick={deleteUser}>
                  <FiTrash2 /> Delete User
                </button>
              </div>

              <div className="ud-hint"><FiAlertTriangle /> Password must be at least 8 characters.</div>
            </>
          )}
        </section>

        {/* Right — Effective preview */}
        <aside className="ud-aside panel">
          <h3 className="pv-title"><FiCheckCircle /> Effective Access</h3>

          <div className="pv-user">
            <div className="avatar">{initials(name || user.name)}</div>
            <div className="meta">
              <div className="name">{name || user.name}</div>
              <div className="sub">{email || user.email}</div>
              {title && <div className="sub">{title}</div>}
            </div>
          </div>

          <div className="pv-rows">
            <div className="pv-row"><span className="label">Department</span><span className="value">{department || "—"}</span></div>
            <div className="pv-row"><span className="label">Team</span><span className="value">{team || "—"}</span></div>
            <div className="pv-row">
              <span className="label">Status</span>
              <span className={`value badge badge-${status}`}>{uc(status)}</span>
            </div>
            <div className="pv-row"><span className="label">Member since</span><span className="value">{new Date(user.createdAt).toLocaleDateString()}</span></div>
          </div>

          <div className="pv-block">
            <div className="pv-block__head">Roles</div>
            {selectedRoles.length === 0 ? (
              <div className="muted">No roles selected.</div>
            ) : (
              <div className="pv-chips">
                {selectedRoles.map(rk => {
                  const r = ROLES.find(x => x.key === rk)!;
                  const rs = roleScopes[rk] || {};
                  let scopeText = "Org";
                  if (r.scope === "team") scopeText = rs.team || team || "Team?";
                  if (r.scope === "department") scopeText = rs.department || department || "Dept?";
                  if (r.scope === "none") scopeText = "—";
                  return <span key={rk} className="chip">{r.name}<em>{scopeText}</em></span>;
                })}
              </div>
            )}
          </div>

          <div className="pv-block">
            <div className="pv-block__head">Permissions (read-only)</div>
            <div className="pv-perms">
              {Object.entries(permGroups).map(([group, items]) => {
                const groupHasAny = items.some(p => effPerms.includes(p.key));
                return (
                  <div key={group} className={`pv-group ${groupHasAny ? "on" : ""}`}>
                    <div className="pv-group__title">{group}</div>
                    <ul className="pv-list">
                      {items.map(p => (
                        <li key={p.key} className={effPerms.includes(p.key) ? "on" : "off"}>
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
   UserOverridesEditor — per-user, permanent rights
   ======================================================= */
function UserOverridesEditor({
  overrides,
  // onChange,
  setOverride,
  clearAll,
  permGroups,
  overridesByPerm,
}: {
  overrides: UserOverride[];
  onChange: (o: UserOverride[]) => void;
  setOverride: (permKey: PermissionKey, decision: Decision, scope: ScopeType, ref?: string | null, reason?: string) => void;
  clearAll: () => void;
  permGroups: Record<string, PermissionDef[]>;
  overridesByPerm: Map<PermissionKey, UserOverride>;
}) {
  const [onlyOverridden, setOnlyOverridden] = useState(false);

  return (
    <div className="panel" style={{ marginTop: 12 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 8 }}>
        <h3 className="section-title" style={{ margin: 0 }}><FiShield /> User-specific Overrides</h3>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <label className="checkbox" title="Show only permissions that have an override">
            <input type="checkbox" checked={onlyOverridden} onChange={e => setOnlyOverridden(e.target.checked)} />
            <span>Only overridden</span>
          </label>
          <button className="btn btn-danger" disabled={overrides.length === 0} onClick={clearAll}>
            <FiTrash /> Clear All
          </button>
        </div>
      </div>

      <div className="pv-perms">
        {Object.entries(permGroups).map(([group, items]) => {
          // Optionally hide group if nothing overridden and filter is on
          const anyOverridden = items.some(it => overridesByPerm.has(it.key));
          if (onlyOverridden && !anyOverridden) return null;

          return (
            <div key={group} className={`pv-group on`} style={{ marginBottom: 10 }}>
              <div className="pv-group__title">{group}</div>
              <ul className="pv-list">
                {items.map(p => {
                  const ov = overridesByPerm.get(p.key);
                  if (onlyOverridden && !ov) return null;

                  const decision: Decision = ov ? (ov.decision === "allow" ? "allow" : "deny") : "inherit";
                  const scope = ov?.scope || "org";
                  const ref = ov?.ref || "";

                  return (
                    <li key={p.key} className="on" style={{ display: "grid", gridTemplateColumns: "1fr 120px 140px 160px", gap: 8, alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span className="dot" />
                        {p.label}
                        {ov?.reason && <span className="text-muted" style={{ marginLeft: 8, fontSize: 12 }}>({ov.reason})</span>}
                      </div>

                      {/* Inherit / Allow / Deny */}
                      <select
                        value={decision}
                        onChange={e => setOverride(p.key, e.target.value as Decision, scope, ref)}
                      >
                        <option value="inherit">Inherit</option>
                        <option value="allow">Allow</option>
                        <option value="deny">Deny</option>
                      </select>

                      {/* Scope (shown when not inherit) */}
                      <select
                        value={scope}
                        onChange={e => setOverride(p.key, decision, e.target.value as ScopeType, ref)}
                        disabled={decision === "inherit"}
                      >
                        <option value="org">Org</option>
                        <option value="department">Department</option>
                        <option value="team">Team</option>
                        <option value="none">None</option>
                      </select>

                      {/* Ref (dept/team name) */}
                      <input
                        placeholder={scope === "department" ? "Dept name…" : scope === "team" ? "Team name…" : "—"}
                        value={scope === "department" || scope === "team" ? ref : ""}
                        onChange={e => setOverride(p.key, decision, scope, e.target.value)}
                        disabled={decision === "inherit" || (scope !== "department" && scope !== "team")}
                      />
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>

      <div className="text-muted" style={{ fontSize: 12, marginTop: 8 }}>
        <b>How it works:</b> “Allow” adds a permission for this user even if their roles don’t have it.
        “Deny” removes a permission even if roles grant it. Explicit Deny always wins.
      </div>
    </div>
  );
}
