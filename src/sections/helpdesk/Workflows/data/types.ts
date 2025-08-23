// src/sections/helpdesk/Workflows/data/types.ts
export type WorkflowType = "service_request" | "incident" | "change" | "task";
export type WorkflowStatus = "draft" | "active" | "archived";

/* --- Catalog types --- */
export type Department = { id: string; name: string };

export type WorkflowSummary = {
  id: string;
  name: string;
  departmentId: string;
  departmentName: string;
  type: WorkflowType;
  status: WorkflowStatus;
  stagesCount: number;
  owner?: string;
  updatedAt: string; // ISO
};

export type WorkflowTemplate = {
  id: string;
  name: string;
  type: WorkflowType;
  stagesCount: number;
  description?: string;
};

export type NewWorkflowInput = {
  name: string;
  departmentId: string;
  type: WorkflowType;
  templateId?: string | null;
  owner?: string | null;
};

/* --- Builder (detail) minimal model --- */
export type StageId = string;
export type TransitionId = string;

export type Stage = {
  id: StageId;
  name: string;
  /** free-form config; drawer tabs fill this */
  assignment?: { role?: string; team?: string; agent?: string } | null;
  conditions?: { channels?: string[]; priority?: string[]; requesterId?: string | null } | null;
  sla?: { goalMins?: number } | null;
  notify?: { when?: "enter" | "exit" | "timeout"; targets?: string[] } | null;
};

export type Transition = {
  id: TransitionId;
  from: StageId;
  to: StageId;
  rule?: string | null; // human string like "if priority = high"
};

export type WorkflowDetail = {
  id: string;
  name: string;
  departmentId: string;
  departmentName: string;
  type: WorkflowType;
  status: WorkflowStatus;              // draft/active/archived (status of current working copy)
  stages: Stage[];
  transitions: Transition[];
  updatedAt: string;                   // last edited
};

/* --- Versioning types (Batch D) --- */
export type VersionId = string;
export type VersionSummary = {
  id: VersionId;                       // e.g. "v3"
  label: string;                       // e.g. "v3 (current)"
  createdAt: string;
  author?: string;
};

export type WorkflowSnapshot = {
  name: string;
  type: WorkflowType;
  departmentId: string;
  stages: Stage[];
  transitions: Transition[];
};

export type WorkflowVersion = {
  id: VersionId;
  createdAt: string;
  author?: string;
  snapshot: WorkflowSnapshot;
};

/* --- Diffs --- */
export type WorkflowDiff = {
  addedStages: string[];
  removedStages: string[];
  renamedStages: Array<{ from: string; to: string }>;
  changedStages: string[];            // config changed
  changedTransitions: number;         // simple count
};
