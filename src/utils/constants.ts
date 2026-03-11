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
// requiredLevel: minimum character level to equip
// allowedClasses: [] = all classes; otherwise only listed classes

export const WEAPONS = [
  // ── Knight (sword / blade) ─────────────────────────────────────────────
  { id: 'iron_sword',    type: 'weapon' as const, name: 'Iron Sword',      description: 'ดาบเหล็กพื้นฐานของอัศวิน',         spriteId: 'weapon_iron',    stats: { attackBonus: 8,  defenseBonus: 0, hpBonus: 0,  speedBonus: 0 }, cost: 20,  rarity: 'common'    as const, requiredLevel: 1, allowedClasses: ['knight'] as const },
  { id: 'broad_sword',   type: 'weapon' as const, name: 'Broad Sword',     description: 'ดาบกว้าง ตีหนักขึ้น',              spriteId: 'weapon_broad',   stats: { attackBonus: 13, defenseBonus: 1, hpBonus: 0,  speedBonus: 0 }, cost: 200, rarity: 'uncommon'  as const, requiredLevel: 3, allowedClasses: ['knight'] as const },
  { id: 'holy_blade',    type: 'weapon' as const, name: 'Holy Blade',      description: 'ดาบศักดิ์สิทธิ์ ทำลายศัตรูมืด',    spriteId: 'weapon_holy',    stats: { attackBonus: 18, defenseBonus: 3, hpBonus: 0,  speedBonus: 0 }, cost: 600, rarity: 'rare'      as const, requiredLevel: 6, allowedClasses: ['knight'] as const },
  { id: 'excalibur',     type: 'weapon' as const, name: 'Excalibur',       description: 'ดาบในตำนาน อำนาจสูงสุด',           spriteId: 'weapon_excal',   stats: { attackBonus: 25, defenseBonus: 5, hpBonus: 0,  speedBonus: 0 }, cost: 1500,rarity: 'epic'      as const, requiredLevel: 9, allowedClasses: ['knight'] as const },

  // ── Mage (staff / tome) ───────────────────────────────────────────────
  { id: 'apprentice_staff', type: 'weapon' as const, name: 'Apprentice Staff', description: 'ไม้เท้าฝึกหัดของมาจ',         spriteId: 'weapon_staff1',  stats: { attackBonus: 10, defenseBonus: 0, hpBonus: 0,  speedBonus: 0 }, cost: 20,  rarity: 'common'    as const, requiredLevel: 1, allowedClasses: ['mage'] as const },
  { id: 'magic_staff',      type: 'weapon' as const, name: 'Magic Staff',      description: 'ไม้เท้าพลังมหาศาล',           spriteId: 'weapon_staff2',  stats: { attackBonus: 16, defenseBonus: 0, hpBonus: 0,  speedBonus: 0 }, cost: 250, rarity: 'rare'      as const, requiredLevel: 3, allowedClasses: ['mage'] as const },
  { id: 'crystal_staff',    type: 'weapon' as const, name: 'Crystal Staff',    description: 'ไม้เท้าคริสตัล ดาเมจสูง',     spriteId: 'weapon_staff3',  stats: { attackBonus: 22, defenseBonus: 0, hpBonus: 0,  speedBonus: 1 }, cost: 700, rarity: 'rare'      as const, requiredLevel: 6, allowedClasses: ['mage'] as const },
  { id: 'arcane_tome',      type: 'weapon' as const, name: 'Arcane Tome',      description: 'คัมภีร์ arcane สุดยอดมาจ',    spriteId: 'weapon_tome',    stats: { attackBonus: 30, defenseBonus: 0, hpBonus: 0,  speedBonus: 2 }, cost: 1500,rarity: 'epic'      as const, requiredLevel: 9, allowedClasses: ['mage'] as const },

  // ── Rogue (dagger / fang) ─────────────────────────────────────────────
  { id: 'short_dagger',  type: 'weapon' as const, name: 'Short Dagger',    description: 'มีดสั้น เบาและเร็ว',               spriteId: 'weapon_dag1',    stats: { attackBonus: 7,  defenseBonus: 0, hpBonus: 0,  speedBonus: 1 }, cost: 20,  rarity: 'common'    as const, requiredLevel: 1, allowedClasses: ['rogue'] as const },
  { id: 'twin_daggers',  type: 'weapon' as const, name: 'Twin Daggers',    description: 'มีดคู่ โจมตีสองครั้ง',             spriteId: 'weapon_dag2',    stats: { attackBonus: 11, defenseBonus: 0, hpBonus: 0,  speedBonus: 2 }, cost: 220, rarity: 'uncommon'  as const, requiredLevel: 3, allowedClasses: ['rogue'] as const },
  { id: 'shadow_blade',  type: 'weapon' as const, name: 'Shadow Blade',    description: 'ใบมีดเงา โจมตีแบบลับ',             spriteId: 'weapon_dag3',    stats: { attackBonus: 16, defenseBonus: 0, hpBonus: 0,  speedBonus: 3 }, cost: 620, rarity: 'rare'      as const, requiredLevel: 6, allowedClasses: ['rogue'] as const },
  { id: 'viper_fang',    type: 'weapon' as const, name: 'Viper Fang',      description: 'เขี้ยวงู พิษร้ายแรง',              spriteId: 'weapon_dag4',    stats: { attackBonus: 22, defenseBonus: 0, hpBonus: 0,  speedBonus: 5 }, cost: 1500,rarity: 'epic'      as const, requiredLevel: 9, allowedClasses: ['rogue'] as const },

  // ── Barbarian (axe / hammer) ──────────────────────────────────────────
  { id: 'hand_axe',      type: 'weapon' as const, name: 'Hand Axe',        description: 'ขวานมือ หนักและดิบ',               spriteId: 'weapon_axe1',    stats: { attackBonus: 9,  defenseBonus: 0, hpBonus: 0,  speedBonus: 0 }, cost: 20,  rarity: 'common'    as const, requiredLevel: 1, allowedClasses: ['barbarian'] as const },
  { id: 'axe_fury',      type: 'weapon' as const, name: 'Axe of Fury',     description: 'ขวานแห่งความโกรธ',                 spriteId: 'weapon_axe2',    stats: { attackBonus: 14, defenseBonus: 0, hpBonus: 0,  speedBonus: 0 }, cost: 200, rarity: 'uncommon'  as const, requiredLevel: 3, allowedClasses: ['barbarian'] as const },
  { id: 'battle_axe',    type: 'weapon' as const, name: 'Battle Axe',      description: 'ขวานสงคราม HP +10',                spriteId: 'weapon_axe3',    stats: { attackBonus: 20, defenseBonus: 0, hpBonus: 10, speedBonus: 0 }, cost: 650, rarity: 'rare'      as const, requiredLevel: 6, allowedClasses: ['barbarian'] as const },
  { id: 'berserker_axe', type: 'weapon' as const, name: 'Berserker Axe',   description: 'ขวานคลั่ง พลังทำลายล้าง',          spriteId: 'weapon_axe4',    stats: { attackBonus: 28, defenseBonus: 0, hpBonus: 20, speedBonus: 0 }, cost: 1500,rarity: 'legendary' as const, requiredLevel: 9, allowedClasses: ['barbarian'] as const },
];

