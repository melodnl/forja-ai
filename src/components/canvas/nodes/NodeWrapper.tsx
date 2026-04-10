"use client";

import { Trash2, Copy } from "lucide-react";
import { useCanvasStore } from "@/store/canvas.store";

/**
 * Impede React Flow de capturar teclas quando digitando em inputs dentro de nós.
 * Usar no onKeyDown do elemento interativo (textarea, input, select).
 */
export function stopNodeKeyCapture(e: React.KeyboardEvent) {
  e.stopPropagation();
}

export function NodeDuplicateButton({ nodeId }: { nodeId: string }) {
  const nodes = useCanvasStore((s) => s.nodes);
  const addNode = useCanvasStore((s) => s.addNode);

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        const original = nodes.find((n) => n.id === nodeId);
        if (!original) return;
        addNode({
          ...original,
          id: `${original.type}-${Date.now()}`,
          position: { x: original.position.x + 40, y: original.position.y + 40 },
          selected: false,
          data: { ...original.data },
        });
      }}
      className="flex h-5 w-5 items-center justify-center rounded opacity-0 group-hover/node:opacity-100 hover:bg-[var(--forja-info)]/20 transition-all"
      title="Duplicar nó"
    >
      <Copy className="h-3 w-3 text-[var(--forja-info)]" />
    </button>
  );
}

export function NodeDeleteButton({ nodeId }: { nodeId: string }) {
  const deleteNode = useCanvasStore((s) => s.deleteNode);

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        deleteNode(nodeId);
      }}
      className="flex h-5 w-5 items-center justify-center rounded opacity-0 group-hover/node:opacity-100 hover:bg-[var(--forja-error)]/20 transition-all"
      title="Deletar nó"
    >
      <Trash2 className="h-3 w-3 text-[var(--forja-error)]" />
    </button>
  );
}
