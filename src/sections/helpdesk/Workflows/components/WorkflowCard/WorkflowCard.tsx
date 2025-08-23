// src/sections/helpdesk/Workflows/components/WorkflowCard/WorkflowCard.tsx
import { memo } from "react";
import { FiChevronRight, FiClock } from "react-icons/fi";
import type { WorkflowSummary, WorkflowType } from "../../data/types";
import "./WorkflowCard.css";

function timeAgo(iso: string) {
  const now = Date.now();
  const t = new Date(iso).getTime();
  const s = Math.max(0, Math.floor((now - t) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

const TYPE_LABEL: Record<WorkflowType, string> = {
  service_request: "Service Request",
  incident: "Incident",
  change: "Change",
  task: "Task",
};

export default memo(function WorkflowCard({
  wf,
  onOpen,
  className = "",
}: {
  wf: WorkflowSummary;
  onOpen: () => void;
  className?: string;
}) {
  const stagesText = `${wf.stagesCount} ${wf.stagesCount === 1 ? "stage" : "stages"}`;

  return (
    <button
      type="button"
      className={`wcard ${wf.status} ${className}`}
      data-status={wf.status}
      data-type={wf.type}
      onClick={onOpen}
      title={`Open “${wf.name}”`}
    >
      <div className="wcard__top">
        <span className={`badge badge-${wf.type}`}>{TYPE_LABEL[wf.type]}</span>
        <span className={`dot ${wf.status}`} aria-hidden="true" />
        <span className="status">{wf.status}</span>
        <span className="spacer" />
        <FiChevronRight aria-hidden="true" />
      </div>

      <div className="wcard__title" title={wf.name}>
        {wf.name}
      </div>

      <div className="wcard__meta">
        <span className="chip">{stagesText}</span>
        {wf.owner && <span className="chip">Owner: {wf.owner}</span>}
      </div>

      <div className="wcard__foot">
        <span className="muted">
          <FiClock aria-hidden="true" /> Updated {timeAgo(wf.updatedAt)}
        </span>
      </div>
    </button>
  );
});
