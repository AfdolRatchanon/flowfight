import type { FlowNode, FlowEdge, ExecutionStep, ActionType } from '../types/game.types';

export interface BattleState {
  heroHP: number;
  heroMaxHP: number;
  heroMana: number;
  heroMaxMana: number;
  manaRegen: number;
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
  branch?: string;      // legacy — kept for compatibility
  // Decision/loop branches (tree structure for preview)
  yesBranch?: PreviewStep[];
  noBranch?: PreviewStep[];
  loopBranch?: PreviewStep[];
  nextBranch?: PreviewStep[];
}

/** Deterministic (no random) combat calculator for preview panel */
function calcAction(action: ActionType, state: BattleState): { heroDelta: number; enemyDelta: number; note: string; manaCost: number } {
  switch (action) {
    case 'attack': {
      if (state.enemyShielded) {
        const counterDmg = Math.max(0, state.enemyAttack - Math.floor(state.heroDefense * 0.5));
        return { heroDelta: -counterDmg, enemyDelta: 0, note: `🛡️ ${state.shieldReason}`, manaCost: 0 };
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
        manaCost: 0,
      };
    }
    case 'heal': {
      const healAmt = Math.min(20, state.heroMaxHP - state.heroHP);
      return { heroDelta: healAmt, enemyDelta: 0, note: '+20 HP', manaCost: 0 };
    }
    case 'dodge': {
      // Best case: no damage
      return { heroDelta: 0, enemyDelta: 0, note: '65% dodge chance', manaCost: 0 };
    }
    case 'cast_spell': {
      if (state.enemyShielded) {
        const counterDmg = Math.max(0, state.enemyAttack - Math.floor(state.heroDefense * 0.5));
        return { heroDelta: -counterDmg, enemyDelta: 0, note: `🛡️ ${state.shieldReason}`, manaCost: 25 };
      }
      if (state.heroMana < 25) {
        // Low mana: 60% damage
        const spellDmg = Math.max(3, Math.floor(Math.floor(state.heroAttack * 1.8) * 0.6) - Math.floor(state.enemyDefense * 0.25));
        return {
          heroDelta: 0,
          enemyDelta: -spellDmg,
          note: '⚠️ Low mana! (reduced dmg)',
          manaCost: 25,
        };
      }
      // Spell ignores armor, only half defense
      const spellDmg = Math.max(5, Math.floor(state.heroAttack * 1.8) - Math.floor(state.enemyDefense * 0.25));
      return {
        heroDelta: 0,
        enemyDelta: -spellDmg,
        note: state.enemyArmor > 0 ? 'Magic bypasses armor (25 MP)' : 'High damage (25 MP)',
        manaCost: 25,
      };
    }
    case 'power_strike': {
      if (state.heroMana >= 20) {
        const effectiveArmor = state.enemyDefense + state.enemyArmor;
        const rawDmg = Math.max(1, state.heroAttack * 2 - Math.floor(effectiveArmor * 0.5));
        const counterDmg = Math.max(0, state.enemyAttack - Math.floor(state.heroDefense * 0.5));
        return {
          heroDelta: -counterDmg,
          enemyDelta: -rawDmg,
          note: '💥 Power Strike! (20 MP)',
          manaCost: 20,
        };
      }
      // Not enough mana: normal attack
      const effectiveArmor = state.enemyDefense + state.enemyArmor;
      const rawDmg = Math.max(1, state.heroAttack - Math.floor(effectiveArmor * 0.5));
      const counterDmg = Math.max(0, state.enemyAttack - Math.floor(state.heroDefense * 0.5));
      return {
        heroDelta: -counterDmg,
        enemyDelta: -rawDmg,
        note: '⚠️ Not enough mana → normal attack',
        manaCost: 0,
      };
    }
    default:
      return { heroDelta: 0, enemyDelta: 0, note: '', manaCost: 0 };
  }
}

