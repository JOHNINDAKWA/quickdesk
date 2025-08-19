import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import {
  FiSend,
  FiPaperclip,
  FiAlertTriangle,
  FiX,
  FiClock,
  FiChevronDown,
  FiEdit3,
} from "react-icons/fi";
import QDSelect from "../../../../../components/QDSelect";
import CustomQuillEditor from "../../../../../components/CustomQuillEditor/CustomQuillEditor";
import "./TicketDetails.css";

/* =========================================================
   Config — choose save model
   ======================================================= */
const USE_AUTOSAVE = false; // ← set true to auto-save detail edits

/* =========================================================
   Types
   ======================================================= */
type TicketStatus = "open" | "pending" | "in_progress" | "on_hold" | "solved" | "closed";
type TicketPriority = "urgent" | "high" | "normal" | "low";
type SLAState = "ok" | "at_risk" | "breached";

type EscalationEvent = {
  id: string;
  when: string;
  by: string;
  toTeam: string;
  level: 2 | 3;
  reason: string;
  priorityBump?: TicketPriority;
};

type Message = {
  id: string;
  author: string;
  internal?: boolean;
  html: string;
  attachments?: { id: string; name: string; size: number }[];
  createdAt: string;
};

type Ticket = {
  id: string;
  ref: string;
  subject: string;
  requester: string;
  assignee?: string;
  team?: string;
  category?: string;
  status: TicketStatus;
  priority: TicketPriority;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  sla: SLAState;
  watchers: string[];
  escalations: EscalationEvent[];
  messages: Message[];
};

/* Only the fields editable on the right/inline subject */
type EditableMeta = Pick<
  Ticket,
  "subject" | "status" | "priority" | "assignee" | "team" | "category" | "tags"
>;

/* =========================================================
   Helpers / constants
   ======================================================= */
const statusOptions = [
  { label: "Open", value: "open" },
  { label: "Pending", value: "pending" },
  { label: "In Progress", value: "in_progress" },
  { label: "On Hold", value: "on_hold" },
  { label: "Solved", value: "solved" },
  { label: "Closed", value: "closed" },
];
const priorityOptions = [
  { label: "Urgent", value: "urgent" },
  { label: "High", value: "high" },
  { label: "Normal", value: "normal" },
  { label: "Low", value: "low" },
];
const teamOptions = ["Support", "IT", "Engineering", "Billing", "Success"].map(t => ({ label: t, value: t }));
const categoryOptions = ["Access", "Billing", "Bug", "How-To", "Integration", "Security"].map(c => ({ label: c, value: c }));

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

const nid = () => Math.random().toString(36).slice(2, 9);

const pickEditable = (t: Ticket): EditableMeta => ({
  subject: t.subject,
  status: t.status,
  priority: t.priority,
  assignee: t.assignee,
  team: t.team,
  category: t.category,
  tags: t.tags,
});
const shallowEqMeta = (a: EditableMeta, b: EditableMeta) =>
  a.subject === b.subject &&
  a.status === b.status &&
  a.priority === b.priority &&
  a.assignee === b.assignee &&
  a.team === b.team &&
  a.category === b.category &&
  a.tags.join(",") === b.tags.join(",");

/* =========================================================
   Main Page
   ======================================================= */
