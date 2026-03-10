import { useCallback, useRef } from 'react';
import { useBattleStore } from '../stores/battleStore';
import { useFlowchartStore } from '../stores/flowchartStore';
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
    const battleState: BattleState = {
      heroHP: battleStore.heroHP,
      heroMaxHP: battleStore.heroMaxHP,
      heroMana: battleStore.heroMana,
      heroMaxMana: battleStore.heroMaxMana,
      manaRegen: 5,
      enemyHP: battleStore.enemyHP,
      enemyMaxHP: battleStore.enemyMaxHP,
      heroAttack:  charStats?.attack  ?? 10,
      heroDefense: charStats?.defense ?? 5,
      heroParry:   10,
      enemyAttack:  enemyStats?.attack  ?? 8,
      enemyDefense: enemyStats?.defense ?? 3,
      enemyArmor:   enemyStats?.armor   ?? 0,
      enemyParry:   enemyStats?.parry   ?? 0,
      enemyShielded: shielded,
      shieldReason:  reason,
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
