/**
 * Unit Tests — levelSystem
 * gainXP, levelProgressPct, xpToNextLevel
 */
import { describe, it, expect } from 'vitest';
import { gainXP, levelProgressPct, xpToNextLevel, MAX_LEVEL, LEVEL_XP_TABLE } from './levelSystem';
import type { Character } from '../types/game.types';

function makeChar(overrides: Partial<Character> = {}): Character {
  return {
    id: 'test', playerId: 'p1', name: 'Hero', class: 'knight',
    level: 1, experience: 0,
    stats: { maxHP: 100, currentHP: 100, attack: 20, defense: 5, speed: 10 },
    equippedItems: {},
    lastModified: 0,
    ...overrides,
  };
}

// ===== gainXP =====

describe('gainXP', () => {
  it('XP เพิ่มขึ้นถูกต้อง ไม่ level up', () => {
    const char = makeChar({ level: 1, experience: 0 });
    const { newCharacter, leveledUp } = gainXP(char, 50);
    expect(newCharacter.experience).toBe(50);
    expect(leveledUp).toBe(false);
    expect(newCharacter.level).toBe(1);
  });

  it('level up เมื่อ XP ถึง threshold', () => {
    const char = makeChar({ level: 1, experience: 0 });
    const xpNeeded = LEVEL_XP_TABLE[2]; // XP ที่ต้องใช้ level 2
    const { newCharacter, leveledUp, newLevel } = gainXP(char, xpNeeded);
    expect(leveledUp).toBe(true);
    expect(newLevel).toBe(2);
    expect(newCharacter.level).toBe(2);
  });

  it('level up ฟื้น HP เต็ม', () => {
    const char = makeChar({ level: 1, experience: 0, stats: { maxHP: 100, currentHP: 30, attack: 20, defense: 5, speed: 10 } });
    const xpNeeded = LEVEL_XP_TABLE[2];
    const { newCharacter } = gainXP(char, xpNeeded);
    // หลัง level up stats.currentHP ควรเท่ากับ maxHP ใหม่
    expect(newCharacter.stats.currentHP).toBe(newCharacter.stats.maxHP);
  });

  it('stats เพิ่มขึ้นตาม class gain เมื่อ level up', () => {
    const char = makeChar({ level: 1, experience: 0 });
    const xpNeeded = LEVEL_XP_TABLE[2];
    const { newCharacter } = gainXP(char, xpNeeded);
    // knight ได้ stat bonus ทุก level
    expect(newCharacter.stats.maxHP).toBeGreaterThan(100);
    expect(newCharacter.stats.attack).toBeGreaterThanOrEqual(20);
  });

  it('ไม่เกิน MAX_LEVEL', () => {
    const char = makeChar({ level: MAX_LEVEL, experience: LEVEL_XP_TABLE[MAX_LEVEL] ?? 99999 });
    const { newCharacter, leveledUp } = gainXP(char, 999999);
    expect(newCharacter.level).toBe(MAX_LEVEL);
    expect(leveledUp).toBe(false);
  });

  it('XP สะสมข้ามหลาย level ได้', () => {
    const char = makeChar({ level: 1, experience: 0 });
    // ให้ XP มากพอที่จะข้าม level หลายชั้น
    const bigXP = LEVEL_XP_TABLE[5] ?? 9999;
    const { newCharacter } = gainXP(char, bigXP);
    expect(newCharacter.level).toBeGreaterThanOrEqual(2);
  });
});

// ===== levelProgressPct =====

describe('levelProgressPct', () => {
  it('XP เป็น 0 ที่ level 1 = 0%', () => {
    expect(levelProgressPct(1, 0)).toBe(0);
  });

  it('XP เต็ม threshold = 100%', () => {
    const xpForLv2 = LEVEL_XP_TABLE[2];
    expect(levelProgressPct(1, xpForLv2)).toBe(100);
  });

  it('MAX_LEVEL คืน 100%', () => {
    expect(levelProgressPct(MAX_LEVEL, 0)).toBe(100);
  });

  it('อยู่ระหว่าง 0–100 เสมอ', () => {
    const pct = levelProgressPct(3, LEVEL_XP_TABLE[3] + 10);
    expect(pct).toBeGreaterThanOrEqual(0);
    expect(pct).toBeLessThanOrEqual(100);
  });
});

// ===== xpToNextLevel =====

describe('xpToNextLevel', () => {
  it('คืนค่า XP ที่ขาดอีก', () => {
    const xpForLv2 = LEVEL_XP_TABLE[2];
    const remaining = xpToNextLevel(1, 0);
    expect(remaining).toBe(xpForLv2);
  });

  it('XP เกือบถึง threshold', () => {
    const xpForLv2 = LEVEL_XP_TABLE[2];
    expect(xpToNextLevel(1, xpForLv2 - 1)).toBe(1);
  });

  it('MAX_LEVEL คืน 0', () => {
    expect(xpToNextLevel(MAX_LEVEL, 99999)).toBe(0);
  });
});
