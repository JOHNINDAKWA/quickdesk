import { useMemo } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ComposedChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  RadialBarChart,
  RadialBar,
  ScatterChart,
  Scatter,
  ZAxis,
} from "recharts";
import "./Dashboard.css";

/** -------------------- helpers -------------------- */
const fmt = new Intl.NumberFormat();
const pct = (n: number) => `${Math.round(n * 100)}%`;
const short = (n: number) =>
  n >= 1_000_000
    ? `${(n / 1_000_000).toFixed(1)}M`
    : n >= 1_000
    ? `${(n / 1_000).toFixed(1)}k`
    : `${n}`;

/** soft palette that looks good in light & dark (leverages CSS vars for stroke) */
const C = {
  brand: "var(--brand)",
  mint:  "#34d399", // emerald-400
  sky:   "#60a5fa", // blue-400
  amber: "#fbbf24", // amber-400
  coral: "#fb7185", // rose-400
  violet:"#a855f7", // violet-500
  gray:  "#64748b", // slate-500
};
const PRIORITY = {
  urgent:  "#fb7185", // coral/rose
  high:    "#fbbf24", // amber
  normal:  "#60a5fa", // blue
  low:     "#94a3b8", // slate-400
};





/** -------------------- mock data -------------------- */
// 30-day ticket trend
const days = Array.from({ length: 30 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - (29 - i));
  const open = 40 + Math.round(Math.random() * 50);
  const solved = 30 + Math.round(Math.random() * 40);
  const breaches = Math.round(open * (0.05 + Math.random() * 0.08));
  return {
    d: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    opened: open,
    solved,
    backlog: Math.max(0, open - solved + (i > 0 ? 6 - (i % 4) : 0)),
    breaches,
    frt: 20 + Math.round(Math.random() * 50), // first response time (mins)
  };
});

// Channels pie
const channels = [
  { name: "Email", value: 420 },
  { name: "Portal", value: 310 },
  { name: "Chat", value: 260 },
  { name: "API", value: 120 },
];

// Backlog by priority (stacked)
const priorities = [
  { name: "Mon", urgent: 5, high: 18, normal: 40, low: 12 },
  { name: "Tue", urgent: 4, high: 16, normal: 44, low: 10 },
  { name: "Wed", urgent: 6, high: 20, normal: 46, low: 11 },
  { name: "Thu", urgent: 5, high: 19, normal: 41, low: 9 },
  { name: "Fri", urgent: 7, high: 22, normal: 48, low: 12 },
];

// CSAT over months
const csat = [
  { m: "Jan", csat: 0.91 },
  { m: "Feb", csat: 0.89 },
  { m: "Mar", csat: 0.93 },
  { m: "Apr", csat: 0.92 },
  { m: "May", csat: 0.94 },
  { m: "Jun", csat: 0.95 },
  { m: "Jul", csat: 0.93 },
  { m: "Aug", csat: 0.96 },
];

// SLA radial + breaches bar
const slaCompliance = 0.925;

// Agent load (radar)
const agents = [
  { a: "Jane", open: 18, solved: 42, backlog: 6 },
  { a: "Brian", open: 22, solved: 38, backlog: 9 },
  { a: "Mary", open: 14, solved: 44, backlog: 5 },
  { a: "Chris", open: 20, solved: 40, backlog: 8 },
  { a: "Ahmed", open: 16, solved: 36, backlog: 7 },
];

// FRT distribution (scatter: tickets vs minutes)
const frtScatter = Array.from({ length: 40 }, () => ({
  x: 5 + Math.round(Math.random() * 55), // minutes
  y: 1 + Math.round(Math.random() * 10), // tickets
}));

