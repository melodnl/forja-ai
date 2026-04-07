"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useCanvasStore } from "@/store/canvas.store";
import { toast } from "sonner";

/**
 * Escuta mudanças em tempo real na tabela `generations`
 * e atualiza os nós correspondentes no canvas.
 */
export function useRealtimeGenerations(boardId: string | null) {
  const updateNodeData = useCanvasStore((s) => s.updateNodeData);

  useEffect(() => {
    if (!boardId) return;

    const supabase = createClient();

    const channel = supabase
      .channel(`generations:board:${boardId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "generations",
          filter: `board_id=eq.${boardId}`,
        },
        (payload) => {
          const gen = payload.new;

          if (!gen.node_id) return;

          if (gen.status === "completed") {
            updateNodeData(gen.node_id, {
              status: "completed",
              outputUrls: gen.output_urls || [],
            });
            toast.success("Geração concluída!");
          } else if (gen.status === "failed") {
            updateNodeData(gen.node_id, { status: "failed" });
            toast.error(gen.error_message || "Geração falhou");
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [boardId, updateNodeData]);
}
