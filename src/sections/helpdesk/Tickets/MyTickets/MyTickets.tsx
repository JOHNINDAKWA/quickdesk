import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  FiChevronDown,
  FiChevronUp,
  FiMoreHorizontal,
  FiSearch,
  FiSliders,
  FiX,
} from "react-icons/fi";
import { useOrg } from "../../../../app/org";
import { FilterPanel } from "./FilterPanel";
import "./MyTickets.css";

/* ---------- types ---------- */
type TicketStatus = "open" | "pending" | "in_progress" | "solved" | "closed" | "on_hold";
type TicketPriority = "urgent" | "high" | "normal" | "low";
type TicketChannel = "email" | "portal" | "chat" | "phone" | "api";
type SLAState = "ok" | "breached" | "at_risk";

export type Ticket = {
  id: string;
  ref: string;
  subject: string;
  requester: string;
  assignee?: string;
  team?: string;
  category?: string;
  status: TicketStatus;
  priority: TicketPriority;
  channel: TicketChannel;
  tags: string[];
  createdAt: string; // ISO
  updatedAt: string; // ISO
  sla: SLAState;
};

export type Option = { label: string; value: string };

type Filters = {
  search: string;
  status: Option[];
  priority: Option[];
  category: Option[];
  assignee: Option[];
  requester: Option[];
  channel: Option[];
  team: Option[];
  tags: Option[];
  sla: Option[];
  createdFrom?: string;
  createdTo?: string;
  sortBy: "updatedAt" | "createdAt" | "priority" | "status";
  sortDir: "asc" | "desc";
};

/* ---------- helpers ---------- */
const statusOptions: Option[] = [
  { label: "Open", value: "open" },
  { label: "Pending", value: "pending" },
  { label: "In Progress", value: "in_progress" },
  { label: "On Hold", value: "on_hold" },
  { label: "Solved", value: "solved" },
  { label: "Closed", value: "closed" },
];
const priorityOptions: Option[] = [
  { label: "Urgent", value: "urgent" },
  { label: "High", value: "high" },
  { label: "Normal", value: "normal" },
  { label: "Low", value: "low" },
];
const channelOptions: Option[] = [
  { label: "Email", value: "email" },
  { label: "Portal", value: "portal" },
  { label: "Chat", value: "chat" },
  { label: "Phone", value: "phone" },
  { label: "API", value: "api" },
];
const slaOptions: Option[] = [
  { label: "OK", value: "ok" },
  { label: "Breached", value: "breached" },
  { label: "At Risk", value: "at_risk" },
];

const unique = (arr: (string | undefined)[]) =>
  Array.from(new Set(arr.filter(Boolean))) as string[];

const DEFAULT_FILTERS: Filters = {
  search: "",
  status: [],
  priority: [],
  category: [],
  assignee: [],
  requester: [],
  channel: [],
  team: [],
  tags: [],
  sla: [],
  createdFrom: undefined,
  createdTo: undefined,
  sortBy: "updatedAt",
  sortDir: "desc",
};

/** option pickers by value */
const byVal = (opts: Option[]) => (v: string) => opts.find((o) => o.value === v)!;
const S = byVal(statusOptions);
const P = byVal(priorityOptions);
const SLA = byVal(slaOptions);

/** URL preset → filters (partial) */
const PRESETS: Record<string, Partial<Filters>> = {
  all: {},
  open: { status: [S("open"), S("in_progress"), S("on_hold")] },
  replied: { status: [S("pending")] },
  overdue: { sla: [SLA("breached")] },
  closed: { status: [S("solved"), S("closed")] },
  escalations: { priority: [P("urgent")] },
};