export const ARMORS = [
  // ── Knight ────────────────────────────────────────────────────────────
  { id: 'chain_mail',    type: 'armor' as const, name: 'Chain Mail',       description: 'เกราะโซ่ พื้นฐานอัศวิน',           spriteId: 'armor_chain',    stats: { attackBonus: 0, defenseBonus: 5,  hpBonus: 0,  speedBonus: 0 }, cost: 20,  rarity: 'common'   as const, requiredLevel: 1, allowedClasses: ['knight'] as const },
  { id: 'plate_armor',   type: 'armor' as const, name: 'Plate Armor',      description: 'เกราะแผ่น ป้องกันสูง',              spriteId: 'armor_plate',    stats: { attackBonus: 0, defenseBonus: 10, hpBonus: 0,  speedBonus: 0 }, cost: 300, rarity: 'uncommon' as const, requiredLevel: 5, allowedClasses: ['knight'] as const },
  { id: 'mithril_plate', type: 'armor' as const, name: 'Mithril Plate',    description: 'เกราะมิทริล เบาแต่แข็งแกร่ง',      spriteId: 'armor_mithril',  stats: { attackBonus: 0, defenseBonus: 15, hpBonus: 10, speedBonus: 0 }, cost: 900, rarity: 'rare'     as const, requiredLevel: 8, allowedClasses: ['knight'] as const },

  // ── Mage ──────────────────────────────────────────────────────────────
  { id: 'cloth_robe',    type: 'armor' as const, name: 'Cloth Robe',       description: 'เสื้อคลุมผ้า เบา HP +5',            spriteId: 'armor_robe1',    stats: { attackBonus: 0, defenseBonus: 2,  hpBonus: 5,  speedBonus: 0 }, cost: 20,  rarity: 'common'   as const, requiredLevel: 1, allowedClasses: ['mage'] as const },
  { id: 'mystic_robe',   type: 'armor' as const, name: 'Mystic Robe',      description: 'เสื้อคลุมมนตรา HP +15',             spriteId: 'armor_robe2',    stats: { attackBonus: 0, defenseBonus: 4,  hpBonus: 15, speedBonus: 0 }, cost: 280, rarity: 'uncommon' as const, requiredLevel: 5, allowedClasses: ['mage'] as const },
  { id: 'arcane_robe',   type: 'armor' as const, name: 'Arcane Robe',      description: 'เสื้อคลุม Arcane HP +25 SPD+1',     spriteId: 'armor_robe3',    stats: { attackBonus: 0, defenseBonus: 6,  hpBonus: 25, speedBonus: 1 }, cost: 850, rarity: 'rare'     as const, requiredLevel: 8, allowedClasses: ['mage'] as const },

  // ── Rogue ─────────────────────────────────────────────────────────────
  { id: 'leather_vest',  type: 'armor' as const, name: 'Leather Vest',     description: 'เสื้อหนัง เบา HP +5',               spriteId: 'armor_leather1', stats: { attackBonus: 0, defenseBonus: 3,  hpBonus: 5,  speedBonus: 0 }, cost: 20,  rarity: 'common'   as const, requiredLevel: 1, allowedClasses: ['rogue'] as const },
  { id: 'shadow_leather',type: 'armor' as const, name: 'Shadow Leather',   description: 'หนังเงา SPD+1',                     spriteId: 'armor_leather2', stats: { attackBonus: 0, defenseBonus: 5,  hpBonus: 0,  speedBonus: 1 }, cost: 290, rarity: 'uncommon' as const, requiredLevel: 5, allowedClasses: ['rogue'] as const },
  { id: 'night_cloak',   type: 'armor' as const, name: 'Night Cloak',      description: 'เสื้อคลุมกลางคืน SPD+3',            spriteId: 'armor_cloak',    stats: { attackBonus: 0, defenseBonus: 8,  hpBonus: 0,  speedBonus: 3 }, cost: 870, rarity: 'rare'     as const, requiredLevel: 8, allowedClasses: ['rogue'] as const },

  // ── Barbarian ─────────────────────────────────────────────────────────
  { id: 'bear_pelt',     type: 'armor' as const, name: 'Bear Pelt',        description: 'หนังหมี HP +10',                    spriteId: 'armor_pelt1',    stats: { attackBonus: 0, defenseBonus: 4,  hpBonus: 10, speedBonus: 0 }, cost: 20,  rarity: 'common'   as const, requiredLevel: 1, allowedClasses: ['barbarian'] as const },
  { id: 'warpaint_armor',type: 'armor' as const, name: 'War Paint Armor',  description: 'เกราะสีรบ HP +15',                  spriteId: 'armor_pelt2',    stats: { attackBonus: 0, defenseBonus: 7,  hpBonus: 15, speedBonus: 0 }, cost: 300, rarity: 'uncommon' as const, requiredLevel: 5, allowedClasses: ['barbarian'] as const },
  { id: 'warlord_mail',  type: 'armor' as const, name: 'Warlord Mail',     description: 'เกราะจอมทัพ HP +25',                spriteId: 'armor_pelt3',    stats: { attackBonus: 0, defenseBonus: 12, hpBonus: 25, speedBonus: 0 }, cost: 900, rarity: 'rare'     as const, requiredLevel: 8, allowedClasses: ['barbarian'] as const },
];