// My queue (table)
const myQueue = [
  {
    ref: "QD-2025-0112",
    subject: "Webhook failing intermittently",
    prio: "high",
    age: "3h",
    status: "pending",
  },
  {
    ref: "QD-2025-0101",
    subject: "Password reset token invalid",
    prio: "normal",
    age: "2d",
    status: "open",
  },
  {
    ref: "QD-2025-0107",
    subject: "GDPR export request",
    prio: "normal",
    age: "1d",
    status: "in_progress",
  },
  {
    ref: "QD-2025-0095",
    subject: "Invoice for March",
    prio: "low",
    age: "1w",
    status: "solved",
  },
];

/** -------------------- component -------------------- */
export default function HKDashboard() {
  const kpis = useMemo(() => {
    const opened = days.reduce((a, b) => a + b.opened, 0);
    const solved = days.reduce((a, b) => a + b.solved, 0);
    const breaches = days.reduce((a, b) => a + b.breaches, 0);

    const backlog = days[days.length - 1].backlog; // carry-over tickets
    const unresolved = Math.max(0, opened - solved); // last 30d unresolved total

    // derive some portal-ish counts (tweak later when wired to API)
    const waiting = Math.round(unresolved * 0.1); // waiting for agent reply
    const needAns = Math.max(0, unresolved - waiting); // need customer answer
    const assigned = agents[0]?.open ?? 0; // "assigned to me" demo
    const resolved = solved; // alias for naming in UI

    const frtAvg = Math.round(
      days.reduce((a, b) => a + b.frt, 0) / days.length
    );

    return {
      opened,
      solved,
      breaches,
      backlog,
      frtAvg,
      waiting,
      needAns,
      assigned,
      resolved,
    };
  }, []);

  return (
    <div className="hdDash-root">
      {/* ===== KPIs ===== */}
      <section className="hdDash-kpis kpiPlus-row">
        <KpiCard
          label="Open Tickets"
          value={fmt.format(kpis.opened)}
          pct={78}
          tone="green"
        />
        <KpiCard
          label="Need Answers"
          value={fmt.format(kpis.needAns)}
          pct={60}
          tone="red"
        />
        <KpiCard
          label="Waiting for Reply"
          value={fmt.format(kpis.waiting)}
          pct={25}
          tone="blue"
        />
        <KpiCard
          label="Assigned to Me"
          value={fmt.format(kpis.assigned)}
          pct={90}
          tone="orange"
        />
        <KpiCard
          label="Resolved Tickets"
          value={fmt.format(
            Number.isFinite(kpis.resolved as number)
              ? (kpis.resolved as number)
              : 0
          )}
          pct={95}
          tone="purple"
        />
      </section>

      {/* ===== MAIN GRID ===== */}
      <div className="hdDash-grid">
        {/* 1. Tickets trend (area) */}
        <article className="panel hdDash-card">
          <header className="hdDash-card__head">
            <h4>Tickets trend (30 days)</h4>
            <span className="hdDash-note">Opened vs Solved · Backlog</span>
          </header>
          <div className="hdDash-chart">
            <ResponsiveContainer width="100%" height={220}>
              <ComposedChart
                data={days}
                margin={{ top: 6, right: 6, bottom: 0, left: -14 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="d" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend verticalAlign="top" height={24} />
                <Area
                  type="monotone"
                  dataKey="opened"
                  name="Opened"
                  fill={C.sky}
                  stroke={C.sky}
                  fillOpacity={0.25}
                />
                <Area
                  type="monotone"
                  dataKey="solved"
                  name="Solved"
                  fill={C.mint}
                  stroke={C.mint}
                  fillOpacity={0.25}
                />
                <Line
                  type="monotone"
                  dataKey="backlog"
                  name="Backlog"
                  stroke={C.violet}
                  strokeWidth={2}
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </article>

        {/* 2. Channels (pie) */}
        <article className="panel hdDash-card">
          <header className="hdDash-card__head">
            <h4>Tickets by channel</h4>
            <span className="hdDash-note">Last 30 days</span>
          </header>
          <div className="hdDash-chart is-center">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Tooltip />
                <Legend
                  verticalAlign="middle"
                  align="right"
                  layout="vertical"
                  wrapperStyle={{ fontSize: 12 }}
                />
                <Pie
                  data={channels}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                >
                  {channels.map((_, i) => (
                    <Cell
                      key={i}
                      fill={[C.sky, C.mint, C.violet, C.amber][i % 4]}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <footer className="hdDash-card__foot">
            <div className="hdDash-miniStats">
              {channels.map((c, i) => (
                <span key={c.name} className="hdDash-chip">
                  <i
                    className="hdDash-dot"
                    style={{
                      background: [C.sky, C.mint, C.violet, C.amber][i % 4],
                    }}
                  />
                  {c.name} <b>{short(c.value)}</b>
                </span>
              ))}
            </div>
          </footer>
        </article>

        {/* 3. Backlog by priority (stacked bar) */}
        <article className="panel hdDash-card">
          <header className="hdDash-card__head">
            <h4>Backlog by priority</h4>
            <span className="hdDash-note">This week</span>
          </header>
          <div className="hdDash-chart">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={priorities}
                margin={{ top: 6, right: 6, bottom: 0, left: -14 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />

                <Bar
                  dataKey="urgent"
                  stackId="a"
                  fill={PRIORITY.urgent}
                  fillOpacity={0.95}
                />
                <Bar
                  dataKey="high"
                  stackId="a"
                  fill={PRIORITY.high}
                  fillOpacity={0.95}
                />
                <Bar
                  dataKey="normal"
                  stackId="a"
                  fill={PRIORITY.normal}
                  fillOpacity={0.95}
                />
                <Bar
                  dataKey="low"
                  stackId="a"
                  fill={PRIORITY.low}
                  fillOpacity={0.95}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        {/* 4. First Response Time histogram (bar) */}
        <article className="panel hdDash-card">
          <header className="hdDash-card__head">
            <h4>First Response Time</h4>
            <span className="hdDash-note">Minutes to first reply</span>
          </header>
          <div className="hdDash-chart">
            <ResponsiveContainer width="100%" height={220}>
              <ScatterChart margin={{ top: 6, right: 6, bottom: 0, left: -14 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="x" name="Minutes" tick={{ fontSize: 11 }} />
                <YAxis dataKey="y" name="Tickets" tick={{ fontSize: 11 }} />
                <ZAxis range={[40, 200]} />
                <Tooltip cursor={{ strokeDasharray: "3 3" }} />
                <Scatter data={frtScatter} fill={C.sky} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </article>

        {/* 5. SLA compliance (radial) + breaches (bar tiny) */}
        <article className="panel hdDash-card">
          <header className="hdDash-card__head">
            <h4>SLA Compliance</h4>
            <span className="hdDash-note">Compliance & breaches</span>
          </header>
          <div className="hdDash-split">
            <div className="hdDash-donut">
              <ResponsiveContainer width="100%" height={200}>
                <RadialBarChart
                  innerRadius="68%"
                  outerRadius="100%"
                  data={[
                    { name: "SLA", value: Math.round(slaCompliance * 100) },
                  ]}
                  startAngle={90}
                  endAngle={-270}
                  cx="50%" // keep chart centered
                  cy="50%"
                >
                  <RadialBar
                    dataKey="value"
                    cornerRadius={8}
                    fill={C.mint}
                    background
                  />
                  <Tooltip />
                </RadialBarChart>
              </ResponsiveContainer>

              {/* overlayed label */}
              <div className="hdDash-radialLabel">
                <b>{pct(slaCompliance)}</b>
                <span className="hdDash-note">last 30 days</span>
              </div>
            </div>
            <div className="hdDash-miniBars">
              <h5>Breaches (last 7d)</h5>
              <ResponsiveContainer width="100%" height={120}>
                <BarChart
                  data={days.slice(-7)}
                  margin={{ top: 6, right: 6, bottom: 0, left: -18 }}
                >
                  <XAxis dataKey="d" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar
                    dataKey="breaches"
                    fill={C.coral}
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </article>

        {/* 6. Agent load (radar) */}
        <article className="panel hdDash-card">
          <header className="hdDash-card__head">
            <h4>Agent workload</h4>
            <span className="hdDash-note">Open · Solved · Backlog</span>
          </header>
          <div className="hdDash-chart">
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={agents}>
                <PolarGrid />
                <PolarAngleAxis dataKey="a" tick={{ fontSize: 11 }} />
                <PolarRadiusAxis tick={{ fontSize: 10 }} />
                <Radar
                  name="Open"
                  dataKey="open"
                  stroke={C.sky}
                  fill={C.sky}
                  fillOpacity={0.2}
                />
                <Radar
                  name="Solved"
                  dataKey="solved"
                  stroke={C.mint}
                  fill={C.mint}
                  fillOpacity={0.2}
                />
                <Radar
                  name="Backlog"
                  dataKey="backlog"
                  stroke={C.violet}
                  fill={C.violet}
                  fillOpacity={0.2}
                />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </article>

        {/* 7. CSAT line */}
        <article className="panel hdDash-card">
          <header className="hdDash-card__head">
            <h4>Customer Satisfaction (CSAT)</h4>
            <span className="hdDash-note">Monthly</span>
          </header>
          <div className="hdDash-chart">
            <ResponsiveContainer width="100%" height={220}>
              <LineChart
                data={csat}
                margin={{ top: 6, right: 6, bottom: 0, left: -14 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                <YAxis
                  domain={[0.8, 1]}
                  tickFormatter={(v) => `${Math.round(v * 100)}%`}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip formatter={(v: number) => `${Math.round(v * 100)}%`} />
                <Line
                  type="monotone"
                  dataKey="csat"
                  stroke={C.brand}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>

        {/* 8. My queue (table) */}
        <article className="panel hdDash-card hdDash-table">
          <header className="hdDash-card__head">
            <h4>My queue</h4>
            <span className="hdDash-note">Assigned to you</span>
          </header>
          <div className="hdDash-table__wrap">
            <table className="hdDash-tbl">
              <thead>
                <tr>
                  <th>Ref</th>
                  <th>Subject</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Age</th>
                </tr>
              </thead>
              <tbody>
                {myQueue.map((t) => (
                  <tr key={t.ref}>
                    <td className="mono">{t.ref}</td>
                    <td className="truncate">{t.subject}</td>
                    <td>
                      <span className={`hdDash-badge prio-${t.prio}`}>
                        {t.prio}
                      </span>
                    </td>
                    <td>
                      <span className={`hdDash-badge st-${t.status}`}>
                        {t.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="mono">{t.age}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </div>
    </div>
  );
}

/** -------------------- tiny subcomponent -------------------- */
type KpiCardProps = {
  label: string;
  value: string | number;
  badge?: string;
  pct?: number; // NEW
  tone?: "green" | "red" | "blue" | "orange" | "purple" | "neutral"; // NEW
  className?: string;
};

export function KpiCard({
  label,
  value,
  badge,
  pct = 0,
  tone = "neutral",
  className,
}: KpiCardProps) {
  return (
    <div
      className={`panel hdDash-kpi kpiPlus ${className ?? ""}`}
      data-tone={tone}
      style={{ ["--pct" as unknown as string]: String(pct) }}
    >
      <div className="kpiPlus__top">
        <div className="kpiPlus__label">{label}</div>
        <div className="kpiPlus__ring">
          <span className="kpiPlus__ringText">{pct}%</span>
        </div>
      </div>

      <div className="kpiPlus__value">{value}</div>

      {/* tiny decorative sparkline */}
      <div className="kpiPlus__spark" aria-hidden />
    </div>
  );
}
