"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Flame, Video, Mic, FileText, Image as ImageIcon, UserCircle } from "lucide-react";

const TEMPLATES = [
  {
    id: "vsl-hook",
    name: "Hook VSL",
    category: "vsl",
    description: "Criativo de imagem + copy persuasiva pra início de VSL",
    icon: Flame,
    color: "var(--forja-ember)",
    nodes: [
      { id: "prompt-1", type: "prompt", position: { x: 50, y: 100 }, data: { label: "Prompt", text: "Crie uma imagem impactante para abertura de VSL sobre [produto]" } },
      { id: "creative-1", type: "creative", position: { x: 400, y: 50 }, data: { label: "Criativo", model: "nano-banana-2", aspectRatio: "16:9", resolution: "1K", format: "png", prompt: "", variants: 2, status: "idle", outputUrls: [] } },
      { id: "copy-1", type: "copy", position: { x: 400, y: 350 }, data: { label: "Copy", model: "claude-sonnet-4-5", type: "hook-vsl", tone: "urgente", language: "pt-BR", briefing: "", variations: 5, outputs: [] } },
    ],
    edges: [
      { id: "e1", source: "prompt-1", target: "creative-1", type: "animated", animated: true },
      { id: "e2", source: "prompt-1", target: "copy-1", type: "animated", animated: true },
    ],
  },
  {
    id: "ugc-completo",
    name: "UGC Completo",
    category: "ugc",
    description: "Avatar falando + copy + imagem de fundo",
    icon: UserCircle,
    color: "var(--forja-spark)",
    nodes: [
      { id: "img-1", type: "image", position: { x: 50, y: 50 }, data: { label: "Rosto", url: "", width: 0, height: 0, filename: "" } },
      { id: "copy-1", type: "copy", position: { x: 50, y: 250 }, data: { label: "Roteiro", model: "claude-sonnet-4-5", type: "roteiro-ugc", tone: "casual", language: "pt-BR", briefing: "", variations: 1, outputs: [] } },
      { id: "voice-1", type: "voice", position: { x: 400, y: 250 }, data: { label: "Voz", provider: "elevenlabs", voice: "", stability: 0.5, similarity: 0.75, text: "" } },
      { id: "ugc-1", type: "ugc_avatar", position: { x: 700, y: 150 }, data: { label: "UGC Avatar", model: "sora-2", duration: "15s" } },
    ],
    edges: [
      { id: "e1", source: "copy-1", target: "voice-1", type: "animated", animated: true },
      { id: "e2", source: "img-1", target: "ugc-1", targetHandle: "face", type: "animated", animated: true },
      { id: "e3", source: "voice-1", target: "ugc-1", targetHandle: "audio", type: "animated", animated: true },
    ],
  },
  {
    id: "thumb-youtube",
    name: "Thumbnail YouTube",
    category: "thumbnail",
    description: "Imagem 16:9 impactante pra thumbnail",
    icon: ImageIcon,
    color: "var(--forja-amber)",
    nodes: [
      { id: "prompt-1", type: "prompt", position: { x: 50, y: 100 }, data: { label: "Prompt", text: "" } },
      { id: "creative-1", type: "creative", position: { x: 400, y: 50 }, data: { label: "Thumbnail", model: "ideogram-v3", aspectRatio: "16:9", resolution: "2K", format: "png", prompt: "", variants: 3, status: "idle", outputUrls: [] } },
    ],
    edges: [
      { id: "e1", source: "prompt-1", target: "creative-1", type: "animated", animated: true },
    ],
  },
  {
    id: "video-produto",
    name: "Vídeo de Produto",
    category: "product",
    description: "Imagem do produto → vídeo curto animado",
    icon: Video,
    color: "var(--forja-glow)",
    nodes: [
      { id: "img-1", type: "image", position: { x: 50, y: 100 }, data: { label: "Produto", url: "", width: 0, height: 0, filename: "" } },
      { id: "prompt-1", type: "prompt", position: { x: 50, y: 300 }, data: { label: "Prompt", text: "Animate this product with elegant motion, studio lighting" } },
      { id: "creative-1", type: "creative", position: { x: 400, y: 150 }, data: { label: "Vídeo", model: "kling-2", aspectRatio: "9:16", resolution: "1K", format: "mp4", prompt: "", variants: 1, status: "idle", outputUrls: [] } },
    ],
    edges: [
      { id: "e1", source: "img-1", target: "creative-1", targetHandle: "images", type: "animated", animated: true },
      { id: "e2", source: "prompt-1", target: "creative-1", targetHandle: "prompt", type: "animated", animated: true },
    ],
  },
  {
    id: "copy-pack",
    name: "Pack de Copies",
    category: "copy",
    description: "Múltiplas copies em 3 tons diferentes",
    icon: FileText,
    color: "var(--forja-info)",
    nodes: [
      { id: "copy-1", type: "copy", position: { x: 50, y: 50 }, data: { label: "Persuasivo", model: "claude-sonnet-4-5", type: "headline", tone: "persuasivo", language: "pt-BR", briefing: "", variations: 5, outputs: [] } },
      { id: "copy-2", type: "copy", position: { x: 50, y: 350 }, data: { label: "Urgente", model: "claude-sonnet-4-5", type: "headline", tone: "urgente", language: "pt-BR", briefing: "", variations: 5, outputs: [] } },
      { id: "copy-3", type: "copy", position: { x: 450, y: 200 }, data: { label: "Storytelling", model: "claude-sonnet-4-5", type: "headline", tone: "storytelling", language: "pt-BR", briefing: "", variations: 5, outputs: [] } },
    ],
    edges: [],
  },
  {
    id: "voiceover",
    name: "Voiceover",
    category: "voice",
    description: "Copy → voz narrada em PT-BR",
    icon: Mic,
    color: "var(--forja-success)",
    nodes: [
      { id: "copy-1", type: "copy", position: { x: 50, y: 100 }, data: { label: "Roteiro", model: "claude-sonnet-4-5", type: "roteiro-ugc", tone: "direto", language: "pt-BR", briefing: "", variations: 1, outputs: [] } },
      { id: "voice-1", type: "voice", position: { x: 450, y: 100 }, data: { label: "Narração", provider: "elevenlabs", voice: "", stability: 0.5, similarity: 0.75, text: "" } },
    ],
    edges: [
      { id: "e1", source: "copy-1", target: "voice-1", type: "animated", animated: true },
    ],
  },
];