export const HELMETS = [
  // ── Knight ────────────────────────────────────────────────────────────
  { id: 'iron_helmet',   type: 'head' as const, name: 'Iron Helmet',       description: 'หมวกเหล็ก DEF+3',                  spriteId: 'head_iron',      stats: { attackBonus: 0, defenseBonus: 3,  hpBonus: 0,  speedBonus: 0 }, cost: 20,  rarity: 'common'   as const, requiredLevel: 1, allowedClasses: ['knight'] as const },
  { id: 'steel_helm',    type: 'head' as const, name: 'Steel Helmet',      description: 'หมวกเหล็กกล้า DEF+6 HP+5',         spriteId: 'head_steel',     stats: { attackBonus: 0, defenseBonus: 6,  hpBonus: 5,  speedBonus: 0 }, cost: 250, rarity: 'uncommon' as const, requiredLevel: 5, allowedClasses: ['knight'] as const },
  { id: 'dragon_helm',   type: 'head' as const, name: 'Dragon Scale Helm', description: 'หมวกเกล็ดมังกร DEF+10 HP+10',      spriteId: 'head_dragon',    stats: { attackBonus: 0, defenseBonus: 10, hpBonus: 10, speedBonus: 0 }, cost: 850, rarity: 'epic'     as const, requiredLevel: 8, allowedClasses: ['knight'] as const },

  // ── Mage ──────────────────────────────────────────────────────────────
  { id: 'wizard_hat',    type: 'head' as const, name: 'Wizard Hat',        description: 'หมวกพ่อมด HP+5',                   spriteId: 'head_hat',       stats: { attackBonus: 0, defenseBonus: 0,  hpBonus: 5,  speedBonus: 0 }, cost: 20,  rarity: 'common'   as const, requiredLevel: 1, allowedClasses: ['mage'] as const },
  { id: 'crown_wisdom',  type: 'head' as const, name: 'Crown of Wisdom',   description: 'มงกุฎแห่งปัญญา HP+15',              spriteId: 'head_crown',     stats: { attackBonus: 0, defenseBonus: 0,  hpBonus: 15, speedBonus: 0 }, cost: 280, rarity: 'rare'     as const, requiredLevel: 5, allowedClasses: ['mage'] as const },
  { id: 'arcane_crown',  type: 'head' as const, name: 'Arcane Crown',      description: 'มงกุฎ Arcane ATK+3 HP+20',          spriteId: 'head_acrown',    stats: { attackBonus: 3, defenseBonus: 0,  hpBonus: 20, speedBonus: 0 }, cost: 900, rarity: 'epic'     as const, requiredLevel: 8, allowedClasses: ['mage'] as const },

  // ── Rogue ─────────────────────────────────────────────────────────────
  { id: 'scout_hood',    type: 'head' as const, name: 'Scout Hood',        description: 'หมวกลาดตระเวน SPD+2',               spriteId: 'head_hood1',     stats: { attackBonus: 0, defenseBonus: 0,  hpBonus: 0,  speedBonus: 2 }, cost: 20,  rarity: 'common'   as const, requiredLevel: 1, allowedClasses: ['rogue'] as const },
  { id: 'shadow_hood',   type: 'head' as const, name: 'Shadow Hood',       description: 'หมวกเงา SPD+4 HP+5',               spriteId: 'head_hood2',     stats: { attackBonus: 0, defenseBonus: 0,  hpBonus: 5,  speedBonus: 4 }, cost: 260, rarity: 'uncommon' as const, requiredLevel: 5, allowedClasses: ['rogue'] as const },
  { id: 'assassin_mask', type: 'head' as const, name: 'Assassin Mask',     description: 'หน้ากากนักสังหาร ATK+3 SPD+5',      spriteId: 'head_mask',      stats: { attackBonus: 3, defenseBonus: 0,  hpBonus: 0,  speedBonus: 5 }, cost: 900, rarity: 'epic'     as const, requiredLevel: 8, allowedClasses: ['rogue'] as const },

  // ── Barbarian ─────────────────────────────────────────────────────────
  { id: 'skull_cap',     type: 'head' as const, name: 'Skull Cap',         description: 'หมวกกะโหลก HP+5',                  spriteId: 'head_skull',     stats: { attackBonus: 0, defenseBonus: 0,  hpBonus: 5,  speedBonus: 0 }, cost: 20,  rarity: 'common'   as const, requiredLevel: 1, allowedClasses: ['barbarian'] as const },
  { id: 'horned_helm',   type: 'head' as const, name: 'Horned Helm',       description: 'หมวกมีเขา DEF+3 HP+15',             spriteId: 'head_horned',    stats: { attackBonus: 0, defenseBonus: 3,  hpBonus: 15, speedBonus: 0 }, cost: 270, rarity: 'uncommon' as const, requiredLevel: 5, allowedClasses: ['barbarian'] as const },
  { id: 'berserker_helm',type: 'head' as const, name: 'Berserker Helm',    description: 'หมวกคลั่ง ATK+3 HP+25',             spriteId: 'head_bhelm',     stats: { attackBonus: 3, defenseBonus: 0,  hpBonus: 25, speedBonus: 0 }, cost: 900, rarity: 'epic'     as const, requiredLevel: 8, allowedClasses: ['barbarian'] as const },
];