export default function TicketDetail() {
  const { id } = useParams();

  // --- Seed mock ticket ---
  const [ticket, setTicket] = useState<Ticket>(() => {
    const now = new Date();
    const created = new Date(now.getTime() - 1000 * 60 * 60 * 24);
    return {
      id: id || "1",
      ref: `QD-2025-${(1000 + Number(id || 1)).toString()}`,
      subject: `Cannot login #${id || 1}`,
      requester: "Jane Apondi",
      assignee: "Agent Jane",
      team: "Support",
      category: "Access",
      status: "open",
      priority: "normal",
      tags: ["login", "auth"],
      createdAt: created.toISOString(),
      updatedAt: now.toISOString(),
      sla: "at_risk",
      watchers: ["Mary W", "Brian A"],
      escalations: [],
      messages: [
        {
          id: nid(),
          author: "Jane Apondi",
          html: "<p>Hello, I can’t log in to the portal after password reset.</p>",
          createdAt: new Date(now.getTime() - 1000 * 60 * 50).toISOString(),
        },
        {
          id: nid(),
          author: "Agent Jane",
          html: "<p>Thanks Jane! Could you confirm the error you see?</p>",
          createdAt: new Date(now.getTime() - 1000 * 60 * 40).toISOString(),
        },
      ],
    };
  });

  /* -------- Draft meta for the details panel/subject -------- */
  const [meta, setMeta] = useState<EditableMeta>(() => pickEditable(ticket));
  useEffect(() => {
    // If a different ticket loads, reset the draft
    setMeta(pickEditable(ticket));
  }, [ticket.id]); // eslint-disable-line

  const dirty = !shallowEqMeta(meta, pickEditable(ticket));

  /* -------- Save UX state (only for details edits) -------- */
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  async function persistMeta() {
    if (!dirty) return;
    setSaving(true);
    // TODO: call your API with `meta`
    await new Promise(r => setTimeout(r, 400)); // demo latency
    setTicket(t => ({ ...t, ...meta, updatedAt: new Date().toISOString() }));
    setSaving(false);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 1200);
  }

  // Optional auto-save
  useEffect(() => {
    if (!USE_AUTOSAVE || !dirty) return;
    const id = setTimeout(persistMeta, 600);
    return () => clearTimeout(id);
  }, [meta, dirty]);

  /* -------- Composer state -------- */
  const [replyHtml, setReplyHtml] = useState("");
  const [files, setFiles] = useState<File[]>([]);

  function addReply(internal = false) {
    if (!replyHtml.trim() && files.length === 0) return;
    const newMsg: Message = {
      id: nid(),
      author: internal ? "Agent Jane (internal)" : "Agent Jane",
      internal,
      html: replyHtml || "<p>(attachment only)</p>",
      attachments:
        files.length > 0
          ? files.map((f) => ({ id: nid(), name: f.name, size: f.size }))
          : undefined,
      createdAt: new Date().toISOString(),
    };
    setTicket((t) => ({
      ...t,
      messages: [...t.messages, newMsg],
      updatedAt: new Date().toISOString(),
      status: internal ? t.status : (t.status === "open" ? "pending" : t.status),
    }));
    setReplyHtml("");
    setFiles([]);
  }

  /* -------- Escalation modal -------- */
  const [escOpen, setEscOpen] = useState(false);
  function confirmEscalation(data: {
    toTeam: string;
    level: 2 | 3;
    reason: string;
    priorityBump?: TicketPriority;
  }) {
    const ev: EscalationEvent = {
      id: nid(),
      when: new Date().toISOString(),
      by: "Agent Jane",
      toTeam: data.toTeam,
      level: data.level,
      reason: data.reason,
      priorityBump: data.priorityBump,
    };
    setTicket((t) => ({
      ...t,
      priority: data.priorityBump ?? t.priority,
      team: data.toTeam,
      escalations: [ev, ...t.escalations],
      updatedAt: new Date().toISOString(),
    }));
    setEscOpen(false);
  }

  return (
    <div className="td-root">
      {/* Header */}
      <header className="td-head panel">
        <div className="td-head__left">
          <div className="td-ref mono">{ticket.ref}</div>

          {/* subject now edits the draft meta only */}
          <InlineSubject
            value={meta.subject}
            onChange={(v) => setMeta((m) => ({ ...m, subject: v }))}
          />

          {/* Save pill only for detail edits */}
          <div className="td-savestate">
            {saving ? "Saving…" : justSaved ? "Saved" : null}
          </div>
        </div>

        <div className="td-head__right">
          {!USE_AUTOSAVE && (
            <button
              className="btn btn-primary"
              disabled={!dirty || saving}
              onClick={persistMeta}
              title={dirty ? "Save changes" : "No changes to save"}
            >
              Save changes
            </button>
          )}
          <button className="btn btn-ghost" onClick={() => setEscOpen(true)}>
            <FiAlertTriangle /> Escalate
          </button>
        </div>
      </header>

      {/* Main split */}
      <div className="td-main">
        {/* LEFT: Conversation */}
        <ConversationPane
          messages={ticket.messages}
          onSendPublic={() => addReply(false)}
          onSendInternal={() => addReply(true)}
          replyHtml={replyHtml}
          setReplyHtml={setReplyHtml}
          files={files}
          setFiles={setFiles}
        />

        {/* RIGHT: Editable details — bound to draft meta */}
        <DetailsSidebar
          meta={meta}
          ticket={ticket}
          onChange={(patch) => setMeta((m) => ({ ...m, ...patch }))}
        />
      </div>

      {escOpen && (
        <EscalateModal
          onClose={() => setEscOpen(false)}
          onConfirm={confirmEscalation}
          defaultTeam={ticket.team || "Support"}
          history={ticket.escalations}
        />
      )}
    </div>
  );
}

