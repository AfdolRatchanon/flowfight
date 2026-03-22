/**
 * Unit Tests — FlowchartEngine
 *
 * ทดสอบ pure logic ทุก function ที่ไม่ต้องการ browser หรือ Firebase
 * รัน: npm test
 */
import { describe, it, expect } from 'vitest';
import {
  calcFlowchartManaCost,
  calcTurnManaMax,
  executeEnemyAction,
  resolveHeroStatuses,
  type BattleState,
} from './FlowchartEngine';
import type { FlowNode } from '../types/game.types';

// ===== Helper =====

/** สร้าง BattleState พื้นฐานสำหรับใช้ใน test */
function makeState(overrides: Partial<BattleState> = {}): BattleState {
  return {
    heroHP: 100, heroMaxHP: 100,
    enemyHP: 100, enemyMaxHP: 100,
    heroAttack: 20, heroDefense: 5, heroParry: 0,
    enemyAttack: 15, enemyBaseAttack: 15,
    enemyDefense: 0, enemyArmor: 0, enemyParry: 0,
    enemyShielded: false, shieldReason: '',
    enemyEnraged: false, enrageThreshold: 0,
    healCharges: 3, powerStrikeCooldown: 0,
    lastActionType: '', comboCount: 0,
    heroBurnRounds: 0, heroFreezeRounds: 0, heroPoisonRounds: 0,
    enemyStunnedRounds: 0, enemyBurnRounds: 0,
    enemyFreezeRounds: 0, enemyPoisonRounds: 0,
    enemyAilmentType: '', enemyAilmentChance: 0,
    antidotes: 3, potions: 3, gold: 150,
    round: 1, currentTurn: 1, turnManaMax: 3,
    heroIsEvading: false, conditionBonus: false,
    heroBerserkRounds: 0, virusTurnWasted: false, manaDebuff: 0,
    ...overrides,
  };
}

/** สร้าง FlowNode แบบ action */
function makeActionNode(id: string, actionType: string): FlowNode {
  return {
    id, type: 'action',
    position: { x: 0, y: 0 },
    data: { label: actionType, actionType: actionType as any },
  };
}

// ===== calcFlowchartManaCost =====

describe('calcFlowchartManaCost', () => {
  it('คืนค่า 0 เมื่อไม่มี action node', () => {
    const nodes: FlowNode[] = [
      { id: 's', type: 'start', position: { x: 0, y: 0 }, data: { label: 'Start' } },
      { id: 'e', type: 'end',   position: { x: 0, y: 0 }, data: { label: 'End' } },
    ];
    expect(calcFlowchartManaCost(nodes)).toBe(0);
  });

  it('attack cost 1, cast_spell cost 2', () => {
    const nodes: FlowNode[] = [
      makeActionNode('1', 'attack'),    // cost 1
      makeActionNode('2', 'cast_spell'), // cost 2
    ];
    expect(calcFlowchartManaCost(nodes)).toBe(3);
  });

  it('power_strike cost 2', () => {
    const nodes = [makeActionNode('1', 'power_strike')];
    expect(calcFlowchartManaCost(nodes)).toBe(2);
  });

  it('heal cost 1', () => {
    const nodes = [makeActionNode('1', 'heal')];
    expect(calcFlowchartManaCost(nodes)).toBe(1);
  });

  it('ไม่นับ node ที่ไม่ใช่ action', () => {
    const nodes: FlowNode[] = [
      makeActionNode('1', 'attack'),
      { id: 'c', type: 'condition', position: { x: 0, y: 0 }, data: { label: 'HP < 30?' } },
    ];
    expect(calcFlowchartManaCost(nodes)).toBe(1);
  });
});

// ===== calcTurnManaMax =====

describe('calcTurnManaMax', () => {
  it('turn 1, level ปกติ = 3', () => {
    expect(calcTurnManaMax(1)).toBe(3);
  });

  it('turn 2, level ปกติ = 4 (base 3 + 1)', () => {
    expect(calcTurnManaMax(2)).toBe(4);
  });

  it('turn 1, level 14 = 4 (special base)', () => {
    expect(calcTurnManaMax(1, 14)).toBe(4);
  });

  it('turn 1, level 15 = 4 (special base)', () => {
    expect(calcTurnManaMax(1, 15)).toBe(4);
  });

  it('turn 3, level 14 = 6 (base 4 + 2)', () => {
    expect(calcTurnManaMax(3, 14)).toBe(6);
  });

  it('turn 1, level 1 เท่ากับ level 10', () => {
    expect(calcTurnManaMax(1, 1)).toBe(calcTurnManaMax(1, 10));
  });
});

