import { useMemo, useState } from "react";
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiCopy,
  FiArchive,
  FiRotateCw,
  FiUsers,
  FiTag,
  FiDollarSign,
  FiCheck,
  FiX,
} from "react-icons/fi";
import "./Plans.css";

/* ---------- Types ---------- */
type Currency = "KES" | "USD";
type PlanStatus = "active" | "archived";

type Plan = {
  id: string;
  name: string;
  slug: string;
  status: PlanStatus;
  color?: string;
  currency: Currency;
  priceMonthly: number; // per org
  priceYearly: number;  // per org
  seatsIncluded: number;
  extraSeatPrice: number; // per seat / mo
  ticketLimit?: number | null; // null => unlimited
  storageGB?: number | null;
  recommended?: boolean;
  description?: string;
  features: Record<string, boolean>;
};

/* ---------- Master feature list ---------- */
const FEATURES = [
  "Ticketing",
  "Knowledge Base",
  "Automation Rules",
  "Customer Portal",
  "Analytics & Reports",
  "Multi-brand",
  "SLA Management",
  "Breach Alerts",
  "Audit Logs",
  "Integrations",
  "API Access",
  "SAML/SSO",
  "Custom Domain",
  "Custom Branding",
  "Priority Support",
] as const;

/* ---------- Seed plans (Kenya-friendly) ---------- */
const seed: Plan[] = [
  {
    id: "p-free",
    name: "Free",
    slug: "free",
    status: "active",
    currency: "KES",
    priceMonthly: 0,
    priceYearly: 0,
    seatsIncluded: 3,
    extraSeatPrice: 0,
    ticketLimit: 1000,
    storageGB: 5,
    recommended: false,
    color: "#00bcd4",
    description: "Get started with core ticketing for small teams.",
    features: {
      "Ticketing": true,
      "Knowledge Base": true,
      "Automation Rules": false,
      "Customer Portal": true,
      "Analytics & Reports": false,
      "Multi-brand": false,
      "SLA Management": false,
      "Breach Alerts": false,
      "Audit Logs": false,
      "Integrations": true,
      "API Access": false,
      "SAML/SSO": false,
      "Custom Domain": false,
      "Custom Branding": false,
      "Priority Support": false,
    },
  },
  {
    id: "p-standard",
    name: "Standard",
    slug: "standard",
    status: "active",
    currency: "KES",
    priceMonthly: 12000,
    priceYearly: 120000,
    seatsIncluded: 10,
    extraSeatPrice: 700,
    ticketLimit: 20000,
    storageGB: 100,
    recommended: true,
    color: "#7c4dff",
    description: "Everything growing teams need, with automation.",
    features: Object.fromEntries(FEATURES.map((f) => [f, !["SAML/SSO", "Priority Support", "Custom Branding"].includes(f)])) as Plan["features"],
  },
  {
    id: "p-premium",
    name: "Premium",
    slug: "premium",
    status: "active",
    currency: "KES",
    priceMonthly: 30000,
    priceYearly: 300000,
    seatsIncluded: 25,
    extraSeatPrice: 650,
    ticketLimit: null,
    storageGB: 500,
    recommended: false,
    color: "#1fb59b",
    description: "Advanced analytics, SLAs and security controls.",
    features: Object.fromEntries(FEATURES.map((f) => [f, !["Priority Support"].includes(f)])) as Plan["features"],
  },
  {
    id: "p-enterprise",
    name: "Enterprise",
    slug: "enterprise",
    status: "active",
    currency: "KES",
    priceMonthly: 95000,
    priceYearly: 950000,
    seatsIncluded: 60,
    extraSeatPrice: 600,
    ticketLimit: null,
    storageGB: 2048,
    recommended: false,
    color: "#ff7a1a",
    description: "Maximum scale, security and support SLAs.",
    features: Object.fromEntries(FEATURES.map((f) => [f, true])) as Plan["features"],
  },
];

/* ---------- Helpers ---------- */
function fmtMoney(v: number, ccy: Currency) {
  const locale = ccy === "KES" ? "en-KE" : "en-US";
  return new Intl.NumberFormat(locale, { style: "currency", currency: ccy, maximumFractionDigits: 0 }).format(v);
}
function slugify(v: string) {
  return v.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
}

