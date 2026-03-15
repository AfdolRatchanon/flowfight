import type { InfinityDevState } from '../stores/infinityDevStore';
import { SUP_CARDS } from '../utils/infinityDevConstants';
import type { SupCardId } from '../utils/infinityDevConstants';

export interface DamageResult {
  finalDamage: number;
  isTrueDamage: boolean;
  selfDamageTaken: number;
  budgetUsed: number;
  lifestealed: number;
}

/** Calculate damage multiplier from Hanged Man path */
export function getHangedManMultiplier(state: InfinityDevState): number {
  const { selectedPath, heroCurrentHp, heroMaxHp, pathSynergyCount } = state;
  if (selectedPath !== 'hanged_man') return 1;
  const hpPct = heroCurrentHp / heroMaxHp;
  if (pathSynergyCount >= 5 && hpPct < 0.25) return 3.0;
  if (hpPct >= 0.5) return 1;
  if (pathSynergyCount >= 4) return 2.5;
  if (pathSynergyCount >= 3) return 2.0;
  if (pathSynergyCount >= 2) return 1.8;
  if (pathSynergyCount >= 1) return 1.6;
  return 1.5;
}

/** Magician bonus % per block run so far this turn */
export function getMagicianBonusPerBlock(state: InfinityDevState): number {
  if (state.selectedPath !== 'magician') return 0;
  const { pathSynergyCount } = state;
  if (pathSynergyCount >= 5) return 0.25;
  if (pathSynergyCount >= 4) return 0.20;
  if (pathSynergyCount >= 3) return 0.15;
  if (pathSynergyCount >= 2) return 0.12;
  if (pathSynergyCount >= 1) return 0.08;
  return 0.05;
}

/** Calculate enemy HP scaled to wave number */
export function getEnemyStats(wave: number) {
  const hp = Math.floor(30 + wave * 18 + Math.pow(wave, 1.4) * 5);
  const atk = Math.floor(5 + wave * 2.5);
  const def = Math.floor(wave * 1.2);
  const isBoss = wave % 10 === 0;
  return {
    hp: isBoss ? hp * 3 : hp,
    atk: isBoss ? atk * 2 : atk,
    def,
    isBoss,
    name: isBoss ? `BOSS Wave ${wave}` : `Enemy Wave ${wave}`,
  };
}

/** Data Fragments reward for clearing a wave */
export function getWaveReward(wave: number, hasDataScraper: boolean): number {
  const base = 10 + wave * 3;
  return base + (hasDataScraper ? 1 : 0);
}

/** Get the 3 random sup-card choices for wave milestone */
export function rollSupCards(existingCards: SupCardId[]): SupCardId[] {
  const all = SUP_CARDS.map((c) => c.id);
  const available = all.filter((id) => !existingCards.includes(id));
  const shuffled = available.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(3, shuffled.length)) as SupCardId[];
}

/** Get 4 random shop items for The Terminal */
export function rollShopInventory(wave: number) {
  // Always show 2 plugins + 1 hardware + sometimes corrupted file or virus
  return { wave };
}
