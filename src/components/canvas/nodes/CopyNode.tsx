"use client";

import { memo, useCallback, useState } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { FileText, Loader2, Copy, Check, ThumbsUp, Trophy } from "lucide-react";
import { useCanvasStore } from "@/store/canvas.store";
import { toast } from "sonner";
import type { CopyNodeData } from "@/types/nodes";
import { NodeDeleteButton, stopNodeKeyCapture } from "./NodeWrapper";

const MODELS = [
  { value: "claude-sonnet-4-5", label: "Claude Sonnet 4.5" },
  { value: "gpt-4-1", label: "GPT-4.1" },
  { value: "gemini-2-0", label: "Gemini 2.0" },
];

const TYPES = [
  { value: "headline", label: "Headline" },
  { value: "hook-vsl", label: "Hook VSL" },
  { value: "descricao-produto", label: "Descrição produto" },
  { value: "caption-instagram", label: "Caption Instagram" },
  { value: "tweet", label: "Tweet" },
  { value: "roteiro-ugc", label: "Roteiro UGC" },
];

const TONES = [
  { value: "persuasivo", label: "Persuasivo" },
  { value: "casual", label: "Casual" },
  { value: "urgente", label: "Urgente" },
  { value: "storytelling", label: "Storytelling" },
  { value: "direto", label: "Direto" },
];

