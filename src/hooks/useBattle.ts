import { useCallback, useRef } from 'react';
import { useBattleStore } from '../stores/battleStore';
import { useFlowchartStore } from '../stores/flowchartStore';
import { useShopStore } from '../stores/shopStore';
import { FlowchartEngine } from '../engines/FlowchartEngine';
import type { BattleState } from '../engines/FlowchartEngine';
import { STEP_DELAY_MS } from '../utils/constants';
import type { Character, Enemy, RequiredBlock } from '../types/game.types';

const BLOCK_LABELS: Record<RequiredBlock, string> = {
  condition: 'Condition block',
  heal: 'Heal block',
  dodge: 'Dodge block',
  cast_spell: 'Cast Spell block',
  power_strike: 'Power Strike block',
};

function checkShield(nodes: ReturnType<typeof useFlowchartStore.getState>['nodes'], requiredBlocks: RequiredBlock[]): { shielded: boolean; reason: string } {
  for (const req of requiredBlocks) {
    let missing = false;
    if (req === 'condition')    missing = !nodes.some((n) => n.type === 'condition');
    if (req === 'heal')         missing = !nodes.some((n) => n.type === 'action' && n.data.actionType === 'heal');
    if (req === 'dodge')        missing = !nodes.some((n) => n.type === 'action' && n.data.actionType === 'dodge');
    if (req === 'cast_spell')   missing = !nodes.some((n) => n.type === 'action' && n.data.actionType === 'cast_spell');
    if (req === 'power_strike') missing = !nodes.some((n) => n.type === 'action' && n.data.actionType === 'power_strike');
    if (missing) return { shielded: true, reason: `ต้องใช้ ${BLOCK_LABELS[req]}` };
  }
  return { shielded: false, reason: '' };
}

