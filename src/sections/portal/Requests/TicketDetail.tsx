import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  FiArrowLeft, FiLock, FiSend, FiPaperclip, FiDownload,
  FiUser, FiCalendar, FiTag
} from "react-icons/fi";
import CustomQuillEditor from "../../../components/CustomQuillEditor/CustomQuillEditor";
import "./TicketDetail.css";

type Status = "open" | "pending" | "in_progress" | "solved" | "closed";
type Priority = "low" | "normal" | "high" | "urgent";

type Ticket = {
  id: string;
  ref: string;
  subject: string;
  category: string;
  status: Status;
  priority: Priority;
  createdAt: string;
  updatedAt: string;
  requester: { name: string; email: string; avatar?: string };
  assignee?: { name: string; email: string; avatar?: string };
  watchers?: { name: string; email: string }[];
  tags?: string[];
  attachments?: { id: string; name: string; size: string }[];
  descriptionHtml: string; // initial body (first message)
};

type Message = {
  id: string;
  author: { name: string; email: string; role: "requester" | "agent"; avatar?: string };
  createdAt: string;
  html: string;
  attachments?: { id: string; name: string; size: string }[];
};

const mockTickets: Ticket[] = [
  {
    id: "t1",
    ref: "QD-2025-0101",
    subject: "Can’t reset my password",
    category: "Account & Access",
    status: "open",
    priority: "normal",
    createdAt: "2025-08-05T09:12:00Z",
    updatedAt: "2025-08-16T06:30:00Z",
    requester: { name: "John Doe", email: "john@acme.co.ke" },
    assignee:  { name: "Mary N.", email: "mary@support.quickdesk.io" },
    watchers:  [{ name: "IT Lead", email: "lead@acme.co.ke" }],
    tags: ["password", "login"],
    attachments: [{ id: "a1", name: "screenshot.png", size: "312 KB" }],
    descriptionHtml:
      "<p>Hi team, I’m unable to reset my password via the portal. It says token invalid.</p><p>Steps tried: reset link twice, cleared cache.</p>",
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
    requester: { name: "Jane K.", email: "jane@zentrix.eu" },
    assignee:  { name: "Brian O.", email: "brian@support.quickdesk.io" },
    tags: ["webhook", "api"],
    descriptionHtml:
      "<p>Our webhook to /events intermittently returns 500. Happened 4 times in the last hour.</p>",
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
    requester: { name: "Accounts", email: "accounts@ushindi.co.ke" },
    descriptionHtml: "<p>Please share invoice for March.</p>",
  },
];

const mockConversations: Record<string, Message[]> = {
  t1: [
    {
      id: "m1",
      author: { name: "John Doe", email: "john@acme.co.ke", role: "requester" },
      createdAt: "2025-08-05T09:12:00Z",
      html: "<p>Hi team, I’m unable to reset my password. Token invalid.</p>",
      attachments: [{ id: "a1", name: "screenshot.png", size: "312 KB" }],
    },
    {
      id: "m2",
      author: { name: "Mary N.", email: "mary@support.quickdesk.io", role: "agent" },
      createdAt: "2025-08-05T09:25:00Z",
      html: "<p>Thanks for reporting! I’ve issued a fresh token. Could you try again?</p>",
    },
  ],
  t2: [
    {
      id: "m3",
      author: { name: "Accounts", email: "accounts@ushindi.co.ke", role: "requester" },
      createdAt: "2025-08-01T12:10:00Z",
      html: "<p>Please share invoice for March.</p>",
    },
    {
      id: "m4",
      author: { name: "Billing Bot", email: "noreply@quickdesk.io", role: "agent" },
      createdAt: "2025-08-01T12:10:10Z",
      html: "<p>Invoice sent to your email. Marking as solved.</p>",
    },
  ],
  t3: [
    {
      id: "m5",
      author: { name: "Jane K.", email: "jane@zentrix.eu", role: "requester" },
      createdAt: "2025-08-12T08:00:00Z",
      html: "<p>Webhook failing intermittently with 500s.</p>",
    },
  ],
};

