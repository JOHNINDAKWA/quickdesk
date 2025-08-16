import { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FiUsers, FiMail, FiGlobe, FiFlag, FiPackage, FiEdit2, FiSave,
  FiX, FiPlayCircle, FiPauseCircle, FiTrendingUp, FiArrowLeft,
  FiImage, FiLink, FiUpload, FiEye, FiEyeOff
} from "react-icons/fi";
import "./OrgDetail.css";

/** Mock loader: in real app, fetch by slug */
const mockDb = [
  {
    name: "Jua Kali Innovations",
    slug: "jua-kali",
    plan: "Premium",
    status: "active",
    color: "#1fb59b",
    country: "Kenya",
    industry: "Manufacturing & Fabrication",
    domain: "juakali.co.ke",
    seats: { used: 38, total: 50 },
    tickets24h: 412,
    createdAt: "2024-09-14",
    logoUrl: "https://bcassetcdn.com/public/blog/wp-content/uploads/2019/10/18094202/tech-trends.png",
    owner: { name: "Brian Odhiambo", email: "brian@juakali.co.ke", role: "Client Admin" }
  },
  {
    name: "Ushindi Sacco",
    slug: "ushindi",
    plan: "Standard",
    status: "active",
    color: "#7c4dff",
    country: "Kenya",
    industry: "Financial Services (SACCO)",
    domain: "ushindi.co.ke",
    seats: { used: 12, total: 20 },
    tickets24h: 86,
    createdAt: "2025-02-02",
    logoUrl: "https://macromate-blush.vercel.app/assets/cloves-fxdVByd6.png",
    owner: { name: "Grace Wanjiru", email: "grace@ushindi.co.ke", role: "Client Admin" }
  },
  {
    name: "Simba Logistics",
    slug: "simba-logistics",
    plan: "Enterprise",
    status: "suspended",
    color: "#ff7a1a",
    country: "Kenya",
    industry: "Logistics & Transport",
    domain: "simba-logistics.co.ke",
    seats: { used: 110, total: 130 },
    tickets24h: 1020,
    createdAt: "2024-05-20",
    logoUrl: "https://cdn.theorg.com/fbda2622-94f9-4102-bd6f-6a1c91796026_medium.jpg",
    owner: { name: "Amina Hassan", email: "amina@simba-logistics.co.ke", role: "Client Admin" }
  },
  {
    name: "Kijani Tech",
    slug: "kijani-tech",
    plan: "Free",
    status: "active",
    color: "#00bcd4",
    country: "Kenya",
    industry: "Technology",
    domain: "kijani.africa",
    seats: { used: 3, total: 5 },
    tickets24h: 9,
    createdAt: "2025-01-12",
    logoUrl: "https://lh5.ggpht.com/_gKQKwLZ8XUs/TIanWkgASNI/AAAAAAAADuY/k6K7GdaFRkM/s800/clever-logo-threesome.jpg",

    owner: { name: "Kevin Kiptoo", email: "kevin@kijani.africa", role: "Client Admin" }
  },
  {
    name: "Maji Safi Solutions",
    slug: "maji-safi",
    plan: "Standard",
    status: "active",
    color: "#2ea8ff",
    country: "Kenya",
    industry: "Water & Sanitation",
    domain: "majisafi.co.ke",
    seats: { used: 22, total: 25 },
    tickets24h: 158,
    createdAt: "2025-03-28",
    logoUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSdWC5ID2DXMboKbIvlEeHNT5EW6gTRAgLWtQ&s",

    owner: { name: "Peter Njoroge", email: "peter@majisafi.co.ke", role: "Client Admin" }
  },
  {
    name: "Rafiki Retail",
    slug: "rafiki-retail",
    plan: "Premium",
    status: "active",
    color: "#0dc270",
    country: "Kenya",
    industry: "Retail",
    domain: "rafikiretail.co.ke",
    seats: { used: 60, total: 60 },
    tickets24h: 342,
    createdAt: "2024-11-05",
    logoUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRElwgUhG7oj3udT4JswNHPm90TxlS4WumqXw&s",

    owner: { name: "Joy Achieng", email: "joy@rafikiretail.co.ke", role: "Client Admin" }
  }
] as const;

type Plan = "Free" | "Standard" | "Premium" | "Enterprise";
type Status = "active" | "suspended";