/** Relative time like “just now”, “3h ago” */
function timeAgo(iso: string) {
  const now = Date.now();
  const t = new Date(iso).getTime();
  const diff = Math.max(0, Math.floor((now - t) / 1000)); // seconds
  if (diff < 10) return "just now";
  if (diff < 60) return `${diff}s ago`;
  const m = Math.floor(diff / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  const w = Math.floor(d / 7);
  if (w < 5) return `${w}w ago`;
  return new Date(iso).toLocaleDateString();
}
function slaLabel(s: SLAState) {
  switch (s) {
    case "ok":
      return "On track";
    case "at_risk":
      return "At risk";
    case "breached":
      return "Breached";
  }
}

/* ---------- mock data (replace with API later) ---------- */
const MOCK_TICKETS: Ticket[] = Array.from({ length: 42 }).map((_, i) => {
  const priorities: TicketPriority[] = ["urgent", "high", "normal", "low"];
  const statuses: TicketStatus[] = ["open", "pending", "in_progress", "solved", "closed", "on_hold"];
  const channels: TicketChannel[] = ["email", "portal", "chat", "phone", "api"];
  const categories = ["Billing", "Access", "Bug", "How-To", "Security", "Integration"];
  const teams = ["Support", "IT", "Billing", "Success", "Engineering"];
  const tagsAll = ["vip", "sla", "refund", "gdpr", "priority", "oauth", "infra", "beta"];

  const created = new Date();
  created.setDate(created.getDate() - Math.floor(Math.random() * 30));
  const updated = new Date(created);
  updated.setHours(updated.getHours() + Math.floor(Math.random() * 240));

  return {
    id: String(i + 1),
    ref: `QD-2025-${(1000 + i).toString()}`,
    subject:
      [
        "Cannot login",
        "Webhook failing",
        "Need invoice",
        "API 401 error",
        "Feature request",
        "Upgrade plan",
      ][Math.floor(Math.random() * 6)] + ` #${i + 1}`,
    requester: ["Jane Apondi", "Brian Shaw", "Mary Wabuko", "Chris Jericho", "Ahmed Nassir"][
      Math.floor(Math.random() * 5)
    ],
    assignee: ["Mary W", "Brian A", "Chris K", "Ahmed S", "Agent Jane"][Math.floor(Math.random() * 5)],
    team: teams[Math.floor(Math.random() * teams.length)],
    category: categories[Math.floor(Math.random() * categories.length)],
    status: statuses[Math.floor(Math.random() * statuses.length)],
    priority: priorities[Math.floor(Math.random() * priorities.length)],
    channel: channels[Math.floor(Math.random() * channels.length)],
    tags: Array.from(
      new Set(
        Array.from({ length: Math.floor(Math.random() * 3) + 1 }).map(
          () => tagsAll[Math.floor(Math.random() * tagsAll.length)]
        )
      )
    ),
    createdAt: created.toISOString(),
    updatedAt: updated.toISOString(),
    sla: (["ok", "breached", "at_risk"] as SLAState[])[Math.floor(Math.random() * 3)],
  };
});

const assigneeOptions: Option[] = unique(MOCK_TICKETS.map((t) => t.assignee)).map((a) => ({ label: a, value: a }));
const requesterOptions: Option[] = unique(MOCK_TICKETS.map((t) => t.requester)).map((a) => ({ label: a, value: a }));
const categoryOptions: Option[] = unique(MOCK_TICKETS.map((t) => t.category)).map((a) => ({ label: a, value: a }));
const teamOptions: Option[] = unique(MOCK_TICKETS.map((t) => t.team)).map((a) => ({ label: a, value: a }));
const tagOptions: Option[] = unique(MOCK_TICKETS.flatMap((t) => t.tags)).map((a) => ({ label: a, value: a }));

/* ---------- component ---------- */
export default function MyTickets() {
  const org = useOrg();

  // state
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [selection, setSelection] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // read ?view= (or ?f=) and apply preset
  const [searchParams] = useSearchParams();
  useEffect(() => {
    const v = (searchParams.get("view") || searchParams.get("f") || "all").toLowerCase();
    const preset = PRESETS[v];
    if (!preset) return;
    setFilters({ ...DEFAULT_FILTERS, ...preset });
    setPage(1);
    setSelection([]);
  }, [searchParams]);

  // close open row menu on outside click / Esc
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!openMenuId) return;
      const el = menuRefs.current[openMenuId];
      if (el && !el.contains(e.target as Node)) setOpenMenuId(null);
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpenMenuId(null);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [openMenuId]);

  // Filter + sort
  const filtered = useMemo(() => {
    const f = filters;
    const withinDate = (iso: string) => {
      const d = new Date(iso).getTime();
      const from = f.createdFrom ? new Date(f.createdFrom).getTime() : null;
      const to = f.createdTo ? new Date(f.createdTo).getTime() + 86_399_000 : null;
      if (from && d < from) return false;
      if (to && d > to) return false;
      return true;
    };
    const hasAny = (vals: Option[], v?: string) => vals.length === 0 || vals.some((o) => o.value === v);
    const hasAnyMulti = (vals: Option[], arr: string[]) => vals.length === 0 || arr.some((a) => vals.some((o) => o.value === a));
    const text = f.search.trim().toLowerCase();

    const out = MOCK_TICKETS.filter((t) => {
      if (text && !(t.subject.toLowerCase().includes(text) || t.ref.toLowerCase().includes(text))) return false;
      if (!withinDate(t.createdAt)) return false;
      if (!hasAny(f.status, t.status)) return false;
      if (!hasAny(f.priority, t.priority)) return false;
      if (!hasAny(f.category, t.category)) return false;
      if (!hasAny(f.assignee, t.assignee)) return false;
      if (!hasAny(f.requester, t.requester)) return false;
      if (!hasAny(f.channel, t.channel)) return false;
      if (!hasAny(f.team, t.team)) return false;
      if (!hasAnyMulti(f.tags, t.tags)) return false;
      if (!hasAny(f.sla, t.sla)) return false;
      return true;
    });

    out.sort((a, b) => {
      const dir = filters.sortDir === "asc" ? 1 : -1;
      switch (filters.sortBy) {
        case "priority": {
          const order: TicketPriority[] = ["urgent", "high", "normal", "low"];
          return (order.indexOf(a.priority) - order.indexOf(b.priority)) * dir;
        }
        case "status": {
          const order: TicketStatus[] = ["open", "pending", "in_progress", "on_hold", "solved", "closed"];
          return (order.indexOf(a.status) - order.indexOf(b.status)) * dir;
        }
        case "createdAt":
          return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * dir;
        case "updatedAt":
        default:
          return (new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()) * dir;
      }
    });

    return out;
  }, [filters]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [filtered.length, totalPages, page]);

  const pageItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page]);

  // Selection
  const allVisibleSelected = pageItems.every((t) => selection.includes(t.id)) && pageItems.length > 0;
  const someVisibleSelected = pageItems.some((t) => selection.includes(t.id));
  const toggleAllVisible = () => {
    if (allVisibleSelected) {
      setSelection((prev) => prev.filter((id) => !pageItems.some((t) => t.id === id)));
    } else {
      setSelection((prev) => Array.from(new Set([...prev, ...pageItems.map((t) => t.id)])));
    }
  };
  const toggleOne = (id: string) => {
    setSelection((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };
  const clearSelection = () => setSelection([]);

  // Actions (wire later)
  const actClone = () => console.log("clone", selection);
  const actMerge = () => console.log("merge", selection);
  const actAssign = () => console.log("assign", selection);
  const actStatus = (status: TicketStatus) => console.log("status", status, selection);
  const actTag = () => console.log("add tag", selection);
  const actExport = () => console.log("export", selection);
  const actDelete = () => console.log("delete", selection);

  // Ticket detail path: /:orgSlug/console/tickets/:id
  const basePath = `/${org.slug}/console/tickets`;

  return (
    <div className="mytickets-root" data-app="helpdesk">
      {/* ===== TOP BAR ===== */}
      <section className="panel mytickets-topbar" aria-label="Search and sort">
        <div className="topbar__search">
          <FiSearch className="topbar__icon" />
          <input
            value={filters.search}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
            placeholder="Search tickets by subject or reference…"
            aria-label="Search tickets"
          />
        </div>

        <div className="topbar__right">
          <div className="topbar__sort">
            <label>Sort</label>
            <select
              value={filters.sortBy}
              onChange={(e) => setFilters((f) => ({ ...f, sortBy: e.target.value as Filters["sortBy"] }))}
              aria-label="Sort by"
            >
              <option value="updatedAt">Last Updated</option>
              <option value="createdAt">Created</option>
              <option value="priority">Priority</option>
              <option value="status">Status</option>
            </select>
            <button
              className="btn"
              onClick={() =>
                setFilters((f) => ({ ...f, sortDir: f.sortDir === "asc" ? "desc" : "asc" }))
              }
              aria-label="Toggle sort direction"
              title="Toggle sort direction"
            >
              {filters.sortDir === "asc" ? <FiChevronUp /> : <FiChevronDown />}
            </button>
          </div>

          {/* Mobile-only filter trigger */}
          <button className="btn topbar__filtersBtn" onClick={() => setFiltersOpen(true)}>
            <FiSliders /> Filters
          </button>
        </div>
      </section>

      {/* ===== BULK ACTIONS ===== */}
      {selection.length > 0 && (
        <div className="panel mytickets-bulkbar" role="region" aria-live="polite">
          <div className="mytickets-bulkbar__left">
            <b>{selection.length}</b> selected
            <button className="btn" onClick={clearSelection} style={{ marginLeft: 8 }}>
              Clear
            </button>
          </div>
          <div className="mytickets-bulkbar__actions">
            {selection.length === 1 ? (
              <>
                <button className="btn" onClick={actClone}>Clone</button>
                <button className="btn" onClick={() => actAssign()}>Assign</button>
                <div className="btn-group">
                  <button className="btn" onClick={() => actStatus("open")}>Set Open</button>
                  <button className="btn" onClick={() => actStatus("pending")}>Set Pending</button>
                  <button className="btn" onClick={() => actStatus("in_progress")}>Set In Progress</button>
                </div>
                <button className="btn" onClick={actTag}>Add Tag</button>
                <button className="btn" onClick={actExport}>Export</button>
                <button className="btn" onClick={actDelete}>Delete</button>
              </>
            ) : (
              <>
                <button className="btn" onClick={actMerge}>Merge</button>
                <button className="btn" onClick={() => actAssign()}>Bulk Assign</button>
                <div className="btn-group">
                  <button className="btn" onClick={() => actStatus("open")}>Set Open</button>
                  <button className="btn" onClick={() => actStatus("pending")}>Set Pending</button>
                  <button className="btn" onClick={() => actStatus("in_progress")}>Set In Progress</button>
                  <button className="btn" onClick={() => actStatus("solved")}>Set Solved</button>
                  <button className="btn" onClick={() => actStatus("closed")}>Set Closed</button>
                </div>
                <button className="btn" onClick={actTag}>Add Tag</button>
                <button className="btn" onClick={actExport}>Export</button>
                <button className="btn" onClick={actDelete}>Delete</button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ===== MAIN SPLIT ===== */}
      <div className="mytickets-main">
        {/* Table */}
        <section className="panel mytickets-table">
          <div className="tbl-head">
            <div className="cell sel">
              <input
                type="checkbox"
                aria-label="Select all on page"
                checked={allVisibleSelected}
                ref={(el) => {
                  if (el) el.indeterminate = !allVisibleSelected && someVisibleSelected;
                }}
                onChange={toggleAllVisible}
              />
            </div>
            <div className="cell ref">Ref</div>
            <div className="cell subject">Subject</div>
            <div className="cell prio">Priority</div>
            <div className="cell status">Status</div>
            <div className="cell assignee">Assignee</div>
            <div className="cell requester">Requester</div>
            <div className="cell team">Team</div>
            <div className="cell sla">SLA</div>
            <div className="cell updated">Updated</div>
            <div className="cell more"></div>
          </div>

          <div className="tbl-body">
            {pageItems.length === 0 ? (
              <div className="empty">No tickets match these filters.</div>
            ) : (
              pageItems.map((t) => {
                const isChecked = selection.includes(t.id);
                const detailPath = `${basePath}/${t.id}`;

                return (
                  <div className={`row ${isChecked ? "is-selected" : ""}`} key={t.id}>
                    <div className="cell sel">
                      <input
                        type="checkbox"
                        aria-label={`Select ticket ${t.ref}`}
                        checked={isChecked}
                        onChange={() => toggleOne(t.id)}
                      />
                    </div>

                    <div className="cell ref mono">
                      <Link className="link-plain" to={detailPath}>{t.ref}</Link>
                    </div>
                    <div className="cell subject">
                      <Link className="link-plain strong" to={detailPath}>{t.subject}</Link>
                    </div>

                    <div className="cell prio">
                      <span className={`badge prio-${t.priority}`}>{t.priority}</span>
                    </div>
                    <div className="cell status">
                      <span className={`badge st-${t.status}`}>{t.status.replace("_", " ")}</span>
                    </div>
                    <div className="cell assignee">{t.assignee ?? "-"}</div>
                    <div className="cell requester">{t.requester}</div>
                    <div className="cell team">{t.team ?? "-"}</div>
                    <div className="cell sla">
                      <span className={`badge sla-${t.sla}`}>{slaLabel(t.sla)}</span>
                    </div>
                    <div className="cell updated">{timeAgo(t.updatedAt)}</div>

                    <div
                      className="cell more"
                      ref={(el) => {
                        menuRefs.current[t.id] = el;
                      }}
                    >
                      <button
                        className="iconbtn"
                        title="More"
                        aria-haspopup="menu"
                        aria-expanded={openMenuId === t.id}
                        onClick={() => setOpenMenuId((id) => (id === t.id ? null : t.id))}
                      >
                        <FiMoreHorizontal />
                      </button>

                      {openMenuId === t.id && (
                        <div className="rowmenu" role="menu">
                          <button role="menuitem" className="rowmenu__item" onClick={() => { setOpenMenuId(null); /* navigate */ }}>
                            Open
                          </button>
                          <button role="menuitem" className="rowmenu__item" onClick={() => { setOpenMenuId(null); actClone(); }}>
                            Clone
                          </button>
                          <button role="menuitem" className="rowmenu__item" onClick={() => { setOpenMenuId(null); actAssign(); }}>
                            Assign
                          </button>
                          <button role="menuitem" className="rowmenu__item" onClick={() => { setOpenMenuId(null); actExport(); }}>
                            Export
                          </button>
                          <div className="rowmenu__sep" />
                          <button role="menuitem" className="rowmenu__item danger" onClick={() => { setOpenMenuId(null); actDelete(); }}>
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="tbl-foot">
            <div className="muted">
              Showing <b>{pageItems.length}</b> of <b>{filtered.length}</b> tickets
            </div>
            <div className="pager">
              <button className="btn" disabled={page <= 1} onClick={() => setPage(1)}>« First</button>
              <button className="btn" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>‹ Prev</button>
              <span className="muted">Page {page} / {totalPages}</span>
              <button className="btn" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next ›</button>
              <button className="btn" disabled={page >= totalPages} onClick={() => setPage(totalPages)}>Last »</button>
            </div>
          </div>
        </section>

        {/* Filters (right column) */}
        <aside className="panel mytickets-filterPanel">
          <FilterPanel
            filters={filters}
            onChange={setFilters}
            options={{
              status: statusOptions,
              priority: priorityOptions,
              category: categoryOptions,
              assignee: assigneeOptions,
              requester: requesterOptions,
              channel: channelOptions,
              team: teamOptions,
              tags: tagOptions,
              sla: slaOptions,
            }}
          />
        </aside>
      </div>

      {/* Mobile filter drawer */}
      {filtersOpen && (
        <>
          <div className="filterDrawer__backdrop" onClick={() => setFiltersOpen(false)} />
          <aside className="panel filterDrawer" role="dialog" aria-modal="true" aria-label="Filters">
            <div className="filterDrawer__head">
              <h4>Filters</h4>
              <button className="iconbtn" onClick={() => setFiltersOpen(false)} aria-label="Close filters">
                <FiX />
              </button>
            </div>
            <FilterPanel
              filters={filters}
              onChange={setFilters}
              options={{
                status: statusOptions,
                priority: priorityOptions,
                category: categoryOptions,
                assignee: assigneeOptions,
                requester: requesterOptions,
                channel: channelOptions,
                team: teamOptions,
                tags: tagOptions,
                sla: slaOptions,
              }}
            />
          </aside>
        </>
      )}
    </div>
  );
}
