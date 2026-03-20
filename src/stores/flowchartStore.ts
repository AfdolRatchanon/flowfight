import { create } from 'zustand';
import type { FlowNode, FlowEdge, ExecutionStep } from '../types/game.types';

type HistoryEntry = { nodes: FlowNode[]; edges: FlowEdge[] };
const MAX_HISTORY = 50;

interface FlowchartState {
  nodes: FlowNode[];
  edges: FlowEdge[];
  executionLog: ExecutionStep[];
  currentStepIndex: number;
  isValid: boolean;
  validationError: string | null;
  // Execution trace — set after each run so nodes can show visited state
  visitedNodeIds: string[];
  visitedConditionResults: Record<string, boolean>; // nodeId → YES(true)/NO(false)

  shieldGlowTypes: string[]; // action/condition types that need to be added to break shield
  setShieldGlowTypes: (types: string[]) => void;

  activeHandleKey: string | null; // `${nodeId}::${handleId}` — which handle is highlighted
  setActiveHandleKey: (key: string | null) => void;

  // Undo/Redo history
  _past: HistoryEntry[];
  _future: HistoryEntry[];
  undo: () => void;
  redo: () => void;
  _pushHistory: () => void;

  setNodes: (nodes: FlowNode[], recordHistory?: boolean) => void;
  setEdges: (edges: FlowEdge[], recordHistory?: boolean) => void;
  addNode: (node: FlowNode) => void;
  removeNode: (nodeId: string) => void;
  addEdge: (edge: FlowEdge) => void;
  removeEdge: (edgeId: string) => void;
  setExecutionLog: (log: ExecutionStep[]) => void;
  setCurrentStep: (index: number) => void;
  setValid: (valid: boolean, error?: string) => void;
  highlightNode: (nodeId: string | null) => void;
  resetFlowchart: () => void;
  clearToStartEnd: () => void;
  setVisitedTrace: (nodeIds: string[], results: Record<string, boolean>) => void;
  clearTrace: () => void;
  // Phase 4: Virus injection
  injectVirusNode: (virusNode: FlowNode, edgeId: string) => void;
  removeVirusNodes: () => void;
  hasVirusNodes: () => boolean;
}

const defaultNodes: FlowNode[] = [
  {
    id: 'start',
    type: 'start',
    position: { x: 300, y: 60 },
    data: { label: 'Start' },
  },
  {
    id: 'end',
    type: 'end',
    position: { x: 300, y: 620 },
    data: { label: 'End' },
  },
];