export default function TicketDetail() {
  const { id } = useParams(); // expects route /:org/portal/requests/:id
  const ticket = useMemo(() => mockTickets.find((t) => t.id === id), [id]);
  const [messages, setMessages] = useState<Message[]>(
    () => (id && mockConversations[id]) || []
  );

  const [replyHtml, setReplyHtml] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  if (!ticket) {
    return (
      <div className="pt-tv-notfound panel">
        <h3>Ticket not found</h3>
        <p className="text-muted">It may have been deleted or the URL is incorrect.</p>
        <Link to="../requests" className="btn">Back to My Requests</Link>
      </div>
    );
  }

  if (!ticket) {
  return ("not found");
}
const t = ticket; 

  const isLocked = ticket.status === "solved" || ticket.status === "closed";

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return;
    setFiles(Array.from(e.target.files));
  }

  async function onSubmitReply(e: React.FormEvent) {
    e.preventDefault();
    if (isLocked) return;
    if (!replyHtml.replace(/<[^>]+>/g, "").trim()) return;

    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 600));
    const newMsg: Message = {
      id: Math.random().toString(36).slice(2),
      author: { name: t.requester.name, email: t.requester.email, role: "requester" },
      createdAt: new Date().toISOString(),
      html: replyHtml,
      attachments: files.map((f, i) => ({ id: `u${i}`, name: f.name, size: humanSize(f.size) })),
    };
    setMessages((m) => [...m, newMsg]);
    setReplyHtml("");
    setFiles([]);
    setSubmitting(false);
    // In a real app: POST to backend, refresh status, etc.
  }

  return (
    <div className="pt-tv">
      {/* ======= HEADER ======= */}
      <section className="panel pt-tv-hero">
        <div className="pt-tv-left">
          <div className="pt-tv-toprow">
            <Link to="../requests" className="btn btn-ghost">
              <FiArrowLeft /> Back to requests
            </Link>
            {isLocked && (
              <span className="pt-tv-lock">
                <FiLock /> Read only — ticket is {ticket.status}
              </span>
            )}
          </div>

          <h1 className="pt-tv-title">{ticket.subject}</h1>

          <div className="pt-tv-meta">
            <span className={`pt-status pt-status--${ticket.status}`}>{humanStatus(ticket.status)}</span>
            <span className={`pt-prio pt-prio--${ticket.priority}`}>{ticket.priority}</span>
            <span className="pt-tv-ref">Ref: {ticket.ref}</span>
          </div>
        </div>

        <aside className="pt-tv-right">
          <div className="pt-tv-mini">
            <span><FiCalendar /> Created</span>
            <strong>{new Date(ticket.createdAt).toLocaleString()}</strong>
          </div>
          <div className="pt-tv-mini">
            <span><FiCalendar /> Updated</span>
            <strong>{new Date(ticket.updatedAt).toLocaleString()}</strong>
          </div>
        </aside>
      </section>

      {/* ======= BODY LAYOUT ======= */}
      <div className="pt-tv-wrap">
        {/* Conversation column */}
        <section className="panel pt-tv-convo">
          {/* Initial description as the first post */}
          <MessageBubble
            author={{ name: ticket.requester.name, email: ticket.requester.email, role: "requester" }}
            createdAt={ticket.createdAt}
            html={ticket.descriptionHtml}
            attachments={ticket.attachments}
          />

          {messages.map((m) => (
            <MessageBubble
              key={m.id}
              author={m.author}
              createdAt={m.createdAt}
              html={m.html}
              attachments={m.attachments}
            />
          ))}

          {/* Composer */}
          <form className="pt-tv-composer" onSubmit={onSubmitReply}>
            <div className="pt-tv-composer__head">
              <div className="pt-tv-composer__title">Reply</div>
              {isLocked && (
                <div className="pt-tv-locked">
                  <FiLock /> This ticket is {ticket.status}. You can’t add new replies.
                </div>
              )}
            </div>

            <div className={`pt-tv-editor ${isLocked ? "is-disabled" : ""}`}>
              <CustomQuillEditor onChange={setReplyHtml} />
            </div>

            <div className="pt-tv-composer__foot">
              <label className="pt-tv-upload">
                <FiPaperclip />
                <span>Attach files</span>
                <input type="file" onChange={onFileChange} multiple disabled={isLocked} />
              </label>

              {files.length > 0 && (
                <div className="pt-tv-files">
                  {files.map((f) => (
                    <span key={f.name} className="pt-tv-file">{f.name}</span>
                  ))}
                </div>
              )}

              <div className="pt-spacer" />
              <button className="btn btn-primary" disabled={isLocked || submitting}>
                {submitting ? "Sending…" : (<><FiSend /> Send reply</>)}
              </button>
            </div>
          </form>
        </section>

        {/* Aside meta column */}
        <aside className="pt-tv-aside">
          <div className="panel pt-tv-card">
            <h4>Details</h4>
            <div className="pt-tv-grid">
              <div className="pt-tv-k">Status</div>
              <div className="pt-tv-v"><span className={`pt-status pt-status--${ticket.status}`}>{humanStatus(ticket.status)}</span></div>

              <div className="pt-tv-k">Priority</div>
              <div className="pt-tv-v"><span className={`pt-prio pt-prio--${ticket.priority}`}>{ticket.priority}</span></div>

              <div className="pt-tv-k">Category</div>
              <div className="pt-tv-v">{ticket.category}</div>
            </div>
          </div>

          <div className="panel pt-tv-card">
            <h4>People</h4>
            <div className="pt-tv-person">
              <div className="pt-tv-avatar">{initials(ticket.requester.name)}</div>
              <div>
                <div className="pt-tv-person__name"><FiUser /> {ticket.requester.name}</div>
                <div className="pt-tv-person__email">{ticket.requester.email}</div>
                <div className="pt-tv-person__role">Requester</div>
              </div>
            </div>

            {ticket.assignee && (
              <div className="pt-tv-person">
                <div className="pt-tv-avatar is-agent">{initials(ticket.assignee.name)}</div>
                <div>
                  <div className="pt-tv-person__name"><FiUser /> {ticket.assignee.name}</div>
                  <div className="pt-tv-person__email">{ticket.assignee.email}</div>
                  <div className="pt-tv-person__role">Assigned Agent</div>
                </div>
              </div>
            )}
          </div>

          {ticket.tags && ticket.tags.length > 0 && (
            <div className="panel pt-tv-card">
              <h4>Tags</h4>
              <div className="pt-tv-tags">
                {ticket.tags.map((t) => (
                  <span key={t} className="pt-tv-tag"><FiTag /> {t}</span>
                ))}
              </div>
            </div>
          )}

          {ticket.attachments && ticket.attachments.length > 0 && (
            <div className="panel pt-tv-card">
              <h4>Attachments</h4>
              <div className="pt-tv-attachlist">
                {ticket.attachments.map(a => (
                  <a key={a.id} href="#" className="pt-tv-attach">
                    <FiDownload /> {a.name} <span className="text-muted">({a.size})</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

/* ---------- Subcomponents ---------- */

function MessageBubble(props: {
  author: { name: string; email: string; role: "requester" | "agent"; avatar?: string };
  createdAt: string;
  html: string;
  attachments?: { id: string; name: string; size: string }[];
}) {
  const { author, createdAt, html, attachments } = props;
  const mine = author.role === "requester"; // from client perspective
  return (
    <article className={`pt-tv-msg ${mine ? "is-mine" : "is-agent"}`}>
      <div className="pt-tv-msg__avatar">{initials(author.name)}</div>
      <div className="pt-tv-msg__body">
        <header className="pt-tv-msg__meta">
          <strong className="pt-tv-msg__author">{author.name}</strong>
          <span className="pt-tv-msg__role">{mine ? "You" : "Agent"}</span>
          <time className="pt-tv-msg__time">{new Date(createdAt).toLocaleString()}</time>
        </header>
        <div className="pt-tv-msg__bubble" dangerouslySetInnerHTML={{ __html: html }} />
        {attachments && attachments.length > 0 && (
          <div className="pt-tv-msg__atts">
            {attachments.map((a) => (
              <a key={a.id} href="#" className="pt-tv-attach">
                <FiDownload /> {a.name} <span className="text-muted">({a.size})</span>
              </a>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

/* ---------- helpers ---------- */

function initials(name: string) {
  const [a = "", b = ""] = name.trim().split(/\s+/, 2);
  return (a[0] || "").toUpperCase() + (b[0] || "").toUpperCase();
}

function humanStatus(s: Status) {
  switch (s) {
    case "open": return "Open";
    case "pending": return "Pending";
    case "in_progress": return "In Progress";
    case "solved": return "Solved";
    case "closed": return "Closed";
  }
}

function humanSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
