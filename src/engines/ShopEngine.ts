import type { FlowNode, FlowEdge } from '../types/game.types';

export interface ShopState {
  gold: number;
  potions: number;
  antidotes: number;
  attackBonus: number;
}

export interface ShopResult {
  finalState: ShopState;
  log: string[];
}

/** Prices for shop items */
export const SHOP_PRICES = {
  buy_potion:   30,
  buy_antidote: 20,
  buy_scroll:   50, // +5 ATK for next battle
};

export const SHOP_ITEMS = [
  { actionType: 'buy_potion',   label: '🧪 Potion',       price: SHOP_PRICES.buy_potion,   description: 'ฟื้น 30 HP ในการสู้รบ',       icon: '🧪' },
  { actionType: 'buy_antidote', label: '💊 Antidote',     price: SHOP_PRICES.buy_antidote, description: 'แก้สถานะ Burn/Poison/Freeze', icon: '💊' },
  { actionType: 'buy_scroll',   label: '📜 Attack Scroll', price: SHOP_PRICES.buy_scroll,   description: '+5 ATK สำหรับการสู้รบถัดไป', icon: '📜' },
];

export class ShopEngine {
  private nodes: Map<string, FlowNode>;
  private edges: FlowEdge[];
  private maxSteps = 50;

  constructor(nodes: FlowNode[], edges: FlowEdge[]) {
    this.nodes = new Map(nodes.map((n) => [n.id, n]));
    this.edges = edges;
  }

  execute(initialState: ShopState): ShopResult {
    const log: string[] = [];
    const state = { ...initialState };
    let stepCount = 0;

    const startNode = Array.from(this.nodes.values()).find((n) => n.type === 'start');
    if (!startNode) return { finalState: state, log: ['No start node'] };

    let currentId: string | null = startNode.id;

    while (currentId && stepCount < this.maxSteps) {
      const node = this.nodes.get(currentId);
      if (!node) break;
      stepCount++;

      if (node.type === 'end') break;

      if (node.type === 'action') {
        const aType = node.data.actionType;
        const entry = this.executeShopAction(aType ?? '', state, log);
        if (entry) log.push(entry);
        currentId = this.next(currentId, undefined);
        continue;
      }

      if (node.type === 'condition') {
        const result = this.evaluateCondition(node, state);
        currentId = this.next(currentId, result);
        continue;
      }

      // start/loop/other — just follow first edge
      currentId = this.next(currentId, undefined);
    }

    return { finalState: state, log };
  }

  private executeShopAction(actionType: string, state: ShopState, _log: string[]): string {
    switch (actionType) {
      case 'buy_potion': {
        if (state.gold < SHOP_PRICES.buy_potion) return `❌ ซื้อ Potion ไม่ได้ — เงินไม่พอ (${state.gold}/${SHOP_PRICES.buy_potion}g)`;
        state.gold -= SHOP_PRICES.buy_potion;
        state.potions++;
        return `✅ ซื้อ Potion! [-${SHOP_PRICES.buy_potion}g] เหลือ ${state.gold}g | Potions: ${state.potions}`;
      }
      case 'buy_antidote': {
        if (state.gold < SHOP_PRICES.buy_antidote) return `❌ ซื้อ Antidote ไม่ได้ — เงินไม่พอ (${state.gold}/${SHOP_PRICES.buy_antidote}g)`;
        state.gold -= SHOP_PRICES.buy_antidote;
        state.antidotes++;
        return `✅ ซื้อ Antidote! [-${SHOP_PRICES.buy_antidote}g] เหลือ ${state.gold}g | Antidotes: ${state.antidotes}`;
      }
      case 'buy_scroll': {
        if (state.gold < SHOP_PRICES.buy_scroll) return `❌ ซื้อ Attack Scroll ไม่ได้ — เงินไม่พอ (${state.gold}/${SHOP_PRICES.buy_scroll}g)`;
        state.gold -= SHOP_PRICES.buy_scroll;
        state.attackBonus += 5;
        return `✅ ซื้อ Attack Scroll! [-${SHOP_PRICES.buy_scroll}g] เหลือ ${state.gold}g | ATK +5`;
      }
      case 'save_gold':
        return `💰 Save Gold — เก็บเงินไว้`;
      default:
        return '';
    }
  }

  private evaluateCondition(node: FlowNode, state: ShopState): boolean {
    const threshold = node.data.threshold ?? 50;
    switch (node.data.conditionType) {
      case 'gold_greater': return state.gold > threshold;
      case 'gold_less':    return state.gold < threshold;
      default:             return true;
    }
  }

  private next(nodeId: string, conditionResult: boolean | undefined): string | null {
    const outgoing = this.edges.filter((e) => e.source === nodeId);
    if (outgoing.length === 0) return null;

    if (conditionResult !== undefined) {
      const label = conditionResult ? 'yes' : 'no';
      const edge = outgoing.find((e) => e.sourceHandle === label || e.label?.toLowerCase() === label);
      return edge?.target ?? null;
    }
    return outgoing[0]?.target ?? null;
  }
}
