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
  endlessHighScore?: number;  // คะแนนสูงสุด Endless Mode
  endlessHighWave?: number;   // Wave สูงสุด Endless Mode
  /** ความก้าวหน้าแยกต่อ class */
  characterProgress?: Partial<Record<CharacterClass, CharacterProgress>>;
  lastPlayedClass?: CharacterClass; // class ล่าสุดที่เลือก
  /** เงิน (gold) — ใช้ร่วมกันทุก class */
  gold?: number;
  /** อุปกรณ์ที่ซื้อแล้ว — ใช้ร่วมกันทุก class */
  purchasedEquipment?: string[];
  /** จำนวนครั้งที่ clear แต่ละด่าน (สำหรับ diminishing returns) */
  levelClearCounts?: Record<string, number>;
  /** รายวัน — reset ทุกเที่ยงคืน UTC+7 */
  dailyFarm?: { date: string; plays: Record<string, number> };
  /** Achievements ที่ปลดล็อคแล้ว — เก็บเป็น achievement ID */
  achievements?: string[];
  role?: 'student' | 'teacher' | 'admin';
  classroomCode?: string;   // รหัสห้องเรียนที่นักเรียน join อยู่
  levelScores?: Record<string, number>; // best score 0-100 ต่อด่าน (auto-grading)
  createdAt: number;
  lastActive: number;
  stats: PlayerStats;
  preferences: PlayerPreferences;
}

export interface Classroom {
  roomCode: string;        // 6-digit code
  teacherId: string;
  teacherName: string;
  className: string;
  students: string[];      // array of student uids
  createdAt: number;
}

export interface StudentProgress {
  uid: string;
  username: string;
  firstName?: string;
  surname?: string;
  email?: string;
  role?: string;
  levelsCompleted: string[];
  levelScores?: Record<string, number>;
  lastActive: number;
  classroomCode?: string;
}

export interface Assignment {
  id: string;
  classroomCode: string;
  teacherId: string;
  title: string;
  levelIds: string[];   // level IDs ที่ต้องผ่าน
  deadline: number;     // Unix timestamp ms
  createdAt: number;
}

// ===========================
// Custom Level (Teacher-created)
// ===========================

export type EnemyBehavior = 'attack' | 'poison_strike' | 'freeze_strike' | 'burn_strike' | 'heal' | 'cast_spell' | 'power_strike';

export interface CustomLevelEnemy {
  name: string;
  hp: number;          // 50–1000
  atk: number;         // 5–80
  def: number;         // 0–30
  behaviors: EnemyBehavior[];
  budgetPerTurn: number; // 1–3
  shield?: boolean;    // ต้องวาง required block ก่อนโจมตีได้
}

export interface CustomLevel {
  id: string;                    // Firestore doc ID
  classroomCode: string;
  createdBy: string;             // teacher uid
  createdAt: number;
  updatedAt: number;
  name: string;
  description: string;
  concept: string;               // programming concept สอน
  difficulty: 1 | 2 | 3 | 4 | 5;
  enemy: CustomLevelEnemy;
  allowedBlocks?: string[];      // undefined = ทุก block
  requiredBlocks?: string[];     // ต้องวางก่อน run
  nodeLimit?: number;            // จำกัด action nodes
  objectives: string[];
  bonusObjective?: string;
  published: boolean;            // true = นักเรียนเห็นได้
}

export interface CustomLevelFormData {
  name: string;
  description: string;
  concept: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  enemy: CustomLevelEnemy;
  allowedBlocks: string[];
  requiredBlocks: string[];
  nodeLimit: number | '';
  objectives: string;
  bonusObjective: string;
  published: boolean;
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
  requiredLevel: number;          // minimum character level to equip
  allowedClasses: readonly CharacterClass[]; // empty = all classes can use
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
  budgetPerTurn?: number; // how many action-points enemy spends per turn (default 1)
}

