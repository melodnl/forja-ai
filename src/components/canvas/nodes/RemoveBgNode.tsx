"use client";

import { memo, useCallback, useState } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Eraser, Loader2, CheckCircle } from "lucide-react";
import { useCanvasStore } from "@/store/canvas.store";
import { useNodeInputs } from "@/hooks/useNodeConnections";
import { toast } from "sonner";
import { NodeDeleteButton } from "./NodeWrapper";

function RemoveBgNodeComponent({ id, data, selected }: NodeProps) {
  const updateNodeData = useCanvasStore((s) => s.updateNodeData);
  const { imageUrls } = useNodeInputs(id);
  const [processing, setProcessing] = useState(false);
  const outputUrl = data.outputUrl as string | undefined;
  const connectedImage = imageUrls[0];

  const handleProcess = useCallback(async () => {
    if (!connectedImage) {
      toast.error("Conecte uma imagem primeiro");
      return;
    }
    setProcessing(true);
    try {
      const res = await fetch("/api/generate/remove-bg", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: connectedImage, nodeId: id }),
      });
      const result = await res.json();
      if (!res.ok) {
        toast.error(result.error || "Erro ao remover fundo");
        return;
      }
      updateNodeData(id, { outputUrl: result.url });
      toast.success("Fundo removido!");
    } catch {
      toast.error("Erro ao conectar com o servidor");
    } finally {
      setProcessing(false);
    }
  }, [id, updateNodeData]);

  return (
    <div className={`group/node w-56 rounded-lg border bg-[var(--canvas-node-bg)] transition-all duration-200 ${
      selected ? "border-[var(--forja-ember)] shadow-[0_0_24px_rgba(255,107,26,0.15)]" : "border-[var(--forja-border)]"
    }`}>
      <div className="flex items-center gap-2 border-b border-[var(--forja-border)] px-3 py-2">
        <Eraser className="h-4 w-4 text-[var(--forja-warning)]" />
        <span className="text-xs font-medium text-[var(--forja-text)]">Remover Fundo</span>
        <NodeDeleteButton nodeId={id} />
      </div>
      <div className="flex flex-col gap-3 p-3">
        {outputUrl ? (
          <div className="relative">
            <img src={outputUrl} alt="Sem fundo" className="w-full rounded-md max-h-32 object-contain bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiI+PHJlY3Qgd2lkdGg9IjgiIGhlaWdodD0iOCIgZmlsbD0iIzJhMjQyMCIvPjxyZWN0IHg9IjgiIHk9IjgiIHdpZHRoPSI4IiBoZWlnaHQ9IjgiIGZpbGw9IiMyYTI0MjAiLz48L3N2Zz4=')]" />
            <div className="flex items-center gap-1.5 mt-2 text-[var(--forja-success)] text-xs">
              <CheckCircle className="h-3.5 w-3.5" />
              Concluído
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-6 text-[var(--forja-text-dim)]">
            <Eraser className="h-8 w-8" />
            <span className="text-xs">Conecte uma imagem</span>
          </div>
        )}

        <button
          onClick={handleProcess}
          disabled={processing}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--forja-warning)] py-2 text-sm font-medium text-[var(--forja-bg)] transition-all duration-200 hover:brightness-110 disabled:opacity-50"
        >
          {processing ? <><Loader2 className="h-4 w-4 animate-spin" /> Processando...</> : <><Eraser className="h-4 w-4" /> Remover Fundo</>}
        </button>
      </div>
      <Handle type="target" position={Position.Left} className="!h-3 !w-3 !rounded-full !border-2 !border-[var(--forja-border-strong)] !bg-[var(--forja-warning)]" />
      <Handle type="source" position={Position.Right} className="!h-3 !w-3 !rounded-full !border-2 !border-[var(--forja-border-strong)] !bg-[var(--forja-ember)]" />
    </div>
  );
}

export const RemoveBgNode = memo(RemoveBgNodeComponent);
