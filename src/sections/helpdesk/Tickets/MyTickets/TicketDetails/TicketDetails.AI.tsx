// ===============================
// File: TicketDetails.AI.tsx
// Description: Collapsible AI helper panel for summary & Q/A. Pure front-end scaffold.
// ===============================
import { useMemo, useState } from "react";
import { FiZap, FiSend, FiCopy, FiChevronDown } from "react-icons/fi";
import CustomQuillEditor from "../../../../../components/CustomQuillEditor/CustomQuillEditor";
import type { Ticket, Message } from "./TicketDetail";

export default function AIHelper({
  ticket,
  messages,
  onInsertText,
}: {
  ticket: Ticket;
  messages: Message[];
  onInsertText: (html: string) => void;
}) {
  const [prompt, setPrompt] = useState("");
  const [answerHtml, setAnswerHtml] = useState("<p class='muted'>Ask something about this ticket or click <b>Summarize</b>.</p>");
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<"qa" | "summarize">("qa");

  const plainThread = useMemo(() =>
    messages
      .map((m) => `${m.author}: ${stripHtml(m.html)}`)
      .join("\n")
  , [messages]);

  function stripHtml(html: string) {
    const div = document.createElement("div");
    div.innerHTML = html;
    return (div.textContent || div.innerText || "").trim();
  }

  // --- Fake client-side summary. Replace later with backend call.
  async function summarize() {
    setMode("summarize");
    setBusy(true);
    try {
      // naive extract
      const firstUserMsg = messages.find((m) => !m.internal);
      const summary = `
        <h4>AI Summary</h4>
        <ul>
          <li><b>Subject:</b> ${escapeHtml(ticket.subject)}</li>
          <li><b>Requester:</b> ${escapeHtml(ticket.requester)}</li>
          <li><b>Status:</b> ${escapeHtml(ticket.status)}</li>
          <li><b>Priority:</b> ${escapeHtml(ticket.priority)}</li>
        </ul>
        ${ticket.descriptionHtml ? `<div class='muted'>Description: ${ticket.descriptionHtml}</div>` : ""}
        ${firstUserMsg ? `<p><b>Latest customer message:</b> ${stripHtml(firstUserMsg.html)}</p>` : ""}
      `;
      setAnswerHtml(summary);
    } finally {
      setBusy(false);
    }
  }

  // --- Fake client-side Q/A. Replace later with backend call.
  async function ask() {
    if (!prompt.trim()) return;
    setMode("qa");
    setBusy(true);
    try {
      // rudimentary heuristic
      const echo = prompt.toLowerCase().includes("error")
        ? "It looks like the user encounters an authentication error after reset. Verify token validity, time skew, and ensure the reset link hasn't expired."
        : "Based on current details, check recent login attempts, audit logs, and confirm user email ownership. You can also force a password reset and invalidate sessions.";

      const html = `
        <h4>AI Answer</h4>
        <p>${escapeHtml(echo)}</p>
        <details>
          <summary><span class='inline-flex items-center gap-1'>Context <FiChevronDown /></span></summary>
          <pre class='muted' style='white-space:pre-wrap'>${escapeHtml(plainThread).slice(0, 4000)}</pre>
        </details>
      `;
      setAnswerHtml(html);
      setPrompt("");
    } finally {
      setBusy(false);
    }
  }

  function escapeHtml(s: string) {
    return s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  return (
    <div className="ai-pane">
      <div className="ai-pane__head">
        <h3 className="ai-title"><FiZap /> AI Helper</h3>
      </div>

      <div className="ai-pane__controls">
        <button className="btn btn-secondary" onClick={summarize} disabled={busy} title="Summarize ticket">
          Summarize
        </button>
      </div>

      <div className="ai-pane__qa">
        <div className="ai-input">
          <textarea
            className="textarea"
            rows={3}
            placeholder="Ask the AI about this ticket…"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) ask(); }}
          />
          <div className="ai-actions">
            <button className="btn btn-primary" onClick={ask} disabled={busy || !prompt.trim()}>
              <FiSend /> Ask
            </button>
          </div>
        </div>
      </div>

      <div className="ai-pane__result">
        <div className="ai-result__body" dangerouslySetInnerHTML={{ __html: answerHtml }} />
        <div className="ai-result__actions">
          <button
            className="btn btn-ghost"
            onClick={() => onInsertText(answerHtml)}
            title="Insert answer into reply editor"
          >
            <FiCopy /> Insert to reply
          </button>
        </div>
      </div>
    </div>
  );
}

