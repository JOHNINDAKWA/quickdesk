import { useState } from "react";
import { FiArrowUp, FiArrowDown, FiCopy, FiTrash2, FiPlus, FiAlertTriangle, FiCheckCircle } from "react-icons/fi";
import type { Stage, StageType } from "../../data/types";
import StageNode from "../StageNode/StageNode";
import "./StageBoard.css";

export default function StageBoard({
  stages,
  selectedId,
  onSelect,
  onAddAfter,
  onDuplicate,
  onDelete,
  onMove,
  onReorder,
}: {
  stages: Stage[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAddAfter: (afterId: string | null, type: StageType) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, dir: "up" | "down") => void;
  onReorder?: (fromIndex: number, toIndex: number) => void;
}) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  function handleDragStart(i: number) {
    setDragIndex(i);
  }
  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
  }
  function handleDrop(i: number) {
    if (dragIndex == null || dragIndex === i) return;
    onReorder?.(dragIndex, i);
    setDragIndex(null);
  }

  return (
    <div className="sb-root panel">
      <div className="sb-head">
        <div className="lh">
          <div className="stit">Stages</div>
          <div className="sub">
            Define the path your ticket follows. Click a stage to edit details. Drag to reorder.
          </div>
        </div>
        <div className="rh">
          <button className="btn" onClick={() => onAddAfter(null, "stage")}><FiPlus /> Add Stage</button>
        </div>
      </div>

      <ol className="sb-list">
        {stages.map((s, i) => {
          const isSel = s.id === selectedId;
          const draggable = s.type !== "start" && s.type !== "end"; // keep start/end fixed in place
          return (
            <li
              key={s.id}
              className={`sb-item ${isSel ? "is-selected" : ""} ${dragIndex===i ? "dragging" : ""}`}
              draggable={draggable}
              onDragStart={() => draggable && handleDragStart(i)}
              onDragOver={handleDragOver}
              onDrop={() => draggable && handleDrop(i)}
            >
              <StageNode
                stage={s}
                index={i}
                selected={isSel}
                onClick={() => onSelect(s.id)}
              />

              <div className="sb-actions">
                <button className="iconbtn" onClick={() => onMove(s.id, "up")} title="Move up" disabled={i === 0}><FiArrowUp /></button>
                <button className="iconbtn" onClick={() => onMove(s.id, "down")} title="Move down" disabled={i === stages.length - 1}><FiArrowDown /></button>
                <button className="iconbtn" onClick={() => onDuplicate(s.id)} title="Duplicate"><FiCopy /></button>
                <button className="iconbtn" onClick={() => onDelete(s.id)} title="Delete" disabled={s.type === "start" || s.type === "end"}><FiTrash2 /></button>
              </div>

              {i < stages.length - 1 && (
                <div className="sb-connector">
                  <span className="line" />
                  <span className="tip">
                    <FiCheckCircle /> default
                  </span>
                </div>
              )}
            </li>
          );
        })}
      </ol>

      <div className="sb-foot">
        <FiAlertTriangle />
        <span className="muted">Tip: Keep <b>Start</b> at the top and <b>End</b> last.</span>
      </div>
    </div>
  );
}
