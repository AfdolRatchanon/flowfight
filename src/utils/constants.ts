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
    tutorialText: 'Connect Start → Attack → End to defeat the Slime!',
    objectives: ['สังหารศัตรู (Slime HP = 0)'],
    bonusObjective: 'HP เหลือมากกว่า 70%',
    enemy: { id: 'slime', name: 'Slime', spriteId: 'enemy_slime', stats: { maxHP: 40, currentHP: 40, attack: 5, defense: 2, speed: 3 }, behaviors: ['attack'] },
    unlockRequirements: { levelRequired: 0, previousLevelComplete: false },
    rewards: { experience: 50, gold: 20 },
  },
  {
    id: 'level_2', number: 2, name: 'The Goblin Camp', description: 'Goblins hit harder — learn when to heal',
    difficultyEstimate: 1, concept: 'If/Else Conditions',
    tutorialText: 'Use a Condition block: If HP < 50 → Heal, else → Attack',
    objectives: ['สังหารศัตรู (Goblin HP = 0)', 'ใช้ Condition block อย่างน้อย 1 ครั้ง'],
    bonusObjective: 'HP เหลือมากกว่า 50%',
    requiredBlocks: ['condition'],
    enemy: { id: 'goblin', name: 'Goblin Scout', spriteId: 'enemy_goblin', stats: { maxHP: 55, currentHP: 55, attack: 8, defense: 3, speed: 7 }, behaviors: ['attack', 'attack'] },
    unlockRequirements: { levelRequired: 1, previousLevelComplete: true },
    rewards: { experience: 80, gold: 30 },
  },
  {
    id: 'level_3', number: 3, name: 'The Kobold Warren', description: 'Fast little creatures — conditions are key',
    difficultyEstimate: 2, concept: 'If/Else Conditions',
    tutorialText: 'Check if enemy is still alive before attacking again!',
    objectives: ['สังหารศัตรู (Kobold HP = 0)', 'ใช้ Condition: Enemy Alive?'],
    bonusObjective: 'ไม่โดนโจมตีเกิน 3 ครั้ง',
    requiredBlocks: ['condition'],
    enemy: { id: 'kobold', name: 'Kobold Pack', spriteId: 'enemy_kobold', stats: { maxHP: 70, currentHP: 70, attack: 12, defense: 4, speed: 9 }, behaviors: ['attack', 'attack', 'attack'] },
    unlockRequirements: { levelRequired: 2, previousLevelComplete: true },
    rewards: { experience: 120, gold: 50 },
  },
  {
    id: 'level_4', number: 4, name: 'The Goblin Fortress', description: 'A tougher goblin with a shield — wear it down',
    difficultyEstimate: 2, concept: 'Loops (Repeat)',
    tutorialText: 'Use a Repeat loop to attack 3 times in a row!',
    objectives: ['สังหารศัตรู (Goblin Knight HP = 0)', 'ใช้ Loop (Repeat) block'],
    bonusObjective: 'HP เหลือมากกว่า 50%',
    requiredBlocks: ['loop'],
    enemy: { id: 'goblin_knight', name: 'Goblin Knight', spriteId: 'enemy_goblin', stats: { maxHP: 90, currentHP: 90, attack: 12, defense: 7, speed: 6, armor: 4, parry: 20 }, behaviors: ['attack', 'attack', 'heal'] },
    unlockRequirements: { levelRequired: 3, previousLevelComplete: true },
    rewards: { experience: 160, gold: 65 },
  },
  {
    id: 'level_5', number: 5, name: 'The Orc Outpost', description: 'Orcs don\'t stop — loop until they fall',
    difficultyEstimate: 2, concept: 'Loops (While Alive)',
    tutorialText: 'Use a While Alive loop: keep attacking until the enemy is dead',
    objectives: ['สังหารศัตรู (Orc HP = 0)', 'ใช้ Loop: While Enemy Alive'],
    bonusObjective: 'HP เหลือมากกว่า 40%',
    requiredBlocks: ['loop'],
    enemy: { id: 'orc', name: 'Orc Warrior', spriteId: 'enemy_orc', stats: { maxHP: 110, currentHP: 110, attack: 14, defense: 8, speed: 5, armor: 6 }, behaviors: ['attack', 'attack'] },
    unlockRequirements: { levelRequired: 4, previousLevelComplete: true },
    rewards: { experience: 200, gold: 80 },
  },
  {
    id: 'level_6', number: 6, name: 'The Haunted Forest', description: 'Ghostly attacks are hard to dodge — stay healed',
    difficultyEstimate: 3, concept: 'Heal + Loop',
    tutorialText: 'Combine: Loop → (Check HP) → Heal if low, else Attack',
    objectives: ['สังหารศัตรู (Wraith HP = 0)', 'ใช้ Heal block อย่างน้อย 1 ครั้ง', 'ใช้ Loop block'],
    bonusObjective: 'HP เหลือมากกว่า 30%',
    requiredBlocks: ['loop', 'heal'],
    enemy: { id: 'ghost', name: 'Forest Wraith', spriteId: 'enemy_ghost', stats: { maxHP: 120, currentHP: 120, attack: 16, defense: 5, speed: 11 }, behaviors: ['attack', 'attack', 'attack'] },
    unlockRequirements: { levelRequired: 5, previousLevelComplete: true },
    rewards: { experience: 260, gold: 100 },
  },
  {
    id: 'level_7', number: 7, name: 'The Troll Bridge', description: 'Trolls regenerate HP — you need to burst them down',
    difficultyEstimate: 3, concept: 'Aggressive Loops',
    tutorialText: 'Repeat attack 3 times, then check if enemy is still alive',
    objectives: ['สังหารศัตรู (Troll HP = 0)', 'ใช้ Loop block', 'ใช้ Condition: Enemy Alive?'],
    bonusObjective: 'สังหารก่อน Flowchart รันครบ 10 step',
    requiredBlocks: ['loop', 'condition'],
    enemy: { id: 'troll', name: 'Stone Troll', spriteId: 'enemy_troll', stats: { maxHP: 160, currentHP: 160, attack: 18, defense: 10, speed: 4, armor: 8, parry: 15 }, behaviors: ['attack', 'heal', 'attack'] },
    unlockRequirements: { levelRequired: 6, previousLevelComplete: true },
    rewards: { experience: 320, gold: 130 },
  },
  {
    id: 'level_8', number: 8, name: 'The Spider Den', description: 'Venom drains your HP fast — dodge or die',
    difficultyEstimate: 3, concept: 'Dodge + Conditions',
    tutorialText: 'Dodge when HP < 40, heal when HP < 60, otherwise attack',
    objectives: ['สังหารศัตรู (Spider Queen HP = 0)', 'ใช้ Dodge block', 'ใช้ Condition: HP < X'],
    bonusObjective: 'HP เหลือมากกว่า 25%',
    requiredBlocks: ['condition', 'dodge'],
    enemy: { id: 'spider', name: 'Spider Queen', spriteId: 'enemy_spider', stats: { maxHP: 140, currentHP: 140, attack: 20, defense: 6, speed: 13 }, behaviors: ['attack', 'attack', 'attack'] },
    unlockRequirements: { levelRequired: 7, previousLevelComplete: true },
    rewards: { experience: 380, gold: 155 },
  },
  {
    id: 'level_9', number: 9, name: 'The Orc Warlord', description: 'A mighty orc commander — combine everything',
    difficultyEstimate: 4, concept: 'Complex Conditions',
    tutorialText: 'Nested logic: Loop → if HP < 50 heal, if HP < 20 dodge, else attack',
    objectives: ['สังหารศัตรู (Warlord HP = 0)', 'ใช้ Loop + Condition ร่วมกัน', 'ใช้ Heal และ Dodge ใน Flowchart'],
    bonusObjective: 'HP เหลือมากกว่า 30%',
    requiredBlocks: ['loop', 'condition', 'heal', 'dodge'],
    enemy: { id: 'orc_warlord', name: 'Orc Warlord', spriteId: 'enemy_orc', stats: { maxHP: 200, currentHP: 200, attack: 22, defense: 12, speed: 7, armor: 10, parry: 25 }, behaviors: ['attack', 'attack', 'cast_spell'] },
    unlockRequirements: { levelRequired: 8, previousLevelComplete: true },
    rewards: { experience: 450, gold: 180 },
  },
  {
    id: 'level_10', number: 10, name: 'The Ice Cavern', description: 'Ice Giant hits HARD — precise healing is critical',
    difficultyEstimate: 4, concept: 'Spell Casting',
    tutorialText: 'Use Cast Spell for burst damage! Watch your HP carefully',
    objectives: ['สังหารศัตรู (Ice Giant HP = 0)', 'ใช้ Cast Spell block อย่างน้อย 1 ครั้ง'],
    bonusObjective: 'HP เหลือมากกว่า 30%',
    requiredBlocks: ['cast_spell'],
    enemy: { id: 'ice_giant', name: 'Ice Giant', spriteId: 'enemy_ice_giant', stats: { maxHP: 230, currentHP: 230, attack: 26, defense: 14, speed: 6, armor: 12 }, behaviors: ['attack', 'attack', 'cast_spell'] },
    unlockRequirements: { levelRequired: 9, previousLevelComplete: true },
    rewards: { experience: 530, gold: 220 },
  },
  {
    id: 'level_11', number: 11, name: 'The Dragon\'s Lair', description: 'A young dragon — mix spells and dodges',
    difficultyEstimate: 4, concept: 'Advanced Combat',
    tutorialText: 'Spell does 1.5× damage — use it when enemy is not yet dead',
    objectives: ['สังหารศัตรู (Dragon HP = 0)', 'ใช้ Cast Spell + Dodge ใน Flowchart'],
    bonusObjective: 'HP เหลือมากกว่า 25%',
    requiredBlocks: ['cast_spell', 'dodge'],
    enemy: { id: 'dragon', name: 'Young Dragon', spriteId: 'enemy_dragon', stats: { maxHP: 270, currentHP: 270, attack: 28, defense: 15, speed: 10 }, behaviors: ['attack', 'cast_spell', 'attack', 'attack'] },
    unlockRequirements: { levelRequired: 10, previousLevelComplete: true },
    rewards: { experience: 620, gold: 260 },
  },
  {
    id: 'level_12', number: 12, name: 'The Volcano Peak', description: 'Fire Elemental burns through defense — optimize everything',
    difficultyEstimate: 5, concept: 'Optimization',
    tutorialText: 'Build the most efficient flowchart — every wrong step costs HP!',
    objectives: ['สังหารศัตรู (Fire Elemental HP = 0)', 'ใช้ทุก block type ใน Flowchart'],
    bonusObjective: 'HP เหลือมากกว่า 20%',
    enemy: { id: 'fire_elemental', name: 'Fire Elemental', spriteId: 'enemy_fire', stats: { maxHP: 300, currentHP: 300, attack: 32, defense: 10, speed: 12 }, behaviors: ['attack', 'cast_spell', 'cast_spell', 'attack'] },
    unlockRequirements: { levelRequired: 11, previousLevelComplete: true },
    rewards: { experience: 720, gold: 300 },
  },
  {
    id: 'level_13', number: 13, name: 'The Undead Crypt', description: 'The Lich is relentless — perfect your strategy',
    difficultyEstimate: 5, concept: 'Full Toolkit',
    tutorialText: 'Use loops + conditions + spells + dodge — all of it',
    objectives: ['สังหารศัตรู (Lich Lord HP = 0)', 'ใช้ Loop + Condition + Spell + Dodge'],
    bonusObjective: 'HP เหลือมากกว่า 20%',
    requiredBlocks: ['loop', 'condition', 'cast_spell', 'dodge'],
    enemy: { id: 'lich', name: 'Lich Lord', spriteId: 'enemy_lich', stats: { maxHP: 350, currentHP: 350, attack: 35, defense: 18, speed: 11, armor: 8, parry: 30 }, behaviors: ['cast_spell', 'attack', 'cast_spell', 'attack', 'heal'] },
    unlockRequirements: { levelRequired: 12, previousLevelComplete: true },
    rewards: { experience: 850, gold: 360 },
  },
  {
    id: 'level_14', number: 14, name: 'The Shadow Realm', description: 'Shadow Demon has no mercy — can you survive?',
    difficultyEstimate: 5, concept: 'Master Strategy',
    tutorialText: 'Every HP point matters. Plan your flowchart before running it',
    objectives: ['สังหารศัตรู (Shadow Demon HP = 0)', 'Flowchart ต้องมี Condition และ Loop'],
    bonusObjective: 'HP เหลือมากกว่า 15%',
    enemy: { id: 'shadow_demon', name: 'Shadow Demon', spriteId: 'enemy_shadow', stats: { maxHP: 400, currentHP: 400, attack: 38, defense: 20, speed: 14, armor: 15, parry: 35 }, behaviors: ['attack', 'cast_spell', 'attack', 'cast_spell', 'heal'] },
    unlockRequirements: { levelRequired: 13, previousLevelComplete: true },
    rewards: { experience: 1000, gold: 420 },
  },
  {
    id: 'level_15', number: 15, name: 'The Final Sanctum', description: 'The Dark Overlord — ultimate challenge',
    difficultyEstimate: 5, concept: 'True Mastery',
    tutorialText: 'The hardest battle. Only a perfect flowchart will win.',
    objectives: ['สังหารศัตรู (Dark Overlord HP = 0)', 'Flowchart ต้องใช้ทุก block type', 'HP เหลือมากกว่า 1'],
    bonusObjective: 'HP เหลือมากกว่า 30% (แชมป์ที่แท้จริง)',
    enemy: { id: 'overlord', name: 'Dark Overlord', spriteId: 'enemy_boss', stats: { maxHP: 500, currentHP: 500, attack: 45, defense: 25, speed: 15, armor: 20, parry: 40 }, behaviors: ['attack', 'cast_spell', 'heal', 'cast_spell', 'attack', 'attack'] },
    unlockRequirements: { levelRequired: 14, previousLevelComplete: true },
    rewards: { experience: 1500, gold: 600 },
  },
];
