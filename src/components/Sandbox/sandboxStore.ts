/**
 * Sandbox Zustand Store
 * แยกจาก flowchartStore / gameStore ทั้งหมด
 */
import { create } from 'zustand';
import type { SbExecResult } from './sandboxEngine';

interface SandboxStore {
  // Handle hitbox highlight (reuse pattern from game)
  activeHandleKey: string | null;
  setActiveHandleKey: (key: string | null) => void;

  // Execution result (updated progressively during step/auto run)
  execResult: SbExecResult | null;
  setExecResult: (r: SbExecResult) => void;
  clearExecResult: () => void;

  // Currently-executing node (bright highlight while running, null when idle/done)
  currentNodeId: string | null;
  setCurrentNodeId: (id: string | null) => void;
}

export const useSandboxStore = create<SandboxStore>((set) => ({
  activeHandleKey: null,
  setActiveHandleKey: (key) => set({ activeHandleKey: key }),

  execResult: null,
  setExecResult: (r) => set({ execResult: r }),
  clearExecResult: () => set({ execResult: null, currentNodeId: null }),

  currentNodeId: null,
  setCurrentNodeId: (id) => set({ currentNodeId: id }),
}));
