// src/sections/helpdesk/Workflows/pages/WorkflowsHome/WorkflowsHome.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FiFilter, FiPlus, FiSearch, FiSliders } from "react-icons/fi";
import { api } from "../../data/api";
import type {
  Department,
  WorkflowSummary,
  WorkflowStatus,
  WorkflowType,
} from "../../data/types";
import DepartmentGroup from "../../components/DepartmentGroup/DepartmentGroup";
import NewWorkflowModal from "../../components/NewWorkflowModal/NewWorkflowModal";
import EmptyState from "../../components/EmptyState/EmptyState";
import "./WorkflowsHome.css";

type StatusFilter = WorkflowStatus | "all";
type TypeFilter = WorkflowType | "all";

export default function WorkflowsHome() {
  const { orgSlug } = useParams();
  const nav = useNavigate();

  const [loading, setLoading] = useState(true);
  const [depts, setDepts] = useState<Department[]>([]);
  const [rows, setRows] = useState<WorkflowSummary[]>([]);

  // filters
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [wtype, setWtype] = useState<TypeFilter>("all");
  const [sort, setSort] = useState<"updatedAt_desc" | "name_asc">("updatedAt_desc");

  // create modal
  const [openNew, setOpenNew] = useState(false);
  const [prefillDept, setPrefillDept] = useState<string | null>(null);

  // refresh knob (call setRefreshKey(k=>k+1) when something external changes)
  const [refreshKey, setRefreshKey] = useState(0);
  function invalidate() {
    setRefreshKey((k) => k + 1);
  }

  // load departments once
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const ds = await api.listDepartments();
      if (!alive) return;
      setDepts(ds);
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, []);

  // (re)fetch workflows on filters / refresh
  useEffect(() => {
    let alive = true;
    setLoading(true);
    const handle = setTimeout(async () => {
      const ws = await api.listWorkflows({
        q,
        status,
        type: wtype,
        sort,
      });
      if (!alive) return;
      setRows(ws);
      setLoading(false);
    }, 150); // debounce
    return () => {
      alive = false;
      clearTimeout(handle);
    };
  }, [q, status, wtype, sort, refreshKey]);

  const grouped = useMemo(() => {
    const byDep: Record<string, WorkflowSummary[]> = {};
    rows.forEach((w) => {
      if (!byDep[w.departmentId]) byDep[w.departmentId] = [];
      byDep[w.departmentId].push(w);
    });
    // keep department order stable
    return depts.map((d) => ({ dept: d, items: byDep[d.id] || [] }));
  }, [depts, rows]);

  function openDetail(id: string) {
    nav(`/${orgSlug}/console/workflows/${id}`);
  }

  function openCreate(departmentId?: string) {
    setPrefillDept(departmentId || null);
    setOpenNew(true);
  }

  return (
    <div className="wfhome panel">
      {/* Header actions */}
      <div className="wfhome__bar">
        <div className="wfhome__search">
          <FiSearch className="ic" />
          <input
            placeholder="Search workflows, departments, owners…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <div className="wfhome__filters">
          <div className="sel">
            <FiFilter />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as StatusFilter)}
            >
              <option value="all">All status</option>
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <div className="sel">
            <FiSliders />
            <select
              value={wtype}
              onChange={(e) => setWtype(e.target.value as TypeFilter)}
            >
              <option value="all">All types</option>
              <option value="service_request">Service Request</option>
              <option value="incident">Incident</option>
              <option value="change">Change</option>
              <option value="task">Task</option>
            </select>
          </div>
          <div className="sel">
            <select value={sort} onChange={(e) => setSort(e.target.value as any)}>
              <option value="updatedAt_desc">Recently updated</option>
              <option value="name_asc">Name A–Z</option>
            </select>
          </div>

          <button className="btn btn-primary" onClick={() => openCreate()}>
            <FiPlus /> New Workflow
          </button>
        </div>
      </div>

      {/* Groups */}
      {loading ? (
        <div className="wfhome__loading">Loading…</div>
      ) : grouped.every((g) => g.items.length === 0) ? (
        <EmptyState
          icon="flow"
          title="No workflows yet"
          subtitle="Create your first workflow to standardize ticket handling."
          cta={{ label: "Create Workflow", onClick: () => openCreate() }}
        />
      ) : (
        <div className="wfhome__groups">
          {grouped.map(({ dept, items }) => (
            <DepartmentGroup
              key={dept.id}
              department={dept}
              items={items}
              onOpen={openDetail}
              onCreate={() => openCreate(dept.id)}
            />
          ))}
        </div>
      )}

      {/* Create modal */}
      {openNew && (
        <NewWorkflowModal
          open={openNew}
          defaultDepartmentId={prefillDept || undefined}
          onClose={() => setOpenNew(false)}
          onCreated={(w) => {
            setOpenNew(false);
            // Option A: go straight to builder
            openDetail(w.id);
            // Option B: stay and refresh list
            // invalidate();
          }}
        />
      )}
    </div>
  );
}
