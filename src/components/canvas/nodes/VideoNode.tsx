"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Video, Download, Play } from "lucide-react";
import type { VideoNodeData } from "@/types/nodes";
import { NodeDeleteButton } from "./NodeWrapper";

function VideoNodeComponent({ id, data, selected }: NodeProps) {
  const nodeData = data as unknown as VideoNodeData;

  return (
    <div
      className={`group/node w-72 rounded-lg border bg-[var(--canvas-node-bg)] transition-all duration-200 ${
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
          <span className="text-[10px] text-[var(--forja-text-dim)]">
            {nodeData.duration}s
          </span>
        )}
        <NodeDeleteButton nodeId={id} />
      </div>

      {/* Body */}
      <div className="p-3">
        {nodeData.url ? (
          <div className="relative group">
            <video
              src={nodeData.url}
              controls
              className="w-full rounded-md max-h-44 bg-black"
            />
            <a
              href={nodeData.url}
              download
              className="absolute top-1 right-1 rounded bg-black/70 p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/90"
            >
              <Download className="h-3 w-3 text-[var(--forja-text)]" />
            </a>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed border-[var(--forja-border)] py-10">
            <Play className="h-8 w-8 text-[var(--forja-text-dim)]" />
            <span className="text-xs text-[var(--forja-text-dim)]">
              Conecte um nó criativo
            </span>
          </div>
        )}
      </div>

      {/* Handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="!h-3 !w-3 !rounded-full !border-2 !border-[var(--forja-border-strong)] !bg-[var(--forja-glow)]"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!h-3 !w-3 !rounded-full !border-2 !border-[var(--forja-border-strong)] !bg-[var(--forja-ember)]"
      />
    </div>
  );
}

export const VideoNode = memo(VideoNodeComponent);
