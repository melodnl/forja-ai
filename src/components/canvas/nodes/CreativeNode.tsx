"use client";

import { memo, useCallback, useState, useEffect, useRef } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Flame, Loader2, CheckCircle, XCircle, Sparkles, BookOpen, ChevronDown, Download, ExternalLink } from "lucide-react";
import { useCanvasStore } from "@/store/canvas.store";
import { useGeneration } from "@/hooks/useGeneration";
import { useNodeInputs } from "@/hooks/useNodeConnections";
import { toast } from "sonner";
import type { CreativeNodeData } from "@/types/nodes";
import { NodeDeleteButton } from "./NodeWrapper";

const IMAGE_MODELS = [
  { value: "grok-imagine", label: "Grok Imagine" },
  { value: "imagen4-ultra", label: "Google Imagen 4 Ultra" },
  { value: "imagen4", label: "Google Imagen 4" },
  { value: "ideogram-v3", label: "Ideogram v3" },
  { value: "qwen", label: "Qwen" },
];

const VIDEO_MODELS = [
  { value: "seedance-2", label: "Seedance 2.0 (UGC/Lip Sync)" },
  { value: "seedance-2-fast", label: "Seedance 2.0 Fast" },
  { value: "seedance-1.5-pro", label: "Seedance 1.5 Pro" },
  { value: "veo3-fast", label: "Veo 3 Fast" },
  { value: "veo3-quality", label: "Veo 3 Quality" },
  { value: "veo3-lite", label: "Veo 3 Lite" },
  { value: "runway", label: "Runway Gen-4" },
  { value: "grok-video", label: "Grok Video" },
  { value: "sora-2-characters", label: "Sora 2 Characters (UGC)" },
];

const ALL_MODELS = [...IMAGE_MODELS, ...VIDEO_MODELS];

const ASPECT_RATIOS = [
  { value: "1:1", label: "Quadrado (1:1)" },
  { value: "9:16", label: "Retrato (9:16)" },
  { value: "16:9", label: "Paisagem (16:9)" },
  { value: "4:5", label: "Retrato (4:5)" },
  { value: "3:4", label: "Retrato (3:4)" },
  { value: "4:3", label: "Paisagem (4:3)" },
];

const DURATIONS = ["5s", "10s", "15s", "30s", "60s"];
const FORMATS_IMAGE = ["png", "jpg", "webp"];
const API_PROVIDERS = [
  { value: "kie", label: "KieAI" },
  { value: "venice", label: "VeniceAI" },
];

