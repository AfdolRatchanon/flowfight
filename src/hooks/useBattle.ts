import { useCallback, useRef } from 'react';
import { useBattleStore } from '../stores/battleStore';
import { useFlowchartStore } from '../stores/flowchartStore';
import { FlowchartEngine } from '../engines/FlowchartEngine';
import type { BattleState } from '../engines/FlowchartEngine';
import { STEP_DELAY_MS } from '../utils/constants';
import type { Character, Enemy } from '../types/game.types';

export function useBattle() {
  const battleStore = useBattleStore();
  const flowchartStore = useFlowchartStore();
  const stopRef = useRef(false);

  const startBattle = useCallback((character: Character, enemy: Enemy, levelId: string) => {
    stopRef.current = false;
    battleStore.initBattle(character, enemy, levelId);
    flowchartStore.resetFlowchart();
  }, []);

  const stopBattle = useCallback(() => {
    stopRef.current = true;
    battleStore.setExecuting(false);
    battleStore.setStatus('waiting');
    battleStore.setCurrentNode(null);
    flowchartStore.highlightNode(null);
  }, [battleStore, flowchartStore]);

  const executeBattle = useCallback(async (speedMs: number = STEP_DELAY_MS) => {
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

    const battleState: BattleState = {
      heroHP: battleStore.heroHP,
      heroMaxHP: battleStore.heroMaxHP,
      enemyHP: battleStore.enemyHP,
      enemyMaxHP: battleStore.enemyMaxHP,
      heroAttack: battleStore.battle?.character.stats.attack ?? 10,
      heroDefense: battleStore.battle?.character.stats.defense ?? 5,
      enemyAttack: battleStore.battle?.enemy.stats.attack ?? 8,
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

      // Update HP immediately after each action step (not wait for end)
      if (step.heroHP  !== undefined) battleStore.updateHeroHP(step.heroHP);
      if (step.enemyHP !== undefined) battleStore.updateEnemyHP(step.enemyHP);

      await delay(speedMs);
    }

    if (stopRef.current) {
      // Stopped by user — clean up without changing outcome
      battleStore.setExecuting(false);
      battleStore.setCurrentNode(null);
      flowchartStore.highlightNode(null);
      return;
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
      battleStore.setStatus('waiting');
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
    enemyHP: battleStore.enemyHP,
    enemyMaxHP: battleStore.enemyMaxHP,
    battleLog: battleStore.battleLog,
    isExecuting: battleStore.isExecuting,
    startBattle,
    stopBattle,
    executeBattle: (speedMs?: number) => executeBattle(speedMs),
    resetBattle: battleStore.resetBattle,
  };
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
