"use client";

import { memo, useCallback, useRef, useState } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Mic, Loader2, Play, Pause } from "lucide-react";
import { useCanvasStore } from "@/store/canvas.store";
import { toast } from "sonner";
import type { VoiceNodeData } from "@/types/nodes";
import { NodeDeleteButton, stopNodeKeyCapture } from "./NodeWrapper";

const PROVIDERS = [
  { value: "elevenlabs", label: "ElevenLabs" },
  { value: "fish-audio", label: "Fish Audio" },
];

function VoiceNodeComponent({ id, data, selected }: NodeProps) {
  const nodeData = data as unknown as VoiceNodeData;
  const updateNodeData = useCanvasStore((s) => s.updateNodeData);
  const [generating, setGenerating] = useState(false);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleChange = useCallback(
    (field: string, value: string | number) => {
      updateNodeData(id, { [field]: value });
    },
    [id, updateNodeData]
  );

  const handleGenerate = useCallback(async () => {
    if (!nodeData.text) {
      toast.error("Insira um texto para gerar voz");
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch("/api/generate/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: nodeData.provider || "elevenlabs",
          voice: nodeData.voice || "",
          text: nodeData.text,
          stability: nodeData.stability ?? 0.5,
          similarity: nodeData.similarity ?? 0.75,
        }),
      });
      const result = await res.json();
      if (!res.ok) {
        toast.error(result.error || "Erro na geração de voz");
        return;
      }
      updateNodeData(id, { url: result.url, duration: result.duration });
      toast.success("Voz gerada!");
    } catch {
      toast.error("Erro ao conectar com o servidor");
    } finally {
      setGenerating(false);
    }
  }, [id, nodeData, updateNodeData]);

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setPlaying(!playing);
  }, [playing]);

  return (
    <div
      onKeyDown={stopNodeKeyCapture}
      className={`group/node w-72 rounded-lg border bg-[var(--canvas-node-bg)] transition-all duration-200 ${
        selected
          ? "border-[var(--forja-ember)] shadow-[0_0_24px_rgba(255,107,26,0.15)]"
          : "border-[var(--forja-border)]"
      }`}
    >
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-[var(--forja-border)] px-3 py-2">
        <Mic className="h-4 w-4 text-[var(--forja-success)]" />
        <span className="text-xs font-medium text-[var(--forja-text)]">
          {nodeData.label || "Voz"}
        </span>
        <NodeDeleteButton nodeId={id} />
      </div>

      {/* Body */}
      <div className="flex flex-col gap-2.5 p-3">
        {/* Provider */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-medium text-[var(--forja-text-muted)]">Provedor</label>
          <select
            value={nodeData.provider || "elevenlabs"}
            onChange={(e) => handleChange("provider", e.target.value)}
            className="rounded-md border border-[var(--forja-border)] bg-[var(--forja-bg)] px-2 py-1.5 text-xs text-[var(--forja-text)] focus:border-[var(--forja-ember)] focus:outline-none"
          >
            {PROVIDERS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>

        {/* Voice ID */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-medium text-[var(--forja-text-muted)]">Voice ID</label>
          <input
            value={nodeData.voice || ""}
            onChange={(e) => handleChange("voice", e.target.value)}
            onKeyDown={(e) => e.stopPropagation()}
            placeholder="ID da voz..."
            className="nodrag nowheel rounded-md border border-[var(--forja-border)] bg-[var(--forja-bg)] px-2 py-1.5 text-xs text-[var(--forja-text)] placeholder:text-[var(--forja-text-dim)] focus:border-[var(--forja-ember)] focus:outline-none"
          />
        </div>

        {/* Sliders */}
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-medium text-[var(--forja-text-muted)]">
              Estabilidade: {(nodeData.stability ?? 0.5).toFixed(1)}
            </label>
            <input
              type="range" min="0" max="1" step="0.1"
              value={nodeData.stability ?? 0.5}
              onChange={(e) => handleChange("stability", parseFloat(e.target.value))}
              className="accent-[var(--forja-ember)]"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-medium text-[var(--forja-text-muted)]">
              Similaridade: {(nodeData.similarity ?? 0.75).toFixed(1)}
            </label>
            <input
              type="range" min="0" max="1" step="0.1"
              value={nodeData.similarity ?? 0.75}
              onChange={(e) => handleChange("similarity", parseFloat(e.target.value))}
              className="accent-[var(--forja-ember)]"
            />
          </div>
        </div>

        {/* Texto */}
        <textarea
          value={nodeData.text || ""}
          onChange={(e) => handleChange("text", e.target.value)}
          onKeyDown={(e) => e.stopPropagation()}
          placeholder="Texto para converter em voz..."
          rows={3}
          className="nodrag nowheel w-full resize-none rounded-md border border-[var(--forja-border)] bg-[var(--forja-bg)] px-2 py-1.5 text-xs text-[var(--forja-text)] placeholder:text-[var(--forja-text-dim)] focus:border-[var(--forja-ember)] focus:outline-none"
        />

        {/* Audio player */}
        {nodeData.url && (
          <div className="flex items-center gap-2 rounded-md bg-[var(--forja-bg)] p-2">
            <button onClick={togglePlay} className="text-[var(--forja-ember)]">
              {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>
            <audio
              ref={audioRef}
              src={nodeData.url}
              onEnded={() => setPlaying(false)}
              className="hidden"
            />
            <div className="flex-1 h-1 rounded-full bg-[var(--forja-border)]">
              <div className="h-1 rounded-full bg-[var(--forja-ember)] w-0" />
            </div>
            {nodeData.duration && (
              <span className="text-[10px] text-[var(--forja-text-dim)]">{nodeData.duration}s</span>
            )}
          </div>
        )}

        {/* Botão */}
        <button
          onClick={handleGenerate}
          disabled={generating || !nodeData.text}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--forja-success)] py-2 text-sm font-medium text-[var(--forja-bg)] transition-all duration-200 hover:brightness-110 disabled:opacity-50"
        >
          {generating ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Gerando...</>
          ) : (
            <><Mic className="h-4 w-4" /> Gerar Voz</>
          )}
        </button>
      </div>

      {/* Handles */}
      <Handle type="target" position={Position.Left}
        className="!h-3 !w-3 !rounded-full !border-2 !border-[var(--forja-border-strong)] !bg-[var(--forja-info)]" />
      <Handle type="source" position={Position.Right}
        className="!h-3 !w-3 !rounded-full !border-2 !border-[var(--forja-border-strong)] !bg-[var(--forja-success)]" />
    </div>
  );
}

export const VoiceNode = memo(VoiceNodeComponent);
