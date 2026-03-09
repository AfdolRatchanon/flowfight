// ===========================
// FlowFight - Game Type Definitions
// ===========================

export type GameMode = 'normal' | 'hardcore';
export type CharacterClass = 'knight' | 'mage' | 'rogue' | 'barbarian';
export type EquipmentType = 'weapon' | 'armor' | 'head' | 'accessory';
export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

// ===========================
// Player & Auth
// ===========================

export interface CharacterProgress {
  level: number;
  experience: number;
  maxHP: number;
  attack: number;
  defense: number;
  speed: number;
  class?: CharacterClass;
  name?: string;
}

export interface Player {
  id: string;
  username: string;        // ชื่อแสดงผล
  firstName?: string;      // ชื่อจริง
  surname?: string;        // นามสกุล
  email: string;
  isAnonymous?: boolean;
  levelsCompleted: string[]; // level IDs ที่ผ่านแล้ว ['level_1', 'level_2']
  characterProgress?: CharacterProgress; // ความก้าวหน้าตัวละคร
  createdAt: number;
  lastActive: number;
  stats: PlayerStats;
  preferences: PlayerPreferences;
}

export interface PlayerStats {
  totalKills: number;
  totalDefeats: number;
  levelReached: number;
  totalPlayTime: number;
}

export interface PlayerPreferences {
  difficulty: GameMode;
  soundEnabled: boolean;
  musicVolume: number;
  sfxVolume: number;
}

// ===========================
// Character & Equipment
// ===========================

export interface CharacterColors {
  primary: string;
  secondary: string;
  accent: string;
}

export interface EquipmentItem {
  id: string;
  type: EquipmentType;
  name: string;
  description: string;
  spriteId: string;
  stats: EquipmentStats;
  cost: number;
  rarity: ItemRarity;
}

export interface EquipmentStats {
  attackBonus: number;
  defenseBonus: number;
  hpBonus: number;
  speedBonus: number;
}

export interface CharacterEquipment {
  weapon: EquipmentItem | null;
  armor: EquipmentItem | null;
  head: EquipmentItem | null;
  accessory: EquipmentItem | null;
}

export interface CharacterStats {
  maxHP: number;
  currentHP: number;
  attack: number;
  defense: number;
  speed: number;
  armor?: number;  // Physical damage reduction (flat)
  parry?: number;  // % chance to parry incoming attack (0-100)
}

export interface Character {
  id: string;
  playerId: string;
  name: string;
  class: CharacterClass;
  level: number;
  experience: number;
  stats: CharacterStats;
  appearance: {
    skinId: string;
    colors: CharacterColors;
  };
  equipment: CharacterEquipment;
  gameMode: GameMode;
  isAlive: boolean;
  currentLevel: number;
  createdAt: number;
  lastModified: number;
}

// ===========================
// Enemies
// ===========================

export interface Enemy {
  id: string;
  name: string;
  spriteId: string;
  stats: CharacterStats;
  behaviors: string[];
}

// ===========================
// Level System
// ===========================

export interface LevelRewards {
  experience: number;
  equipment?: EquipmentItem[];
  gold?: number;
}

// block types that a level can REQUIRE the player to use
export type RequiredBlock = 'condition' | 'loop' | 'heal' | 'dodge' | 'cast_spell';

export interface Level {
  id: string;
  number: number;
  name: string;
  description: string;
  difficultyEstimate: number; // 1-5
  enemy: Enemy;
  tutorialText?: string;
  concept: string; // What programming concept this teaches
  objectives: string[];         // เงื่อนไขการผ่านด่าน (แสดงในหน้า battle)
  bonusObjective?: string;      // โบนัส (optional, ไม่บังคับ)
  requiredBlocks?: RequiredBlock[]; // block types ที่ต้องใช้จริง — ตรวจสอบก่อนบันทึก
  unlockRequirements: {
    levelRequired: number;
    previousLevelComplete: boolean;
  };
  rewards: LevelRewards;
}

// ===========================
// Flowchart
// ===========================

export type FlowNodeType = 'start' | 'end' | 'action' | 'condition' | 'loop' | 'operator';
export type ActionType = 'attack' | 'heal' | 'dodge' | 'cast_spell' | 'use_item';
export type ConditionType = 'hp_greater' | 'hp_less' | 'enemy_alive' | 'enemy_close';
export type LoopType = 'repeat' | 'while_alive' | 'while_hp';

export interface FlowNodeData {
  label: string;
  actionType?: ActionType;
  conditionType?: ConditionType;
  loopType?: LoopType;
  loopCount?: number;
  threshold?: number; // For HP conditions
  isActive?: boolean; // Highlighted during execution
  result?: boolean; // Result of condition (for coloring edges)
}

export interface FlowNode {
  id: string;
  type: FlowNodeType;
  position: { x: number; y: number };
  data: FlowNodeData;
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  label?: string; // 'yes' | 'no' for conditions
  animated?: boolean;
}

export interface ExecutionStep {
  nodeId: string;
  action?: ActionType;
  result?: boolean;
  battleLog?: string;
  timestamp: number;
  heroHP?: number;   // HP หลังจาก step นี้รัน (สำหรับ real-time update)
  enemyHP?: number;
}

export interface FlowchartData {
  id: string;
  levelId: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
  createdAt: number;
  executedAt?: number;
  success: boolean;
  executionLog: ExecutionStep[];
}

// ===========================
// Battle
// ===========================

export type BattleStatus = 'waiting' | 'running' | 'victory' | 'defeat' | 'draw';

export interface BattleLog {
  round: number;
  action: string;
  actor: 'hero' | 'enemy';
  damage?: number;
  heal?: number;
  timestamp: number;
}

export interface Battle {
  id: string;
  levelId: string;
  playerId: string;
  characterId: string;
  character: Character;
  enemy: Enemy;
  flowchart?: FlowchartData;
  round: number;
  status: BattleStatus;
  log: BattleLog[];
  timestamp: number;
}

// ===========================
// Leaderboard
// ===========================

export interface LeaderboardEntry {
  rank: number;
  playerId: string;
  playerName: string;
  characterName: string;
  characterClass: CharacterClass;
  characterLevel: number;
  experience: number;
  levelReached: number;
  levelsCompleted: number;
  totalKills: number;
  totalPlayTime: number;
  gameMode: GameMode;
  lastUpdated: number;
}
