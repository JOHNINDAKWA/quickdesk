// src/sections/helpdesk/Workflows/components/VersionBar/VersionBar.tsx
import { useEffect, useState } from "react";
import { FiGitBranch, FiCopy, FiUploadCloud, FiArchive, FiRotateCcw } from "react-icons/fi";
import { IoIosGitCompare } from "react-icons/io";
import { listVersions, publishWorkflow, duplicateWorkflow, setWorkflowStatus } from "../../data/api";
import type { VersionSummary, WorkflowStatus } from "../../data/types";
import "./VersionBar.css";

export default function VersionBar({
  workflowId,
  status,
  onVersionsChanged,
  onOpenDiff,
}: {
  workflowId: string;
  status: WorkflowStatus;
  onVersionsChanged?: (v: VersionSummary[]) => void;
  onOpenDiff: (versions: VersionSummary[]) => void;
}) {
  const [versions, setVersions] = useState<VersionSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const rows = await listVersions(workflowId);
      if (!alive) return;
      setVersions(rows);
      setLoading(false);
      onVersionsChanged?.(rows);
    })();
    return () => { alive = false; };
  }, [workflowId]);

  async function publish() {
    const rows = await publishWorkflow(workflowId);
    setVersions(rows);
    onVersionsChanged?.(rows);
  }
  async function duplicate() {
    await duplicateWorkflow(workflowId);
    alert("Duplicated. See it in the catalog.");
  }
  async function archiveToggle() {
    const next = status === "archived" ? "active" : "archived";
    await setWorkflowStatus(workflowId, next);
    alert(next === "archived" ? "Archived" : "Restored");
  }

  return (
    <div className="vb">
      <div className="vb-left">
        <FiGitBranch />
        <span className="vb-title">Versions</span>
        {loading ? <span className="muted">Loading…</span> :
          versions.length ? <span className="muted">{versions.length} total</span> :
          <span className="muted">No versions yet</span>}s
      </div>

      <div className="vb-right">
        <button className="btn" onClick={() => onOpenDiff(versions)} title="Compare versions"><IoIosGitCompare /> Diff</button>
        <button className="btn" onClick={duplicate} title="Duplicate workflow"><FiCopy /> Duplicate</button>
        <button className="btn btn-secondary" onClick={publish} title="Publish current draft"><FiUploadCloud /> Publish</button>
        <button className="btn" onClick={archiveToggle} title={status === "archived" ? "Restore" : "Archive"}>
          {status === "archived" ? <FiRotateCcw /> : <FiArchive />} {status === "archived" ? "Restore" : "Archive"}
        </button>
      </div>
    </div>
  );
}
