/**
 * Unit Tests — checkAchievements
 * ทดสอบ achievement unlock logic ทุก case
 */
import { describe, it, expect } from 'vitest';
import { checkAchievements, type AchievementCheckInput } from './achievements';
import type { Player } from '../types/game.types';

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: 'p1', username: 'Hero', email: '',
    levelsCompleted: [], levelClearCounts: {},
    achievements: [], gold: 0,
    stats: { totalKills: 0, totalDefeats: 0, levelReached: 1, totalPlayTime: 0 },
    lastActive: 0, createdAt: 0,
    ...overrides,
  } as Player;
}

function makeInput(overrides: Partial<AchievementCheckInput> = {}): AchievementCheckInput {
  return {
    levelId: 'level_1', won: true,
    turnCount: 5, heroHPPercent: 80, damageTaken: 20,
    player: makePlayer(),
    ...overrides,
  };
}

// ===== won = false =====

describe('won = false', () => {
  it('แพ้ → ไม่ unlock อะไรเลย', () => {
    const result = checkAchievements(makeInput({ won: false }));
    expect(result).toHaveLength(0);
  });
});

// ===== first_blood =====

describe('first_blood', () => {
  it('ชนะครั้งแรก → unlock', () => {
    const result = checkAchievements(makeInput());
    expect(result.some(a => a.id === 'first_blood')).toBe(true);
  });

  it('มีอยู่แล้ว → ไม่ unlock ซ้ำ', () => {
    const input = makeInput({ player: makePlayer({ achievements: ['first_blood'] }) });
    const result = checkAchievements(input);
    expect(result.some(a => a.id === 'first_blood')).toBe(false);
  });
});

// ===== speed_demon =====

describe('speed_demon', () => {
  it('ชนะภายใน 3 turn → unlock', () => {
    const result = checkAchievements(makeInput({ turnCount: 3 }));
    expect(result.some(a => a.id === 'speed_demon')).toBe(true);
  });

  it('ชนะ 1 turn → unlock', () => {
    const result = checkAchievements(makeInput({ turnCount: 1 }));
    expect(result.some(a => a.id === 'speed_demon')).toBe(true);
  });

  it('ชนะ 4 turn → ไม่ unlock', () => {
    const result = checkAchievements(makeInput({ turnCount: 4 }));
    expect(result.some(a => a.id === 'speed_demon')).toBe(false);
  });

  it('Endless mode ไม่นับ แม้ 1 turn', () => {
    const result = checkAchievements(makeInput({ levelId: 'level_endless', turnCount: 1 }));
    expect(result.some(a => a.id === 'speed_demon')).toBe(false);
  });
});

// ===== iron_will =====

describe('iron_will', () => {
  it('HP เหลือ 9% → unlock', () => {
    const result = checkAchievements(makeInput({ heroHPPercent: 9 }));
    expect(result.some(a => a.id === 'iron_will')).toBe(true);
  });

  it('HP เหลือ 1% → unlock', () => {
    const result = checkAchievements(makeInput({ heroHPPercent: 1 }));
    expect(result.some(a => a.id === 'iron_will')).toBe(true);
  });

  it('HP เหลือ 10% → ไม่ unlock (boundary)', () => {
    const result = checkAchievements(makeInput({ heroHPPercent: 10 }));
    expect(result.some(a => a.id === 'iron_will')).toBe(false);
  });

  it('HP เหลือ 0% (ตาย) → ไม่ unlock', () => {
    const result = checkAchievements(makeInput({ heroHPPercent: 0 }));
    expect(result.some(a => a.id === 'iron_will')).toBe(false);
  });
});

// ===== untouchable =====

describe('untouchable', () => {
  it('ไม่รับ damage เลย → unlock', () => {
    const result = checkAchievements(makeInput({ damageTaken: 0 }));
    expect(result.some(a => a.id === 'untouchable')).toBe(true);
  });

  it('รับ damage 1 → ไม่ unlock', () => {
    const result = checkAchievements(makeInput({ damageTaken: 1 }));
    expect(result.some(a => a.id === 'untouchable')).toBe(false);
  });
});

// ===== loop_master =====

