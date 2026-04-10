"use client";

import { memo, useCallback, useState, type DragEvent } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { ImageIcon, Upload, Download, Replace, X } from "lucide-react";
import { useCanvasStore } from "@/store/canvas.store";
import type { ImageNodeData } from "@/types/nodes";
import { NodeDeleteButton, NodeDuplicateButton } from "./NodeWrapper";
import { forceDownload } from "@/lib/download";

function ImageNodeComponent({ id, data, selected }: NodeProps) {
  const nodeData = data as unknown as ImageNodeData;
  const updateNodeData = useCanvasStore((s) => s.updateNodeData);
  const [expanded, setExpanded] = useState(false);
  const [dragging, setDragging] = useState(false);

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => { updateNodeData(id, { url, width: img.naturalWidth, height: img.naturalHeight, filename: file.name }); };
    img.src = url;
  }, [id, updateNodeData]);

  const handleDragOver = useCallback((e: DragEvent) => { e.preventDefault(); e.stopPropagation(); setDragging(true); }, []);
  const handleDragLeave = useCallback((e: DragEvent) => { e.preventDefault(); e.stopPropagation(); setDragging(false); }, []);

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
            : dragging
            ? "border-[var(--forja-amber)] bg-[var(--forja-amber)]/5"
            : "border-[var(--forja-border)]"
        }`}
        onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave}
      >
        {/* Header */}
        <div className="flex items-center gap-2 border-b border-[var(--forja-border)] px-3 py-2">
          <ImageIcon className="h-4 w-4 text-[var(--forja-amber)]" />
          <span className="text-xs font-medium text-[var(--forja-text)]">
            {nodeData.label || "Imagem"}
          </span>
          <NodeDuplicateButton nodeId={id} />
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
                <button className="rounded bg-black/70 p-1 hover:bg-black/90" onClick={(e) => { e.stopPropagation(); forceDownload(nodeData.url!, nodeData.filename); }}>
                  <Download className="h-3 w-3 text-[var(--forja-text)]" />
                </button>
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
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm" onClick={() => setExpanded(false)}>
          <div className="relative max-w-[90vw] max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
            <img src={nodeData.url} alt="" className="max-w-full max-h-[80vh] rounded-lg object-contain" />
          </div>
          <div className="flex items-center gap-3 mt-4">
            <button onClick={(e) => { e.stopPropagation(); forceDownload(nodeData.url!, nodeData.filename); }} className="flex items-center gap-2 rounded-lg bg-[var(--forja-ember)] px-5 py-2.5 text-sm font-medium text-white hover:bg-[var(--forja-ember-hover)] transition-colors">
              <Download className="h-4 w-4" /> Download
            </button>
            <button onClick={() => setExpanded(false)} className="flex items-center gap-2 rounded-lg bg-white/10 px-5 py-2.5 text-sm font-medium text-white hover:bg-white/20 transition-colors">
              <X className="h-4 w-4" /> Fechar
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export const ImageNode = memo(ImageNodeComponent);
