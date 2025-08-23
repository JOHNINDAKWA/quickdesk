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
  FiZap,
} from "react-icons/fi";
import QDSelect from "../../../../../components/QDSelect";
import CustomQuillEditor from "../../../../../components/CustomQuillEditor/CustomQuillEditor";
import "./TicketDetails.css";

/* =========================================================
   NEW: Imports for split components (you will create these)
   ======================================================= */
// TODO: create these files next and export default components named below.
import DetailsAside from "./TicketDetails.Aside";
import AIHelper from "./TicketDetails.AI";


import TicketImage from "../../../../../assets/images/about1.jpg"

/* =========================================================
   Config — choose save model
   ======================================================= */
const USE_AUTOSAVE = false; // ← set true to auto-save detail edits

/* =========================================================
   Types (exported so the split files can reuse)
   ======================================================= */
export type TicketStatus = "open" | "pending" | "in_progress" | "on_hold" | "solved" | "closed";
export type TicketPriority = "urgent" | "high" | "normal" | "low";
export type SLAState = "ok" | "at_risk" | "breached";

export type EscalationEvent = {
  id: string;
  when: string;
  by: string;
  toTeam: string;
  level: 2 | 3;
  reason: string;
  priorityBump?: TicketPriority;
};

export type Attachment = { id: string; name: string; size: number; url?: string };

export type Message = {
  id: string;
  author: string;
  internal?: boolean;
  html: string;
  attachments?: Attachment[];
  createdAt: string;
};

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
  tags: string[];
  createdAt: string;
  updatedAt: string;
  sla: SLAState;
  watchers: string[];
  escalations: EscalationEvent[];
  messages: Message[];
  /** NEW: structured description captured at submission */
  descriptionHtml?: string;
  /** NEW: optional images/screenshots uploaded at submission */
  descriptionImages?: string[]; // URLs/base64; render first few
};

/* Only the fields editable on the right/inline subject */
export type EditableMeta = Pick<
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
   Main Page (now hosts the MAIN AREA only)
   ======================================================= */
