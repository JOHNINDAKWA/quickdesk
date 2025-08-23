import { useEffect, useState } from "react";

/**
 * Tiny helper that builds a simple AND expression:
 * channel in ("email","chat") && priority = "high" && requester = "employee"
 */
export default function ConditionsEditor({
  value,
  onChange,
}: {
  value: string | null | undefined;
  onChange: (expr: string | null) => void;
}) {
  const [channels, setChannels] = useState<string[]>([]);
  const [priority, setPriority] = useState<string>("");
  const [requester, setRequester] = useState<string>("");

  // If there is an incoming raw value, we won't parse it; we let the user overwrite by interacting.
  useEffect(() => {
    if (!value) { setChannels([]); setPriority(""); setRequester(""); }
  }, [value]);

  function toggle(arr: string[], v: string) {
    return arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v];
  }

  function build() {
    const parts: string[] = [];
    if (channels.length) parts.push(`channel in (${channels.map(c => `"${c}"`).join(",")})`);
    if (priority) parts.push(`priority = "${priority}"`);
    if (requester) parts.push(`requester = "${requester}"`);
    const expr = parts.join(" && ");
    onChange(expr || null);
  }

  return (
    <div className="panel soft" style={{ display: "grid", gap: 10 }}>
      <div className="field">
        <span>Channels</span>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {["email","chat","web","phone"].map(c => (
            <button
              key={c}
              type="button"
              onClick={() => setChannels(a => toggle(a, c))}
              className={`btn ${channels.includes(c) ? "btn-primary" : ""}`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <span>Priority</span>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {["low","normal","high","urgent"].map(p => (
            <button key={p} type="button" onClick={() => setPriority(p)} className={`btn ${priority===p ? "btn-primary" : ""}`}>{p}</button>
          ))}
          <button type="button" className="btn" onClick={() => setPriority("")}>Clear</button>
        </div>
      </div>

      <label className="field">
        <span>Requester</span>
        <select value={requester} onChange={e => setRequester(e.target.value)}>
          <option value="">—</option>
          <option value="employee">Employee</option>
          <option value="customer">Customer</option>
        </select>
      </label>

      <div className="field">
        <span>Preview (raw)</span>
        <input readOnly value={value || ""} placeholder='Will appear after you click "Apply condition"' />
      </div>

      <div>
        <button className="btn btn-primary" type="button" onClick={build}>Apply condition</button>
        <button className="btn" type="button" onClick={() => onChange(null)} style={{ marginLeft: 8 }}>Clear</button>
      </div>
    </div>
  );
}
