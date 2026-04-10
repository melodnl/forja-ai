"use client";

import { useMemo } from "react";
import { useCanvasStore } from "@/store/canvas.store";

/**
 * Retorna os dados dos nós conectados como inputs de um nó específico.
 * Resolve: imagens conectadas, textos de prompts, etc.
 */
export function useNodeInputs(nodeId: string) {
  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);

  return useMemo(() => {
    // Edges que chegam neste nó
    const incomingEdges = edges.filter((e) => e.target === nodeId);

    const imageUrls: string[] = [];
    let promptText = "";
    let copyTexts: string[] = [];
    let audioUrl = "";

    for (const edge of incomingEdges) {
      const sourceNode = nodes.find((n) => n.id === edge.source);
      if (!sourceNode) continue;

      const data = sourceNode.data as Record<string, unknown>;

      switch (sourceNode.type) {
        case "image":
        case "reference":
        case "avatar":
          if (data.url && typeof data.url === "string") {
            imageUrls.push(data.url);
          }
          break;

        case "prompt":
          if (data.text && typeof data.text === "string") {
            promptText = data.text;
          }
          break;

        case "creative":
          if (Array.isArray(data.outputUrls)) {
            for (const url of data.outputUrls) {
              if (typeof url === "string" && url) imageUrls.push(url);
            }
          }
          break;

        case "copy":
          if (Array.isArray(data.outputs)) {
            copyTexts = data.outputs.filter((t): t is string => typeof t === "string");
            // Usa o primeiro texto como prompt se não tiver prompt direto
            if (!promptText && copyTexts.length > 0) {
              promptText = copyTexts[0];
            }
          }
          break;

        case "voice":
          if (data.url && typeof data.url === "string") {
            audioUrl = data.url;
          }
          break;
      }
    }

    return { imageUrls, promptText, copyTexts, audioUrl };
  }, [nodeId, nodes, edges]);
}