export const ACCESSORIES = [
  // ── ใช้ได้ทุก class ──────────────────────────────────────────────────
  { id: 'ring_health',   type: 'accessory' as const, name: 'Ring of Health',    description: 'HP+10 ใช้ได้ทุก class',      spriteId: 'acc_ring',    stats: { attackBonus: 0, defenseBonus: 0, hpBonus: 10, speedBonus: 0 }, cost: 20,  rarity: 'common'   as const, requiredLevel: 1, allowedClasses: [] as const },
  { id: 'boots_swift',   type: 'accessory' as const, name: 'Boots of Swiftness', description: 'SPD+3 ใช้ได้ทุก class',    spriteId: 'acc_boots',   stats: { attackBonus: 0, defenseBonus: 0, hpBonus: 0,  speedBonus: 3 }, cost: 150, rarity: 'uncommon' as const, requiredLevel: 2, allowedClasses: [] as const },
  { id: 'amulet_focus',  type: 'accessory' as const, name: 'Amulet of Focus',   description: 'ATK+2 DEF+2 ใช้ได้ทุก class',spriteId: 'acc_amulet',  stats: { attackBonus: 2, defenseBonus: 2, hpBonus: 0,  speedBonus: 0 }, cost: 200, rarity: 'uncommon' as const, requiredLevel: 4, allowedClasses: [] as const },
  { id: 'pendant_life',  type: 'accessory' as const, name: 'Pendant of Life',   description: 'HP+25 ใช้ได้ทุก class',      spriteId: 'acc_pendant', stats: { attackBonus: 0, defenseBonus: 0, hpBonus: 25, speedBonus: 0 }, cost: 450, rarity: 'rare'     as const, requiredLevel: 6, allowedClasses: [] as const },
  { id: 'champion_belt', type: 'accessory' as const, name: 'Champion Belt',     description: 'ATK+3 DEF+3 HP+10 ทุก class', spriteId: 'acc_belt',    stats: { attackBonus: 3, defenseBonus: 3, hpBonus: 10, speedBonus: 0 }, cost: 800, rarity: 'rare'     as const, requiredLevel: 8, allowedClasses: [] as const },

  // ── Class-specific ────────────────────────────────────────────────────
  { id: 'shield_charm',  type: 'accessory' as const, name: 'Shield Charm',      description: 'DEF+6 (Knight only)',         spriteId: 'acc_shield',  stats: { attackBonus: 0, defenseBonus: 6, hpBonus: 0,  speedBonus: 0 }, cost: 220, rarity: 'uncommon' as const, requiredLevel: 3, allowedClasses: ['knight'] as const },
  { id: 'spell_orb',     type: 'accessory' as const, name: 'Spell Orb',         description: 'ATK+5 (Mage only)',           spriteId: 'acc_orb',     stats: { attackBonus: 5, defenseBonus: 0, hpBonus: 0,  speedBonus: 0 }, cost: 220, rarity: 'uncommon' as const, requiredLevel: 3, allowedClasses: ['mage'] as const },
  { id: 'poison_vial',   type: 'accessory' as const, name: 'Poison Vial',       description: 'ATK+3 SPD+3 (Rogue only)',    spriteId: 'acc_vial',    stats: { attackBonus: 3, defenseBonus: 0, hpBonus: 0,  speedBonus: 3 }, cost: 230, rarity: 'uncommon' as const, requiredLevel: 3, allowedClasses: ['rogue'] as const },
  { id: 'rage_rune',     type: 'accessory' as const, name: 'Rage Rune',         description: 'ATK+5 HP+10 (Barbarian only)',spriteId: 'acc_rune',    stats: { attackBonus: 5, defenseBonus: 0, hpBonus: 10, speedBonus: 0 }, cost: 230, rarity: 'uncommon' as const, requiredLevel: 3, allowedClasses: ['barbarian'] as const },
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
    rewards: { experience: 40, gold: 15 },
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
    rewards: { experience: 60, gold: 20 },
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
    rewards: { experience: 90, gold: 25 },
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
    rewards: { experience: 120, gold: 30 },
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
    rewards: { experience: 150, gold: 35 },
  },
  {
    id: 'level_6', number: 6, name: 'The Goblin Knight', description: 'Goblin Knight มีเกราะหนัก — ต้องหลบ',
    difficultyEstimate: 2, concept: 'Dodge + Conditions',
    tutorialText: 'Dodge เมื่อ HP < 40 — Knight มีเกราะหนัก!',
    objectives: ['สังหาร Goblin Knight', 'ใช้ Dodge block', 'ใช้ Condition'],
    bonusObjective: 'HP เหลือมากกว่า 35%',
    allowedBlocks: ['attack', 'heal', 'dodge', 'condition'],
    requiredBlocks: ['condition', 'dodge'],
    enemy: { id: 'goblin_knight', name: 'Goblin Knight', spriteId: 'enemy_goblin', stats: { maxHP: 110, currentHP: 110, attack: 14, defense: 6, speed: 6, armor: 4, parry: 15, enrageThreshold: 30 }, behaviors: ['attack', 'attack', 'heal'] },
    unlockRequirements: { levelRequired: 5, previousLevelComplete: true },
    rewards: { experience: 190, gold: 45 },
  },
  {
    id: 'level_7', number: 7, name: 'The Spider Den', description: 'Spider ตีเร็ว — ต้องใช้ nested conditions',
    difficultyEstimate: 3, concept: 'Nested Conditions',
    tutorialText: 'Nested conditions: HP < 30 → Dodge, HP < 60 → Heal, else → Attack',
    objectives: ['สังหาร Spider Queen', 'ใช้ Heal + Dodge + Condition'],
    bonusObjective: 'HP เหลือมากกว่า 25%',
    allowedBlocks: ['attack', 'heal', 'dodge', 'condition'],
    requiredBlocks: ['condition', 'heal', 'dodge'],
    enemy: { id: 'spider', name: 'Spider Queen', spriteId: 'enemy_spider', stats: { maxHP: 130, currentHP: 130, attack: 17, defense: 5, speed: 13, enrageThreshold: 25, ailmentType: 'poison', ailmentChance: 0.35 }, behaviors: ['attack', 'attack', 'attack'] },
    unlockRequirements: { levelRequired: 6, previousLevelComplete: true },
    rewards: { experience: 240, gold: 55 },
  },
  {
    id: 'level_8', number: 8, name: 'The Forest Wraith', description: 'Ghost ทำดาเมจสูง — ใช้ Cast Spell ตอบโต้',
    difficultyEstimate: 3, concept: 'Spell Casting + Mana',
    tutorialText: 'Cast Spell ใช้ 25 mana แต่ทำดาเมจสูง! ใช้ Condition ตรวจ Enemy Alive',
    objectives: ['สังหาร Forest Wraith', 'ใช้ Cast Spell อย่างน้อย 1 ครั้ง'],
    bonusObjective: 'HP เหลือมากกว่า 30%',
    allowedBlocks: ['attack', 'heal', 'dodge', 'cast_spell', 'condition'],
    requiredBlocks: ['cast_spell', 'condition'],
    enemy: { id: 'ghost', name: 'Forest Wraith', spriteId: 'enemy_ghost', stats: { maxHP: 140, currentHP: 140, attack: 18, defense: 5, speed: 11, ailmentType: 'freeze', ailmentChance: 0.25 }, behaviors: ['attack', 'attack', 'attack'] },
    unlockRequirements: { levelRequired: 7, previousLevelComplete: true },
    rewards: { experience: 300, gold: 65 },
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
    rewards: { experience: 370, gold: 75 },
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
    rewards: { experience: 450, gold: 85 },
  },
  {
    id: 'level_11', number: 11, name: 'The Orc Warlord', description: 'Orc Warlord ผสมทุกทักษะ — ศึกหนัก!',
    difficultyEstimate: 4, concept: 'Full Skill Set',
    tutorialText: 'ผสม Power Strike + Spell + Heal — ศึกหนัก!',
    objectives: ['สังหาร Orc Warlord', 'ใช้ Power Strike + Cast Spell'],
    bonusObjective: 'HP เหลือมากกว่า 20%',
    allowedBlocks: ['attack', 'heal', 'dodge', 'cast_spell', 'power_strike', 'condition'],
    requiredBlocks: ['power_strike', 'cast_spell', 'condition', 'heal'],
    enemy: { id: 'orc_warlord', name: 'Orc Warlord', spriteId: 'enemy_orc', stats: { maxHP: 220, currentHP: 220, attack: 24, defense: 12, speed: 7, armor: 10, parry: 20, enrageThreshold: 30, ailmentType: 'burn', ailmentChance: 0.30 }, behaviors: ['attack', 'attack', 'cast_spell'] },
    unlockRequirements: { levelRequired: 10, previousLevelComplete: true },
    rewards: { experience: 550, gold: 100 },
  },
  {
    id: 'level_12', number: 12, name: 'The Ice Cavern', description: 'Ice Giant มีเกราะหนา — Spell/Power Strike ทะลุได้!',
    difficultyEstimate: 4, concept: 'Armor Penetration',
    tutorialText: 'Ice Giant มีเกราะหนา — Spell/Power Strike ทะลุได้!',
    objectives: ['สังหาร Ice Giant', 'ใช้ Spell หรือ Power Strike'],
    bonusObjective: 'HP เหลือมากกว่า 20%',
    allowedBlocks: ['attack', 'heal', 'dodge', 'cast_spell', 'power_strike', 'condition'],
    requiredBlocks: ['cast_spell', 'power_strike', 'condition'],
    enemy: { id: 'ice_giant', name: 'Ice Giant', spriteId: 'enemy_ice_giant', stats: { maxHP: 260, currentHP: 260, attack: 28, defense: 15, speed: 6, armor: 12, ailmentType: 'freeze', ailmentChance: 0.35 }, behaviors: ['attack', 'attack', 'cast_spell'] },
    unlockRequirements: { levelRequired: 11, previousLevelComplete: true },
    rewards: { experience: 680, gold: 120 },
  },
  {
    id: 'level_13', number: 13, name: "The Dragon's Lair", description: 'Dragon มีความสามารถหลากหลาย — ต้องใช้ทุกทักษะ!',
    difficultyEstimate: 5, concept: 'Master Combat',
    tutorialText: 'Dragon มีความสามารถหลากหลาย — ต้องใช้ทุกทักษะ!',
    objectives: ['สังหาร Young Dragon', 'ใช้ทุก action type'],
    bonusObjective: 'HP เหลือมากกว่า 20%',
    requiredBlocks: ['cast_spell', 'power_strike', 'condition', 'heal', 'dodge'],
    enemy: { id: 'dragon', name: 'Young Dragon', spriteId: 'enemy_dragon', stats: { maxHP: 300, currentHP: 300, attack: 30, defense: 16, speed: 10, enrageThreshold: 35, ailmentType: 'burn', ailmentChance: 0.40 }, behaviors: ['attack', 'cast_spell', 'attack', 'attack'] },
    unlockRequirements: { levelRequired: 12, previousLevelComplete: true },
    rewards: { experience: 850, gold: 150 },
  },
  {
    id: 'level_14', number: 14, name: 'The Lich Lord', description: 'Lich Lord เก่งทุกด้าน — True Mastery required',
    difficultyEstimate: 5, concept: 'True Mastery',
    objectives: ['สังหาร Lich Lord'],
    bonusObjective: 'HP เหลือมากกว่า 15%',
    requiredBlocks: ['cast_spell', 'power_strike', 'condition', 'heal'],
    enemy: { id: 'lich', name: 'Lich Lord', spriteId: 'enemy_lich', stats: { maxHP: 370, currentHP: 370, attack: 36, defense: 18, speed: 11, armor: 8, parry: 25, enrageThreshold: 40, ailmentType: 'poison', ailmentChance: 0.40 }, behaviors: ['cast_spell', 'attack', 'cast_spell', 'attack', 'heal'] },
    unlockRequirements: { levelRequired: 13, previousLevelComplete: true },
    rewards: { experience: 1050, gold: 180 },
  },
  {
    id: 'level_15', number: 15, name: 'The Dark Overlord', description: 'Dark Overlord — Final Challenge',
    difficultyEstimate: 5, concept: 'Final Challenge',
    objectives: ['สังหาร Dark Overlord', 'ใช้ Flowchart ที่สมบูรณ์'],
    bonusObjective: 'HP เหลือมากกว่า 25%',
    requiredBlocks: ['cast_spell', 'power_strike', 'condition', 'heal', 'dodge'],
    enemy: { id: 'overlord', name: 'Dark Overlord', spriteId: 'enemy_boss', stats: { maxHP: 500, currentHP: 500, attack: 45, defense: 25, speed: 15, armor: 20, parry: 35, enrageThreshold: 40, ailmentType: 'burn', ailmentChance: 0.45 }, behaviors: ['attack', 'cast_spell', 'heal', 'cast_spell', 'attack', 'attack'] },
    unlockRequirements: { levelRequired: 14, previousLevelComplete: true },
    rewards: { experience: 1500, gold: 250 },
  },
];

