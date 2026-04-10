import { create } from "zustand";
import {
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
} from "@xyflow/react";
import { createClient } from "@/lib/supabase/client";

interface Snapshot {
  nodes: Node[];
  edges: Edge[];
}

interface CanvasState {
  boardId: string | null;
  boardName: string;
  nodes: Node[];
  edges: Edge[];
  selectedNodeId: string | null;
  isLoading: boolean;
  isSaving: boolean;
  lastSavedAt: Date | null;
  hasUnsavedChanges: boolean;
  undoStack: Snapshot[];
  redoStack: Snapshot[];

  // Actions
  setBoardId: (id: string) => void;
  setBoardName: (name: string) => void;
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  addNode: (node: Node) => void;
  updateNodeData: (id: string, data: Record<string, unknown>) => void;
  deleteNode: (id: string) => void;
  setSelectedNodeId: (id: string | null) => void;
  saveBoard: () => Promise<void>;
  loadBoard: (id: string) => Promise<void>;
  markUnsaved: () => void;
  undo: () => void;
  redo: () => void;
  pushSnapshot: () => void;
}

let saveTimeout: ReturnType<typeof setTimeout> | null = null;

function debouncedSave(get: () => CanvasState) {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    get().saveBoard();
  }, 2000);
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
  boardId: null,
  boardName: "Novo Board",
  nodes: [],
  undoStack: [],
  redoStack: [],
  edges: [],
  selectedNodeId: null,
  isLoading: true,
  isSaving: false,
  lastSavedAt: null,
  hasUnsavedChanges: false,

  setBoardId: (id) => set({ boardId: id }),
  setBoardName: (name) => {
    set({ boardName: name, hasUnsavedChanges: true });
    debouncedSave(get);
  },

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),

  onNodesChange: (changes) => {
    set({ nodes: applyNodeChanges(changes, get().nodes), hasUnsavedChanges: true });
    debouncedSave(get);
  },

  onEdgesChange: (changes) => {
    set({ edges: applyEdgeChanges(changes, get().edges), hasUnsavedChanges: true });
    debouncedSave(get);
  },

  onConnect: (connection) => {
    set({
      edges: addEdge(
        { ...connection, type: "animated", animated: true },
        get().edges
      ),
      hasUnsavedChanges: true,
    });
    debouncedSave(get);
  },

  addNode: (node) => {
    get().pushSnapshot();
    set({ nodes: [...get().nodes, node], hasUnsavedChanges: true });
    debouncedSave(get);
  },

  updateNodeData: (id, data) => {
    set({
      nodes: get().nodes.map((n) =>
        n.id === id ? { ...n, data: { ...n.data, ...data } } : n
      ),
      hasUnsavedChanges: true,
    });
    debouncedSave(get);
  },

  deleteNode: (id) => {
    get().pushSnapshot();
    set({
      nodes: get().nodes.filter((n) => n.id !== id),
      edges: get().edges.filter((e) => e.source !== id && e.target !== id),
      hasUnsavedChanges: true,
    });
    debouncedSave(get);
  },

  setSelectedNodeId: (id) => set({ selectedNodeId: id }),

  markUnsaved: () => set({ hasUnsavedChanges: true }),

  pushSnapshot: () => {
    const { nodes, edges, undoStack } = get();
    const snapshot = { nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) };
    set({ undoStack: [...undoStack.slice(-30), snapshot], redoStack: [] });
  },

  undo: () => {
    const { undoStack, nodes, edges } = get();
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    const currentSnapshot = { nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) };
    set({
      nodes: prev.nodes,
      edges: prev.edges,
      undoStack: undoStack.slice(0, -1),
      redoStack: [...get().redoStack, currentSnapshot],
      hasUnsavedChanges: true,
    });
    debouncedSave(get);
  },

  redo: () => {
    const { redoStack, nodes, edges } = get();
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    const currentSnapshot = { nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) };
    set({
      nodes: next.nodes,
      edges: next.edges,
      redoStack: redoStack.slice(0, -1),
      undoStack: [...get().undoStack, currentSnapshot],
      hasUnsavedChanges: true,
    });
    debouncedSave(get);
  },

  saveBoard: async () => {
    const { boardId, nodes, edges, boardName, isSaving } = get();
    if (!boardId) return;

    // Se já está salvando, agenda retry em 1s para não perder dados
    if (isSaving) {
      setTimeout(() => { get().saveBoard(); }, 1000);
      return;
    }

    set({ isSaving: true });
    try {
      const supabase = createClient();
      await supabase
        .from("boards")
        .update({
          name: boardName,
          nodes: JSON.parse(JSON.stringify(nodes)),
          edges: JSON.parse(JSON.stringify(edges)),
        })
        .eq("id", boardId);

      set({ isSaving: false, lastSavedAt: new Date(), hasUnsavedChanges: false });
    } catch {
      set({ isSaving: false });
    }
  },

  loadBoard: async (id) => {
    set({ isLoading: true });
    const supabase = createClient();
    const { data, error } = await supabase
      .from("boards")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      set({ isLoading: false });
      return;
    }

    set({
      boardId: id,
      boardName: data.name,
      nodes: (data.nodes as Node[]) || [],
      edges: (data.edges as Edge[]) || [],
      hasUnsavedChanges: false,
      isLoading: false,
    });
  },
}));
