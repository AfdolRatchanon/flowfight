import type { FlowNode, FlowEdge, ExecutionStep, ActionType } from '../types/game.types';

export interface BattleState {
  heroHP: number;
  heroMaxHP: number;
  enemyHP: number;
  enemyMaxHP: number;
  heroAttack: number;
  heroDefense: number;
  heroParry: number;    // % chance (0-100) hero parries enemy counter
  enemyAttack: number;
  enemyDefense: number; // enemy physical defense stat
  enemyArmor: number;   // extra armor — reduces physical damage (flat)
  enemyParry: number;   // % chance (0-100) enemy parries hero attack
  enemyShielded: boolean; // true when required blocks are missing → attacks blocked
  shieldReason: string;   // e.g. "ต้องใช้ Condition block"
  round: number;
}

export interface ExecutionResult {
  steps: ExecutionStep[];
  finalState: BattleState;
  log: string[];
}

// ===== Preview system =====
export interface PreviewStep {
  nodeId: string;
  label: string;
  type: string;         // 'action' | 'condition' | 'loop' | 'start' | 'end'
  actionType?: string;
  heroDelta: number;    // net change to hero HP this step (negative = damage)
  enemyDelta: number;   // net change to enemy HP this step (negative = damage)
  heroHPAfter: number;
  enemyHPAfter: number;
  note?: string;        // e.g. "Parried!", "Armor -X", "Spell bypasses armor"
  branch?: string;      // 'YES' | 'NO' | 'LOOP' | 'NEXT'
}

/** Deterministic (no random) combat calculator for preview panel */
function calcAction(action: ActionType, state: BattleState): { heroDelta: number; enemyDelta: number; note: string } {
  switch (action) {
    case 'attack': {
      if (state.enemyShielded) {
        const counterDmg = Math.max(0, state.enemyAttack - Math.floor(state.heroDefense * 0.5));
        return { heroDelta: -counterDmg, enemyDelta: 0, note: `🛡️ ${state.shieldReason}` };
      }
      // Hero hits: reduced by defense + armor
      const effectiveArmor = state.enemyDefense + state.enemyArmor;
      const rawDmg = Math.max(1, state.heroAttack - Math.floor(effectiveArmor * 0.5));
      const armorNote = state.enemyArmor > 0 ? `Armor -${Math.floor(state.enemyArmor * 0.5)}` : '';
      // Parry: show "if parried" note only
      const parryNote = state.enemyParry > 0 ? `${state.enemyParry}% parry chance` : '';
      // Enemy counter
      const counterDmg = Math.max(0, state.enemyAttack - Math.floor(state.heroDefense * 0.5));
      const parts = [armorNote, parryNote].filter(Boolean).join(', ');
      return {
        heroDelta: -counterDmg,
        enemyDelta: -rawDmg,
        note: parts ? `[${parts}]` : '',
      };
    }
    case 'heal': {
      const healAmt = Math.min(20, state.heroMaxHP - state.heroHP);
      return { heroDelta: healAmt, enemyDelta: 0, note: '+20 HP' };
    }
    case 'dodge': {
      // Best case: no damage
      return { heroDelta: 0, enemyDelta: 0, note: '65% dodge chance' };
    }
    case 'cast_spell': {
      if (state.enemyShielded) {
        const counterDmg = Math.max(0, state.enemyAttack - Math.floor(state.heroDefense * 0.5));
        return { heroDelta: -counterDmg, enemyDelta: 0, note: `🛡️ ${state.shieldReason}` };
      }
      // Spell ignores armor, only half defense
      const spellDmg = Math.max(5, Math.floor(state.heroAttack * 1.8) - Math.floor(state.enemyDefense * 0.25));
      return {
        heroDelta: 0,
        enemyDelta: -spellDmg,
        note: state.enemyArmor > 0 ? 'Magic bypasses armor' : 'High damage',
      };
    }
    default:
      return { heroDelta: 0, enemyDelta: 0, note: '' };
  }
}

