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
  /** Total raw damage taken from enemy (sum of every HP decrease, ignoring heals) */
  totalDamageTaken: number;
  /** จำนวน attempt ใน session ปัจจุบัน (นับเฉพาะ flowchart ที่ผ่าน validation) */
  sessionAttempts: number;
  // Balance + ailment display state (updated per step during execution)
  heroBurnRounds: number;
  heroFreezeRounds: number;
  heroPoisonRounds: number;
  enemyStunnedRounds: number;
  enemyBurnRounds: number;
  enemyFreezeRounds: number;
  enemyPoisonRounds: number;
  heroBerserkRounds: number;
  healCharges: number;
  comboCount: number;

  initBattle: (character: Character, enemy: Enemy, levelId: string) => void;
  setBattle: (battle: Battle | null) => void;
  setStatus: (status: BattleStatus) => void;
  updateHeroHP: (hp: number) => void;
  updateEnemyHP: (hp: number) => void;
  addLog: (log: BattleLog) => void;
  setExecuting: (executing: boolean) => void;
  setCurrentNode: (nodeId: string | null) => void;
  incrementRound: () => void;
  setTotalDamageTaken: (dmg: number) => void;
  setAilments: (a: { burn: number; freeze: number; poison: number; enemyStun: number; enemyBurn?: number; enemyFreeze?: number; enemyPoison?: number; heroBerserk?: number }) => void;
  setHealCharges: (n: number) => void;
  setComboCount: (n: number) => void;
  incrementSessionAttempts: () => void;
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
  totalDamageTaken: 0,
  sessionAttempts: 0,
  heroBurnRounds: 0,
  heroFreezeRounds: 0,
  heroPoisonRounds: 0,
  enemyStunnedRounds: 0,
  enemyBurnRounds: 0,
  enemyFreezeRounds: 0,
  enemyPoisonRounds: 0,
  heroBerserkRounds: 0,
  healCharges: 3,
  comboCount: 0,

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
      heroBurnRounds: 0,
      heroFreezeRounds: 0,
      heroPoisonRounds: 0,
      enemyStunnedRounds: 0,
      enemyBurnRounds: 0,
      enemyFreezeRounds: 0,
      enemyPoisonRounds: 0,
      heroBerserkRounds: 0,
      healCharges: 3,
      comboCount: 0,
      totalDamageTaken: 0,
      sessionAttempts: 0,
    });
  },

  setBattle: (battle) => set({ battle }),
  setStatus: (status) => set({ status }),
  setTotalDamageTaken: (totalDamageTaken) => set({ totalDamageTaken }),
  updateHeroHP: (hp) => set({ heroHP: Math.max(0, hp) }),
  updateEnemyHP: (hp) => set({ enemyHP: Math.max(0, hp) }),
  addLog: (log) => set((state) => ({ battleLog: [...state.battleLog, log] })),
  setExecuting: (isExecuting) => set({ isExecuting }),
  setCurrentNode: (currentNodeId) => set({ currentNodeId }),
  incrementRound: () => set((state) => ({ currentRound: state.currentRound + 1 })),
  setAilments: (a) => set({
    heroBurnRounds: a.burn,
    heroFreezeRounds: a.freeze,
    heroPoisonRounds: a.poison,
    enemyStunnedRounds: a.enemyStun,
    ...(a.enemyBurn !== undefined ? { enemyBurnRounds: a.enemyBurn } : {}),
    ...(a.enemyFreeze !== undefined ? { enemyFreezeRounds: a.enemyFreeze } : {}),
    ...(a.enemyPoison !== undefined ? { enemyPoisonRounds: a.enemyPoison } : {}),
    ...(a.heroBerserk !== undefined ? { heroBerserkRounds: a.heroBerserk } : {}),
  }),
  setHealCharges: (healCharges) => set({ healCharges }),
  setComboCount: (comboCount) => set({ comboCount }),
  incrementSessionAttempts: () => set((state) => ({ sessionAttempts: state.sessionAttempts + 1 })),

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
    totalDamageTaken: 0,
    heroBurnRounds: 0,
    heroFreezeRounds: 0,
    heroPoisonRounds: 0,
    enemyStunnedRounds: 0,
    enemyBurnRounds: 0,
    enemyFreezeRounds: 0,
    enemyPoisonRounds: 0,
    heroBerserkRounds: 0,
    healCharges: 3,
    comboCount: 0,
    sessionAttempts: 0,
  }),
}));
