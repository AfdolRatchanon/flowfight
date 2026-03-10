import { create } from 'zustand';
import type { Character, CharacterClass, CharacterColors, EquipmentItem, CharacterEquipment } from '../types/game.types';
import { WEAPONS, ARMORS, HELMETS, ACCESSORIES } from '../utils/constants';

function isItemAllowed(equipped: EquipmentItem | null, cls: CharacterClass, allItems: EquipmentItem[]): boolean {
  if (!equipped) return true;
  const def = allItems.find((i) => i.id === equipped.id);
  if (!def) return true;
  return def.allowedClasses.length === 0 || (def.allowedClasses as string[]).includes(cls);
}

// Class base stats
export const CLASS_BASE_STATS = {
  knight:    { maxHP: 100, currentHP: 100, attack: 10, defense: 8, speed: 7 },
  mage:      { maxHP: 80,  currentHP: 80,  attack: 14, defense: 4, speed: 9 },
  rogue:     { maxHP: 90,  currentHP: 90,  attack: 12, defense: 5, speed: 10 },
  barbarian: { maxHP: 120, currentHP: 120, attack: 13, defense: 6, speed: 6 },
};

export const DEFAULT_COLORS: CharacterColors = {
  primary: '#1a1a2e',
  secondary: '#16213e',
  accent: '#e94560',
};

const defaultEquipment: CharacterEquipment = {
  weapon: null,
  armor: null,
  head: null,
  accessory: null,
};

interface CharacterState {
  character: Character | null;
  selectedClass: CharacterClass;
  selectedSkin: string;
  colors: CharacterColors;
  equipment: CharacterEquipment;
  characterName: string;

  setCharacter: (character: Character | null) => void;
  setClass: (cls: CharacterClass) => void;
  setSkin: (skinId: string) => void;
  setColors: (colors: Partial<CharacterColors>) => void;
  equipItem: (item: EquipmentItem) => void;
  unequipItem: (slot: keyof CharacterEquipment) => void;
  setCharacterName: (name: string) => void;
  getCalculatedStats: () => typeof CLASS_BASE_STATS.knight;
}

export const useCharacterStore = create<CharacterState>((set, get) => ({
  character: null,
  selectedClass: 'knight',
  selectedSkin: 'knight_blue',
  colors: DEFAULT_COLORS,
  equipment: defaultEquipment,
  characterName: 'Hero',

  setCharacter: (character) => set({ character }),

  setClass: (selectedClass) => set((state) => {
    // Auto-unequip items that don't allow the new class
    const allItems = [...WEAPONS, ...ARMORS, ...HELMETS, ...ACCESSORIES] as EquipmentItem[];
    const eq = state.equipment;
    const newEquipment: CharacterEquipment = {
      weapon:    isItemAllowed(eq.weapon,    selectedClass, allItems) ? eq.weapon    : null,
      armor:     isItemAllowed(eq.armor,     selectedClass, allItems) ? eq.armor     : null,
      head:      isItemAllowed(eq.head,      selectedClass, allItems) ? eq.head      : null,
      accessory: isItemAllowed(eq.accessory, selectedClass, allItems) ? eq.accessory : null,
    };
    return { selectedClass, selectedSkin: `${selectedClass}_blue`, equipment: newEquipment };
  }),

  setSkin: (selectedSkin) => set({ selectedSkin }),

  setColors: (colors) => set((state) => ({
    colors: { ...state.colors, ...colors },
  })),

  equipItem: (item) => set((state) => ({
    equipment: { ...state.equipment, [item.type]: item },
  })),

  unequipItem: (slot) => set((state) => ({
    equipment: { ...state.equipment, [slot]: null },
  })),

  setCharacterName: (characterName) => set({ characterName }),

  getCalculatedStats: () => {
    const { selectedClass, equipment } = get();
    const base = { ...CLASS_BASE_STATS[selectedClass] };

    Object.values(equipment).forEach((item) => {
      if (item) {
        base.maxHP += item.stats.hpBonus;
        base.currentHP += item.stats.hpBonus;
        base.attack += item.stats.attackBonus;
        base.defense += item.stats.defenseBonus;
        base.speed += item.stats.speedBonus;
      }
    });

    return base;
  },
}));
