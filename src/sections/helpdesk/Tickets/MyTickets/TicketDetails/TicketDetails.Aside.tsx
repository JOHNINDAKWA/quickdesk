// ===============================
// File: TicketDetails.Aside.tsx
// Description: Details/metadata sidebar split out from main file.
// ===============================
import { FiClock } from "react-icons/fi";
import QDSelect from "../../../../../components/QDSelect";
import type { EditableMeta, Ticket, SLAState } from "./TicketDetails";

export default function DetailsAside({
  ticket,
  meta,
  statusOptions,
  priorityOptions,
  teamOptions,
  categoryOptions,
  onChange,
}: {
  ticket: Ticket;
  meta: EditableMeta;
  statusOptions: { label: string; value: any }[];
  priorityOptions: { label: string; value: any }[];
  teamOptions: { label: string; value: any }[];
  categoryOptions: { label: string; value: any }[];
  onChange: (patch: Partial<EditableMeta>) => void;
}) {
  return (
    <div className="td-side__inner">
      <div className="td-side__group">
        <label>Status</label>
        <QDSelect
          instanceId="t-status"
          options={statusOptions}
          value={statusOptions.find((o) => o.value === meta.status)}
          onChange={(v) => onChange({ status: (v as any).value })}
          compact
        />
      </div>

      <div className="td-side__group">
        <label>Priority</label>
        <QDSelect
          instanceId="t-priority"
          options={priorityOptions}
          value={priorityOptions.find((o) => o.value === meta.priority)}
          onChange={(v) => onChange({ priority: (v as any).value })}
          compact
        />
      </div>

      <div className="td-side__group">
        <label>Assignee</label>
        <input
          className="input"
          value={meta.assignee ?? ""}
          onChange={(e) => onChange({ assignee: e.target.value })}
          placeholder="Unassigned"
        />
      </div>

      <div className="td-side__group">
        <label>Team</label>
        <QDSelect
          instanceId="t-team"
          options={teamOptions}
          value={teamOptions.find((o) => o.value === meta.team)}
          onChange={(v) => onChange({ team: (v as any).value })}
          compact
        />
      </div>

      <div className="td-side__group">
        <label>Category</label>
        <QDSelect
          instanceId="t-category"
          options={categoryOptions}
          value={categoryOptions.find((o) => o.value === meta.category)}
          onChange={(v) => onChange({ category: (v as any).value })}
          compact
        />
      </div>

      <div className="td-side__group">
        <label>Tags</label>
        <input
          className="input"
          value={meta.tags.join(", ")}
          onChange={(e) =>
            onChange({
              tags: e.currentTarget.value
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
            })
          }
          placeholder="comma, separated, tags"
        />
      </div>

      <div className="td-side__meta">
        <div className="row">
          <span className="muted">Requester</span>
          <span>{ticket.requester}</span>
        </div>
        <div className="row">
          <span className="muted">SLA</span>
          <span className={`badge sla-${ticket.sla}`}>{slaLabel(ticket.sla)}</span>
        </div>
        <div className="row">
          <span className="muted">Created</span>
          <span title={new Date(ticket.createdAt).toLocaleString()}>
            <FiClock /> {timeAgo(ticket.createdAt)}
          </span>
        </div>
        <div className="row">
          <span className="muted">Updated</span>
          <span title={new Date(ticket.updatedAt).toLocaleString()}>
            <FiClock /> {timeAgo(ticket.updatedAt)}
          </span>
        </div>
      </div>

      <div className="td-side__group">
        <label>Escalation history</label>
        {ticket.escalations.length === 0 ? (
          <div className="muted">No escalations yet.</div>
        ) : (
          <ul className="td-esc__list">
            {ticket.escalations.map((e) => (
              <li key={e.id} className="td-esc__item">
                <div className="top">
                  <span className="badge">L{e.level}</span>
                  <span className="muted">{timeAgo(e.when)}</span>
                </div>
                <div className="body">
                  <div>
                    To <b>{e.toTeam}</b> by <b>{e.by}</b>
                  </div>
                  {e.priorityBump && <div className="muted">Priority → {e.priorityBump}</div>}
                  <div className="muted">“{e.reason}”</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function slaLabel(s: SLAState) {
  switch (s) {
    case "ok": return "On track";
    case "at_risk": return "At risk";
    case "breached": return "Breached";
  }
}

function timeAgo(iso: string) {
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
