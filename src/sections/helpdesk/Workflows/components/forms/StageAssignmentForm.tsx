import type { Stage } from "../../data/types";

export default function StageAssignmentForm({
  value,
  onChange,
}: {
  value: Stage;
  onChange: (patch: Partial<Stage>) => void;
}) {
  return (
    <div className="panel soft" style={{ display: "grid", gap: 10 }}>
      <label className="field">
        <span>Assigned role</span>
        <input
          value={value.role || ""}
          onChange={e => onChange({ role: e.target.value || undefined })}
          placeholder="e.g. Service Desk, IT Manager"
        />
      </label>

      <label className="field">
        <span>Specific assignees (comma-separated)</span>
        <input
          value={(value.assignees || []).join(", ")}
          onChange={e =>
            onChange({
              assignees: e.target.value
                .split(",")
                .map(s => s.trim())
                .filter(Boolean),
            })
          }
          placeholder="jane@example.com, brian@example.com"
        />
      </label>
    </div>
  );
}
