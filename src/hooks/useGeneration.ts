"use client";

import { useCallback, useRef } from "react";
import { useCanvasStore } from "@/store/canvas.store";
import { toast } from "sonner";

export function useGeneration() {
  const updateNodeData = useCanvasStore((s) => s.updateNodeData);
  const pollingRef = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map());

  const startPolling = useCallback(
    (generationId: string, nodeId: string) => {
      // Evitar polling duplicado
      if (pollingRef.current.has(generationId)) return;

      const interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/jobs/${generationId}`);
          const data = await res.json();

          if (data.status === "completed") {
            clearInterval(interval);
            pollingRef.current.delete(generationId);

            updateNodeData(nodeId, {
              status: "completed",
              outputUrls: data.outputUrls || [],
            });

            toast.success("Geração concluída!");
          } else if (data.status === "failed") {
            clearInterval(interval);
            pollingRef.current.delete(generationId);

            updateNodeData(nodeId, { status: "failed" });
            toast.error(data.error || "Geração falhou");
          }
        } catch {
          // Ignorar erros temporários de polling
        }
      }, 5000);

      pollingRef.current.set(generationId, interval);

      // Timeout máximo: 10 minutos
      setTimeout(() => {
        if (pollingRef.current.has(generationId)) {
          clearInterval(pollingRef.current.get(generationId)!);
          pollingRef.current.delete(generationId);
          updateNodeData(nodeId, { status: "failed" });
          toast.error("Geração expirou (timeout)");
        }
      }, 10 * 60 * 1000);
    },
    [updateNodeData]
  );

  const generate = useCallback(
    async (nodeId: string, params: {
      model: string;
      prompt: string;
      imageUrls?: string[];
      aspectRatio?: string;
      resolution?: string;
      format?: string;
      variants?: number;
      boardId?: string;
      provider?: string;
    }) => {
      updateNodeData(nodeId, { status: "generating" });

      try {
        const res = await fetch("/api/generate/image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...params, nodeId }),
        });

        const data = await res.json();

        if (!res.ok) {
          updateNodeData(nodeId, { status: "failed" });
          toast.error(data.error || "Erro na geração");
          return;
        }

        toast.info("Geração iniciada...");
        startPolling(data.generationId, nodeId);
      } catch (err) {
        updateNodeData(nodeId, { status: "failed" });
        toast.error("Erro ao conectar com o servidor");
      }
    },
    [updateNodeData, startPolling]
  );

  return { generate };
}
