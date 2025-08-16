import { useMemo, useState } from "react";
import {
  FiSettings,
  FiImage,
  FiShield,
  FiMail,
  FiSliders,
  FiLink2,
  FiDollarSign,
  FiDatabase,
  FiLock,
  FiCopy,
  FiRefreshCw,
  FiEye,
  FiEyeOff,
  FiPlus,
  FiX,
  FiCheck,
  FiTrash2,
  FiSend,
} from "react-icons/fi";
import "./Settings.css";

/* ================= Types & Helpers ================ */

type Currency = "KES" | "USD" | "EUR" | "GBP";
const allCurrencies: Currency[] = ["KES", "USD", "EUR", "GBP"];

const allTimezones = [
  "Africa/Nairobi",
  "UTC",
  "Africa/Kampala",
  "Africa/Dar_es_Salaam",
  "Africa/Addis_Ababa",
];

const locales = ["en-KE", "en-US", "en-GB", "sw-KE"];

type Role = "Helpdesk Admin" | "Agent" | "Viewer";

type Permissions =
  | "manage_users"
  | "manage_plans"
  | "view_billing"
  | "export_data"
  | "delete_tickets"
  | "configure_slas";

const PERMS: { key: Permissions; label: string }[] = [
  { key: "manage_users", label: "Manage Users" },
  { key: "manage_plans", label: "Manage Plans" },
  { key: "view_billing", label: "View Billing" },
  { key: "export_data", label: "Export Data" },
  { key: "delete_tickets", label: "Delete Tickets" },
  { key: "configure_slas", label: "Configure SLAs" },
];

function slugify(v: string) {
  return v.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
}
function isHex(v: string) {
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v);
}
function copy(text: string) {
  if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text);
}

/* ================= Component ================= */