export default function OrgDetail() {
  const { slug = "" } = useParams();
  const nav = useNavigate();
  const org = useMemo(() => mockDb.find(o => o.slug === slug), [slug]);

  const [editing, setEditing] = useState(false);
  const [tab, setTab] = useState<"overview" | "profile" | "subscription" | "activity">("overview");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const [local, setLocal] = useState(() => org ?? {
    name: "", slug, plan: "Standard" as Plan, status: "active" as Status, color: "#12b886",
    country: "", industry: "", domain: "", seats: { used: 0, total: 10 }, tickets24h: 0,
    createdAt: new Date().toISOString(), logoUrl: "", owner: { name: "", email: "", role: "Client Admin" }
  });

  // local-only uploaded preview (not saved anywhere yet)
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  if (!org) {
    return (
      <div className="orgd-page">
        <div className="panel orgd-empty">
          <p>Organization not found.</p>
          <button className="btn" onClick={() => nav("/admin/organizations")}>
            <FiArrowLeft /> Back to Organizations
          </button>
        </div>
      </div>
    );
  }

  const seatPct = Math.min(100, Math.round((local.seats.used / local.seats.total) * 100));

  function isHex(v: string) {
    return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(v.trim());
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setLogoPreview(String(reader.result));
    };
    reader.readAsDataURL(file);
  }

  function save() {
    // TODO: POST/PATCH backend
    setEditing(false);
    alert("Changes saved (mock).");
  }
  function cancel() {
    setLocal(org);
    setLogoPreview(null);
    setEditing(false);
  }

  function requestStatusChange() {
    setConfirmOpen(true);
  }
  function confirmStatusChange() {
    setLocal(prev => ({ ...prev, status: prev.status === "active" ? "suspended" : "active" }));
    setConfirmOpen(false);
  }

  // Admin modal local state
  const [adminForm, setAdminForm] = useState({
    name: local.owner.name || "",
    email: local.owner.email || "",
    role: local.owner.role || "Client Admin",
    password: "",
    confirm: "",
    forceReset: true
  });
  function saveAdmin(e: React.FormEvent) {
    e.preventDefault();
    if (adminForm.password !== adminForm.confirm) {
      alert("Passwords do not match.");
      return;
    }
    setLocal(prev => ({
      ...prev,
      owner: { name: adminForm.name, email: adminForm.email, role: adminForm.role }
    }));
    setAdminOpen(false);
  }

  const effectiveLogo = logoPreview || local.logoUrl || "";

  return (
    <div className="orgd-page">
      {/* Header */}
      <section className="panel orgd-header">
        <div className="orgd-hero">
          <div className="orgd-avatar" >
            {effectiveLogo ? (
              <img src={effectiveLogo} alt={`${local.name} logo`} />
            ) : (
              initials(local.name)
            )}
          </div>
          <div className="orgd-meta">
            <h1 className="orgd-title">{local.name}</h1>
            <div className="orgd-sub text-muted">@{local.slug} • created {new Date(local.createdAt).toLocaleDateString()}</div>
            <div className="orgd-badges">
              <span className={`badge plan plan--${local.plan.toLowerCase()}`}>{local.plan}</span>
              <span className={`badge status status--${local.status}`}>{local.status}</span>
            </div>
          </div>
        </div>

        <div className="orgd-actions">
          <button className="btn" onClick={() => setAdminOpen(true)}>Setup Client Admin</button>
          {editing ? (
            <>
              <button className="btn" onClick={cancel}><FiX /> Cancel</button>
              <button className="btn btn-primary" onClick={save}><FiSave /> Save changes</button>
            </>
          ) : (
            <>
              <button className={`btn ${local.status === "active" ? "warn" : ""}`} onClick={requestStatusChange}>
                {local.status === "active" ? (<><FiPauseCircle /> Suspend</>) : (<><FiPlayCircle /> Reactivate</>)}
              </button>
              <button className="btn" onClick={() => setEditing(true)}><FiEdit2 /> Edit</button>
            </>
          )}
        </div>
      </section>

      {/* Tabs */}
      <div className="orgd-tabs">
        <button className={`tab ${tab==="overview"?"is-active":""}`} onClick={()=>setTab("overview")}>Overview</button>
        <button className={`tab ${tab==="profile"?"is-active":""}`} onClick={()=>setTab("profile")}>Profile</button>
        <button className={`tab ${tab==="subscription"?"is-active":""}`} onClick={()=>setTab("subscription")}>Subscription</button>
        <button className={`tab ${tab==="activity"?"is-active":""}`} onClick={()=>setTab("activity")}>Activity</button>
      </div>

      {/* Content */}
      {tab === "overview" && (
        <section className="orgd-grid">
          <div className="panel orgd-card">
            <h3>Usage & Health</h3>
            <div className="orgd-stats">
              <div className="orgd-stat">
                <div className="stat-label">Agents</div>
                <div className="stat-main"><FiUsers /> {local.seats.used}/{local.seats.total}</div>
                <div className="org-progress"><div className="org-progress__fill" style={{ width: `${seatPct}%` }} /></div>
              </div>

              <div className="orgd-stat">
                <div className="stat-label">Tickets (24h)</div>
                <div className="stat-main"><FiTrendingUp /> {local.tickets24h}</div>
                <Sparkline />
              </div>
            </div>
          </div>

          <div className="panel orgd-card">
            <h3>Quick Info</h3>
            <div className="quick-info">
              <div><span className="k">Country: </span><span className="v"> {local.country || "—"}</span></div>
              <div><span className="k">Industry: </span><span className="v"> {local.industry || "—"}</span></div>
              <div><span className="k">Domain: </span><span className="v"> {local.domain || "—"}</span></div>
              <div><span className="k">Brand Color: </span>
                <span className="v">
                  <span className="chip" style={{ background: isHex(local.color)?local.color:"var(--surface-3)" }} />
                  {local.color || "—"}
                </span>
              </div>
              <div><span className="k">Logo: </span><span className="v">{local.logoUrl ? <a href={local.logoUrl} target="_blank" rel="noreferrer">Open link</a> : "—"}</span></div>
            </div>
          </div>
        </section>
      )}

      {tab === "profile" && (
        <section className="panel orgd-card">
          <h3>Organization Profile</h3>
          <div className="orgd-form">
            <Field label="Name">
              <input disabled={!editing} value={local.name}
                onChange={e => setLocal({ ...local, name: e.target.value })} />
            </Field>

            <Field label="Slug">
              <input disabled={!editing} value={local.slug}
                onChange={e => setLocal({ ...local, slug: slugify(e.target.value) })} />
            </Field>

            <div className="field-row">
              <Field label="Country" icon={<FiFlag />}>
                <input disabled={!editing} value={local.country}
                  onChange={e => setLocal({ ...local, country: e.target.value })} placeholder="Kenya" />
              </Field>

              <Field label="Industry" icon={<FiPackage />}>
                <input disabled={!editing} value={local.industry}
                  onChange={e => setLocal({ ...local, industry: e.target.value })} placeholder="Logistics" />
              </Field>
            </div>

            <Field label="Primary Domain" icon={<FiGlobe />}>
              <input disabled={!editing} value={local.domain}
                onChange={e => setLocal({ ...local, domain: e.target.value })} placeholder="company.co.ke" />
            </Field>

            {/* Brand color as HEX code only */}
            <Field label="Brand Color (HEX)">
              <div className="color-row">
                <span className="swatch" style={{ background: isHex(local.color) ? local.color : "transparent" }} />
                <input
                  disabled={!editing}
                  value={local.color}
                  onChange={e => setLocal({ ...local, color: e.target.value })}
                  placeholder="#12b886"
                  spellCheck={false}
                />
              </div>
            </Field>

            {/* Logo by link or upload */}
            <div className="field-row">
              <Field label="Logo URL">
                <div className="logo-row">
                  <FiLink />
                  <input
                    disabled={!editing}
                    value={local.logoUrl || ""}
                    onChange={(e) => { setLogoPreview(null); setLocal({ ...local, logoUrl: e.target.value }); }}
                    placeholder="https://example.com/logo.png"
                    spellCheck={false}
                  />
                </div>
              </Field>

              <Field label="Upload Logo">
                <label className={`file ${!editing ? "is-disabled" : ""}`}>
                  <input type="file" accept="image/*" disabled={!editing} onChange={onFile} />
                  <FiUpload /> <span>Choose file</span>
                </label>
              </Field>
            </div>

            {effectiveLogo && (
              <div className="logo-preview">
                <div className="orgd-avatar" style={{ background: local.color }}>
                  <img src={effectiveLogo} alt="Logo preview" />
                </div>
                <span className="text-muted">Preview</span>
              </div>
            )}
          </div>
        </section>
      )}

      {tab === "subscription" && (
        <section className="panel orgd-card">
          <h3>Subscription</h3>
          <div className="field-row">
            <Field label="Plan">
              <select disabled={!editing} value={local.plan}
                onChange={e => setLocal({ ...local, plan: e.target.value as Plan })}>
                <option>Free</option><option>Standard</option><option>Premium</option><option>Enterprise</option>
              </select>
            </Field>

            <Field label="Seats (total)">
              <input type="number" min={1} disabled={!editing} value={local.seats.total}
                onChange={e => setLocal({ ...local, seats: { ...local.seats, total: Math.max(1, +e.target.value||1) } })} />
            </Field>
          </div>
        </section>
      )}

      {tab === "activity" && (
        <section className="panel orgd-card">
          <h3>Recent Activity</h3>
          <ul className="orgd-activity">
            {[
              "Changed plan to Premium",
              "Added 5 agent seats",
              "Owner email updated",
              "SLA template assigned",
            ].map((m, i) => (
              <li key={i}>
                <span className="dot" />
                <span className="msg">{m}</span>
                <time className="time text-muted">just now</time>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Confirm Suspend/Reactivate */}
      {confirmOpen && (
        <div className="modal" role="dialog" aria-modal="true">
          <div className="modal__panel">
            <h3>{local.status === "active" ? "Suspend organization?" : "Reactivate organization?"}</h3>
            <p className="text-muted">
              {local.status === "active"
                ? "Agents and end-users will lose access until reactivated."
                : "This organization will regain access immediately."}
            </p>
            <div className="modal__actions">
              <button className="btn" onClick={() => setConfirmOpen(false)}><FiX /> Cancel</button>
              <button className={`btn ${local.status === "active" ? "warn" : "btn-primary"}`} onClick={confirmStatusChange}>
                {local.status === "active" ? <><FiPauseCircle /> Suspend</> : <><FiPlayCircle /> Reactivate</>}
              </button>
            </div>
          </div>
          <div className="modal__backdrop" onClick={() => setConfirmOpen(false)} />
        </div>
      )}

      {/* Setup Client Admin */}
      {adminOpen && (
        <div className="modal" role="dialog" aria-modal="true">
          <form className="modal__panel" onSubmit={saveAdmin}>
            <h3>Setup Client Admin</h3>
            <div className="field-row">
              <label className="field">
                <span className="field__label"><em>Full Name</em></span>
                <input value={adminForm.name} onChange={(e)=>setAdminForm(f=>({...f, name:e.target.value}))} required />
              </label>
              <label className="field">
                <span className="field__label"><em>Email</em></span>
                <input type="email" value={adminForm.email} onChange={(e)=>setAdminForm(f=>({...f, email:e.target.value}))} required />
              </label>
            </div>

            <label className="field">
              <span className="field__label"><em>Role</em></span>
              <select value={adminForm.role} onChange={(e)=>setAdminForm(f=>({...f, role:e.target.value}))}>
                <option>Client Admin</option>
                <option>Workspace Owner</option>
                <option>Helpdesk Admin</option>
              </select>
            </label>

            <div className="field-row">
              <label className="field">
                <span className="field__label"><em>Temp Password</em></span>
                <div className="pwd-row">
                  <input
                    type={showPwd ? "text" : "password"}
                    value={adminForm.password}
                    onChange={(e)=>setAdminForm(f=>({...f, password:e.target.value}))}
                    minLength={8}
                    required
                    placeholder="At least 8 characters"
                  />
                  <button type="button" className="btn btn-icon" onClick={()=>setShowPwd(s=>!s)} aria-label="Toggle visibility">
                    {showPwd ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </label>

              <label className="field">
                <span className="field__label"><em>Confirm Password</em></span>
                <input
                  type={showPwd ? "text" : "password"}
                  value={adminForm.confirm}
                  onChange={(e)=>setAdminForm(f=>({...f, confirm:e.target.value}))}
                  minLength={8}
                  required
                />
              </label>
            </div>

            <label className="checkbox">
              <input type="checkbox" checked={adminForm.forceReset} onChange={(e)=>setAdminForm(f=>({...f, forceReset:e.target.checked}))} />
              <span>Require password reset on first login</span>
            </label>

            <div className="modal__actions">
              <button type="button" className="btn" onClick={()=>setAdminOpen(false)}><FiX /> Cancel</button>
              <button type="submit" className="btn btn-primary"><FiSave /> Save Admin</button>
            </div>
          </form>
          <div className="modal__backdrop" onClick={()=>setAdminOpen(false)} />
        </div>
      )}
    </div>
  );
}

function Field({ label, icon, children }: { label: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="field">
      <span className="field__label">{icon}<em>{label}</em></span>
      {children}
    </label>
  );
}

function Sparkline() {
  return (
    <svg viewBox="0 0 240 60" className="spark" preserveAspectRatio="none" aria-hidden>
      <polyline fill="none" stroke="currentColor" strokeOpacity="0.28" strokeWidth="2"
        points="0,40 20,33 40,38 60,26 80,30 100,24 120,28 140,23 160,30 180,26 200,30 220,28 240,32"/>
      <polyline fill="none" stroke="var(--brand)" strokeWidth="2.6"
        points="0,42 20,35 40,40 60,28 80,32 100,26 120,30 140,25 160,32 180,28 200,32 220,30 240,34"/>
    </svg>
  );
}

function initials(name: string) {
  const p = name.trim().split(/\s+/);
  return ((p[0]?.[0] || "") + (p[1]?.[0] || "")).toUpperCase();
}
function slugify(v: string) {
  return v.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
}
