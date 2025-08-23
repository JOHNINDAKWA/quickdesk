import { useMemo, useState } from "react";
import { FiX, FiSliders, FiGitBranch, FiBell, FiClock, FiSend, FiFilter } from "react-icons/fi";
import type { Stage } from "../../data/types";
import StageBasicsForm from "../forms/StageBasicsForm";
import StageAssignmentForm from "../forms/StageAssignmentForm";
import TransitionsEditor from "../forms/TransitionsEditor";
import ConditionsEditor from "../forms/ConditionsEditor";
import "./StageInspectorDrawer.css";

type TabKey = "basics" | "assignment" | "transitions" | "sla" | "notifications" | "conditions";

export default function StageInspectorDrawer({
  stage,
  allStages,
  onChange,
}: {
  stage: Stage | null;
  allStages: Stage[];
  onChange: (patch: Partial<Stage>) => void;
}) {
  const [tab, setTab] = useState<TabKey>("basics");
  const canTarget = useMemo(() => allStages.map(s => ({ id: s.id, name: s.name })), [allStages]);

  return (
    <aside className={`sid-root panel ${stage ? "open" : ""}`} aria-hidden={!stage}>
      <div className="sid-head">
        <div className="l">
          <FiSliders /> <span>Stage Inspector</span>
        </div>
        <button className="iconbtn" aria-label="Close"><FiX /></button>
      </div>

      {!stage ? (
        <div className="sid-empty">Select a stage on the left to edit.</div>
      ) : (
        <>
          <div className="sid-tabs">
            <button className={`tab ${tab==="basics"?"active":""}`} onClick={() => setTab("basics")}><FiSliders /> Basics</button>
            <button className={`tab ${tab==="assignment"?"active":""}`} onClick={() => setTab("assignment")}><FiSend /> Assignment</button>
            <button className={`tab ${tab==="transitions"?"active":""}`} onClick={() => setTab("transitions")}><FiGitBranch /> Transitions</button>
            <button className={`tab ${tab==="conditions"?"active":""}`} onClick={() => setTab("conditions")}><FiFilter /> Conditions</button>
            <button className={`tab ${tab==="sla"?"active":""}`} onClick={() => setTab("sla")}><FiClock /> SLA</button>
            <button className={`tab ${tab==="notifications"?"active":""}`} onClick={() => setTab("notifications")}><FiBell /> Notify</button>
          </div>

          <div className="sid-body">
            {tab === "basics" && <StageBasicsForm value={stage} onChange={onChange} />}
            {tab === "assignment" && <StageAssignmentForm value={stage} onChange={onChange} />}
            {tab === "transitions" && <TransitionsEditor stage={stage} candidates={canTarget} onChange={onChange} />}
            {tab === "conditions" && (
              <ConditionsEditor
                value={stage.entryCondition || null}
                onChange={(expr) => onChange({ entryCondition: expr })}
              />
            )}
            {tab === "sla" && (
              <div className="panel soft">
                <label className="field">
                  <span>SLA time limit (hours)</span>
                  <input
                    type="number"
                    min={0}
                    value={stage.slaHours ?? ""}
                    onChange={e => onChange({ slaHours: e.target.value === "" ? null : Number(e.target.value) })}
                    placeholder="e.g. 24"
                  />
                </label>
                <label className="field">
                  <span>Escalate after (hours)</span>
                  <input
                    type="number"
                    min={0}
                    value={stage.escalation?.afterHours ?? ""}
                    onChange={e => onChange({ escalation: { ...(stage.escalation || { afterHours: 0 }), afterHours: Number(e.target.value || 0) } })}
                    placeholder="e.g. 8"
                  />
                </label>
              </div>
            )}
            {tab === "notifications" && (
              <div className="panel soft">
                <label className="field">
                  <span>Notify on enter (comma emails or channels)</span>
                  <input
                    value={(stage.notifications?.onEnter || []).join(", ")}
                    onChange={e => onChange({ notifications: { ...(stage.notifications || {}), onEnter: e.target.value.split(",").map(s => s.trim()).filter(Boolean) } })}
                  />
                </label>
                <label className="field">
                  <span>Notify on exit</span>
                  <input
                    value={(stage.notifications?.onExit || []).join(", ")}
                    onChange={e => onChange({ notifications: { ...(stage.notifications || {}), onExit: e.target.value.split(",").map(s => s.trim()).filter(Boolean) } })}
                  />
                </label>
              </div>
            )}
          </div>
        </>
      )}
    </aside>
  );
}