export const useFlowchartStore = create<FlowchartState>((set, get) => ({
  nodes: defaultNodes,
  edges: [],
  executionLog: [],
  currentStepIndex: -1,
  isValid: false,
  validationError: null,
  visitedNodeIds: [],
  visitedConditionResults: {},
  shieldGlowTypes: [],
  _past: [],
  _future: [],

  setShieldGlowTypes: (types) => set({ shieldGlowTypes: types }),
  activeHandleKey: null,
  setActiveHandleKey: (key) => set({ activeHandleKey: key }),

  _pushHistory: () => set((state) => ({
    _past: [...state._past, { nodes: state.nodes, edges: state.edges }].slice(-MAX_HISTORY),
    _future: [],
  })),

  undo: () => set((state) => {
    if (state._past.length === 0) return state;
    const prev = state._past[state._past.length - 1];
    return {
      nodes: prev.nodes,
      edges: prev.edges,
      _past: state._past.slice(0, -1),
      _future: [{ nodes: state.nodes, edges: state.edges }, ...state._future].slice(0, MAX_HISTORY),
    };
  }),

  redo: () => set((state) => {
    if (state._future.length === 0) return state;
    const next = state._future[0];
    return {
      nodes: next.nodes,
      edges: next.edges,
      _past: [...state._past, { nodes: state.nodes, edges: state.edges }].slice(-MAX_HISTORY),
      _future: state._future.slice(1),
    };
  }),

  setNodes: (nodes, recordHistory = false) => {
    if (recordHistory) get()._pushHistory();
    set({ nodes });
  },
  setEdges: (edges, recordHistory = false) => {
    if (recordHistory) get()._pushHistory();
    set({ edges });
  },

  addNode: (node) => {
    get()._pushHistory();
    set((state) => ({ nodes: [...state.nodes, node] }));
  },

  removeNode: (nodeId) => {
    get()._pushHistory();
    set((state) => ({
      nodes: state.nodes.filter((n) => n.id !== nodeId),
      edges: state.edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
    }));
  },

  addEdge: (edge) => {
    get()._pushHistory();
    set((state) => ({ edges: [...state.edges, edge] }));
  },

  removeEdge: (edgeId) => {
    get()._pushHistory();
    set((state) => ({ edges: state.edges.filter((e) => e.id !== edgeId) }));
  },

  setExecutionLog: (executionLog) => set({ executionLog }),
  setCurrentStep: (currentStepIndex) => set({ currentStepIndex }),

  setVisitedTrace: (visitedNodeIds, visitedConditionResults) => set({ visitedNodeIds, visitedConditionResults }),
  clearTrace: () => set({ visitedNodeIds: [], visitedConditionResults: {} }),

  setValid: (valid, error) => set({
    isValid: valid,
    validationError: error ?? null,
  }),

  highlightNode: (nodeId) => set((state) => ({
    nodes: state.nodes.map((n) => ({
      ...n,
      data: { ...n.data, isActive: n.id === nodeId },
    })),
  })),

  resetFlowchart: () => set({
    nodes: defaultNodes,
    edges: [],
    executionLog: [],
    currentStepIndex: -1,
    isValid: false,
    validationError: null,
    visitedNodeIds: [],
    visitedConditionResults: {},
  }),

  clearToStartEnd: () => set({
    nodes: defaultNodes,
    edges: [],
    executionLog: [],
    currentStepIndex: -1,
    isValid: false,
    validationError: null,
    visitedNodeIds: [],
    visitedConditionResults: {},
  }),

  // Phase 4: Virus injection
  injectVirusNode: (virusNode, edgeId) => set((state) => {
    const edge = state.edges.find((e) => e.id === edgeId);
    if (!edge) return state;

    // Remove the original edge
    const newEdges = state.edges.filter((e) => e.id !== edgeId);

    // Create two replacement edges: source → virusNode, virusNode → target
    const edgeToVirus: FlowEdge = {
      id: `e_${edge.source}_${virusNode.id}_${Date.now()}`,
      source: edge.source,
      target: virusNode.id,
      sourceHandle: edge.sourceHandle,
      label: edge.label,
      animated: edge.animated,
    };
    const edgeFromVirus: FlowEdge = {
      id: `e_${virusNode.id}_${edge.target}_${Date.now() + 1}`,
      source: virusNode.id,
      target: edge.target,
    };

    return {
      nodes: [...state.nodes, virusNode],
      edges: [...newEdges, edgeToVirus, edgeFromVirus],
    };
  }),

  removeVirusNodes: () => set((state) => {
    const virusIds = new Set(state.nodes.filter((n) => n.data.isVirus).map((n) => n.id));
    if (virusIds.size === 0) return state;

    // For each virus node, find its incoming and outgoing edges and reconnect
    const newEdges: FlowEdge[] = [];
    const processedVirus = new Set<string>();

    for (const virusId of virusIds) {
      processedVirus.add(virusId);
      const inEdges  = state.edges.filter((e) => e.target === virusId);
      const outEdges = state.edges.filter((e) => e.source === virusId);

      // Reconnect: each source of inEdge → each target of outEdge
      for (const inE of inEdges) {
        for (const outE of outEdges) {
          if (!virusIds.has(inE.source) && !virusIds.has(outE.target)) {
            newEdges.push({
              id: `e_${inE.source}_${outE.target}_${Date.now()}`,
              source: inE.source,
              target: outE.target,
              sourceHandle: inE.sourceHandle,
              label: inE.label,
              animated: inE.animated,
            });
          }
        }
      }
    }

    // Keep edges that don't touch any virus node
    const cleanEdges = state.edges.filter(
      (e) => !virusIds.has(e.source) && !virusIds.has(e.target)
    );

    return {
      nodes: state.nodes.filter((n) => !n.data.isVirus),
      edges: [...cleanEdges, ...newEdges],
    };
  }),

  hasVirusNodes: () => {
    return get().nodes.some((n) => n.data.isVirus === true);
  },
}));
