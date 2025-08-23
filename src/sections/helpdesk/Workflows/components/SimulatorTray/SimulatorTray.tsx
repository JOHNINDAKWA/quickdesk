import { useMemo, useState } from "react";
import { FiPlayCircle, FiShuffle, FiChevronDown, FiChevronUp } from "react-icons/fi";
import type { Stage, WorkflowDetail } from "../../data/types";
import "./SimulatorTray.css";

type Input = {
  channel: "email" | "chat" | "web" | "phone";
  priority: "low" | "normal" | "high" | "urgent";
  requester: "employee" | "customer";
  category?: string;
};

const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random()*arr.length)];

function evalExpr(expr: string | undefined, ctx: Record<string, string>): boolean {
  if (!expr) return true; // no condition => passes
  // VERY SIMPLE evaluator: supports:
  //   key = "value"     key == value
  //   key in ("a","b")  membership
  // Combine with && (AND). OR not supported in this toy.
  try {
    const andParts = expr.split(/&&/i).map(s => s.trim()).filter(Boolean);
    return andParts.every(p => {
      let m = p.match(/^(\w+)\s*=\s*["']?([\w\- ]+)["']?$/);
      if (m) {
        const [, k, v] = m;
        return (ctx[k] || "").toLowerCase() === v.toLowerCase();
      }
      m = p.match(/^(\w+)\s+in\s+\((.+)\)$/i);
      if (m) {
        const [, k, list] = m;
        const vs = list.split(",").map(s => s.replace(/["'\s]/g,"")).filter(Boolean);
        return vs.map(x=>x.toLowerCase()).includes((ctx[k]||"").toLowerCase());
      }
      // fallback: unsupported clause => false
      return false;
    });
  } catch { return false; }
}

function simulate(detail: WorkflowDetail, input: Input): { path: Stage[]; haltedReason?: string } {
  const stages = detail.stages;
  if (!stages.length) return { path: [] };
  const map = new Map<string, Stage>();
  stages.forEach(s => map.set(s.id, s));
  let cur = stages.find(s => s.type === "start") || stages[0];
  const ctx: Record<string,string> = {
    channel: input.channel, priority: input.priority, requester: input.requester, category: input.category || ""
  };
  const path: Stage[] = [];

  for (let i=0; i<stages.length+5; i++) {
    path.push(cur);
    if (cur.type === "end") return { path };
    if (!evalExpr(cur.entryCondition || undefined, ctx)) {
      return { path, haltedReason: `Entry condition on "${cur.name}" failed.` };
    }
    // choose first transition that passes (or first without condition)
    const nextT = cur.transitions.find(t => evalExpr(t.condition, ctx)) || cur.transitions[0];
    if (!nextT) return { path, haltedReason: `No outgoing transition from "${cur.name}".` };
    const nxt = map.get(nextT.to);
    if (!nxt) return { path, haltedReason: `Transition targets missing stage.` };
    cur = nxt;
  }
  return { path, haltedReason: "Simulation aborted (possible loop)." };
}

export default function SimulatorTray({
  workflow,
}: {
  workflow: WorkflowDetail;
}) {
  const [open, setOpen] = useState(false);
  const [inp, setInp] = useState<Input>({ channel: "email", priority: "normal", requester: "employee" });
  const result = useMemo(() => simulate(workflow, inp), [workflow, inp]);

  function randomize() {
    setInp({
      channel: pick(["email","chat","web","phone"]),
      priority: pick(["low","normal","high","urgent"]),
      requester: pick(["employee","customer"]),
      category: pick(["hardware","software","access","billing","other"]),
    });
  }

  return (
    <div className={`sim-root ${open ? "open" : ""}`}>
      <button className="sim-toggle" onClick={() => setOpen(v => !v)}>
        {open ? <FiChevronDown /> : <FiChevronUp />} Simulator
      </button>

      {open && (
        <div className="panel sim-body">
          <div className="sim-ctrls">
            <label className="field">
              <span>Channel</span>
              <select value={inp.channel} onChange={e => setInp({...inp, channel: e.target.value as any})}>
                <option value="email">Email</option>
                <option value="chat">Chat</option>
                <option value="web">Web</option>
                <option value="phone">Phone</option>
              </select>
            </label>
            <label className="field">
              <span>Priority</span>
              <select value={inp.priority} onChange={e => setInp({...inp, priority: e.target.value as any})}>
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </label>
            <label className="field">
              <span>Requester</span>
              <select value={inp.requester} onChange={e => setInp({...inp, requester: e.target.value as any})}>
                <option value="employee">Employee</option>
                <option value="customer">Customer</option>
              </select>
            </label>
            <label className="field">
              <span>Category</span>
              <input value={inp.category || ""} onChange={e => setInp({...inp, category: e.target.value})} placeholder="e.g. hardware" />
            </label>

            <div className="sim-buttons">
              <button className="btn" onClick={randomize}><FiShuffle /> Random</button>
              <button className="btn btn-primary"><FiPlayCircle /> Run</button>
            </div>
          </div>

          <div className="sim-path">
            {result.path.map((s, i) => (
              <div key={s.id} className="step">
                <span className={`pill pill-${s.type}`}>{s.name}</span>
                {i < result.path.length - 1 && <span className="arrow">→</span>}
              </div>
            ))}
            {result.haltedReason && <div className="halt">{result.haltedReason}</div>}
          </div>
        </div>
      )}
    </div>
  );
}
