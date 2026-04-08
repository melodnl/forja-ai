"use client";

import { memo, useCallback, useState } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { ImageIcon, Upload, Download, Replace, X } from "lucide-react";
import { useCanvasStore } from "@/store/canvas.store";
import type { ImageNodeData } from "@/types/nodes";
import { NodeDeleteButton } from "./NodeWrapper";

function ImageNodeComponent({ id, data, selected }: NodeProps) {
  const nodeData = data as unknown as ImageNodeData;
  const updateNodeData = useCanvasStore((s) => s.updateNodeData);
  const [expanded, setExpanded] = useState(false);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        updateNodeData(id, {
          url,
          width: img.naturalWidth,
          height: img.naturalHeight,
          filename: file.name,
        });
      };
      img.src = url;
    },
    [id, updateNodeData]
  );

  // Determinar aspect ratio do card baseado na imagem
  const hasImage = !!nodeData.url;
  const isPortrait = nodeData.height && nodeData.width ? nodeData.height > nodeData.width : false;
  const isSquare = nodeData.height && nodeData.width ? Math.abs(nodeData.height - nodeData.width) < 50 : false;
  const nodeWidth = isPortrait ? "w-48" : isSquare ? "w-56" : "w-72";

  return (
    <>
      <div
        className={`group/node ${hasImage ? nodeWidth : "w-56"} rounded-lg border bg-[var(--canvas-node-bg)] transition-all duration-200 ${
          selected
            ? "border-[var(--forja-ember)] shadow-[0_0_24px_rgba(255,107,26,0.15)]"
            : "border-[var(--forja-border)]"
        }`}
      >
        {/* Header */}
        <div className="flex items-center gap-2 border-b border-[var(--forja-border)] px-3 py-2">
          <ImageIcon className="h-4 w-4 text-[var(--forja-amber)]" />
          <span className="text-xs font-medium text-[var(--forja-text)]">
            {nodeData.label || "Imagem"}
          </span>
          <NodeDeleteButton nodeId={id} />
        </div>

        {/* Body */}
        <div className="p-2">
          {nodeData.url ? (
            <div className="relative group cursor-pointer" onClick={() => setExpanded(true)}>
              <img
                src={nodeData.url}
                alt={nodeData.filename || "Preview"}
                className="w-full rounded-md object-contain"
              />
              <div className="absolute bottom-1 left-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] text-[var(--forja-text-muted)]">
                {nodeData.width}x{nodeData.height}
              </div>
              <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <label className="cursor-pointer rounded bg-black/70 p-1 hover:bg-black/90" onClick={(e) => e.stopPropagation()}>
                  <Replace className="h-3 w-3 text-[var(--forja-text)]" />
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                </label>
                <a href={nodeData.url} download={nodeData.filename} className="rounded bg-black/70 p-1 hover:bg-black/90" onClick={(e) => e.stopPropagation()}>
                  <Download className="h-3 w-3 text-[var(--forja-text)]" />
                </a>
              </div>
            </div>
          ) : (
            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed border-[var(--forja-border)] py-8 hover:border-[var(--forja-ember)] hover:bg-[var(--forja-bg-hover)] transition-all">
              <Upload className="h-6 w-6 text-[var(--forja-text-dim)]" />
              <span className="text-xs text-[var(--forja-text-dim)]">Arraste ou clique</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </label>
          )}
        </div>

        {/* Handles */}
        <Handle type="source" position={Position.Right}
          className="!h-3 !w-3 !rounded-full !border-2 !border-[var(--forja-border-strong)] !bg-[var(--forja-ember)]" />
      </div>

      {/* Fullscreen modal */}
      {expanded && nodeData.url && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-sm" onClick={() => setExpanded(false)}>
          <button onClick={() => setExpanded(false)} className="absolute top-4 right-4 rounded-full bg-white/10 p-2 hover:bg-white/20">
            <X className="h-5 w-5 text-white" />
          </button>
          <img src={nodeData.url} alt="" className="max-w-[90vw] max-h-[90vh] rounded-lg object-contain" onClick={(e) => e.stopPropagation()} />
          <div className="absolute bottom-6 flex gap-3">
            <a href={nodeData.url} download className="flex items-center gap-2 rounded-lg bg-[var(--forja-ember)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--forja-ember-hover)]">
              <Download className="h-4 w-4" /> Download
            </a>
          </div>
        </div>
      )}
    </>
  );
}

export const ImageNode = memo(ImageNodeComponent);
