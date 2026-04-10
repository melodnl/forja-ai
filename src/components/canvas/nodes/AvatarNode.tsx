"use client";

import { memo, useCallback, useState, type DragEvent } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { UserCircle, Upload, Replace, ChevronDown } from "lucide-react";
import { useCanvasStore } from "@/store/canvas.store";
import { NodeDeleteButton, NodeDuplicateButton } from "./NodeWrapper";

const PRESET_AVATARS = [
  { name: "Sem avatar", url: "" },
];

function AvatarNodeComponent({ id, data, selected }: NodeProps) {
  const nodeData = data as Record<string, unknown>;
  const updateNodeData = useCanvasStore((s) => s.updateNodeData);
  const [editingLabel, setEditingLabel] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const [dragging, setDragging] = useState(false);

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const blobUrl = URL.createObjectURL(file);
    updateNodeData(id, { url: blobUrl, filename: file.name });
  }, [id, updateNodeData]);

  const handleDragOver = useCallback((e: DragEvent) => { e.preventDefault(); e.stopPropagation(); setDragging(true); }, []);
  const handleDragLeave = useCallback((e: DragEvent) => { e.preventDefault(); e.stopPropagation(); setDragging(false); }, []);

  const label = (nodeData.label as string) || "avatar1";
  const url = (nodeData.url as string) || "";

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const blobUrl = URL.createObjectURL(file);
      updateNodeData(id, { url: blobUrl, filename: file.name });
    },
    [id, updateNodeData]
  );

  return (
    <div className={`group/node w-56 rounded-lg border bg-[var(--canvas-node-bg)] transition-all duration-200 ${selected ? "border-[var(--forja-spark)] shadow-[0_0_24px_rgba(168,85,247,0.15)]" : "border-[var(--forja-border)]"}`}>
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-[var(--forja-border)] px-3 py-1.5">
        <UserCircle className="h-3.5 w-3.5 text-[var(--forja-spark)]" />
        <span className="text-[9px] font-medium uppercase tracking-wider text-[var(--forja-text-dim)]">Avatar</span>
        {editingLabel ? (
          <input
            autoFocus
            value={label}
            onChange={(e) => updateNodeData(id, { label: e.target.value })}
            onBlur={() => setEditingLabel(false)}
            onKeyDown={(e) => { e.stopPropagation(); if (e.key === "Enter") setEditingLabel(false); }}
            className="nodrag ml-auto w-20 rounded border border-[var(--forja-border)] bg-[var(--forja-bg)] px-1 py-0.5 text-[10px] font-bold text-[var(--forja-spark)] focus:outline-none focus:border-[var(--forja-spark)]"
          />
        ) : (
          <button onClick={() => setEditingLabel(true)} className="ml-auto rounded px-1.5 py-0.5 text-[10px] font-bold text-[var(--forja-spark)] hover:bg-[var(--forja-bg-hover)] transition-colors">
            {label}
          </button>
        )}
        <NodeDuplicateButton nodeId={id} />
        <NodeDeleteButton nodeId={id} />
      </div>

      {/* Body */}
      <div className={`p-2 flex flex-col gap-2 transition-colors ${dragging ? "bg-[var(--forja-spark)]/10" : ""}`}
        onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave}>
        {/* Avatar preview */}
        {url ? (
          <div className="group/img relative mx-auto">
            <div className="w-28 h-28 rounded-full overflow-hidden border-2 border-[var(--forja-spark)]/30">
              <img src={url} alt={label} className="w-full h-full object-cover" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity">
              <label className="cursor-pointer rounded-full bg-black/60 p-2 hover:bg-black/80">
                <Replace className="h-4 w-4 text-white" />
                <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </label>
            </div>
          </div>
        ) : (
          <label className="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-full border-2 border-dashed border-[var(--forja-border)] w-28 h-28 mx-auto hover:border-[var(--forja-spark)] hover:bg-[var(--forja-bg-hover)] transition-all">
            <Upload className="h-5 w-5 text-[var(--forja-text-dim)]" />
            <span className="text-[9px] text-[var(--forja-text-dim)]">Upload</span>
            <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </label>
        )}

        {/* Presets dropdown */}
        <div className="relative">
          <button onClick={() => setShowPresets(!showPresets)}
            className="flex w-full items-center justify-between rounded-md border border-[var(--forja-border)] bg-[var(--forja-bg)] px-2 py-1.5 text-[10px] text-[var(--forja-text-muted)] hover:border-[var(--forja-spark)] transition-colors">
            <span>{url ? label : "Selecionar avatar"}</span>
            <ChevronDown className="h-3 w-3" />
          </button>
          {showPresets && (
            <div className="absolute left-0 top-full mt-1 w-full rounded-lg border border-[var(--forja-border)] bg-[var(--forja-bg-overlay)] py-1 shadow-xl z-30">
              <button onClick={() => { setShowPresets(false); }}
                className="flex w-full px-3 py-1.5 text-left text-[10px] text-[var(--forja-text-dim)] hover:bg-[var(--forja-bg-hover)]">
                Upload personalizado ↑
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Handle — source only */}
      <Handle type="source" position={Position.Right}
        className="!h-3 !w-3 !rounded-full !border-2 !border-[var(--forja-border-strong)] !bg-[var(--forja-spark)]" />
    </div>
  );
}

export const AvatarNode = memo(AvatarNodeComponent);
