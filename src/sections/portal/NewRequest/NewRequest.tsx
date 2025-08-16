import { useMemo, useState } from "react";
import Select from "react-select";
import CustomQuillEditor from "../../../components/CustomQuillEditor/CustomQuillEditor"
import "./NewRequest.css";
type Option = { value: string; label: string };

const categoryOptions: Option[] = [
  { value: "account", label: "Account & Access" },
  { value: "billing", label: "Billing & Plans" },
  { value: "technical", label: "Technical Issue" },
  { value: "integration", label: "Integrations" },
  { value: "data", label: "Data & Privacy" },
  { value: "other", label: "Other" },
];

const priorityOptions: Option[] = [
  { value: "low", label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

export default function NewRequest() {
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState<Option | null>(null);
  const [priority, setPriority] = useState<Option>(priorityOptions[1]);
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [emailCopy, setEmailCopy] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const canSubmit =
    subject.trim().length > 3 &&
    category &&
    description.replace(/<[^>]+>/g, "").trim().length > 6;

  const summary = useMemo(
    () => ({
      subject: subject || "(no subject)",
      category: category?.label || "Uncategorized",
      priority: priority?.label || "Normal",
      attachments: files.length,
      preview: description.replace(/<[^>]+>/g, "").slice(0, 160),
    }),
    [subject, category, priority, files, description]
  );

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return;
    setFiles(Array.from(e.target.files));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    // Simulate POST (wire to backend later)
    await new Promise((r) => setTimeout(r, 800));
    setSubmitting(false);
    setSuccess(true);
    // reset
    setSubject("");
    setCategory(null);
    setPriority(priorityOptions[1]);
    setDescription("");
    setFiles([]);
  }

  return (
    <div className="pt-new">
      <header className="pt-new__head">
        <h2>Submit a new request</h2>
        <p className="text-muted">
          Give us a clear subject and details. Attach screenshots if helpful.
        </p>
      </header>

      <form className="pt-ticket" onSubmit={onSubmit}>
        {/* Form column */}
        <div className="pt-ticket__form">
          <label className="pt-field">
            <span className="pt-label">Subject</span>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Brief summary (e.g., 'Password reset not working')"
              required
            />
          </label>

          <div className="pt-grid-2">
            <label className="pt-field">
              <span className="pt-label">Category</span>
              <Select
                classNamePrefix="ptselect"
                options={categoryOptions}
                value={category}
                onChange={(v) => setCategory(v)}
                placeholder="Choose a category"
              />
            </label>

            <label className="pt-field">
              <span className="pt-label">Priority</span>
              <Select
                classNamePrefix="ptselect"
                options={priorityOptions}
                value={priority}
                onChange={(v) => setPriority(v as Option)}
              />
            </label>
          </div>

          <label className="pt-field">
            <span className="pt-label">Description</span>
            <CustomQuillEditor value={description} onChange={setDescription} />
          </label>

          <div className="pt-grid-2">
            <label className="pt-field">
              <span className="pt-label">Attachments</span>
              <input type="file" onChange={onFileChange} multiple />
              {files.length > 0 && (
                <div className="pt-files">
                  {files.map((f) => (
                    <span key={f.name} className="pt-file">
                      {f.name}
                    </span>
                  ))}
                </div>
              )}
            </label>

            <label className="pt-check">
              <input
                type="checkbox"
                checked={emailCopy}
                onChange={(e) => setEmailCopy(e.target.checked)}
              />
              <span>Email me updates about this request</span>
            </label>
          </div>

          <div className="pt-actions">
            <button
              className="pt-btn"
              type="button"
              onClick={() => window.history.back()}
            >
              Cancel
            </button>
            <button
              className="pt-btn pt-btn--primary"
              disabled={!canSubmit || submitting}
            >
              {submitting ? "Submitting…" : "Submit Request"}
            </button>
          </div>

          {success && (
            <div className="pt-toast">
              Your request was submitted! We’ve sent you a confirmation email.
            </div>
          )}
        </div>

        {/* Preview / summary aside */}
        <aside className="pt-ticket__aside">
          <div className="pt-summary panel">
            <h4>Preview</h4>
            <div className="pt-summary__row">
              <span>Subject</span>
              <strong>{summary.subject}</strong>
            </div>
            <div className="pt-summary__row">
              <span>Category</span>
              <strong>{summary.category}</strong>
            </div>
            <div className="pt-summary__row">
              <span>Priority</span>
              <strong>{summary.priority}</strong>
            </div>
            <div className="pt-summary__row">
              <span>Attachments</span>
              <strong>{summary.attachments}</strong>
            </div>
            {summary.preview && (
              <div className="pt-summary__desc">
                <span>Snippet</span>
                <p>{summary.preview}…</p>
              </div>
            )}
          </div>

          <div className="pt-help panel">
            <h4>Tips</h4>
            <ul>
              <li>Include steps to reproduce.</li>
              <li>Attach screenshots of errors.</li>
              <li>Tell us what you expected to happen.</li>
            </ul>
          </div>
        </aside>
      </form>
    </div>
  );
}
