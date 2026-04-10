"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useCanvasStore } from "@/store/canvas.store";
import { toast } from "sonner";

const VIDEO_TYPES = ["video"];

/**
 * Escuta mudanças em tempo real na tabela `generations`
 * e atualiza os nós correspondentes no canvas + cria nós de output.
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
          const gen = payload.new as Record<string, unknown>;

          if (!gen.node_id) return;
          const nodeId = gen.node_id as string;

          if (gen.status === "completed") {
            const urls = (gen.output_urls as string[]) || [];

            updateNodeData(nodeId, {
              status: "completed",
              outputUrls: urls,
            });

            // Criar nós de output (vídeo ou imagem) se ainda não existem
            if (urls.length > 0) {
              const { nodes, addNode, edges } = useCanvasStore.getState();
              const sourceNode = nodes.find((n) => n.id === nodeId);
              if (!sourceNode) return;

              // Evitar duplicatas: se já existe um output conectado a este nó, pular
              const alreadyHasOutput = edges.some((e) => e.source === nodeId);
              if (alreadyHasOutput) return;

              const isVideo = VIDEO_TYPES.includes(gen.type as string);
              const baseX = sourceNode.position.x + 400;
              const baseY = sourceNode.position.y;
              const newEdges: { id: string; source: string; target: string; type: string; animated: boolean }[] = [];

              urls.forEach((url, i) => {
                const outputId = `${isVideo ? "video" : "image"}-rt-${Date.now()}-${i}`;
                const yOffset = i * 220;

                addNode({
                  id: outputId,
                  type: isVideo ? "video" : "image",
                  position: { x: baseX, y: baseY + yOffset },
                  data: isVideo
                    ? { label: `Vídeo ${i + 1}`, url, duration: 0 }
                    : { label: `Imagem ${i + 1}`, url, width: 0, height: 0, filename: "" },
                });

                newEdges.push({
                  id: `edge-${nodeId}-${outputId}`,
                  source: nodeId,
                  target: outputId,
                  type: "animated",
                  animated: true,
                });
              });

              const store = useCanvasStore.getState();
              useCanvasStore.setState({
                edges: [...store.edges, ...newEdges],
                hasUnsavedChanges: true,
              });
              useCanvasStore.getState().saveBoard();
            }

            toast.success("Geração concluída!");
          } else if (gen.status === "failed") {
            updateNodeData(gen.node_id as string, { status: "failed" });
            toast.error((gen.error_message as string) || "Geração falhou");
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [boardId, updateNodeData]);
}
