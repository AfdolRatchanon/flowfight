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
  enemyBaseAttack: number; // base attack before enrage
  enemyDefense: number; // enemy physical defense stat
  enemyArmor: number;   // extra armor — reduces physical damage (flat)
  enemyParry: number;   // % chance (0-100) enemy parries hero attack
  enemyShielded: boolean; // true when required blocks are missing → attacks blocked
  shieldReason: string;   // e.g. "ต้องใช้ Condition block"
  enemyEnraged: boolean;  // true when enemy HP < enrageThreshold
  enrageThreshold: number; // % HP threshold to trigger enrage (0 = disabled)
  // Balance
  healCharges: number;          // remaining heals this battle (max 3)
  powerStrikeCooldown: number;  // steps remaining until PS available (0 = ready)
  // Combo system
  lastActionType: string;
  comboCount: number;
  // Ailments on hero
  heroBurnRounds: number;
  heroFreezeRounds: number;
  heroPoisonRounds: number;
  // Ailments on enemy
  enemyStunnedRounds: number;
  enemyBurnRounds: number;
  enemyFreezeRounds: number;
  enemyPoisonRounds: number;
  // Enemy ailment infliction
  enemyAilmentType: string;   // 'burn'|'freeze'|'poison'|''
  enemyAilmentChance: number; // 0-1 probability per hit
  // Inventory (from shop)
  antidotes: number;
  potions: number;
  // Gold (for shop conditions in shop flowchart)
  gold: number;
  round: number;
  // Turn-based fields
  currentTurn: number;   // which turn we're on (starts at 1)
  turnManaMax: number;   // mana budget for placing blocks this turn
  heroIsEvading: boolean; // set true by dodge; consumed on enemy's turn
  // Condition bonus — set true when condition evaluates YES → next damage action gets 1.5x
  conditionBonus: boolean;
  // Hero berserk buff — +50% DMG, -20% damage taken for N turns
  heroBerserkRounds: number;
  // Phase 4: Virus effects
  virusTurnWasted: boolean;  // if true, enemy gets a free attack next resolution
  manaDebuff: number;        // legacy — kept for virus scramble compat (unused)
}

/** Action cost per block type — used for turn action budget (1 = normal, 2 = heavy) */
const ACTION_COST: Record<string, number> = {
  attack: 1, heal: 1, dodge: 1, cast_spell: 2, power_strike: 2,
  berserk: 1, use_potion: 0, use_antidote: 0,
  shield: 1, counter: 2, war_cry: 2,
  fireball: 2, frost_nova: 2, arcane_surge: 3,
  backstab: 2, poison_strike: 1, shadow_step: 2,
  whirlwind: 2, bloodthirst: 2, battle_cry: 3,
  debug_block: 2,
};

// Keep export for ActionNode badge display (shows action weight, not mana)
export const BLOCK_MANA_COST = ACTION_COST;

/** Sum of action costs for all action nodes in the flowchart (used for budget display) */
export function calcFlowchartManaCost(nodes: FlowNode[]): number {
  return nodes
    .filter((n) => n.type === 'action')
    .reduce((sum, n) => sum + (ACTION_COST[n.data.actionType ?? ''] ?? 1), 0);
}

/** Max action budget per turn — base 3 for all levels, +1 per turn
 *  Exceptions: level 14–15 start at 4 (heal+dodge+power_strike worst-case path)
 *  Turn scaling handles the rest: turn 2 = base+1, turn 3 = base+2, etc.
 */
export function calcTurnManaMax(turn: number, levelNumber: number = 1): number {
  const base = (levelNumber === 14 || levelNumber === 15) ? 4 : 3;
  return base + (turn - 1);  // turn 1 = base, turn 2 = base+1, ...
}

