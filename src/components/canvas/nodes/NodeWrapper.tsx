"use client";

import { Trash2 } from "lucide-react";
import { useCanvasStore } from "@/store/canvas.store";

export function NodeDeleteButton({ nodeId }: { nodeId: string }) {
  const deleteNode = useCanvasStore((s) => s.deleteNode);

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        deleteNode(nodeId);
      }}
      className="ml-auto flex h-5 w-5 items-center justify-center rounded opacity-0 group-hover/node:opacity-100 hover:bg-[var(--forja-error)]/20 transition-all"
      title="Deletar nó"
    >
      <Trash2 className="h-3 w-3 text-[var(--forja-error)]" />
    </button>
  );
}
