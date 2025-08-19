import QDSelect from "../../../../components/QDSelect";
import type { Option } from "./MyTickets";

type Filters = {
  search: string;
  status: Option[];
  priority: Option[];
  category: Option[];
  assignee: Option[];
  requester: Option[];
  channel: Option[];
  team: Option[];
  tags: Option[];
  sla: Option[];
  createdFrom?: string;
  createdTo?: string;
  sortBy: "updatedAt" | "createdAt" | "priority" | "status";
  sortDir: "asc" | "desc";
};

type FilterPanelProps = {
  filters: Filters;
  onChange: (next: Filters) => void;
  options: {
    status: Option[];
    priority: Option[];
    category: Option[];
    assignee: Option[];
    requester: Option[];
    channel: Option[];
    team: Option[];
    tags: Option[];
    sla: Option[];
  };
};

export function FilterPanel({ filters, onChange, options }: FilterPanelProps) {
  const set = (patch: Partial<Filters>) => onChange({ ...filters, ...patch });

  return (
    <div className="filters-side">
      <h4 className="filters-side__title">Filters</h4>

      <div className="filters-side__group">
        <label>Status</label>
        <QDSelect
          instanceId="fs-status"
          isMulti
          options={options.status}
          placeholder="Any status"
          value={filters.status}
          onChange={(v) => set({ status: v as Option[] })}
          compact
        />
      </div>

      <div className="filters-side__group">
        <label>Priority</label>
        <QDSelect
          instanceId="fs-priority"
          isMulti
          options={options.priority}
          placeholder="Any priority"
          value={filters.priority}
          onChange={(v) => set({ priority: v as Option[] })}
          compact
        />
      </div>

      <div className="filters-side__group">
        <label>Category</label>
        <QDSelect
          instanceId="fs-category"
          isMulti
          options={options.category}
          placeholder="Any category"
          value={filters.category}
          onChange={(v) => set({ category: v as Option[] })}
          compact
        />
      </div>

      <div className="filters-side__group">
        <label>Assigned to</label>
        <QDSelect
          instanceId="fs-assignee"
          isMulti
          options={options.assignee}
          placeholder="Anyone"
          value={filters.assignee}
          onChange={(v) => set({ assignee: v as Option[] })}
          compact
        />
      </div>

      <div className="filters-side__group">
        <label>Requester</label>
        <QDSelect
          instanceId="fs-requester"
          isMulti
          options={options.requester}
          placeholder="Any requester"
          value={filters.requester}
          onChange={(v) => set({ requester: v as Option[] })}
          compact
        />
      </div>

      <div className="filters-side__group">
        <label>Channel</label>
        <QDSelect
          instanceId="fs-channel"
          isMulti
          options={options.channel}
          placeholder="Any channel"
          value={filters.channel}
          onChange={(v) => set({ channel: v as Option[] })}
          compact
        />
      </div>

      <div className="filters-side__group">
        <label>Team</label>
        <QDSelect
          instanceId="fs-team"
          isMulti
          options={options.team}
          placeholder="Any team"
          value={filters.team}
          onChange={(v) => set({ team: v as Option[] })}
          compact
        />
      </div>

      <div className="filters-side__group">
        <label>Tags</label>
        <QDSelect
          instanceId="fs-tags"
          isMulti
          options={options.tags}
          placeholder="Any tag"
          value={filters.tags}
          onChange={(v) => set({ tags: v as Option[] })}
          compact
        />
      </div>

      <div className="filters-side__group">
        <label>SLA</label>
        <QDSelect
          instanceId="fs-sla"
          isMulti
          options={options.sla}
          placeholder="Any SLA state"
          value={filters.sla}
          onChange={(v) => set({ sla: v as Option[] })}
          compact
        />
      </div>

      <div className="filters-side__group">
        <label>Created</label>
        <div className="filters-side__dates">
          <input
            type="date"
            value={filters.createdFrom ?? ""}
            onChange={(e) => set({ createdFrom: e.target.value || undefined })}
            aria-label="Created from"
          />
          <span className="sep">–</span>
          <input
            type="date"
            value={filters.createdTo ?? ""}
            onChange={(e) => set({ createdTo: e.target.value || undefined })}
            aria-label="Created to"
          />
        </div>
      </div>

      <div className="filters-side__actions">
        <button
          className="btn"
          onClick={() =>
            onChange({
              search: "",
              status: [],
              priority: [],
              category: [],
              assignee: [],
              requester: [],
              channel: [],
              team: [],
              tags: [],
              sla: [],
              createdFrom: undefined,
              createdTo: undefined,
              sortBy: "updatedAt",
              sortDir: "desc",
            })
          }
        >
          Reset
        </button>
        <button className="btn btn-primary">Save View</button>
      </div>
    </div>
  );
}
