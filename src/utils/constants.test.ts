/**
 * Unit Tests — Game Constants (LEVELS integrity)
 *
 * ตรวจสอบความสมบูรณ์ของ LEVELS array
 * - ครบ 30 ด่าน
 * - ทุกด่านมี required fields
 * - id/number ตรงกัน, ไม่ซ้ำ
 * - objectives ไม่ว่าง
 * - enemy มี required stats
 * - rewards มี experience
 */
import { describe, it, expect } from 'vitest';
import { LEVELS, ENDLESS_LEVEL } from './constants';

// ===== จำนวน Level =====

describe('LEVELS count', () => {
  it('ต้องมี 30 ด่าน', () => {
    expect(LEVELS).toHaveLength(30);
  });

  it('ทุก level มี id ที่ไม่ซ้ำ', () => {
    const ids = LEVELS.map((l) => l.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(LEVELS.length);
  });

  it('ทุก level มี number ที่ไม่ซ้ำ', () => {
    const numbers = LEVELS.map((l) => l.number);
    const unique = new Set(numbers);
    expect(unique.size).toBe(LEVELS.length);
  });
});

// ===== id / number ตรงกัน =====

describe('LEVELS id/number consistency', () => {
  it('id format ต้องเป็น level_N และตรงกับ number', () => {
    LEVELS.forEach((level) => {
      expect(level.id).toBe(`level_${level.number}`);
    });
  });

  it('number ต้องเรียง 1–30 ครบ', () => {
    const numbers = LEVELS.map((l) => l.number).sort((a, b) => a - b);
    const expected = Array.from({ length: 30 }, (_, i) => i + 1);
    expect(numbers).toEqual(expected);
  });
});

// ===== Required Fields =====

describe('LEVELS required fields', () => {
  it('ทุก level มี name ที่ไม่ว่าง', () => {
    LEVELS.forEach((level) => {
      expect(level.name).toBeTruthy();
      expect(typeof level.name).toBe('string');
    });
  });

  it('ทุก level มี description ที่ไม่ว่าง', () => {
    LEVELS.forEach((level) => {
      expect(level.description).toBeTruthy();
    });
  });

  it('ทุก level มี concept ที่ไม่ว่าง', () => {
    LEVELS.forEach((level) => {
      expect(level.concept).toBeTruthy();
    });
  });

  it('ทุก level มี tutorialText ที่ไม่ว่าง', () => {
    LEVELS.forEach((level) => {
      expect(level.tutorialText).toBeTruthy();
    });
  });

  it('ทุก level มี difficultyEstimate เป็น 1–5', () => {
    LEVELS.forEach((level) => {
      expect(level.difficultyEstimate).toBeGreaterThanOrEqual(1);
      expect(level.difficultyEstimate).toBeLessThanOrEqual(5);
    });
  });
});

// ===== Objectives =====

describe('LEVELS objectives', () => {
  it('ทุก level มี objectives ที่ไม่ว่าง', () => {
    LEVELS.forEach((level) => {
      expect(Array.isArray(level.objectives)).toBe(true);
      expect(level.objectives.length).toBeGreaterThan(0);
    });
  });

  it('ทุก objective เป็น string ที่ไม่ว่าง', () => {
    LEVELS.forEach((level) => {
      level.objectives.forEach((obj: string) => {
        expect(typeof obj).toBe('string');
        expect(obj.length).toBeGreaterThan(0);
      });
    });
  });
});

// ===== allowedBlocks =====

describe('LEVELS allowedBlocks', () => {
  it('ทุก level มี allowedBlocks array', () => {
    LEVELS.forEach((level) => {
      expect(Array.isArray(level.allowedBlocks)).toBe(true);
    });
  });

  it('level_1 อนุญาตเฉพาะ attack', () => {
    const lvl1 = LEVELS.find((l) => l.id === 'level_1')!;
    expect(lvl1.allowedBlocks).toEqual(['attack']);
  });

  it('ด่านหลัง level_3 เป็นต้นไปมี condition ให้ใช้', () => {
    const levelsWithCondition = LEVELS.filter((l) =>
      (l.allowedBlocks as string[]).includes('condition')
    );
    expect(levelsWithCondition.length).toBeGreaterThan(0);
    // ด่านสุดท้าย (level_30) ต้องมี condition
    const lvl30 = LEVELS.find((l) => l.id === 'level_30')!;
    expect((lvl30.allowedBlocks as string[]).includes('condition')).toBe(true);
  });
});

// ===== Enemy =====

describe('LEVELS enemy structure', () => {
  it('ทุก level มี enemy object', () => {
    LEVELS.forEach((level) => {
      expect(level.enemy).toBeDefined();
      expect(typeof level.enemy).toBe('object');
    });
  });

  it('ทุก enemy มี id และ name', () => {
    LEVELS.forEach((level) => {
      expect(level.enemy.id).toBeTruthy();
      expect(level.enemy.name).toBeTruthy();
    });
  });

  it('ทุก enemy มี stats.maxHP > 0', () => {
    LEVELS.forEach((level) => {
      expect(level.enemy.stats.maxHP).toBeGreaterThan(0);
    });
  });

  it('ทุก enemy มี stats.attack >= 0', () => {
    LEVELS.forEach((level) => {
      expect(level.enemy.stats.attack).toBeGreaterThanOrEqual(0);
    });
  });

  it('ทุก enemy มี behaviors array ที่ไม่ว่าง', () => {
    LEVELS.forEach((level) => {
      expect(Array.isArray(level.enemy.behaviors)).toBe(true);
      expect(level.enemy.behaviors.length).toBeGreaterThan(0);
    });
  });

  it('enemy ด่านสุดท้าย (level_30) แข็งแกร่งที่สุด — HP สูงสุด', () => {
    const hps = LEVELS.map((l) => l.enemy.stats.maxHP);
    const maxHP = Math.max(...hps);
    const lvl30 = LEVELS.find((l) => l.id === 'level_30')!;
    expect(lvl30.enemy.stats.maxHP).toBe(maxHP);
  });
});

// ===== Rewards =====

describe('LEVELS rewards', () => {
  it('ทุก level มี rewards.experience > 0', () => {
    LEVELS.forEach((level) => {
      expect(level.rewards.experience).toBeGreaterThan(0);
    });
  });

  it('ทุก level มี rewards.gold >= 0', () => {
    LEVELS.forEach((level) => {
      expect(level.rewards.gold).toBeGreaterThanOrEqual(0);
    });
  });

  it('ด่านยากกว่าให้ XP มากกว่า (level_30 > level_1)', () => {
    const lvl1 = LEVELS.find((l) => l.id === 'level_1')!;
    const lvl30 = LEVELS.find((l) => l.id === 'level_30')!;
    expect(lvl30.rewards.experience).toBeGreaterThan(lvl1.rewards.experience);
  });
});

// ===== unlockRequirements =====

describe('LEVELS unlockRequirements', () => {
  it('ทุก level มี unlockRequirements', () => {
    LEVELS.forEach((level) => {
      expect(level.unlockRequirements).toBeDefined();
    });
  });

  it('level_1 ไม่ต้องการ prerequisite', () => {
    const lvl1 = LEVELS.find((l) => l.id === 'level_1')!;
    expect(lvl1.unlockRequirements.levelRequired).toBe(0);
    expect(lvl1.unlockRequirements.previousLevelComplete).toBe(false);
  });

  it('level 2–30 ต้องการ previousLevelComplete = true', () => {
    LEVELS.filter((l) => l.number >= 2).forEach((level) => {
      expect(level.unlockRequirements.previousLevelComplete).toBe(true);
    });
  });

  it('level N ต้องการ levelRequired = N-1', () => {
    LEVELS.filter((l) => l.number >= 2).forEach((level) => {
      expect(level.unlockRequirements.levelRequired).toBe(level.number - 1);
    });
  });
});

// ===== ENDLESS_LEVEL =====

describe('ENDLESS_LEVEL', () => {
  it('มี id = level_endless', () => {
    expect(ENDLESS_LEVEL.id).toBe('level_endless');
  });

  it('มี isEndless = true', () => {
    expect(ENDLESS_LEVEL.isEndless).toBe(true);
  });

  it('objectives ไม่ว่าง', () => {
    expect(ENDLESS_LEVEL.objectives.length).toBeGreaterThan(0);
  });

  it('ไม่อยู่ใน LEVELS array (แยกออกมา)', () => {
    const found = LEVELS.find((l) => l.id === 'level_endless');
    expect(found).toBeUndefined();
  });
});