export interface InitialHeroStatus {
  poisonRounds?: number;
  freezeRounds?: number;
  burnRounds?: number;
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
export type RequiredBlock = 'condition' | 'heal' | 'dodge' | 'cast_spell' | 'power_strike'
  | 'enemy_alive' | 'hp_less' | 'turn_gte' | 'hero_poisoned' | 'hero_frozen';

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
  allowedBlocks?: string[]; // block types ที่อนุญาตให้ใช้ใน level นี้ (undefined = ทั้งหมด)
  initialHeroHPPercent?: number; // 0–1, hero starts at this % of maxHP (default 1.0)
  initialHeroStatus?: InitialHeroStatus; // pre-set ailments at battle start
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
export type ActionType =
  | 'attack' | 'heal' | 'dodge' | 'cast_spell' | 'use_item' | 'power_strike' | 'berserk'
  // Knight skills
  | 'shield' | 'counter' | 'war_cry'
  // Mage skills
  | 'fireball' | 'frost_nova' | 'arcane_surge'
  // Rogue skills
  | 'backstab' | 'poison_strike' | 'shadow_step'
  // Barbarian skills
  | 'whirlwind' | 'bloodthirst' | 'battle_cry'
  // Battle consumables
  | 'use_antidote' | 'use_potion'
  // Shop actions
  | 'buy_potion' | 'buy_antidote' | 'buy_scroll' | 'save_gold'
  // Phase 4: Debug block
  | 'debug_block';
export type ConditionType =
  | 'hp_greater' | 'hp_less' | 'enemy_alive' | 'enemy_close'
  // Ailment conditions
  | 'hero_burning' | 'hero_poisoned' | 'hero_frozen' | 'enemy_stunned'
  // Enemy status conditions
  | 'enemy_burning' | 'enemy_frozen' | 'enemy_poisoned'
  // Shop conditions
  | 'gold_greater' | 'gold_less'
  // Turn counter — teaches loop counting concept (threshold = min turn number)
  | 'turn_gte'
  // Phase 4: Virus conditions
  | 'is_corrupted';
export type LoopType = 'repeat' | 'while_alive' | 'while_hp';
export type AilmentType = 'burn' | 'freeze' | 'poison' | 'stun';

export interface FlowNodeData {
  label: string;
  actionType?: ActionType;
  conditionType?: ConditionType;
  loopType?: LoopType;
  loopCount?: number;
  threshold?: number; // For HP conditions
  isActive?: boolean; // Highlighted during execution
  result?: boolean; // Result of condition (for coloring edges)
  isVirus?: boolean;       // Phase 4: true if this is a virus/bug block
  virusEffect?: string;    // Phase 4: 'drain_hp' | 'waste_turn' | 'scramble'
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
  // Balance / ailment state per step (for UI display)
  heroBurnRounds?: number;
  heroFreezeRounds?: number;
  heroPoisonRounds?: number;
  enemyStunnedRounds?: number;
  healCharges?: number;
  comboCount?: number;
  gold?: number;
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
  totalPlayTime: number;   // ms รวมทุกด่าน
  totalDamageDealt: number;
  totalDamageTaken: number;
  gameMode: GameMode;
  lastUpdated: number;
  // Campaign Speedrun tracking (wall clock time)
  campaignStartedAt?: number;    // timestamp เมื่อ first clear ด่านแรก
  campaignClearedAt?: number;    // timestamp เมื่อ first clear ด่านสุดท้าย
  campaignTotalTimeMs?: number;  // campaignClearedAt - campaignStartedAt (เวลาจริง)
}

// สถิติต่อด่าน (collection: levelboards)
export interface LevelLeaderboardEntry {
  rank: number;
  playerId: string;
  playerName: string;
  characterName: string;
  characterClass: CharacterClass;
  characterLevel: number;
  levelId: string;
  levelNumber: number;
  damageDealt: number;
  damageTaken: number;
  timeMs: number;
  heroHPRemaining: number;
  heroHPPercent: number; // % HP เหลือเมื่อชนะ (0-100)
  timestamp: number;
}

// สถิติ Endless Mode (collection: endlessboards)
export interface EndlessLeaderboardEntry {
  rank: number;
  playerId: string;
  playerName: string;
  characterName: string;
  characterClass: CharacterClass;
  characterLevel: number;
  score: number;           // คะแนนรวม (best run)
  wavesCleared: number;    // wave สุดท้ายที่ผ่านได้ (best)
  totalDamageDealt: number;
  totalDamageTaken: number;
  timestamp: number;
}
