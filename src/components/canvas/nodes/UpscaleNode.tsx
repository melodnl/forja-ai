"use client";

import { memo, useCallback, useState } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { ZoomIn, Loader2, CheckCircle } from "lucide-react";
import { useCanvasStore } from "@/store/canvas.store";
import { useNodeInputs } from "@/hooks/useNodeConnections";
import { toast } from "sonner";
import { NodeDeleteButton, NodeDuplicateButton } from "./NodeWrapper";

function UpscaleNodeComponent({ id, data, selected }: NodeProps) {
  const updateNodeData = useCanvasStore((s) => s.updateNodeData);
  const { imageUrls } = useNodeInputs(id);
  const [processing, setProcessing] = useState(false);
  const scale = (data.scale as string) || "2x";
  const outputUrl = data.outputUrl as string | undefined;
  const connectedImage = imageUrls[0];

  const handleProcess = useCallback(async () => {
    if (!connectedImage) {
      toast.error("Conecte uma imagem primeiro");
      return;
    }
    setProcessing(true);
    try {
      const res = await fetch("/api/generate/upscale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scale, imageUrl: connectedImage, nodeId: id }),
      });
      const result = await res.json();
      if (!res.ok) {
        toast.error(result.error || "Erro no upscale");
        return;
      }
      updateNodeData(id, { outputUrl: result.url, outputWidth: result.width, outputHeight: result.height });
      toast.success("Upscale concluído!");
    } catch {
      toast.error("Erro ao conectar com o servidor");
    } finally {
      setProcessing(false);
    }
  }, [id, scale, updateNodeData]);

  return (
    <div className={`group/node w-56 rounded-lg border bg-[var(--canvas-node-bg)] transition-all duration-200 ${
      selected ? "border-[var(--forja-ember)] shadow-[0_0_24px_rgba(255,107,26,0.15)]" : "border-[var(--forja-border)]"
    }`}>
      <div className="flex items-center gap-2 border-b border-[var(--forja-border)] px-3 py-2">
        <ZoomIn className="h-4 w-4 text-[var(--forja-amber)]" />
        <span className="text-xs font-medium text-[var(--forja-text)]">Upscale</span>
        <NodeDuplicateButton nodeId={id} />
        <NodeDeleteButton nodeId={id} />
      </div>
      <div className="flex flex-col gap-3 p-3">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-medium text-[var(--forja-text-muted)]">Escala</label>
          <select
            value={scale}
            onChange={(e) => updateNodeData(id, { scale: e.target.value })}
            className="rounded-md border border-[var(--forja-border)] bg-[var(--forja-bg)] px-2 py-1.5 text-xs text-[var(--forja-text)] focus:border-[var(--forja-ember)] focus:outline-none"
          >
            <option value="2x">2x</option>
            <option value="4x">4x</option>
          </select>
        </div>

        {outputUrl && (
          <div className="flex items-center gap-1.5 text-[var(--forja-success)] text-xs">
            <CheckCircle className="h-3.5 w-3.5" />
            <span>Concluído</span>
          </div>
        )}

        <button
          onClick={handleProcess}
          disabled={processing}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--forja-amber)] py-2 text-sm font-medium text-[var(--forja-bg)] transition-all duration-200 hover:brightness-110 disabled:opacity-50"
        >
          {processing ? <><Loader2 className="h-4 w-4 animate-spin" /> Processando...</> : <><ZoomIn className="h-4 w-4" /> Processar</>}
        </button>
      </div>
      <Handle type="target" position={Position.Left} className="!h-3 !w-3 !rounded-full !border-2 !border-[var(--forja-border-strong)] !bg-[var(--forja-amber)]" />
      <Handle type="source" position={Position.Right} className="!h-3 !w-3 !rounded-full !border-2 !border-[var(--forja-border-strong)] !bg-[var(--forja-ember)]" />
    </div>
  );
}

export const UpscaleNode = memo(UpscaleNodeComponent);