const PROMPT_TEMPLATES: Record<string, { label: string; templates: { name: string; prompt: string }[] }> = {
  image: {
    label: "IMAGEM",
    templates: [
      { name: "Foto para vídeo (fundo verde)", prompt: "Professional studio photograph of the subject as an isolated avatar, centered composition, solid bright green chroma key background (#00FF00), soft even studio lighting, no shadows on background, sharp focus on subject, clean edges for easy background removal, 8K resolution, shot on Canon EOS R5 with 85mm f/1.4 lens" },
      { name: "Product shot", prompt: "Ultra-high-end commercial product photography, centered on clean white infinity curve background, dramatic three-point lighting with soft key light from upper left, subtle rim light, perfect reflections on surface, shot on Phase One IQ4 150MP, 120mm macro lens, f/11, focus stacked for edge-to-edge sharpness, retouched to perfection" },
      { name: "Retrato profissional", prompt: "Professional corporate headshot portrait, subject looking directly at camera with confident subtle smile, shallow depth of field with creamy bokeh background, Rembrandt lighting setup, shot on Sony A7R V with 85mm f/1.2 GM lens, natural skin texture preserved, warm color grading, magazine quality retouching" },
      { name: "Post para redes sociais", prompt: "Eye-catching social media visual, bold vibrant colors with high contrast, modern minimalist composition, trending aesthetic, clean typography space, Instagram-optimized format, punchy saturated color palette, slight grain texture, designed to stop the scroll, professional graphic design quality" },
      { name: "Thumbnail YouTube", prompt: "High-impact YouTube thumbnail, extremely bold and dramatic composition, subject with exaggerated expression, bright saturated colors that pop on small screens, thick contrasting outlines, dramatic lighting with colored gels, slight Dutch angle, text-safe zone on right third, 1280x720, clickbait-worthy visual impact" },
      { name: "Banner publicitário", prompt: "Premium advertising banner, luxury brand aesthetic, cinematic wide-angle composition, dramatic hero lighting, rich deep shadows with selective highlights, elegant color palette with gold accents, ample negative space for headline copy, Apple/Nike campaign style, ultra-sharp details, 4K" },
      { name: "Mockup digital", prompt: "Photorealistic digital device mockup, modern workspace environment, MacBook Pro and iPhone floating at slight angle, clean minimal desk, soft natural window light, subtle depth of field, Scandinavian interior design aesthetic, warm neutral palette, Octane render quality, 4K" },
      { name: "Infoproduto capa", prompt: "Professional e-book cover design, 3D book mockup floating with dramatic shadow, bold modern typography, gradient background dark to vibrant accent color, subtle geometric patterns, author photo space, bestseller aesthetic, glossy finish effect, premium digital product look, high conversion design" },
    ],
  },
  video: {
    label: "VÍDEO",
    templates: [
      { name: "UGC talking head", prompt: "Natural authentic UGC-style video, person talking directly to camera with genuine enthusiasm, well-lit face with ring light, casual background slightly blurred, vertical 9:16, smooth subtle movements, relatable vibe, TikTok/Reels aesthetic, natural color grading" },
      { name: "Product showcase", prompt: "Sleek product showcase video, smooth 360-degree rotation on pedestal, dramatic studio lighting with color shifts, reflective dark surface, cinematic slow motion, seamless loop, premium luxury aesthetic, subtle particle effects, commercial quality" },
      { name: "Transição dinâmica", prompt: "Dynamic transition video, fast-paced cuts synced to beat, smooth morph transitions, energetic camera movements with whip pans and zooms, vibrant teal and orange grading, motion blur for speed, TikTok trending edit style, vertical format" },
      { name: "Cinematic B-roll", prompt: "Cinematic B-roll footage, slow motion 120fps, shallow depth of field with beautiful bokeh, golden hour warm lighting, subtle dolly movement, film grain overlay, anamorphic lens flares, teal and orange LUT, 4K, professional documentary quality" },
      { name: "Logo reveal", prompt: "Elegant logo reveal animation, dark moody background, logo materializes from golden particle dust, subtle light rays, smooth 3D camera orbit, premium metallic texture, ambient light pulses, cinematic sound design moment, luxury brand aesthetic, 4 seconds" },
      { name: "Antes e depois", prompt: "Satisfying before-and-after reveal, split screen wipe transition left to right, dramatic transformation, clean white divider line, slight zoom during reveal, bright uplifting color shift on after side, smooth 2-second transition, vertical format for Reels" },
    ],
  },
};