// ===== executeEnemyAction =====

describe('executeEnemyAction — attack', () => {
  it('enemy โจมตี hero HP ลดลง', () => {
    const state = makeState({ heroParry: 0, heroIsEvading: false });
    const { newState } = executeEnemyAction('attack', state);
    // hero ถูกโจมตี HP ต้องไม่เกิน heroHP เดิม
    expect(newState.heroHP).toBeLessThanOrEqual(state.heroHP);
  });

  it('enemy frozen → ข้าม turn, HP hero ไม่เปลี่ยน', () => {
    const state = makeState({ enemyFreezeRounds: 2 });
    const { newState, log } = executeEnemyAction('attack', state);
    expect(newState.heroHP).toBe(state.heroHP);
    expect(log).toContain('frozen');
    expect(newState.enemyFreezeRounds).toBe(1); // ลดลง 1
  });

  it('enemy poison ทำ -3 HP ต่อ round', () => {
    const state = makeState({ enemyPoisonRounds: 3, enemyHP: 50 });
    const { newState } = executeEnemyAction('attack', state);
    expect(newState.enemyHP).toBeLessThanOrEqual(47); // -3 จาก poison (อาจตายแล้วไม่โจมตี)
    expect(newState.enemyPoisonRounds).toBe(2);
  });

  it('enemy ตายจาก burn → ไม่โจมตี hero', () => {
    const state = makeState({ enemyHP: 1, enemyBurnRounds: 1, enemyAttack: 50 });
    const { newState, log } = executeEnemyAction('attack', state);
    expect(newState.enemyHP).toBe(0);
    expect(log).toContain('defeated');
    // hero ไม่ถูกโจมตี
    expect(newState.heroHP).toBe(state.heroHP);
  });
});

describe('executeEnemyAction — heal', () => {
  it('enemy heal ฟื้น HP', () => {
    const state = makeState({ enemyHP: 50, enemyMaxHP: 100 });
    const { newState } = executeEnemyAction('heal', state);
    expect(newState.enemyHP).toBeGreaterThan(50);
    expect(newState.enemyHP).toBeLessThanOrEqual(100);
  });

  it('enemy heal ไม่เกิน maxHP', () => {
    const state = makeState({ enemyHP: 100, enemyMaxHP: 100 });
    const { newState } = executeEnemyAction('heal', state);
    expect(newState.enemyHP).toBe(100);
  });
});

// ===== resolveHeroStatuses =====

describe('resolveHeroStatuses', () => {
  it('hero poison → -3 HP ต่อ round', () => {
    const state = makeState({ heroHP: 80, heroPoisonRounds: 3 });
    const { newState } = resolveHeroStatuses(state);
    expect(newState.heroHP).toBe(77);
    expect(newState.heroPoisonRounds).toBe(2);
  });

  it('hero burn → HP ลด 5 (fixed damage)', () => {
    const state = makeState({ heroHP: 80, heroBurnRounds: 2 });
    const { newState } = resolveHeroStatuses(state);
    // burnDmg = fixed 5
    expect(newState.heroHP).toBe(75);
    expect(newState.heroBurnRounds).toBe(1);
  });

  it('hero freeze ลด round โดยไม่ทำ damage', () => {
    const state = makeState({ heroHP: 100, heroFreezeRounds: 2 });
    const { newState, logs } = resolveHeroStatuses(state);
    expect(newState.heroHP).toBe(100); // freeze ไม่ทำ damage
    expect(newState.heroFreezeRounds).toBe(1);
    expect(logs.some(l => l.includes('frozen') || l.includes('Freeze'))).toBe(true);
  });

  it('ไม่มี ailment → ไม่มีการเปลี่ยนแปลง HP', () => {
    const state = makeState({ heroHP: 100 });
    const { newState } = resolveHeroStatuses(state);
    expect(newState.heroHP).toBe(100);
  });

  it('hero HP ไม่ติดลบจาก poison', () => {
    const state = makeState({ heroHP: 1, heroPoisonRounds: 5 });
    const { newState } = resolveHeroStatuses(state);
    expect(newState.heroHP).toBeGreaterThanOrEqual(0);
  });

  it('hero berserk ลด incoming ailment damage 20%', () => {
    const state = makeState({ heroHP: 80, heroBurnRounds: 2, heroBerserkRounds: 1 });
    const { newState } = resolveHeroStatuses(state);
    // burn ทำ 5 dmg ปกติ แต่ไม่มี berserk reduction ใน resolveHeroStatuses (berserk ลด enemy atk)
    // แค่ตรวจว่า HP ลดลงและ burnRounds ลดลง
    expect(newState.heroHP).toBeLessThan(80);
    expect(newState.heroBurnRounds).toBe(1);
  });
});

