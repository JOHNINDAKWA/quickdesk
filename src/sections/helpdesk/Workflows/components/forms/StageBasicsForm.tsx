import type { Stage, StageType } from "../../data/types";

const TYPES: { label: string; value: StageType }[] = [
  { label: "Start", value: "start" },
  { label: "Stage", value: "stage" },
  { label: "Approval", value: "approval" },
  { label: "End", value: "end" },
];

export default function StageBasicsForm({
  value,
  onChange,
}: {
  value: Stage;
  onChange: (patch: Partial<Stage>) => void;
}) {
  return (
    <div className="panel soft" style={{ display: "grid", gap: 10 }}>
      <label className="field">
        <span>Stage name</span>
        <input value={value.name} onChange={e => onChange({ name: e.target.value })} placeholder="e.g. Triage" />
      </label>

      <label className="field">
        <span>Type</span>
        <select value={value.type} onChange={e => onChange({ type: e.target.value as StageType })}>
          {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </label>

      <label className="field">
        <span>Description</span>
        <textarea rows={3} value={value.description || ""} onChange={e => onChange({ description: e.target.value })} placeholder="Optional notes about this stage" />
      </label>

      <label className="field">
        <span>Entry condition (optional)</span>
        <input
          value={value.entryCondition || ""}
          onChange={e => onChange({ entryCondition: e.target.value || null })}
          placeholder='e.g. priority = "high"'
        />
      </label>
    </div>
  );
}
