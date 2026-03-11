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
  // Enemy ailment infliction
  enemyAilmentType: string;   // 'burn'|'freeze'|'poison'|''
  enemyAilmentChance: number; // 0-1 probability per hit
  // Inventory (from shop)
  antidotes: number;
  potions: number;
  // Gold (for shop conditions in shop flowchart)
  gold: number;
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
    // Annotate with what the condition checks (for preview display)
    const ct = node.data.conditionType;
    const th = node.data.threshold ?? 50;
    let condNote = '';
    if (ct === 'mana_greater') condNote = `Mana > ${th}`;
    else if (ct === 'mana_less') condNote = `Mana < ${th}`;
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

      // ===== Pre-action: ailment ticks + freeze skip (only on action nodes) =====
      let preLog = '';
      if (node.type === 'action') {
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
          step.heroMana = state.heroMana;
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

      step.heroHP   = state.heroHP;
      step.enemyHP  = state.enemyHP;
      step.heroMana = state.heroMana;
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

    switch (action) {
      case 'attack': {
        const comboMult = this.applyCombo('attack', state);
        const comboTag = comboMult >= 1.75 ? ' ⚡ Counter Strike!' : comboMult >= 1.5 ? ' ⚡ Combo x3!' : comboMult >= 1.25 ? ' ⚡ Combo x2!' : '';

        // Shield check — blocked if required blocks are missing
        if (state.enemyShielded) {
          const counterDmg = Math.max(0, state.enemyAttack + variance() - Math.floor(state.heroDefense * 0.5));
          const heroParried = Math.random() * 100 < state.heroParry;
          const finalCounter = heroParried ? 0 : counterDmg;
          state.heroHP = Math.max(0, state.heroHP - finalCounter);
          state.heroMana = Math.min(state.heroMaxMana, state.heroMana + state.manaRegen);
          return `🛡️ Shield blocks the attack! (${state.shieldReason}) Enemy counters! Hero -${finalCounter} HP.`;
        }

        // Physical damage: reduced by defense + armor, boosted by combo
        const effectiveArmor = state.enemyDefense + state.enemyArmor;
        const rawDmg = Math.max(1, Math.floor((state.heroAttack + variance()) * comboMult) - Math.floor(effectiveArmor * 0.5));

        // Enemy parry check
        const parried = Math.random() * 100 < state.enemyParry;
        const finalDmg = parried ? Math.max(1, Math.floor(rawDmg * 0.3)) : rawDmg;
        state.enemyHP = Math.max(0, state.enemyHP - finalDmg);

        // Enemy counter-attack (skipped if stunned)
        let finalCounter = 0;
        let heroParried = false;
        if (state.enemyStunnedRounds <= 0) {
          const counterDmg = Math.max(0, state.enemyAttack + variance() - Math.floor(state.heroDefense * 0.5));
          heroParried = Math.random() * 100 < state.heroParry;
          finalCounter = heroParried ? 0 : counterDmg;
          state.heroHP = Math.max(0, state.heroHP - finalCounter);

          // Enemy ailment infliction on hit
          if (state.enemyAilmentType && !heroParried && finalCounter > 0 && Math.random() < state.enemyAilmentChance) {
            if (state.enemyAilmentType === 'burn')   { state.heroBurnRounds   = Math.max(state.heroBurnRounds, 3);   }
            if (state.enemyAilmentType === 'freeze')  { state.heroFreezeRounds = Math.max(state.heroFreezeRounds, 2); }
            if (state.enemyAilmentType === 'poison')  { state.heroPoisonRounds = Math.max(state.heroPoisonRounds, 5); }
          }
        }
        state.heroMana = Math.min(state.heroMaxMana, state.heroMana + state.manaRegen);

        let msg = `Hero attacks!${comboTag}`;
        if (state.enemyArmor > 0) msg += ` [Armor]`;
        msg += parried ? ` Parried! Enemy -${finalDmg} HP.` : ` Enemy -${finalDmg} HP.`;
        if (state.enemyStunnedRounds <= 0) {
          if (heroParried) msg += ` Hero parries counter!`;
          else if (finalCounter > 0) {
            msg += ` Enemy counters! Hero -${finalCounter} HP.`;
            if (state.enemyAilmentType && Math.random() < state.enemyAilmentChance) {
              const ailMap: Record<string, string> = { burn: '🔥 Burn!', freeze: '❄️ Freeze!', poison: '🟣 Poison!' };
              msg += ` ${ailMap[state.enemyAilmentType] ?? ''}`;
            }
          }
        } else {
          msg += ` Enemy stunned — no counter!`;
        }
        return msg;
      }

      case 'heal': {
        this.applyCombo('heal', state);
        if (state.healCharges <= 0) {
          state.heroMana = Math.min(state.heroMaxMana, state.heroMana + state.manaRegen);
          return `💊 No Heal Charges left! (0/3)`;
        }
        state.healCharges--;
        const healAmt = 20 + variance();
        state.heroHP = Math.min(state.heroMaxHP, state.heroHP + healAmt);
        state.heroMana = Math.min(state.heroMaxMana, state.heroMana + state.manaRegen);
        return `Hero heals! +${healAmt} HP (${state.heroHP}/${state.heroMaxHP}) [${state.healCharges} heals left]`;
      }

      case 'dodge': {
        this.applyCombo('dodge', state);
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
        const spellCombo = this.applyCombo('cast_spell', state);
        const spellComboTag = spellCombo >= 1.5 ? ' ⚡ Chain Magic!' : spellCombo >= 1.25 ? ' ⚡ Spell Combo!' : '';

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
          const spellDmg = Math.max(3, Math.floor(Math.floor(state.heroAttack * 1.8 * spellCombo) * 0.6) + variance() - Math.floor(state.enemyDefense * 0.25));
          state.enemyHP = Math.max(0, state.enemyHP - spellDmg);
          state.heroMana = Math.min(state.heroMaxMana, state.heroMana + state.manaRegen);
          return `⚠️ Low mana! Hero casts weak spell!${spellComboTag} Enemy -${spellDmg} HP. (reduced dmg)`;
        }

        // Spend 25 mana
        state.heroMana = Math.min(state.heroMaxMana, Math.max(0, state.heroMana - 25) + state.manaRegen);

        // Magic ignores armor, boosted by combo
        const spellDmg = Math.max(5, Math.floor(state.heroAttack * 1.8 * spellCombo) + variance() - Math.floor(state.enemyDefense * 0.25));
        state.enemyHP = Math.max(0, state.enemyHP - spellDmg);

        // Counter 40% chance (skipped if stunned)
        const armorNote = state.enemyArmor > 0 ? ' [Magic bypasses armor!]' : '';
        if (state.enemyStunnedRounds <= 0 && Math.random() < 0.4) {
          const counterDmg = Math.max(0, state.enemyAttack + variance() - Math.floor(state.heroDefense * 0.5));
          state.heroHP = Math.max(0, state.heroHP - counterDmg);
          // Ailment infliction on counter
          if (state.enemyAilmentType && counterDmg > 0 && Math.random() < state.enemyAilmentChance) {
            if (state.enemyAilmentType === 'burn')   state.heroBurnRounds   = Math.max(state.heroBurnRounds, 3);
            if (state.enemyAilmentType === 'freeze')  state.heroFreezeRounds = Math.max(state.heroFreezeRounds, 2);
            if (state.enemyAilmentType === 'poison')  state.heroPoisonRounds = Math.max(state.heroPoisonRounds, 5);
          }
          return `Hero casts spell!${spellComboTag}${armorNote} Enemy -${spellDmg} HP. Enemy counters! Hero -${counterDmg} HP.`;
        }
        return `Hero casts spell!${spellComboTag}${armorNote} Enemy -${spellDmg} HP.${state.enemyStunnedRounds > 0 ? ' Enemy stunned — no counter!' : ' (Enemy missed counter!)'}`;
      }

      case 'power_strike': {
        // Cooldown check: if on cooldown, do a normal attack instead
        if (state.powerStrikeCooldown > 0) {
          const comboMult2 = this.applyCombo('attack', state);
          const ea2 = state.enemyDefense + state.enemyArmor;
          const rawDmg2 = Math.max(1, Math.floor((state.heroAttack + variance()) * comboMult2) - Math.floor(ea2 * 0.5));
          const parried2 = Math.random() * 100 < state.enemyParry;
          const finalDmg2 = parried2 ? Math.max(1, Math.floor(rawDmg2 * 0.3)) : rawDmg2;
          state.enemyHP = Math.max(0, state.enemyHP - finalDmg2);
          const cDmg2 = state.enemyStunnedRounds > 0 ? 0 : Math.max(0, state.enemyAttack + variance() - Math.floor(state.heroDefense * 0.5));
          state.heroHP = Math.max(0, state.heroHP - cDmg2);
          state.heroMana = Math.min(state.heroMaxMana, state.heroMana + state.manaRegen);
          return `⏳ Power Strike on cooldown (${state.powerStrikeCooldown} steps) → normal attack. Enemy -${finalDmg2} HP.`;
        }

        if (state.heroMana >= 20) {
          const comboMult = this.applyCombo('power_strike', state);
          const comboTag = comboMult > 1 ? ` ⚡ Combo!` : '';
          // Spend 20 mana, deal 2x damage + combo
          state.heroMana = Math.min(state.heroMaxMana, Math.max(0, state.heroMana - 20) + state.manaRegen);
          state.powerStrikeCooldown = 4; // 4 steps cooldown

          const effectiveArmor = state.enemyDefense + state.enemyArmor;
          const rawDmg = Math.max(1, Math.floor((state.heroAttack * 2 + variance()) * comboMult) - Math.floor(effectiveArmor * 0.5));

          const parried = Math.random() * 100 < state.enemyParry;
          const finalDmg = parried ? Math.max(1, Math.floor(rawDmg * 0.3)) : rawDmg;
          state.enemyHP = Math.max(0, state.enemyHP - finalDmg);

          // 20% chance to stun enemy
          if (Math.random() < 0.20) {
            state.enemyStunnedRounds = Math.max(state.enemyStunnedRounds, 2);
          }

          let finalCounter = 0;
          let heroParried = false;
          if (state.enemyStunnedRounds <= 0) {
            const counterDmg = Math.max(0, state.enemyAttack + variance() - Math.floor(state.heroDefense * 0.5));
            heroParried = Math.random() * 100 < state.heroParry;
            finalCounter = heroParried ? 0 : counterDmg;
            state.heroHP = Math.max(0, state.heroHP - finalCounter);
            // Enemy ailment infliction
            if (state.enemyAilmentType && !heroParried && finalCounter > 0 && Math.random() < state.enemyAilmentChance) {
              if (state.enemyAilmentType === 'burn')   state.heroBurnRounds   = Math.max(state.heroBurnRounds, 3);
              if (state.enemyAilmentType === 'freeze')  state.heroFreezeRounds = Math.max(state.heroFreezeRounds, 2);
              if (state.enemyAilmentType === 'poison')  state.heroPoisonRounds = Math.max(state.heroPoisonRounds, 5);
            }
          }

          let msg = `💥 Power Strike!${comboTag}`;
          msg += parried ? ` Parried! Enemy -${finalDmg} HP.` : ` Enemy -${finalDmg} HP.`;
          if (state.enemyStunnedRounds > 0) msg += ` ⚡ Enemy Stunned!`;
          else if (heroParried) msg += ` Hero parries counter!`;
          else if (finalCounter > 0) msg += ` Enemy counters! Hero -${finalCounter} HP.`;
          return msg;
        }

        // Not enough mana — normal attack
        this.applyCombo('attack', state);
        state.heroMana = Math.min(state.heroMaxMana, state.heroMana + state.manaRegen);

        const effectiveArmor = state.enemyDefense + state.enemyArmor;
        const rawDmg = Math.max(1, state.heroAttack + variance() - Math.floor(effectiveArmor * 0.5));

        const parried = Math.random() * 100 < state.enemyParry;
        const finalDmg = parried ? Math.max(1, Math.floor(rawDmg * 0.3)) : rawDmg;
        state.enemyHP = Math.max(0, state.enemyHP - finalDmg);

        const counterDmg = state.enemyStunnedRounds > 0 ? 0 : Math.max(0, state.enemyAttack + variance() - Math.floor(state.heroDefense * 0.5));
        const heroParried = Math.random() * 100 < state.heroParry;
        const finalCounter = heroParried ? 0 : counterDmg;
        state.heroHP = Math.max(0, state.heroHP - finalCounter);

        let msg2 = `⚠️ Not enough mana → normal attack!`;
        msg2 += parried ? ` Parried! Enemy -${finalDmg} HP.` : ` Enemy -${finalDmg} HP.`;
        if (heroParried) msg2 += ` Hero parries counter!`;
        else if (finalCounter > 0) msg2 += ` Enemy counters! Hero -${finalCounter} HP.`;
        return msg2;
      }

      case 'use_antidote': {
        this.applyCombo('use_antidote', state);
        if (state.antidotes <= 0) {
          return `💊 No Antidotes left!`;
        }
        state.antidotes--;
        const cured: string[] = [];
        if (state.heroBurnRounds > 0)   { state.heroBurnRounds   = 0; cured.push('🔥 Burn');   }
        if (state.heroPoisonRounds > 0) { state.heroPoisonRounds = 0; cured.push('🟣 Poison');  }
        if (state.heroFreezeRounds > 0) { state.heroFreezeRounds = 0; cured.push('❄️ Freeze');  }
        state.heroMana = Math.min(state.heroMaxMana, state.heroMana + state.manaRegen);
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
        state.heroMana = Math.min(state.heroMaxMana, state.heroMana + state.manaRegen);
        return `🧪 Potion! +${potionHeal} HP (${state.heroHP}/${state.heroMaxHP}) [${state.potions} left]`;
      }

      default:
        return `Hero uses ${action}`;
    }
  }

  private evaluateCondition(node: FlowNode, state: BattleState): boolean {
    const threshold = node.data.threshold ?? 50;
    switch (node.data.conditionType) {
      case 'hp_greater':    return state.heroHP > threshold;
      case 'hp_less':       return state.heroHP < threshold;
      case 'mana_greater':  return state.heroMana > threshold;
      case 'mana_less':     return state.heroMana < threshold;
      case 'enemy_alive':   return state.enemyHP > 0;
      case 'enemy_close':   return true;
      // Ailment conditions
      case 'hero_burning':  return state.heroBurnRounds > 0;
      case 'hero_poisoned': return state.heroPoisonRounds > 0;
      case 'hero_frozen':   return state.heroFreezeRounds > 0;
      case 'enemy_stunned': return state.enemyStunnedRounds > 0;
      // Shop conditions
      case 'gold_greater':  return state.gold > threshold;
      case 'gold_less':     return state.gold < threshold;
      default:              return true;
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
