// ===========================
// FlowFight - Game Constants
// ===========================

export const GAME_VERSION = '0.1.0';

// Battle
export const STEP_DELAY_MS = 800;
export const MAX_FLOWCHART_STEPS = 100;

// Character Colors Palette
export const COLOR_PALETTE = [
  '#FF0000', '#DD0000', '#FF6666',
  '#0066FF', '#0000FF', '#000099',
  '#00CC00', '#009900', '#66FF66',
  '#9900FF', '#660099', '#CC66FF',
  '#CCCCCC', '#666666', '#FFD700',
  '#FFFFFF',
];

// Theme colors
export const THEME = {
  primary: '#1a1a2e',
  secondary: '#16213e',
  accent: '#e94560',
  cardBg: '#0f3460',
  text: '#eaeaea',
  success: '#4caf50',
  danger: '#f44336',
  warning: '#ff9800',
  info: '#2196f3',
};

// Block type colors (matches game-concept-draft.md)
export const BLOCK_COLORS = {
  start: '#4caf50',
  end: '#4caf50',
  action: '#f44336',
  condition: '#2196f3',
  loop: '#ff9800',
  operator: '#9c27b0',
};

// Equipment items catalog
export const WEAPONS = [
  { id: 'wooden_sword', type: 'weapon' as const, name: 'Wooden Sword', description: 'A basic sword', spriteId: 'weapon_wood', stats: { attackBonus: 5, defenseBonus: 0, hpBonus: 0, speedBonus: 0 }, cost: 0, rarity: 'common' as const },
  { id: 'iron_sword',   type: 'weapon' as const, name: 'Iron Sword',   description: 'A sturdy sword', spriteId: 'weapon_iron', stats: { attackBonus: 10, defenseBonus: 0, hpBonus: 0, speedBonus: 0 }, cost: 100, rarity: 'common' as const },
  { id: 'magic_staff',  type: 'weapon' as const, name: 'Magic Staff',  description: 'A powerful staff', spriteId: 'weapon_staff', stats: { attackBonus: 15, defenseBonus: 0, hpBonus: 0, speedBonus: 0 }, cost: 250, rarity: 'rare' as const },
  { id: 'axe_fury',     type: 'weapon' as const, name: 'Axe of Fury',  description: 'A heavy axe', spriteId: 'weapon_axe', stats: { attackBonus: 12, defenseBonus: 0, hpBonus: 0, speedBonus: 0 }, cost: 150, rarity: 'uncommon' as const },
];

export const ARMORS = [
  { id: 'leather_armor', type: 'armor' as const, name: 'Leather Armor', description: 'Light protection', spriteId: 'armor_leather', stats: { attackBonus: 0, defenseBonus: 3, hpBonus: 5, speedBonus: 0 }, cost: 50, rarity: 'common' as const },
  { id: 'plate_armor',   type: 'armor' as const, name: 'Plate Armor',   description: 'Heavy protection', spriteId: 'armor_plate',   stats: { attackBonus: 0, defenseBonus: 7, hpBonus: 0, speedBonus: 0 }, cost: 150, rarity: 'uncommon' as const },
  { id: 'mithril_armor', type: 'armor' as const, name: 'Mithril Armor', description: 'Magical armor',    spriteId: 'armor_mithril', stats: { attackBonus: 0, defenseBonus: 10, hpBonus: 5, speedBonus: 0 }, cost: 300, rarity: 'rare' as const },
];

export const HELMETS = [
  { id: 'iron_helmet',    type: 'head' as const, name: 'Iron Helmet',    description: 'Basic helmet',  spriteId: 'head_iron',   stats: { attackBonus: 0, defenseBonus: 5, hpBonus: 0, speedBonus: 0 }, cost: 75,  rarity: 'common' as const },
  { id: 'crown_wisdom',   type: 'head' as const, name: 'Crown of Wisdom', description: 'Royal crown',   spriteId: 'head_crown',  stats: { attackBonus: 0, defenseBonus: 0, hpBonus: 10, speedBonus: 0 }, cost: 200, rarity: 'rare' as const },
];

