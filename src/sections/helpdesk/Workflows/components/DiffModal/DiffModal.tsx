// src/sections/helpdesk/Workflows/components/DiffModal/DiffModal.tsx
import { useEffect, useState } from "react";
import { FiX, FiPlusCircle, FiMinusCircle, FiEdit3, FiShuffle } from "react-icons/fi";
import type { VersionSummary, WorkflowDiff } from "../../data/types";
import { diffVersions } from "../../data/api";
import "./DiffModal.css";

export default function DiffModal({
  open,
  workflowId,
  versions,
  onClose,
}: {
  open: boolean;
  workflowId: string;
  versions: VersionSummary[];
  onClose: () => void;
}) {
  const [a, setA] = useState<string>("");
  const [b, setB] = useState<string>("");
  const [diff, setDiff] = useState<WorkflowDiff | null>(null);

  useEffect(() => {
    if (!open) return;
    if (versions.length >= 2) {
      setA(versions[versions.length - 2].id);
      setB(versions[versions.length - 1].id);
    } else if (versions.length === 1) {
      setA(versions[0].id);
      setB(versions[0].id);
    }
    setDiff(null);
  }, [open, versions]);

  async function run() {
    if (!a || !b) return;
    const d = await diffVersions(workflowId, a, b);
    setDiff(d);
  }

  if (!open) return null;

  return (
    <>
      <div className="dm-backdrop" onClick={onClose} />
      <div className="dm" role="dialog" aria-modal="true" aria-label="Compare versions">
        <div className="dm-head">
          <h3>Compare versions</h3>
          <button className="iconbtn" onClick={onClose}><FiX /></button>
        </div>

        <div className="dm-body">
          <div className="dm-row">
            <label>From</label>
            <select value={a} onChange={e => setA(e.target.value)}>
              {versions.map(v => <option key={v.id} value={v.id}>{v.label}</option>)}
            </select>
            <label>To</label>
            <select value={b} onChange={e => setB(e.target.value)}>
              {versions.map(v => <option key={v.id} value={v.id}>{v.label}</option>)}
            </select>
            <button className="btn btn-secondary" onClick={run}>Compare</button>
          </div>

          {diff && (
            <div className="dm-grid">
              <div className="dm-card">
                <div className="dm-title"><FiPlusCircle /> Added stages</div>
                {diff.addedStages.length ? (
                  <ul>{diff.addedStages.map(s => <li key={s}>{s}</li>)}</ul>
                ) : <div className="muted">None</div>}
              </div>

              <div className="dm-card">
                <div className="dm-title"><FiMinusCircle /> Removed stages</div>
                {diff.removedStages.length ? (
                  <ul>{diff.removedStages.map(s => <li key={s}>{s}</li>)}</ul>
                ) : <div className="muted">None</div>}
              </div>

              <div className="dm-card">
                <div className="dm-title"><FiEdit3 /> Renamed</div>
                {diff.renamedStages.length ? (
                  <ul>{diff.renamedStages.map((r,i) => <li key={i}><b>{r.from}</b> → <b>{r.to}</b></li>)}</ul>
                ) : <div className="muted">None</div>}
              </div>

              <div className="dm-card">
                <div className="dm-title"><FiShuffle /> Other changes</div>
                <ul>
                  <li>{diff.changedStages.length} stage config change(s)</li>
                  <li>{diff.changedTransitions ? "Transitions changed" : "Transitions unchanged"}</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        <div className="dm-foot">
          <button className="btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </>
  );
}
