// ===========================
// FlowFight - Game Constants
// ===========================

export const GAME_VERSION = '0.12.0';

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
// ─────────────────────────────────────────────────────────────────────────
// ลำดับการสอน: Sequence → Decision (HP → Ailment → Counter) → Loop → Combine → Mastery
//  1-3  : Sequence          — Attack, Heal (Process Support), Dodge
//  4-6  : Decision HP       — If/Else, Nested HP, HP Greater + Spell
//  7-8  : Decision Ailment  — Hero Poisoned?, Hero Frozen? + Dodge
//  9-10 : Decision Counter  — Turn ≥ N, Counter + HP Threshold
// 11-14 : Loop              — While Loop, Loop+HP, Loop+Counter, Loop+Ailment
// 15    : Combine           — Full Algorithm (รวมทุก concept)
// 16-17 : Advanced          — Class Skills, Counter Precision
// 18-20 : Mastery           — ไม่มีคำแนะนำ ออกแบบเอง (incl. Sub-Boss & Final Boss)
// ─────────────────────────────────────────────────────────────────────────
export const LEVELS = [
  // ── PHASE 1: SEQUENCE ─────────────────────────────────────────────────────
  {
    id: 'level_1', number: 1,
    name: 'The Slime Cave',
    description: 'เรียนรู้ Sequence — ต่อ block เป็นเส้นตรงจาก Start ถึง End',
    difficultyEstimate: 1,
    concept: 'Sequence (ลำดับขั้นตอน)',
    tutorialText: 'ต่อ Start → Attack → End — Flowchart ทำงานทีละขั้น ตามลำดับจากบนลงล่าง ไม่ข้ามขั้นตอน!',
    objectives: ['สังหาร Slime'],
    bonusObjective: 'ไม่รับดาเมจเลย (HP คงที่)',
    allowedBlocks: ['attack'],
    enemy: {
      id: 'slime', name: 'Slime', spriteId: 'enemy_slime',
      stats: { maxHP: 20, currentHP: 20, attack: 2, defense: 0, speed: 3 },
      behaviors: ['attack'],
    },
    unlockRequirements: { levelRequired: 0, previousLevelComplete: false },
    rewards: { experience: 40, gold: 15 },
  },

  {
    id: 'level_2', number: 2,
    name: 'Heal Up!',
    description: 'เรียนรู้ Process Support — Heal ฟื้น HP ต้องใช้ให้เป็นใน Sequence',
    difficultyEstimate: 1,
    concept: 'Process: Combat vs Support (Heal)',
    tutorialText: 'Slime ใหญ่ขึ้น HP หายเร็ว! วาง Heal ใน Flowchart — Process แบ่งเป็น Combat (โจมตี) กับ Support (ช่วยตัวเอง) ใช้ Heal เพื่อฟื้น HP!',
    objectives: ['สังหาร Slime', 'ใช้ Heal อย่างน้อย 1 ครั้ง'],
    bonusObjective: 'HP เหลือมากกว่า 85%',
    allowedBlocks: ['attack', 'heal'],
    requiredBlocks: ['heal'],
    enemy: {
      id: 'slime', name: 'Bigger Slime', spriteId: 'enemy_slime',
      stats: { maxHP: 42, currentHP: 42, attack: 6, defense: 0, speed: 4 },
      behaviors: ['attack', 'attack'],
    },
    unlockRequirements: { levelRequired: 1, previousLevelComplete: true },
    rewards: { experience: 65, gold: 20 },
  },

  {
    id: 'level_3', number: 3,
    name: 'Dodge Roll',
    description: 'เรียนรู้ Dodge — หลบดาเมจ 1 ครั้ง เหมาะตอน HP ต่ำ',
    difficultyEstimate: 1,
    concept: 'Process Support: Dodge (หลบหลีก)',
    tutorialText: 'Goblin โจมตีแรง! Dodge หลบดาเมจได้ 1 ครั้ง — วาง Attack → Dodge → Attack ใน Sequence ลองดูว่า HP หายน้อยลงไหม!',
    objectives: ['สังหาร Goblin', 'ใช้ Dodge อย่างน้อย 1 ครั้ง'],
    bonusObjective: 'HP เหลือมากกว่า 70%',
    allowedBlocks: ['attack', 'heal', 'dodge'],
    requiredBlocks: ['dodge'],
    enemy: {
      id: 'goblin', name: 'Goblin Scout', spriteId: 'enemy_goblin',
      stats: { maxHP: 58, currentHP: 58, attack: 9, defense: 1, speed: 6 },
      behaviors: ['attack', 'attack'],
    },
    unlockRequirements: { levelRequired: 2, previousLevelComplete: true },
    rewards: { experience: 90, gold: 25 },
  },

  // ── PHASE 2: DECISION — HP ────────────────────────────────────────────────
  {
    id: 'level_4', number: 4,
    name: 'Heal When Low',
    description: 'เรียนรู้ Decision (If/Else) — ตรวจ HP ก่อนตัดสินใจ Heal หรือ Attack',
    difficultyEstimate: 2,
    concept: 'Decision: If/Else HP (เงื่อนไขสองทาง)',
    tutorialText: 'HP < 50? → YES: Heal / NO: Attack — นี่คือ IF/ELSE! Decision มี 2 ทาง: YES (เงื่อนไขจริง) และ NO (เงื่อนไขเท็จ) เหมือน if-else ในโปรแกรม!',
    objectives: ['สังหาร Goblin', 'ใช้ Decision + Heal'],
    bonusObjective: 'HP เหลือมากกว่า 60%',
    allowedBlocks: ['attack', 'heal', 'condition', 'hp_less'],
    requiredBlocks: ['condition', 'heal'],
    enemy: {
      id: 'goblin', name: 'Goblin', spriteId: 'enemy_goblin',
      stats: { maxHP: 78, currentHP: 78, attack: 10, defense: 2, speed: 7 },
      behaviors: ['attack', 'attack'],
    },
    unlockRequirements: { levelRequired: 3, previousLevelComplete: true },
    rewards: { experience: 120, gold: 30 },
  },

  {
    id: 'level_5', number: 5,
    name: 'Spider Den',
    description: 'เรียนรู้ Nested Decision — เงื่อนไขซ้อนกัน ตรวจหลายระดับ',
    difficultyEstimate: 2,
    concept: 'Nested Conditions (เงื่อนไขซ้อน)',
    tutorialText: 'HP<30→Dodge / HP<60→Heal / else→Attack — Nested Decision คือ Condition ใน Branch ของ Condition อื่น เหมือน if-elif-else ในโปรแกรม!',
    objectives: ['สังหาร Spider', 'ใช้ Dodge + Heal + Decision'],
    bonusObjective: 'HP เหลือมากกว่า 40%',
    allowedBlocks: ['attack', 'heal', 'dodge', 'condition', 'hp_less'],
    requiredBlocks: ['condition', 'heal', 'dodge'],
    enemy: {
      id: 'spider', name: 'Spider', spriteId: 'enemy_spider',
      stats: { maxHP: 100, currentHP: 100, attack: 14, defense: 3, speed: 10, ailmentType: 'poison', ailmentChance: 0.25 },
      behaviors: ['attack', 'attack', 'attack'],
    },
    unlockRequirements: { levelRequired: 4, previousLevelComplete: true },
    rewards: { experience: 155, gold: 38 },
  },

  {
    id: 'level_6', number: 6,
    name: 'Forest Wraith',
    description: 'เรียนรู้ Decision HP Greater — ตรวจว่ามีพลังพอก่อนใช้ Cast Spell',
    difficultyEstimate: 2,
    concept: 'Decision: HP Greater + Cast Spell',
    tutorialText: 'HP > 50? → Cast Spell / else → Attack — ตรวจ HP "มากกว่า" เหมือน if (energy >= cost) useSkill() ใน code! Spell ทะลุเกราะแต่ต้องมี HP พอ',
    objectives: ['สังหาร Forest Wraith', 'ใช้ Cast Spell + HP > Condition'],
    bonusObjective: 'HP เหลือมากกว่า 45%',
    allowedBlocks: ['attack', 'heal', 'cast_spell', 'condition', 'hp_greater'],
    requiredBlocks: ['cast_spell', 'condition'],
    enemy: {
      id: 'ghost', name: 'Forest Wraith', spriteId: 'enemy_ghost',
      stats: { maxHP: 120, currentHP: 120, attack: 13, defense: 5, speed: 11, ailmentType: 'freeze', ailmentChance: 0.25 },
      behaviors: ['attack', 'attack', 'attack'],
    },
    unlockRequirements: { levelRequired: 5, previousLevelComplete: true },
    rewards: { experience: 195, gold: 45 },
  },

  // ── PHASE 3: DECISION — AILMENT ──────────────────────────────────────────
  {
    id: 'level_7', number: 7,
    name: "Orc's Poison",
    description: 'เรียนรู้ Decision Ailment — ตรวจสถานะ Poisoned ด้วย Condition',
    difficultyEstimate: 3,
    concept: 'Decision: Ailment State (Poisoned)',
    tutorialText: 'Orc ทำให้ Poisoned! Hero Poisoned? → Heal เพื่อหยุด Poison / else → Attack — Ailment คือ "boolean flag": if (isPoisoned) heal(); ไม่ตรวจ = โดน Poison ตลอด!',
    objectives: ['สังหาร Orc Warrior', 'ใช้ Hero Poisoned? Condition'],
    bonusObjective: 'HP เหลือมากกว่า 35%',
    allowedBlocks: ['attack', 'heal', 'cast_spell', 'power_strike', 'condition', 'hero_poisoned', 'hp_less'],
    requiredBlocks: ['condition', 'heal', 'hero_poisoned'],
    initialHeroHPPercent: 0.70,
    initialHeroStatus: { poisonRounds: 4 },
    enemy: {
      id: 'orc', name: 'Orc Warrior', spriteId: 'enemy_orc',
      stats: { maxHP: 148, currentHP: 148, attack: 16, defense: 6, speed: 5, ailmentType: 'poison', ailmentChance: 0.40 },
      behaviors: ['poison_strike', 'attack', 'poison_strike'],
    },
    unlockRequirements: { levelRequired: 6, previousLevelComplete: true },
    rewards: { experience: 245, gold: 55 },
  },

  {
    id: 'level_8', number: 8,
    name: 'Frozen in Place',
    description: 'เรียนรู้ Decision Frozen — Freeze ทำให้ action miss ใช้ Dodge หลีกเลี่ยง!',
    difficultyEstimate: 3,
    concept: 'Decision: Ailment State (Frozen + Dodge)',
    tutorialText: 'Kobold ทำให้ Frozen! Hero Frozen? → Dodge (หลบก่อน miss ไปเปล่า!) / else → Power Strike — Frozen ทำให้ action miss ดังนั้นต้องตรวจก่อนใช้ท่า!',
    objectives: ['สังหาร Kobold', 'ใช้ Hero Frozen? Condition + Dodge'],
    bonusObjective: 'HP เหลือมากกว่า 40%',
    allowedBlocks: ['attack', 'heal', 'dodge', 'power_strike', 'condition', 'hero_frozen', 'hp_less'],
    requiredBlocks: ['condition', 'dodge', 'hero_frozen'],
    initialHeroStatus: { freezeRounds: 2 },
    enemy: {
      id: 'kobold', name: 'Kobold Pack', spriteId: 'enemy_kobold',
      stats: { maxHP: 128, currentHP: 128, attack: 13, defense: 4, speed: 9, ailmentType: 'freeze', ailmentChance: 0.35 },
      behaviors: ['freeze_strike', 'attack', 'freeze_strike', 'attack'],
    },
    unlockRequirements: { levelRequired: 7, previousLevelComplete: true },
    rewards: { experience: 300, gold: 65 },
  },

  // ── PHASE 4: DECISION — COUNTER ──────────────────────────────────────────
  {
    id: 'level_9', number: 9,
    name: 'Turn Counter',
    description: 'เรียนรู้ Counter — Turn ≥ N ปรับได้ทีละ 1 นับรอบเหมือน for-loop',
    difficultyEstimate: 3,
    concept: 'Decision: Counter (Turn ≥ N)',
    tutorialText: 'Turn ≥ 3 → Power Strike / else → Attack — Counter นับรอบเหมือน for(i=0;i<N;i++) ในโปรแกรม! กด ±1 บน Counter node เพื่อหา timing ที่เหมาะ',
    objectives: ['สังหาร Goblin Knight', 'ใช้ Turn ≥ N? + Power Strike'],
    bonusObjective: 'HP เหลือมากกว่า 50%',
    allowedBlocks: ['attack', 'heal', 'dodge', 'cast_spell', 'power_strike', 'condition', 'hp_less', 'turn_gte'],
    requiredBlocks: ['condition', 'power_strike', 'turn_gte'],
    enemy: {
      id: 'goblin_knight', name: 'Goblin Knight', spriteId: 'enemy_goblin',
      stats: { maxHP: 140, currentHP: 140, attack: 16, defense: 6, speed: 6, armor: 6, parry: 15, enrageThreshold: 30 },
      behaviors: ['attack', 'power_strike', 'heal', 'attack'],
    },
    unlockRequirements: { levelRequired: 8, previousLevelComplete: true },
    rewards: { experience: 365, gold: 78 },
  },

  {
    id: 'level_10', number: 10,
    name: 'Troll Rampage',
    description: 'ผสม Counter กับ HP Condition — Troll Enrage ต้องจับ timing!',
    difficultyEstimate: 3,
    concept: 'Counter + HP Threshold (ผสม Counter + HP)',
    tutorialText: 'Troll Enrage เมื่อ HP น้อย! ผสม Counter + HP: HP<40→Dodge (หลบ Enrage) / Turn≥5→Power Strike / else→Attack — ปรับ Turn ≥ ทีละ 1 จนพอดี!',
    objectives: ['สังหาร Stone Troll', 'ใช้ Counter + HP Condition พร้อมกัน'],
    bonusObjective: 'HP เหลือมากกว่า 30%',
    allowedBlocks: ['attack', 'heal', 'dodge', 'cast_spell', 'power_strike', 'condition', 'hp_less', 'turn_gte'],
    requiredBlocks: ['condition', 'turn_gte', 'dodge'],
    enemy: {
      id: 'troll', name: 'Stone Troll', spriteId: 'enemy_troll',
      stats: { maxHP: 182, currentHP: 182, attack: 20, defense: 9, speed: 4, armor: 7, parry: 15, enrageThreshold: 35 },
      behaviors: ['attack', 'heal', 'power_strike', 'attack', 'heal'],
    },
    unlockRequirements: { levelRequired: 9, previousLevelComplete: true },
    rewards: { experience: 450, gold: 88 },
  },

  // ── PHASE 5: LOOP ─────────────────────────────────────────────────────────
  {
    id: 'level_11', number: 11,
    name: 'While Loop',
    description: 'เรียนรู้ While Loop — Enemy Alive? วนซ้ำจนศัตรูตาย',
    difficultyEstimate: 4,
    concept: 'While Loop (การวนซ้ำผ่าน Enemy Alive?)',
    tutorialText: 'Enemy Alive? → YES: Attack → วนกลับที่ Enemy Alive? / NO: End — นี่คือ While Loop! ทำงานซ้ำจนเงื่อนไขเป็น false เหมือน while(enemy.alive) attack();',
    objectives: ['สังหาร Orc Warlord', 'ใช้ Enemy Alive? Loop'],
    bonusObjective: 'HP เหลือมากกว่า 25%',
    allowedBlocks: ['attack', 'heal', 'dodge', 'cast_spell', 'power_strike', 'condition', 'enemy_alive'],
    requiredBlocks: ['condition', 'enemy_alive'],
    enemy: {
      id: 'orc_warlord', name: 'Orc Warlord', spriteId: 'enemy_orc',
      budgetPerTurn: 2,
      stats: { maxHP: 218, currentHP: 218, attack: 22, defense: 10, speed: 7, armor: 8, parry: 18, enrageThreshold: 30, ailmentType: 'burn', ailmentChance: 0.30 },
      behaviors: ['attack', 'burn_strike', 'attack', 'cast_spell', 'attack'],
    },
    unlockRequirements: { levelRequired: 10, previousLevelComplete: true },
    rewards: { experience: 555, gold: 105 },
  },

  {
    id: 'level_12', number: 12,
    name: 'Loop + Heal',
    description: 'ใส่ Decision ใน Loop — ตรวจ HP ทุกรอบที่วนซ้ำ',
    difficultyEstimate: 4,
    concept: 'Loop + If/Else Inside (Decision ใน While Loop)',
    tutorialText: 'Loop (Enemy Alive?) → YES → HP < 50? → YES: Heal / NO: Cast Spell — นี่คือ "If/Else ใน While Loop": ทุกรอบที่วน ตรวจ HP แล้วตัดสินใจด้วย!',
    objectives: ['สังหาร Ice Giant', 'ใช้ HP Condition ใน Loop'],
    bonusObjective: 'HP เหลือมากกว่า 20%',
    allowedBlocks: ['attack', 'heal', 'dodge', 'cast_spell', 'power_strike', 'condition', 'enemy_alive', 'hero_frozen', 'hp_less'],
    requiredBlocks: ['condition', 'enemy_alive', 'heal', 'hp_less'],
    initialHeroHPPercent: 0.45,
    enemy: {
      id: 'ice_giant', name: 'Ice Giant', spriteId: 'enemy_ice_giant',
      budgetPerTurn: 2,
      stats: { maxHP: 252, currentHP: 252, attack: 26, defense: 14, speed: 6, armor: 11, ailmentType: 'freeze', ailmentChance: 0.35 },
      behaviors: ['freeze_strike', 'attack', 'cast_spell', 'freeze_strike', 'attack'],
    },
    unlockRequirements: { levelRequired: 11, previousLevelComplete: true },
    rewards: { experience: 685, gold: 125 },
  },

  {
    id: 'level_13', number: 13,
    name: "Dragon's Counter",
    description: 'ใส่ Counter ใน Loop — burst ทุก N รอบ Dragon แรงมาก!',
    difficultyEstimate: 4,
    concept: 'Loop + Counter Inside (Counter ใน While Loop)',
    tutorialText: 'Loop → Turn ≥ 3? → YES: Power Strike / NO: Attack → วนกลับ — Counter ใน Loop คือ "burst ทุก N รอบ" เหมือน if (turn % N == 0) burst(); ใน code!',
    objectives: ['สังหาร Young Dragon', 'ใช้ Turn Counter ใน Loop'],
    bonusObjective: 'HP เหลือมากกว่า 20%',
    allowedBlocks: ['attack', 'heal', 'dodge', 'cast_spell', 'power_strike', 'condition', 'enemy_alive', 'turn_gte', 'hp_less'],
    requiredBlocks: ['condition', 'enemy_alive', 'turn_gte', 'power_strike'],
    enemy: {
      id: 'dragon', name: 'Young Dragon', spriteId: 'enemy_dragon',
      budgetPerTurn: 2,
      stats: { maxHP: 295, currentHP: 295, attack: 29, defense: 15, speed: 10, enrageThreshold: 35, ailmentType: 'burn', ailmentChance: 0.40 },
      behaviors: ['burn_strike', 'attack', 'cast_spell', 'attack', 'power_strike'],
    },
    unlockRequirements: { levelRequired: 12, previousLevelComplete: true },
    rewards: { experience: 850, gold: 155 },
  },

  {
    id: 'level_14', number: 14,
    name: "Dragon's Fury",
    description: 'ผสม Loop + Ailment + HP — Dragon Elder แรงกว่าเดิม แถม Poison!',
    difficultyEstimate: 5,
    concept: 'Loop + Ailment + HP (ผสมใน While Loop)',
    tutorialText: 'Loop → Poisoned?→Heal / HP<50?→Dodge / Turn≥4?→Power Strike / else→Cast Spell — ผสมทุกอย่างใน Loop: ตรวจ Ailment + HP + Counter ทุกรอบ!',
    objectives: ['สังหาร Dragon Elder', 'ใช้ Ailment Condition ใน Loop'],
    bonusObjective: 'HP เหลือมากกว่า 15%',
    allowedBlocks: ['attack', 'heal', 'dodge', 'cast_spell', 'power_strike', 'condition', 'enemy_alive', 'hero_poisoned', 'hp_less', 'turn_gte'],
    requiredBlocks: ['condition', 'enemy_alive', 'hero_poisoned', 'heal', 'dodge'],
    initialHeroHPPercent: 0.65,
    initialHeroStatus: { poisonRounds: 3 },
    enemy: {
      id: 'dragon', name: 'Dragon Elder', spriteId: 'enemy_dragon',
      budgetPerTurn: 2,
      stats: { maxHP: 345, currentHP: 345, attack: 33, defense: 17, speed: 11, armor: 8, parry: 20, enrageThreshold: 40, ailmentType: 'poison', ailmentChance: 0.40 },
      behaviors: ['poison_strike', 'attack', 'cast_spell', 'poison_strike', 'power_strike'],
    },
    unlockRequirements: { levelRequired: 13, previousLevelComplete: true },
    rewards: { experience: 1050, gold: 185 },
  },

  // ── PHASE 6: COMBINE ─────────────────────────────────────────────────────
  {
    id: 'level_15', number: 15,
    name: 'The Warlord Returns',
    description: 'ออกแบบ Algorithm ที่ครบถ้วน — ผสมทุก concept จาก 14 ด่านที่ผ่านมา',
    difficultyEstimate: 5,
    concept: 'Full Algorithm (Sequence + Decision + Loop รวมกัน)',
    tutorialText: 'Orc Warlord ใช้ทุกท่า — ต้องทำ Loop ที่มี Ailment + HP + Counter ครบ: Poisoned?→Heal / HP<40?→Dodge / Turn≥4?→Power Strike / else→Cast Spell!',
    objectives: ['สังหาร Orc Warlord Elite', 'ใช้ครบ: Loop + HP + Ailment + Counter'],
    bonusObjective: 'HP เหลือมากกว่า 20%',
    allowedBlocks: ['attack', 'heal', 'dodge', 'cast_spell', 'power_strike', 'condition', 'enemy_alive', 'hero_poisoned', 'hp_less', 'turn_gte'],
    requiredBlocks: ['condition', 'enemy_alive', 'cast_spell', 'power_strike', 'heal', 'dodge'],
    enemy: {
      id: 'orc_warlord', name: 'Orc Warlord Elite', spriteId: 'enemy_orc',
      budgetPerTurn: 2,
      stats: { maxHP: 280, currentHP: 280, attack: 27, defense: 13, speed: 8, armor: 9, parry: 22, enrageThreshold: 30, ailmentType: 'poison', ailmentChance: 0.35 },
      behaviors: ['poison_strike', 'attack', 'cast_spell', 'power_strike', 'attack'],
    },
    unlockRequirements: { levelRequired: 14, previousLevelComplete: true },
    rewards: { experience: 1300, gold: 220 },
  },

  // ── PHASE 7: ADVANCED ─────────────────────────────────────────────────────
  {
    id: 'level_16', number: 16,
    name: "Vampire's Curse",
    description: 'ใช้ Class Skill ใน Flowchart — Vampire ดูด HP และทำ Poison ทุกรอบ!',
    difficultyEstimate: 5,
    concept: 'Class Skills + Ailment Combo',
    tutorialText: 'Vampire ดูด HP ทุกรอบ! ใช้ Class Skill ของ Class ตัวเองใน Loop: ตรวจ Poisoned? + HP + สลับ Skill กับ Attack ให้เหมาะสม — Class Skill แต่ละอันแรงกว่า Attack มาก!',
    objectives: ['สังหาร Vampire Lord'],
    bonusObjective: 'HP เหลือมากกว่า 15%',
    allowedBlocks: ['attack', 'heal', 'dodge', 'cast_spell', 'power_strike', 'condition', 'enemy_alive', 'hero_poisoned', 'hp_less'],
    requiredBlocks: ['condition', 'enemy_alive', 'heal'],
    enemy: {
      id: 'vampire', name: 'Vampire Lord', spriteId: 'enemy_lich',
      budgetPerTurn: 3,
      stats: { maxHP: 350, currentHP: 350, attack: 30, defense: 18, speed: 13, armor: 8, parry: 22, enrageThreshold: 35, ailmentType: 'poison', ailmentChance: 0.45 },
      behaviors: ['poison_strike', 'attack', 'cast_spell', 'heal', 'poison_strike', 'power_strike'],
    },
    unlockRequirements: { levelRequired: 15, previousLevelComplete: true },
    rewards: { experience: 1600, gold: 260 },
  },

  {
    id: 'level_17', number: 17,
    name: 'Frost Titan',
    description: 'Counter Precision — ปรับ threshold ทีละ 1 หา timing burst ที่แม่นยำ!',
    difficultyEstimate: 5,
    concept: 'Counter Precision + Frozen Management',
    tutorialText: 'Frost Titan แข็งแกร่งมาก! ปรับ Turn ≥ N ทีละ 1 บน Counter node หา timing ที่ดีที่สุด Frozen?→Dodge ก่อนเสมอ จากนั้น burst เมื่อครบ turn ที่กำหนด!',
    objectives: ['สังหาร Frost Titan'],
    bonusObjective: 'HP เหลือมากกว่า 10%',
    allowedBlocks: ['attack', 'heal', 'dodge', 'cast_spell', 'power_strike', 'condition', 'enemy_alive', 'turn_gte', 'hero_frozen'],
    requiredBlocks: ['condition', 'enemy_alive', 'turn_gte', 'hero_frozen'],
    enemy: {
      id: 'frost_titan', name: 'Frost Titan', spriteId: 'enemy_ice_giant',
      budgetPerTurn: 3,
      stats: { maxHP: 400, currentHP: 400, attack: 34, defense: 20, speed: 7, armor: 14, parry: 25, enrageThreshold: 40, ailmentType: 'freeze', ailmentChance: 0.45 },
      behaviors: ['freeze_strike', 'attack', 'cast_spell', 'freeze_strike', 'power_strike', 'attack'],
    },
    unlockRequirements: { levelRequired: 16, previousLevelComplete: true },
    rewards: { experience: 2000, gold: 300 },
  },

  // ── PHASE 8: MASTERY (ไม่มีคำแนะนำ) ─────────────────────────────────────
  {
    id: 'level_18', number: 18,
    name: 'Dark Commander',
    description: 'Mastery Challenge — ไม่มีคำแนะนำ ออกแบบ Flowchart เองทั้งหมด!',
    difficultyEstimate: 5,
    concept: 'Mastery: Free Design',
    tutorialText: 'Dark Commander ใช้ทุกท่า — ไม่มีคำแนะนำแล้ว! ใช้ทุกที่เรียนมา: Loop, HP, Ailment, Counter, Class Skills ออกแบบ Flowchart ที่ดีที่สุดด้วยตัวเอง!',
    objectives: ['สังหาร Dark Commander'],
    bonusObjective: 'HP เหลือมากกว่า 10%',
    allowedBlocks: ['attack', 'heal', 'dodge', 'cast_spell', 'power_strike', 'condition'],
    requiredBlocks: [],
    enemy: {
      id: 'dark_commander', name: 'Dark Commander', spriteId: 'enemy_boss',
      budgetPerTurn: 3,
      stats: { maxHP: 450, currentHP: 450, attack: 38, defense: 22, speed: 12, armor: 15, parry: 28, enrageThreshold: 40, ailmentType: 'burn', ailmentChance: 0.40 },
      behaviors: ['burn_strike', 'attack', 'cast_spell', 'power_strike', 'heal', 'attack', 'burn_strike'],
    },
    unlockRequirements: { levelRequired: 17, previousLevelComplete: true },
    rewards: { experience: 2500, gold: 350 },
  },

  {
    id: 'level_19', number: 19,
    name: 'The Lich Lord',
    description: 'Sub-Boss — Lich Lord ไม่มีจุดอ่อน รู้จัก Ailment ทุกประเภท!',
    difficultyEstimate: 5,
    concept: 'Sub-Boss: Ultimate Mastery',
    tutorialText: 'Lich Lord ไม่มีจุดอ่อน — ใช้ทุกที่เรียนมา: Loop ที่ครบ, ตรวจ Ailment ทุกประเภท, Counter precision, Class Skill ที่เหมาะสมกับสถานการณ์!',
    objectives: ['สังหาร Lich Lord'],
    bonusObjective: 'HP เหลือมากกว่า 10%',
    allowedBlocks: ['attack', 'heal', 'dodge', 'cast_spell', 'power_strike', 'condition'],
    requiredBlocks: [],
    enemy: {
      id: 'lich', name: 'Lich Lord', spriteId: 'enemy_lich',
      budgetPerTurn: 3,
      stats: { maxHP: 500, currentHP: 500, attack: 42, defense: 24, speed: 13, armor: 12, parry: 30, enrageThreshold: 40, ailmentType: 'poison', ailmentChance: 0.45 },
      behaviors: ['poison_strike', 'cast_spell', 'attack', 'power_strike', 'heal', 'poison_strike', 'cast_spell'],
    },
    unlockRequirements: { levelRequired: 18, previousLevelComplete: true },
    rewards: { experience: 3200, gold: 430 },
  },

  {
    id: 'level_20', number: 20,
    name: 'The Dark Overlord',
    description: 'Final Boss — Dark Overlord ผู้ครองความมืด บทพิสูจน์ขั้นสุดท้าย!',
    difficultyEstimate: 5,
    concept: 'Final Boss: Ultimate Challenge',
    tutorialText: 'Dark Overlord ใช้ทุกอย่าง — นี่คือบทพิสูจน์สุดท้าย! ออกแบบ Flowchart ที่สมบูรณ์แบบ ผสมทุก concept ทุก skill ให้ชนะ Final Boss!',
    objectives: ['สังหาร Dark Overlord', 'แสดงว่าเข้าใจ Flowchart ครบทุก concept'],
    bonusObjective: 'HP เหลือมากกว่า 15%',
    allowedBlocks: ['attack', 'heal', 'dodge', 'cast_spell', 'power_strike', 'condition'],
    requiredBlocks: [],
    enemy: {
      id: 'overlord', name: 'Dark Overlord', spriteId: 'enemy_boss',
      budgetPerTurn: 3,
      stats: { maxHP: 650, currentHP: 650, attack: 50, defense: 28, speed: 15, armor: 20, parry: 35, enrageThreshold: 40, ailmentType: 'burn', ailmentChance: 0.50 },
      behaviors: ['burn_strike', 'power_strike', 'cast_spell', 'attack', 'heal', 'burn_strike', 'power_strike', 'cast_spell'],
    },
    unlockRequirements: { levelRequired: 19, previousLevelComplete: true },
    rewards: { experience: 4000, gold: 600 },
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

// ===== Class Skill Catalog =====
export interface ClassSkill {
  id: string;           // matches ActionType
  name: string;
  icon: string;
  description: string;
  manaCost: number;
  requiredLevel: number;
  class: 'knight' | 'mage' | 'rogue' | 'barbarian';
}

export const CLASS_SKILLS: ClassSkill[] = [
  // ── Knight ──────────────────────────────────────────────────────────────
  { id: 'shield',    name: 'Iron Shield',   icon: '🛡️', description: 'ลด damage ที่รับ turn นี้ 50%',              manaCost: 1, requiredLevel: 1, class: 'knight' },
  { id: 'counter',   name: 'Counter',       icon: '⚔️', description: 'สะท้อน 40% damage กลับ turn นี้',           manaCost: 2, requiredLevel: 3, class: 'knight' },
  { id: 'war_cry',   name: 'War Cry',       icon: '📣', description: 'ATK +40%, DEF -15% เป็นเวลา 2 turns',       manaCost: 2, requiredLevel: 5, class: 'knight' },

  // ── Mage ────────────────────────────────────────────────────────────────
  { id: 'fireball',    name: 'Fireball',    icon: '🔥', description: 'Fire damage + 40% โอกาสติด Burn',            manaCost: 2, requiredLevel: 1, class: 'mage' },
  { id: 'frost_nova',  name: 'Frost Nova',  icon: '❄️', description: 'Magic damage + Freeze enemy 1 turn',         manaCost: 2, requiredLevel: 3, class: 'mage' },
  { id: 'arcane_surge',name: 'Arcane Surge',icon: '✨', description: 'Massive magic burst, ignore all armor+DEF',  manaCost: 3, requiredLevel: 5, class: 'mage' },

  // ── Rogue ────────────────────────────────────────────────────────────────
  { id: 'backstab',    name: 'Backstab',    icon: '🗡️', description: 'ดาเมจ 2x ถ้าศัตรูติด Freeze/Stun',           manaCost: 2, requiredLevel: 1, class: 'rogue' },
  { id: 'poison_strike',name:'Poison Strike',icon:'🟣', description: 'โจมตี + ติด Poison 3 รอบ',                  manaCost: 1, requiredLevel: 3, class: 'rogue' },
  { id: 'shadow_step', name: 'Shadow Step', icon: '👤', description: 'Evade + โจมตีหลังหลบ (guaranteed hit)',      manaCost: 2, requiredLevel: 5, class: 'rogue' },

  // ── Barbarian ────────────────────────────────────────────────────────────
  { id: 'whirlwind',  name: 'Whirlwind',   icon: '🌪️', description: 'โจมตี 3 ครั้ง ดาเมจลด 30% ต่อครั้ง',        manaCost: 2, requiredLevel: 1, class: 'barbarian' },
  { id: 'bloodthirst',name: 'Bloodthirst', icon: '🩸', description: 'โจมตี + ฟื้นฟู HP 50% ของดาเมจที่ทำ',        manaCost: 2, requiredLevel: 3, class: 'barbarian' },
  { id: 'battle_cry', name: 'Battle Cry',  icon: '💥', description: 'Berserk 3 turns + ทำ Stun ศัตรู 1 turn',     manaCost: 3, requiredLevel: 5, class: 'barbarian' },
];

// ===== Passive Bonus System =====
export interface PassiveBonus {
  class: 'knight' | 'mage' | 'rogue' | 'barbarian';
  requiredLevel: number;
  description: string;
  atkBonus: number;
  defBonus: number;
  hpBonus: number;
  speedBonus: number;
}

export const PASSIVE_BONUSES: PassiveBonus[] = [
  // Knight passives
  { class: 'knight', requiredLevel: 2, description: 'Iron Body: DEF+3',             atkBonus: 0, defBonus: 3, hpBonus: 0,  speedBonus: 0 },
  { class: 'knight', requiredLevel: 4, description: 'Battle Hardened: DEF+5 HP+10', atkBonus: 0, defBonus: 5, hpBonus: 10, speedBonus: 0 },
  { class: 'knight', requiredLevel: 6, description: 'Champion: ATK+3 DEF+8',        atkBonus: 3, defBonus: 8, hpBonus: 0,  speedBonus: 0 },
  // Mage passives
  { class: 'mage', requiredLevel: 2, description: 'Arcane Mind: ATK+4',             atkBonus: 4, defBonus: 0, hpBonus: 0,  speedBonus: 0 },
  { class: 'mage', requiredLevel: 4, description: 'Spell Mastery: ATK+7',           atkBonus: 7, defBonus: 0, hpBonus: 0,  speedBonus: 1 },
  { class: 'mage', requiredLevel: 6, description: 'Archmage: ATK+10 SPD+1',        atkBonus: 10,defBonus: 0, hpBonus: 0,  speedBonus: 1 },
  // Rogue passives
  { class: 'rogue', requiredLevel: 2, description: 'Quick Fingers: SPD+2',          atkBonus: 0, defBonus: 0, hpBonus: 0,  speedBonus: 2 },
  { class: 'rogue', requiredLevel: 4, description: 'Deadly Precision: ATK+5 SPD+2', atkBonus: 5, defBonus: 0, hpBonus: 0,  speedBonus: 2 },
  { class: 'rogue', requiredLevel: 6, description: 'Assassin: ATK+8 SPD+3',        atkBonus: 8, defBonus: 0, hpBonus: 0,  speedBonus: 3 },
  // Barbarian passives
  { class: 'barbarian', requiredLevel: 2, description: 'Tough Skin: HP+15',         atkBonus: 0, defBonus: 0, hpBonus: 15, speedBonus: 0 },
  { class: 'barbarian', requiredLevel: 4, description: 'Berserker: ATK+5 HP+20',    atkBonus: 5, defBonus: 0, hpBonus: 20, speedBonus: 0 },
  { class: 'barbarian', requiredLevel: 6, description: 'Warlord: ATK+8 HP+30',      atkBonus: 8, defBonus: 0, hpBonus: 30, speedBonus: 0 },
];

/** สร้าง enemy สำหรับ Endless mode wave ที่ N (เริ่มจาก 1) */
export function getEndlessWaveEnemy(wave: number) {
  const hp    = Math.floor(20 * Math.pow(1.32, wave - 1));
  const atk   = Math.floor(8  * Math.pow(1.15, wave - 1));
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
