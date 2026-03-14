import { create } from 'zustand';

export interface ShopInventory {
  potions: number;
  antidotes: number;
  attackBonus: number; // flat ATK bonus for next battle (from scrolls)
}

/** Restock ทุก 8 ชั่วโมง: +2 potion, +1 antidote (cap ที่ max) */
export const RESTOCK_INTERVAL_MS = 8 * 60 * 60 * 1000; // 8 hours
export const RESTOCK_POTIONS    = 2;
export const RESTOCK_ANTIDOTES  = 1;
export const MAX_POTIONS        = 5;
export const MAX_ANTIDOTES      = 5;

interface ShopState extends ShopInventory {
  gold: number;
  purchasedEquipment: string[];
  lastRestockTime: number; // Unix timestamp ของการ restock ล่าสุด (0 = ยังไม่เคย)
  // actions
  addGold: (amount: number) => void;
  spendGold: (amount: number) => boolean;
  setPotions: (n: number) => void;
  setAntidotes: (n: number) => void;
  setAttackBonus: (n: number) => void;
  applyInventory: (inv: ShopInventory) => void;
  buyEquipment: (itemId: string, cost: number) => boolean;
  hasEquipment: (itemId: string) => boolean;
  claimRestock: () => void;
  isRestockReady: () => boolean;
  nextRestockMs: () => number; // ms เหลือจนกว่าจะ restock ใหม่
  initFromProfile: (gold: number, purchasedEquipment: string[], lastRestockTime?: number, potions?: number, antidotes?: number, attackBonus?: number) => void;
  reset: () => void;
}

export const useShopStore = create<ShopState>((set, get) => ({
  gold: 150,
  potions: 0,
  antidotes: 0,
  attackBonus: 0,
  purchasedEquipment: [],
  lastRestockTime: 0,

  addGold: (amount) => set((s) => ({ gold: s.gold + amount })),

  spendGold: (amount) => {
    if (get().gold < amount) return false;
    set((s) => ({ gold: Math.max(0, s.gold - amount) }));
    return true;
  },

  setPotions: (potions) => set({ potions }),
  setAntidotes: (antidotes) => set({ antidotes }),
  setAttackBonus: (attackBonus) => set({ attackBonus }),

  applyInventory: (inv) => set({
    potions: inv.potions,
    antidotes: inv.antidotes,
    attackBonus: inv.attackBonus,
  }),

  buyEquipment: (itemId, cost) => {
    const s = get();
    if (s.purchasedEquipment.includes(itemId)) return true;
    if (s.gold < cost) return false;
    set((s) => ({
      gold: s.gold - cost,
      purchasedEquipment: [...s.purchasedEquipment, itemId],
    }));
    return true;
  },

  hasEquipment: (itemId) => get().purchasedEquipment.includes(itemId),

  isRestockReady: () => {
    const { lastRestockTime } = get();
    return Date.now() - lastRestockTime >= RESTOCK_INTERVAL_MS;
  },

  nextRestockMs: () => {
    const { lastRestockTime } = get();
    const elapsed = Date.now() - lastRestockTime;
    return Math.max(0, RESTOCK_INTERVAL_MS - elapsed);
  },

  claimRestock: () => {
    set((s) => ({
      potions:  Math.min(MAX_POTIONS,   s.potions   + RESTOCK_POTIONS),
      antidotes: Math.min(MAX_ANTIDOTES, s.antidotes + RESTOCK_ANTIDOTES),
      lastRestockTime: Date.now(),
    }));
  },

  initFromProfile: (gold, purchasedEquipment, lastRestockTime = 0, potions, antidotes, attackBonus) =>
    set({
      gold, purchasedEquipment, lastRestockTime,
      ...(potions      !== undefined && { potions }),
      ...(antidotes    !== undefined && { antidotes }),
      ...(attackBonus  !== undefined && { attackBonus }),
    }),

  reset: () => set({ gold: 150, potions: 0, antidotes: 0, attackBonus: 0, purchasedEquipment: [], lastRestockTime: 0 }),
}));