export default function SASettings() {
  const [tab, setTab] = useState<
    | "general"
    | "branding"
    | "auth"
    | "email"
    | "ticketing"
    | "integrations"
    | "billing"
    | "privacy"
    | "roles"
  >("general");

  /* ---- General ---- */
  const [general, setGeneral] = useState({
    companyName: "QuickDesk",
    companySlug: "quickdesk",
    defaultCurrency: "KES" as Currency,
    timezone: "Africa/Nairobi",
    locale: "en-KE",
    portalDomain: "desk.your-company.co.ke",
  });

  /* ---- Branding ---- */
  const [branding, setBranding] = useState({
    logoUrl: "",
    colorPrimary: "#1fb59b",
    colorAccent: "#7c4dff",
    faviconUrl: "",
    useClientColors: true,
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const logoPreview = useMemo(() => (logoFile ? URL.createObjectURL(logoFile) : branding.logoUrl), [logoFile, branding.logoUrl]);

  /* ---- Auth & Security ---- */
  const [auth, setAuth] = useState({
    mfaRequired: false,
    passwordMinLength: 8,
    requireSymbols: true,
    sessionHours: 24,
    allowSSO: false,
    samlEntryPoint: "",
    samlIssuer: "",
    ipAllowlist: ["102.221.16.10"],
    oauthGoogle: false,
  });

  /* ---- Email & Notifications ---- */
  const [email, setEmail] = useState({
    smtpHost: "",
    smtpPort: 587,
    smtpUser: "",
    smtpPass: "",
    fromName: "QuickDesk",
    fromEmail: "no-reply@quickdesk.com",
    replyTo: "",
  });
  const [showSmtpPass, setShowSmtpPass] = useState(false);
  const [testEmailOpen, setTestEmailOpen] = useState(false);

  /* ---- Ticketing Defaults ---- */
  const [ticketing, setTicketing] = useState({
    defaultPriority: "Normal",
    categories: ["General", "Billing", "Technical"],
    statuses: ["Open", "Pending", "Resolved", "Closed"],
    slaFirstResponseHrs: 4,
    slaResolutionHrs: 48,
    workingHours: "Mon–Fri, 8:00–17:00 EAT",
  });

  /* ---- Integrations ---- */
  const [integrations, setIntegrations] = useState({
    webhookUrl: "",
    webhookSecret: "whsec_xxxxxxxxx",
    apiKey: "qdsk_live_xxx_12345",
    events: {
      ticket_created: true,
      ticket_updated: true,
      ticket_closed: true,
      user_invited: false,
    },
  });
  const [revealApi, setRevealApi] = useState(false);
  const [revealSecret, setRevealSecret] = useState(false);
  const [confirm, setConfirm] = useState<null | { kind: "rotate_api" | "rotate_secret" | "delete_org" | "export_data" }>(null);

  /* ---- Billing ---- */
  const [billing, setBilling] = useState({
    legalName: "QuickDesk Inc.",
    address: "Uhuru Highway, Nairobi",
    taxId: "P0123456Z",
    invoicePrefix: "QD-",
    currency: "KES" as Currency,
  });

  /* ---- Data & Privacy ---- */
  const [privacy, setPrivacy] = useState({
    retentionDays: 365,
    allowDataExport: true,
    autoBackups: true,
  });

  /* ---- Roles & Permissions ---- */
  const [roles, setRoles] = useState<Record<Role, Partial<Record<Permissions, boolean>>>>({
    "Helpdesk Admin": {
      manage_users: true,
      manage_plans: true,
      view_billing: true,
      export_data: true,
      delete_tickets: true,
      configure_slas: true,
    },
    Agent: {
      manage_users: false,
      manage_plans: false,
      view_billing: false,
      export_data: true,
      delete_tickets: true,
      configure_slas: false,
    },
    Viewer: {
      manage_users: false,
      manage_plans: false,
      view_billing: true,
      export_data: false,
      delete_tickets: false,
      configure_slas: false,
    },
  });

  /* ---------------- Actions (demo only) ---------------- */
  function saveToast(section: string) {
    // simple UX feedback
    alert(`Saved ${section} settings.`);
  }

  function addChip(list: string[], label: string) {
    const v = prompt(`Add ${label}:`)?.trim();
    if (!v) return list;
    if (list.includes(v)) return list;
    return [...list, v];
  }

  function removeChip(list: string[], item: string) {
    return list.filter((x) => x !== item);
  }

  /* ================= Render ================= */
  return (
    <div className="qdset-page">
      {/* Tabs header */}
      <section className="panel qdset-tabs">
        <TabBtn id="general"  icon={<FiSettings />}  label="General"     active={tab} setActive={setTab} />
        <TabBtn id="branding" icon={<FiImage />}     label="Branding"    active={tab} setActive={setTab} />
        <TabBtn id="auth"     icon={<FiShield />}    label="Auth & Security" active={tab} setActive={setTab} />
        <TabBtn id="email"    icon={<FiMail />}      label="Email"       active={tab} setActive={setTab} />
        <TabBtn id="ticketing"icon={<FiSliders />}   label="Ticketing"   active={tab} setActive={setTab} />
        <TabBtn id="integrations" icon={<FiLink2 />} label="Integrations" active={tab} setActive={setTab} />
        <TabBtn id="billing"  icon={<FiDollarSign />} label="Billing"    active={tab} setActive={setTab} />
        <TabBtn id="privacy"  icon={<FiDatabase />}  label="Data & Privacy" active={tab} setActive={setTab} />
        <TabBtn id="roles"    icon={<FiLock />}      label="Roles & Permissions" active={tab} setActive={setTab} />
      </section>

      {/* Sections */}
      {tab === "general" && (
        <section className="panel qdset-section">
          <h2 className="qdset-h2">General</h2>
          <div className="qdset-grid-2">
            <Field label="Company Name">
              <div className="qdset-input">
                <input
                  value={general.companyName}
                  onChange={(e) =>
                    setGeneral((g) => ({ ...g, companyName: e.target.value, companySlug: g.companySlug || slugify(e.target.value) }))
                  }
                  placeholder="QuickDesk"
                />
              </div>
            </Field>

            <Field label="Slug">
              <div className="qdset-input">
                <input
                  value={general.companySlug}
                  onChange={(e) => setGeneral((g) => ({ ...g, companySlug: slugify(e.target.value) }))}
                  placeholder="quickdesk"
                />
              </div>
            </Field>
          </div>

          <div className="qdset-grid-3">
            <Field label="Default Currency">
              <div className="qdset-input">
                <select
                  value={general.defaultCurrency}
                  onChange={(e) => setGeneral((g) => ({ ...g, defaultCurrency: e.target.value as Currency }))}
                >
                  {allCurrencies.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
            </Field>

            <Field label="Timezone">
              <div className="qdset-input">
                <select
                  value={general.timezone}
                  onChange={(e) => setGeneral((g) => ({ ...g, timezone: e.target.value }))}
                >
                  {allTimezones.map((z) => <option key={z}>{z}</option>)}
                </select>
              </div>
            </Field>

            <Field label="Locale">
              <div className="qdset-input">
                <select
                  value={general.locale}
                  onChange={(e) => setGeneral((g) => ({ ...g, locale: e.target.value }))}
                >
                  {locales.map((l) => <option key={l}>{l}</option>)}
                </select>
              </div>
            </Field>
          </div>

          <Field label="Portal Domain">
            <div className="qdset-input">
              <input
                value={general.portalDomain}
                onChange={(e) => setGeneral((g) => ({ ...g, portalDomain: e.target.value }))}
                placeholder="desk.your-company.co.ke"
              />
            </div>
          </Field>

          <div className="qdset-actions">
            <button className="btn" onClick={() => saveToast("General")}>Cancel</button>
            <button className="btn btn-primary" onClick={() => saveToast("General")}>Save Changes</button>
          </div>
        </section>
      )}

      {tab === "branding" && (
        <section className="panel qdset-section">
          <h2 className="qdset-h2">Branding</h2>

          <div className="qdset-brandrow">
            <div className="qdset-logo">
              <div className="qdset-logo__preview">
                {logoPreview ? <img src={logoPreview} alt="Logo preview" /> : <div className="qdset-logo__placeholder">No Logo</div>}
              </div>
              <div className="qdset-logo__actions">
                <label className="btn">
                  <FiPlus /> Upload
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                  />
                </label>
                <button className="btn" onClick={() => setLogoFile(null)}>Remove</button>
              </div>
            </div>

            <div className="qdset-grid-2">
              <Field label="Logo URL">
                <div className="qdset-input">
                  <input
                    value={branding.logoUrl}
                    onChange={(e) => setBranding((b) => ({ ...b, logoUrl: e.target.value }))}
                    placeholder="https://example.com/logo.png"
                    spellCheck={false}
                  />
                </div>
              </Field>

              <Field label="Favicon URL">
                <div className="qdset-input">
                  <input
                    value={branding.faviconUrl}
                    onChange={(e) => setBranding((b) => ({ ...b, faviconUrl: e.target.value }))}
                    placeholder="https://example.com/favicon.png"
                    spellCheck={false}
                  />
                </div>
              </Field>

              <Field label="Primary Color (HEX)" hint={!isHex(branding.colorPrimary) ? "Use #RRGGBB" : ""} error={!isHex(branding.colorPrimary)}>
                <div className="qdset-input">
                  <span className="qdset-swatch" style={{ background: isHex(branding.colorPrimary) ? branding.colorPrimary : "transparent" }} />
                  <input
                    value={branding.colorPrimary}
                    onChange={(e) => setBranding((b) => ({ ...b, colorPrimary: e.target.value }))}
                    placeholder="#1fb59b"
                    spellCheck={false}
                  />
                </div>
              </Field>

              <Field label="Accent Color (HEX)" hint={!isHex(branding.colorAccent) ? "Use #RRGGBB" : ""} error={!isHex(branding.colorAccent)}>
                <div className="qdset-input">
                  <span className="qdset-swatch" style={{ background: isHex(branding.colorAccent) ? branding.colorAccent : "transparent" }} />
                  <input
                    value={branding.colorAccent}
                    onChange={(e) => setBranding((b) => ({ ...b, colorAccent: e.target.value }))}
                    placeholder="#7c4dff"
                    spellCheck={false}
                  />
                </div>
              </Field>

              <label className="qdset-check">
                <input
                  type="checkbox"
                  checked={branding.useClientColors}
                  onChange={(e) => setBranding((b) => ({ ...b, useClientColors: e.target.checked }))}
                />
                <span>Allow clients to override theme colors</span>
              </label>
            </div>
          </div>

          <div className="qdset-actions">
            <button className="btn" onClick={() => saveToast("Branding")}>Cancel</button>
            <button className="btn btn-primary" onClick={() => saveToast("Branding")}>Save Changes</button>
          </div>
        </section>
      )}

      {tab === "auth" && (
        <section className="panel qdset-section">
          <h2 className="qdset-h2">Authentication & Security</h2>

          <div className="qdset-grid-3">
            <label className="qdset-check">
              <input
                type="checkbox"
                checked={auth.mfaRequired}
                onChange={(e) => setAuth((a) => ({ ...a, mfaRequired: e.target.checked }))}
              />
              <span>Require MFA for all users</span>
            </label>

            <Field label="Password min length">
              <div className="qdset-input">
                <input
                  type="number"
                  min={6}
                  value={auth.passwordMinLength}
                  onChange={(e) => setAuth((a) => ({ ...a, passwordMinLength: Math.max(6, Number(e.target.value) || 6) }))}
                />
              </div>
            </Field>

            <label className="qdset-check">
              <input
                type="checkbox"
                checked={auth.requireSymbols}
                onChange={(e) => setAuth((a) => ({ ...a, requireSymbols: e.target.checked }))}
              />
              <span>Require symbols in passwords</span>
            </label>
          </div>

          <div className="qdset-grid-3">
            <Field label="Session duration (hours)">
              <div className="qdset-input">
                <input
                  type="number"
                  min={1}
                  value={auth.sessionHours}
                  onChange={(e) => setAuth((a) => ({ ...a, sessionHours: Math.max(1, Number(e.target.value) || 1) }))}
                />
              </div>
            </Field>

            <label className="qdset-check">
              <input
                type="checkbox"
                checked={auth.allowSSO}
                onChange={(e) => setAuth((a) => ({ ...a, allowSSO: e.target.checked }))}
              />
              <span>Enable SSO (SAML)</span>
            </label>

            <label className="qdset-check">
              <input
                type="checkbox"
                checked={auth.oauthGoogle}
                onChange={(e) => setAuth((a) => ({ ...a, oauthGoogle: e.target.checked }))}
              />
              <span>Enable Google OAuth</span>
            </label>
          </div>

          {auth.allowSSO && (
            <div className="qdset-grid-2">
              <Field label="SAML Entry Point">
                <div className="qdset-input">
                  <input
                    value={auth.samlEntryPoint}
                    onChange={(e) => setAuth((a) => ({ ...a, samlEntryPoint: e.target.value }))}
                    placeholder="https://idp.example.com/saml/login"
                    spellCheck={false}
                  />
                </div>
              </Field>
              <Field label="SAML Issuer">
                <div className="qdset-input">
                  <input
                    value={auth.samlIssuer}
                    onChange={(e) => setAuth((a) => ({ ...a, samlIssuer: e.target.value }))}
                    placeholder="quickdesk"
                    spellCheck={false}
                  />
                </div>
              </Field>
            </div>
          )}

          <Field label="IP Allowlist">
            <div className="qdset-chips">
              {auth.ipAllowlist.map((ip) => (
                <span className="qdset-chip" key={ip}>
                  {ip}
                  <button className="qdset-chip__x" onClick={() => setAuth((a) => ({ ...a, ipAllowlist: removeChip(a.ipAllowlist, ip) }))}><FiX /></button>
                </span>
              ))}
              <button
                className="btn"
                onClick={() => setAuth((a) => ({ ...a, ipAllowlist: addChip(a.ipAllowlist, "IP") } as any))}
              >
                <FiPlus /> Add IP
              </button>
            </div>
          </Field>

          <div className="qdset-actions">
            <button className="btn" onClick={() => saveToast("Auth")}>Cancel</button>
            <button className="btn btn-primary" onClick={() => saveToast("Auth")}>Save Changes</button>
          </div>
        </section>
      )}

      {tab === "email" && (
        <section className="panel qdset-section">
          <h2 className="qdset-h2">Email & Notifications</h2>

          <div className="qdset-grid-3">
            <Field label="SMTP Host">
              <div className="qdset-input">
                <input
                  value={email.smtpHost}
                  onChange={(e) => setEmail((s) => ({ ...s, smtpHost: e.target.value }))}
                  placeholder="smtp.mailprovider.com"
                />
              </div>
            </Field>

            <Field label="SMTP Port">
              <div className="qdset-input">
                <input
                  type="number"
                  min={1}
                  value={email.smtpPort}
                  onChange={(e) => setEmail((s) => ({ ...s, smtpPort: Number(e.target.value) || 587 }))}
                />
              </div>
            </Field>

            <Field label="SMTP User">
              <div className="qdset-input">
                <input
                  value={email.smtpUser}
                  onChange={(e) => setEmail((s) => ({ ...s, smtpUser: e.target.value }))}
                />
              </div>
            </Field>
          </div>

          <div className="qdset-grid-2">
            <Field label="SMTP Password">
              <div className="qdset-input">
                <input
                  type={showSmtpPass ? "text" : "password"}
                  value={email.smtpPass}
                  onChange={(e) => setEmail((s) => ({ ...s, smtpPass: e.target.value }))}
                />
                <button type="button" className="qdset-iconbtn" onClick={() => setShowSmtpPass((v) => !v)}>
                  {showSmtpPass ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </Field>

            <div />
          </div>

          <div className="qdset-grid-3">
            <Field label="From Name">
              <div className="qdset-input">
                <input
                  value={email.fromName}
                  onChange={(e) => setEmail((s) => ({ ...s, fromName: e.target.value }))}
                />
              </div>
            </Field>

            <Field label="From Email">
              <div className="qdset-input">
                <input
                  value={email.fromEmail}
                  onChange={(e) => setEmail((s) => ({ ...s, fromEmail: e.target.value }))}
                />
              </div>
            </Field>

            <Field label="Reply-To (optional)">
              <div className="qdset-input">
                <input
                  value={email.replyTo}
                  onChange={(e) => setEmail((s) => ({ ...s, replyTo: e.target.value }))}
                />
              </div>
            </Field>
          </div>

          <div className="qdset-actions">
            <button className="btn" onClick={() => setTestEmailOpen(true)}>
              <FiSend /> Send Test
            </button>
            <div className="qdset-spacer" />
            <button className="btn" onClick={() => saveToast("Email")}>Cancel</button>
            <button className="btn btn-primary" onClick={() => saveToast("Email")}>Save Changes</button>
          </div>
        </section>
      )}

      {tab === "ticketing" && (
        <section className="panel qdset-section">
          <h2 className="qdset-h2">Ticketing Defaults</h2>

          <div className="qdset-grid-3">
            <Field label="Default Priority">
              <div className="qdset-input">
                <select
                  value={ticketing.defaultPriority}
                  onChange={(e) => setTicketing((t) => ({ ...t, defaultPriority: e.target.value }))}
                >
                  <option>Low</option>
                  <option>Normal</option>
                  <option>High</option>
                  <option>Urgent</option>
                </select>
              </div>
            </Field>

            <Field label="SLA — First Response (hrs)">
              <div className="qdset-input">
                <input
                  type="number"
                  min={1}
                  value={ticketing.slaFirstResponseHrs}
                  onChange={(e) => setTicketing((t) => ({ ...t, slaFirstResponseHrs: Math.max(1, Number(e.target.value) || 1) }))}
                />
              </div>
            </Field>

            <Field label="SLA — Resolution (hrs)">
              <div className="qdset-input">
                <input
                  type="number"
                  min={1}
                  value={ticketing.slaResolutionHrs}
                  onChange={(e) => setTicketing((t) => ({ ...t, slaResolutionHrs: Math.max(1, Number(e.target.value) || 1) }))}
                />
              </div>
            </Field>
          </div>

          <Field label="Categories">
            <div className="qdset-chips">
              {ticketing.categories.map((c) => (
                <span className="qdset-chip" key={c}>
                  {c}
                  <button className="qdset-chip__x" onClick={() => setTicketing((t) => ({ ...t, categories: removeChip(t.categories, c) }))}><FiX /></button>
                </span>
              ))}
              <button className="btn" onClick={() => setTicketing((t) => ({ ...t, categories: addChip(t.categories, "Category") }))}>
                <FiPlus /> Add Category
              </button>
            </div>
          </Field>

          <Field label="Statuses">
            <div className="qdset-chips">
              {ticketing.statuses.map((s) => (
                <span className="qdset-chip" key={s}>
                  {s}
                  <button className="qdset-chip__x" onClick={() => setTicketing((t) => ({ ...t, statuses: removeChip(t.statuses, s) }))}><FiX /></button>
                </span>
              ))}
              <button className="btn" onClick={() => setTicketing((t) => ({ ...t, statuses: addChip(t.statuses, "Status") }))}>
                <FiPlus /> Add Status
              </button>
            </div>
          </Field>

          <Field label="Working Hours">
            <div className="qdset-input">
              <input
                value={ticketing.workingHours}
                onChange={(e) => setTicketing((t) => ({ ...t, workingHours: e.target.value }))}
                placeholder="Mon–Fri, 8:00–17:00 EAT"
              />
            </div>
          </Field>

          <div className="qdset-actions">
            <button className="btn" onClick={() => saveToast("Ticketing")}>Cancel</button>
            <button className="btn btn-primary" onClick={() => saveToast("Ticketing")}>Save Changes</button>
          </div>
        </section>
      )}

      {tab === "integrations" && (
        <section className="panel qdset-section">
          <h2 className="qdset-h2">Integrations</h2>

          <div className="qdset-grid-2">
            <Field label="Webhook URL">
              <div className="qdset-input">
                <input
                  value={integrations.webhookUrl}
                  onChange={(e) => setIntegrations((i) => ({ ...i, webhookUrl: e.target.value }))}
                  placeholder="https://api.example.com/webhooks/quickdesk"
                  spellCheck={false}
                />
              </div>
            </Field>

            <Field label="Webhook Secret">
              <div className="qdset-input">
                <input
                  type={revealSecret ? "text" : "password"}
                  value={integrations.webhookSecret}
                  onChange={(e) => setIntegrations((i) => ({ ...i, webhookSecret: e.target.value }))}
                  spellCheck={false}
                />
                <button type="button" className="qdset-iconbtn" onClick={() => setRevealSecret((v) => !v)}>
                  {revealSecret ? <FiEyeOff /> : <FiEye />}
                </button>
                <button type="button" className="qdset-iconbtn" onClick={() => copy(integrations.webhookSecret)} title="Copy">
                  <FiCopy />
                </button>
                <button type="button" className="qdset-iconbtn" onClick={() => setConfirm({ kind: "rotate_secret" })} title="Rotate">
                  <FiRefreshCw />
                </button>
              </div>
            </Field>
          </div>

          <Field label="Events">
            <div className="qdset-pills">
              {Object.entries(integrations.events).map(([k, v]) => (
                <label key={k} className={`qdset-pill ${v ? "is-on" : ""}`}>
                  <input
                    type="checkbox"
                    checked={v}
                    onChange={(e) => setIntegrations((i) => ({ ...i, events: { ...i.events, [k]: e.target.checked } }))}
                  />
                  <span>{k.replaceAll("_", " ")}</span>
                </label>
              ))}
            </div>
          </Field>

          <Field label="API Key">
            <div className="qdset-input">
              <input
                type={revealApi ? "text" : "password"}
                value={integrations.apiKey}
                onChange={(e) => setIntegrations((i) => ({ ...i, apiKey: e.target.value }))}
                spellCheck={false}
              />
              <button type="button" className="qdset-iconbtn" onClick={() => setRevealApi((v) => !v)}>
                {revealApi ? <FiEyeOff /> : <FiEye />}
              </button>
              <button type="button" className="qdset-iconbtn" onClick={() => copy(integrations.apiKey)} title="Copy">
                <FiCopy />
              </button>
              <button type="button" className="qdset-iconbtn" onClick={() => setConfirm({ kind: "rotate_api" })} title="Rotate">
                <FiRefreshCw />
              </button>
            </div>
          </Field>

          <div className="qdset-actions">
            <button className="btn" onClick={() => saveToast("Integrations")}>Cancel</button>
            <button className="btn btn-primary" onClick={() => saveToast("Integrations")}>Save Changes</button>
          </div>
        </section>
      )}

      {tab === "billing" && (
        <section className="panel qdset-section">
          <h2 className="qdset-h2">Billing & Invoicing</h2>

          <div className="qdset-grid-2">
            <Field label="Legal Name">
              <div className="qdset-input">
                <input
                  value={billing.legalName}
                  onChange={(e) => setBilling((b) => ({ ...b, legalName: e.target.value }))}
                />
              </div>
            </Field>
            <Field label="Tax ID">
              <div className="qdset-input">
                <input
                  value={billing.taxId}
                  onChange={(e) => setBilling((b) => ({ ...b, taxId: e.target.value }))}
                />
              </div>
            </Field>
          </div>

          <Field label="Billing Address">
            <div className="qdset-input">
              <input
                value={billing.address}
                onChange={(e) => setBilling((b) => ({ ...b, address: e.target.value }))}
              />
            </div>
          </Field>

          <div className="qdset-grid-2">
            <Field label="Invoice Prefix">
              <div className="qdset-input">
                <input
                  value={billing.invoicePrefix}
                  onChange={(e) => setBilling((b) => ({ ...b, invoicePrefix: e.target.value }))}
                />
              </div>
            </Field>
            <Field label="Billing Currency">
              <div className="qdset-input">
                <select
                  value={billing.currency}
                  onChange={(e) => setBilling((b) => ({ ...b, currency: e.target.value as Currency }))}
                >
                  {allCurrencies.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
            </Field>
          </div>

          <div className="qdset-actions">
            <button className="btn" onClick={() => saveToast("Billing")}>Cancel</button>
            <button className="btn btn-primary" onClick={() => saveToast("Billing")}>Save Changes</button>
          </div>
        </section>
      )}

      {tab === "privacy" && (
        <section className="panel qdset-section">
          <h2 className="qdset-h2">Data & Privacy</h2>

          <div className="qdset-grid-3">
            <Field label="Data Retention (days)">
              <div className="qdset-input">
                <input
                  type="number"
                  min={30}
                  value={privacy.retentionDays}
                  onChange={(e) => setPrivacy((p) => ({ ...p, retentionDays: Math.max(30, Number(e.target.value) || 30) }))}
                />
              </div>
            </Field>

            <label className="qdset-check">
              <input
                type="checkbox"
                checked={privacy.allowDataExport}
                onChange={(e) => setPrivacy((p) => ({ ...p, allowDataExport: e.target.checked }))}
              />
              <span>Allow Org Data Export</span>
            </label>

            <label className="qdset-check">
              <input
                type="checkbox"
                checked={privacy.autoBackups}
                onChange={(e) => setPrivacy((p) => ({ ...p, autoBackups: e.target.checked }))}
              />
              <span>Automatic Backups</span>
            </label>
          </div>

          <div className="qdset-danger">
            <div className="qdset-danger__text">
              <strong>Danger Zone</strong>
              <p className="text-muted">Export all data or permanently delete this org.</p>
            </div>
            <div className="qdset-danger__cta">
              <button className="btn" onClick={() => setConfirm({ kind: "export_data" })}>Export Data</button>
              <button className="btn btn-ghost danger" onClick={() => setConfirm({ kind: "delete_org" })}>
                <FiTrash2 /> Delete Org
              </button>
            </div>
          </div>

          <div className="qdset-actions">
            <button className="btn" onClick={() => saveToast("Privacy")}>Cancel</button>
            <button className="btn btn-primary" onClick={() => saveToast("Privacy")}>Save Changes</button>
          </div>
        </section>
      )}

      {tab === "roles" && (
        <section className="panel qdset-section">
          <h2 className="qdset-h2">Roles & Permissions</h2>
          <div className="qdset-tablewrap">
            <table className="qdset-table">
              <thead>
                <tr>
                  <th>Permission</th>
                  {(["Helpdesk Admin", "Agent", "Viewer"] as Role[]).map((r) => (
                    <th key={r}>{r}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PERMS.map((p) => (
                  <tr key={p.key}>
                    <td className="qdset-permname">{p.label}</td>
                    {(["Helpdesk Admin", "Agent", "Viewer"] as Role[]).map((r) => (
                      <td key={r} className="qdset-cell">
                        <label className="qdset-switch">
                          <input
                            type="checkbox"
                            checked={!!roles[r]?.[p.key]}
                            onChange={(e) =>
                              setRoles((prev) => ({
                                ...prev,
                                [r]: { ...(prev[r] || {}), [p.key]: e.target.checked },
                              }))
                            }
                          />
                          <span />
                        </label>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="qdset-actions">
            <button className="btn" onClick={() => saveToast("Roles")}>Cancel</button>
            <button className="btn btn-primary" onClick={() => saveToast("Roles")}>Save Changes</button>
          </div>
        </section>
      )}

      {/* Modals */}
      {testEmailOpen && (
        <TestEmailModal
          onClose={() => setTestEmailOpen(false)}
          onSend={(to) => {
            alert(`Test email queued to ${to}`);
            setTestEmailOpen(false);
          }}
        />
      )}

      {confirm && (
        <ConfirmModal
          kind={confirm.kind}
          onClose={() => setConfirm(null)}
          onConfirm={() => {
            if (confirm.kind === "rotate_api") {
              setIntegrations((i) => ({ ...i, apiKey: "qdsk_live_" + Math.random().toString(36).slice(2, 10) }));
              alert("API key rotated.");
            }
            if (confirm.kind === "rotate_secret") {
              setIntegrations((i) => ({ ...i, webhookSecret: "whsec_" + Math.random().toString(36).slice(2, 12) }));
              alert("Webhook secret rotated.");
            }
            if (confirm.kind === "export_data") {
              alert("Export started. You will receive an email.");
            }
            if (confirm.kind === "delete_org") {
              alert("Org deletion scheduled (demo).");
            }
            setConfirm(null);
          }}
        />
      )}
    </div>
  );
}

/* ================ Reusable bits ================ */

function TabBtn({
  id,
  icon,
  label,
  active,
  setActive,
}: {
  id: any;
  icon: React.ReactNode;
  label: string;
  active: any;
  setActive: (id: any) => void;
}) {
  return (
    <button
      className={`qdset-tab ${active === id ? "is-active" : ""}`}
      onClick={() => setActive(id)}
    >
      <span className="qdset-tab__icon">{icon}</span>
      <span className="qdset-tab__label">{label}</span>
    </button>
  );
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className={`qdset-field ${error ? "is-error" : ""}`}>
      <span className="qdset-label">{label}</span>
      {children}
      {hint && <div className="qdset-hint">{hint}</div>}
    </label>
  );
}

function ConfirmModal({
  kind,
  onClose,
  onConfirm,
}: {
  kind: "rotate_api" | "rotate_secret" | "delete_org" | "export_data";
  onClose: () => void;
  onConfirm: () => void;
}) {
  const copy = {
    rotate_api: { title: "Rotate API Key?", desc: "Existing integrations will need the new key." },
    rotate_secret: { title: "Rotate Webhook Secret?", desc: "We will sign future webhook events with the new secret." },
    export_data: { title: "Export Org Data?", desc: "A downloadable archive will be prepared." },
    delete_org: { title: "Delete Organization?", desc: "This action is destructive and cannot be undone." },
  }[kind];

  return (
    <div className="qdset-modal" role="dialog" aria-modal="true">
      <div className="qdset-modal__panel">
        <div className="qdset-modal__head">
          <h3>{copy.title}</h3>
          <button className="btn btn-icon" onClick={onClose} aria-label="Close"><FiX /></button>
        </div>
        <p className="text-muted">{copy.desc}</p>
        <div className="qdset-modal__actions">
          <button className="btn" onClick={onClose}><FiX /> Cancel</button>
          <button className={`btn ${kind === "delete_org" ? "btn-danger" : "btn-primary"}`} onClick={onConfirm}>
            <FiCheck /> Confirm
          </button>
        </div>
      </div>
      <div className="qdset-modal__backdrop" onClick={onClose} />
    </div>
  );
}

function TestEmailModal({
  onClose,
  onSend,
}: {
  onClose: () => void;
  onSend: (to: string) => void;
}) {
  const [to, setTo] = useState("");
  const valid = /^\S+@\S+\.\S+$/.test(to);

  return (
    <div className="qdset-modal" role="dialog" aria-modal="true">
      <form
        className="qdset-modal__panel"
        onSubmit={(e) => {
          e.preventDefault();
          if (!valid) return;
          onSend(to);
        }}
      >
        <div className="qdset-modal__head">
          <h3>Send Test Email</h3>
          <button className="btn btn-icon" type="button" onClick={onClose} aria-label="Close"><FiX /></button>
        </div>

        <label className="qdset-field">
          <span className="qdset-label">Recipient</span>
          <div className="qdset-input">
            <input
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="you@company.co.ke"
              type="email"
              required
            />
          </div>
        </label>

        <div className="qdset-modal__actions">
          <button type="button" className="btn" onClick={onClose}><FiX /> Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={!valid}><FiSend /> Send</button>
        </div>
      </form>
      <div className="qdset-modal__backdrop" onClick={onClose} />
    </div>
  );
}
