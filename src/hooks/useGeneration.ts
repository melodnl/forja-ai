"use client";

import { useCallback, useRef } from "react";
import { useCanvasStore } from "@/store/canvas.store";
import { toast } from "sonner";

export function useGeneration() {
  const updateNodeData = useCanvasStore((s) => s.updateNodeData);
  const pollingRef = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map());

  const createOutputNodes = useCallback(
    (sourceNodeId: string, urls: string[], isVideo: boolean) => {
      const { nodes, addNode, edges } = useCanvasStore.getState();
      const sourceNode = nodes.find((n) => n.id === sourceNodeId);
      if (!sourceNode) return;

      const baseX = sourceNode.position.x + 400;
      const baseY = sourceNode.position.y;

      urls.forEach((url, i) => {
        const outputId = `${isVideo ? "video" : "image"}-output-${Date.now()}-${i}`;
        const yOffset = i * 220;

        addNode({
          id: outputId,
          type: isVideo ? "video" : "image",
          position: { x: baseX, y: baseY + yOffset },
          data: isVideo
            ? { label: `Vídeo ${i + 1}`, url, duration: 0 }
            : { label: `Imagem ${i + 1}`, url, width: 0, height: 0, filename: "" },
        });

        // Conectar edge do creative → output
        const store = useCanvasStore.getState();
        const newEdge = {
          id: `edge-${sourceNodeId}-${outputId}`,
          source: sourceNodeId,
          target: outputId,
          type: "animated",
          animated: true,
        };
        useCanvasStore.setState({
          edges: [...store.edges, newEdge],
          hasUnsavedChanges: true,
        });
      });
    },
    []
  );

  const startPolling = useCallback(
    (generationId: string, nodeId: string, isVideo: boolean) => {
      if (pollingRef.current.has(generationId)) return;

      const interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/jobs/${generationId}`);
          const data = await res.json();

          if (data.status === "completed") {
            clearInterval(interval);
            pollingRef.current.delete(generationId);

            const urls = data.outputUrls || [];

            updateNodeData(nodeId, {
              status: "completed",
              outputUrls: urls,
            });

            // Criar nós de output conectados
            if (urls.length > 0) {
              createOutputNodes(nodeId, urls, isVideo);
            }

            toast.success("Geração concluída!");
          } else if (data.status === "failed") {
            clearInterval(interval);
            pollingRef.current.delete(generationId);

            updateNodeData(nodeId, { status: "failed" });
            toast.error(data.error || "Geração falhou");
          }
        } catch {
          // Ignorar erros temporários
        }
      }, 5000);

      pollingRef.current.set(generationId, interval);

      // Timeout: 10 minutos
      setTimeout(() => {
        if (pollingRef.current.has(generationId)) {
          clearInterval(pollingRef.current.get(generationId)!);
          pollingRef.current.delete(generationId);
          updateNodeData(nodeId, { status: "failed" });
          toast.error("Geração expirou (timeout)");
        }
      }, 10 * 60 * 1000);
    },
    [updateNodeData, createOutputNodes]
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

      // Detectar se é vídeo
      const videoModels = [
        "seedance-2", "seedance-2-fast", "seedance-1.5-pro",
        "veo3-fast", "veo3-quality", "veo3-lite", "veo3",
        "runway", "grok-video", "sora-2-characters",
      ];
      const isVideo = videoModels.includes(params.model);

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

        // Se resultado já veio imediato (Google)
        if (data.status === "completed" && data.outputUrls?.length) {
          updateNodeData(nodeId, { status: "completed", outputUrls: data.outputUrls });
          createOutputNodes(nodeId, data.outputUrls, isVideo);
          toast.success("Geração concluída!");
          return;
        }

        toast.info("Geração iniciada...");
        startPolling(data.generationId, nodeId, isVideo);
      } catch {
        updateNodeData(nodeId, { status: "failed" });
        toast.error("Erro ao conectar com o servidor");
      }
    },
    [updateNodeData, startPolling]
  );

  return { generate };
}
