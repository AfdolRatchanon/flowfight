import type { FlowNode, FlowEdge, ExecutionStep, ActionType } from '../types/game.types';

export interface BattleState {
  heroHP: number;
  heroMaxHP: number;
  enemyHP: number;
  enemyMaxHP: number;
  heroAttack: number;
  heroDefense: number;
  enemyAttack: number;
  round: number;
}

export interface ExecutionResult {
  steps: ExecutionStep[];
  finalState: BattleState;
  log: string[];
}

export class FlowchartEngine {
  private nodes: Map<string, FlowNode>;
  private edges: FlowEdge[];
  private maxSteps = 200; // Prevent infinite loops
  private loopCounters: Map<string, number> = new Map();

  constructor(nodes: FlowNode[], edges: FlowEdge[]) {
    this.nodes = new Map(nodes.map((n) => [n.id, n]));
    this.edges = edges;
  }

  validate(): { valid: boolean; error?: string } {
    const nodeArr = Array.from(this.nodes.values());

    const startNodes = nodeArr.filter((n) => n.type === 'start');
    const endNodes = nodeArr.filter((n) => n.type === 'end');

    if (startNodes.length === 0) return { valid: false, error: 'Missing Start block' };
    if (startNodes.length > 1) return { valid: false, error: 'Only one Start block allowed' };
    if (endNodes.length === 0) return { valid: false, error: 'Missing End block' };

    // Check all non-end nodes have at least one outgoing edge
    for (const node of nodeArr) {
      if (node.type === 'end') continue;
      const outgoing = this.edges.filter((e) => e.source === node.id);
      if (outgoing.length === 0) {
        return { valid: false, error: `Block "${node.data.label}" has no connection` };
      }
      // Condition nodes must have yes/no edges
      if (node.type === 'condition') {
        const hasYes = outgoing.some((e) => e.sourceHandle === 'yes' || e.label?.toLowerCase() === 'yes');
        const hasNo  = outgoing.some((e) => e.sourceHandle === 'no'  || e.label?.toLowerCase() === 'no');
        if (!hasYes || !hasNo) {
          return { valid: false, error: `Condition "${node.data.label}" needs both YES and NO connections` };
        }
      }
      // Loop nodes must have loop/next edges
      if (node.type === 'loop') {
        const hasLoop = outgoing.some((e) => e.sourceHandle === 'loop' || e.label?.toLowerCase() === 'loop');
        const hasNext = outgoing.some((e) => e.sourceHandle === 'next' || e.label?.toLowerCase() === 'next');
        if (!hasLoop || !hasNext) {
          return { valid: false, error: `Loop "${node.data.label}" needs both LOOP and NEXT connections` };
        }
      }
    }

    return { valid: true };
  }

  execute(battleState: BattleState): ExecutionResult {
    const steps: ExecutionStep[] = [];
    const log: string[] = [];
    let state = { ...battleState };
    let stepCount = 0;
    this.loopCounters.clear();

    // Find start node
    const startNode = Array.from(this.nodes.values()).find((n) => n.type === 'start');
    if (!startNode) return { steps, finalState: state, log: ['No start node found'] };

    let currentNodeId: string | null = startNode.id;

    while (currentNodeId && stepCount < this.maxSteps) {
      const node = this.nodes.get(currentNodeId);
      if (!node) break;

      stepCount++;
      const step: ExecutionStep = { nodeId: currentNodeId, timestamp: Date.now() };

      if (node.type === 'end') {
        steps.push(step);
        break;
      }

      // Execute node action
      const { nextNodeId, updatedState, logEntry, result } = this.executeNode(node, state);
      state = updatedState;
      step.result = result;

      if (logEntry) {
        log.push(logEntry);
        step.battleLog = logEntry;
      }
      if (node.type === 'action' && node.data.actionType) {
        step.action = node.data.actionType;
      }

      // Record current HP so the UI can update in real-time per step
      step.heroHP  = state.heroHP;
      step.enemyHP = state.enemyHP;

      steps.push(step);

      // Check battle end conditions
      if (state.heroHP <= 0) {
        log.push('Hero has fallen!');
        break;
      }
      if (state.enemyHP <= 0) {
        log.push('Enemy defeated!');
        break;
      }

      currentNodeId = nextNodeId;
    }

    if (stepCount >= this.maxSteps) {
      log.push('Warning: Flowchart ran too many steps (possible infinite loop)');
    }

    return { steps, finalState: state, log };
  }