export function useBattle() {
  const battleStore = useBattleStore();
  const flowchartStore = useFlowchartStore();
  const shopStore = useShopStore();
  const stopRef = useRef(false);

  const startBattle = useCallback((character: Character, enemy: Enemy, levelId: string) => {
    stopRef.current = false;
    battleStore.initBattle(character, enemy, levelId);
    flowchartStore.resetFlowchart();
  }, []);

  // Retry — reset battle state only, keep flowchart as-is
  const restartBattle = useCallback((character: Character, enemy: Enemy, levelId: string) => {
    stopRef.current = false;
    battleStore.initBattle(character, enemy, levelId);
  }, [battleStore]);

  const stopBattle = useCallback(() => {
    stopRef.current = true;
    battleStore.setExecuting(false);
    battleStore.setStatus('waiting');
    battleStore.setCurrentNode(null);
    flowchartStore.highlightNode(null);
  }, [battleStore, flowchartStore]);

  const executeBattle = useCallback(async (speedMs: number = STEP_DELAY_MS, requiredBlocks: RequiredBlock[] = []) => {
    stopRef.current = false;
    const { nodes, edges } = flowchartStore;
    const engine = new FlowchartEngine(nodes, edges);

    const validation = engine.validate();
    if (!validation.valid) {
      flowchartStore.setValid(false, validation.error);
      return;
    }

    flowchartStore.setValid(true);
    battleStore.setExecuting(true);
    battleStore.setStatus('running');

    const charStats  = battleStore.battle?.character.stats;
    const enemyStats = battleStore.battle?.enemy.stats;
    const { shielded, reason } = checkShield(nodes, requiredBlocks);
    const baseAtk = (enemyStats as any)?.attack ?? 8;
    const battleState: BattleState = {
      heroHP: battleStore.heroHP,
      heroMaxHP: battleStore.heroMaxHP,
      heroMana: battleStore.heroMana,
      heroMaxMana: battleStore.heroMaxMana,
      manaRegen: 5,
      enemyHP: battleStore.enemyHP,
      enemyMaxHP: battleStore.enemyMaxHP,
      heroAttack:  (charStats?.attack  ?? 10) + (shopStore.attackBonus ?? 0),
      heroDefense: charStats?.defense ?? 5,
      heroParry:   10,
      enemyAttack:  baseAtk,
      enemyBaseAttack: baseAtk,
      enemyDefense: (enemyStats as any)?.defense ?? 3,
      enemyArmor:   (enemyStats as any)?.armor   ?? 0,
      enemyParry:   (enemyStats as any)?.parry   ?? 0,
      enemyShielded: shielded,
      shieldReason:  reason,
      enemyEnraged: false,
      enrageThreshold: (enemyStats as any)?.enrageThreshold ?? 0,
      // Balance
      healCharges: 3,
      powerStrikeCooldown: 0,
      // Combo
      lastActionType: '',
      comboCount: 0,
      // Ailments
      heroBurnRounds: 0,
      heroFreezeRounds: 0,
      heroPoisonRounds: 0,
      enemyStunnedRounds: 0,
      enemyAilmentType:   (enemyStats as any)?.ailmentType   ?? '',
      enemyAilmentChance: (enemyStats as any)?.ailmentChance ?? 0,
      // Inventory from shop
      antidotes: shopStore.antidotes,
      potions:   shopStore.potions,
      gold:      shopStore.gold,
      round: battleStore.currentRound,
    };

    const result = engine.execute(battleState);

    // Animate steps — update HP real-time per step
    for (const step of result.steps) {
      if (stopRef.current) break;

      battleStore.setCurrentNode(step.nodeId);
      flowchartStore.highlightNode(step.nodeId);

      if (step.battleLog) {
        battleStore.addLog({
          round: battleStore.currentRound,
          action: step.battleLog,
          actor: 'hero',
          timestamp: step.timestamp,
        });
      }

      // Update HP/Mana immediately after each action step (not wait for end)
      if (step.heroHP   !== undefined) battleStore.updateHeroHP(step.heroHP);
      if (step.enemyHP  !== undefined) battleStore.updateEnemyHP(step.enemyHP);
      if (step.heroMana !== undefined) battleStore.updateHeroMana(step.heroMana);
      // Update ailment + balance display state
      if (step.heroBurnRounds !== undefined || step.heroFreezeRounds !== undefined || step.heroPoisonRounds !== undefined || step.enemyStunnedRounds !== undefined) {
        battleStore.setAilments({
          burn:      step.heroBurnRounds      ?? 0,
          freeze:    step.heroFreezeRounds    ?? 0,
          poison:    step.heroPoisonRounds    ?? 0,
          enemyStun: step.enemyStunnedRounds  ?? 0,
        });
      }
      if (step.healCharges !== undefined) battleStore.setHealCharges(step.healCharges);
      if (step.comboCount  !== undefined) battleStore.setComboCount(step.comboCount);

      await delay(speedMs);
    }

    if (stopRef.current) {
      // Stopped by user — clean up without changing outcome
      battleStore.setExecuting(false);
      battleStore.setCurrentNode(null);
      flowchartStore.highlightNode(null);
      return;
    }

    // Compute gross damage taken (sum of all HP decreases, heals excluded)
    {
      let grossDmg = 0;
      let prevHP = battleState.heroHP;
      for (const step of result.steps) {
        if (step.heroHP !== undefined) {
          if (step.heroHP < prevHP) grossDmg += prevHP - step.heroHP;
          prevHP = step.heroHP;
        }
      }
      battleStore.setTotalDamageTaken(grossDmg);
    }

    // Apply final state
    battleStore.updateHeroHP(result.finalState.heroHP);
    battleStore.updateEnemyHP(result.finalState.enemyHP);
    // Sync remaining consumables back to shop store
    shopStore.setPotions(result.finalState.potions);
    shopStore.setAntidotes(result.finalState.antidotes);

    // Determine outcome
    if (result.finalState.enemyHP <= 0) {
      battleStore.setStatus('victory');
    } else if (result.finalState.heroHP <= 0) {
      battleStore.setStatus('defeat');
    } else {
      // Flowchart ended but enemy still alive = mission failed
      battleStore.setStatus('defeat');
    }

    battleStore.setExecuting(false);
    battleStore.setCurrentNode(null);
    flowchartStore.highlightNode(null);
    flowchartStore.setExecutionLog(result.steps);
  }, [battleStore, flowchartStore]);

  return {
    battle: battleStore.battle,
    status: battleStore.status,
    heroHP: battleStore.heroHP,
    heroMaxHP: battleStore.heroMaxHP,
    heroMana: battleStore.heroMana,
    heroMaxMana: battleStore.heroMaxMana,
    enemyHP: battleStore.enemyHP,
    enemyMaxHP: battleStore.enemyMaxHP,
    battleLog: battleStore.battleLog,
    isExecuting: battleStore.isExecuting,
    totalDamageTaken: battleStore.totalDamageTaken,
    // Ailment + balance display
    heroBurnRounds:    battleStore.heroBurnRounds,
    heroFreezeRounds:  battleStore.heroFreezeRounds,
    heroPoisonRounds:  battleStore.heroPoisonRounds,
    enemyStunnedRounds: battleStore.enemyStunnedRounds,
    healCharges:       battleStore.healCharges,
    comboCount:        battleStore.comboCount,
    startBattle,
    restartBattle,
    stopBattle,
    executeBattle: (speedMs?: number, requiredBlocks?: RequiredBlock[]) => executeBattle(speedMs, requiredBlocks),
    resetBattle: battleStore.resetBattle,
  };
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
