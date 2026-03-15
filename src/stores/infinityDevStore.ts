import { create } from 'zustand';
import type { PathId, SupCardId, HardwareId, PluginId, CorruptedFileId, VirusId } from '../utils/infinityDevConstants';
import { SUP_CARDS, VIRUSES } from '../utils/infinityDevConstants';

export interface InfinityDevState {
  // Phase
  phase: 'path_select' | 'battle' | 'sub_card_select' | 'terminal' | 'game_over' | 'idle';

  // Path & Cards
  selectedPath: PathId | null;
  supCards: SupCardId[];
  pathSynergyCount: number;

  // Wave
  wave: number;

  // Resources
  dataFragments: number;

  // Hero stats (separate from campaign character)
  heroMaxHp: number;
  heroCurrentHp: number;
  heroBaseAttack: number;
  heroBaseDefense: number;
  heroBaseSpeed: number;
  heroShield: number;

  // Budget (separate from campaign)
  infinityMaxBudget: number;

  // Permanent items
  hardware: HardwareId[];
  plugins: PluginId[];
  corruptedFiles: CorruptedFileId[];
  viruses: VirusId[];

  // Turn-specific state (reset each turn)
  selfDamageThisTurn: number;
  blocksRunThisTurn: number;
  decisionsThroughYesThisTurn: number;
  decisionsRunThisTurn: number;
  budgetUsedLastTurn: number;
  budgetFullyUsedLastTurn: boolean;
  attackUsedThisTurn: boolean;
  sacrificeUsedThisTurn: boolean;
  emergencyCastUsedThisTurn: boolean;
  deathsDoorActive: boolean;
  thornyLogicBonusDmg: number;

  // Virus flags
  corruptedSectorActive: boolean;
  adwareBlockPresent: boolean;

  // Pending sup-card choices (during sub_card_select phase)
  pendingSupCardChoices: SupCardId[];

  // Actions
  setPhase: (phase: InfinityDevState['phase']) => void;
  startRun: (pathId: PathId, characterStats: { hp: number; atk: number; def: number; spd: number }) => void;
  addSupCard: (id: SupCardId) => void;
  addHardware: (id: HardwareId) => void;
  addPlugin: (id: PluginId) => void;
  addCorruptedFile: (id: CorruptedFileId) => void;
  acceptVirus: (id: VirusId) => void;
  advanceWave: () => void;
  spendDataFragments: (amount: number) => boolean;
  gainDataFragments: (amount: number) => void;
  setHeroHp: (hp: number) => void;
  addShield: (amount: number) => void;
  resetTurnState: () => void;
  setPendingSupCardChoices: (choices: SupCardId[]) => void;
  resetRun: () => void;
}

