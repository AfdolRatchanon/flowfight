import { useCallback, useRef } from 'react';
import { useBattleStore } from '../stores/battleStore';
import { useFlowchartStore } from '../stores/flowchartStore';
import { useShopStore } from '../stores/shopStore';
import { FlowchartEngine } from '../engines/FlowchartEngine';
import type { BattleState } from '../engines/FlowchartEngine';
import { STEP_DELAY_MS } from '../utils/constants';
import type { Character, Enemy, RequiredBlock } from '../types/game.types';
import { saveLevelAttempt } from '../services/authService';

const BLOCK_LABELS: Record<RequiredBlock, string> = {
  condition: 'Condition block',
  heal: 'Heal block',
  dodge: 'Dodge block',
  cast_spell: 'Cast Spell block',
  power_strike: 'Power Strike block',
  enemy_alive: 'Enemy Alive? Condition',
  hp_less: 'HP < N? Condition',
  turn_gte: 'Turn ≥ N? Condition',
  hero_poisoned: 'Hero Poisoned? Condition',
  hero_frozen: 'Hero Frozen? Condition',
};

const CONDITION_TYPES: RequiredBlock[] = ['enemy_alive', 'hp_less', 'turn_gte', 'hero_poisoned', 'hero_frozen'];

function checkShield(nodes: ReturnType<typeof useFlowchartStore.getState>['nodes'], requiredBlocks: RequiredBlock[]): { shielded: boolean; reason: string } {
  for (const req of requiredBlocks) {
    let missing = false;
    if (req === 'condition')    missing = !nodes.some((n) => n.type === 'condition');
    else if (req === 'heal')         missing = !nodes.some((n) => n.type === 'action' && n.data.actionType === 'heal');
    else if (req === 'dodge')        missing = !nodes.some((n) => n.type === 'action' && n.data.actionType === 'dodge');
    else if (req === 'cast_spell')   missing = !nodes.some((n) => n.type === 'action' && n.data.actionType === 'cast_spell');
    else if (req === 'power_strike') missing = !nodes.some((n) => n.type === 'action' && n.data.actionType === 'power_strike');
    else if (CONDITION_TYPES.includes(req)) missing = !nodes.some((n) => n.type === 'condition' && (n.data as any).conditionType === req);
    if (missing) return { shielded: true, reason: `ต้องใช้ ${BLOCK_LABELS[req]}` };
  }
  return { shielded: false, reason: '' };
}

