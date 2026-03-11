import { create } from 'zustand';

export interface ShopInventory {
  potions: number;
  antidotes: number;
  attackBonus: number; // flat ATK bonus for next battle (from scrolls)
}

interface ShopState extends ShopInventory {
  gold: number;
  purchasedEquipment: string[]; // item ids that have been bought
  // actions
  addGold: (amount: number) => void;
  spendGold: (amount: number) => boolean; // returns false if not enough gold
  setPotions: (n: number) => void;
  setAntidotes: (n: number) => void;
  setAttackBonus: (n: number) => void;
  applyInventory: (inv: ShopInventory) => void;
  buyEquipment: (itemId: string, cost: number) => boolean;
  hasEquipment: (itemId: string) => boolean;
  reset: () => void;
}

export const useShopStore = create<ShopState>((set, get) => ({
  gold: 150,
  potions: 0,
  antidotes: 0,
  attackBonus: 0,
  purchasedEquipment: [],

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
    if (s.purchasedEquipment.includes(itemId)) return true; // already owned
    if (s.gold < cost) return false;
    set((s) => ({
      gold: s.gold - cost,
      purchasedEquipment: [...s.purchasedEquipment, itemId],
    }));
    return true;
  },

  hasEquipment: (itemId) => {
    return get().purchasedEquipment.includes(itemId);
  },

  reset: () => set({ gold: 150, potions: 0, antidotes: 0, attackBonus: 0, purchasedEquipment: [] }),
}));