export default function TemplatesPage() {
  const t = useTranslations("nav");
  const router = useRouter();

  async function useTemplate(template: typeof TEMPLATES[number]) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("Não autenticado"); return; }

    const { data, error } = await supabase
      .from("boards")
      .insert({
        user_id: user.id,
        name: template.name,
        description: template.description,
        nodes: template.nodes,
        edges: template.edges,
      })
      .select()
      .single();

    if (error) { toast.error(error.message); return; }
    router.push(`/board/${data.id}`);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">{t("templates")}</h1>
      <p className="text-sm text-[var(--forja-text-muted)] mb-8">
        Fluxos prontos pra começar rápido. Clique pra criar um board.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {TEMPLATES.map((tmpl) => {
          const Icon = tmpl.icon;
          return (
            <button
              key={tmpl.id}
              onClick={() => useTemplate(tmpl)}
              className="group flex flex-col items-start rounded-xl border border-[var(--forja-border)] bg-[var(--forja-bg-elevated)] p-5 text-left transition-all duration-200 hover:border-[var(--forja-ember)]/30 hover:shadow-[0_0_24px_rgba(255,107,26,0.08)]"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--forja-bg)] mb-3">
                <Icon className="h-5 w-5" style={{ color: tmpl.color }} />
              </div>
              <h3 className="text-sm font-medium text-[var(--forja-text)] mb-1">{tmpl.name}</h3>
              <p className="text-xs text-[var(--forja-text-muted)] leading-relaxed">{tmpl.description}</p>
              <div className="mt-3 flex items-center gap-2">
                <span className="rounded bg-[var(--forja-bg)] px-2 py-0.5 text-[10px] text-[var(--forja-text-dim)]">
                  {tmpl.nodes.length} nós
                </span>
                <span className="rounded bg-[var(--forja-bg)] px-2 py-0.5 text-[10px] text-[var(--forja-text-dim)]">
                  {tmpl.category}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
