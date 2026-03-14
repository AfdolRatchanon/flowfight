import type { Character, CharacterClass } from '../types/game.types';

// Total XP required to reach each level (index = level number)
export const LEVEL_XP_TABLE = [
  0,        // ไม่ได้ใช้งาน (index 0)
  0,        // เลเวล 1 - เลเวลเริ่มต้น
  100,      // เลเวล 2
  250,      // เลเวล 3
  450,      // เลเวล 4
  700,      // เลเวล 5
  1000,     // เลเวล 6
  1400,     // เลเวล 7
  1900,     // เลเวล 8
  2500,     // เลเวล 9
  3200,     // เลเวล 10
  4000,     // เลเวล 11
  4900,     // เลเวล 12
  5900,     // เลเวล 13
  7000,     // เลเวล 14
  8200,     // เลเวล 15
  9500,     // เลเวล 16
  10900,    // เลเวล 17
  12400,    // เลเวล 18
  14000,    // เลเวล 19
  15700,    // เลเวล 20
  17500,    // เลเวล 21
  19400,    // เลเวล 22
  21400,    // เลเวล 23
  23500,    // เลเวล 24
  25700,    // เลเวล 25
  28000,    // เลเวล 26
  30400,    // เลเวล 27
  32900,    // เลเวล 28
  35500,    // เลเวล 29
  38200,    // เลเวล 30
  41000,    // เลเวล 31
  43900,    // เลเวล 32
  46900,    // เลเวล 33
  50000,    // เลเวล 34
  53200,    // เลเวล 35
  56500,    // เลเวล 36
  59900,    // เลเวล 37
  63400,    // เลเวล 38
  67000,    // เลเวล 39
  70700,    // เลเวล 40
  74500,    // เลเวล 41
  78400,    // เลเวล 42
  82400,    // เลเวล 43
  86500,    // เลเวล 44
  90700,    // เลเวล 45
  95000,    // เลเวล 46
  99400,    // เลเวล 47
  103900,   // เลเวล 48
  108500,   // เลเวล 49
  113200,   // เลเวล 50
  118000,   // เลเวล 51
  122900,   // เลเวล 52
  127900,   // เลเวล 53
  133000,   // เลเวล 54
  138200,   // เลเวล 55
  143500,   // เลเวล 56
  148900,   // เลเวล 57
  154400,   // เลเวล 58
  160000,   // เลเวล 59
  165700,   // เลเวล 60
  171500,   // เลเวล 61
  177400,   // เลเวล 62
  183400,   // เลเวล 63
  189500,   // เลเวล 64
  195700,   // เลเวล 65
  202000,   // เลเวล 66
  208400,   // เลเวล 67
  214900,   // เลเวล 68
  221500,   // เลเวล 69
  228200,   // เลเวล 70
  235000,   // เลเวล 71
  241900,   // เลเวล 72
  248900,   // เลเวล 73
  256000,   // เลเวล 74
  263200,   // เลเวล 75
  270500,   // เลเวล 76
  277900,   // เลเวล 77
  285400,   // เลเวล 78
  293000,   // เลเวล 79
  300700,   // เลเวล 80
  308500,   // เลเวล 81
  316400,   // เลเวล 82
  324400,   // เลเวล 83
  332500,   // เลเวล 84
  340700,   // เลเวล 85
  349000,   // เลเวล 86
  357400,   // เลเวล 87
  365900,   // เลเวล 88
  374500,   // เลเวล 89
  383200,   // เลเวล 90
  392000,   // เลเวล 91
  400900,   // เลเวล 92
  409900,   // เลเวล 93
  419000,   // เลเวล 94
  428200,   // เลเวล 95
  437500,   // เลเวล 96
  446900,   // เลเวล 97
  456400,   // เลเวล 98
  466000,   // เลเวล 99
  475700,   // เลเวล 100 (ระดับสูงสุด)
];

export const MAX_LEVEL = 100;

/**
 * Stat gains per level — each class grows differently to reinforce its role.
 *
 * Knight    (TANK)        : +HP +DEF per level  — ทนดาเมจสูง
 * Mage      (GLASS CANNON): +ATK per level       — ดาเมจสูงแต่บอบบาง
 * Rogue     (SPEEDSTER)   : +SPD +ATK per level  — เร็วและคล่องแคล่ว
 * Barbarian (BERSERKER)   : +HP +ATK per level   — พละกำลังดิบล้วน
 */
export const CLASS_STAT_GAIN: Record<CharacterClass, { maxHP: number; attack: number; defense: number; speed: number }> = {
  knight: { maxHP: 15, attack: 1, defense: 2, speed: 0 },
  mage: { maxHP: 8, attack: 3, defense: 0, speed: 1 },
  rogue: { maxHP: 8, attack: 2, defense: 0, speed: 2 },
  barbarian: { maxHP: 18, attack: 2, defense: 1, speed: 0 },
};

export interface GainXPResult {
  newCharacter: Character;
  leveledUp: boolean;
  oldLevel: number;
  newLevel: number;
}

export function gainXP(character: Character, xpGain: number): GainXPResult {
  const newXP = character.experience + xpGain;
  let newLevel = character.level;

  // Level up as many times as earned
  while (newLevel < MAX_LEVEL && newXP >= LEVEL_XP_TABLE[newLevel + 1]) {
    newLevel++;
  }

  const leveledUp = newLevel > character.level;
  const levelsGained = newLevel - character.level;
  const gain = CLASS_STAT_GAIN[character.class];

  const newStats = leveledUp
    ? {
      maxHP: character.stats.maxHP + levelsGained * gain.maxHP,
      currentHP: character.stats.maxHP + levelsGained * gain.maxHP, // full heal on level up
      attack: character.stats.attack + levelsGained * gain.attack,
      defense: character.stats.defense + levelsGained * gain.defense,
      speed: character.stats.speed + levelsGained * gain.speed,
    }
    : character.stats;

  return {
    newCharacter: { ...character, level: newLevel, experience: newXP, stats: newStats, lastModified: Date.now() },
    leveledUp,
    oldLevel: character.level,
    newLevel,
  };
}

/** XP bar progress 0–100% within the current level */
export function levelProgressPct(level: number, experience: number): number {
  if (level >= MAX_LEVEL) return 100;
  const lo = LEVEL_XP_TABLE[level];
  const hi = LEVEL_XP_TABLE[level + 1];
  return Math.min(100, Math.max(0, ((experience - lo) / (hi - lo)) * 100));
}

/** How much XP until next level */
export function xpToNextLevel(level: number, experience: number): number {
  if (level >= MAX_LEVEL) return 0;
  return LEVEL_XP_TABLE[level + 1] - experience;
}
