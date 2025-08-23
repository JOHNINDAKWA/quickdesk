// src/sections/helpdesk/Workflows/pages/WorkflowDetail/WorkflowDetail.tsx
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { FiChevronLeft, FiSave, FiPlay, FiEdit3 } from "react-icons/fi";

import {
  getWorkflowDetail,
  saveWorkflowDetail,
  listVersions,
  publishWorkflow,
} from "../../data/api";

import type { WorkflowDetail, Stage } from "../../data/types";

import StageBoard from "../../components/StageBoard/StageBoard";
import StageInspectorDrawer from "../../components/StageInspector/StageInspectorDrawer";
import ValidatePanel from "../../components/ValidatePanel/ValidatePanel";
import SimulatorTray from "../../components/SimulatorTray/SimulatorTray";

import VersionBar from "../../components/VersionBar/VersionBar";
import DiffModal from "../../components/DiffModal/DiffModal";

import "./WorkflowDetail.css";

const nid = () => Math.random().toString(36).slice(2, 9);

export default function WorkflowDetailPage() {
  const { id = "", orgSlug = "" } = useParams();

  const [wf, setWf] = useState<WorkflowDetail | null>(null);
  const [selId, setSelId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // versions / diff
  const [versions, setVersions] = useState<Array<{ id: string; label: string }>>([]);
  const [openDiff, setOpenDiff] = useState(false);

// src/sections/helpdesk/Workflows/pages/WorkflowDetail/WorkflowDetail.tsx
// inside the useEffect that loads the workflow:
useEffect(() => {
  let alive = true;
  (async () => {
    const d = await getWorkflowDetail(id);
    if (!alive) return;

    // ✅ normalize stages so transitions is always an array
    const normalized = d
      ? {
          ...d,
          stages: d.stages.map(s => ({
            ...s,
            transitions: Array.isArray((s as any).transitions) ? (s as any).transitions : [],
          })),
        }
      : d;

    setWf(normalized);
    setSelId(normalized?.stages[0]?.id ?? null);
  })();
  return () => { alive = false; };
}, [id]);


  const stageMap = useMemo(() => {
    const m = new Map<string, Stage>();
    wf?.stages.forEach((s) => m.set(s.id, s));
    return m;
  }, [wf]);

  /* ---------------------------------------
   * Stage CRUD (keep your current behavior)
   * ------------------------------------- */
  function addStage(afterId?: string | null, type: any = "stage") {
    if (!wf) return;
    const s: Stage = {
      // compatible with your StageBoard/Inspector
      id: nid(),
      // @ts-expect-error — older Stage type may have `type`
      type,
      name: type === "approval" ? "Approval" : type === "end" ? "Done" : "New Stage",
      // the following props are no-ops if your Stage type doesn’t have them
      // (safe to keep for backward compatibility with your Inspector)
      // @ts-ignore
      description: "",
      // @ts-ignore
      role: type === "approval" ? "Manager" : undefined,
      // @ts-ignore
      slaHours: type === "end" ? null : 24,
      // @ts-ignore
      transitions: [],
    };

    const list = [...wf.stages];
    if (!afterId) {
      // insert before the terminal stage if you keep a fixed "end"
      const endIdx = list.findIndex((x: any) => x.type === "end");
      const idx = endIdx > 0 ? endIdx : list.length;
      list.splice(idx, 0, s);
    } else {
      const idx = list.findIndex((x) => x.id === afterId);
      list.splice(idx + 1, 0, s);
    }

    setWf({ ...wf, stages: list });
    setSelId(s.id);
  }

  function updateStage(id: string, patch: Partial<Stage>) {
    if (!wf) return;
    const list = wf.stages.map((s) => (s.id === id ? { ...s, ...patch } : s));
    setWf({ ...wf, stages: list });
  }

  function deleteStage(id: string) {
    if (!wf) return;
    if (wf.stages.length <= 2) return;
    const list = wf.stages.filter((s) => s.id !== id);
    // if your Stage keeps local transitions, prune them
    list.forEach((s: any) => (s.transitions = (s.transitions || []).filter((t: any) => t.to !== id)));
    setWf({ ...wf, stages: list });
    if (selId === id) setSelId(list[0]?.id ?? null);
  }

  function duplicateStage(id: string) {
    if (!wf) return;
    const idx = wf.stages.findIndex((s) => s.id === id);
    if (idx < 0) return;
    const deep = <T,>(v: T): T => JSON.parse(JSON.stringify(v));
    const copy: Stage = deep(wf.stages[idx]);
    copy.id = nid();
    // @ts-ignore
    copy.name = (copy as any).name + " (copy)";
    // @ts-ignore
    copy.transitions = (copy as any).transitions?.map((t: any) => ({ ...t, id: nid() })) ?? [];
    const list = [...wf.stages];
    list.splice(idx + 1, 0, copy);
    setWf({ ...wf, stages: list });
    setSelId(copy.id);
  }

  function moveStage(id: string, dir: "up" | "down") {
    if (!wf) return;
    const list = [...wf.stages];
    const i = list.findIndex((s) => s.id === id);
    if (i < 0) return;
    const j = dir === "up" ? i - 1 : i + 1;
    if (j < 0 || j >= list.length) return;
    // keep start/end pinned if your model uses them
    // @ts-ignore
    if ((list[i].type === "start" && dir === "up") || (list[i].type === "end" && dir === "down")) return;
    const [spliced] = list.splice(i, 1);
    list.splice(j, 0, spliced);
    setWf({ ...wf, stages: list });
  }

  function reorder(from: number, to: number) {
    if (!wf) return;
    const list = [...wf.stages];
    // keep first/last pinned if you use start/end
    // @ts-ignore
    if (list[from].type === "start" || list[to].type === "start") return;
    // @ts-ignore
    if (list[from].type === "end" || list[to].type === "end") return;
    const [item] = list.splice(from, 1);
    list.splice(to, 0, item);
    setWf({ ...wf, stages: list });
  }

  /* ---------------------------------------
   * Save & Publish
   * ------------------------------------- */
  async function saveAll() {
    if (!wf) return;
    setSaving(true);
    const saved = await saveWorkflowDetail(wf);
    setWf(saved);
    setSaving(false);
  }

  async function publish() {
    if (!wf) return;
    const rows = await publishWorkflow(wf.id);
    setVersions(rows);
    // optimistic: flip status to active so UI reflects publish
    setWf((prev) => (prev ? { ...prev, status: "active" } : prev));
  }

  if (!wf) {
    return (
      <div className="panel" style={{ margin: 16 }}>
        <p>Loading workflow…</p>
      </div>
    );
  }

  return (
    <div className="wfd-root">
      {/* Header */}
      <div className="wfd-head panel">
        <div className="l">
          <Link className="btn" to={`/${orgSlug}/console/workflows`}>
            <FiChevronLeft /> Back to Workflows
          </Link>
          <div className="meta">
            <div className="title">
              <FiEdit3 />
              <input
                value={wf.name}
                onChange={(e) => setWf({ ...wf, name: e.target.value })}
              />
            </div>
            <div className="sub">
              <span className={`badge ${wf.status}`}>{wf.status}</span>
              <span className="dot">•</span>
              {wf.departmentName}
              <span className="dot">•</span>
              {wf.stages.length} stages
            </div>
          </div>
        </div>

        <div className="r">
          <button className="btn" onClick={() => addStage(null, "stage")}>
            + Add Stage
          </button>
          <button className="btn btn-secondary" disabled={saving} onClick={saveAll}>
            <FiSave /> Save
          </button>
          <button className="btn btn-primary" title="Publish current draft" onClick={publish}>
            <FiPlay /> Publish
          </button>
        </div>
      </div>

      {/* Versions toolbar */}
      <VersionBar
        workflowId={wf.id}
        status={wf.status}
        onVersionsChanged={setVersions}
        onOpenDiff={() => setOpenDiff(true)}
      />

      {/* Builder */}
      <div className="wfd-body">
        <StageBoard
          stages={wf.stages}
          selectedId={selId}
          onSelect={setSelId}
          onAddAfter={(afterId, t) => addStage(afterId, t)}
          onDuplicate={duplicateStage}
          onDelete={deleteStage}
          onMove={moveStage}
          onReorder={reorder}
        />

        <StageInspectorDrawer
          stage={selId ? stageMap.get(selId) || null : null}
          allStages={wf.stages}
          onChange={(patch) => selId && updateStage(selId, patch)}
        />
      </div>

      {/* Validation + Simulator */}
      <ValidatePanel stages={wf.stages} onJump={(sid) => setSelId(sid)} />
      <SimulatorTray workflow={wf} />

      {/* Diff modal */}
      <DiffModal
        open={openDiff}
        workflowId={wf.id}
        versions={versions}
        onClose={() => setOpenDiff(false)}
      />
    </div>
  );
}
