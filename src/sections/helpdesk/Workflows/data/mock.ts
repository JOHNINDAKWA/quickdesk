// src/sections/helpdesk/Workflows/data/mock.ts
import type {
  Department,
  WorkflowSummary,
  WorkflowTemplate,
  NewWorkflowInput,
  WorkflowStatus,
  WorkflowType,
  WorkflowDetail,
  WorkflowVersion,
  VersionSummary,
  WorkflowSnapshot,
  WorkflowDiff,
  Stage,
  Transition,
} from "./types";

/* ============================ Utils ============================ */
const nid = () => Math.random().toString(36).slice(2, 9);
const nowIso = () => new Date().toISOString();
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

/* ============================ Catalog seed ============================ */
export const DEPARTMENTS: Department[] = [
  { id: "dep_support", name: "Support" },
  { id: "dep_it", name: "IT" },
  { id: "dep_engineering", name: "Engineering" },
  { id: "dep_billing", name: "Billing" },
  { id: "dep_success", name: "Customer Success" },
];

export const TEMPLATES: WorkflowTemplate[] = [
  {
    id: "tpl_onboarding",
    name: "Employee Onboarding",
    type: "service_request",
    stagesCount: 6,
    description: "HR + IT provisioning",
  },
  { id: "tpl_password", name: "Password Reset", type: "service_request", stagesCount: 3 },
  { id: "tpl_incident", name: "Incident Default", type: "incident", stagesCount: 5 },
  { id: "tpl_change", name: "Change Control", type: "change", stagesCount: 7 },
];

const owners = ["Jane A.", "Brian O.", "Mary W.", "Peter N.", "Aisha N."];

/* Helpers to build a simple linear flow with typed stages */
function buildLinearStages(count: number): { stages: Stage[]; transitions: Transition[] } {
  const stages: Stage[] = Array.from({ length: Math.max(count, 3) }).map((_, i, arr) => ({
    id: nid(),
    name: i === 0 ? "New" : i === arr.length - 1 ? "Resolved" : `Stage ${i}`,
    type: i === 0 ? "start" : i === arr.length - 1 ? "end" : "stage",
    transitions: [],
  }));

  const transitions: Transition[] = stages.slice(0, -1).map((s, i) => ({
    id: nid(),
    from: s.id,
    to: stages[i + 1].id,
  }));

  // attach to the source stage for UI counters
  transitions.forEach(t => {
    const from = stages.find(s => s.id === t.from)!;
    from.transitions!.push(t);
  });

  return { stages, transitions };
}

/* Workflow list (catalog) */
function seedSummary(
  name: string,
  dep: Department,
  type: WorkflowType,
  status: WorkflowStatus,
  i: number
): WorkflowSummary {
  return {
    id: nid(),
    name,
    departmentId: dep.id,
    departmentName: dep.name,
    type,
    status,
    stagesCount: 3 + (i % 6),
    owner: pick(owners),
    updatedAt: new Date(Date.now() - i * 36e5).toISOString(),
  };
}

export let WORKFLOWS: WorkflowSummary[] = [
  seedSummary("Password Reset", DEPARTMENTS[1], "service_request", "active", 1),
  seedSummary("Laptop Provisioning", DEPARTMENTS[1], "service_request", "active", 2),
  seedSummary("Employee Onboarding", DEPARTMENTS[4], "service_request", "active", 3),
  seedSummary("Customer Escalation", DEPARTMENTS[0], "incident", "active", 4),
  seedSummary("Billing Dispute", DEPARTMENTS[3], "service_request", "draft", 5),
  seedSummary("Payment Failure", DEPARTMENTS[3], "incident", "active", 6),
  seedSummary("Platform Outage", DEPARTMENTS[2], "incident", "active", 7),
  seedSummary("Feature Change Request", DEPARTMENTS[2], "change", "draft", 8),
  seedSummary("Tier 1 Triage", DEPARTMENTS[0], "task", "active", 9),
];

