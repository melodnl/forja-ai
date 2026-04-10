"use client";

import { useCallback } from "react";
import { ImageIcon, Type, Flame, Video, Mic, FileText, ZoomIn, Eraser, UserCircle, Bot, Share2, Link, FileBox, ImagePlus, User } from "lucide-react";
import { useCanvasStore } from "@/store/canvas.store";
import { NODE_DEFAULTS, type ForjaNodeType } from "@/types/nodes";

const PALETTE_ITEMS: { type: ForjaNodeType; icon: React.ElementType; label: string; color: string }[] = [
  { type: "assistant", icon: Bot, label: "Assistente IA", color: "var(--forja-info)" },
  { type: "creative", icon: Flame, label: "Nó Criativo", color: "var(--forja-ember)" },
  { type: "reference", icon: ImagePlus, label: "Referência", color: "var(--forja-info)" },
  { type: "avatar" as ForjaNodeType, icon: UserCircle, label: "Avatar", color: "var(--forja-spark)" },
  { type: "image", icon: ImageIcon, label: "Imagem", color: "var(--forja-amber)" },
  { type: "video", icon: Video, label: "Vídeo", color: "var(--forja-glow)" },
  { type: "copy", icon: FileText, label: "Texto", color: "var(--forja-text-muted)" },
  { type: "voice", icon: Mic, label: "Voz", color: "var(--forja-success)" },
  { type: "ugc_avatar", icon: Share2, label: "Redes Sociais", color: "var(--forja-spark)" },
  { type: "upscale", icon: Link, label: "Link", color: "var(--forja-amber)" },
  { type: "remove_bg", icon: FileBox, label: "Documento", color: "var(--forja-warning)" },
];

export function NodePalette() {
  const addNode = useCanvasStore((s) => s.addNode);
  const nodes = useCanvasStore((s) => s.nodes);

  const handleAdd = useCallback(
    (type: ForjaNodeType) => {
      const id = `${type}-${Date.now()}`;
      const defaults = { ...NODE_DEFAULTS[type] };

      // Auto-incrementar label para nós de referência e avatar
      if (type === "reference") {
        const refNodes = nodes.filter((n) => n.type === "reference");
        const maxNum = refNodes.reduce((max, n) => {
          const match = ((n.data as Record<string, unknown>).label as string || "").match(/^img(\d+)$/);
          return match ? Math.max(max, parseInt(match[1])) : max;
        }, 0);
        defaults.label = `img${maxNum + 1}`;
      }
      if (type === "avatar") {
        const avatarNodes = nodes.filter((n) => n.type === "avatar");
        const maxNum = avatarNodes.reduce((max, n) => {
          const match = ((n.data as Record<string, unknown>).label as string || "").match(/^avatar(\d+)$/);
          return match ? Math.max(max, parseInt(match[1])) : max;
        }, 0);
        defaults.label = `avatar${maxNum + 1}`;
      }

      addNode({
        id,
        type,
        position: {
          x: 200 + Math.random() * 300,
          y: 200 + Math.random() * 200,
        },
        data: defaults,
      });
    },
    [addNode, nodes]
  );

  return (
    <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-0.5 rounded-xl border border-[var(--forja-border)] bg-[var(--forja-bg-elevated)]/95 px-2 py-2 backdrop-blur-sm shadow-lg">
      {PALETTE_ITEMS.map(({ type, icon: Icon, label, color }) => (
        <button
          key={type}
          onClick={() => handleAdd(type)}
          className="flex flex-col items-center gap-1 rounded-lg px-3 py-1.5 transition-all duration-200 hover:bg-[var(--forja-bg-hover)]"
        >
          <Icon className="h-4 w-4" style={{ color }} />
          <span className="text-[10px] text-[var(--forja-text-muted)] whitespace-nowrap">{label}</span>
        </button>
      ))}
    </div>
  );
}