/* =======================================================
   Component
   ======================================================= */
export default function SAPlans() {
  const [plans, setPlans] = useState<Plan[]>(seed);
  const [cycle, setCycle] = useState<"monthly" | "yearly">("monthly");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<PlanStatus | "all">("all");

  // Modals
  const [formOpen, setFormOpen] = useState<null | { mode: "add" | "edit"; plan?: Plan }>(null);
  const [confirm, setConfirm] = useState<null | { kind: "delete" | "archive" | "activate"; plan: Plan }>(null);

  const filtered = useMemo(() => {
    return plans.filter((p) => {
      const hitQ = !q || p.name.toLowerCase().includes(q.toLowerCase()) || p.slug.includes(q.toLowerCase());
      const hitStatus = status === "all" || p.status === status;
      return hitQ && hitStatus;
    });
  }, [plans, q, status]);

  function duplicatePlan(p: Plan) {
    const nu: Plan = {
      ...p,
      id: Math.random().toString(36).slice(2),
      name: `${p.name} Copy`,
      slug: `${p.slug}-copy`,
      recommended: false,
      status: "active",
    };
    setPlans((prev) => [nu, ...prev]);
  }

  function upsertPlan(payload: Partial<Plan> & { name: string; slug: string }) {
    if (payload.id) {
      setPlans((prev) => prev.map((p) => (p.id === payload.id ? { ...p, ...payload } as Plan : p)));
    } else {
      const base: Plan = {
        id: Math.random().toString(36).slice(2),
        name: payload.name,
        slug: payload.slug,
        status: "active",
        currency: (payload.currency || "KES") as Currency,
        priceMonthly: Number(payload.priceMonthly) || 0,
        priceYearly: Number(payload.priceYearly) || 0,
        seatsIncluded: Number(payload.seatsIncluded) || 0,
        extraSeatPrice: Number(payload.extraSeatPrice) || 0,
        ticketLimit: payload.ticketLimit ?? null,
        storageGB: payload.storageGB ?? null,
        description: payload.description || "",
        color: payload.color || "#2ea8ff",
        recommended: !!payload.recommended,
        features: payload.features || Object.fromEntries(FEATURES.map((f) => [f, false])) as Plan["features"],
      };
      setPlans((prev) => [base, ...prev]);
    }
  }

  return (
    <div className="qdpp-page">
      {/* Hero */}
      <section className="panel qdpp-hero">
        <div className="qdpp-hero__left">
          <h1 className="qdpp-title">Plans & Pricing</h1>
          <p className="qdpp-sub">Manage tiers, pricing, and features across QuickDesk.</p>
        </div>

        <div className="qdpp-hero__right">
          {/* cycle switch */}
          <div className="qdpp-cycle">
            <button
              className={`qdpp-cycle__btn ${cycle === "monthly" ? "is-active" : ""}`}
              onClick={() => setCycle("monthly")}
            >
              Monthly
            </button>
            <button
              className={`qdpp-cycle__btn ${cycle === "yearly" ? "is-active" : ""}`}
              onClick={() => setCycle("yearly")}
            >
              Yearly
            </button>
            <span className="qdpp-cycle__note">Save up to 15% yearly</span>
          </div>

          <div className="qdpp-hero__actions">
            <div className="qdpp-search">
              <input
                placeholder="Search plans…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>

            <select
              className="qdpp-mini"
              value={status}
              onChange={(e) => setStatus(e.target.value as PlanStatus | "all")}
              title="Filter by status"
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>

            <button className="btn btn-primary" onClick={() => setFormOpen({ mode: "add" })}>
              <FiPlus /> New Plan
            </button>
          </div>
        </div>
      </section>

      {/* Grid of plan cards */}
      <section className="qdpp-grid">
        {filtered.map((p) => (
          <article className={`panel qdpp-card ${p.recommended ? "is-rec" : ""}`} key={p.id}>
            <header className="qdpp-card__head">
              <div className="qdpp-tag" style={{ background: p.color || "var(--brand)" }} />
              <div className="qdpp-card__title">
                <h3>{p.name}</h3>
                <div className={`qdpp-status qdpp-status--${p.status}`}>{p.status}</div>
              </div>

              {p.recommended && <div className="qdpp-recbadge">Recommended</div>}
            </header>

            <div className="qdpp-price">
              <div className="qdpp-price__main">
                <FiDollarSign />
                <span>
                  {fmtMoney(cycle === "monthly" ? p.priceMonthly : p.priceYearly, p.currency)}
                </span>
                <small>/{cycle === "monthly" ? "mo" : "yr"}</small>
              </div>
              <div className="qdpp-price__meta">
                <span><FiUsers /> {p.seatsIncluded} seats included</span>
                <span><FiTag /> {fmtMoney(p.extraSeatPrice, p.currency)} / extra seat / mo</span>
              </div>
            </div>

            {p.description && <p className="qdpp-desc text-muted">{p.description}</p>}

            <ul className="qdpp-features">
              {FEATURES.slice(0, 6).map((f) => (
                <li key={f} className={p.features[f] ? "ok" : "no"}>
                  {p.features[f] ? <FiCheck /> : <FiX />} {f}
                </li>
              ))}
              <li className="qdpp-more">…and more</li>
            </ul>

            <div className="qdpp-metrics">
              <span>Tickets: {p.ticketLimit ? Intl.NumberFormat().format(p.ticketLimit) : "Unlimited"}</span>
              <span>Storage: {p.storageGB ? `${p.storageGB} GB` : "Unlimited"}</span>
            </div>

            <div className="qdpp-actions">
              <button className="btn btn-ghost" onClick={() => setFormOpen({ mode: "edit", plan: p })}>
                <FiEdit2 /> Edit
              </button>
              <button className="btn btn-ghost" onClick={() => duplicatePlan(p)}>
                <FiCopy /> Duplicate
              </button>
              {p.status === "active" ? (
                <button className="btn btn-ghost" onClick={() => setConfirm({ kind: "archive", plan: p })}>
                  <FiArchive /> Archive
                </button>
              ) : (
                <button className="btn btn-ghost" onClick={() => setConfirm({ kind: "activate", plan: p })}>
                  <FiRotateCw /> Activate
                </button>
              )}
              <button className="btn btn-ghost danger" onClick={() => setConfirm({ kind: "delete", plan: p })}>
                <FiTrash2 /> Delete
              </button>
            </div>
          </article>
        ))}

        {filtered.length === 0 && (
          <div className="panel qdpp-empty">No plans match your filters.</div>
        )}
      </section>

      {/* Feature Matrix */}
      <section className="panel qdpp-matrix">
        <div className="qdpp-matrix__head">
          <h3>Feature Matrix</h3>
          <span className="text-muted">Click to toggle features for each plan.</span>
        </div>

        <div className="qdpp-matrix__wrap">
          <table className="qdpp-table">
            <thead>
              <tr>
                <th>Feature</th>
                {plans.map((p) => (
                  <th key={p.id}>
                    <span className="qdpp-colhead" title={p.name}>
                      <span className="dot" style={{ background: p.color || "var(--brand)" }} />
                      {p.name}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FEATURES.map((f) => (
                <tr key={f}>
                  <td className="qdpp-feature">{f}</td>
                  {plans.map((p) => {
                    const val = p.features[f];
                    return (
                      <td key={p.id} className="qdpp-cell">
                        <button
                          className={`qdpp-toggle ${val ? "is-on" : ""}`}
                          onClick={() =>
                            setPlans((prev) =>
                              prev.map((pp) =>
                                pp.id === p.id
                                  ? { ...pp, features: { ...pp.features, [f]: !val } }
                                  : pp
                              )
                            )
                          }
                          aria-label={`Toggle ${f} for ${p.name}`}
                        >
                          {val ? <FiCheck /> : <FiX />}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modals */}
      {formOpen && (
        <PlanFormModal
          mode={formOpen.mode}
          plan={formOpen.plan}
          onClose={() => setFormOpen(null)}
          onSave={(payload) => {
            upsertPlan(payload);
            setFormOpen(null);
          }}
        />
      )}

      {confirm && (
        <ConfirmModal
          kind={confirm.kind}
          plan={confirm.plan}
          onClose={() => setConfirm(null)}
          onConfirm={() => {
            if (confirm.kind === "delete") {
              setPlans((prev) => prev.filter((p) => p.id !== confirm.plan.id));
            }
            if (confirm.kind === "archive") {
              setPlans((prev) => prev.map((p) => (p.id === confirm.plan.id ? { ...p, status: "archived" } : p)));
            }
            if (confirm.kind === "activate") {
              setPlans((prev) => prev.map((p) => (p.id === confirm.plan.id ? { ...p, status: "active" } : p)));
            }
            setConfirm(null);
          }}
        />
      )}
    </div>
  );
}

/* =================== Plan Form Modal =================== */
function PlanFormModal({
  mode,
  plan,
  onClose,
  onSave,
}: {
  mode: "add" | "edit";
  plan?: Plan;
  onClose: () => void;
  onSave: (payload: Partial<Plan> & { name: string; slug: string }) => void;
}) {
  const [form, setForm] = useState<Partial<Plan>>(
    plan || {
      name: "",
      slug: "",
      currency: "KES",
      priceMonthly: 0,
      priceYearly: 0,
      seatsIncluded: 5,
      extraSeatPrice: 500,
      ticketLimit: 10000,
      storageGB: 50,
      description: "",
      color: "#2ea8ff",
      recommended: false,
      features: Object.fromEntries(FEATURES.map((f) => [f, false])) as Plan["features"],
      status: "active",
    }
  );

  const errs = {
    name: !form.name?.trim(),
    slug: !form.slug?.trim(),
  };
  const hasErrors = Object.values(errs).some(Boolean);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (hasErrors) return;
    onSave({
      ...form,
      id: plan?.id,
      name: form.name!,
      slug: form.slug!,
    });
  }

  return (
    <div className="qdpp-modal" role="dialog" aria-modal="true">
      <form className="qdpp-modal__panel" onSubmit={submit}>
        <div className="qdpp-modal__head">
          <h3>{mode === "add" ? "Create Plan" : "Edit Plan"}</h3>
          <button className="btn btn-icon" type="button" onClick={onClose} aria-label="Close">
            <FiX />
          </button>
        </div>

        <div className="qdpp-form">
          <div className="qdpp-grid-2">
            <label className={`qdpp-field ${errs.name ? "is-error" : ""}`}>
              <span className="qdpp-label">Name</span>
              <div className="qdpp-input">
                <input
                  value={form.name || ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value, slug: f.slug || slugify(e.target.value) }))
                  }
                  placeholder="Premium"
                  required
                />
              </div>
            </label>

            <label className={`qdpp-field ${errs.slug ? "is-error" : ""}`}>
              <span className="qdpp-label">Slug</span>
              <div className="qdpp-input">
                <input
                  value={form.slug || ""}
                  onChange={(e) => setForm((f) => ({ ...f, slug: slugify(e.target.value) }))}
                  placeholder="premium"
                  required
                />
              </div>
            </label>
          </div>

          <div className="qdpp-grid-4">
            <label className="qdpp-field">
              <span className="qdpp-label">Currency</span>
              <div className="qdpp-input">
                <select
                  value={form.currency || "KES"}
                  onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value as Currency }))}
                >
                  <option value="KES">KES</option>
                  <option value="USD">USD</option>
                </select>
              </div>
            </label>

            <label className="qdpp-field">
              <span className="qdpp-label">Price (Monthly)</span>
              <div className="qdpp-input">
                <input
                  type="number"
                  min={0}
                  value={form.priceMonthly ?? 0}
                  onChange={(e) => setForm((f) => ({ ...f, priceMonthly: Number(e.target.value) }))}
                />
              </div>
            </label>

            <label className="qdpp-field">
              <span className="qdpp-label">Price (Yearly)</span>
              <div className="qdpp-input">
                <input
                  type="number"
                  min={0}
                  value={form.priceYearly ?? 0}
                  onChange={(e) => setForm((f) => ({ ...f, priceYearly: Number(e.target.value) }))}
                />
              </div>
            </label>

            <label className="qdpp-field">
              <span className="qdpp-label">Tag Color</span>
              <div className="qdpp-input">
                <input
                  value={form.color || ""}
                  onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                  placeholder="#2ea8ff"
                  spellCheck={false}
                />
              </div>
            </label>
          </div>

          <div className="qdpp-grid-3">
            <label className="qdpp-field">
              <span className="qdpp-label">Seats Included</span>
              <div className="qdpp-input">
                <input
                  type="number"
                  min={0}
                  value={form.seatsIncluded ?? 0}
                  onChange={(e) => setForm((f) => ({ ...f, seatsIncluded: Number(e.target.value) }))}
                />
              </div>
            </label>

            <label className="qdpp-field">
              <span className="qdpp-label">Extra Seat Price / mo</span>
              <div className="qdpp-input">
                <input
                  type="number"
                  min={0}
                  value={form.extraSeatPrice ?? 0}
                  onChange={(e) => setForm((f) => ({ ...f, extraSeatPrice: Number(e.target.value) }))}
                />
              </div>
            </label>

            <label className="qdpp-field">
              <span className="qdpp-label">Ticket Limit (blank = unlimited)</span>
              <div className="qdpp-input">
                <input
                  type="number"
                  min={0}
                  value={form.ticketLimit ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, ticketLimit: e.target.value === "" ? null : Number(e.target.value) }))
                  }
                />
              </div>
            </label>
          </div>

          <div className="qdpp-grid-2">
            <label className="qdpp-field">
              <span className="qdpp-label">Storage (GB, blank = unlimited)</span>
              <div className="qdpp-input">
                <input
                  type="number"
                  min={0}
                  value={form.storageGB ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, storageGB: e.target.value === "" ? null : Number(e.target.value) }))
                  }
                />
              </div>
            </label>

            <label className="qdpp-check">
              <input
                type="checkbox"
                checked={!!form.recommended}
                onChange={(e) => setForm((f) => ({ ...f, recommended: e.target.checked }))}
              />
              <span>Mark as recommended</span>
            </label>
          </div>

          <label className="qdpp-field">
            <span className="qdpp-label">Short Description</span>
            <div className="qdpp-input">
              <input
                value={form.description || ""}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Great for growing teams…"
              />
            </div>
          </label>

          <div className="qdpp-featurepicker">
            <div className="qdpp-featurepicker__head">Features</div>
            <div className="qdpp-featurepicker__list">
              {FEATURES.map((f) => {
                const checked = !!form.features?.[f];
                return (
                  <label key={f} className="qdpp-chipopt">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          features: { ...(prev.features || {}), [f]: e.target.checked },
                        }))
                      }
                    />
                    <span className={checked ? "is-on" : ""}>{f}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        <div className="qdpp-modal__actions">
          <button type="button" className="btn" onClick={onClose}>
            <FiX /> Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={hasErrors}>
            <FiCheck /> Save
          </button>
        </div>
      </form>

      <div className="qdpp-modal__backdrop" onClick={onClose} />
    </div>
  );
}

