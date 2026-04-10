"use client";

import { useCallback, useEffect } from "react";
import {
  ReactFlow,
  Background,
  MiniMap,
  BackgroundVariant,
  type NodeTypes,
  type EdgeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { useCanvasStore } from "@/store/canvas.store";
import { useRealtimeGenerations } from "@/hooks/useRealtimeGenerations";
import { ImageNode } from "./nodes/ImageNode";
import { PromptNode } from "./nodes/PromptNode";
import { CreativeNode } from "./nodes/CreativeNode";
import { VideoNode } from "./nodes/VideoNode";
import { VoiceNode } from "./nodes/VoiceNode";
import { CopyNode } from "./nodes/CopyNode";
import { UpscaleNode } from "./nodes/UpscaleNode";
import { RemoveBgNode } from "./nodes/RemoveBgNode";
import { UGCAvatarNode } from "./nodes/UGCAvatarNode";
import { AssistantNode } from "./nodes/AssistantNode";
import { ReferenceNode } from "./nodes/ReferenceNode";
import { AvatarNode } from "./nodes/AvatarNode";
import { AnimatedEdge } from "./edges/AnimatedEdge";
import { NodePalette } from "./NodePalette";
import { Onboarding } from "./Onboarding";

const nodeTypes: NodeTypes = {
  image: ImageNode,
  prompt: PromptNode,
  creative: CreativeNode,
  video: VideoNode,
  voice: VoiceNode,
  copy: CopyNode,
  upscale: UpscaleNode,
  remove_bg: RemoveBgNode,
  ugc_avatar: UGCAvatarNode,
  assistant: AssistantNode,
  reference: ReferenceNode,
  avatar: AvatarNode,
};

const edgeTypes: EdgeTypes = {
  animated: AnimatedEdge,
};

/** Checa se o foco está em um elemento editável */
function isEditableActive(): boolean {
  const el = document.activeElement;
  if (!el || el === document.body) return false;
  const tag = el.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    (el as HTMLElement).isContentEditable === true
  );
}

export function ForgeCanvas({ boardId }: { boardId: string }) {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    loadBoard,
    setSelectedNodeId,
    deleteNode,
    isLoading,
    isSaving,
    hasUnsavedChanges,
    saveBoard,
  } = useCanvasStore();

  useEffect(() => {
    loadBoard(boardId);
  }, [boardId, loadBoard]);

  // Realtime: atualiza nós quando geração completa via webhook
  useRealtimeGenerations(boardId);

  // Keyboard shortcuts — bubble phase normal (sem capture)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Delete / Backspace — deletar nó SOMENTE se não estiver em campo editável
      if (e.key === "Delete" || e.key === "Backspace") {
        if (isEditableActive()) return; // deixa o input/textarea funcionar normalmente
        const { selectedNodeId } = useCanvasStore.getState();
        if (selectedNodeId) {
          e.preventDefault();
          deleteNode(selectedNodeId);
        }
      }
      // Ctrl+S — salvar
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        saveBoard();
      }
      // Ctrl+Z / Ctrl+Shift+Z — undo/redo (apenas fora de campos editáveis)
      if ((e.metaKey || e.ctrlKey) && e.key === "z" && !isEditableActive()) {
        e.preventDefault();
        if (e.shiftKey) {
          useCanvasStore.getState().redo();
        } else {
          useCanvasStore.getState().undo();
        }
      }
      // Ctrl+D — duplicar nó
      if ((e.metaKey || e.ctrlKey) && e.key === "d") {
        e.preventDefault();
        const state = useCanvasStore.getState();
        const { selectedNodeId, nodes, addNode } = state;
        if (selectedNodeId) {
          const original = nodes.find((n) => n.id === selectedNodeId);
          if (original) {
            addNode({
              ...original,
              id: `${original.type}-${Date.now()}`,
              position: { x: original.position.x + 40, y: original.position.y + 40 },
              selected: false,
              data: { ...original.data },
            });
          }
        }
      }
    }

    // bubble phase — NÃO usar capture (true)
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [deleteNode, saveBoard]);

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: { id: string }) => {
      setSelectedNodeId(node.id);
    },
    [setSelectedNodeId]
  );

  const handlePaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, [setSelectedNodeId]);

  // Clicar na edge (fio) para removê-la
  const handleEdgeClick = useCallback(
    (_: React.MouseEvent, edge: { id: string }) => {
      useCanvasStore.setState({
        edges: useCanvasStore.getState().edges.filter((e) => e.id !== edge.id),
        hasUnsavedChanges: true,
      });
      // Salvar após remover
      setTimeout(() => useCanvasStore.getState().saveBoard(), 500);
    },
    []
  );

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[var(--canvas-bg)]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--forja-border)] border-t-[var(--forja-ember)]" />
          <span className="text-sm text-[var(--forja-text-muted)]">Carregando board...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      {/* Save indicator */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-2 rounded-lg bg-[var(--forja-bg-elevated)]/90 px-3 py-1.5 backdrop-blur-sm border border-[var(--forja-border)]">
        <div
          className={`h-2 w-2 rounded-full ${
            isSaving
              ? "bg-[var(--forja-warning)] animate-pulse"
              : hasUnsavedChanges
              ? "bg-[var(--forja-warning)]"
              : "bg-[var(--forja-success)]"
          }`}
        />
        <span className="text-[11px] text-[var(--forja-text-muted)]">
          {isSaving ? "Salvando..." : hasUnsavedChanges ? "Não salvo" : "Salvo"}
        </span>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={handleNodeClick}
        onEdgeClick={handleEdgeClick}
        onPaneClick={handlePaneClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={{ type: "animated", animated: true }}
        deleteKeyCode={null}
        selectionKeyCode={null}
        multiSelectionKeyCode={null}
        zoomActivationKeyCode={null}
        fitView
        proOptions={{ hideAttribution: true }}
        className="bg-[var(--canvas-bg)]"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1}
          color="var(--canvas-grid)"
        />
        <MiniMap
          nodeColor="var(--forja-bg-elevated)"
          maskColor="rgba(10, 9, 8, 0.8)"
          className="!bg-[var(--forja-bg-elevated)] !border-[var(--forja-border)] !rounded-lg"
        />
      </ReactFlow>

      <NodePalette />

      {/* Help button */}
      <button
        onClick={() => {
          localStorage.removeItem("forja-onboarding-done");
          window.location.reload();
        }}
        className="absolute bottom-4 right-4 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-[var(--forja-border)] bg-[var(--forja-bg-elevated)]/90 text-xs font-bold text-[var(--forja-text-muted)] backdrop-blur-sm hover:text-[var(--forja-ember)] hover:border-[var(--forja-ember)] transition-colors"
        title="Ver tutorial"
      >
        ?
      </button>

      <Onboarding />
    </div>
  );
}
