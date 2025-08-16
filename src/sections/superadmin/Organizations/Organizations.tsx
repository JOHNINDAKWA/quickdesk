import { useMemo, useState } from "react";
import {
  FiPlus,
  FiSearch,
  FiExternalLink,
  FiPauseCircle,
  FiPlayCircle,
  FiUsers,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import "./Organizations.css";

type Plan = "Free" | "Standard" | "Premium" | "Enterprise";
type Status = "active" | "suspended";

type Org = {
  id: string;
  name: string;
  slug: string;
  plan: Plan;
  status: Status;
  seats: { used: number; total: number };
  color: string;         // HEX brand color
  tickets24h: number;
  createdAt: string;
  logo: string;          // logo URL
};

/* ---------------- Helpers ---------------- */
function slugify(v: string) {
  return v
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}
function isHex(v: string) {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(v.trim());
}
function isUrl(v: string) {
  try {
    const u = new URL(v);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/* ---------------- Seed data ---------------- */
const initialOrgs: Org[] = [
  {
    id: "1",
    name: "Jua Kali Innovations",
    slug: "jua-kali",
    plan: "Premium",
    status: "active",
    seats: { used: 38, total: 50 },
    color: "#1fb59b",
    tickets24h: 412,
    createdAt: "2024-09-14",
    logo: "https://bcassetcdn.com/public/blog/wp-content/uploads/2019/10/18094202/tech-trends.png",
  },
  {
    id: "2",
    name: "Ushindi Sacco",
    slug: "ushindi",
    plan: "Standard",
    status: "active",
    seats: { used: 12, total: 20 },
    color: "#7c4dff",
    tickets24h: 86,
    createdAt: "2025-02-02",
    logo: "https://macromate-blush.vercel.app/assets/cloves-fxdVByd6.png",
  },
  {
    id: "3",
    name: "Kijani Tech",
    slug: "kijani-tech",
    plan: "Free",
    status: "active",
    seats: { used: 3, total: 5 },
    color: "#00bcd4",
    tickets24h: 9,
    createdAt: "2025-01-12",
    logo: "https://macromate-blush.vercel.app/assets/cloves-fxdVByd6.png",
  },
  {
    id: "4",
    name: "Simba Logistics",
    slug: "simba-logistics",
    plan: "Enterprise",
    status: "suspended",
    seats: { used: 110, total: 130 },
    color: "#ff7a1a",
    tickets24h: 1020,
    logo: "https://lh5.ggpht.com/_gKQKwLZ8XUs/TIanWkgASNI/AAAAAAAADuY/k6K7GdaFRkM/s800/clever-logo-threesome.jpg",
    createdAt: "2024-05-20",
  },
  {
    id: "5",
    name: "Maji Safi Solutions",
    slug: "maji-safi",
    plan: "Standard",
    status: "active",
    seats: { used: 22, total: 25 },
    color: "#2ea8ff",
    tickets24h: 158,
    createdAt: "2025-03-28",
    logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT3-JBELKx1xuG0-bBZiQ8Sk6hAVzaiU1Q_7Q&s",
  },
  {
    id: "6",
    name: "Rafiki Retail",
    slug: "rafiki-retail",
    plan: "Premium",
    status: "active",
    seats: { used: 60, total: 60 },
    color: "#0dc270",
    tickets24h: 342,
    createdAt: "2024-11-05",
    logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSdWC5ID2DXMboKbIvlEeHNT5EW6gTRAgLWtQ&s",
  },
];

/* ---------------- Component ---------------- */
export default function Organizations() {
  const [orgs, setOrgs] = useState<Org[]>(initialOrgs);
  const [q, setQ] = useState("");
  const [plan, setPlan] = useState<Plan | "all">("all");
  const [status, setStatus] = useState<Status | "all">("all");
  const [sort, setSort] = useState<"recent" | "name" | "tickets" | "seats">("recent");
  const nav = useNavigate();

  // Drawer state
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    email: "",
    plan: "Standard" as Plan,
    seats: 10,
    color: "#12b886",
    status: "active" as Status,
    logo: "",
  });
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const errs = {
    name: !form.name.trim(),
    slug: !form.slug.trim(),
    email: !/^\S+@\S+\.\S+$/.test(form.email),
    color: !isHex(form.color),
    logo: form.logo ? !isUrl(form.logo) : false,
  };
  const hasErrors = Object.values(errs).some(Boolean);

  // Filtering + sorting
  const filtered = useMemo(() => {
    let out = orgs.filter((o) => {
      const matchesQ =
        !q ||
        o.name.toLowerCase().includes(q.toLowerCase()) ||
        o.slug.toLowerCase().includes(q.toLowerCase());
      const matchesPlan = plan === "all" || o.plan === plan;
      const matchesStatus = status === "all" || o.status === status;
      return matchesQ && matchesPlan && matchesStatus;
    });

    out = [...out].sort((a, b) => {
      switch (sort) {
        case "name":
          return a.name.localeCompare(b.name);
        case "tickets":
          return b.tickets24h - a.tickets24h;
        case "seats": {
          const aRate = a.seats.used / a.seats.total;
          const bRate = b.seats.used / b.seats.total;
          return bRate - aRate;
        }
        case "recent":
        default:
          return +new Date(b.createdAt) - +new Date(a.createdAt);
      }
    });

    return out;
  }, [orgs, q, plan, status, sort]);

  const counts = useMemo(() => {
    const active = orgs.filter((o) => o.status === "active").length;
    const suspended = orgs.length - active;
    const totalAgents = orgs.reduce((n, o) => n + o.seats.used, 0);
    const totalTickets = orgs.reduce((n, o) => n + o.tickets24h, 0);
    return { total: orgs.length, active, suspended, totalAgents, totalTickets };
  }, [orgs]);

  function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (hasErrors) return;

    const newOrg: Org = {
      id: Math.random().toString(36).slice(2),
      name: form.name,
      slug: form.slug,
      plan: form.plan,
      status: form.status,
      seats: { used: 0, total: Math.max(1, Number(form.seats) || 1) },
      color: form.color,
      logo: form.logo,
      tickets24h: 0,
      createdAt: new Date().toISOString(),
    };
    setOrgs((prev) => [newOrg, ...prev]);
    // reset + close
    setForm({
      name: "",
      slug: "",
      email: "",
      plan: "Standard",
      seats: 10,
      color: "#12b886",
      logo: "",
      status: "active",
    });
    setTouched({});
    setOpen(false);
  }

  return (
    <div className="org-page">
      {/* Header */}
      <section className="panel org-hero">
        <div>
          <h1 className="org-title">Organizations</h1>
          <p className="org-sub">Manage clients, seats, and subscriptions across QuickDesk.</p>
        </div>
        <div className="org-actions">
          <button className="btn" onClick={() => setOpen(true)}>
            <FiPlus /> Add Organization
          </button>
        </div>
      </section>

      {/* KPI row */}
      <section className="org-kpis">
        <Kpi label="Total Orgs" value={counts.total} />
        <Kpi label="Active" value={counts.active} />
        <Kpi label="Suspended" value={counts.suspended} />
        <Kpi label="Agents (used)" value={counts.totalAgents} />
        <Kpi label="Tickets (24h)" value={counts.totalTickets} />
      </section>

      {/* Filters */}
      <section className="panel org-filters">
        <div className="org-search">
          <FiSearch />
          <input
            placeholder="Search by name or slug…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <div className="org-selects">
          <label className="field">
            <span>Plan</span>
            <select value={plan} onChange={(e) => setPlan(e.target.value as Plan | "all")}>
              <option value="all">All</option>
              <option>Free</option>
              <option>Standard</option>
              <option>Premium</option>
              <option>Enterprise</option>
            </select>
          </label>

          <label className="field">
            <span>Status</span>
            <select value={status} onChange={(e) => setStatus(e.target.value as Status | "all")}>
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
          </label>

          <label className="field">
            <span>Sort</span>
            <select value={sort} onChange={(e) => setSort(e.target.value as any)}>
              <option value="recent">Most recent</option>
              <option value="name">Name (A–Z)</option>
              <option value="tickets">Tickets (24h)</option>
              <option value="seats">Seat usage</option>
            </select>
          </label>
        </div>
      </section>

      {/* Grid */}
      <section className="org-grid">
        {filtered.map((o) => (
          <article key={o.id} className="panel org-card">
            <div className="org-card__head">
              <div className="org-avatar">
                <img src={o.logo} alt={`${o.name} logo`} />
              </div>
              <div className="org-meta">
                <div className="org-name">{o.name}</div>
                <div className="org-slug text-muted">@{o.slug}</div>
              </div>
              <div className="org-badges">
                <span className={`badge plan plan--${o.plan.toLowerCase()}`}>{o.plan}</span>
                <span className={`badge status status--${o.status}`}>{o.status}</span>
              </div>
            </div>

            <div className="org-stats">
              <div className="org-seats">
                <FiUsers />
                <span>
                  {o.seats.used}/{o.seats.total} seats
                </span>
              </div>
              <div className="org-progress">
                <div
                  className="org-progress__fill"
                  style={{
                    width: `${Math.min(100, Math.round((o.seats.used / o.seats.total) * 100))}%`,
                  }}
                />
              </div>
              <div className="org-tickets text-muted">{o.tickets24h} tickets / 24h</div>
            </div>

            <div className="org-actions-row">
              <button className="btn btn-ghost" onClick={() => nav(`/admin/organizations/${o.slug}`)}>
                <FiExternalLink /> Open
              </button>
              <div className="org-spacer" />
              {/* <button className="btn btn-ghost">
                <FiEdit2 /> Edit
              </button> */}
              {o.status === "active" ? (
                <button className="btn btn-ghost warn">
                  <FiPauseCircle /> Suspend
                </button>
              ) : (
                <button className="btn btn-ghost">
                  <FiPlayCircle /> Activate
                </button>
              )}
              {/* <button className="btn btn-ghost danger">
                <FiTrash2 /> Delete
              </button> */}
              {/* <button className="btn btn-icon" title="More">
                <FiMoreVertical />
              </button> */}
            </div>
          </article>
        ))}
      </section>

      {/* Drawer (create org) */}
      <div className={`org-drawer ${open ? "is-open" : ""}`} role="dialog" aria-modal="true">
        <div className="org-drawer__panel">
          <div className="org-drawer__head">
            <h3>Create Organization</h3>
            <button className="btn btn-icon" onClick={() => setOpen(false)} aria-label="Close">
              ✕
            </button>
          </div>

          {/* Pretty form with validation */}
          <form className="org-form form-modern" onSubmit={onCreate}>
            <div className="grid-2">
              <label className={`field ${touched.name && errs.name ? "error" : ""}`}>
                <span className="label">Name</span>
                <div className="input">
                  <input
                    value={form.name}
                    onBlur={() => setTouched((t) => ({ ...t, name: true }))}
                    onChange={(e) => {
                      const name = e.target.value;
                      setForm((f) => ({
                        ...f,
                        name,
                        slug: f.slug || slugify(name),
                      }));
                    }}
                    placeholder="Jua Kali Innovations"
                    required
                  />
                </div>
                {touched.name && errs.name && <div className="hint">Name is required.</div>}
              </label>

              <label className={`field ${touched.slug && errs.slug ? "error" : ""}`}>
                <span className="label">Slug</span>
                <div className="input">
                  <span className="input__prefix">@</span>
                  <input
                    value={form.slug}
                    onBlur={() => setTouched((t) => ({ ...t, slug: true }))}
                    onChange={(e) => setForm((f) => ({ ...f, slug: slugify(e.target.value) }))}
                    placeholder="jua-kali"
                    required
                  />
                </div>
                {touched.slug && errs.slug && <div className="hint">Slug is required.</div>}
              </label>
            </div>

            <label className={`field ${touched.logo && errs.logo ? "error" : ""}`}>
              <span className="label">Logo URL</span>
              <div className="input">
                <span className="input__icon" aria-hidden>🔗</span>
                <input
                  value={form.logo}
                  onBlur={() => setTouched((t) => ({ ...t, logo: true }))}
                  onChange={(e) => setForm((f) => ({ ...f, logo: e.target.value }))}
                  placeholder="https://example.com/logo.png"
                  spellCheck={false}
                />
                {form.logo && isUrl(form.logo) && (
                  <span className="logo-mini">
                    <img src={form.logo} alt="logo preview" />
                  </span>
                )}
              </div>
              {touched.logo && errs.logo && <div className="hint">Enter a valid http(s) image URL.</div>}
            </label>

            <label className={`field ${touched.email && errs.email ? "error" : ""}`}>
              <span className="label">Admin Email</span>
              <div className="input">
                <span className="input__icon" aria-hidden>✉️</span>
                <input
                  type="email"
                  value={form.email}
                  onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="admin@company.co.ke"
                  required
                />
              </div>
              {touched.email && errs.email && <div className="hint">Enter a valid email.</div>}
            </label>

            <div className="grid-3">
              <label className="field">
                <span className="label">Plan</span>
                <div className="input">
                  <select
                    value={form.plan}
                    onChange={(e) => setForm((f) => ({ ...f, plan: e.target.value as Plan }))}
                  >
                    <option>Free</option>
                    <option>Standard</option>
                    <option>Premium</option>
                    <option>Enterprise</option>
                  </select>
                </div>
              </label>

              <label className="field">
                <span className="label">Seats</span>
                <div className="input">
                  <input
                    type="number"
                    min={1}
                    value={form.seats}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, seats: Math.max(1, Number(e.target.value) || 1) }))
                    }
                  />
                </div>
              </label>

              <label className={`field ${touched.color && errs.color ? "error" : ""}`}>
                <span className="label">Brand Color (HEX)</span>
                <div className="input">
                  <span
                    className="swatch"
                    style={{ background: isHex(form.color) ? form.color : "transparent" }}
                  />
                  <input
                    value={form.color}
                    onBlur={() => setTouched((t) => ({ ...t, color: true }))}
                    onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                    placeholder="#12b886"
                    spellCheck={false}
                  />
                </div>
                {touched.color && errs.color && <div className="hint">Use HEX like #12b886.</div>}
              </label>
            </div>

            <div className="grid-2">
              <label className="field">
                <span className="label">Status</span>
                <div className="input">
                  <select
                    value={form.status}
                    onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as Status }))}
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </label>

              <div className="field spacer">
                <span className="label">&nbsp;</span>
                {/* <div className="input note">You can change these anytime from the org profile.</div> */}
              </div>
            </div>

            <div className="org-drawer__actions">
              <button type="button" className="btn" onClick={() => setOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={hasErrors}>
                Create
              </button>
            </div>
          </form>
        </div>

        <div className="org-drawer__backdrop" onClick={() => setOpen(false)} />
      </div>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: number }) {
  return (
    <div className="panel org-kpi">
      <div className="org-kpi__label">{label}</div>
      <div className="org-kpi__value">{Intl.NumberFormat().format(value)}</div>
    </div>
  );
}
