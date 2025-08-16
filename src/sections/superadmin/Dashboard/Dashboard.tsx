import "./Dashboard.css";

export default function SADashboard() {
  return (
    <div className="sa-dash">
      {/* Hero strip */}
      <section className="sa-hero panel">
        <div className="sa-hero__left">
          <h1 className="sa-hero__title">System Overview</h1>
          <p className="sa-hero__sub text-muted">
            Monitor tenants, usage, and billing health across QuickDesk.
          </p>
        </div>
        <div className="sa-hero__right">
          <button className="btn btn-primary">Add Organization</button>
          <button className="btn">Manage Plans</button>
        </div>
      </section>

      {/* KPI cards */}
      <section className="sa-kpis">
        <Card title="Active Organizations" value="24" trend="+3 this week" />
        <Card title="Active Agents" value="168" trend="+12 this month" />
        <Card title="Tickets (24h)" value="4,312" trend="↓ 6% vs. avg" />
        <Card title="SLA Breaches" value="17" trend="↑ needs attention" variant="warn" />
      </section>

      {/* Split panels */}
      <section className="sa-grid2">
        <div className="panel sa-panel">
          <div className="sa-panel__head">
            <h3>Tenants by Plan</h3>
            <span className="text-muted">Last 30 days</span>
          </div>
          <div className="sa-bars">
            {[
              { label: "Free", val: 6, color: "var(--surface-3)" },
              { label: "Standard", val: 10, color: "var(--brand-weak)" },
              { label: "Premium", val: 6, color: "var(--brand)" },
              { label: "Enterprise", val: 2, color: "var(--brand-strong)" },
            ].map((b) => (
              <div className="sa-bar" key={b.label}>
                <div className="sa-bar__label">{b.label}</div>
                <div className="sa-bar__track">
                  <div className="sa-bar__fill" style={{ width: `${b.val * 8}%`, background: b.color }} />
                </div>
                <div className="sa-bar__val">{b.val}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel sa-panel">
          <div className="sa-panel__head">
            <h3>System Health</h3>
            <span className="text-muted">App + API</span>
          </div>
          <ul className="sa-health">
            <HealthItem label="API latency" value="142 ms" ok />
            <HealthItem label="Jobs queue" value="Normal" ok />
            <HealthItem label="Email delivery" value="Degraded" />
            <HealthItem label="Storage usage" value="71%" ok />
          </ul>
          <div className="sa-spark">
            {/* tiny sparkline for vibe */}
            <svg viewBox="0 0 200 60" preserveAspectRatio="none">
              <polyline
                fill="none"
                stroke="currentColor"
                strokeOpacity="0.35"
                strokeWidth="2"
                points="0,30 20,28 40,34 60,22 80,26 100,18 120,24 140,20 160,26 180,22 200,24"
              />
              <polyline
                fill="none"
                stroke="var(--brand)"
                strokeWidth="2.5"
                points="0,34 20,30 40,36 60,24 80,28 100,20 120,26 140,22 160,28 180,24 200,26"
              />
            </svg>
          </div>
        </div>
      </section>

      {/* Activity */}
      <section className="panel sa-activity">
        <div className="sa-panel__head">
          <h3>Recent Activity</h3>
          <span className="text-muted">Provisioning & plan changes</span>
        </div>
        <ul className="sa-activity__list">
          {[
            ["Acme Corp", "moved to Premium plan"],
            ["Zentrix", "added 12 agent seats"],
            ["Hummingbird", "new organization created"],
            ["Skyline Ventures", "suspended (billing issue)"],
          ].map(([org, msg], i) => (
            <li key={i} className="sa-activity__item">
              <div className="sa-activity__dot" />
              <div>
                <strong>{org}</strong> <span className="text-muted">— {msg}</span>
              </div>
              <time className="sa-activity__time text-muted">just now</time>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Card({
  title,
  value,
  trend,
  variant,
}: {
  title: string;
  value: string;
  trend: string;
  variant?: "warn";
}) {
  return (
    <div className={`panel sa-kpi ${variant === "warn" ? "is-warn" : ""}`}>
      <div className="sa-kpi__title">{title}</div>
      <div className="sa-kpi__value">{value}</div>
      <div className="sa-kpi__trend">{trend}</div>
    </div>
  );
}

function HealthItem({ label, value, ok }: { label: string; value: string; ok?: boolean }) {
  return (
    <li className="sa-health__row">
      <span className="sa-health__label">{label}</span>
      <span className={`sa-health__pill ${ok ? "ok" : "warn"}`}>{value}</span>
    </li>
  );
}