function CopyNodeComponent({ id, data, selected }: NodeProps) {
  const nodeData = data as unknown as CopyNodeData;
  const updateNodeData = useCanvasStore((s) => s.updateNodeData);
  const [generating, setGenerating] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [winnerIdx, setWinnerIdx] = useState<number | null>(null);

  const handleChange = useCallback(
    (field: string, value: string | number) => {
      updateNodeData(id, { [field]: value });
    },
    [id, updateNodeData]
  );

  const handleGenerate = useCallback(async () => {
    if (!nodeData.briefing) {
      toast.error("Insira um briefing");
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch("/api/generate/copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: nodeData.model || "claude-sonnet-4-5",
          type: nodeData.type || "headline",
          tone: nodeData.tone || "persuasivo",
          language: nodeData.language || "pt-BR",
          briefing: nodeData.briefing,
          variations: nodeData.variations || 3,
        }),
      });
      const result = await res.json();
      if (!res.ok) {
        toast.error(result.error || "Erro na geração de copy");
        return;
      }
      updateNodeData(id, { outputs: result.copies });
      toast.success("Copies geradas!");
    } catch {
      toast.error("Erro ao conectar com o servidor");
    } finally {
      setGenerating(false);
    }
  }, [id, nodeData, updateNodeData]);

  const copyToClipboard = useCallback((text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  }, []);

  return (
    <div
      onKeyDown={stopNodeKeyCapture}
      className={`group/node w-80 rounded-lg border bg-[var(--canvas-node-bg)] transition-all duration-200 ${
        selected
          ? "border-[var(--forja-ember)] shadow-[0_0_24px_rgba(255,107,26,0.15)]"
          : "border-[var(--forja-border)]"
      }`}
    >
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-[var(--forja-border)] px-3 py-2">
        <FileText className="h-4 w-4 text-[var(--forja-info)]" />
        <span className="text-xs font-medium text-[var(--forja-text)]">
          {nodeData.label || "Copy"}
        </span>
        <NodeDeleteButton nodeId={id} />
      </div>

      {/* Body */}
      <div className="flex flex-col gap-2.5 p-3">
        {/* Modelo + Tipo */}
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-medium text-[var(--forja-text-muted)]">Modelo</label>
            <select
              value={nodeData.model || "claude-sonnet-4-5"}
              onChange={(e) => handleChange("model", e.target.value)}
              className="rounded-md border border-[var(--forja-border)] bg-[var(--forja-bg)] px-2 py-1.5 text-xs text-[var(--forja-text)] focus:border-[var(--forja-ember)] focus:outline-none"
            >
              {MODELS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-medium text-[var(--forja-text-muted)]">Tipo</label>
            <select
              value={nodeData.type || "headline"}
              onChange={(e) => handleChange("type", e.target.value)}
              className="rounded-md border border-[var(--forja-border)] bg-[var(--forja-bg)] px-2 py-1.5 text-xs text-[var(--forja-text)] focus:border-[var(--forja-ember)] focus:outline-none"
            >
              {TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Tom + Idioma */}
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-medium text-[var(--forja-text-muted)]">Tom</label>
            <select
              value={nodeData.tone || "persuasivo"}
              onChange={(e) => handleChange("tone", e.target.value)}
              className="rounded-md border border-[var(--forja-border)] bg-[var(--forja-bg)] px-2 py-1.5 text-xs text-[var(--forja-text)] focus:border-[var(--forja-ember)] focus:outline-none"
            >
              {TONES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-medium text-[var(--forja-text-muted)]">Idioma</label>
            <select
              value={nodeData.language || "pt-BR"}
              onChange={(e) => handleChange("language", e.target.value)}
              className="rounded-md border border-[var(--forja-border)] bg-[var(--forja-bg)] px-2 py-1.5 text-xs text-[var(--forja-text)] focus:border-[var(--forja-ember)] focus:outline-none"
            >
              <option value="pt-BR">Portugues (BR)</option>
              <option value="es">Espanol</option>
              <option value="en">English</option>
            </select>
          </div>
        </div>

        {/* Briefing */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-medium text-[var(--forja-text-muted)]">Briefing</label>
          <textarea
            value={nodeData.briefing || ""}
            onChange={(e) => handleChange("briefing", e.target.value)}
            onKeyDown={(e) => e.stopPropagation()}
            placeholder="Descreva o produto, público-alvo, oferta..."
            rows={3}
            className="nodrag nowheel w-full resize-none rounded-md border border-[var(--forja-border)] bg-[var(--forja-bg)] px-2 py-1.5 text-xs text-[var(--forja-text)] placeholder:text-[var(--forja-text-dim)] focus:border-[var(--forja-ember)] focus:outline-none"
          />
        </div>

        {/* Variações */}
        <div className="flex items-center gap-2">
          <label className="text-[10px] font-medium text-[var(--forja-text-muted)]">Variações</label>
          <input
            type="number" min={1} max={10}
            value={nodeData.variations || 3}
            onChange={(e) => handleChange("variations", parseInt(e.target.value) || 3)}
            onKeyDown={(e) => e.stopPropagation()}
            className="nodrag nowheel w-14 rounded-md border border-[var(--forja-border)] bg-[var(--forja-bg)] px-2 py-1 text-xs text-[var(--forja-text)] text-center focus:border-[var(--forja-ember)] focus:outline-none"
          />
        </div>

        {/* Outputs */}
        {nodeData.outputs && nodeData.outputs.length > 0 && (
          <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto">
            {nodeData.outputs.map((text, i) => (
              <div
                key={i}
                className={`group flex items-start gap-2 rounded-md p-2 ${winnerIdx === i ? "bg-[var(--forja-ember)]/10 border border-[var(--forja-ember)]/30" : "bg-[var(--forja-bg)]"}`}
              >
                {winnerIdx === i && <Trophy className="h-3 w-3 shrink-0 mt-0.5 text-[var(--forja-ember)]" />}
                <p className="flex-1 text-xs text-[var(--forja-text)] leading-relaxed">{text}</p>
                <div className="flex flex-col gap-1 shrink-0 mt-0.5">
                  <button
                    onClick={() => setWinnerIdx(winnerIdx === i ? null : i)}
                    title="Marcar como vencedor"
                    className={`${winnerIdx === i ? "text-[var(--forja-ember)]" : "text-[var(--forja-text-dim)] hover:text-[var(--forja-ember)]"}`}
                  >
                    <ThumbsUp className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => copyToClipboard(text, i)}
                    className="text-[var(--forja-text-dim)] hover:text-[var(--forja-ember)]"
                  >
                    {copiedIdx === i ? <Check className="h-3 w-3 text-[var(--forja-success)]" /> : <Copy className="h-3 w-3" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Botão */}
        <button
          onClick={handleGenerate}
          disabled={generating || !nodeData.briefing}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--forja-info)] py-2 text-sm font-medium text-[var(--forja-bg)] transition-all duration-200 hover:brightness-110 disabled:opacity-50"
        >
          {generating ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Gerando...</>
          ) : (
            <><FileText className="h-4 w-4" /> Gerar Copy</>
          )}
        </button>
      </div>

      {/* Handles */}
      <Handle type="target" position={Position.Left}
        className="!h-3 !w-3 !rounded-full !border-2 !border-[var(--forja-border-strong)] !bg-[var(--forja-info)]" />
      <Handle type="source" position={Position.Right}
        className="!h-3 !w-3 !rounded-full !border-2 !border-[var(--forja-border-strong)] !bg-[var(--forja-ember)]" />
    </div>
  );
}

export const CopyNode = memo(CopyNodeComponent);