/* ============================ Details + Versions store ============================ */
type Store = {
  detail: WorkflowDetail;      // current draft
  versions: WorkflowVersion[]; // published snapshots
};

const byId: Record<string, Store> = {};

/** Seed a draft + an initial published version for "active" flows */
for (const w of WORKFLOWS) {
  const count = Math.max(3, w.stagesCount);
  const { stages, transitions } = buildLinearStages(count);

  const detail: WorkflowDetail = {
    id: w.id,
    name: w.name,
    departmentId: w.departmentId,
    departmentName: w.departmentName,
    type: w.type,
    status: w.status,
    stages,
    transitions,
    updatedAt: w.updatedAt,
  };

  const versions: WorkflowVersion[] =
    w.status === "active"
      ? [
          {
            id: "v1",
            createdAt: w.updatedAt,
            author: pick(owners),
            snapshot: snap(detail),
          },
        ]
      : [];

  byId[w.id] = { detail, versions };
}

/* ============================ Normalizers ============================ */
function ensureTypes(stages: Stage[]) {
  // make sure we have one start and one end; fallback to first/last
  if (!stages.some(s => s.type === "start") && stages.length) stages[0].type = "start";
  if (!stages.some(s => s.type === "end") && stages.length) stages[stages.length - 1].type = "end";
}

function ensureStageArrays(stages: Stage[]) {
  stages.forEach(s => {
    if (!Array.isArray((s as any).transitions)) (s as any).transitions = [];
  });
}