describe('loop_master', () => {
  it('ผ่านด่าน level_11 → unlock', () => {
    const result = checkAchievements(makeInput({ levelId: 'level_11' }));
    expect(result.some(a => a.id === 'loop_master')).toBe(true);
  });

  it('ผ่านด่านอื่น → ไม่ unlock', () => {
    const result = checkAchievements(makeInput({ levelId: 'level_1' }));
    expect(result.some(a => a.id === 'loop_master')).toBe(false);
  });
});

// ===== campaign_complete =====

describe('campaign_complete', () => {
  it('ผ่านครบ 20 ด่าน → unlock', () => {
    const levels = Array.from({ length: 19 }, (_, i) => `level_${i + 1}`);
    const input = makeInput({
      levelId: 'level_20',
      player: makePlayer({ levelsCompleted: levels }),
    });
    const result = checkAchievements(input);
    expect(result.some(a => a.id === 'campaign_complete')).toBe(true);
  });

  it('ผ่าน 19 ด่าน → ไม่ unlock', () => {
    const levels = Array.from({ length: 18 }, (_, i) => `level_${i + 1}`);
    const input = makeInput({
      levelId: 'level_19',
      player: makePlayer({ levelsCompleted: levels }),
    });
    const result = checkAchievements(input);
    expect(result.some(a => a.id === 'campaign_complete')).toBe(false);
  });
});

// ===== endless_wave_10 =====

describe('endless_wave_10', () => {
  it('Endless wave 10 → unlock', () => {
    const result = checkAchievements(makeInput({ levelId: 'level_endless', wave: 10 }));
    expect(result.some(a => a.id === 'endless_wave_10')).toBe(true);
  });

  it('Endless wave 15 → unlock', () => {
    const result = checkAchievements(makeInput({ levelId: 'level_endless', wave: 15 }));
    expect(result.some(a => a.id === 'endless_wave_10')).toBe(true);
  });

  it('Endless wave 9 → ไม่ unlock', () => {
    const result = checkAchievements(makeInput({ levelId: 'level_endless', wave: 9 }));
    expect(result.some(a => a.id === 'endless_wave_10')).toBe(false);
  });

  it('Campaign level wave 10 → ไม่ unlock', () => {
    const result = checkAchievements(makeInput({ levelId: 'level_1', wave: 10 }));
    expect(result.some(a => a.id === 'endless_wave_10')).toBe(false);
  });
});

// ===== class_skill_user =====

describe('class_skill_user', () => {
  it('ใช้ fireball → unlock', () => {
    const result = checkAchievements(makeInput({ actionsUsed: ['attack', 'fireball'] }));
    expect(result.some(a => a.id === 'class_skill_user')).toBe(true);
  });

  it('ใช้ backstab → unlock', () => {
    const result = checkAchievements(makeInput({ actionsUsed: ['backstab'] }));
    expect(result.some(a => a.id === 'class_skill_user')).toBe(true);
  });

  it('ใช้แต่ attack/heal → ไม่ unlock', () => {
    const result = checkAchievements(makeInput({ actionsUsed: ['attack', 'heal', 'dodge'] }));
    expect(result.some(a => a.id === 'class_skill_user')).toBe(false);
  });

  it('ไม่มี actionsUsed → ไม่ unlock', () => {
    const result = checkAchievements(makeInput({ actionsUsed: [] }));
    expect(result.some(a => a.id === 'class_skill_user')).toBe(false);
  });
});

// ===== duplicate prevention =====

describe('ป้องกัน unlock ซ้ำ', () => {
  it('มี achievement ทั้งหมดอยู่แล้ว → คืน array ว่าง', () => {
    const allIds = ['first_blood', 'speed_demon', 'iron_will', 'untouchable',
      'loop_master', 'campaign_complete', 'endless_wave_10', 'class_skill_user'];
    const levels19 = Array.from({ length: 19 }, (_, i) => `level_${i + 1}`);
    const input = makeInput({
      levelId: 'level_endless', turnCount: 1,
      heroHPPercent: 5, damageTaken: 0,
      wave: 10, actionsUsed: ['fireball'],
      player: makePlayer({ achievements: allIds, levelsCompleted: levels19 }),
    });
    const result = checkAchievements(input);
    expect(result).toHaveLength(0);
  });
});
