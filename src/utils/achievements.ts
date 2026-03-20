/**
 * Achievement System — FlowFight
 * กำหนด achievement ทั้งหมดและ logic การตรวจสอบ
 */
import type { Player } from '../types/game.types';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_blood',
    name: 'เลือดหยดแรก',
    icon: '⚔️',
    description: 'ชนะการต่อสู้ครั้งแรก',
  },
  {
    id: 'speed_demon',
    name: 'สายฟ้า',
    icon: '⚡',
    description: 'ชนะด่านใด ๆ ภายใน 3 turn',
  },
  {
    id: 'iron_will',
    name: 'ใจเหล็ก',
    icon: '🩺',
    description: 'ชนะด้วย HP เหลือน้อยกว่า 10%',
  },
  {
    id: 'untouchable',
    name: 'ผ่องแผ้ว',
    icon: '🛡️',
    description: 'ชนะโดยไม่รับ damage เลย',
  },
  {
    id: 'loop_master',
    name: 'ชำนาญ Loop',
    icon: '🔁',
    description: 'ผ่านด่าน While Loop (ด่านที่ 11)',
  },
  {
    id: 'campaign_complete',
    name: 'วีรบุรุษแห่งอาณาจักร',
    icon: '👑',
    description: 'ผ่านครบทุก 20 ด่าน Campaign',
  },
  {
    id: 'endless_wave_10',
    name: 'ทนทาน',
    icon: '🌊',
    description: 'ผ่าน Wave 10 ใน Endless Mode',
  },
  {
    id: 'class_skill_user',
    name: 'นักสู้อาชีพ',
    icon: '✨',
    description: 'ใช้ Class Skill ในการต่อสู้ครั้งแรก',
  },
];

export interface AchievementCheckInput {
  levelId: string;
  won: boolean;
  turnCount: number;
  heroHPPercent: number;   // 0–100
  damageTaken: number;
  wave?: number;           // Endless เท่านั้น
  actionsUsed?: string[];  // action types ที่ใช้ใน battle
  player: Player;
}

const CLASS_SKILLS = new Set([
  'shield', 'counter', 'war_cry',
  'fireball', 'frost_nova', 'arcane_surge',
  'backstab', 'poison_strike', 'shadow_step',
  'whirlwind', 'bloodthirst', 'battle_cry',
]);

/**
 * ตรวจสอบว่า achievements ใดที่ควรปลดล็อคจาก battle ล่าสุด
 * คืน array ของ Achievement ที่ปลดล็อคใหม่ (ไม่รวมที่มีอยู่แล้ว)
 */
export function checkAchievements(input: AchievementCheckInput): Achievement[] {
  const { levelId, won, turnCount, heroHPPercent, damageTaken, wave, actionsUsed = [], player } = input;
  const existing = new Set(player.achievements ?? []);
  const newlyUnlocked: Achievement[] = [];

  const unlock = (id: string) => {
    if (existing.has(id)) return;
    const ach = ACHIEVEMENTS.find((a) => a.id === id);
    if (ach) newlyUnlocked.push(ach);
  };

  if (!won) return [];

  // ชนะครั้งแรก
  unlock('first_blood');

  // ชนะภายใน 3 turn (Endless ไม่นับ)
  if (turnCount <= 3 && levelId !== 'level_endless') {
    unlock('speed_demon');
  }

  // HP เหลือน้อยกว่า 10%
  if (heroHPPercent < 10 && heroHPPercent > 0) {
    unlock('iron_will');
  }

  // ไม่รับ damage เลย
  if (damageTaken === 0) {
    unlock('untouchable');
  }

  // ผ่านด่าน While Loop
  if (levelId === 'level_11') {
    unlock('loop_master');
  }

  // ผ่านครบ 20 ด่าน
  const completedSet = new Set([...(player.levelsCompleted ?? []), levelId]);
  if (completedSet.size >= 20) {
    unlock('campaign_complete');
  }

  // Endless wave >= 10
  if (levelId === 'level_endless' && (wave ?? 0) >= 10) {
    unlock('endless_wave_10');
  }

  // ใช้ Class Skill
  if (actionsUsed.some((a) => CLASS_SKILLS.has(a))) {
    unlock('class_skill_user');
  }

  return newlyUnlocked;
}
