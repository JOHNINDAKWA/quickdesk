// src/sections/helpdesk/Workflows/components/StageNode/StageNode.tsx
import { FiPlay, FiFlag, FiCheckCircle, FiShield } from "react-icons/fi";
import type { Stage } from "../../data/types";
import "./StageNode.css";

export default function StageNode({
  stage,
  index,
  selected,
  onClick,
}: {
  stage: Stage;
  index: number;
  selected: boolean;
  onClick: () => void;
}) {
  const ic =
    stage.type === "start" ? <FiPlay /> :
    stage.type === "end" ? <FiCheckCircle /> :
    stage.type === "approval" ? <FiShield /> : <FiFlag />;

  // ✅ guard against missing arrays
  const transitions = Array.isArray(stage.transitions) ? stage.transitions : [];
  const tcount = transitions.length;

  return (
    <button className={`sn-root ${selected ? "is-selected" : ""}`} onClick={onClick}>
      <div className={`sn-ic sn-${stage.type}`}>{ic}</div>
      <div className="sn-body">
        <div className="sn-title">{stage.name}</div>
        <div className="sn-sub">
          <span>{stage.type}</span>
          {stage.role && (<><span className="dot">•</span><span>Role: {stage.role}</span></>)}
          {typeof stage.slaHours === "number" && (<><span className="dot">•</span><span>SLA: {stage.slaHours}h</span></>)}
          <span className="dot">•</span>
          <span>{tcount} transition{tcount === 1 ? "" : "s"}</span>
        </div>
      </div>
    </button>
  );
}
