import { create } from 'zustand';
import type { Battle, BattleStatus, BattleLog, Enemy, Character } from '../types/game.types';

interface BattleState {
  battle: Battle | null;
  status: BattleStatus;
  heroHP: number;
  heroMaxHP: number;
  enemyHP: number;
  enemyMaxHP: number;
  currentRound: number;
  battleLog: BattleLog[];
  isExecuting: boolean;
  currentNodeId: string | null;

  initBattle: (character: Character, enemy: Enemy, levelId: string) => void;
  setBattle: (battle: Battle | null) => void;
  setStatus: (status: BattleStatus) => void;
  updateHeroHP: (hp: number) => void;
  updateEnemyHP: (hp: number) => void;
  addLog: (log: BattleLog) => void;
  setExecuting: (executing: boolean) => void;
  setCurrentNode: (nodeId: string | null) => void;
  incrementRound: () => void;
  resetBattle: () => void;
}

export const useBattleStore = create<BattleState>((set) => ({
  battle: null,
  status: 'waiting',
  heroHP: 100,
  heroMaxHP: 100,
  enemyHP: 80,
  enemyMaxHP: 80,
  currentRound: 1,
  battleLog: [],
  isExecuting: false,
  currentNodeId: null,

  initBattle: (character, enemy, levelId) => {
    const newBattle: Battle = {
      id: `battle_${Date.now()}`,
      levelId,
      playerId: character.playerId,
      characterId: character.id,
      character,
      enemy,
      round: 1,
      status: 'waiting',
      log: [],
      timestamp: Date.now(),
    };
    set({
      battle: newBattle,
      status: 'waiting',
      heroHP: character.stats.currentHP,
      heroMaxHP: character.stats.maxHP,
      enemyHP: enemy.stats.currentHP,
      enemyMaxHP: enemy.stats.maxHP,
      currentRound: 1,
      battleLog: [],
    });
  },

  setBattle: (battle) => set({ battle }),
  setStatus: (status) => set({ status }),
  updateHeroHP: (hp) => set({ heroHP: Math.max(0, hp) }),
  updateEnemyHP: (hp) => set({ enemyHP: Math.max(0, hp) }),
  addLog: (log) => set((state) => ({ battleLog: [...state.battleLog, log] })),
  setExecuting: (isExecuting) => set({ isExecuting }),
  setCurrentNode: (currentNodeId) => set({ currentNodeId }),
  incrementRound: () => set((state) => ({ currentRound: state.currentRound + 1 })),

  resetBattle: () => set({
    battle: null,
    status: 'waiting',
    heroHP: 100,
    heroMaxHP: 100,
    enemyHP: 80,
    enemyMaxHP: 80,
    currentRound: 1,
    battleLog: [],
    isExecuting: false,
    currentNodeId: null,
  }),
}));