function CreativeNodeComponent({ id, data, selected }: NodeProps) {
  const nodeData = data as unknown as CreativeNodeData;
  const updateNodeData = useCanvasStore((s) => s.updateNodeData);
  const boardId = useCanvasStore((s) => s.boardId);
  const { generate } = useGeneration();
  const { imageUrls: connectedImages, promptText: connectedPrompt } = useNodeInputs(id);
  const [enhancing, setEnhancing] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const modelValue = nodeData.model || "grok-imagine";
  const isVideo = VIDEO_MODELS.some((m) => m.value === modelValue);
  const isGenerating = nodeData.status === "generating";

  // Timer de progresso
  useEffect(() => {
    if (isGenerating) {
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    } else {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isGenerating]);

  const estimatedTime = isVideo ? 60 : 20;
  const progress = Math.min((elapsed / estimatedTime) * 100, 95);
  const templates = PROMPT_TEMPLATES[isVideo ? "video" : "image"];
  const provider = (nodeData as unknown as Record<string, unknown>).provider as string || "kie";
  const duration = (nodeData as unknown as Record<string, unknown>).duration as string || "10s";

  const handleGenerate = useCallback(() => {
    const finalPrompt = nodeData.prompt || connectedPrompt || "";
    if (!finalPrompt.trim()) { toast.error("Escreva um prompt primeiro"); return; }
    generate(id, {
      model: modelValue,
      prompt: finalPrompt,
      imageUrls: connectedImages.length > 0 ? connectedImages : undefined,
      aspectRatio: nodeData.aspectRatio || "9:16",
      resolution: nodeData.resolution || "1K",
      format: nodeData.format || "png",
      variants: nodeData.variants || 1,
      boardId: boardId || undefined,
      provider,
    });
  }, [id, nodeData, modelValue, boardId, generate, connectedImages, connectedPrompt, provider]);

  const handleChange = useCallback(
    (field: string, value: string | number) => { updateNodeData(id, { [field]: value }); },
    [id, updateNodeData]
  );

  const handleEnhance = useCallback(async () => {
    const text = nodeData.prompt || "";
    if (text.trim().length < 3) { toast.error("Escreva algo antes"); return; }
    setEnhancing(true);
    try {
      const res = await fetch("/api/generate/enhance", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }) });
      const result = await res.json();
      if (!res.ok) { toast.error(result.error || "Erro"); return; }
      updateNodeData(id, { prompt: result.enhanced });
      toast.success("Prompt aprimorado!");
    } catch { toast.error("Erro ao conectar"); }
    finally { setEnhancing(false); }
  }, [id, nodeData.prompt, updateNodeData]);

  const applyTemplate = useCallback((prompt: string) => {
    updateNodeData(id, { prompt }); setShowTemplates(false); toast.success("Template aplicado!");
  }, [id, updateNodeData]);

  return (
    <div className={`group/node w-80 rounded-lg border bg-[var(--canvas-node-bg)] transition-all duration-200 ${selected ? "border-[var(--forja-ember)] shadow-[0_0_24px_rgba(255,107,26,0.15)]" : "border-[var(--forja-border)]"}`}>
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-[var(--forja-border)] px-3 py-2">
        <Flame className="h-4 w-4 text-[var(--forja-ember)]" />
        <span className="text-xs font-medium text-[var(--forja-text)]">Nó Criativo</span>
        <NodeDeleteButton nodeId={id} />
      </div>

      <div className="flex flex-col gap-2 p-3">
        {/* Connected */}
        {(connectedImages.length > 0 || connectedPrompt) && (
          <div className="rounded-md bg-[var(--forja-bg)] border border-[var(--forja-border)] px-2.5 py-1.5 text-[10px] text-[var(--forja-text-muted)]">
            {connectedImages.length > 0 && <span className="text-[var(--forja-amber)]">{connectedImages.length} imagem(ns) conectada(s)</span>}
            {connectedImages.length > 0 && connectedPrompt && <span> · </span>}
            {connectedPrompt && <span className="text-[var(--forja-info)]">Prompt conectado</span>}
          </div>
        )}

        {/* Modelo */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-medium text-[var(--forja-text-muted)]">Modelo</label>
          <select value={modelValue} onChange={(e) => handleChange("model", e.target.value)}
            className="rounded-md border border-[var(--forja-border)] bg-[var(--forja-bg)] px-2 py-2 text-xs text-[var(--forja-text)] focus:border-[var(--forja-ember)] focus:outline-none">
            <optgroup label="Imagem">{IMAGE_MODELS.map((m) => (<option key={m.value} value={m.value}>{m.label}</option>))}</optgroup>
            <optgroup label="Vídeo">{VIDEO_MODELS.map((m) => (<option key={m.value} value={m.value}>{m.label}</option>))}</optgroup>
          </select>
        </div>

        {/* Dica vídeo */}
        {isVideo && connectedImages.length === 0 && (
          <p className="text-[10px] text-[var(--forja-text-dim)] italic">Conecte 1 imagem como primeiro frame e/ou use o prompt para descrever o vídeo.</p>
        )}

        {/* Aspect Ratio */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-medium text-[var(--forja-text-muted)]">Aspect ratio</label>
          <select value={nodeData.aspectRatio || "9:16"} onChange={(e) => handleChange("aspectRatio", e.target.value)}
            className="rounded-md border border-[var(--forja-border)] bg-[var(--forja-bg)] px-2 py-2 text-xs text-[var(--forja-text)] focus:border-[var(--forja-ember)] focus:outline-none">
            {ASPECT_RATIOS.map((r) => (<option key={r.value} value={r.value}>{r.label}</option>))}
          </select>
        </div>

        {/* Duração (vídeo) */}
        {isVideo && (
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-medium text-[var(--forja-text-muted)]">Duração</label>
            <select value={duration} onChange={(e) => handleChange("duration", e.target.value)}
              className="rounded-md border border-[var(--forja-border)] bg-[var(--forja-bg)] px-2 py-2 text-xs text-[var(--forja-text)] focus:border-[var(--forja-ember)] focus:outline-none">
              {DURATIONS.map((d) => (<option key={d} value={d}>{d}</option>))}
            </select>
          </div>
        )}

        {/* Resolução (imagem) */}
        {!isVideo && (
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-medium text-[var(--forja-text-muted)]">Resolução</label>
            <select value={nodeData.resolution || "1K"} onChange={(e) => handleChange("resolution", e.target.value)}
              className="rounded-md border border-[var(--forja-border)] bg-[var(--forja-bg)] px-2 py-2 text-xs text-[var(--forja-text)] focus:border-[var(--forja-ember)] focus:outline-none">
              {["512p", "1K", "2K", "4K"].map((r) => (<option key={r} value={r}>{r}</option>))}
            </select>
          </div>
        )}

        {/* API Provider */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-medium text-[var(--forja-text-muted)]">API Provider</label>
          <select value={provider} onChange={(e) => handleChange("provider", e.target.value)}
            className="rounded-md border border-[var(--forja-border)] bg-[var(--forja-bg)] px-2 py-2 text-xs text-[var(--forja-text)] focus:border-[var(--forja-ember)] focus:outline-none">
            {API_PROVIDERS.map((p) => (<option key={p.value} value={p.value}>{p.label}</option>))}
          </select>
        </div>

        {/* Formato (imagem) */}
        {!isVideo && (
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-medium text-[var(--forja-text-muted)]">Formato</label>
            <select value={nodeData.format || "png"} onChange={(e) => handleChange("format", e.target.value)}
              className="rounded-md border border-[var(--forja-border)] bg-[var(--forja-bg)] px-2 py-2 text-xs text-[var(--forja-text)] focus:border-[var(--forja-ember)] focus:outline-none">
              {FORMATS_IMAGE.map((f) => (<option key={f} value={f}>{f.toUpperCase()}</option>))}
            </select>
          </div>
        )}

        {/* Prompt */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-medium text-[var(--forja-text-muted)]">Prompt</label>
            <div className="flex items-center gap-0.5">
              <button onClick={handleEnhance} disabled={enhancing}
                className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-[var(--forja-ember)] hover:bg-[var(--forja-bg-hover)] transition-colors disabled:opacity-50">
                {enhancing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />} Aprimorar
              </button>
              <div className="relative">
                <button onClick={() => setShowTemplates(!showTemplates)}
                  className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-[var(--forja-info)] hover:bg-[var(--forja-bg-hover)] transition-colors">
                  <BookOpen className="h-3 w-3" /> Templates <ChevronDown className="h-2.5 w-2.5" />
                </button>
                {showTemplates && (
                  <div className="absolute right-0 top-full mt-1 w-60 rounded-lg border border-[var(--forja-border)] bg-[var(--forja-bg-overlay)] py-1 shadow-xl z-30 max-h-72 overflow-y-auto">
                    <div className="px-3 py-1.5 text-[9px] font-medium text-[var(--forja-text-dim)] uppercase tracking-wider">{templates.label}</div>
                    {templates.templates.map((t, i) => (
                      <button key={i} onClick={() => applyTemplate(t.prompt)}
                        className="flex w-full px-3 py-2 text-left text-[11px] text-[var(--forja-text)] hover:bg-[var(--forja-bg-hover)] transition-colors">{t.name}</button>
                    ))}
                    <div className="border-t border-[var(--forja-border)] mt-1 pt-1 px-3 py-1.5">
                      <span className="text-[10px] text-[var(--forja-text-dim)] cursor-pointer hover:text-[var(--forja-text)]">+ Salvar prompt atual como template</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <textarea value={nodeData.prompt || ""} onChange={(e) => handleChange("prompt", e.target.value)}
            placeholder="Descreva o que você quer gerar..." rows={4}
            className="w-full resize-none rounded-md border border-[var(--forja-border)] bg-[var(--forja-bg)] px-2.5 py-2 text-xs text-[var(--forja-text)] placeholder:text-[var(--forja-text-dim)] focus:border-[var(--forja-ember)] focus:outline-none leading-relaxed" />
        </div>

        {/* Variantes */}
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-medium text-[var(--forja-text-muted)]">Variantes</label>
          <div className="flex items-center gap-1.5">
            <button onClick={() => handleChange("variants", Math.max(1, (nodeData.variants || 1) - 1))}
              className="flex h-6 w-6 items-center justify-center rounded border border-[var(--forja-border)] bg-[var(--forja-bg)] text-xs text-[var(--forja-text-muted)] hover:border-[var(--forja-ember)]">−</button>
            <span className="w-5 text-center text-xs font-medium text-[var(--forja-text)]">{nodeData.variants || 1}</span>
            <button onClick={() => handleChange("variants", Math.min(4, (nodeData.variants || 1) + 1))}
              className="flex h-6 w-6 items-center justify-center rounded border border-[var(--forja-border)] bg-[var(--forja-bg)] text-xs text-[var(--forja-text-muted)] hover:border-[var(--forja-ember)]">+</button>
          </div>
        </div>

        {/* Custo estimado */}
        <div className="flex items-center justify-between rounded-md bg-[var(--forja-bg)] border border-[var(--forja-border)] px-3 py-2">
          <span className="text-[10px] text-[var(--forja-text-muted)]">Custo estimado</span>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-[var(--forja-text)]">
              {(() => {
                const costs: Record<string, { credits: number; usd: string }> = {
                  "grok-imagine": { credits: 5, usd: "$0.02" },
                  "imagen4-ultra": { credits: 10, usd: "$0.05" },
                  "imagen4": { credits: 8, usd: "$0.04" },
                  "ideogram-v3": { credits: 8, usd: "$0.04" },
                  "qwen": { credits: 5, usd: "$0.02" },
                  "seedance-2": { credits: 20, usd: "$0.80" },
                  "seedance-2-fast": { credits: 15, usd: "$0.50" },
                  "seedance-1.5-pro": { credits: 25, usd: "$1.00" },
                  "veo3-fast": { credits: 30, usd: "$0.40" },
                  "veo3-quality": { credits: 50, usd: "$0.80" },
                  "veo3-lite": { credits: 15, usd: "$0.20" },
                  "runway": { credits: 25, usd: "$0.50" },
                  "grok-video": { credits: 15, usd: "$0.30" },
                  "sora-2-characters": { credits: 30, usd: "$0.60" },
                };
                const c = costs[modelValue] || { credits: 5, usd: "$0.02" };
                const total = c.credits * (nodeData.variants || 1);
                return `${total} créditos`;
              })()}
            </span>
            <span className="text-[10px] text-[var(--forja-text-dim)]">
              ~{(() => {
                const usdMap: Record<string, number> = {
                  "grok-imagine": 0.02, "imagen4-ultra": 0.05, "imagen4": 0.04,
                  "ideogram-v3": 0.04, "qwen": 0.02,
                  "seedance-2": 0.80, "seedance-2-fast": 0.50, "seedance-1.5-pro": 1.00,
                  "veo3-fast": 0.40, "veo3-quality": 0.80, "veo3-lite": 0.20,
                  "runway": 0.50, "grok-video": 0.30, "sora-2-characters": 0.60,
                };
                const usd = (usdMap[modelValue] || 0.02) * (nodeData.variants || 1);
                return `$${usd.toFixed(2)}`;
              })()}
            </span>
          </div>
        </div>

        {/* Progress bar durante geração */}
        {isGenerating && (
          <div className="flex flex-col gap-2 rounded-lg bg-[var(--forja-bg)] border border-[var(--forja-border)] p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-[var(--forja-ember)]" />
                <span className="text-xs text-[var(--forja-text)]">Gerando...</span>
              </div>
              <span className="text-[10px] text-[var(--forja-text-dim)] font-mono">{elapsed}s</span>
            </div>
            <div className="h-2 w-full rounded-full bg-[var(--forja-border)] overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[var(--forja-ember)] to-[var(--forja-amber)] transition-all duration-1000 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-[10px] text-[var(--forja-text-dim)]">
              {isVideo ? "Vídeos levam ~30-60s" : "Imagens levam ~10-20s"}
            </span>
          </div>
        )}

        {/* Resultado — galeria de outputs */}
        {nodeData.outputUrls && nodeData.outputUrls.length > 0 && (
          <div className="flex flex-col gap-2 rounded-lg bg-[var(--forja-bg)] border border-[var(--forja-border)] p-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-medium text-[var(--forja-success)] flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                {nodeData.outputUrls.length} resultado(s)
              </span>
              <span className="text-[10px] text-[var(--forja-text-dim)]">{elapsed > 0 ? `${elapsed}s` : ""}</span>
            </div>
            <div className={`grid gap-1.5 ${nodeData.outputUrls.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
              {nodeData.outputUrls.map((url, i) => (
                <div key={i} className="relative group/img rounded-md overflow-hidden">
                  {isVideo ? (
                    <video src={url} controls className="w-full rounded-md max-h-40 bg-black" />
                  ) : (
                    <img src={url} alt={`Resultado ${i + 1}`} className="w-full rounded-md object-cover max-h-40" />
                  )}
                  <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover/img:opacity-100 transition-opacity">
                    <a href={url} download className="rounded bg-black/70 p-1 hover:bg-black/90">
                      <Download className="h-3 w-3 text-white" />
                    </a>
                    <a href={url} target="_blank" rel="noopener noreferrer" className="rounded bg-black/70 p-1 hover:bg-black/90">
                      <ExternalLink className="h-3 w-3 text-white" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Status de erro */}
        {nodeData.status === "failed" && !isGenerating && (
          <div className="flex items-center gap-1.5 text-[var(--forja-error)] text-xs rounded-lg bg-[var(--forja-error)]/10 px-3 py-2">
            <XCircle className="h-3.5 w-3.5 shrink-0" />
            Falhou — tente novamente
          </div>
        )}

        {/* Botão Gerar */}
        <button onClick={handleGenerate} disabled={isGenerating}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--forja-ember)] py-2.5 text-sm font-medium text-[var(--forja-bg)] transition-all duration-200 hover:bg-[var(--forja-ember-hover)] hover:shadow-[0_0_24px_rgba(255,107,26,0.15)] disabled:opacity-50">
          {isGenerating ? (<><Loader2 className="h-4 w-4 animate-spin" /> Gerando... {elapsed}s</>) : (<><Flame className="h-4 w-4" /> Gerar</>)}
        </button>
      </div>

      <Handle type="target" position={Position.Left} id="images" style={{ top: "30%" }} className="!h-3 !w-3 !rounded-full !border-2 !border-[var(--forja-border-strong)] !bg-[var(--forja-amber)]" />
      <Handle type="target" position={Position.Left} id="prompt" style={{ top: "70%" }} className="!h-3 !w-3 !rounded-full !border-2 !border-[var(--forja-border-strong)] !bg-[var(--forja-info)]" />
      <Handle type="source" position={Position.Right} className="!h-3 !w-3 !rounded-full !border-2 !border-[var(--forja-border-strong)] !bg-[var(--forja-ember)]" />
    </div>
  );
}

export const CreativeNode = memo(CreativeNodeComponent);