export default function TicketDetail() {
  const { id } = useParams();

  // --- Seed mock ticket with description & an image ---
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
      descriptionHtml:
        "<p>After resetting my password, the portal shows <em>'invalid token'</em> and loops back to login.</p><ul><li>Browser: Chrome</li><li>OS: Windows 11</li></ul>",
      descriptionImages: [
        // placeholder image; replace with real URL/base64 from your uploader
        TicketImage,
      ],
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

  /* -------- NEW: AI helper visibility + resizable layout -------- */
  const [aiOpen, setAiOpen] = useState(false);

  // widths are percentages; we’ll wire CSS next
  const [mainPct, setMainPct] = useState(75);     // chat area
  const [asidePct, setAsidePct] = useState(25);   // details
  const [aiPct, setAiPct] = useState(32);         // AI helper when open

  // drag state
  const draggingRef = useRef<null | { type: "main-aside" | "main-ai"; startX: number; startMain: number; startAside: number; startAI: number }>(null);

  function onDragDown(e: React.MouseEvent, type: "main-aside" | "main-ai") {
    draggingRef.current = {
      type,
      startX: e.clientX,
      startMain: mainPct,
      startAside: asidePct,
      startAI: aiPct,
    };
    window.addEventListener("mousemove", onDragMove);
    window.addEventListener("mouseup", onDragUp);
  }
  function onDragMove(e: MouseEvent) {
    const st = draggingRef.current;
    if (!st) return;
    const dx = ((e.clientX - st.startX) / (window.innerWidth || 1)) * 100;
    if (st.type === "main-aside") {
      const newMain = Math.min(85, Math.max(20, st.startMain + dx));
      const newAside = Math.max(15, 100 - newMain - (aiOpen ? aiPct : 0));
      setMainPct(newMain);
      setAsidePct(newAside);
    } else {
      // main <-> ai splitter (when AI is open)
      const newMain = Math.min(85, Math.max(20, st.startMain + dx));
      const newAI = Math.max(18, 100 - newMain - asidePct);
      setMainPct(newMain);
      setAiPct(newAI);
    }
  }
  function onDragUp() {
    draggingRef.current = null;
    window.removeEventListener("mousemove", onDragMove);
    window.removeEventListener("mouseup", onDragUp);
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
          <button
            className={`btn ${aiOpen ? "btn-ghost" : "btn-secondary"}`}
            onClick={() => setAiOpen(v => !v)}
            title="Toggle AI helper"
            aria-pressed={aiOpen}
          >
            <FiZap /> AI
          </button>

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

      {/* Main split: MAIN (conversation) + optional AI + ASIDE (details) */}
      <div className={`td-main ${aiOpen ? "has-ai" : ""}`}>
        {/* MAIN: Issue header + thread + composer */}
        <section
          className="td-convo panel"
          style={{ flexBasis: `${mainPct}%` }}
        >
          {/* NEW: Issue header (description + optional images) */}
          <IssueHeader
            subject={meta.subject}
            descriptionHtml={ticket.descriptionHtml}
            images={ticket.descriptionImages}
            requester={ticket.requester}
            createdAt={ticket.createdAt}
          />

          {/* Timeline */}
          <Thread messages={ticket.messages} />

          {/* Composer */}
          <Composer
            replyHtml={replyHtml}
            setReplyHtml={setReplyHtml}
            files={files}
            setFiles={setFiles}
            onSendPublic={() => addReply(false)}
            onSendInternal={() => addReply(true)}
          />
        </section>

        {/* Splitter between MAIN and AI (only when AI open) */}
        {aiOpen && (
          <div
            className="td-splitter td-splitter--main-ai"
            onMouseDown={(e) => onDragDown(e, "main-ai")}
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize chat and AI panels"
          />
        )}

        {/* AI helper (collapsible/expandable) */}
        {aiOpen && (
          <section
            className="td-ai panel"
            style={{ flexBasis: `${aiPct}%` }}
          >
            {/* TODO: Implement this in ./TicketDetails.AI */}
            <AIHelper
              ticket={ticket}
              messages={ticket.messages}
              onInsertText={(html) => setReplyHtml((prev) => `${prev}${html}`)}
            />
          </section>
        )}

        {/* Splitter between (MAIN + optional AI) and ASIDE */}
        <div
          className="td-splitter td-splitter--main-aside"
          onMouseDown={(e) => onDragDown(e, "main-aside")}
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize chat/AI and details panels"
        />

        {/* RIGHT: Details (draft meta) */}
        <aside
          className="td-side panel"
          style={{ flexBasis: `${asidePct}%` }}
        >
          {/* TODO: Implement this in ./TicketDetails.Aside */}
          <DetailsAside
            ticket={ticket}
            meta={meta}
            statusOptions={statusOptions}
            priorityOptions={priorityOptions}
            teamOptions={teamOptions}
            categoryOptions={categoryOptions}
            onChange={(patch) => setMeta((m) => ({ ...m, ...patch }))}
          />
        </aside>
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
   NEW: Issue header (subject/description/images)
   ======================================================= */
function IssueHeader({
  subject,
  descriptionHtml,
  images,
  requester,
  createdAt,
}: {
  subject: string;
  descriptionHtml?: string;
  images?: string[];
  requester: string;
  createdAt: string;
}) {
  return (
    <div className="td-issue">
      <div className="td-issue__head">
        <h2 className="td-issue__title">{subject}</h2>
        <div className="td-issue__meta">
          <span className="muted">From</span> {requester}
          <span className="td-msg__dot">•</span>
          <span className="muted"><FiClock /> {timeAgo(createdAt)}</span>
        </div>
      </div>

      {descriptionHtml && (
        <div
          className="td-issue__desc"
          dangerouslySetInnerHTML={{ __html: descriptionHtml }}
        />
      )}

      {images && images.length > 0 && (
        <div className="td-issue__images">
          {images.slice(0, 3).map((src, i) => (
            <a key={i} className="td-issue__imgwrap" href={src} target="_blank" rel="noreferrer">
              <img src={src} alt={`Attachment ${i + 1}`} />
            </a>
          ))}
        </div>
      )}

      <div className="td-issue__divider" />
    </div>
  );
}

/* =========================================================
   Thread (messages)
   ======================================================= */
function Thread({ messages }: { messages: Message[] }) {
  const sorted = useMemo(
    () => [...messages].sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt)),
    [messages]
  );

  return (
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
                <a key={a.id} className="td-att" href={a.url || "#"} onClick={(e) => !a.url && e.preventDefault()}>
                  {a.name} <span className="muted">({(a.size / 1024).toFixed(0)} KB)</span>
                </a>
              ))}
            </div>
          ) : null}
        </article>
      ))}
    </div>
  );
}

/* =========================================================
   Composer (editor + files + send)
   ======================================================= */
function Composer({
  replyHtml,
  setReplyHtml,
  files,
  setFiles,
  onSendPublic,
  onSendInternal,
}: {
  replyHtml: string;
  setReplyHtml: (v: string) => void;
  files: File[];
  setFiles: (f: File[]) => void;
  onSendPublic: () => void;
  onSendInternal: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  return (
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
                  <button
                    className="chip__x"
                    onClick={() => setFiles(files.filter((_, idx) => idx !== i))}
                    aria-label={`Remove ${f.name}`}
                  >
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
  );
}

/* =========================================================
   Details aside: moved to separate file (imported above)
   - We pass data + callbacks; implement UI in TicketDetails.Aside.tsx
   ======================================================= */

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

/* =========================================================
   Utilities
   ======================================================= */
function slaLabel(s: SLAState) {
  switch (s) {
    case "ok": return "On track";
    case "at_risk": return "At risk";
    case "breached": return "Breached";
  }
}
