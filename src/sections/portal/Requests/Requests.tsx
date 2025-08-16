import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "./Requests.css";

type Status = "open" | "pending" | "in_progress" | "solved" | "closed";
type Priority = "low" | "normal" | "high" | "urgent";

type Ticket = {
  id: string;
  ref: string;            // human ref like QD-2025-0123
  subject: string;
  category: string;
  status: Status;
  priority: Priority;
  createdAt: string;       // ISO
  updatedAt: string;       // ISO
  attachments?: number;
};

const seed: Ticket[] = [
  {
    id: "t1",
    ref: "QD-2025-0101",
    subject: "Can’t reset my password",
    category: "Account & Access",
    status: "open",
    priority: "normal",
    createdAt: "2025-08-05T09:12:00Z",
    updatedAt: "2025-08-16T06:30:00Z",
    attachments: 1,
  },
  {
    id: "t2",
    ref: "QD-2025-0095",
    subject: "Invoice for March",
    category: "Billing & Plans",
    status: "solved",
    priority: "low",
    createdAt: "2025-08-01T12:10:00Z",
    updatedAt: "2025-08-09T10:00:00Z",
  },
  {
    id: "t3",
    ref: "QD-2025-0112",
    subject: "Integration webhook failing intermittently",
    category: "Integrations",
    status: "pending",
    priority: "high",
    createdAt: "2025-08-12T08:00:00Z",
    updatedAt: "2025-08-16T05:00:00Z",
    attachments: 2,
  },
  {
    id: "t4",
    ref: "QD-2025-0107",
    subject: "GDPR export request",
    category: "Data & Privacy",
    status: "in_progress",
    priority: "normal",
    createdAt: "2025-08-10T16:20:00Z",
    updatedAt: "2025-08-15T15:15:00Z",
  },
  {
    id: "t5",
    ref: "QD-2025-0079",
    subject: "Service access for new staff",
    category: "Account & Access",
    status: "closed",
    priority: "low",
    createdAt: "2025-07-10T11:00:00Z",
    updatedAt: "2025-07-18T09:20:00Z",
  },
];

export default function MyRequests() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<Status | "all">("all");
  const [priority, setPriority] = useState<Priority | "all">("all");
  const [sort, setSort] = useState<"updated" | "created" | "priority">("updated");
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const filtered = useMemo(() => {
    const qry = q.trim().toLowerCase();
    let out = seed.filter((t) => {
      const matchesQ =
        !qry ||
        t.subject.toLowerCase().includes(qry) ||
        t.ref.toLowerCase().includes(qry) ||
        t.category.toLowerCase().includes(qry);
      const matchesStatus = status === "all" || t.status === status;
      const matchesPrio = priority === "all" || t.priority === priority;
      return matchesQ && matchesStatus && matchesPrio;
    });

    out = out.sort((a, b) => {
      if (sort === "updated") return +new Date(b.updatedAt) - +new Date(a.updatedAt);
      if (sort === "created") return +new Date(b.createdAt) - +new Date(a.createdAt);
      // priority order
      const order: Record<Priority, number> = { urgent: 3, high: 2, normal: 1, low: 0 };
      return order[b.priority] - order[a.priority];
    });
    return out;
  }, [q, status, priority, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageClamped = Math.min(page, totalPages);
  const slice = filtered.slice((pageClamped - 1) * pageSize, pageClamped * pageSize);

  return (
    <div className="pt-req-page">
      {/* Header / actions */}
      <section className="panel pt-req-hero">
        <div>
          <h2 className="pt-req-title">My Requests</h2>
          <p className="text-muted">View, filter, and track all your support tickets.</p>
        </div>
        <div className="pt-req-actions">
          <Link to="../new-request" className="btn btn-primary">New Request</Link>
        </div>
      </section>

      {/* Filters */}
      <section className="panel pt-req-filters">
        <div className="pt-req-search">
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder="Search by subject, ref, or category…"
            aria-label="Search requests"
          />
        </div>

        <div className="pt-req-selects">
          <label className="pt-req-field">
            <span>Status</span>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as Status | "all");
                setPage(1);
              }}
            >
              <option value="all">All</option>
              <option value="open">Open</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="solved">Solved</option>
              <option value="closed">Closed</option>
            </select>
          </label>

          <label className="pt-req-field">
            <span>Priority</span>
            <select
              value={priority}
              onChange={(e) => {
                setPriority(e.target.value as Priority | "all");
                setPage(1);
              }}
            >
              <option value="all">All</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="normal">Normal</option>
              <option value="low">Low</option>
            </select>
          </label>

          <label className="pt-req-field">
            <span>Sort</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as any)}
            >
              <option value="updated">Recently updated</option>
              <option value="created">Recently created</option>
              <option value="priority">Highest priority</option>
            </select>
          </label>
        </div>
      </section>

      {/* Table */}
      <section className="panel pt-req-table" role="region" aria-label="Requests">
        {slice.length === 0 ? (
          <div className="pt-req-empty">
            <div className="pt-req-empty__title">No requests match your filters</div>
            <p className="text-muted">Try adjusting the filters or start a new request.</p>
            <Link to="../new-request" className="btn btn-primary">Create Request</Link>
          </div>
        ) : (
          <div className="pt-req-table__scroll">
            <table>
              <thead>
                <tr>
                  <th>Subject</th>
                  <th className="is-sm">Ref</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th className="is-md">Category</th>
                  <th className="is-sm">Updated</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {slice.map((t) => (
                  <tr key={t.id}>
                    <td className="pt-req-subject">
                      <Link to={`../requests/${t.id}`} className="pt-req-link">
                        {t.subject}
                      </Link>
                      {t.attachments ? <span className="pt-req-attach" title="Attachments">· {t.attachments} file{t.attachments > 1 ? "s" : ""}</span> : null}
                    </td>
                    <td className="is-sm mono">{t.ref}</td>
                    <td>
                      <span className={`pt-status pt-status--${t.status}`}>{humanStatus(t.status)}</span>
                    </td>
                    <td>
                      <span className={`pt-prio pt-prio--${t.priority}`}>{t.priority}</span>
                    </td>
                    <td className="is-md">{t.category}</td>
                    <td className="is-sm">{relativeTime(t.updatedAt)}</td>
                    <td className="pt-req-rowaction">
                      <Link to={`../requests/${t.id}`} className="btn">Open</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="pt-req-pager">
          <button
            className="btn"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={pageClamped === 1}
          >
            Prev
          </button>
          <span className="pt-req-pageinfo">
            Page {pageClamped} of {totalPages}
          </span>
          <button
            className="btn"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={pageClamped === totalPages}
          >
            Next
          </button>
        </div>
      </section>
    </div>
  );
}

/* -------- helpers -------- */

function humanStatus(s: Status) {
  switch (s) {
    case "open": return "Open";
    case "pending": return "Pending";
    case "in_progress": return "In Progress";
    case "solved": return "Solved";
    case "closed": return "Closed";
  }
}

function relativeTime(iso: string) {
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
  const diff = +new Date(iso) - Date.now();
  const mins = Math.round(diff / 60000);
  const hours = Math.round(mins / 60);
  const days = Math.round(hours / 24);
  if (Math.abs(mins) < 60) return rtf.format(mins, "minute");
  if (Math.abs(hours) < 24) return rtf.format(hours, "hour");
  return rtf.format(days, "day");
}
