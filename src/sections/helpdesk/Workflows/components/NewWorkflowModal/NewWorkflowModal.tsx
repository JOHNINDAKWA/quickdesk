import { useEffect, useState } from "react";
import { FiPlus, FiX } from "react-icons/fi";
import { api } from "../../data/api";
import type { Department, NewWorkflowInput, WorkflowSummary, WorkflowTemplate, WorkflowType } from "../../data/types";
import "./NewWorkflowModal.css";

export default function NewWorkflowModal({
  open,
  defaultDepartmentId,
  onClose,
  onCreated,
}: {
  open: boolean;
  defaultDepartmentId?: string;
  onClose: () => void;
  onCreated: (w: WorkflowSummary) => void;
}) {
  const [depts, setDepts] = useState<Department[]>([]);
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  // form
  const [name, setName] = useState("");
  const [departmentId, setDepartmentId] = useState(defaultDepartmentId || "");
  const [type, setType] = useState<WorkflowType>("service_request");
  const [templateId, setTemplateId] = useState<string>("");
  const [owner, setOwner] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const [ds, ts] = await Promise.all([
        api.listDepartments(),
        // pull from mock directly to avoid another file; quick import
        import("../../data/mock").then(m => m.TEMPLATES),
      ]);
      if (!alive) return;
      setDepts(ds);
      setTemplates(ts);
      setLoading(false);
      if (!defaultDepartmentId && ds[0]) setDepartmentId(ds[0].id);
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submit() {
    if (!name.trim() || !departmentId) return;
    const input: NewWorkflowInput = {
      name: name.trim(),
      departmentId,
      type,
      templateId: templateId || null,
      owner: owner || null,
    };
    const created = await api.createWorkflow(input);
    onCreated(created);
  }

  if (!open) return null;

  return (
    <>
      <div className="nw-backdrop" onClick={onClose} />
      <div className="nw-modal" role="dialog" aria-modal="true" aria-label="Create workflow">
        <div className="nw-head">
          <h3><FiPlus /> New Workflow</h3>
          <button className="iconbtn" onClick={onClose} aria-label="Close"><FiX /></button>
        </div>

        <div className="nw-body">
          {loading ? (
            <div className="muted">Loading…</div>
          ) : (
            <div className="grid2">
              <label className="field">
                <span>Name</span>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Laptop Provisioning" />
              </label>

              <label className="field">
                <span>Department</span>
                <select value={departmentId} onChange={e => setDepartmentId(e.target.value)}>
                  {depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </label>

              <label className="field">
                <span>Type</span>
                <select value={type} onChange={e => setType(e.target.value as any)}>
                  <option value="service_request">Service Request</option>
                  <option value="incident">Incident</option>
                  <option value="change">Change</option>
                  <option value="task">Task</option>
                </select>
              </label>

              <label className="field">
                <span>Template (optional)</span>
                <select value={templateId} onChange={e => setTemplateId(e.target.value)}>
                  <option value="">—</option>
                  {templates
                    .filter(t => t.type === type)
                    .map(t => <option key={t.id} value={t.id}>{t.name} ({t.stagesCount} stages)</option>)}
                </select>
              </label>

              <label className="field col-span-2">
                <span>Owner (optional)</span>
                <input value={owner} onChange={e => setOwner(e.target.value)} placeholder="e.g. Jane A." />
              </label>
            </div>
          )}
        </div>

        <div className="nw-foot">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={!name.trim() || !departmentId} onClick={submit}>Create</button>
        </div>
      </div>
    </>
  );
}