/** Recursively build a preview tree from a node, showing both branches of conditions/loops */
function buildPreviewTree(
  nodeId: string | null,
  state: BattleState,
  nodeMap: Map<string, FlowNode>,
  edges: FlowEdge[],
  visited: Set<string>,
  budget: number
): PreviewStep[] {
  if (!nodeId || budget <= 0) return [];
  if (visited.has(nodeId)) return [];

  const node = nodeMap.get(nodeId);
  if (!node) return [];

  const outgoing = edges.filter((e) => e.source === nodeId);
  const nextVisited = new Set([...visited, nodeId]);

  if (node.type === 'start') {
    const step: PreviewStep = {
      nodeId, label: 'Start', type: 'start',
      heroDelta: 0, enemyDelta: 0,
      heroHPAfter: state.heroHP, enemyHPAfter: state.enemyHP,
    };
    return [step, ...buildPreviewTree(outgoing[0]?.target ?? null, state, nodeMap, edges, nextVisited, budget - 1)];
  }

  if (node.type === 'end') {
    return [{ nodeId, label: 'End', type: 'end', heroDelta: 0, enemyDelta: 0, heroHPAfter: state.heroHP, enemyHPAfter: state.enemyHP }];
  }

  if (node.type === 'action') {
    const action = node.data.actionType as ActionType;
    const { heroDelta, enemyDelta, note, manaCost } = calcAction(action, state);
    const newMana = Math.min(state.heroMaxMana, Math.max(0, state.heroMana - manaCost) + state.manaRegen);
    const newState = {
      ...state,
      heroHP: Math.max(0, Math.min(state.heroMaxHP, state.heroHP + heroDelta)),
      enemyHP: Math.max(0, state.enemyHP + enemyDelta),
      heroMana: newMana,
    };
    const manaNote = manaCost > 0 ? `${note ? note + ' ' : ''}-${manaCost} MP` : note;
    const step: PreviewStep = {
      nodeId, label: node.data.label, type: 'action', actionType: action,
      heroDelta, enemyDelta,
      heroHPAfter: newState.heroHP, enemyHPAfter: newState.enemyHP,
      note: manaNote,
    };
    if (newState.heroHP <= 0 || newState.enemyHP <= 0) return [step];
    return [step, ...buildPreviewTree(outgoing[0]?.target ?? null, newState, nodeMap, edges, nextVisited, budget - 1)];
  }

  if (node.type === 'condition') {
    const yesEdge = outgoing.find((e) => e.sourceHandle === 'yes' || e.label?.toLowerCase() === 'yes');
    const noEdge  = outgoing.find((e) => e.sourceHandle === 'no'  || e.label?.toLowerCase() === 'no');
    const branchBudget = Math.max(2, Math.floor((budget - 1) / 2));
    const yesBranch = yesEdge ? buildPreviewTree(yesEdge.target, state, nodeMap, edges, nextVisited, branchBudget) : [];
    const noBranch  = noEdge  ? buildPreviewTree(noEdge.target,  state, nodeMap, edges, nextVisited, branchBudget) : [];
    return [{
      nodeId, label: node.data.label, type: 'condition',
      heroDelta: 0, enemyDelta: 0,
      heroHPAfter: state.heroHP, enemyHPAfter: state.enemyHP,
      yesBranch, noBranch,
    }];
  }

  if (node.type === 'loop') {
    const loopEdge = outgoing.find((e) => e.sourceHandle === 'loop' || e.label?.toLowerCase() === 'loop');
    const nextEdge = outgoing.find((e) => e.sourceHandle === 'next' || e.label?.toLowerCase() === 'next');
    const branchBudget = Math.max(2, Math.floor((budget - 1) / 2));
    const loopBranch = loopEdge ? buildPreviewTree(loopEdge.target, state, nodeMap, edges, nextVisited, branchBudget) : [];
    const nextBranch = nextEdge ? buildPreviewTree(nextEdge.target, state, nodeMap, edges, nextVisited, branchBudget) : [];
    return [{
      nodeId, label: node.data.label, type: 'loop',
      heroDelta: 0, enemyDelta: 0,
      heroHPAfter: state.heroHP, enemyHPAfter: state.enemyHP,
      loopBranch, nextBranch,
    }];
  }

  // Unknown node — follow first edge
  return buildPreviewTree(outgoing[0]?.target ?? null, state, nodeMap, edges, nextVisited, budget - 1);
}

