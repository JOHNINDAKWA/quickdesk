import { FiGitBranch, FiPlus } from "react-icons/fi";
import "./EmptyState.css";

export default function EmptyState({
  icon = "flow",
  title,
  subtitle,
  cta,
}: {
  icon?: "flow";
  title: string;
  subtitle?: string;
  cta?: { label: string; onClick: () => void };
}) {
  return (
    <div className="wempty">
      <div className="wempty__icon">{icon === "flow" ? <FiGitBranch /> : null}</div>
      <h3>{title}</h3>
      {subtitle && <p className="text-muted">{subtitle}</p>}
      {cta && (
        <button className="btn btn-primary" onClick={cta.onClick}>
          <FiPlus /> {cta.label}
        </button>
      )}
    </div>
  );
}