  private executeNode(
    node: FlowNode,
    state: BattleState
  ): { nextNodeId: string | null; updatedState: BattleState; logEntry?: string; result?: boolean } {
    const newState = { ...state };
    let logEntry: string | undefined;
    let conditionResult: boolean | undefined;

    switch (node.type) {
      case 'action': {
        const action = node.data.actionType as ActionType;
        logEntry = this.executeAction(action, newState);
        break;
      }
      case 'condition': {
        conditionResult = this.evaluateCondition(node, state);
        break;
      }
      case 'loop': {
        conditionResult = this.evaluateLoop(node, state);
        break;
      }
    }

    const nextNodeId = this.getNextNode(node.id, node.type, conditionResult);
    return { nextNodeId, updatedState: newState, logEntry, result: conditionResult };
  }

  private executeAction(action: ActionType, state: BattleState): string {
    const variance = () => Math.floor(Math.random() * 5) - 2; // -2 to +2

    switch (action) {
      case 'attack': {
        const dmg = Math.max(1, state.heroAttack - state.enemyAttack / 2 + variance());
        state.enemyHP = Math.max(0, state.enemyHP - dmg);
        // Enemy counter-attack
        const counterDmg = Math.max(1, state.enemyAttack - state.heroDefense / 2 + variance());
        state.heroHP = Math.max(0, state.heroHP - counterDmg);
        return `Hero attacks! Enemy -${dmg} HP. Enemy counters! Hero -${counterDmg} HP.`;
      }
      case 'heal': {
        const healAmt = 20 + variance();
        state.heroHP = Math.min(state.heroMaxHP, state.heroHP + healAmt);
        return `Hero heals! +${healAmt} HP (${state.heroHP}/${state.heroMaxHP})`;
      }
      case 'dodge': {
        // 70% chance to dodge enemy attack
        if (Math.random() < 0.7) {
          return 'Hero dodges the attack!';
        } else {
          const dmg = Math.max(1, state.enemyAttack - state.heroDefense / 2);
          state.heroHP = Math.max(0, state.heroHP - dmg);
          return `Dodge failed! Hero -${dmg} HP.`;
        }
      }
      case 'cast_spell': {
        const spellDmg = Math.max(5, state.heroAttack * 1.5 + variance());
        state.enemyHP = Math.max(0, state.enemyHP - spellDmg);
        // Enemy counter-attacks (50% chance — casting leaves hero exposed)
        if (Math.random() < 0.5) {
          const counterDmg = Math.max(1, state.enemyAttack - state.heroDefense / 2 + variance());
          state.heroHP = Math.max(0, state.heroHP - counterDmg);
          return `Hero casts spell! Enemy -${spellDmg} HP. Enemy counters! Hero -${counterDmg} HP.`;
        }
        return `Hero casts spell! Enemy -${spellDmg} HP. (Enemy missed!)`;
      }
      default:
        return `Hero uses ${action}`;
    }
  }

  private evaluateCondition(node: FlowNode, state: BattleState): boolean {
    const threshold = node.data.threshold ?? 50;
    switch (node.data.conditionType) {
      case 'hp_greater':   return state.heroHP > threshold;
      case 'hp_less':      return state.heroHP < threshold;
      case 'enemy_alive':  return state.enemyHP > 0;
      case 'enemy_close':  return true; // always close in turn-based
      default:             return true;
    }
  }

  private evaluateLoop(node: FlowNode, state: BattleState): boolean {
    // true = continue LOOP edge, false = exit NEXT edge
    switch (node.data.loopType) {
      case 'repeat': {
        const count = this.loopCounters.get(node.id) ?? 0;
        const max   = node.data.loopCount ?? 3;
        if (count < max) {
          this.loopCounters.set(node.id, count + 1);
          return true; // keep looping
        } else {
          this.loopCounters.delete(node.id);
          return false; // exit
        }
      }
      case 'while_alive':
        return state.enemyHP > 0; // loop while enemy alive
      default:
        return false;
    }
  }

  private getNextNode(nodeId: string, nodeType: string, conditionResult?: boolean): string | null {
    const outgoing = this.edges.filter((e) => e.source === nodeId);
    if (outgoing.length === 0) return null;

    if (conditionResult !== undefined) {
      if (nodeType === 'loop') {
        // true → LOOP edge, false → NEXT edge
        const handle = conditionResult ? 'loop' : 'next';
        const edge = outgoing.find(
          (e) => e.sourceHandle === handle || e.label?.toLowerCase() === handle
        );
        return edge?.target ?? outgoing[0]?.target ?? null;
      }
      // Condition: yes/no
      const label = conditionResult ? 'yes' : 'no';
      const edge = outgoing.find(
        (e) => e.sourceHandle === label || e.label?.toLowerCase() === label
      );
      return edge?.target ?? null;
    }

    return outgoing[0]?.target ?? null;
  }
}