/** Walk the flowchart deterministically and return HP preview steps */
export function previewFlowchart(
  nodes: FlowNode[],
  edges: FlowEdge[],
  initialState: BattleState,
  maxSteps = 24
): PreviewStep[] {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const loopVisited = new Map<string, number>();

  const steps: PreviewStep[] = [];
  let state = { ...initialState };
  let stepCount = 0;

  const startNode = nodes.find((n) => n.type === 'start');
  if (!startNode) return [];
  let currentId: string | null = startNode.id;

  while (currentId && stepCount < maxSteps) {
    const node = nodeMap.get(currentId);
    if (!node) break;
    stepCount++;

    const outgoing = edges.filter((e) => e.source === currentId);

    if (node.type === 'start') {
      steps.push({ nodeId: currentId, label: 'Start', type: 'start', heroDelta: 0, enemyDelta: 0, heroHPAfter: state.heroHP, enemyHPAfter: state.enemyHP });
      currentId = outgoing[0]?.target ?? null;
      continue;
    }

    if (node.type === 'end') {
      steps.push({ nodeId: currentId, label: 'End', type: 'end', heroDelta: 0, enemyDelta: 0, heroHPAfter: state.heroHP, enemyHPAfter: state.enemyHP });
      break;
    }

    if (node.type === 'action') {
      const action = node.data.actionType as ActionType;
      const { heroDelta, enemyDelta, note } = calcAction(action, state);
      state = {
        ...state,
        heroHP: Math.max(0, Math.min(state.heroMaxHP, state.heroHP + heroDelta)),
        enemyHP: Math.max(0, state.enemyHP + enemyDelta),
      };
      steps.push({
        nodeId: currentId, label: node.data.label, type: 'action', actionType: action,
        heroDelta, enemyDelta,
        heroHPAfter: state.heroHP, enemyHPAfter: state.enemyHP,
        note,
      });
      if (state.heroHP <= 0 || state.enemyHP <= 0) break;
      currentId = outgoing[0]?.target ?? null;
      continue;
    }

    if (node.type === 'condition') {
      // Assume YES for preview (most likely positive branch)
      const yesEdge = outgoing.find((e) => e.sourceHandle === 'yes' || e.label?.toLowerCase() === 'yes');
      const noEdge  = outgoing.find((e) => e.sourceHandle === 'no'  || e.label?.toLowerCase() === 'no');
      steps.push({
        nodeId: currentId, label: node.data.label, type: 'condition',
        heroDelta: 0, enemyDelta: 0,
        heroHPAfter: state.heroHP, enemyHPAfter: state.enemyHP,
        branch: 'YES',
      });
      currentId = (yesEdge ?? noEdge)?.target ?? null;
      continue;
    }

    if (node.type === 'loop') {
      const visited = loopVisited.get(currentId) ?? 0;
      const max = node.data.loopCount ?? 3;
      const loopEdge = outgoing.find((e) => e.sourceHandle === 'loop' || e.label?.toLowerCase() === 'loop');
      const nextEdge = outgoing.find((e) => e.sourceHandle === 'next' || e.label?.toLowerCase() === 'next');
      if (visited < max) {
        loopVisited.set(currentId, visited + 1);
        steps.push({
          nodeId: currentId, label: node.data.label, type: 'loop',
          heroDelta: 0, enemyDelta: 0,
          heroHPAfter: state.heroHP, enemyHPAfter: state.enemyHP,
          branch: 'LOOP',
        });
        currentId = loopEdge?.target ?? null;
      } else {
        steps.push({
          nodeId: currentId, label: node.data.label, type: 'loop',
          heroDelta: 0, enemyDelta: 0,
          heroHPAfter: state.heroHP, enemyHPAfter: state.enemyHP,
          branch: 'NEXT',
        });
        currentId = nextEdge?.target ?? null;
      }
      continue;
    }

    // Unknown node type — skip
    currentId = outgoing[0]?.target ?? null;
  }

  return steps;
}