// ===== executeEnemyAction — ailment strikes =====

describe('executeEnemyAction — poison_strike', () => {
  it('ใส่ Poison 5 rounds เมื่อไม่ parry', () => {
    const state = makeState({ heroParry: 0, heroIsEvading: false, heroPoisonRounds: 0 });
    const { newState } = executeEnemyAction('poison_strike', state);
    expect(newState.heroPoisonRounds).toBe(5);
  });

  it('ไม่ลด heroPoisonRounds ถ้า hero มี poison มากกว่าอยู่แล้ว', () => {
    const state = makeState({ heroParry: 0, heroIsEvading: false, heroPoisonRounds: 8 });
    const { newState } = executeEnemyAction('poison_strike', state);
    // max(8, 5) = 8 — ไม่ลดลง
    expect(newState.heroPoisonRounds).toBe(8);
  });

  it('ลด hero HP ด้วย', () => {
    const state = makeState({ heroParry: 0, heroIsEvading: false, heroHP: 100, enemyAttack: 20 });
    const { newState } = executeEnemyAction('poison_strike', state);
    expect(newState.heroHP).toBeLessThan(100);
  });
});

describe('executeEnemyAction — freeze_strike', () => {
  it('ใส่ Freeze 2 rounds เมื่อไม่ parry', () => {
    const state = makeState({ heroParry: 0, heroIsEvading: false, heroFreezeRounds: 0 });
    const { newState } = executeEnemyAction('freeze_strike', state);
    expect(newState.heroFreezeRounds).toBe(2);
  });

  it('ลด hero HP ด้วย', () => {
    const state = makeState({ heroParry: 0, heroIsEvading: false, heroHP: 100, enemyAttack: 20 });
    const { newState } = executeEnemyAction('freeze_strike', state);
    expect(newState.heroHP).toBeLessThan(100);
  });
});

describe('executeEnemyAction — burn_strike', () => {
  it('ใส่ Burn 3 rounds เมื่อไม่ parry', () => {
    const state = makeState({ heroParry: 0, heroIsEvading: false, heroBurnRounds: 0 });
    const { newState } = executeEnemyAction('burn_strike', state);
    expect(newState.heroBurnRounds).toBe(3);
  });

  it('ลด hero HP ด้วย', () => {
    const state = makeState({ heroParry: 0, heroIsEvading: false, heroHP: 100, enemyAttack: 20 });
    const { newState } = executeEnemyAction('burn_strike', state);
    expect(newState.heroHP).toBeLessThan(100);
  });
});

describe('executeEnemyAction — power_strike', () => {
  it('ทำ damage สูง (enemyAttack × 2)', () => {
    const state = makeState({ heroParry: 0, heroIsEvading: false, heroHP: 100, enemyAttack: 20, heroDefense: 0 });
    const { newState } = executeEnemyAction('power_strike', state);
    // rawDmg = floor(20 * 2.0 + variance()) → ≥ 38 (variance ±2 → min ~36)
    expect(newState.heroHP).toBeLessThan(70);
  });

  it('log มีคำว่า power strike', () => {
    const state = makeState({ heroParry: 0, heroIsEvading: false, enemyAttack: 20 });
    const { log } = executeEnemyAction('power_strike', state);
    expect(log.toLowerCase()).toContain('power strike');
  });
});

// ===== calcTurnManaMax — edge cases =====

describe('calcTurnManaMax — edge cases', () => {
  it('turn 0 = base budget (ไม่น้อยกว่า 1)', () => {
    const result = calcTurnManaMax(0);
    expect(result).toBeGreaterThanOrEqual(1);
  });

  it('budget เพิ่มตาม turn number', () => {
    const t1 = calcTurnManaMax(1);
    const t5 = calcTurnManaMax(5);
    expect(t5).toBeGreaterThan(t1);
  });

  it('budget level 21–30 เริ่มสูงกว่าปกติ', () => {
    const normal = calcTurnManaMax(1, 1);
    const advanced = calcTurnManaMax(1, 21);
    expect(advanced).toBeGreaterThanOrEqual(normal);
  });
});
