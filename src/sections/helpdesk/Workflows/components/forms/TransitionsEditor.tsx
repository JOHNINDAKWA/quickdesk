import { useMemo } from "react";
import { FiPlus, FiTrash2 } from "react-icons/fi";
import type { Stage, Transition } from "../../data/types";

const nid = () => Math.random().toString(36).slice(2, 9);

export default function TransitionsEditor({
  stage,
  candidates,
  onChange,
}: {
  stage: Stage;
  candidates: { id: string; name: string }[];
  onChange: (patch: Partial<Stage>) => void;
}) {
  const options = useMemo(
    () => candidates.filter(c => c.id !== stage.id),
    [candidates, stage.id]
  );

  function update(i: number, patch: Partial<Transition>) {
    const list = stage.transitions.map((t, idx) => (idx === i ? { ...t, ...patch } : t));
    onChange({ transitions: list });
  }

  function add() {
    onChange({
      transitions: [...stage.transitions, { id: nid(), name: "Next", to: options[0]?.id || stage.id }],
    });
  }
  function del(i: number) {
    const list = stage.transitions.filter((_, idx) => idx !== i);
    onChange({ transitions: list });
  }

  return (
    <div className="panel soft" style={{ display: "grid", gap: 10 }}>
      {stage.transitions.length === 0 && (
        <div className="text-muted" style={{ fontSize: 13 }}>No transitions yet.</div>
      )}

      {stage.transitions.map((t, i) => (
        <div key={t.id} className="grid2" style={{ alignItems: "end", gap: 10 }}>
          <label className="field">
            <span>Label</span>
            <input value={t.name} onChange={e => update(i, { name: e.target.value })} />
          </label>
          <label className="field">
            <span>Go to</span>
            <select value={t.to} onChange={e => update(i, { to: e.target.value })}>
              {options.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          </label>
          <label className="field" style={{ gridColumn: "1 / -1" }}>
            <span>Condition (optional)</span>
            <input value={t.condition || ""} onChange={e => update(i, { condition: e.target.value || undefined })} placeholder='e.g. priority = "low"' />
          </label>
          <div style={{ gridColumn: "1 / -1", textAlign: "right" }}>
            <button className="btn" onClick={() => del(i)}><FiTrash2 /> Remove</button>
          </div>
        </div>
      ))}

      <div><button className="btn btn-primary" onClick={add}><FiPlus /> Add Transition</button></div>
    </div>
  );
}