export function useBattle() {
  const battleStore = useBattleStore();
  const flowchartStore = useFlowchartStore();
  const shopStore = useShopStore();
  const stopRef = useRef(false);
  const snapshotRef = useRef<{
    heroHP: number; enemyHP: number;
    burn: number; freeze: number; poison: number; enemyStun: number;
    healCharges: number; comboCount: number;
  } | null>(null);

  const startBattle = useCallback((character: Character, enemy: Enemy, levelId: string) => {
    stopRef.current = false;
    battleStore.initBattle(character, enemy, levelId);
    flowchartStore.resetFlowchart();
    flowchartStore.clearTrace();
  }, []);

  // Retry — reset battle state only, keep flowchart as-is
  const restartBattle = useCallback((character: Character, enemy: Enemy, levelId: string) => {
    stopRef.current = false;
    battleStore.initBattle(character, enemy, levelId);
    flowchartStore.clearTrace();
  }, [battleStore, flowchartStore]);

  const stopBattle = useCallback(() => {
    stopRef.current = true;
    // Restore HP/state to what it was before execution started
    if (snapshotRef.current) {
      const s = snapshotRef.current;
      battleStore.updateHeroHP(s.heroHP);
      battleStore.updateEnemyHP(s.enemyHP);
      battleStore.setAilments({ burn: s.burn, freeze: s.freeze, poison: s.poison, enemyStun: s.enemyStun });
      battleStore.setHealCharges(s.healCharges);
      battleStore.setComboCount(s.comboCount);
      snapshotRef.current = null;
    }
    battleStore.setExecuting(false);
    battleStore.setStatus('waiting');
    battleStore.setCurrentNode(null);
    flowchartStore.highlightNode(null);
  }, [battleStore, flowchartStore]);

  const executeBattle = useCallback(async (speedMs: number = STEP_DELAY_MS, requiredBlocks: RequiredBlock[] = [], actionsMax: number = 3) => {
    stopRef.current = false;
    // Snapshot current state so Stop can revert
    snapshotRef.current = {
      heroHP:      battleStore.heroHP,
      enemyHP:     battleStore.enemyHP,
      burn:        battleStore.heroBurnRounds    ?? 0,
      freeze:      battleStore.heroFreezeRounds  ?? 0,
      poison:      battleStore.heroPoisonRounds  ?? 0,
      enemyStun:   battleStore.enemyStunnedRounds ?? 0,
      healCharges: battleStore.healCharges        ?? 3,
      comboCount:  battleStore.comboCount         ?? 0,
    };
    const { nodes, edges } = flowchartStore;
    const engine = new FlowchartEngine(nodes, edges);

    const validation = engine.validate();
    if (!validation.valid) {
      flowchartStore.setValid(false, validation.error);
      battleStore.addLog({
        round: battleStore.currentRound,
        action: `❌ Flowchart Error: ${validation.error ?? 'Invalid flowchart'}`,
        actor: 'hero',
        timestamp: Date.now(),
      });
      // Signal BattleScreen that execution never started (so it can reset battlePhase)
      battleStore.setExecuting(false);
      return;
    }

    flowchartStore.setValid(true);
    battleStore.setExecuting(true);
    battleStore.setStatus('running');

    // Research: นับจำนวน attempt ต่อด่าน (fire-and-forget)
    const _levelId = battleStore.battle?.levelId;
    const _uid     = battleStore.battle?.playerId;
    if (_uid && _levelId) saveLevelAttempt(_uid, _levelId).catch(() => {});
    battleStore.incrementSessionAttempts();

    const charStats  = battleStore.battle?.character.stats;
    const enemyStats = battleStore.battle?.enemy.stats;
    const { shielded, reason } = checkShield(nodes, requiredBlocks);
    const baseAtk = (enemyStats as any)?.attack ?? 8;
    const battleState: BattleState = {
      heroHP: battleStore.heroHP,
      heroMaxHP: battleStore.heroMaxHP,
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
      enemyBurnRounds: 0,
      enemyFreezeRounds: 0,
      enemyPoisonRounds: 0,
      enemyAilmentType:   (enemyStats as any)?.ailmentType   ?? '',
      enemyAilmentChance: (enemyStats as any)?.ailmentChance ?? 0,
      // Inventory from shop
      antidotes: shopStore.antidotes,
      potions:   shopStore.potions,
      gold:      shopStore.gold,
      round: battleStore.currentRound,
      // Turn-based fields (initialized with defaults for compatibility)
      currentTurn: 1,
      turnManaMax: actionsMax,
      heroIsEvading: false,
      conditionBonus: false,
      heroBerserkRounds: 0,
      // Phase 4: Virus state
      virusTurnWasted: false,
      manaDebuff: 0,
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
      // stopBattle() already restored state — just clean up UI
      battleStore.setExecuting(false);
      battleStore.setCurrentNode(null);
      flowchartStore.highlightNode(null);
      return;
    }

    snapshotRef.current = null; // รันจบปกติ — ไม่ต้อง restore แล้ว

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
    // Sync enemy status and berserk rounds from final state
    battleStore.setAilments({
      burn: result.finalState.heroBurnRounds,
      freeze: result.finalState.heroFreezeRounds,
      poison: result.finalState.heroPoisonRounds,
      enemyStun: result.finalState.enemyStunnedRounds,
      enemyBurn: result.finalState.enemyBurnRounds,
      enemyFreeze: result.finalState.enemyFreezeRounds,
      enemyPoison: result.finalState.enemyPoisonRounds,
      heroBerserk: result.finalState.heroBerserkRounds,
    });
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

    // Build execution trace for post-run visualization
    const visitedNodeIds = result.steps.map((s) => s.nodeId);
    const visitedConditionResults: Record<string, boolean> = {};
    for (const s of result.steps) {
      if (s.result !== undefined) visitedConditionResults[s.nodeId] = s.result;
    }
    flowchartStore.setVisitedTrace(visitedNodeIds, visitedConditionResults);
  }, [battleStore, flowchartStore]);

  return {
    battle: battleStore.battle,
    status: battleStore.status,
    heroHP: battleStore.heroHP,
    heroMaxHP: battleStore.heroMaxHP,
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
    enemyBurnRounds:   battleStore.enemyBurnRounds,
    enemyFreezeRounds: battleStore.enemyFreezeRounds,
    enemyPoisonRounds: battleStore.enemyPoisonRounds,
    heroBerserkRounds: battleStore.heroBerserkRounds,
    healCharges:       battleStore.healCharges,
    comboCount:        battleStore.comboCount,
    startBattle,
    restartBattle,
    stopBattle,
    executeBattle: (speedMs?: number, requiredBlocks?: RequiredBlock[], actionsMax?: number) => executeBattle(speedMs, requiredBlocks, actionsMax),
    resetBattle: battleStore.resetBattle,
  };
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