/** Walk the flowchart as a tree, showing both branches of every decision/loop */
export function previewFlowchart(
  nodes: FlowNode[],
  edges: FlowEdge[],
  initialState: BattleState,
  maxSteps = 30
): PreviewStep[] {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const startNode = nodes.find((n) => n.type === 'start');
  if (!startNode) return [];
  return buildPreviewTree(startNode.id, initialState, nodeMap, edges, new Set(), maxSteps);
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

      step.heroHP   = state.heroHP;
      step.enemyHP  = state.enemyHP;
      step.heroMana = state.heroMana;
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
          state.heroMana = Math.min(state.heroMaxMana, state.heroMana + state.manaRegen);
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
        state.heroMana = Math.min(state.heroMaxMana, state.heroMana + state.manaRegen);

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
        state.heroMana = Math.min(state.heroMaxMana, state.heroMana + state.manaRegen);
        return `Hero heals! +${healAmt} HP (${state.heroHP}/${state.heroMaxHP})`;
      }

      case 'dodge': {
        if (Math.random() < 0.65) {
          state.heroMana = Math.min(state.heroMaxMana, state.heroMana + state.manaRegen);
          return `Hero dodges! Attack avoided completely.`;
        }
        // Dodge failed — take full attack (no defense reduction)
        const dmg = Math.max(1, state.enemyAttack + variance());
        state.heroHP = Math.max(0, state.heroHP - dmg);
        state.heroMana = Math.min(state.heroMaxMana, state.heroMana + state.manaRegen);
        return `Dodge failed! Hero takes full attack -${dmg} HP.`;
      }

      case 'cast_spell': {
        // Shield blocks magic too
        if (state.enemyShielded) {
          const counterDmg = Math.max(0, state.enemyAttack + variance() - Math.floor(state.heroDefense * 0.5));
          const heroParried = Math.random() * 100 < state.heroParry;
          const finalCounter = heroParried ? 0 : counterDmg;
          state.heroHP = Math.max(0, state.heroHP - finalCounter);
          state.heroMana = Math.min(state.heroMaxMana, state.heroMana + state.manaRegen);
          return `🛡️ Shield absorbs the spell! (${state.shieldReason}) Enemy counters! Hero -${finalCounter} HP.`;
        }

        if (state.heroMana < 25) {
          // Low mana: 60% damage, no mana cost
          const spellDmg = Math.max(3, Math.floor(Math.floor(state.heroAttack * 1.8) * 0.6) + variance() - Math.floor(state.enemyDefense * 0.25));
          state.enemyHP = Math.max(0, state.enemyHP - spellDmg);
          // Mana regen still applies
          state.heroMana = Math.min(state.heroMaxMana, state.heroMana + state.manaRegen);
          return `⚠️ Low mana! Hero casts weak spell! Enemy -${spellDmg} HP. (reduced dmg)`;
        }

        // Spend 25 mana
        state.heroMana = Math.min(state.heroMaxMana, Math.max(0, state.heroMana - 25) + state.manaRegen);

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

      case 'power_strike': {
        if (state.heroMana >= 20) {
          // Spend 20 mana, deal 2x damage
          state.heroMana = Math.min(state.heroMaxMana, Math.max(0, state.heroMana - 20) + state.manaRegen);

          const effectiveArmor = state.enemyDefense + state.enemyArmor;
          const rawDmg = Math.max(1, state.heroAttack * 2 + variance() - Math.floor(effectiveArmor * 0.5));

          // Enemy parry check
          const parried = Math.random() * 100 < state.enemyParry;
          const finalDmg = parried ? Math.max(1, Math.floor(rawDmg * 0.3)) : rawDmg;
          state.enemyHP = Math.max(0, state.enemyHP - finalDmg);

          // Enemy counter
          const counterDmg = Math.max(0, state.enemyAttack + variance() - Math.floor(state.heroDefense * 0.5));
          const heroParried = Math.random() * 100 < state.heroParry;
          const finalCounter = heroParried ? 0 : counterDmg;
          state.heroHP = Math.max(0, state.heroHP - finalCounter);

          let msg = `💥 Power Strike!`;
          msg += parried ? ` Parried! Enemy -${finalDmg} HP.` : ` Enemy -${finalDmg} HP.`;
          if (heroParried) msg += ` Hero parries counter!`;
          else if (finalCounter > 0) msg += ` Enemy counters! Hero -${finalCounter} HP.`;
          return msg;
        }

        // Not enough mana — normal attack
        state.heroMana = Math.min(state.heroMaxMana, state.heroMana + state.manaRegen);

        const effectiveArmor = state.enemyDefense + state.enemyArmor;
        const rawDmg = Math.max(1, state.heroAttack + variance() - Math.floor(effectiveArmor * 0.5));

        const parried = Math.random() * 100 < state.enemyParry;
        const finalDmg = parried ? Math.max(1, Math.floor(rawDmg * 0.3)) : rawDmg;
        state.enemyHP = Math.max(0, state.enemyHP - finalDmg);

        const counterDmg = Math.max(0, state.enemyAttack + variance() - Math.floor(state.heroDefense * 0.5));
        const heroParried = Math.random() * 100 < state.heroParry;
        const finalCounter = heroParried ? 0 : counterDmg;
        state.heroHP = Math.max(0, state.heroHP - finalCounter);

        let msg2 = `⚠️ Not enough mana → normal attack!`;
        msg2 += parried ? ` Parried! Enemy -${finalDmg} HP.` : ` Enemy -${finalDmg} HP.`;
        if (heroParried) msg2 += ` Hero parries counter!`;
        else if (finalCounter > 0) msg2 += ` Enemy counters! Hero -${finalCounter} HP.`;
        return msg2;
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