// ===== FlowchartEngine =====
export class FlowchartEngine {
  private nodes: Map<string, FlowNode>;
  private edges: FlowEdge[];
  private maxSteps = 200;
  private loopCounters: Map<string, number> = new Map();

  constructor(nodes: FlowNode[], edges: FlowEdge[]) {
    this.nodes = new Map(nodes.map((n) => [n.id, n]));
    this.edges = edges;
  }

  validate(): { valid: boolean; error?: string } {
    const nodeArr = Array.from(this.nodes.values());
    const startNodes = nodeArr.filter((n) => n.type === 'start');
    const endNodes   = nodeArr.filter((n) => n.type === 'end');

    if (startNodes.length === 0) return { valid: false, error: 'Missing Start block' };
    if (startNodes.length > 1)  return { valid: false, error: 'Only one Start block allowed' };
    if (endNodes.length === 0)  return { valid: false, error: 'Missing End block' };

    for (const node of nodeArr) {
      if (node.type === 'end') continue;
      const outgoing = this.edges.filter((e) => e.source === node.id);
      if (outgoing.length === 0) {
        return { valid: false, error: `Block "${node.data.label}" has no connection` };
      }
      if (node.type === 'condition') {
        const hasYes = outgoing.some((e) => e.sourceHandle === 'yes' || e.label?.toLowerCase() === 'yes');
        const hasNo  = outgoing.some((e) => e.sourceHandle === 'no'  || e.label?.toLowerCase() === 'no');
        if (!hasYes || !hasNo) {
          return { valid: false, error: `Condition "${node.data.label}" needs both YES and NO connections` };
        }
      }
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

      step.heroHP  = state.heroHP;
      step.enemyHP = state.enemyHP;
      steps.push(step);

      if (state.heroHP <= 0) { log.push('Hero has fallen!'); break; }
      if (state.enemyHP <= 0) { log.push('Enemy defeated!'); break; }

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
        // Shield check — blocked if required blocks are missing
        if (state.enemyShielded) {
          const counterDmg = Math.max(0, state.enemyAttack + variance() - Math.floor(state.heroDefense * 0.5));
          const heroParried = Math.random() * 100 < state.heroParry;
          const finalCounter = heroParried ? 0 : counterDmg;
          state.heroHP = Math.max(0, state.heroHP - finalCounter);
          return `🛡️ Shield blocks the attack! (${state.shieldReason}) Enemy counters! Hero -${finalCounter} HP.`;
        }

        // Physical damage: reduced by defense + armor
        const effectiveArmor = state.enemyDefense + state.enemyArmor;
        const rawDmg = Math.max(1, state.heroAttack + variance() - Math.floor(effectiveArmor * 0.5));

        // Enemy parry check
        const parried = Math.random() * 100 < state.enemyParry;
        const finalDmg = parried ? Math.max(1, Math.floor(rawDmg * 0.3)) : rawDmg;
        state.enemyHP = Math.max(0, state.enemyHP - finalDmg);

        // Enemy counter-attack
        const counterDmg = Math.max(0, state.enemyAttack + variance() - Math.floor(state.heroDefense * 0.5));

        // Hero parry check
        const heroParried = Math.random() * 100 < state.heroParry;
        const finalCounter = heroParried ? 0 : counterDmg;
        state.heroHP = Math.max(0, state.heroHP - finalCounter);

        let msg = `Hero attacks!`;
        if (state.enemyArmor > 0) msg += ` [Armor]`;
        msg += parried ? ` Parried! Enemy -${finalDmg} HP.` : ` Enemy -${finalDmg} HP.`;
        if (heroParried) msg += ` Hero parries counter!`;
        else if (finalCounter > 0) msg += ` Enemy counters! Hero -${finalCounter} HP.`;
        return msg;
      }

      case 'heal': {
        const healAmt = 20 + variance();
        state.heroHP = Math.min(state.heroMaxHP, state.heroHP + healAmt);
        return `Hero heals! +${healAmt} HP (${state.heroHP}/${state.heroMaxHP})`;
      }

      case 'dodge': {
        if (Math.random() < 0.65) {
          return `Hero dodges! Attack avoided completely.`;
        }
        // Dodge failed — take full attack (no defense reduction)
        const dmg = Math.max(1, state.enemyAttack + variance());
        state.heroHP = Math.max(0, state.heroHP - dmg);
        return `Dodge failed! Hero takes full attack -${dmg} HP.`;
      }

      case 'cast_spell': {
        // Shield blocks magic too
        if (state.enemyShielded) {
          const counterDmg = Math.max(0, state.enemyAttack + variance() - Math.floor(state.heroDefense * 0.5));
          const heroParried = Math.random() * 100 < state.heroParry;
          const finalCounter = heroParried ? 0 : counterDmg;
          state.heroHP = Math.max(0, state.heroHP - finalCounter);
          return `🛡️ Shield absorbs the spell! (${state.shieldReason}) Enemy counters! Hero -${finalCounter} HP.`;
        }

        // Magic ignores armor entirely, only partial defense
        const spellDmg = Math.max(5, Math.floor(state.heroAttack * 1.8) + variance() - Math.floor(state.enemyDefense * 0.25));
        state.enemyHP = Math.max(0, state.enemyHP - spellDmg);

        // Counter 40% chance
        if (Math.random() < 0.4) {
          const counterDmg = Math.max(0, state.enemyAttack + variance() - Math.floor(state.heroDefense * 0.5));
          state.heroHP = Math.max(0, state.heroHP - counterDmg);
          const armorNote = state.enemyArmor > 0 ? ' [Magic bypasses armor!]' : '';
          return `Hero casts spell!${armorNote} Enemy -${spellDmg} HP. Enemy counters! Hero -${counterDmg} HP.`;
        }
        const armorNote = state.enemyArmor > 0 ? ' [Magic bypasses armor!]' : '';
        return `Hero casts spell!${armorNote} Enemy -${spellDmg} HP. (Enemy missed counter!)`;
      }

      default:
        return `Hero uses ${action}`;
    }
  }

  private evaluateCondition(node: FlowNode, state: BattleState): boolean {
    const threshold = node.data.threshold ?? 50;
    switch (node.data.conditionType) {
      case 'hp_greater':  return state.heroHP > threshold;
      case 'hp_less':     return state.heroHP < threshold;
      case 'enemy_alive': return state.enemyHP > 0;
      case 'enemy_close': return true;
      default:            return true;
    }
  }

  private evaluateLoop(node: FlowNode, state: BattleState): boolean {
    switch (node.data.loopType) {
      case 'repeat': {
        const count = this.loopCounters.get(node.id) ?? 0;
        const max   = node.data.loopCount ?? 3;
        if (count < max) {
          this.loopCounters.set(node.id, count + 1);
          return true;
        }
        this.loopCounters.delete(node.id);
        return false;
      }
      case 'while_alive':
        return state.enemyHP > 0;
      default:
        return false;
    }
  }

  private getNextNode(nodeId: string, nodeType: string, conditionResult?: boolean): string | null {
    const outgoing = this.edges.filter((e) => e.source === nodeId);
    if (outgoing.length === 0) return null;

    if (conditionResult !== undefined) {
      if (nodeType === 'loop') {
        const handle = conditionResult ? 'loop' : 'next';
        const edge = outgoing.find((e) => e.sourceHandle === handle || e.label?.toLowerCase() === handle);
        return edge?.target ?? outgoing[0]?.target ?? null;
      }
      const label = conditionResult ? 'yes' : 'no';
      const edge = outgoing.find((e) => e.sourceHandle === label || e.label?.toLowerCase() === label);
      return edge?.target ?? null;
    }

    return outgoing[0]?.target ?? null;
  }
}