export const ACCESSORIES = [
  { id: 'ring_health',    type: 'accessory' as const, name: 'Ring of Health',    description: '+10 HP',    spriteId: 'acc_ring',   stats: { attackBonus: 0, defenseBonus: 0, hpBonus: 10, speedBonus: 0 }, cost: 100, rarity: 'common' as const },
  { id: 'amulet_speed',   type: 'accessory' as const, name: 'Amulet of Speed',   description: '+2 Speed',  spriteId: 'acc_amulet', stats: { attackBonus: 0, defenseBonus: 0, hpBonus: 0, speedBonus: 2 }, cost: 120, rarity: 'uncommon' as const },
  { id: 'boots_swift',    type: 'accessory' as const, name: 'Boots of Swiftness', description: '+3 Speed', spriteId: 'acc_boots',  stats: { attackBonus: 0, defenseBonus: 0, hpBonus: 0, speedBonus: 3 }, cost: 150, rarity: 'uncommon' as const },
];

// Game levels
export const LEVELS = [
  {
    id: 'level_1', number: 1, name: 'The Slime Cave', description: 'A simple sequential battle — just keep attacking',
    difficultyEstimate: 1, concept: 'Sequential Logic',
    tutorialText: 'เชื่อม Start → Attack → End เพื่อโจมตีครั้งแรก!',
    objectives: ['สังหาร Slime (HP=0)'],
    bonusObjective: 'HP เหลือมากกว่า 80%',
    allowedBlocks: ['attack'],
    enemy: { id: 'slime', name: 'Slime', spriteId: 'enemy_slime', stats: { maxHP: 25, currentHP: 25, attack: 3, defense: 0, speed: 3 }, behaviors: ['attack'] },
    unlockRequirements: { levelRequired: 0, previousLevelComplete: false },
    rewards: { experience: 40 },
  },
  {
    id: 'level_2', number: 2, name: 'Slime x2', description: 'Slime ตัวใหญ่ขึ้น — โจมตีหลายครั้ง',
    difficultyEstimate: 1, concept: 'Sequential Logic',
    tutorialText: 'วาง Attack 2 ตัวต่อกัน: Start → Attack → Attack → End',
    objectives: ['สังหาร Slime'],
    bonusObjective: 'HP เหลือมากกว่า 70%',
    allowedBlocks: ['attack'],
    enemy: { id: 'slime', name: 'Slime', spriteId: 'enemy_slime', stats: { maxHP: 45, currentHP: 45, attack: 5, defense: 1, speed: 4 }, behaviors: ['attack'] },
    unlockRequirements: { levelRequired: 1, previousLevelComplete: true },
    rewards: { experience: 60 },
  },
  {
    id: 'level_3', number: 3, name: 'The Goblin Cave', description: 'Goblin ตัวแรก — ใช้ Condition เพื่อสร้าง loop',
    difficultyEstimate: 1, concept: 'Conditions & Loops',
    tutorialText: 'ใช้ Enemy Alive? → YES: Attack → กลับไป Condition (สร้าง loop!)',
    objectives: ['สังหาร Goblin', 'ใช้ Condition block'],
    bonusObjective: 'HP เหลือมากกว่า 60%',
    allowedBlocks: ['attack', 'condition'],
    requiredBlocks: ['condition'],
    enemy: { id: 'goblin', name: 'Goblin', spriteId: 'enemy_goblin', stats: { maxHP: 60, currentHP: 60, attack: 8, defense: 2, speed: 6 }, behaviors: ['attack', 'attack'] },
    unlockRequirements: { levelRequired: 2, previousLevelComplete: true },
    rewards: { experience: 90 },
  },
  {
    id: 'level_4', number: 4, name: 'Heal When Low', description: 'Goblin โจมตีหนักขึ้น — ต้องรักษาตัว',
    difficultyEstimate: 2, concept: 'If/Else + Heal',
    tutorialText: 'HP < 60 → Heal, ไม่งั้น → Attack (ใช้ HP < 60? Condition)',
    objectives: ['สังหาร Goblin', 'ใช้ Heal block', 'ใช้ Condition block'],
    bonusObjective: 'HP เหลือมากกว่า 50%',
    allowedBlocks: ['attack', 'heal', 'condition'],
    requiredBlocks: ['condition', 'heal'],
    enemy: { id: 'goblin', name: 'Goblin', spriteId: 'enemy_goblin', stats: { maxHP: 70, currentHP: 70, attack: 10, defense: 3, speed: 7 }, behaviors: ['attack', 'attack'] },
    unlockRequirements: { levelRequired: 3, previousLevelComplete: true },
    rewards: { experience: 120 },
  },
  {
    id: 'level_5', number: 5, name: 'The Kobold Pack', description: 'Kobold ตีเร็ว — ต้องใช้ condition loop + heal',
    difficultyEstimate: 2, concept: 'Loop via Condition',
    tutorialText: 'ใช้ condition loop + heal เมื่อ HP ต่ำกว่า 50',
    objectives: ['สังหาร Kobold', 'ใช้ Condition ต่อเนื่อง'],
    bonusObjective: 'HP เหลือมากกว่า 40%',
    allowedBlocks: ['attack', 'heal', 'condition'],
    requiredBlocks: ['condition', 'heal'],
    enemy: { id: 'kobold', name: 'Kobold Pack', spriteId: 'enemy_kobold', stats: { maxHP: 90, currentHP: 90, attack: 12, defense: 4, speed: 9 }, behaviors: ['attack', 'attack', 'attack'] },
    unlockRequirements: { levelRequired: 4, previousLevelComplete: true },
    rewards: { experience: 150 },
  },
  {
    id: 'level_6', number: 6, name: 'The Goblin Knight', description: 'Goblin Knight มีเกราะหนัก — ต้องหลบ',
    difficultyEstimate: 2, concept: 'Dodge + Conditions',
    tutorialText: 'Dodge เมื่อ HP < 40 — Knight มีเกราะหนัก!',
    objectives: ['สังหาร Goblin Knight', 'ใช้ Dodge block', 'ใช้ Condition'],
    bonusObjective: 'HP เหลือมากกว่า 35%',
    allowedBlocks: ['attack', 'heal', 'dodge', 'condition'],
    requiredBlocks: ['condition', 'dodge'],
    enemy: { id: 'goblin_knight', name: 'Goblin Knight', spriteId: 'enemy_goblin', stats: { maxHP: 110, currentHP: 110, attack: 14, defense: 6, speed: 6, armor: 4, parry: 15 }, behaviors: ['attack', 'attack', 'heal'] },
    unlockRequirements: { levelRequired: 5, previousLevelComplete: true },
    rewards: { experience: 190 },
  },
  {
    id: 'level_7', number: 7, name: 'The Spider Den', description: 'Spider ตีเร็ว — ต้องใช้ nested conditions',
    difficultyEstimate: 3, concept: 'Nested Conditions',
    tutorialText: 'Nested conditions: HP < 30 → Dodge, HP < 60 → Heal, else → Attack',
    objectives: ['สังหาร Spider Queen', 'ใช้ Heal + Dodge + Condition'],
    bonusObjective: 'HP เหลือมากกว่า 25%',
    allowedBlocks: ['attack', 'heal', 'dodge', 'condition'],
    requiredBlocks: ['condition', 'heal', 'dodge'],
    enemy: { id: 'spider', name: 'Spider Queen', spriteId: 'enemy_spider', stats: { maxHP: 130, currentHP: 130, attack: 17, defense: 5, speed: 13 }, behaviors: ['attack', 'attack', 'attack'] },
    unlockRequirements: { levelRequired: 6, previousLevelComplete: true },
    rewards: { experience: 240 },
  },
  {
    id: 'level_8', number: 8, name: 'The Forest Wraith', description: 'Ghost ทำดาเมจสูง — ใช้ Cast Spell ตอบโต้',
    difficultyEstimate: 3, concept: 'Spell Casting + Mana',
    tutorialText: 'Cast Spell ใช้ 25 mana แต่ทำดาเมจสูง! ใช้ Condition ตรวจ Enemy Alive',
    objectives: ['สังหาร Forest Wraith', 'ใช้ Cast Spell อย่างน้อย 1 ครั้ง'],
    bonusObjective: 'HP เหลือมากกว่า 30%',
    allowedBlocks: ['attack', 'heal', 'dodge', 'cast_spell', 'condition'],
    requiredBlocks: ['cast_spell', 'condition'],
    enemy: { id: 'ghost', name: 'Forest Wraith', spriteId: 'enemy_ghost', stats: { maxHP: 140, currentHP: 140, attack: 18, defense: 5, speed: 11 }, behaviors: ['attack', 'attack', 'attack'] },
    unlockRequirements: { levelRequired: 7, previousLevelComplete: true },
    rewards: { experience: 300 },
  },
  {
    id: 'level_9', number: 9, name: 'Mana Control', description: 'Orc มีเกราะหนา — ต้องจัดการ Mana',
    difficultyEstimate: 3, concept: 'Resource Management',
    tutorialText: 'จัดการ Mana: ใช้ Spell เมื่อจำเป็น ไม่งั้น Attack ปกติ',
    objectives: ['สังหาร Orc Warrior', 'ใช้ Cast Spell + Heal'],
    bonusObjective: 'HP เหลือมากกว่า 25%',
    allowedBlocks: ['attack', 'heal', 'dodge', 'cast_spell', 'condition'],
    requiredBlocks: ['cast_spell', 'condition', 'heal'],
    enemy: { id: 'orc', name: 'Orc Warrior', spriteId: 'enemy_orc', stats: { maxHP: 160, currentHP: 160, attack: 20, defense: 8, speed: 5, armor: 6 }, behaviors: ['attack', 'attack'] },
    unlockRequirements: { levelRequired: 8, previousLevelComplete: true },
    rewards: { experience: 370 },
  },
  {
    id: 'level_10', number: 10, name: 'Power Strike!', description: 'Troll มีเกราะหนา — Power Strike ทะลุได้!',
    difficultyEstimate: 4, concept: 'Skills + Mana',
    tutorialText: 'Power Strike (20 mana) = 2x damage! ใช้อย่างชาญฉลาด',
    objectives: ['สังหาร Stone Troll', 'ใช้ Power Strike block'],
    bonusObjective: 'HP เหลือมากกว่า 30%',
    allowedBlocks: ['attack', 'heal', 'dodge', 'cast_spell', 'power_strike', 'condition'],
    requiredBlocks: ['power_strike', 'condition'],
    enemy: { id: 'troll', name: 'Stone Troll', spriteId: 'enemy_troll', stats: { maxHP: 190, currentHP: 190, attack: 22, defense: 9, speed: 4, armor: 8, parry: 15 }, behaviors: ['attack', 'heal', 'attack'] },
    unlockRequirements: { levelRequired: 9, previousLevelComplete: true },
    rewards: { experience: 450 },
  },
  {
    id: 'level_11', number: 11, name: 'The Orc Warlord', description: 'Orc Warlord ผสมทุกทักษะ — ศึกหนัก!',
    difficultyEstimate: 4, concept: 'Full Skill Set',
    tutorialText: 'ผสม Power Strike + Spell + Heal — ศึกหนัก!',
    objectives: ['สังหาร Orc Warlord', 'ใช้ Power Strike + Cast Spell'],
    bonusObjective: 'HP เหลือมากกว่า 20%',
    allowedBlocks: ['attack', 'heal', 'dodge', 'cast_spell', 'power_strike', 'condition'],
    requiredBlocks: ['power_strike', 'cast_spell', 'condition', 'heal'],
    enemy: { id: 'orc_warlord', name: 'Orc Warlord', spriteId: 'enemy_orc', stats: { maxHP: 220, currentHP: 220, attack: 24, defense: 12, speed: 7, armor: 10, parry: 20 }, behaviors: ['attack', 'attack', 'cast_spell'] },
    unlockRequirements: { levelRequired: 10, previousLevelComplete: true },
    rewards: { experience: 550 },
  },
  {
    id: 'level_12', number: 12, name: 'The Ice Cavern', description: 'Ice Giant มีเกราะหนา — Spell/Power Strike ทะลุได้!',
    difficultyEstimate: 4, concept: 'Armor Penetration',
    tutorialText: 'Ice Giant มีเกราะหนา — Spell/Power Strike ทะลุได้!',
    objectives: ['สังหาร Ice Giant', 'ใช้ Spell หรือ Power Strike'],
    bonusObjective: 'HP เหลือมากกว่า 20%',
    allowedBlocks: ['attack', 'heal', 'dodge', 'cast_spell', 'power_strike', 'condition'],
    requiredBlocks: ['cast_spell', 'power_strike', 'condition'],
    enemy: { id: 'ice_giant', name: 'Ice Giant', spriteId: 'enemy_ice_giant', stats: { maxHP: 260, currentHP: 260, attack: 28, defense: 15, speed: 6, armor: 12 }, behaviors: ['attack', 'attack', 'cast_spell'] },
    unlockRequirements: { levelRequired: 11, previousLevelComplete: true },
    rewards: { experience: 680 },
  },
  {
    id: 'level_13', number: 13, name: "The Dragon's Lair", description: 'Dragon มีความสามารถหลากหลาย — ต้องใช้ทุกทักษะ!',
    difficultyEstimate: 5, concept: 'Master Combat',
    tutorialText: 'Dragon มีความสามารถหลากหลาย — ต้องใช้ทุกทักษะ!',
    objectives: ['สังหาร Young Dragon', 'ใช้ทุก action type'],
    bonusObjective: 'HP เหลือมากกว่า 20%',
    requiredBlocks: ['cast_spell', 'power_strike', 'condition', 'heal', 'dodge'],
    enemy: { id: 'dragon', name: 'Young Dragon', spriteId: 'enemy_dragon', stats: { maxHP: 300, currentHP: 300, attack: 30, defense: 16, speed: 10 }, behaviors: ['attack', 'cast_spell', 'attack', 'attack'] },
    unlockRequirements: { levelRequired: 12, previousLevelComplete: true },
    rewards: { experience: 850 },
  },
  {
    id: 'level_14', number: 14, name: 'The Lich Lord', description: 'Lich Lord เก่งทุกด้าน — True Mastery required',
    difficultyEstimate: 5, concept: 'True Mastery',
    objectives: ['สังหาร Lich Lord'],
    bonusObjective: 'HP เหลือมากกว่า 15%',
    requiredBlocks: ['cast_spell', 'power_strike', 'condition', 'heal'],
    enemy: { id: 'lich', name: 'Lich Lord', spriteId: 'enemy_lich', stats: { maxHP: 370, currentHP: 370, attack: 36, defense: 18, speed: 11, armor: 8, parry: 25 }, behaviors: ['cast_spell', 'attack', 'cast_spell', 'attack', 'heal'] },
    unlockRequirements: { levelRequired: 13, previousLevelComplete: true },
    rewards: { experience: 1050 },
  },
  {
    id: 'level_15', number: 15, name: 'The Dark Overlord', description: 'Dark Overlord — Final Challenge',
    difficultyEstimate: 5, concept: 'Final Challenge',
    objectives: ['สังหาร Dark Overlord', 'ใช้ Flowchart ที่สมบูรณ์'],
    bonusObjective: 'HP เหลือมากกว่า 25%',
    requiredBlocks: ['cast_spell', 'power_strike', 'condition', 'heal', 'dodge'],
    enemy: { id: 'overlord', name: 'Dark Overlord', spriteId: 'enemy_boss', stats: { maxHP: 500, currentHP: 500, attack: 45, defense: 25, speed: 15, armor: 20, parry: 35 }, behaviors: ['attack', 'cast_spell', 'heal', 'cast_spell', 'attack', 'attack'] },
    unlockRequirements: { levelRequired: 14, previousLevelComplete: true },
    rewards: { experience: 1500 },
  },
];
