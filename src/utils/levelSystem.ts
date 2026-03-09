import type { Character } from '../types/game.types';

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

// Stat gains per level up (per level)
const STAT_GAIN = { maxHP: 10, attack: 2, defense: 1, speed: 1 };

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

  const newStats = leveledUp
    ? {
        maxHP:     character.stats.maxHP     + levelsGained * STAT_GAIN.maxHP,
        currentHP: character.stats.maxHP     + levelsGained * STAT_GAIN.maxHP, // full heal on level up
        attack:    character.stats.attack    + levelsGained * STAT_GAIN.attack,
        defense:   character.stats.defense   + levelsGained * STAT_GAIN.defense,
        speed:     character.stats.speed     + levelsGained * STAT_GAIN.speed,
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