function transitionsFromStages(stages: Stage[]): Transition[] {
  const out: Transition[] = [];
  stages.forEach(s => {
    (s.transitions || []).forEach(t => {
      if (t && t.from && t.to) out.push({ id: t.id || nid(), from: t.from, to: t.to });
    });
  });
  // de-dupe (from+to)
  const seen = new Set<string>();
  return out.filter(t => {
    const k = `${t.from}->${t.to}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function backfillStageTransitions(stages: Stage[], transitions: Transition[]) {
  const byFrom = new Map<string, Transition[]>();
  transitions.forEach(t => {
    const list = byFrom.get(t.from) || [];
    list.push(t);
    byFrom.set(t.from, list);
  });
  stages.forEach(s => {
    if (!Array.isArray(s.transitions) || s.transitions.length === 0) {
      s.transitions = byFrom.get(s.id) || [];
    }
  });
}

function normalizeDetail(d: WorkflowDetail): WorkflowDetail {
  const detail: WorkflowDetail = JSON.parse(JSON.stringify(d));
  ensureTypes(detail.stages);
  ensureStageArrays(detail.stages);

  // If top-level transitions missing or out of sync, rebuild from stages
  const fromStages = transitionsFromStages(detail.stages);
  if (!Array.isArray(detail.transitions) || !detail.transitions.length) {
    detail.transitions = fromStages;
  } else {
    // also ensure stage-level arrays exist
    backfillStageTransitions(detail.stages, detail.transitions);
  }
  return detail;
}

/* Snapshot for versions */
function snap(d: WorkflowDetail): WorkflowSnapshot {
  const norm = normalizeDetail(d);
  return {
    name: norm.name,
    type: norm.type,
    departmentId: norm.departmentId,
    stages: JSON.parse(JSON.stringify(norm.stages)),
    transitions: JSON.parse(JSON.stringify(norm.transitions)),
  };
}

/* ============================ Public (mock) API ============================ */
export type ListParams = {
  q?: string;
  departmentId?: string;
  status?: WorkflowStatus | "all";
  type?: WorkflowType | "all";
  sort?: "updatedAt_desc" | "name_asc";
};

export async function listDepartments(): Promise<Department[]> {
  await delay(120);
  return [...DEPARTMENTS];
}

export async function listWorkflows(params: ListParams = {}): Promise<WorkflowSummary[]> {
  await delay(160);
  const q = (params.q || "").toLowerCase().trim();
  let rows = [...WORKFLOWS];

  if (q) {
    rows = rows.filter(
      w =>
        w.name.toLowerCase().includes(q) ||
        w.departmentName.toLowerCase().includes(q) ||
        (w.owner || "").toLowerCase().includes(q)
    );
  }
  if (params.departmentId) rows = rows.filter(w => w.departmentId === params.departmentId);
  if (params.status && params.status !== "all") rows = rows.filter(w => w.status === params.status);
  if (params.type && params.type !== "all") rows = rows.filter(w => w.type === params.type);

  switch (params.sort) {
    case "name_asc":
      rows.sort((a, b) => a.name.localeCompare(b.name));
      break;
    default:
      rows.sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));
  }
  return rows;
}

export async function createWorkflow(input: NewWorkflowInput): Promise<WorkflowSummary> {
  await delay(220);
  const dep = DEPARTMENTS.find(d => d.id === input.departmentId)!;
  const tpl = input.templateId ? TEMPLATES.find(t => t.id === input.templateId) : undefined;

  const count = tpl?.stagesCount ?? 3;
  const { stages, transitions } = buildLinearStages(count);

  const summary: WorkflowSummary = {
    id: nid(),
    name: input.name,
    departmentId: dep.id,
    departmentName: dep.name,
    type: input.type,
    status: "draft",
    stagesCount: stages.length,
    owner: input.owner || pick(owners),
    updatedAt: nowIso(),
  };

  WORKFLOWS = [summary, ...WORKFLOWS];
  byId[summary.id] = {
    detail: {
      ...summary,
      stages,
      transitions,
    },
    versions: [],
  };

  return summary;
}

export async function getWorkflowDetail(id: string): Promise<WorkflowDetail | null> {
  await delay(100);
  const store = byId[id];
  if (!store) return null;
  // normalize to satisfy validator/UI
  return normalizeDetail(store.detail);
}

export async function saveWorkflowDetail(detail: WorkflowDetail): Promise<WorkflowDetail> {
  await delay(150);
  const store = byId[detail.id];
  if (!store) throw new Error("Workflow not found");

  // keep transitions in sync with stage-level arrays
  const norm = normalizeDetail(detail);
  store.detail = { ...norm, updatedAt: nowIso() };

  // mirror into the summary row
  WORKFLOWS = WORKFLOWS.map(w =>
    w.id === detail.id
      ? {
          ...w,
          name: store.detail.name,
          stagesCount: store.detail.stages.length,
          type: store.detail.type,
          status: store.detail.status,
          updatedAt: store.detail.updatedAt,
        }
      : w
  );

  return JSON.parse(JSON.stringify(store.detail));
}

/* ---------------- Versions ---------------- */
export async function listVersions(workflowId: string): Promise<VersionSummary[]> {
  await delay(80);
  const store = byId[workflowId];
  if (!store) return [];
  return store.versions.map((v, idx, arr) => ({
    id: v.id,
    label: v.id === arr[arr.length - 1]?.id ? `${v.id} (current)` : v.id,
    createdAt: v.createdAt,
    author: v.author,
  }));
}

export async function publishWorkflow(workflowId: string, author = "You"): Promise<VersionSummary[]> {
  await delay(220);
  const store = byId[workflowId];
  if (!store) throw new Error("Workflow not found");

  const norm = normalizeDetail(store.detail);
  const nextN = store.versions.length + 1;
  const ver: WorkflowVersion = {
    id: `v${nextN}`,
    createdAt: nowIso(),
    author,
    snapshot: snap(norm),
  };

  store.versions = [...store.versions, ver];
  store.detail = { ...norm, status: "active", updatedAt: ver.createdAt };

  WORKFLOWS = WORKFLOWS.map(w =>
    w.id === workflowId ? { ...w, status: "active", updatedAt: ver.createdAt } : w
  );

  return listVersions(workflowId);
}

export async function getVersionDetail(workflowId: string, versionId: string): Promise<WorkflowSnapshot | null> {
  await delay(100);
  const store = byId[workflowId];
  const snap = store?.versions.find(v => v.id === versionId)?.snapshot;
  return snap ? JSON.parse(JSON.stringify(snap)) : null;
}

export async function duplicateWorkflow(workflowId: string): Promise<WorkflowSummary> {
  await delay(220);
  const store = byId[workflowId];
  if (!store) throw new Error("Workflow not found");

  const dep = DEPARTMENTS.find(d => d.id === store.detail.departmentId)!;
  const newId = nid();

  const detailCopy = normalizeDetail(store.detail);

  const summary: WorkflowSummary = {
    id: newId,
    name: `${detailCopy.name} (Copy)`,
    departmentId: dep.id,
    departmentName: dep.name,
    type: detailCopy.type,
    status: "draft",
    stagesCount: detailCopy.stages.length,
    owner: pick(owners),
    updatedAt: nowIso(),
  };
  WORKFLOWS = [summary, ...WORKFLOWS];

  byId[newId] = {
    detail: {
      ...summary,
      stages: JSON.parse(JSON.stringify(detailCopy.stages)),
      transitions: JSON.parse(JSON.stringify(detailCopy.transitions)),
    },
    versions: [],
  };

  return summary;
}

export async function setWorkflowStatus(workflowId: string, status: WorkflowStatus): Promise<void> {
  await delay(140);
  const store = byId[workflowId];
  if (!store) throw new Error("Workflow not found");
  store.detail.status = status;
  store.detail.updatedAt = nowIso();
  WORKFLOWS = WORKFLOWS.map(w =>
    w.id === workflowId ? { ...w, status, updatedAt: store.detail.updatedAt } : w
  );
}

export async function deleteWorkflow(workflowId: string): Promise<void> {
  await delay(120);
  WORKFLOWS = WORKFLOWS.filter(w => w.id !== workflowId);
  delete byId[workflowId];
}

/* ---------------- Diff (simple heuristic) ---------------- */
export async function diffVersions(workflowId: string, aId: string, bId: string): Promise<WorkflowDiff> {
  await delay(100);
  const a = await getVersionDetail(workflowId, aId);
  const b = await getVersionDetail(workflowId, bId);
  if (!a || !b) throw new Error("Version(s) not found");

  const aNames = new Map(a.stages.map(s => [s.id, s.name]));
  const bNames = new Map(b.stages.map(s => [s.id, s.name]));
  const aIds = new Set(a.stages.map(s => s.id));
  const bIds = new Set(b.stages.map(s => s.id));

  const addedStages = [...bIds].filter(id => !aIds.has(id)).map(id => bNames.get(id) || id);
  const removedStages = [...aIds].filter(id => !bIds.has(id)).map(id => aNames.get(id) || id);

  const renamedStages: Array<{ from: string; to: string }> = [];
  const changedStages: string[] = [];

  // same IDs present in both; check name/config changes
  for (const id of [...aIds].filter(id => bIds.has(id))) {
    const aStage = a.stages.find(s => s.id === id)!;
    const bStage = b.stages.find(s => s.id === id)!;
    if (aStage.name !== bStage.name) renamedStages.push({ from: aStage.name, to: bStage.name });

    const clean = (x: any) => JSON.stringify({ ...x, name: undefined, id: undefined });
    if (clean(aStage) !== clean(bStage)) changedStages.push(bStage.name);
  }

  const changedTransitions =
    JSON.stringify(a.transitions.map(t => ({ f: t.from, to: t.to })).sort((x, y) => (x.f + x.to).localeCompare(y.f + y.to))) ===
    JSON.stringify(b.transitions.map(t => ({ f: t.from, to: t.to })).sort((x, y) => (x.f + x.to).localeCompare(y.f + y.to)))
      ? 0
      : 1;

  return { addedStages, removedStages, renamedStages, changedStages, changedTransitions };
}
