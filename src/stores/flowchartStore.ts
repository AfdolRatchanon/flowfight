import { create } from 'zustand';
import type { FlowNode, FlowEdge, ExecutionStep } from '../types/game.types';

interface FlowchartState {
  nodes: FlowNode[];
  edges: FlowEdge[];
  executionLog: ExecutionStep[];
  currentStepIndex: number;
  isValid: boolean;
  validationError: string | null;

  setNodes: (nodes: FlowNode[]) => void;
  setEdges: (edges: FlowEdge[]) => void;
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

export const useFlowchartStore = create<FlowchartState>((set) => ({
  nodes: defaultNodes,
  edges: [],
  executionLog: [],
  currentStepIndex: -1,
  isValid: false,
  validationError: null,

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),

  addNode: (node) => set((state) => ({
    nodes: [...state.nodes, node],
  })),

  removeNode: (nodeId) => set((state) => ({
    nodes: state.nodes.filter((n) => n.id !== nodeId),
    edges: state.edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
  })),

  addEdge: (edge) => set((state) => ({
    edges: [...state.edges, edge],
  })),

  removeEdge: (edgeId) => set((state) => ({
    edges: state.edges.filter((e) => e.id !== edgeId),
  })),

  setExecutionLog: (executionLog) => set({ executionLog }),
  setCurrentStep: (currentStepIndex) => set({ currentStepIndex }),

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
  }),

  clearToStartEnd: () => set({
    nodes: defaultNodes,
    edges: [],
    executionLog: [],
    currentStepIndex: -1,
    isValid: false,
    validationError: null,
  }),
}));