/* =========================================================
   Inline subject editor
   ======================================================= */
function InlineSubject({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);

  return (
    <div className="td-subject">
      {!editing ? (
        <button className="td-subject__display" onClick={() => setEditing(true)} title="Edit subject">
          <FiEdit3 /> <span>{value}</span>
        </button>
      ) : (
        <input
          className="td-subject__input"
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => { onChange(draft.trim() || value); setEditing(false); }}
          onKeyDown={(e) => {
            if (e.key === "Enter") { onChange(draft.trim() || value); setEditing(false); }
            else if (e.key === "Escape") { setDraft(value); setEditing(false); }
          }}
        />
      )}
    </div>
  );
}

/* =========================================================
   Conversation pane (timeline + composer)
   ======================================================= */
function ConversationPane({
  messages,
  replyHtml,
  setReplyHtml,
  files,
  setFiles,
  onSendPublic,
  onSendInternal,
}: {
  messages: Message[];
  replyHtml: string;
  setReplyHtml: (v: string) => void;
  files: File[];
  setFiles: (f: File[]) => void;
  onSendPublic: () => void;
  onSendInternal: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const sorted = useMemo(
    () => [...messages].sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt)),
    [messages]
  );

  return (
    <section className="td-convo panel">
      {/* Timeline */}
      <div className="td-thread">
        {sorted.map((m) => (
          <article key={m.id} className={`td-msg ${m.internal ? "is-internal" : ""}`}>
            <div className="td-msg__meta">
              <span className="td-msg__author">{m.author}</span>
              <span className="td-msg__dot">•</span>
              <span className="td-msg__time">{timeAgo(m.createdAt)}</span>
              {m.internal && <span className="td-msg__badge">internal</span>}
            </div>
            <div className="td-msg__body" dangerouslySetInnerHTML={{ __html: m.html }} />
            {m.attachments?.length ? (
              <div className="td-msg__atts">
                {m.attachments.map((a) => (
                  <a key={a.id} className="td-att" href="#" onClick={(e) => e.preventDefault()}>
                    {a.name} <span className="muted">({(a.size / 1024).toFixed(0)} KB)</span>
                  </a>
                ))}
              </div>
            ) : null}
          </article>
        ))}
      </div>

      {/* Composer */}
      <div className="td-composer">
        <CustomQuillEditor value={replyHtml} onChange={setReplyHtml} placeholder="Write a reply…" />
        <div className="td-compose__bar">
          <div className="td-files">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              hidden
              onChange={(e) => {
                const list = e.target.files ? Array.from(e.target.files) : [];
                setFiles([...files, ...list]);
                e.currentTarget.value = "";
              }}
            />
            <button className="btn btn-ghost" onClick={() => fileInputRef.current?.click()} title="Attach files">
              <FiPaperclip /> Attach
            </button>
            {!!files.length && (
              <div className="td-files__list">
                {files.map((f, i) => (
                  <span key={i} className="chip">
                    {f.name}
                    <button className="chip__x" onClick={() => setFiles(files.filter((_, idx) => idx !== i))} aria-label={`Remove ${f.name}`}>
                      <FiX />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="td-send">
            <button className="btn btn-ghost" onClick={onSendInternal} title="Add internal note">
              Internal note
            </button>
            <button className="btn btn-primary" onClick={onSendPublic} title="Send reply">
              <FiSend /> Send
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   Editable details (uses draft meta)
   ======================================================= */
function DetailsSidebar({
  ticket,
  meta,
  onChange,
}: {
  ticket: Ticket;
  meta: EditableMeta;
  onChange: (patch: Partial<EditableMeta>) => void;
}) {
  return (
    <aside className="td-side panel">
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

      {/* Escalation history */}
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
    </aside>
  );
}

function slaLabel(s: SLAState) {
  switch (s) {
    case "ok": return "On track";
    case "at_risk": return "At risk";
    case "breached": return "Breached";
  }
}

/* =========================================================
   Escalate modal (unchanged)
   ======================================================= */
function EscalateModal({
  onClose,
  onConfirm,
  defaultTeam,
  history,
}: {
  onClose: () => void;
  onConfirm: (v: { toTeam: string; level: 2 | 3; reason: string; priorityBump?: TicketPriority }) => void;
  defaultTeam: string;
  history: EscalationEvent[];
}) {
  const [toTeam, setToTeam] = useState(defaultTeam);
  const [level, setLevel] = useState<2 | 3>(2);
  const [reason, setReason] = useState("");
  const [priorityBump, setPriorityBump] = useState<TicketPriority | "">("");

  return (
    <>
      <div className="td-modal__backdrop" onClick={onClose} />
      <div className="td-modal panel" role="dialog" aria-modal="true" aria-label="Escalate ticket">
        <div className="td-modal__head">
          <h3><FiAlertTriangle /> Escalate ticket</h3>
          <button className="iconbtn" onClick={onClose} aria-label="Close"><FiX /></button>
        </div>

        <div className="td-modal__body">
          <div className="grid">
            <div className="field">
              <label>Escalate to team</label>
              <QDSelect
                instanceId="esc-team"
                options={teamOptions}
                value={teamOptions.find((o) => o.value === toTeam)}
                onChange={(v) => setToTeam((v as any).value)}
                compact
              />
            </div>
            <div className="field">
              <label>Level</label>
              <QDSelect
                instanceId="esc-level"
                options={[{ label: "Level 2", value: 2 }, { label: "Level 3", value: 3 }]}
                value={{ label: `Level ${level}`, value: level }}
                onChange={(v) => setLevel((v as any).value)}
                compact
              />
            </div>
            <div className="field">
              <label>Priority bump (optional)</label>
              <QDSelect
                instanceId="esc-prio"
                isClearable
                options={priorityOptions}
                value={priorityBump ? priorityOptions.find((o) => o.value === priorityBump) : null}
                onChange={(v) => setPriorityBump((v as any)?.value ?? "")}
                compact
              />
            </div>
            <div className="field col-span-2">
              <label>Reason</label>
              <textarea
                className="textarea"
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Why is this being escalated?"
              />
            </div>
          </div>

          <details className="td-esc__history">
            <summary>Recent escalations <FiChevronDown /></summary>
            {history.length === 0 ? (
              <div className="muted">No previous escalations.</div>
            ) : (
              <ul>
                {history.map((h) => (
                  <li key={h.id}>
                    <span className="badge">L{h.level}</span> to <b>{h.toTeam}</b> •{" "}
                    <span className="muted">{timeAgo(h.when)}</span>
                    <div className="muted">“{h.reason}”</div>
                  </li>
                ))}
              </ul>
            )}
          </details>
        </div>

        <div className="td-modal__foot">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary"
            disabled={!reason.trim()}
            onClick={() => onConfirm({ toTeam, level, reason: reason.trim(), priorityBump: priorityBump || undefined })}
          >
            Escalate
          </button>
        </div>
      </div>
    </>
  );
}
