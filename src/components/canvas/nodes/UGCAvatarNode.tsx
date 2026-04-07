"use client";

import { memo, useCallback, useState } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { UserCircle, Loader2, Play } from "lucide-react";
import { useCanvasStore } from "@/store/canvas.store";
import { toast } from "sonner";
import { NodeDeleteButton } from "./NodeWrapper";

const MODELS = [
  { value: "sora-2", label: "Sora 2" },
  { value: "veo-3", label: "Veo 3" },
];

const DURATIONS = ["5s", "10s", "15s", "30s"];

function UGCAvatarNodeComponent({ id, data, selected }: NodeProps) {
  const updateNodeData = useCanvasStore((s) => s.updateNodeData);
  const [generating, setGenerating] = useState(false);
  const model = (data.model as string) || "sora-2";
  const duration = (data.duration as string) || "10s";
  const outputUrl = data.outputUrl as string | undefined;

  const handleGenerate = useCallback(async () => {
    setGenerating(true);
    toast.info("Geração de UGC Avatar iniciada...");
    // Usa mesma API de vídeo com params específicos
    try {
      const res = await fetch("/api/generate/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          prompt: `UGC avatar talking head, duration ${duration}`,
          nodeId: id,
        }),
      });
      const result = await res.json();
      if (!res.ok) {
        toast.error(result.error || "Erro na geração");
        return;
      }
      updateNodeData(id, { generationId: result.generationId });
    } catch {
      toast.error("Erro ao conectar com o servidor");
    } finally {
      setGenerating(false);
    }
  }, [id, model, duration, updateNodeData]);

  return (
    <div className={`group/node w-64 rounded-lg border bg-[var(--canvas-node-bg)] transition-all duration-200 ${
      selected ? "border-[var(--forja-ember)] shadow-[0_0_24px_rgba(255,107,26,0.15)]" : "border-[var(--forja-border)]"
    }`}>
      <div className="flex items-center gap-2 border-b border-[var(--forja-border)] px-3 py-2">
        <UserCircle className="h-4 w-4 text-[var(--forja-spark)]" />
        <span className="text-xs font-medium text-[var(--forja-text)]">UGC Avatar</span>
        <NodeDeleteButton nodeId={id} />
      </div>
      <div className="flex flex-col gap-2.5 p-3">
        {/* Modelo */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-medium text-[var(--forja-text-muted)]">Modelo lip sync</label>
          <select
            value={model}
            onChange={(e) => updateNodeData(id, { model: e.target.value })}
            className="rounded-md border border-[var(--forja-border)] bg-[var(--forja-bg)] px-2 py-1.5 text-xs text-[var(--forja-text)] focus:border-[var(--forja-ember)] focus:outline-none"
          >
            {MODELS.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>

        {/* Duração */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-medium text-[var(--forja-text-muted)]">Duração</label>
          <select
            value={duration}
            onChange={(e) => updateNodeData(id, { duration: e.target.value })}
            className="rounded-md border border-[var(--forja-border)] bg-[var(--forja-bg)] px-2 py-1.5 text-xs text-[var(--forja-text)] focus:border-[var(--forja-ember)] focus:outline-none"
          >
            {DURATIONS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        {/* Output */}
        {outputUrl ? (
          <video src={outputUrl} controls className="w-full rounded-md max-h-36 bg-black" />
        ) : (
          <div className="flex flex-col items-center gap-2 rounded-md border border-dashed border-[var(--forja-border)] py-8">
            <Play className="h-6 w-6 text-[var(--forja-text-dim)]" />
            <span className="text-[10px] text-[var(--forja-text-dim)]">Conecte rosto + áudio</span>
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={generating}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--forja-spark)] py-2 text-sm font-medium text-white transition-all duration-200 hover:brightness-110 disabled:opacity-50"
        >
          {generating ? <><Loader2 className="h-4 w-4 animate-spin" /> Gerando...</> : <><UserCircle className="h-4 w-4" /> Gerar UGC</>}
        </button>
      </div>
      <Handle type="target" position={Position.Left} id="face" style={{ top: "35%" }}
        className="!h-3 !w-3 !rounded-full !border-2 !border-[var(--forja-border-strong)] !bg-[var(--forja-amber)]" />
      <Handle type="target" position={Position.Left} id="audio" style={{ top: "65%" }}
        className="!h-3 !w-3 !rounded-full !border-2 !border-[var(--forja-border-strong)] !bg-[var(--forja-success)]" />
      <Handle type="source" position={Position.Right}
        className="!h-3 !w-3 !rounded-full !border-2 !border-[var(--forja-border-strong)] !bg-[var(--forja-ember)]" />
    </div>
  );
}

export const UGCAvatarNode = memo(UGCAvatarNodeComponent);
