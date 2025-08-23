// src/sections/helpdesk/Workflows/data/api.ts
// Thin layer so you can swap the backend later.
import type { ListParams } from "./mock";
import type {
  Department,
  WorkflowSummary,
  NewWorkflowInput,
  WorkflowDetail,
  VersionSummary,
  WorkflowSnapshot,
  WorkflowDiff,
  WorkflowStatus,
} from "./types";

import {
  listDepartments as _listDepartments,
  listWorkflows as _listWorkflows,
  createWorkflow as _createWorkflow,
  getWorkflowDetail as _getWorkflowDetail,
  saveWorkflowDetail as _saveWorkflowDetail,
  listVersions as _listVersions,
  publishWorkflow as _publishWorkflow,
  duplicateWorkflow as _duplicateWorkflow,
  setWorkflowStatus as _setWorkflowStatus,
  deleteWorkflow as _deleteWorkflow,
  getVersionDetail as _getVersionDetail,
  diffVersions as _diffVersions,
} from "./mock";

export const listDepartments = (): Promise<Department[]> => _listDepartments();
export const listWorkflows = (p?: ListParams): Promise<WorkflowSummary[]> => _listWorkflows(p);
export const createWorkflow = (i: NewWorkflowInput): Promise<WorkflowSummary> => _createWorkflow(i);

export const getWorkflowDetail = (id: string): Promise<WorkflowDetail | null> => _getWorkflowDetail(id);
export const saveWorkflowDetail = (detail: WorkflowDetail): Promise<WorkflowDetail> => _saveWorkflowDetail(detail);

export const listVersions = (workflowId: string): Promise<VersionSummary[]> => _listVersions(workflowId);
export const publishWorkflow = (workflowId: string, author?: string): Promise<VersionSummary[]> => _publishWorkflow(workflowId, author);
export const duplicateWorkflow = (workflowId: string): Promise<WorkflowSummary> => _duplicateWorkflow(workflowId);
export const setWorkflowStatus = (workflowId: string, status: WorkflowStatus): Promise<void> => _setWorkflowStatus(workflowId, status);
export const deleteWorkflow = (workflowId: string): Promise<void> => _deleteWorkflow(workflowId);
export const getVersionDetail = (workflowId: string, versionId: string): Promise<WorkflowSnapshot | null> => _getVersionDetail(workflowId, versionId);
export const diffVersions = (workflowId: string, aId: string, bId: string): Promise<WorkflowDiff> => _diffVersions(workflowId, aId, bId);


// at the bottom of src/sections/helpdesk/Workflows/data/api.ts
export const api = {
  listDepartments,
  listWorkflows,
  createWorkflow,
  getWorkflowDetail,
  saveWorkflowDetail,
  listVersions,
  publishWorkflow,
  duplicateWorkflow,
  setWorkflowStatus,
  deleteWorkflow,
  getVersionDetail,
  diffVersions,
};
