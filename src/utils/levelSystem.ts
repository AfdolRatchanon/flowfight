import type { Character, CharacterClass } from '../types/game.types';

// Total XP required to reach each level (index = level number)
export const LEVEL_XP_TABLE = [
  0,     // unused (index 0)
  0,     // Lv 1 — starting level
  100,   // Lv 2
  250,   // Lv 3
  450,   // Lv 4
  700,   // Lv 5
  1000,  // Lv 6
  1400,  // Lv 7
  1900,  // Lv 8
  2500,  // Lv 9
  3200,  // Lv 10 (max)
];

export const MAX_LEVEL = 10;

/**
 * Stat gains per level — each class grows differently to reinforce its role.
 *
 * Knight    (TANK)        : +HP +DEF per level  — ทนดาเมจสูง
 * Mage      (GLASS CANNON): +ATK per level       — ดาเมจสูงแต่บอบบาง
 * Rogue     (SPEEDSTER)   : +SPD +ATK per level  — เร็วและคล่องแคล่ว
 * Barbarian (BERSERKER)   : +HP +ATK per level   — พละกำลังดิบล้วน
 */
export const CLASS_STAT_GAIN: Record<CharacterClass, { maxHP: number; attack: number; defense: number; speed: number }> = {
  knight:    { maxHP: 15, attack: 1, defense: 2, speed: 0 },
  mage:      { maxHP:  8, attack: 3, defense: 0, speed: 1 },
  rogue:     { maxHP:  8, attack: 2, defense: 0, speed: 2 },
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
        maxHP:     character.stats.maxHP     + levelsGained * gain.maxHP,
        currentHP: character.stats.maxHP     + levelsGained * gain.maxHP, // full heal on level up
        attack:    character.stats.attack    + levelsGained * gain.attack,
        defense:   character.stats.defense   + levelsGained * gain.defense,
        speed:     character.stats.speed     + levelsGained * gain.speed,
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