export interface ExecutionResult {
  steps: ExecutionStep[];
  finalState: BattleState;
  log: string[];
  actionsUsed: number; // how many action-points were spent this turn
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
function calcAction(action: ActionType, state: BattleState): { heroDelta: number; enemyDelta: number; note: string } {
  switch (action) {
    case 'attack': {
      if (state.enemyShielded) {
        const counterDmg = Math.max(0, state.enemyAttack - Math.floor(state.heroDefense * 0.5));
        return { heroDelta: -counterDmg, enemyDelta: 0, note: `🛡️ ${state.shieldReason}` };
      }
      const effectiveArmor = state.enemyDefense + state.enemyArmor;
      const rawDmg = Math.max(1, state.heroAttack - Math.floor(effectiveArmor * 0.5));
      const armorNote = state.enemyArmor > 0 ? `Armor -${Math.floor(state.enemyArmor * 0.5)}` : '';
      const parryNote = state.enemyParry > 0 ? `${state.enemyParry}% parry chance` : '';
      const counterDmg = Math.max(0, state.enemyAttack - Math.floor(state.heroDefense * 0.5));
      const parts = [armorNote, parryNote].filter(Boolean).join(', ');
      return { heroDelta: -counterDmg, enemyDelta: -rawDmg, note: parts ? `[${parts}]` : '' };
    }
    case 'heal': {
      const healAmt = Math.min(20, state.heroMaxHP - state.heroHP);
      return { heroDelta: healAmt, enemyDelta: 0, note: '+20 HP' };
    }
    case 'dodge': {
      return { heroDelta: 0, enemyDelta: 0, note: '65% dodge chance' };
    }
    case 'cast_spell': {
      if (state.enemyShielded) {
        const counterDmg = Math.max(0, state.enemyAttack - Math.floor(state.heroDefense * 0.5));
        return { heroDelta: -counterDmg, enemyDelta: 0, note: `🛡️ ${state.shieldReason}` };
      }
      const spellDmg = Math.max(5, Math.floor(state.heroAttack * 1.8) - Math.floor(state.enemyDefense * 0.25));
      return { heroDelta: 0, enemyDelta: -spellDmg, note: state.enemyArmor > 0 ? 'Magic bypasses armor' : 'High damage spell' };
    }
    case 'power_strike': {
      const effectiveArmor = state.enemyDefense + state.enemyArmor;
      const rawDmg = Math.max(1, state.heroAttack * 2 - Math.floor(effectiveArmor * 0.5));
      const counterDmg = Math.max(0, state.enemyAttack - Math.floor(state.heroDefense * 0.5));
      return { heroDelta: -counterDmg, enemyDelta: -rawDmg, note: '💥 Power Strike!' };
    }
    default:
      return { heroDelta: 0, enemyDelta: 0, note: '' };
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
    const { heroDelta, enemyDelta, note: actionNote } = calcAction(action, state);
    const newState = {
      ...state,
      heroHP: Math.max(0, Math.min(state.heroMaxHP, state.heroHP + heroDelta)),
      enemyHP: Math.max(0, state.enemyHP + enemyDelta),
    };
    const step: PreviewStep = {
      nodeId, label: node.data.label, type: 'action', actionType: action,
      heroDelta, enemyDelta,
      heroHPAfter: newState.heroHP, enemyHPAfter: newState.enemyHP,
      note: actionNote,
    };
    if (newState.heroHP <= 0 || newState.enemyHP <= 0) return [step];
    return [step, ...buildPreviewTree(outgoing[0]?.target ?? null, newState, nodeMap, edges, nextVisited, budget - 1)];
  }

  if (node.type === 'condition') {
    const yesEdge = outgoing.find((e) => e.sourceHandle === 'yes' || e.label?.toLowerCase() === 'yes');
    const noEdge = outgoing.find((e) => e.sourceHandle === 'no' || e.label?.toLowerCase() === 'no');
    const branchBudget = Math.max(2, Math.floor((budget - 1) / 2));
    const yesBranch = yesEdge ? buildPreviewTree(yesEdge.target, state, nodeMap, edges, nextVisited, branchBudget) : [];
    const noBranch = noEdge ? buildPreviewTree(noEdge.target, state, nodeMap, edges, nextVisited, branchBudget) : [];
    // Annotate with what the condition checks (for preview display)
    const ct = node.data.conditionType;
    const th = node.data.threshold ?? 50;
    const condNote = '';
    void ct; void th; // used only for display annotation
    return [{
      nodeId, label: node.data.label, type: 'condition',
      heroDelta: 0, enemyDelta: 0,
      heroHPAfter: state.heroHP, enemyHPAfter: state.enemyHP,
      note: condNote || undefined,
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
    const endNodes = nodeArr.filter((n) => n.type === 'end');

    if (startNodes.length === 0) return { valid: false, error: 'Missing Start block' };
    if (startNodes.length > 1) return { valid: false, error: 'Only one Start block allowed' };
    if (endNodes.length === 0) return { valid: false, error: 'Missing End block' };

    for (const node of nodeArr) {
      if (node.type === 'end') continue;
      const outgoing = this.edges.filter((e) => e.source === node.id);
      if (outgoing.length === 0) {
        return { valid: false, error: `Block "${node.data.label}" has no connection` };
      }
      if (node.type === 'condition') {
        const hasYes = outgoing.some((e) => e.sourceHandle === 'yes' || e.label?.toLowerCase() === 'yes');
        const hasNo = outgoing.some((e) => e.sourceHandle === 'no' || e.label?.toLowerCase() === 'no');
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
    const loopCheck = this.detectInfiniteLoops();
    if (!loopCheck.valid) return loopCheck;

    // Verify END node is actually reachable from START via BFS
    const startNode = startNodes[0];
    const reachable = new Set<string>();
    const queue: string[] = [startNode.id];
    while (queue.length > 0) {
      const cur = queue.shift()!;
      if (reachable.has(cur)) continue;
      reachable.add(cur);
      for (const e of this.edges) {
        if (e.source === cur && !reachable.has(e.target)) queue.push(e.target);
      }
    }
    const endReachable = endNodes.some((n) => reachable.has(n.id));
    if (!endReachable) {
      return { valid: false, error: 'ต้องมีเส้นเชื่อมจาก Start ไปถึง End block' };
    }

    return { valid: true };
  }

  /** Detect cycles that have no Condition or Loop node — these are guaranteed infinite loops */
  private detectInfiniteLoops(): { valid: boolean; error?: string } {
    const nodeArr = Array.from(this.nodes.values());

    // Build adjacency list
    const adj = new Map<string, string[]>();
    for (const n of nodeArr) adj.set(n.id, []);
    for (const e of this.edges) adj.get(e.source)?.push(e.target);

    // Tarjan's SCC
    const idx = new Map<string, number>();
    const low = new Map<string, number>();
    const onStack = new Set<string>();
    const stack: string[] = [];
    let counter = 0;
    const sccs: string[][] = [];

    const strongconnect = (v: string) => {
      idx.set(v, counter);
      low.set(v, counter);
      counter++;
      stack.push(v);
      onStack.add(v);

      for (const w of (adj.get(v) ?? [])) {
        if (!idx.has(w)) {
          strongconnect(w);
          low.set(v, Math.min(low.get(v)!, low.get(w)!));
        } else if (onStack.has(w)) {
          low.set(v, Math.min(low.get(v)!, idx.get(w)!));
        }
      }

      if (low.get(v) === idx.get(v)) {
        const scc: string[] = [];
        let w: string;
        do {
          w = stack.pop()!;
          onStack.delete(w);
          scc.push(w);
        } while (w !== v);
        sccs.push(scc);
      }
    };

    for (const n of nodeArr) {
      if (!idx.has(n.id)) strongconnect(n.id);
    }

    for (const scc of sccs) {
      const isCycle =
        scc.length > 1 ||
        (scc.length === 1 && this.edges.some((e) => e.source === scc[0] && e.target === scc[0]));

      if (!isCycle) continue;

      const hasDecision = scc.some((id) => {
        const node = this.nodes.get(id);
        return node?.type === 'condition' || node?.type === 'loop';
      });

      if (!hasDecision) {
        const labels = scc
          .map((id) => this.nodes.get(id)?.data.label ?? id)
          .join(' → ');
        return {
          valid: false,
          error: `Infinite loop detected: [${labels}]. ต้องมี Condition หรือ Loop block เพื่อหยุด loop ได้`,
        };
      }
    }

    return { valid: true };
  }

  execute(battleState: BattleState): ExecutionResult {
    const steps: ExecutionStep[] = [];
    const log: string[] = [];
    let state = { ...battleState };
    let stepCount = 0;
    // Execution budget: turnManaMax = max action-points per hero turn (0 = unlimited)
    let actionsRemaining = state.turnManaMax > 0 ? state.turnManaMax : 999;
    let actionsUsed = 0;
    this.loopCounters.clear();

    const startNode = Array.from(this.nodes.values()).find((n) => n.type === 'start');
    if (!startNode) return { steps, finalState: state, log: ['No start node found'], actionsUsed: 0 };

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

      // ===== Pre-action: budget check + ailment ticks + freeze skip =====
      let preLog = '';
      if (node.type === 'action') {
        // Check execution budget — stops loop from running indefinitely
        if (actionsRemaining <= 0) {
          log.push('⏰ Action budget ใช้หมด — จบ turn ของ Hero');
          break;
        }
        const actionCost = BLOCK_MANA_COST[node.data.actionType ?? ''] ?? 1;
        actionsRemaining -= actionCost;
        actionsUsed += actionCost;

        const ticks: string[] = [];

        if (state.heroBurnRounds > 0) {
          const dmg = 5;
          state.heroHP = Math.max(0, state.heroHP - dmg);
          state.heroBurnRounds--;
          ticks.push(`🔥 Burn! -${dmg} HP (${state.heroBurnRounds} left)`);
        }
        if (state.heroPoisonRounds > 0) {
          const dmg = 3;
          state.heroHP = Math.max(0, state.heroHP - dmg);
          state.heroPoisonRounds--;
          ticks.push(`🟣 Poison! -${dmg} HP (${state.heroPoisonRounds} left)`);
        }
        if (ticks.length > 0) preLog = ticks.join(' | ') + ' → ';

        // Freeze: skip hero's action this step
        if (state.heroFreezeRounds > 0) {
          state.heroFreezeRounds--;
          const msg = preLog + `❄️ Frozen! Skipped action (${state.heroFreezeRounds} left)`;
          log.push(msg);
          step.battleLog = msg;
          step.heroHP = state.heroHP;
          step.enemyHP = state.enemyHP;
          step.heroBurnRounds = state.heroBurnRounds;
          step.heroFreezeRounds = state.heroFreezeRounds;
          step.heroPoisonRounds = state.heroPoisonRounds;
          step.enemyStunnedRounds = state.enemyStunnedRounds;
          step.healCharges = state.healCharges;
          step.comboCount = state.comboCount;
          steps.push(step);
          if (state.heroHP <= 0) { log.push('Hero has fallen!'); break; }
          currentNodeId = this.getNextNode(node.id, node.type, undefined);
          continue;
        }

        // Decrement power strike cooldown each action step
        if (state.powerStrikeCooldown > 0) state.powerStrikeCooldown--;
        // Decrement enemy stun
        if (state.enemyStunnedRounds > 0) state.enemyStunnedRounds--;
      }

      const { nextNodeId, updatedState, logEntry, result } = this.executeNode(node, state);
      state = updatedState;
      step.result = result;

      const fullLog = preLog + (logEntry ?? '');
      if (fullLog) {
        log.push(fullLog);
        step.battleLog = fullLog;
      }
      if (node.type === 'action' && node.data.actionType) {
        step.action = node.data.actionType;
      }

      // Enrage: enemy ATK ×1.5 when HP drops below threshold
      if (state.enrageThreshold > 0 && !state.enemyEnraged) {
        const hpPct = (state.enemyHP / state.enemyMaxHP) * 100;
        if (hpPct <= state.enrageThreshold) {
          state.enemyEnraged = true;
          state.enemyAttack = Math.floor(state.enemyBaseAttack * 1.5);
          log.push('💢 Enemy ENRAGES! ATK ×1.5!');
          step.battleLog = (step.battleLog ?? '') + ' 💢 ENRAGE!';
        }
      }

      step.heroHP = state.heroHP;
      step.enemyHP = state.enemyHP;
      step.heroBurnRounds = state.heroBurnRounds;
      step.heroFreezeRounds = state.heroFreezeRounds;
      step.heroPoisonRounds = state.heroPoisonRounds;
      step.enemyStunnedRounds = state.enemyStunnedRounds;
      step.healCharges = state.healCharges;
      step.comboCount = state.comboCount;
      steps.push(step);

      if (state.heroHP <= 0) { log.push('Hero has fallen!'); break; }
      if (state.enemyHP <= 0) { log.push('Enemy defeated!'); break; }

      currentNodeId = nextNodeId;
    }

    if (stepCount >= this.maxSteps) {
      log.push('Warning: Flowchart ran too many steps (possible infinite loop)');
    }

    return { steps, finalState: state, log, actionsUsed };
  }

  private executeNode(
    node: FlowNode,
    state: BattleState
  ): { nextNodeId: string | null; updatedState: BattleState; logEntry?: string; result?: boolean } {
    const newState = { ...state };
    let logEntry: string | undefined;
    let conditionResult: boolean | undefined;

    // Phase 4: Virus node effect — apply before normal execution
    if (node.data.isVirus && node.type === 'action') {
      const effect = node.data.virusEffect ?? 'drain_hp';
      if (effect === 'drain_hp') {
        newState.heroHP = Math.max(0, newState.heroHP - 15);
        logEntry = '☠️ VIRUS: Drained 15 HP!';
      } else if (effect === 'waste_turn') {
        newState.virusTurnWasted = true;
        logEntry = '☠️ VIRUS: Turn wasted! Enemy gets free attack!';
      } else if (effect === 'scramble') {
        newState.heroAttack = Math.floor(newState.heroAttack * 0.7);
        logEntry = '☠️ VIRUS: Scrambled! ATK -30% this turn!';
      }
      const nextNodeId = this.getNextNode(node.id, node.type, undefined);
      return { nextNodeId, updatedState: newState, logEntry, result: undefined };
    }

    switch (node.type) {
      case 'action': {
        const action = node.data.actionType as ActionType;
        logEntry = this.executeAction(action, newState);
        break;
      }
      case 'condition': {
        conditionResult = this.evaluateCondition(node, state);
        newState.conditionBonus = conditionResult === true;
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

  /** Returns combo damage multiplier and updates state.comboCount / lastActionType */
  private applyCombo(action: string, state: BattleState): number {
    const attackTypes = ['attack', 'cast_spell', 'power_strike'];
    if (!attackTypes.includes(action)) {
      // Non-attack: reset combo but remember for Counter Strike
      state.lastActionType = action;
      state.comboCount = 0;
      return 1.0;
    }
    // Counter Strike: dodge → attack
    if (action === 'attack' && state.lastActionType === 'dodge') {
      state.lastActionType = action;
      state.comboCount = 0;
      return 1.75;
    }
    // Consecutive same-type attack
    if (action === state.lastActionType) {
      state.comboCount++;
    } else {
      state.comboCount = 0;
    }
    state.lastActionType = action;
    if (state.comboCount >= 3) return 1.5;
    if (state.comboCount === 2) return 1.25;
    return 1.0;
  }

  private executeAction(action: ActionType, state: BattleState): string {
    const variance = () => Math.floor(Math.random() * 5) - 2; // -2 to +2

    // Global shield check — all damage-dealing actions are blocked when shielded
    const SHIELDED_BLOCKED: Set<string> = new Set([
      'attack', 'cast_spell', 'power_strike',
      'fireball', 'frost_nova', 'arcane_surge',
      'backstab', 'poison_strike', 'shadow_step',
      'whirlwind', 'bloodthirst',
    ]);
    if (state.enemyShielded && SHIELDED_BLOCKED.has(action)) {
      this.applyCombo(action, state);
      state.conditionBonus = false;
      return `🛡️ Shield blocks ${action}! (${state.shieldReason})`;
    }

    switch (action) {
      case 'attack': {
        const comboMult = this.applyCombo('attack', state);
        const comboTag = comboMult >= 1.75 ? ' ⚡ Counter Strike!' : comboMult >= 1.5 ? ' ⚡ Combo x3!' : comboMult >= 1.25 ? ' ⚡ Combo x2!' : '';

        const effectiveArmor = state.enemyDefense + state.enemyArmor;
        let rawDmg = Math.max(1, Math.floor((state.heroAttack + variance()) * comboMult) - Math.floor(effectiveArmor * 0.5));

        // Apply bonus multipliers
        const tags: string[] = [];
        let bonusMult = 1.0;
        if (state.conditionBonus) { bonusMult *= 1.5; tags.push('⚡ Condition Bonus!'); }
        if (state.heroBerserkRounds > 0) { bonusMult *= 1.5; tags.push('💢 Berserk!'); }
        if (state.enemyBurnRounds > 0) { bonusMult *= 1.3; tags.push('🔥 Burn Amplified!'); }
        if (bonusMult > 1.0) rawDmg = Math.max(1, Math.floor(rawDmg * bonusMult));
        state.conditionBonus = false;
        const bonusTag = tags.length > 0 ? ' ' + tags.join(' ') : '';

        // Enemy parry check
        const parried = Math.random() * 100 < state.enemyParry;
        const finalDmg = parried ? Math.max(1, Math.floor(rawDmg * 0.3)) : rawDmg;
        state.enemyHP = Math.max(0, state.enemyHP - finalDmg);

        let msg = `Hero attacks!${comboTag}${bonusTag}`;
        if (state.enemyArmor > 0) msg += ` [Armor]`;
        msg += parried ? ` Parried! Enemy -${finalDmg} HP.` : ` Enemy -${finalDmg} HP.`;
        if (state.enemyStunnedRounds > 0) msg += ` Enemy stunned!`;
        return msg;
      }

      case 'heal': {
        this.applyCombo('heal', state);
        if (state.healCharges <= 0) {
          return `💊 No Heal Charges left! (0/3)`;
        }
        state.healCharges--;
        const healAmt = 20 + variance();
        state.heroHP = Math.min(state.heroMaxHP, state.heroHP + healAmt);
        return `Hero heals! +${healAmt} HP (${state.heroHP}/${state.heroMaxHP}) [${state.healCharges} heals left]`;
      }

      case 'dodge': {
        this.applyCombo('dodge', state);
        state.heroIsEvading = true;
        return `Hero prepares to evade! (65% chance to reduce next enemy attack)`;
      }

      case 'cast_spell': {
        const spellCombo = this.applyCombo('cast_spell', state);
        const spellComboTag = spellCombo >= 1.5 ? ' ⚡ Chain Magic!' : spellCombo >= 1.25 ? ' ⚡ Spell Combo!' : '';

        // Magic ignores armor, only half defense
        let spellDmg = Math.max(5, Math.floor(state.heroAttack * 1.8) + variance() - Math.floor(state.enemyDefense * 0.25));

        // Apply bonus multipliers
        const spellTags: string[] = [];
        let spellBonusMult = 1.0;
        if (state.conditionBonus) { spellBonusMult *= 1.5; spellTags.push('⚡ Condition Bonus!'); }
        if (state.heroBerserkRounds > 0) { spellBonusMult *= 1.5; spellTags.push('💢 Berserk!'); }
        if (state.enemyBurnRounds > 0) { spellBonusMult *= 1.3; spellTags.push('🔥 Burn Amplified!'); }
        if (spellBonusMult > 1.0) spellDmg = Math.max(5, Math.floor(spellDmg * spellBonusMult));
        state.conditionBonus = false;
        const spellBonusTag = spellTags.length > 0 ? ' ' + spellTags.join(' ') : '';

        // 35% chance to inflict freeze or poison on enemy
        const spellStatusTag: string[] = [];
        if (Math.random() < 0.35) {
          if (state.enemyFreezeRounds <= 0) {
            state.enemyFreezeRounds = Math.max(state.enemyFreezeRounds, 1);
            spellStatusTag.push('❄️ Enemy Frozen!');
          } else {
            state.enemyPoisonRounds = Math.max(state.enemyPoisonRounds, 3);
            spellStatusTag.push('🟣 Enemy Poisoned!');
          }
        }

        state.enemyHP = Math.max(0, state.enemyHP - spellDmg);
        const armorNote = state.enemyArmor > 0 ? ' [Magic bypasses armor!]' : '';
        const statusNote = spellStatusTag.length > 0 ? ' ' + spellStatusTag.join(' ') : '';
        return `Hero casts spell!${spellComboTag}${spellBonusTag}${armorNote} Enemy -${spellDmg} HP.${statusNote}`;
      }

      case 'power_strike': {
        this.applyCombo('power_strike', state);

        const effectiveArmorPS = state.enemyDefense + state.enemyArmor;
        let rawDmgPS = Math.max(1, Math.floor(state.heroAttack * 2 + variance()) - Math.floor(effectiveArmorPS * 0.5));

        // Apply bonus multipliers
        const psTags: string[] = [];
        let psBonusMult = 1.0;
        if (state.conditionBonus) { psBonusMult *= 1.5; psTags.push('⚡ Condition Bonus!'); }
        if (state.heroBerserkRounds > 0) { psBonusMult *= 1.5; psTags.push('💢 Berserk!'); }
        if (state.enemyBurnRounds > 0) { psBonusMult *= 1.3; psTags.push('🔥 Burn Amplified!'); }
        if (psBonusMult > 1.0) rawDmgPS = Math.max(1, Math.floor(rawDmgPS * psBonusMult));
        state.conditionBonus = false;
        const psBonusTag = psTags.length > 0 ? ' ' + psTags.join(' ') : '';

        const parriedPS = Math.random() * 100 < state.enemyParry;
        const finalDmgPS = parriedPS ? Math.max(1, Math.floor(rawDmgPS * 0.3)) : rawDmgPS;
        state.enemyHP = Math.max(0, state.enemyHP - finalDmgPS);

        // 20% chance to stun enemy
        if (Math.random() < 0.20) {
          state.enemyStunnedRounds = Math.max(state.enemyStunnedRounds, 2);
        }

        // 30% chance to inflict burn on enemy
        const psStatusTag: string[] = [];
        if (Math.random() < 0.30) {
          state.enemyBurnRounds = Math.max(state.enemyBurnRounds, 2);
          psStatusTag.push('🔥 Burn!');
        }

        let msg = `💥 Power Strike!${psBonusTag}`;
        msg += parriedPS ? ` Parried! Enemy -${finalDmgPS} HP.` : ` Enemy -${finalDmgPS} HP.`;
        if (state.enemyStunnedRounds > 0) msg += ` ⚡ Enemy Stunned!`;
        if (psStatusTag.length > 0) msg += ' ' + psStatusTag.join(' ');
        return msg;
      }

      case 'berserk': {
        this.applyCombo('berserk', state);
        state.heroBerserkRounds = 2;
        state.conditionBonus = false;
        return '💢 Hero enters BERSERK! DMG +50%, DEF -20% for 2 turns.';
      }

      case 'use_antidote': {
        this.applyCombo('use_antidote', state);
        if (state.antidotes <= 0) {
          return `💊 No Antidotes left!`;
        }
        state.antidotes--;
        const cured: string[] = [];
        if (state.heroBurnRounds > 0) { state.heroBurnRounds = 0; cured.push('🔥 Burn'); }
        if (state.heroPoisonRounds > 0) { state.heroPoisonRounds = 0; cured.push('🟣 Poison'); }
        if (state.heroFreezeRounds > 0) { state.heroFreezeRounds = 0; cured.push('❄️ Freeze'); }
        return cured.length > 0
          ? `💊 Antidote! Cured: ${cured.join(', ')} [${state.antidotes} left]`
          : `💊 Antidote used — no ailments to cure [${state.antidotes} left]`;
      }

      case 'use_potion': {
        this.applyCombo('use_potion', state);
        if (state.potions <= 0) {
          return `🧪 No Potions left!`;
        }
        state.potions--;
        const potionHeal = 30;
        state.heroHP = Math.min(state.heroMaxHP, state.heroHP + potionHeal);
        return `🧪 Potion! +${potionHeal} HP (${state.heroHP}/${state.heroMaxHP}) [${state.potions} left]`;
      }

      // ── KNIGHT SKILLS ─────────────────────────────────────────────
      case 'shield': {
        this.applyCombo('shield', state);
        state.conditionBonus = false;
        state.heroParry = Math.min(state.heroParry + 50, 90);
        return '🛡️ Iron Shield raised! Damage taken -50% this turn.';
      }
      case 'counter': {
        this.applyCombo('counter', state);
        state.conditionBonus = false;
        state.heroIsEvading = true;
        return '⚔️ Counter stance! Will reflect 40% of enemy damage.';
      }
      case 'war_cry': {
        this.applyCombo('war_cry', state);
        state.conditionBonus = false;
        state.heroBerserkRounds = Math.max(state.heroBerserkRounds, 2);
        return '📣 War Cry! ATK+40%, DEF-15% for 2 turns. Team is inspired!';
      }

      // ── MAGE SKILLS ────────────────────────────────────────────────
      case 'fireball': {
        const fbCombo = this.applyCombo('fireball', state);
        const fbCondMult = state.conditionBonus ? 1.5 : 1.0;
        const fbBerserkMult = state.heroBerserkRounds > 0 ? 1.5 : 1.0;
        const fbBurnMult = state.enemyBurnRounds > 0 ? 1.3 : 1.0;
        state.conditionBonus = false;
        const fbBaseDmg = Math.max(5, Math.floor(state.heroAttack * 1.6) + variance() - Math.floor(state.enemyDefense * 0.25));
        const fbFinalDmg = Math.floor(fbBaseDmg * fbCombo * fbCondMult * fbBerserkMult * fbBurnMult);
        state.enemyHP = Math.max(0, state.enemyHP - fbFinalDmg);
        if (Math.random() < 0.40) {
          state.enemyBurnRounds = Math.max(state.enemyBurnRounds, 3);
          return `🔥 Fireball! Enemy -${fbFinalDmg} HP. 🔥 Enemy ignited! (3 turns)`;
        }
        return `🔥 Fireball! Enemy -${fbFinalDmg} HP.`;
      }
      case 'frost_nova': {
        const fnCombo = this.applyCombo('frost_nova', state);
        const fnCondMult = state.conditionBonus ? 1.5 : 1.0;
        const fnBerserkMult = state.heroBerserkRounds > 0 ? 1.5 : 1.0;
        state.conditionBonus = false;
        const fnBaseDmg = Math.max(4, Math.floor(state.heroAttack * 1.4) + variance() - Math.floor(state.enemyDefense * 0.2));
        const fnFinalDmg = Math.floor(fnBaseDmg * fnCombo * fnCondMult * fnBerserkMult);
        state.enemyHP = Math.max(0, state.enemyHP - fnFinalDmg);
        state.enemyFreezeRounds = Math.max(state.enemyFreezeRounds, 1);
        return `❄️ Frost Nova! Enemy -${fnFinalDmg} HP. ❄️ Enemy Frozen 1 turn!`;
      }
      case 'arcane_surge': {
        const asCombo = this.applyCombo('arcane_surge', state);
        const asCondMult = state.conditionBonus ? 1.5 : 1.0;
        const asBerserkMult = state.heroBerserkRounds > 0 ? 1.5 : 1.0;
        state.conditionBonus = false;
        const asBaseDmg = Math.max(10, Math.floor(state.heroAttack * 2.5) + variance());
        const asFinalDmg = Math.floor(asBaseDmg * asCombo * asCondMult * asBerserkMult);
        state.enemyHP = Math.max(0, state.enemyHP - asFinalDmg);
        return `✨ Arcane Surge! Pure magic burst! Enemy -${asFinalDmg} HP. [Ignores all armor!]`;
      }

      // ── ROGUE SKILLS ───────────────────────────────────────────────
      case 'backstab': {
        const bsCombo = this.applyCombo('backstab', state);
        const bsCondMult = state.conditionBonus ? 1.5 : 1.0;
        const bsBerserkMult = state.heroBerserkRounds > 0 ? 1.5 : 1.0;
        state.conditionBonus = false;
        const bsEffectiveArmor = state.enemyDefense + state.enemyArmor;
        const isSoftCC = state.enemyFreezeRounds > 0 || state.enemyStunnedRounds > 0;
        const bsCCMult = isSoftCC ? 2.0 : 1.0;
        const bsBaseDmg = Math.max(1, Math.floor(state.heroAttack * 1.2 + variance()) - Math.floor(bsEffectiveArmor * 0.5));
        const bsFinalDmg = Math.floor(bsBaseDmg * bsCombo * bsCCMult * bsCondMult * bsBerserkMult);
        state.enemyHP = Math.max(0, state.enemyHP - bsFinalDmg);
        const bsCCTag = isSoftCC ? ' ⚡ Backstab! 2x damage on disabled enemy!' : '';
        return `🗡️ Backstab!${bsCCTag} Enemy -${bsFinalDmg} HP.`;
      }
      case 'poison_strike': {
        this.applyCombo('poison_strike', state);
        state.conditionBonus = false;
        const psEffectiveArmor = state.enemyDefense + state.enemyArmor;
        const psBaseDmg = Math.max(1, Math.floor(state.heroAttack * 0.9 + variance()) - Math.floor(psEffectiveArmor * 0.5));
        state.enemyHP = Math.max(0, state.enemyHP - psBaseDmg);
        state.enemyPoisonRounds = Math.max(state.enemyPoisonRounds, 3);
        return `🟣 Poison Strike! Enemy -${psBaseDmg} HP. 🟣 Poisoned 3 turns!`;
      }
      case 'shadow_step': {
        this.applyCombo('shadow_step', state);
        const ssCondMult = state.conditionBonus ? 1.5 : 1.0;
        const ssBerserkMult = state.heroBerserkRounds > 0 ? 1.5 : 1.0;
        state.conditionBonus = false;
        state.heroIsEvading = true;
        const ssEffectiveArmor = state.enemyDefense + state.enemyArmor;
        const ssBaseDmg = Math.max(1, Math.floor(state.heroAttack * 1.3 + variance()) - Math.floor(ssEffectiveArmor * 0.5));
        const ssFinalDmg = Math.floor(ssBaseDmg * ssCondMult * ssBerserkMult);
        state.enemyHP = Math.max(0, state.enemyHP - ssFinalDmg);
        return `👤 Shadow Step! Vanish + strike from shadows. Enemy -${ssFinalDmg} HP. (Evade active!)`;
      }

      // ── BARBARIAN SKILLS ───────────────────────────────────────────
      case 'whirlwind': {
        this.applyCombo('whirlwind', state);
        const wwCondMult = state.conditionBonus ? 1.5 : 1.0;
        const wwBerserkMult = state.heroBerserkRounds > 0 ? 1.5 : 1.0;
        const wwBurnMult = state.enemyBurnRounds > 0 ? 1.3 : 1.0;
        state.conditionBonus = false;
        const wwEffectiveArmor = state.enemyDefense + state.enemyArmor;
        let wwTotalDmg = 0;
        for (let i = 0; i < 3; i++) {
          const hit = Math.max(1, Math.floor(state.heroAttack * 0.7 + variance()) - Math.floor(wwEffectiveArmor * 0.3));
          wwTotalDmg += Math.floor(hit * wwCondMult * wwBerserkMult * wwBurnMult);
        }
        state.enemyHP = Math.max(0, state.enemyHP - wwTotalDmg);
        return `🌪️ Whirlwind! 3 rapid strikes! Enemy -${wwTotalDmg} HP total.`;
      }
      case 'bloodthirst': {
        this.applyCombo('bloodthirst', state);
        const btCondMult = state.conditionBonus ? 1.5 : 1.0;
        const btBerserkMult = state.heroBerserkRounds > 0 ? 1.5 : 1.0;
        const btBurnMult = state.enemyBurnRounds > 0 ? 1.3 : 1.0;
        state.conditionBonus = false;
        const btEffectiveArmor = state.enemyDefense + state.enemyArmor;
        const btBaseDmg = Math.max(1, Math.floor(state.heroAttack * 1.3 + variance()) - Math.floor(btEffectiveArmor * 0.5));
        const btFinalDmg = Math.floor(btBaseDmg * btCondMult * btBerserkMult * btBurnMult);
        state.enemyHP = Math.max(0, state.enemyHP - btFinalDmg);
        const btHealAmt = Math.floor(btFinalDmg * 0.5);
        state.heroHP = Math.min(state.heroMaxHP, state.heroHP + btHealAmt);
        return `🩸 Bloodthirst! Enemy -${btFinalDmg} HP. Hero +${btHealAmt} HP (lifesteal)!`;
      }
      case 'battle_cry': {
        this.applyCombo('battle_cry', state);
        state.conditionBonus = false;
        state.heroBerserkRounds = Math.max(state.heroBerserkRounds, 3);
        state.enemyStunnedRounds = Math.max(state.enemyStunnedRounds, 1);
        return `💥 Battle Cry! Berserk 3 turns + ⚡ Enemy Stunned 1 turn!`;
      }

      // Phase 4: Debug block — removes virus nodes (handled by BattleScreen)
      case 'debug_block': {
        this.applyCombo('debug_block', state);
        state.conditionBonus = false;
        return '🔧 Debug Block executed! Scanning for virus nodes...';
      }

      default:
        return `Hero uses ${action}`;
    }
  }

  private evaluateCondition(node: FlowNode, state: BattleState): boolean {
    const threshold = node.data.threshold ?? 50;
    switch (node.data.conditionType) {
      case 'hp_greater': return state.heroHP > threshold;
      case 'hp_less': return state.heroHP < threshold;
      case 'enemy_alive': return state.enemyHP > 0;
      case 'enemy_close': return true;
      // Ailment conditions
      case 'hero_burning': return state.heroBurnRounds > 0;
      case 'hero_poisoned': return state.heroPoisonRounds > 0;
      case 'hero_frozen': return state.heroFreezeRounds > 0;
      case 'enemy_stunned': return state.enemyStunnedRounds > 0;
      // Enemy status conditions
      case 'enemy_burning': return state.enemyBurnRounds > 0;
      case 'enemy_frozen': return state.enemyFreezeRounds > 0;
      case 'enemy_poisoned': return state.enemyPoisonRounds > 0;
      // Shop conditions
      case 'gold_greater': return state.gold > threshold;
      case 'gold_less': return state.gold < threshold;
      // Turn counter — true when current turn >= threshold (teaches loop counting)
      case 'turn_gte': return state.currentTurn >= threshold;
      // Phase 4: virus condition — evaluated externally via store; default false
      case 'is_corrupted': return false;
      default: return true;
    }
  }

  private evaluateLoop(node: FlowNode, state: BattleState): boolean {
    switch (node.data.loopType) {
      case 'repeat': {
        const count = this.loopCounters.get(node.id) ?? 0;
        const max = node.data.loopCount ?? 3;
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

/** Execute enemy's action for its turn in turn-based mode */
export function executeEnemyAction(
  behavior: string,
  state: BattleState,
): { newState: BattleState; log: string } {
  const s = { ...state };
  const variance = () => Math.floor(Math.random() * 5) - 2;

  // Process enemy status ticks before enemy acts
  const tickLogs: string[] = [];
  if (s.enemyFreezeRounds > 0) {
    s.enemyFreezeRounds--;
    return { newState: s, log: `❄️ Enemy is frozen! Skips turn. (${s.enemyFreezeRounds} left)` };
  }
  if (s.enemyBurnRounds > 0) {
    const burnDmg = Math.max(3, Math.floor(s.enemyAttack * 0.15));
    s.enemyHP = Math.max(0, s.enemyHP - burnDmg);
    s.enemyBurnRounds--;
    tickLogs.push(`🔥 Enemy burn! -${burnDmg} HP (${s.enemyBurnRounds} left)`);
  }
  if (s.enemyPoisonRounds > 0) {
    s.enemyHP = Math.max(0, s.enemyHP - 3);
    s.enemyPoisonRounds--;
    tickLogs.push(`🟣 Enemy poison! -3 HP (${s.enemyPoisonRounds} left)`);
  }

  // If enemy died from status ticks, skip action
  if (s.enemyHP <= 0) {
    return { newState: s, log: tickLogs.join(' | ') + ' Enemy defeated by status!' };
  }

  // Dodge/evade: hero prepared to evade → 65% chance to reduce damage
  const heroEvades = s.heroIsEvading && Math.random() < 0.65;
  s.heroIsEvading = false; // consume dodge

  const tickPrefix = tickLogs.length > 0 ? tickLogs.join(' | ') + ' | ' : '';

  switch (behavior) {
    case 'attack': {
      const rawDmg = Math.max(0, s.enemyAttack + variance() - Math.floor(s.heroDefense * 0.5));
      const heroParried = Math.random() * 100 < s.heroParry;
      let finalDmg = heroParried ? 0 : heroEvades ? Math.floor(rawDmg * 0.35) : rawDmg;
      // Berserk reduces damage taken by 20%
      if (s.heroBerserkRounds > 0 && finalDmg > 0) finalDmg = Math.max(1, Math.floor(finalDmg * 0.8));
      if (!heroParried && finalDmg > 0 && s.enemyAilmentType && Math.random() < s.enemyAilmentChance) {
        if (s.enemyAilmentType === 'burn') s.heroBurnRounds = Math.max(s.heroBurnRounds, 3);
        if (s.enemyAilmentType === 'freeze') s.heroFreezeRounds = Math.max(s.heroFreezeRounds, 2);
        if (s.enemyAilmentType === 'poison') s.heroPoisonRounds = Math.max(s.heroPoisonRounds, 5);
      }
      s.heroHP = Math.max(0, s.heroHP - finalDmg);
      const evadeTag = heroEvades ? ' (Evaded! -65%)' : '';
      const berserkTag = s.heroBerserkRounds > 0 ? ' (🛡️ Berserk -20%)' : '';
      const ailMap: Record<string, string> = { burn: ' 🔥 Burn!', freeze: ' ❄️ Freeze!', poison: ' 🟣 Poison!' };
      const ailTag = (!heroParried && finalDmg > 0 && s.enemyAilmentType && Math.random() < s.enemyAilmentChance) ? (ailMap[s.enemyAilmentType] ?? '') : '';
      const baseLog = heroParried ? '🛡️ Hero parries the attack!' : `👹 Enemy attacks! Hero -${finalDmg} HP${evadeTag}${berserkTag}${ailTag}`;
      return { newState: s, log: tickPrefix + baseLog };
    }
    case 'heal': {
      const healAmt = Math.floor(s.enemyMaxHP * 0.12);
      s.enemyHP = Math.min(s.enemyMaxHP, s.enemyHP + healAmt);
      return { newState: s, log: tickPrefix + `👹 Enemy heals! +${healAmt} HP (${s.enemyHP}/${s.enemyMaxHP})` };
    }
    case 'cast_spell': {
      const spellDmg = Math.max(1, Math.floor(s.enemyAttack * 1.5 + variance()) - Math.floor(s.heroDefense * 0.25));
      let finalSpellDmg = heroEvades ? Math.floor(spellDmg * 0.35) : spellDmg;
      // Berserk reduces damage taken by 20%
      if (s.heroBerserkRounds > 0 && finalSpellDmg > 0) finalSpellDmg = Math.max(1, Math.floor(finalSpellDmg * 0.8));
      if (finalSpellDmg > 0 && s.enemyAilmentType && Math.random() < s.enemyAilmentChance * 1.5) {
        if (s.enemyAilmentType === 'burn') s.heroBurnRounds = Math.max(s.heroBurnRounds, 3);
        if (s.enemyAilmentType === 'freeze') s.heroFreezeRounds = Math.max(s.heroFreezeRounds, 2);
        if (s.enemyAilmentType === 'poison') s.heroPoisonRounds = Math.max(s.heroPoisonRounds, 5);
      }
      s.heroHP = Math.max(0, s.heroHP - finalSpellDmg);
      const evadeTag2 = heroEvades ? ' (Evaded! -65%)' : '';
      const berserkTag2 = s.heroBerserkRounds > 0 ? ' (🛡️ Berserk -20%)' : '';
      return { newState: s, log: tickPrefix + `✨ Enemy casts spell! Hero -${finalSpellDmg} HP${evadeTag2}${berserkTag2}` };
    }
    // Guaranteed ailment strikes (cost 1 budget each)
    case 'poison_strike': {
      const rawDmg = Math.max(0, Math.floor(s.enemyAttack * 0.7 + variance()) - Math.floor(s.heroDefense * 0.5));
      const heroParried = Math.random() * 100 < s.heroParry;
      let finalDmg = heroParried ? 0 : heroEvades ? Math.floor(rawDmg * 0.35) : rawDmg;
      if (s.heroBerserkRounds > 0 && finalDmg > 0) finalDmg = Math.max(1, Math.floor(finalDmg * 0.8));
      if (!heroParried) s.heroPoisonRounds = Math.max(s.heroPoisonRounds, 5);
      s.heroHP = Math.max(0, s.heroHP - finalDmg);
      const bTag = s.heroBerserkRounds > 0 ? ' (🛡️ Berserk -20%)' : '';
      return { newState: s, log: tickPrefix + (heroParried ? '🛡️ Hero parries the poison strike!' : `🟣 Enemy poison strike! Hero -${finalDmg} HP${bTag} + Poison (5 rounds)`) };
    }
    case 'freeze_strike': {
      const rawDmg = Math.max(0, Math.floor(s.enemyAttack * 0.6 + variance()) - Math.floor(s.heroDefense * 0.5));
      const heroParried = Math.random() * 100 < s.heroParry;
      let finalDmg = heroParried ? 0 : heroEvades ? Math.floor(rawDmg * 0.35) : rawDmg;
      if (s.heroBerserkRounds > 0 && finalDmg > 0) finalDmg = Math.max(1, Math.floor(finalDmg * 0.8));
      if (!heroParried) s.heroFreezeRounds = Math.max(s.heroFreezeRounds, 2);
      s.heroHP = Math.max(0, s.heroHP - finalDmg);
      const bTag = s.heroBerserkRounds > 0 ? ' (🛡️ Berserk -20%)' : '';
      return { newState: s, log: tickPrefix + (heroParried ? '🛡️ Hero parries the freeze strike!' : `❄️ Enemy freeze strike! Hero -${finalDmg} HP${bTag} + Freeze (2 rounds)`) };
    }
    case 'burn_strike': {
      const rawDmg = Math.max(0, Math.floor(s.enemyAttack * 0.65 + variance()) - Math.floor(s.heroDefense * 0.5));
      const heroParried = Math.random() * 100 < s.heroParry;
      let finalDmg = heroParried ? 0 : heroEvades ? Math.floor(rawDmg * 0.35) : rawDmg;
      if (s.heroBerserkRounds > 0 && finalDmg > 0) finalDmg = Math.max(1, Math.floor(finalDmg * 0.8));
      if (!heroParried) s.heroBurnRounds = Math.max(s.heroBurnRounds, 3);
      s.heroHP = Math.max(0, s.heroHP - finalDmg);
      const bTag = s.heroBerserkRounds > 0 ? ' (🛡️ Berserk -20%)' : '';
      return { newState: s, log: tickPrefix + (heroParried ? '🛡️ Hero parries the burn strike!' : `🔥 Enemy burn strike! Hero -${finalDmg} HP${bTag} + Burn (3 rounds)`) };
    }
    case 'power_strike': {
      const rawDmg = Math.max(1, Math.floor(s.enemyAttack * 2.0 + variance()) - Math.floor(s.heroDefense * 0.5));
      const heroParried = Math.random() * 100 < s.heroParry;
      let finalDmg = heroParried ? 0 : heroEvades ? Math.floor(rawDmg * 0.35) : rawDmg;
      if (s.heroBerserkRounds > 0 && finalDmg > 0) finalDmg = Math.max(1, Math.floor(finalDmg * 0.8));
      s.heroHP = Math.max(0, s.heroHP - finalDmg);
      const evTag = heroEvades ? ' (Evaded! -65%)' : '';
      const bTag = s.heroBerserkRounds > 0 ? ' (🛡️ Berserk -20%)' : '';
      return { newState: s, log: tickPrefix + (heroParried ? '🛡️ Hero parries the power strike!' : `💥 Enemy power strike! Hero -${finalDmg} HP${evTag}${bTag}`) };
    }
    default:
      return { newState: s, log: tickPrefix + '👹 Enemy prepares...' };
  }
}

/** Cost of each enemy behavior in budget points */
export const ENEMY_ACTION_COST: Record<string, number> = {
  attack: 1, poison_strike: 1, freeze_strike: 1, burn_strike: 1,
  heal: 2, cast_spell: 2, power_strike: 2,
};

/** Execute all enemy actions for one turn given a budget, returns all results */
export function executeEnemyTurn(
  behaviors: string[],
  behaviorIdx: number,
  budget: number,
  state: BattleState,
): { newState: BattleState; logs: string[]; actionsUsed: number } {
  let s = { ...state };
  const logs: string[] = [];
  let budgetLeft = budget;
  let used = 0;

  // Process enemy status ticks once at turn start
  if (s.enemyFreezeRounds > 0) {
    s.enemyFreezeRounds--;
    return { newState: s, logs: [`❄️ Enemy is frozen! Skips turn. (${s.enemyFreezeRounds} left)`], actionsUsed: 0 };
  }

  while (budgetLeft > 0) {
    const behavior = behaviors[(behaviorIdx + used) % behaviors.length];
    const cost = ENEMY_ACTION_COST[behavior] ?? 1;
    if (cost > budgetLeft) break; // can't afford next action

    const { newState, log } = executeEnemyAction(behavior, s);
    s = newState;
    logs.push(log);
    used++;
    budgetLeft -= cost;

    if (s.enemyHP <= 0 || s.heroHP <= 0) break; // battle ended
  }

  if (used === 0) {
    // budget too small for cheapest action, execute one attack anyway
    const { newState, log } = executeEnemyAction('attack', s);
    s = newState;
    logs.push(log);
    used = 1;
  }

  return { newState: s, logs, actionsUsed: used };
}

/** Resolve hero status effects at end of turn (burn, poison, freeze, berserk) */
export function resolveHeroStatuses(state: BattleState): { newState: BattleState; logs: string[] } {
  const s = { ...state };
  const logs: string[] = [];
  if (s.heroBurnRounds > 0) {
    const dmg = 5;
    s.heroHP = Math.max(0, s.heroHP - dmg);
    s.heroBurnRounds--;
    logs.push(`🔥 Burn ticks! Hero -${dmg} HP (${s.heroBurnRounds} rounds left)`);
  }
  if (s.heroPoisonRounds > 0) {
    const dmg = 3;
    s.heroHP = Math.max(0, s.heroHP - dmg);
    s.heroPoisonRounds--;
    logs.push(`🟣 Poison ticks! Hero -${dmg} HP (${s.heroPoisonRounds} rounds left)`);
  }
  if (s.heroFreezeRounds > 0) {
    s.heroFreezeRounds--;
    logs.push(`❄️ Freeze fades (${s.heroFreezeRounds} rounds left)`);
  }
  if (s.heroBerserkRounds > 0) {
    s.heroBerserkRounds--;
    if (s.heroBerserkRounds === 0) logs.push('💢 Berserk fades.');
  }
  return { newState: s, logs };
}
