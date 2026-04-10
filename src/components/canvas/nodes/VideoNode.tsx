"use client";

import { memo, useState } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Video, Download, Play, X } from "lucide-react";
import type { VideoNodeData } from "@/types/nodes";
import { NodeDeleteButton, NodeDuplicateButton } from "./NodeWrapper";
import { forceDownload } from "@/lib/download";

function VideoNodeComponent({ id, data, selected }: NodeProps) {
  const nodeData = data as unknown as VideoNodeData;
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <div
        className={`group/node w-56 rounded-lg border bg-[var(--canvas-node-bg)] transition-all duration-200 ${
          selected
            ? "border-[var(--forja-ember)] shadow-[0_0_24px_rgba(255,107,26,0.15)]"
            : "border-[var(--forja-border)]"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--forja-border)] px-3 py-2">
          <div className="flex items-center gap-2">
            <Video className="h-4 w-4 text-[var(--forja-glow)]" />
            <span className="text-xs font-medium text-[var(--forja-text)]">
              {nodeData.label || "Vídeo"}
            </span>
          </div>
          {nodeData.duration && (
            <span className="text-[10px] text-[var(--forja-text-dim)]">{nodeData.duration}s</span>
          )}
          <NodeDuplicateButton nodeId={id} />
          <NodeDeleteButton nodeId={id} />
        </div>

        {/* Body */}
        <div className="p-2">
          {nodeData.url ? (
            <div className="relative group cursor-pointer" onClick={() => setExpanded(true)}>
              <video
                src={nodeData.url}
                className="w-full rounded-md bg-black"
                muted
                playsInline
                preload="metadata"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/60">
                  <Play className="h-5 w-5 text-white ml-0.5" />
                </div>
              </div>
              <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="rounded bg-black/70 p-1 hover:bg-black/90" onClick={(e) => { e.stopPropagation(); forceDownload(nodeData.url!); }}>
                  <Download className="h-3 w-3 text-white" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed border-[var(--forja-border)] py-10">
              <Play className="h-8 w-8 text-[var(--forja-text-dim)]" />
              <span className="text-xs text-[var(--forja-text-dim)]">Conecte um nó criativo</span>
            </div>
          )}
        </div>

        {/* Handles */}
        <Handle type="target" position={Position.Left}
          className="!h-3 !w-3 !rounded-full !border-2 !border-[var(--forja-border-strong)] !bg-[var(--forja-glow)]" />
        <Handle type="source" position={Position.Right}
          className="!h-3 !w-3 !rounded-full !border-2 !border-[var(--forja-border-strong)] !bg-[var(--forja-ember)]" />
      </div>

      {/* Fullscreen modal */}
      {expanded && nodeData.url && (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm" onClick={() => setExpanded(false)}>
          <div className="relative flex flex-col items-center gap-4 max-w-[90vw] max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
            <video src={nodeData.url} controls autoPlay className="max-w-full max-h-[80vh] rounded-lg" />
          </div>
          <div className="flex items-center gap-3 mt-4">
            <button onClick={(e) => { e.stopPropagation(); forceDownload(nodeData.url!); }} className="flex items-center gap-2 rounded-lg bg-[var(--forja-ember)] px-5 py-2.5 text-sm font-medium text-white hover:bg-[var(--forja-ember-hover)] transition-colors">
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

export const VideoNode = memo(VideoNodeComponent);