// ===== Endless / Survival Mode =====
export const ENDLESS_LEVEL = {
  id: 'level_endless',
  number: 0,
  name: '∞ Endless Mode',
  description: 'ศัตรูไม่มีที่สิ้นสุด ยากขึ้นทุก Wave — แก้ไข Flowchart ระหว่าง Wave ได้!',
  difficultyEstimate: 5,
  concept: 'Survival Score Attack',
  isEndless: true,
  tutorialText: 'อยู่รอดให้นานที่สุด! แก้ไข Flowchart ได้ระหว่าง Wave',
  objectives: ['อยู่รอดให้นานที่สุด', 'คะแนน = Wave × HP%'],
  unlockRequirements: { levelRequired: 0, previousLevelComplete: false },
  rewards: { experience: 0 },
};

/** สร้าง enemy สำหรับ Endless mode wave ที่ N (เริ่มจาก 1) */
export function getEndlessWaveEnemy(wave: number) {
  const hp    = Math.floor(20 * Math.pow(1.32, wave - 1));
  const atk   = Math.floor(3  * Math.pow(1.15, wave - 1));
  const def   = Math.floor(0  + wave * 0.5);
  const armor = wave > 5  ? Math.floor((wave - 5) * 1.5) : 0;
  const parry = wave > 8  ? Math.min(35, (wave - 8) * 4) : 0;
  const enrage = wave > 3 ? 30 : 0;

  const namePool = ['Slime','Goblin','Kobold','Orc','Troll','Giant','Warlord','Dragon','Lich','Overlord'];
  const name = `${namePool[Math.min(wave - 1, namePool.length - 1)]} (W${wave})`;

  const spritePool = ['enemy_slime','enemy_goblin','enemy_kobold','enemy_orc','enemy_troll','enemy_ice_giant','enemy_orc','enemy_dragon','enemy_lich','enemy_boss'];
  const spriteId = spritePool[Math.min(wave - 1, spritePool.length - 1)];

  const behaviors = wave <= 2
    ? ['attack']
    : wave <= 5
    ? ['attack', 'attack']
    : wave <= 9
    ? ['attack', 'cast_spell', 'attack']
    : ['attack', 'cast_spell', 'attack', 'heal', 'cast_spell', 'attack'];

  return {
    id: `endless_w${wave}`,
    name,
    spriteId,
    stats: { maxHP: hp, currentHP: hp, attack: atk, defense: def, speed: 5, armor, parry, enrageThreshold: enrage },
    behaviors,
  };
}
