import { useMemo } from "react";
import { FiCheckCircle, FiAlertTriangle, FiXCircle, FiExternalLink } from "react-icons/fi";
import type { Stage } from "../../data/types";
import "./ValidatePanel.css";

export type Issue = {
  id: string;
  level: "error" | "warn" | "info";
  text: string;
  stageId?: string;
};

function reachable(stages: Stage[], fromId: string) {
  const map = new Map<string, Stage>();
  stages.forEach(s => map.set(s.id, s));
  const seen = new Set<string>();
  const stack = [fromId];
  while (stack.length) {
    const cur = stack.pop()!;
    if (seen.has(cur)) continue;
    seen.add(cur);
    const s = map.get(cur);
    if (!s) continue;
    s.transitions.forEach(t => stack.push(t.to));
  }
  return seen;
}

export default function ValidatePanel({
  stages,
  onJump,
}: {
  stages: Stage[];
  onJump?: (stageId: string) => void;
}) {
  const issues = useMemo<Issue[]>(() => {
    const out: Issue[] = [];
    if (!stages.length) {
      out.push({ id: "no-stages", level: "error", text: "No stages in this workflow." });
      return out;
    }

    const first = stages[0];
    const last  = stages[stages.length - 1];
    const starts = stages.filter(s => s.type === "start");
    const ends   = stages.filter(s => s.type === "end");

    if (starts.length !== 1) out.push({ id: "start-count", level: "error", text: `There must be exactly one Start stage (found ${starts.length}).`, stageId: starts[0]?.id });
    if (ends.length !== 1) out.push({ id: "end-count", level: "error", text: `There must be exactly one End stage (found ${ends.length}).`, stageId: ends[0]?.id });
    if (first.type !== "start") out.push({ id: "start-pos", level: "error", text: "Start stage should be the first item.", stageId: first.id });
    if (last.type !== "end") out.push({ id: "end-pos", level: "error", text: "End stage should be the last item.", stageId: last.id });

    // References, empties, duplicates
    const names = new Map<string, number>();
    const ids = new Set(stages.map(s => s.id));
    for (const s of stages) {
      if (!s.name.trim()) out.push({ id: `empty-${s.id}`, level: "error", text: "Stage name is required.", stageId: s.id });
      names.set(s.name, (names.get(s.name) || 0) + 1);
      for (const t of s.transitions) {
        if (!ids.has(t.to)) {
          out.push({ id: `ref-${s.id}-${t.id}`, level: "error", text: `Transition "${t.name}" points to a missing stage.`, stageId: s.id });
        }
      }
      if (s.type !== "end" && s.transitions.length === 0) {
        out.push({ id: `deadend-${s.id}`, level: "warn", text: "No outgoing transitions (potential dead-end).", stageId: s.id });
      }
      if ((s.type === "stage" || s.type === "approval") && (s.slaHours == null)) {
        out.push({ id: `sla-${s.id}`, level: "info", text: "No SLA set for this stage (optional but recommended).", stageId: s.id });
      }
    }
    for (const [nm, count] of names) {
      if (count > 1) out.push({ id: `dup-${nm}`, level: "warn", text: `Duplicate stage name "${nm}". Rename to avoid confusion.` });
    }

    // Reachability: Start → End (best-effort)
    const startId = starts[0]?.id || first.id;
    const reach = reachable(stages, startId);
    const endId = ends[0]?.id || last.id;
    if (!reach.has(endId)) {
      out.push({ id: "no-path", level: "warn", text: "End is not reachable from Start. Check transitions." });
    }

    return out;
  }, [stages]);

  const counts = useMemo(() => ({
    error: issues.filter(i => i.level === "error").length,
    warn: issues.filter(i => i.level === "warn").length,
    info: issues.filter(i => i.level === "info").length,
  }), [issues]);

  return (
    <div className="vp-root panel">
      <div className="vp-head">
        <div className="l">
          <span className="tit">Validation</span>
          <span className={`badge ${counts.error ? "bad" : counts.warn ? "warn" : "ok"}`}>
            {counts.error ? `${counts.error} errors` : counts.warn ? `${counts.warn} warnings` : "No errors"}
          </span>
        </div>
        <div className="r">
          {counts.info > 0 && <span className="muted">{counts.info} tips</span>}
        </div>
      </div>

      {issues.length === 0 ? (
        <div className="vp-empty"><FiCheckCircle /> Looks good!</div>
      ) : (
        <ul className="vp-list">
          {issues.map(it => (
            <li key={it.id} className={`row ${it.level}`}>
              <span className="ic">
                {it.level === "error" ? <FiXCircle/> : it.level === "warn" ? <FiAlertTriangle/> : <FiCheckCircle/>}
              </span>
              <span className="tx">{it.text}</span>
              {it.stageId && onJump && (
                <button className="link" onClick={() => onJump(it.stageId)} title="Jump to stage">
                  <FiExternalLink /> Go
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
