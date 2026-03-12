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
// ─────────────────────────────────────────────────────────────────────────
// แต่ละด่านสอน concept ของ Flowchart ทีละอย่างตามลำดับ:
//  1-2  : Sequence          — ลำดับขั้นตอน
//  3    : While Loop        — วนซ้ำผ่าน Condition
//  4    : If/Else           — เงื่อนไขสองทาง
//  5    : Nested If         — เงื่อนไขซ้อนกัน
//  6    : Counter Loop      — ตัวนับรอบ (Turn ≥ N)
//  7    : Resource Mgmt     — ตรวจทรัพยากร (HP Condition)
//  8    : Skill Selection   — เลือก action ตามสถานการณ์
//  9    : State Condition   — ตรวจสถานะตัวเอง (ailment)
// 10    : HP Threshold      — ตัดสินใจที่จุดวิกฤต
// 11    : Complex Tree      — ต้นไม้การตัดสินใจหลายระดับ
// 12    : Counter+Resource  — ผสม counter กับ resource condition
// 13    : Full Algorithm    — ออกแบบ algorithm ครบถ้วน
// 14    : Optimization      — ปรับ algorithm ให้สมบูรณ์
// 15    : Master Flowchart  — ทุก concept รวมกัน
// ─────────────────────────────────────────────────────────────────────────
export const LEVELS = [
  // ── 1: SEQUENCE ─────────────────────────────────────────────────────────
  {
    id: 'level_1', number: 1,
    name: 'The Slime Cave',
    description: 'เรียนรู้ Sequence — ต่อ block เป็นเส้นตรงจาก Start ถึง End',
    difficultyEstimate: 1,
    concept: 'Sequence (ลำดับขั้นตอน)',
    tutorialText: 'ต่อ Start → Attack → Attack → End — Flowchart ทำงานทีละขั้น ตามลำดับจากบนลงล่าง ไม่ข้ามขั้นตอน!',
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

  // ── 2: SEQUENCE (LONGER) ─────────────────────────────────────────────────
  {
    id: 'level_2', number: 2,
    name: 'Bigger Slime',
    description: 'Sequence ยาวขึ้น — ยิ่งวาง block มาก ยิ่งโจมตีได้มากต่อรอบ',
    difficultyEstimate: 1,
    concept: 'Sequence (ลำดับยาวขึ้น)',
    tutorialText: 'Slime ใหญ่กว่าเดิม วาง Attack หลายตัวต่อกัน — Flowchart ยิ่งยาว ยิ่งทำงานได้มากขึ้น!',
    objectives: ['สังหาร Slime'],
    bonusObjective: 'HP เหลือมากกว่า 85%',
    allowedBlocks: ['attack'],
    enemy: {
      id: 'slime', name: 'Slime', spriteId: 'enemy_slime',
      stats: { maxHP: 38, currentHP: 38, attack: 5, defense: 0, speed: 4 },
      behaviors: ['attack'],
    },
    unlockRequirements: { levelRequired: 1, previousLevelComplete: true },
    rewards: { experience: 60, gold: 20 },
  },

  // ── 3: WHILE LOOP VIA CONDITION ──────────────────────────────────────────
  {
    id: 'level_3', number: 3,
    name: 'Goblin Scout',
    description: 'เรียนรู้ Loop — ใช้ Condition สร้างการวนซ้ำ (While Loop)',
    difficultyEstimate: 1,
    concept: 'While Loop (การวนซ้ำผ่าน Condition)',
    tutorialText: 'Enemy Alive? → YES: Attack → วนกลับที่ Condition = While Loop! แค่ 2 blocks แต่วนซ้ำได้ทุก turn จนศัตรูตาย',
    objectives: ['สังหาร Goblin', 'ใช้ Condition block'],
    bonusObjective: 'HP เหลือมากกว่า 70%',
    allowedBlocks: ['attack', 'condition'],
    requiredBlocks: ['condition'],
    enemy: {
      id: 'goblin', name: 'Goblin Scout', spriteId: 'enemy_goblin',
      stats: { maxHP: 65, currentHP: 65, attack: 7, defense: 2, speed: 6 },
      behaviors: ['attack', 'attack'],
    },
    unlockRequirements: { levelRequired: 2, previousLevelComplete: true },
    rewards: { experience: 90, gold: 25 },
  },

  // ── 4: IF/ELSE ───────────────────────────────────────────────────────────
  {
    id: 'level_4', number: 4,
    name: 'Heal When Low',
    description: 'เรียนรู้ If/Else — ตรวจเงื่อนไข ถ้าจริงทำ A ถ้าเท็จทำ B',
    difficultyEstimate: 2,
    concept: 'If/Else Branch (เงื่อนไขสองทาง)',
    tutorialText: 'HP < 50? → YES: Heal / NO: Attack — นี่คือ IF/ELSE! ตรวจ 1 เงื่อนไข แล้วแยกทำ 2 ทางต่างกัน',
    objectives: ['สังหาร Goblin', 'ใช้ Heal + Condition block'],
    bonusObjective: 'HP เหลือมากกว่า 60%',
    allowedBlocks: ['attack', 'heal', 'condition'],
    requiredBlocks: ['condition', 'heal'],
    enemy: {
      id: 'goblin', name: 'Goblin', spriteId: 'enemy_goblin',
      stats: { maxHP: 78, currentHP: 78, attack: 10, defense: 3, speed: 7 },
      behaviors: ['attack', 'attack'],
    },
    unlockRequirements: { levelRequired: 3, previousLevelComplete: true },
    rewards: { experience: 120, gold: 30 },
  },

  // ── 5: NESTED IF ─────────────────────────────────────────────────────────
  {
    id: 'level_5', number: 5,
    name: 'Spider Den',
    description: 'เรียนรู้ Nested If — เงื่อนไขซ้อนกัน ตรวจหลายระดับ',
    difficultyEstimate: 2,
    concept: 'Nested Conditions (เงื่อนไขซ้อน)',
    tutorialText: 'HP<30→Dodge / HP<60→Heal / else→Attack — Nested If คือ Condition ที่อยู่ใน branch ของ Condition อื่น!',
    objectives: ['สังหาร Spider', 'ใช้ Dodge + Heal + Condition'],
    bonusObjective: 'HP เหลือมากกว่า 40%',
    allowedBlocks: ['attack', 'heal', 'dodge', 'condition'],
    requiredBlocks: ['condition', 'heal', 'dodge'],
    enemy: {
      id: 'spider', name: 'Spider', spriteId: 'enemy_spider',
      stats: { maxHP: 100, currentHP: 100, attack: 14, defense: 4, speed: 10, ailmentType: 'poison', ailmentChance: 0.25 },
      behaviors: ['attack', 'attack', 'attack'],
    },
    unlockRequirements: { levelRequired: 4, previousLevelComplete: true },
    rewards: { experience: 155, gold: 38 },
  },

  // ── 6: COUNTER-CONTROLLED LOOP ───────────────────────────────────────────
  {
    id: 'level_6', number: 6,
    name: 'Kobold Pack',
    description: 'เรียนรู้ Counter — Turn ≥ N? สอนการนับรอบเหมือน for-loop counter',
    difficultyEstimate: 2,
    concept: 'Counter-Controlled Loop (ตัวนับรอบ)',
    tutorialText: 'Turn ≥ 4? → Power Strike / else → Attack — Turn ≥ N เหมือน for-loop counter: "เมื่อนับถึง N รอบ ทำสิ่งพิเศษ"',
    objectives: ['สังหาร Kobold Pack', 'ใช้ Turn ≥ N? Condition'],
    bonusObjective: 'HP เหลือมากกว่า 50%',
    allowedBlocks: ['attack', 'heal', 'power_strike', 'condition'],
    requiredBlocks: ['condition', 'power_strike'],
    enemy: {
      id: 'kobold', name: 'Kobold Pack', spriteId: 'enemy_kobold',
      stats: { maxHP: 115, currentHP: 115, attack: 11, defense: 4, speed: 9 },
      behaviors: ['attack', 'attack', 'attack'],
    },
    unlockRequirements: { levelRequired: 5, previousLevelComplete: true },
    rewards: { experience: 195, gold: 45 },
  },

  // ── 7: RESOURCE MANAGEMENT (MANA) ────────────────────────────────────────
  {
    id: 'level_7', number: 7,
    name: 'Forest Wraith',
    description: 'เรียนรู้ Resource Condition — ตรวจ HP ก่อนใช้ Spell',
    difficultyEstimate: 3,
    concept: 'Resource Condition (ตรวจทรัพยากร)',
    tutorialText: 'HP > 50? → Cast Spell / else → Attack — ตรวจสถานะก่อนใช้ท่าแรง เหมือน "ถ้ามีพลังพอ ใช้ท่าหนัก ไม่งั้น โจมตีธรรมดา"',
    objectives: ['สังหาร Forest Wraith', 'ใช้ Cast Spell + HP Condition'],
    bonusObjective: 'HP เหลือมากกว่า 45%',
    allowedBlocks: ['attack', 'heal', 'cast_spell', 'condition'],
    requiredBlocks: ['cast_spell', 'condition'],
    enemy: {
      id: 'ghost', name: 'Forest Wraith', spriteId: 'enemy_ghost',
      stats: { maxHP: 120, currentHP: 120, attack: 13, defense: 5, speed: 11, ailmentType: 'freeze', ailmentChance: 0.25 },
      behaviors: ['attack', 'attack', 'attack'],
    },
    unlockRequirements: { levelRequired: 6, previousLevelComplete: true },
    rewards: { experience: 245, gold: 55 },
  },

  // ── 8: SKILL SELECTION (ARMOR) ───────────────────────────────────────────
  {
    id: 'level_8', number: 8,
    name: 'Goblin Knight',
    description: 'เรียนรู้ Skill Selection — เลือก action ที่เหมาะสมกับสถานการณ์',
    difficultyEstimate: 3,
    concept: 'Skill Selection (เลือก action ตามสถานการณ์)',
    tutorialText: 'Goblin Knight มีเกราะหนา (Armor 6) — Power Strike (2x dmg) และ Spell (ทะลุเกราะ) ดีกว่า Attack ธรรมดามาก! ใช้ Condition เลือก action ที่เหมาะสม',
    objectives: ['สังหาร Goblin Knight', 'ใช้ Power Strike หรือ Cast Spell'],
    bonusObjective: 'HP เหลือมากกว่า 40%',
    allowedBlocks: ['attack', 'heal', 'dodge', 'cast_spell', 'power_strike', 'condition'],
    requiredBlocks: ['condition', 'power_strike'],
    enemy: {
      id: 'goblin_knight', name: 'Goblin Knight', spriteId: 'enemy_goblin',
      stats: { maxHP: 140, currentHP: 140, attack: 16, defense: 6, speed: 6, armor: 6, parry: 15, enrageThreshold: 30 },
      behaviors: ['attack', 'attack', 'heal'],
    },
    unlockRequirements: { levelRequired: 7, previousLevelComplete: true },
    rewards: { experience: 305, gold: 65 },
  },

  // ── 9: STATE CONDITION (AILMENT) ──────────────────────────────────────────
  {
    id: 'level_9', number: 9,
    name: 'Orc Warrior',
    description: 'เรียนรู้ State Condition — ตรวจ "สถานะ" ตัวเอง เหมือน flag ใน programming',
    difficultyEstimate: 3,
    concept: 'State Condition (ตรวจสถานะ)',
    tutorialText: 'Orc Warrior ทำให้ Poisoned! Hero Poisoned? → Heal / else → Attack — ตรวจ "สถานะ" เหมือน boolean flag: if (isPoisoned) heal();',
    objectives: ['สังหาร Orc Warrior', 'ใช้ Hero Poisoned? Condition'],
    bonusObjective: 'HP เหลือมากกว่า 35%',
    allowedBlocks: ['attack', 'heal', 'cast_spell', 'power_strike', 'condition'],
    requiredBlocks: ['condition', 'heal'],
    enemy: {
      id: 'orc', name: 'Orc Warrior', spriteId: 'enemy_orc',
      stats: { maxHP: 155, currentHP: 155, attack: 17, defense: 7, speed: 5, ailmentType: 'poison', ailmentChance: 0.40 },
      behaviors: ['attack', 'attack'],
    },
    unlockRequirements: { levelRequired: 8, previousLevelComplete: true },
    rewards: { experience: 375, gold: 78 },
  },

  // ── 10: HP THRESHOLD + ENRAGE ─────────────────────────────────────────────
  {
    id: 'level_10', number: 10,
    name: 'Stone Troll',
    description: 'เรียนรู้ HP Threshold — ตัดสินใจที่จุดวิกฤต เมื่อศัตรู Enrage',
    difficultyEstimate: 3,
    concept: 'HP Threshold Decision (ตัดสินใจที่ HP วิกฤต)',
    tutorialText: 'Stone Troll Enrage เมื่อ HP ต่ำ — ใช้ HP Condition ของตัวเอง: HP<40→Dodge (หลบความโกรธ) / HP<65→Heal / else→Attack',
    objectives: ['สังหาร Stone Troll', 'ใช้ Dodge + Heal ตาม HP Condition'],
    bonusObjective: 'HP เหลือมากกว่า 30%',
    allowedBlocks: ['attack', 'heal', 'dodge', 'cast_spell', 'power_strike', 'condition'],
    requiredBlocks: ['condition', 'heal', 'dodge'],
    enemy: {
      id: 'troll', name: 'Stone Troll', spriteId: 'enemy_troll',
      stats: { maxHP: 182, currentHP: 182, attack: 20, defense: 9, speed: 4, armor: 7, parry: 15, enrageThreshold: 35 },
      behaviors: ['attack', 'heal', 'attack'],
    },
    unlockRequirements: { levelRequired: 9, previousLevelComplete: true },
    rewards: { experience: 455, gold: 88 },
  },

  // ── 11: COMPLEX DECISION TREE ─────────────────────────────────────────────
  {
    id: 'level_11', number: 11,
    name: 'Orc Warlord',
    description: 'เรียนรู้ Decision Tree — ผสม conditions หลายระดับในต้นไม้การตัดสินใจ',
    difficultyEstimate: 4,
    concept: 'Complex Decision Tree (ต้นไม้การตัดสินใจ)',
    tutorialText: 'ผสม HP + สถานะ + หลาย Condition — Decision Tree คือ Flowchart ที่มี branch ซ้อนกันหลายชั้น เหมือน if-elif-elif-else ใน code!',
    objectives: ['สังหาร Orc Warlord', 'ใช้ Condition อย่างน้อย 3 แบบต่างกัน'],
    bonusObjective: 'HP เหลือมากกว่า 25%',
    allowedBlocks: ['attack', 'heal', 'dodge', 'cast_spell', 'power_strike', 'condition'],
    requiredBlocks: ['power_strike', 'cast_spell', 'condition', 'heal'],
    enemy: {
      id: 'orc_warlord', name: 'Orc Warlord', spriteId: 'enemy_orc',
      stats: { maxHP: 218, currentHP: 218, attack: 23, defense: 11, speed: 7, armor: 9, parry: 20, enrageThreshold: 30, ailmentType: 'burn', ailmentChance: 0.30 },
      behaviors: ['attack', 'attack', 'cast_spell'],
    },
    unlockRequirements: { levelRequired: 10, previousLevelComplete: true },
    rewards: { experience: 555, gold: 105 },
  },

  // ── 12: COUNTER + RESOURCE COMBINED ──────────────────────────────────────
  {
    id: 'level_12', number: 12,
    name: 'Ice Giant',
    description: 'ผสม Counter Loop กับ HP Condition — Turn ≥ N AND HP > X',
    difficultyEstimate: 4,
    concept: 'Counter + Resource (ผสม Counter กับ Condition)',
    tutorialText: 'Turn ≥ 5 → ตรวจ HP > 50? → Power Strike / else → Spell — ผสม counter กับ condition: "เมื่อครบ N รอบ ถ้า HP พอ ใช้ท่าแรง" = AND condition!',
    objectives: ['สังหาร Ice Giant', 'ใช้ Turn ≥ N? ร่วมกับ HP Condition'],
    bonusObjective: 'HP เหลือมากกว่า 20%',
    allowedBlocks: ['attack', 'heal', 'dodge', 'cast_spell', 'power_strike', 'condition'],
    requiredBlocks: ['cast_spell', 'power_strike', 'condition'],
    enemy: {
      id: 'ice_giant', name: 'Ice Giant', spriteId: 'enemy_ice_giant',
      stats: { maxHP: 252, currentHP: 252, attack: 26, defense: 14, speed: 6, armor: 11, ailmentType: 'freeze', ailmentChance: 0.35 },
      behaviors: ['attack', 'attack', 'cast_spell'],
    },
    unlockRequirements: { levelRequired: 11, previousLevelComplete: true },
    rewards: { experience: 685, gold: 125 },
  },

  // ── 13: FULL ALGORITHM DESIGN ─────────────────────────────────────────────
  {
    id: 'level_13', number: 13,
    name: "Dragon's Lair",
    description: 'ออกแบบ Algorithm ที่ครบถ้วน — ผสมทุก concept ที่เรียนมา',
    difficultyEstimate: 5,
    concept: 'Full Algorithm Design (ออกแบบ Algorithm)',
    tutorialText: 'Dragon ใช้หลากหลายท่า — ต้องออกแบบ Flowchart ที่ครอบคลุมทุกสถานการณ์: HP, สถานะ, Turn counter ทั้งหมดใน Flowchart เดียว!',
    objectives: ['สังหาร Young Dragon', 'ใช้ Heal + Dodge + Spell + Power Strike'],
    bonusObjective: 'HP เหลือมากกว่า 20%',
    allowedBlocks: ['attack', 'heal', 'dodge', 'cast_spell', 'power_strike', 'condition'],
    requiredBlocks: ['cast_spell', 'power_strike', 'condition', 'heal', 'dodge'],
    enemy: {
      id: 'dragon', name: 'Young Dragon', spriteId: 'enemy_dragon',
      stats: { maxHP: 295, currentHP: 295, attack: 29, defense: 15, speed: 10, enrageThreshold: 35, ailmentType: 'burn', ailmentChance: 0.40 },
      behaviors: ['attack', 'cast_spell', 'attack', 'attack'],
    },
    unlockRequirements: { levelRequired: 12, previousLevelComplete: true },
    rewards: { experience: 855, gold: 155 },
  },

  // ── 14: ALGORITHM OPTIMIZATION ───────────────────────────────────────────
  {
    id: 'level_14', number: 14,
    name: 'The Lich Lord',
    description: 'Optimize Flowchart — ทำให้ถูกต้องและมีประสิทธิภาพในทุกกรณี',
    difficultyEstimate: 5,
    concept: 'Algorithm Optimization (ปรับ Algorithm ให้ดีที่สุด)',
    tutorialText: 'Lich Lord มีทุกอย่าง — ต้องทำ Flowchart ที่ตอบสนองทุกสถานการณ์ทันที: HP วิกฤต, ติด Poison และ Enrage พร้อมกัน!',
    objectives: ['สังหาร Lich Lord'],
    bonusObjective: 'HP เหลือมากกว่า 15%',
    allowedBlocks: ['attack', 'heal', 'dodge', 'cast_spell', 'power_strike', 'condition'],
    requiredBlocks: ['cast_spell', 'power_strike', 'condition', 'heal'],
    enemy: {
      id: 'lich', name: 'Lich Lord', spriteId: 'enemy_lich',
      stats: { maxHP: 362, currentHP: 362, attack: 34, defense: 17, speed: 11, armor: 8, parry: 25, enrageThreshold: 40, ailmentType: 'poison', ailmentChance: 0.40 },
      behaviors: ['cast_spell', 'attack', 'cast_spell', 'attack', 'heal'],
    },
    unlockRequirements: { levelRequired: 13, previousLevelComplete: true },
    rewards: { experience: 1055, gold: 185 },
  },

  // ── 15: MASTER FLOWCHART ──────────────────────────────────────────────────
  {
    id: 'level_15', number: 15,
    name: 'The Dark Overlord',
    description: 'Final Boss — ใช้ทุก concept: Sequence, Loop, If/Else, Counter, Resource ในครั้งเดียว',
    difficultyEstimate: 5,
    concept: 'Master Flowchart (รวมทุก concept)',
    tutorialText: 'Dark Overlord ใช้ทุกทักษะ — แสดงให้เห็นว่าคุณเข้าใจ Flowchart ครบทุก concept: Sequence → Loop → If/Else → Nested → Counter → Resource!',
    objectives: ['สังหาร Dark Overlord', 'ใช้ Flowchart ที่ครบทุก concept'],
    bonusObjective: 'HP เหลือมากกว่า 20%',
    allowedBlocks: ['attack', 'heal', 'dodge', 'cast_spell', 'power_strike', 'condition'],
    requiredBlocks: ['cast_spell', 'power_strike', 'condition', 'heal', 'dodge'],
    enemy: {
      id: 'overlord', name: 'Dark Overlord', spriteId: 'enemy_boss',
      stats: { maxHP: 475, currentHP: 475, attack: 41, defense: 23, speed: 14, armor: 17, parry: 33, enrageThreshold: 40, ailmentType: 'burn', ailmentChance: 0.45 },
      behaviors: ['attack', 'cast_spell', 'heal', 'cast_spell', 'attack', 'attack'],
    },
    unlockRequirements: { levelRequired: 14, previousLevelComplete: true },
    rewards: { experience: 1500, gold: 255 },
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