export const useInfinityDevStore = create<InfinityDevState>((set, get) => ({
  phase: 'idle',
  selectedPath: null,
  supCards: [],
  pathSynergyCount: 0,
  wave: 0,
  dataFragments: 0,
  heroMaxHp: 100,
  heroCurrentHp: 100,
  heroBaseAttack: 15,
  heroBaseDefense: 5,
  heroBaseSpeed: 10,
  heroShield: 0,
  infinityMaxBudget: 5,
  hardware: [],
  plugins: [],
  corruptedFiles: [],
  viruses: [],
  selfDamageThisTurn: 0,
  blocksRunThisTurn: 0,
  decisionsThroughYesThisTurn: 0,
  decisionsRunThisTurn: 0,
  budgetUsedLastTurn: 0,
  budgetFullyUsedLastTurn: false,
  attackUsedThisTurn: false,
  sacrificeUsedThisTurn: false,
  emergencyCastUsedThisTurn: false,
  deathsDoorActive: false,
  thornyLogicBonusDmg: 0,
  corruptedSectorActive: false,
  adwareBlockPresent: false,
  pendingSupCardChoices: [],

  setPhase: (phase) => set({ phase }),

  startRun: (pathId, stats) => set({
    phase: 'battle',
    selectedPath: pathId,
    supCards: [],
    pathSynergyCount: 0,
    wave: 1,
    dataFragments: 0,
    heroMaxHp: stats.hp,
    heroCurrentHp: stats.hp,
    heroBaseAttack: stats.atk,
    heroBaseDefense: stats.def,
    heroBaseSpeed: stats.spd,
    heroShield: 0,
    infinityMaxBudget: 5,
    hardware: [],
    plugins: [],
    corruptedFiles: [],
    viruses: [],
    selfDamageThisTurn: 0,
    blocksRunThisTurn: 0,
    decisionsThroughYesThisTurn: 0,
    decisionsRunThisTurn: 0,
    budgetUsedLastTurn: 0,
    budgetFullyUsedLastTurn: false,
    attackUsedThisTurn: false,
    sacrificeUsedThisTurn: false,
    emergencyCastUsedThisTurn: false,
    deathsDoorActive: false,
    thornyLogicBonusDmg: 0,
    corruptedSectorActive: false,
    adwareBlockPresent: false,
    pendingSupCardChoices: [],
  }),

  addSupCard: (id) => set((s) => {
    const card = SUP_CARDS.find((c) => c.id === id);
    const isMatch = card?.pathAffinity === s.selectedPath;
    return {
      supCards: [...s.supCards, id],
      pathSynergyCount: s.pathSynergyCount + (isMatch ? 1 : 0),
    };
  }),

  addHardware: (id) => set((s) => {
    const maxBudgetBonus = id === 'overclocked_cpu' ? 2 : 0;
    return {
      hardware: [...s.hardware, id],
      infinityMaxBudget: s.infinityMaxBudget + maxBudgetBonus,
    };
  }),

  addPlugin: (id) => set((s) => {
    const maxHpBonus = id === 'cloud_backup' ? 5 : 0;
    return {
      plugins: [...s.plugins, id],
      heroMaxHp: s.heroMaxHp + maxHpBonus,
      heroCurrentHp: s.heroCurrentHp + maxHpBonus,
    };
  }),

  addCorruptedFile: (id) => set((s) => {
    const maxBudgetBonus = id === 'root_access' ? 3 : 0;
    const maxHpCostPct =
      id === 'root_access' ? 0.5
      : id === 'infinite_dll' ? 0.3
      : id === 'condition_of_death' ? 0.4
      : 0.25;
    const hpCost = Math.floor(s.heroMaxHp * maxHpCostPct);
    const newMaxHp = Math.max(10, s.heroMaxHp - hpCost);
    return {
      corruptedFiles: [...s.corruptedFiles, id],
      heroMaxHp: newMaxHp,
      heroCurrentHp: Math.min(s.heroCurrentHp, newMaxHp),
      infinityMaxBudget: s.infinityMaxBudget + maxBudgetBonus,
    };
  }),

  acceptVirus: (id) => set((s) => {
    const virus = VIRUSES.find((v) => v.id === id);
    const dfGain = virus?.rewardDataFragments ?? 0;
    const hpGain = virus?.rewardMaxHp ?? 0;
    return {
      viruses: [...s.viruses, id],
      dataFragments: s.dataFragments + dfGain,
      heroMaxHp: s.heroMaxHp + hpGain,
      heroCurrentHp: s.heroCurrentHp + hpGain,
      corruptedSectorActive: id === 'corrupted_sector' ? true : s.corruptedSectorActive,
      adwareBlockPresent: id === 'adware' ? true : s.adwareBlockPresent,
      infinityMaxBudget: id === 'bloatware' ? Math.max(1, s.infinityMaxBudget - 1) : s.infinityMaxBudget,
    };
  }),

  advanceWave: () => set((s) => ({ wave: s.wave + 1 })),

  spendDataFragments: (amount) => {
    const s = get();
    if (s.dataFragments < amount) return false;
    set({ dataFragments: s.dataFragments - amount });
    return true;
  },

  gainDataFragments: (amount) => set((s) => {
    const mult = s.viruses.includes('ransomware') ? 0.7 : 1;
    return { dataFragments: s.dataFragments + Math.floor(amount * mult) };
  }),

  setHeroHp: (hp) => set((s) => ({ heroCurrentHp: Math.max(0, Math.min(hp, s.heroMaxHp)) })),

  addShield: (amount) => set((s) => ({ heroShield: Math.max(0, s.heroShield + amount) })),

  resetTurnState: () => set({
    selfDamageThisTurn: 0,
    blocksRunThisTurn: 0,
    decisionsThroughYesThisTurn: 0,
    decisionsRunThisTurn: 0,
    attackUsedThisTurn: false,
    sacrificeUsedThisTurn: false,
    emergencyCastUsedThisTurn: false,
    thornyLogicBonusDmg: 0,
    heroShield: 0,
  }),

  setPendingSupCardChoices: (choices) => set({ pendingSupCardChoices: choices }),

  resetRun: () => set({ phase: 'idle', selectedPath: null, supCards: [], wave: 0 }),
}));
