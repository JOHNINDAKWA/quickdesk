import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell,
  RadialBarChart,
  RadialBar,
} from "recharts";
import {
  FiDownload,
  FiPrinter,
  FiTrendingUp,
  FiClock,
  FiSmile,
  FiAlertTriangle,
  FiActivity,
  FiPieChart,
  FiBarChart2,
  FiLayers,
  FiToggleLeft,
  FiToggleRight,
} from "react-icons/fi";
import "./Analytics.css";

/* -------------------------------
   Types, helpers, seed utilities
---------------------------------*/
type Range = "7d" | "30d" | "90d";

function formatDateISO(d: Date) {
  return d.toISOString().slice(0, 10);
}
function daysBack(n: number) {
  const arr: string[] = [];
  const today = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    arr.push(formatDateISO(d));
  }
  return arr;
}
function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v));
}

/* -------------------------------
   Component
---------------------------------*/
export default function SAAnalytics() {
  const [range, setRange] = useState<Range>("30d");
  const [compare, setCompare] = useState(false);

  // Palette that respects CSS variables
  const brand = "var(--brand)";
  const brandStrong = "color-mix(in oklab, var(--brand), black 10%)";
  const accent = "var(--text-muted)";

  /* ------ Mocked data per range ------ */
  const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
  const labels = useMemo(() => daysBack(days), [days]);

  const series = useMemo(() => {
    // Tickets created and resolved with slight trends
    let createdBase = range === "7d" ? 120 : range === "30d" ? 80 : 60;
    let resolvedBase = createdBase - 5;

    const timeseries = labels.map((date, i) => {
      const trend = Math.sin(i / (range === "7d" ? 3 : 10)) * (range === "7d" ? 12 : 16);
      const created = clamp(Math.round(createdBase + trend + rand(-8, 12)), 5, 600);
      const resolved = clamp(Math.round(resolvedBase + trend + rand(-12, 8)), 5, 600);
      return { date, created, resolved };
    });

    // Response & Resolution times (hours)
    const frt = labels.map((date, i) => {
      const t = clamp(2.5 + Math.sin(i / 9) * 0.8 + rand(-3, 3) / 10, 1.2, 5.2);
      const res = clamp(22 + Math.cos(i / 11) * 5 + rand(-9, 9) / 2, 10, 36);
      return { date, frt: Number(t.toFixed(1)), resolution: Number(res.toFixed(0)) };
    });

    // Categories
    const categories = [
      "Billing", "Technical", "Onboarding", "Outages", "Integrations", "Accounts",
    ].map((name) => ({ name, value: clamp(rand(20, 140), 5, 999) }));

    // Channels
    const channels = [
      { name: "Email", value: clamp(rand(25, 40), 1, 100) },
      { name: "Portal", value: clamp(rand(18, 30), 1, 100) },
      { name: "Chat", value: clamp(rand(10, 22), 1, 100) },
      { name: "Phone", value: clamp(rand(8, 16), 1, 100) },
      { name: "API", value: clamp(rand(4, 12), 1, 100) },
    ];

    // SLA compliance (as percentage)
    const slaPct = clamp(88 + rand(-4, 5), 75, 99);

    // KPIs
    const totalCreated = timeseries.reduce((n, x) => n + x.created, 0);
    const totalResolved = timeseries.reduce((n, x) => n + x.resolved, 0);
    const backlog = Math.max(0, totalCreated - totalResolved - rand(0, 40));
    const avgFRT = Number((frt.reduce((n, x) => n + x.frt, 0) / frt.length).toFixed(1));
    const csat = Number((4.1 + rand(-5, 5) / 10).toFixed(1));

    return {
      timeseries,
      frt,
      categories,
      channels,
      slaPct,
      kpis: {
        totalCreated,
        totalResolved,
        backlog,
        avgFRT,
        csat,
        sla: slaPct,
      },
    };
  }, [labels, range]);

  // Previous-period comparison (same length)
  const prevSeries = useMemo(() => {
    if (!compare) return null;
    const prevLabels = daysBack(days).map((d) => d); // just stubbing
    return prevLabels.map((date, i) => ({
      date,
      created: clamp(rand(40, 120), 5, 600),
      resolved: clamp(rand(35, 115), 5, 600),
    }));
  }, [compare, days]);

  /* ------ CSV Export (demo) ------ */
  function exportCSV() {
    const rows = [
      ["date", "created", "resolved"],
      ...series.timeseries.map((r) => [r.date, r.created, r.resolved]),
    ];
    const blob = new Blob([rows.map((r) => r.join(",")).join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `quickdesk-analytics-${range}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Chart colors (using CSS vars to match theme)
  const chartCols = [
    "var(--brand)",
    "color-mix(in oklab, var(--brand), black 14%)",
    "color-mix(in oklab, var(--brand), white 22%)",
    "#7c4dff",
    "#1fb59b",
    "#ff7a1a",
    "#2ea8ff",
    "#00bcd4",
  ];

  /* ---------------- Render ---------------- */
  return (
    <div className="qdan-page">
      {/* Hero / Filters */}
      <section className="panel qdan-hero">
        <div className="qdan-hero__left">
          <h1 className="qdan-title">Analytics</h1>
          <p className="qdan-sub">Ticket volumes, SLAs, channels, and performance at a glance.</p>
        </div>

        <div className="qdan-hero__right">
          <div className="qdan-range">
            <button className={`qdan-chip ${range === "7d" ? "is-on" : ""}`} onClick={() => setRange("7d")}>7d</button>
            <button className={`qdan-chip ${range === "30d" ? "is-on" : ""}`} onClick={() => setRange("30d")}>30d</button>
            <button className={`qdan-chip ${range === "90d" ? "is-on" : ""}`} onClick={() => setRange("90d")}>90d</button>
          </div>

          <button
            className="btn"
            onClick={() => setCompare((v) => !v)}
            title="Compare to previous period"
          >
            {compare ? <FiToggleRight /> : <FiToggleLeft />} Compare
          </button>

          <div className="qdan-actions">
            <button className="btn" onClick={exportCSV}><FiDownload /> Export CSV</button>
            <button className="btn" onClick={() => window.print()}><FiPrinter /> Print</button>
          </div>
        </div>
      </section>

      {/* KPI Row */}
      <section className="qdan-kpis">
        <KPI icon={<FiActivity />} label="Tickets Created" value={series.kpis.totalCreated} />
        <KPI icon={<FiTrendingUp />} label="Resolved" value={series.kpis.totalResolved} />
        <KPI icon={<FiAlertTriangle />} label="Backlog" value={series.kpis.backlog} />
        <KPI icon={<FiClock />} label="Avg First Response" value={`${series.kpis.avgFRT}h`} />
        <KPI icon={<FiSmile />} label="CSAT" value={`${series.kpis.csat}/5`} />
        <KPI icon={<FiLayers />} label="SLA Met" value={`${series.kpis.sla}%`} />
      </section>

      {/* Charts Grid */}
      <section className="qdan-grid">
        {/* Tickets over time */}
        <article className="panel qdan-card">
          <div className="qdan-card__head">
            <h3><FiBarChart2 /> Tickets Over Time</h3>
            <span className="text-muted">Created vs Resolved</span>
          </div>
          <div className="qdan-chart">
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={series.timeseries}>
                <defs>
                  <linearGradient id="qdan-grad-created" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={brand} stopOpacity={0.42}/>
                    <stop offset="95%" stopColor={brand} stopOpacity={0.05}/>
                  </linearGradient>
                  <linearGradient id="qdan-grad-resolved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={brandStrong} stopOpacity={0.35}/>
                    <stop offset="95%" stopColor={brandStrong} stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)"/>
                <XAxis dataKey="date" tick={{ fill: "var(--text-muted)", fontSize: 12 }} />
                <YAxis tick={{ fill: "var(--text-muted)", fontSize: 12 }} />
                <Tooltip contentStyle={{ background: "var(--surface-1)", border: "1px solid var(--border)", color: "var(--text)" }}/>
                <Legend />
                <Area type="monotone" dataKey="created" name="Created" stroke={brand} fill="url(#qdan-grad-created)" />
                <Area type="monotone" dataKey="resolved" name="Resolved" stroke={brandStrong} fill="url(#qdan-grad-resolved)" />
                {compare && prevSeries && (
                  <Line type="monotone" dataKey="created" name="Created (prev)" stroke={accent} data={prevSeries} dot={false} />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </article>

        {/* Response/Resolution trend */}
        <article className="panel qdan-card">
          <div className="qdan-card__head">
            <h3><FiTrendingUp /> Response & Resolution</h3>
            <span className="text-muted">Hours (lower is better)</span>
          </div>
          <div className="qdan-chart">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={series.frt}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)"/>
                <XAxis dataKey="date" tick={{ fill: "var(--text-muted)", fontSize: 12 }} />
                <YAxis tick={{ fill: "var(--text-muted)", fontSize: 12 }} />
                <Tooltip contentStyle={{ background: "var(--surface-1)", border: "1px solid var(--border)", color: "var(--text)" }}/>
                <Legend />
                <Line type="monotone" dataKey="frt" name="First Response" stroke={chartCols[3]} dot={false} />
                <Line type="monotone" dataKey="resolution" name="Resolution" stroke={chartCols[5]} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>

        {/* Categories bar */}
        <article className="panel qdan-card">
          <div className="qdan-card__head">
            <h3><FiBarChart2 /> Top Categories</h3>
            <span className="text-muted">Last {range}</span>
          </div>
          <div className="qdan-chart">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={series.categories} margin={{ right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)"/>
                <XAxis dataKey="name" tick={{ fill: "var(--text-muted)", fontSize: 12 }} />
                <YAxis tick={{ fill: "var(--text-muted)", fontSize: 12 }} />
                <Tooltip contentStyle={{ background: "var(--surface-1)", border: "1px solid var(--border)", color: "var(--text)" }}/>
                <Bar dataKey="value" name="Tickets" radius={[8, 8, 0, 0]} fill={brand} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        {/* Channels donut */}
        <article className="panel qdan-card">
          <div className="qdan-card__head">
            <h3><FiPieChart /> Channels</h3>
            <span className="text-muted">Share of incoming tickets</span>
          </div>
          <div className="qdan-donut">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Tooltip contentStyle={{ background: "var(--surface-1)", border: "1px solid var(--border)", color: "var(--text)" }}/>
                <Pie
                  data={series.channels}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                >
                  {series.channels.map((_, i) => (
                    <Cell key={i} fill={chartCols[i % chartCols.length]} />
                  ))}
                </Pie>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </article>

        {/* SLA radial */}
        <article className="panel qdan-card">
          <div className="qdan-card__head">
            <h3><FiLayers /> SLA Compliance</h3>
            <span className="text-muted">Met within policy</span>
          </div>
          <div className="qdan-radial">
            <ResponsiveContainer width="100%" height={260}>
              <RadialBarChart
                width={260}
                height={260}
                innerRadius="60%"
                outerRadius="100%"
                data={[{ name: "SLA", value: series.slaPct }]}
                startAngle={90}
                endAngle={90 - (360 * series.slaPct) / 100}
              >
                <RadialBar
                  background
                  dataKey="value"
                  cornerRadius={12}
                  fill={brand}
                />
                <Tooltip contentStyle={{ background: "var(--surface-1)", border: "1px solid var(--border)", color: "var(--text)" }}/>
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="qdan-radial__label">
              <div className="qdan-radial__value">{series.slaPct}%</div>
              <div className="text-muted">SLA Met</div>
            </div>
          </div>
        </article>

        {/* Agents leaderboard */}
        <article className="panel qdan-card qdan-tablecard">
          <div className="qdan-card__head">
            <h3><FiActivity /> Agent Leaderboard</h3>
            <span className="text-muted">Tickets handled & CSAT</span>
          </div>
          <div className="qdan-tablewrap">
            <table className="qdan-table">
              <thead>
                <tr>
                  <th>Agent</th>
                  <th>Tickets</th>
                  <th>CSAT</th>
                  <th>Avg FRT (h)</th>
                  <th>Resolution (h)</th>
                </tr>
              </thead>
              <tbody>
                {mockAgents().map((a) => (
                  <tr key={a.name}>
                    <td className="qdan-agent">
                      <span className="qdan-avatar" aria-hidden>{initials(a.name)}</span>
                      <div>
                        <div className="qdan-agent__name">{a.name}</div>
                        <div className="text-muted">{a.team}</div>
                      </div>
                    </td>
                    <td>{a.tickets}</td>
                    <td>{a.csat.toFixed(2)}/5</td>
                    <td>{a.frt.toFixed(1)}</td>
                    <td>{a.res.toFixed(0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </section>
    </div>
  );
}

/* -------------- Small bits -------------- */
function KPI({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string }) {
  return (
    <div className="panel qdan-kpi">
      <div className="qdan-kpi__icon">{icon}</div>
      <div className="qdan-kpi__meta">
        <div className="qdan-kpi__label">{label}</div>
        <div className="qdan-kpi__value">{typeof value === "number" ? Intl.NumberFormat().format(value) : value}</div>
      </div>
    </div>
  );
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase();
}

function mockAgents() {
  const base = [
    { name: "Amina Odhiambo", team: "Tier 1" },
    { name: "Brian Mwangi", team: "Tier 2" },
    { name: "Cynthia Wanjiru", team: "Escalations" },
    { name: "David Onyango", team: "Tier 1" },
    { name: "Esther Naliaka", team: "Tier 2" },
    { name: "Felix Mutiso", team: "Tier 1" },
  ];
  return base.map((b) => ({
    ...b,
    tickets: rand(45, 210),
    csat: clamp(3.7 + rand(-10, 10) / 20, 3.2, 5),
    frt: clamp(1.2 + rand(0, 25) / 10, 1.2, 4.8),
    res: clamp(14 + rand(-8, 18), 8, 40),
  }));
}
