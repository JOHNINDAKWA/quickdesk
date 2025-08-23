import { useState } from "react";
import { FiChevronDown, FiChevronRight, FiPlus } from "react-icons/fi";
import type { Department, WorkflowSummary } from "../../data/types";
import WorkflowCard from "../WorkflowCard/WorkflowCard";
import "./DepartmentGroup.css";

export default function DepartmentGroup({
  department,
  items,
  onOpen,
  onCreate,
}: {
  department: Department;
  items: WorkflowSummary[];
  onOpen: (id: string) => void;
  onCreate: () => void;
}) {
  const [open, setOpen] = useState(true);

  return (
    <section className="dg">
      <header className="dg__head">
        <button className="dg__toggle" onClick={() => setOpen(o => !o)}>
          {open ? <FiChevronDown /> : <FiChevronRight />}
        </button>
        <h3 className="dg__title">{department.name}</h3>
        <span className="dg__count">{items.length}</span>
        <div className="dg__spacer" />
        <button className="btn" onClick={onCreate}><FiPlus /> New in {department.name}</button>
      </header>

      {open && (
        items.length ? (
          <div className="dg__grid">
            {items.map(w => (
              <WorkflowCard key={w.id} wf={w} onOpen={() => onOpen(w.id)} />
            ))}
          </div>
        ) : (
          <div className="dg__empty">No workflows in this department yet.</div>
        )
      )}
    </section>
  );
}
