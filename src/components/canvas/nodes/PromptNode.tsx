"use client";

import { memo, useCallback, useState } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Type, Sparkles, Loader2 } from "lucide-react";
import { useCanvasStore } from "@/store/canvas.store";
import { toast } from "sonner";
import type { PromptNodeData } from "@/types/nodes";
import { NodeDeleteButton } from "./NodeWrapper";

function PromptNodeComponent({ id, data, selected }: NodeProps) {
  const nodeData = data as unknown as PromptNodeData;
  const updateNodeData = useCanvasStore((s) => s.updateNodeData);
  const [enhancing, setEnhancing] = useState(false);

  const handleTextChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      updateNodeData(id, { text: e.target.value });
    },
    [id, updateNodeData]
  );

  const handleEnhance = useCallback(async () => {
    if (!nodeData.text || nodeData.text.trim().length < 3) {
      toast.error("Escreva algo antes de aprimorar");
      return;
    }
    setEnhancing(true);
    try {
      const res = await fetch("/api/generate/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: nodeData.text }),
      });
      const result = await res.json();
      if (!res.ok) {
        toast.error(result.error || "Erro ao aprimorar");
        return;
      }
      updateNodeData(id, { text: result.enhanced });
      toast.success("Prompt aprimorado!");
    } catch {
      toast.error("Erro ao conectar com o servidor");
    } finally {
      setEnhancing(false);
    }
  }, [id, nodeData.text, updateNodeData]);

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
          <Type className="h-4 w-4 text-[var(--forja-info)]" />
          <span className="text-xs font-medium text-[var(--forja-text)]">
            {nodeData.label || "Prompt"}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleEnhance}
            disabled={enhancing}
            className="flex items-center gap-1 rounded px-2 py-0.5 text-[10px] text-[var(--forja-ember)] hover:bg-[var(--forja-bg-hover)] transition-colors disabled:opacity-50"
            title="Aprimorar com IA"
          >
            {enhancing ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Sparkles className="h-3 w-3" />
            )}
            Aprimorar
          </button>
          <NodeDeleteButton nodeId={id} />
        </div>
      </div>

      {/* Body */}
      <div className="p-3">
        <textarea
          value={nodeData.text || ""}
          onChange={handleTextChange}
          placeholder="Descreva o que você quer criar..."
          rows={4}
          className="w-full resize-none rounded-md border border-[var(--forja-border)] bg-[var(--forja-bg)] px-3 py-2 text-xs text-[var(--forja-text)] placeholder:text-[var(--forja-text-dim)] focus:border-[var(--forja-ember)] focus:outline-none transition-colors"
        />
        <div className="mt-1 text-right text-[10px] text-[var(--forja-text-dim)]">
          {(nodeData.text || "").length} caracteres
        </div>
      </div>

      {/* Handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="!h-3 !w-3 !rounded-full !border-2 !border-[var(--forja-border-strong)] !bg-[var(--forja-info)]"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!h-3 !w-3 !rounded-full !border-2 !border-[var(--forja-border-strong)] !bg-[var(--forja-ember)]"
      />
    </div>
  );
}

export const PromptNode = memo(PromptNodeComponent);
