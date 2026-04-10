"use client";

import { memo, useCallback, useState, type DragEvent } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { ImagePlus, Upload, Download, Replace } from "lucide-react";
import { useCanvasStore } from "@/store/canvas.store";
import type { ReferenceNodeData } from "@/types/nodes";
import { NodeDeleteButton, NodeDuplicateButton } from "./NodeWrapper";
import { forceDownload } from "@/lib/download";

function ReferenceNodeComponent({ id, data, selected }: NodeProps) {
  const nodeData = data as unknown as ReferenceNodeData;
  const updateNodeData = useCanvasStore((s) => s.updateNodeData);
  const [editingLabel, setEditingLabel] = useState(false);
  const [dragging, setDragging] = useState(false);

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    updateNodeData(id, { url: URL.createObjectURL(file), filename: file.name, width: 0, height: 0 });
  }, [id, updateNodeData]);

  const handleDragOver = useCallback((e: DragEvent) => { e.preventDefault(); e.stopPropagation(); setDragging(true); }, []);
  const handleDragLeave = useCallback((e: DragEvent) => { e.preventDefault(); e.stopPropagation(); setDragging(false); }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const blobUrl = URL.createObjectURL(file);
      updateNodeData(id, { url: blobUrl, filename: file.name, width: 0, height: 0 });
    },
    [id, updateNodeData]
  );

  return (
    <div className={`group/node w-56 rounded-lg border bg-[var(--canvas-node-bg)] transition-all duration-200 ${selected ? "border-[var(--forja-info)] shadow-[0_0_24px_rgba(59,130,246,0.15)]" : "border-[var(--forja-border)]"}`}>
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-[var(--forja-border)] px-3 py-1.5">
        <ImagePlus className="h-3.5 w-3.5 text-[var(--forja-info)]" />
        <span className="text-[9px] font-medium uppercase tracking-wider text-[var(--forja-text-dim)]">Referência</span>
        {editingLabel ? (
          <input
            autoFocus
            value={nodeData.label || ""}
            onChange={(e) => updateNodeData(id, { label: e.target.value })}
            onBlur={() => setEditingLabel(false)}
            onKeyDown={(e) => { e.stopPropagation(); if (e.key === "Enter") setEditingLabel(false); }}
            className="nodrag ml-auto w-16 rounded border border-[var(--forja-border)] bg-[var(--forja-bg)] px-1 py-0.5 text-[10px] font-bold text-[var(--forja-info)] focus:outline-none focus:border-[var(--forja-info)]"
          />
        ) : (
          <button onClick={() => setEditingLabel(true)} className="ml-auto rounded px-1.5 py-0.5 text-[10px] font-bold text-[var(--forja-info)] hover:bg-[var(--forja-bg-hover)] transition-colors">
            {nodeData.label || "img1"}
          </button>
        )}
        <NodeDuplicateButton nodeId={id} />
        <NodeDeleteButton nodeId={id} />
      </div>

      {/* Body */}
      <div className={`p-2 transition-colors ${dragging ? "bg-[var(--forja-info)]/10" : ""}`}
        onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave}>
        {nodeData.url ? (
          <div className="group/img relative overflow-hidden rounded-md">
            <img src={nodeData.url} alt={nodeData.label} className="w-full rounded-md object-contain max-h-48" />
            <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover/img:opacity-100 transition-opacity">
              <label className="cursor-pointer rounded bg-black/70 p-1 hover:bg-black/90">
                <Replace className="h-3 w-3 text-white" />
                <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </label>
              <button className="rounded bg-black/70 p-1 hover:bg-black/90" onClick={() => forceDownload(nodeData.url!, nodeData.filename)}>
                <Download className="h-3 w-3 text-white" />
              </button>
            </div>
          </div>
        ) : (
          <label className="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-md border border-dashed border-[var(--forja-border)] py-6 hover:border-[var(--forja-info)] hover:bg-[var(--forja-bg-hover)] transition-all">
            <Upload className="h-5 w-5 text-[var(--forja-text-dim)]" />
            <span className="text-[10px] text-[var(--forja-text-dim)]">Upload referência</span>
            <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </label>
        )}
      </div>

      {/* Handle — source only */}
      <Handle type="source" position={Position.Right}
        className="!h-3 !w-3 !rounded-full !border-2 !border-[var(--forja-border-strong)] !bg-[var(--forja-info)]" />
    </div>
  );
}

export const ReferenceNode = memo(ReferenceNodeComponent);