/* =================== Confirm Modal =================== */
function ConfirmModal({
  kind,
  plan,
  onClose,
  onConfirm,
}: {
  kind: "delete" | "archive" | "activate";
  plan: Plan;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const titles = {
    delete: "Delete plan?",
    archive: "Archive plan?",
    activate: "Activate plan?",
  } as const;
  const desc = {
    delete: "This permanently removes the plan. Existing customers remain unchanged.",
    archive: "Archived plans are hidden from signup but remain available to existing customers.",
    activate: "Plan becomes available for new customers immediately.",
  } as const;

  return (
    <div className="qdpp-modal" role="dialog" aria-modal="true">
      <div className="qdpp-modal__panel">
        <div className="qdpp-modal__head">
          <h3>{titles[kind]}</h3>
          <button className="btn btn-icon" onClick={onClose} aria-label="Close"><FiX /></button>
        </div>

        <p className="text-muted"><strong>{plan.name}</strong> — {desc[kind]}</p>

        <div className="qdpp-modal__actions">
          <button className="btn" onClick={onClose}><FiX /> Cancel</button>
          <button
            className={`btn ${kind === "delete" ? "btn-danger" : kind === "archive" ? "" : "btn-primary"}`}
            onClick={onConfirm}
          >
            {kind === "delete" ? <FiTrash2 /> : kind === "archive" ? <FiArchive /> : <FiRotateCw />}
            {kind === "delete" ? "Delete" : kind === "archive" ? "Archive" : "Activate"}
          </button>
        </div>
      </div>
      <div className="qdpp-modal__backdrop" onClick={onClose} />
    </div>
  );
}
