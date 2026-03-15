// ── PATH CARDS ────────────────────────────────────────────────────────────────

export type PathId = 'hanged_man' | 'magician';

export interface SynergyTier {
  supCardsRequired: number; // 1-5
  description: string;
}

export interface PathCard {
  id: PathId;
  name: string;
  subtitle: string;
  description: string; // base ability description
  icon: string;
  color: string; // accent color hex
  synergyScaling: SynergyTier[]; // 5 tiers
}

export const PATH_CARDS: PathCard[] = [
  {
    id: 'hanged_man',
    name: 'The Hanged Man',
    subtitle: 'เส้นทางแห่งการเสียสละ',
    description: 'เมื่อ HP < 50% ดาเมจทุกชนิดเพิ่มขึ้น 1.5×',
    icon: '🙃',
    color: '#ef4444',
    synergyScaling: [
      { supCardsRequired: 1, description: 'โบนัสดาเมจ (HP < 50%) → 1.6×' },
      { supCardsRequired: 2, description: 'โบนัสดาเมจ → 1.8× + ต้านทานความตาย (HP หยุดที่ 1 ถ้า Flowchart ทำให้ตัวเองตาย)' },
      { supCardsRequired: 3, description: 'โบนัสดาเมจ → 2.0× + เมื่อ HP < 50% ได้ Budget +1/turn' },
      { supCardsRequired: 4, description: 'โบนัสดาเมจ → 2.5×' },
      { supCardsRequired: 5, description: 'เมื่อ HP < 25% โบนัสดาเมจ → 3.0× + Lifesteal 10%' },
    ],
  },
  {
    id: 'magician',
    name: 'The Magician',
    subtitle: 'เส้นทางแห่งมนตราและตรรกะ',
    description: 'ดาเมจ Process เพิ่ม 5% ต่อ 1 บล็อกที่รันผ่านมาก่อนในเทิร์นนั้น',
    icon: '🔮',
    color: '#8b5cf6',
    synergyScaling: [
      { supCardsRequired: 1, description: 'โบนัสดาเมจต่อบล็อก → 8%' },
      { supCardsRequired: 2, description: 'โบนัสดาเมจต่อบล็อก → 12% + Mana Shield (Budget เหลือ → โล่ 5/แต้ม)' },
      { supCardsRequired: 3, description: 'โบนัสดาเมจต่อบล็อก → 15% + Max Budget +1/turn เสมอ' },
      { supCardsRequired: 4, description: 'โบนัสดาเมจต่อบล็อก → 20%' },
      { supCardsRequired: 5, description: 'โบนัสดาเมจต่อบล็อก → 25% + Cast Spell ทำ True Damage เสมอ' },
    ],
  },
];

// ── SUP-CARDS ─────────────────────────────────────────────────────────────────

export type SupCardId =
  // Hanged Man groups
  | 'thorny_logic' | 'bleeding_loop' | 'reckless_path'
  | 'blood_tap' | 'desperate_cast' | 'corrupted_potion'
  | 'adrenaline' | 'deaths_door' | 'masochists_shield'
  // Magician groups
  | 'overloaded_circuit' | 'echo_loop' | 'logical_mirror'
  | 'mana_reserve' | 'emergency_cast' | 'cheap_code'
  | 'quick_compile' | 'endless_node' | 'conditional_bypass';

export interface SupCard {
  id: SupCardId;
  name: string;
  description: string;
  icon: string;
  pathAffinity: PathId | 'neutral';
  group: string;
}

export const SUP_CARDS: SupCard[] = [
  // ── Hanged Man: Logic to Power ──
  {
    id: 'thorny_logic', name: 'Thorny Logic', icon: '🌵', pathAffinity: 'hanged_man', group: 'Logic to Power',
    description: 'ทุกครั้งที่รันผ่าน Decision หรือ Loop วนกลับ เสีย HP 1 แต่บล็อก Attack ถัดไปบวก +4 ดาเมจ (สะสมได้)',
  },
  {
    id: 'bleeding_loop', name: 'Bleeding Loop', icon: '🩸', pathAffinity: 'hanged_man', group: 'Logic to Power',
    description: 'บล็อกดาเมจใน Loop ทำดาเมจเพิ่ม 20% แบบทบต้นต่อรอบ แต่เสีย HP 3 ต่อรอบ Loop',
  },
  {
    id: 'reckless_path', name: 'Reckless Path', icon: '💨', pathAffinity: 'hanged_man', group: 'Logic to Power',
    description: 'ออกทาง NO จาก Decision แล้วเชื่อม Process → กระทำนั้นแรงขึ้น 1.5× แต่เสีย HP 5',
  },
  // ── Hanged Man: Blood to Budget ──
  {
    id: 'blood_tap', name: 'Blood Tap', icon: '💉', pathAffinity: 'hanged_man', group: 'Blood to Budget',
    description: 'ได้บล็อก Sacrifice (0 Budget): เสีย 15 HP → ได้ Budget +2 ชั่วคราว (รันได้สูงสุด 1×/turn)',
  },
  {
    id: 'desperate_cast', name: 'Desperate Cast', icon: '😤', pathAffinity: 'hanged_man', group: 'Blood to Budget',
    description: 'Budget = 0 แต่เจอบล็อกที่ต้องใช้ Budget → บล็อกนั้นยังรันได้ 1 ครั้ง แลกด้วย HP 15',
  },
  {
    id: 'corrupted_potion', name: 'Corrupted Potion', icon: '🧪', pathAffinity: 'hanged_man', group: 'Blood to Budget',
    description: 'บล็อก Heal ไม่ฟื้น HP อีกต่อไป แต่ฟื้น Budget +1 แทน (เหมาะกับ Hanged Man ที่ต้องการ HP ต่ำ)',
  },
  // ── Hanged Man: Threshold Mechanics ──
  {
    id: 'adrenaline', name: 'Adrenaline', icon: '⚡', pathAffinity: 'hanged_man', group: 'Threshold Mechanics',
    description: 'ได้บล็อก Decision [HP < 30%?] → ถ้า YES บล็อกโจมตีทั้งหมดในเทิร์นนี้ทำ True Damage',
  },
  {
    id: 'deaths_door', name: "Death's Door", icon: '💀', pathAffinity: 'hanged_man', group: 'Threshold Mechanics',
    description: 'จบ Flowchart ถึง END แล้ว HP < 20% → เทิร์นถัดไปทุก Attack ตี 2× โดยไม่เสีย Budget เพิ่ม',
  },
  {
    id: 'masochists_shield', name: "Masochist's Shield", icon: '🛡️', pathAffinity: 'hanged_man', group: 'Threshold Mechanics',
    description: 'ทุก 10 HP ที่เสียจากเอฟเฟกต์การ์ดตัวเองในเทิร์นนั้น → กลายเป็น Shield 5 หน่วยรับดาเมจบอส',
  },
  // ── Magician: Logic Resonance ──
  {
    id: 'overloaded_circuit', name: 'Overloaded Circuit', icon: '⚙️', pathAffinity: 'magician', group: 'Logic Resonance',
    description: 'รันผ่าน Decision ครบ 3 ครั้งใน 1 turn → สุ่มทำ Magic Damage 3 ใส่ศัตรูฟรี ไม่ใช้ Budget',
  },
  {
    id: 'echo_loop', name: 'Echo Loop', icon: '🔁', pathAffinity: 'magician', group: 'Logic Resonance',
    description: 'บล็อก Process ใน Loop มีโอกาส 30% ไม่กิน Budget ในรอบนั้น',
  },
  {
    id: 'logical_mirror', name: 'Logical Mirror', icon: '🪞', pathAffinity: 'magician', group: 'Logic Resonance',
    description: 'ถ้าจบเทิร์นโดยไม่ได้ใช้ Attack เลย → Cast Spell เทิร์นถัดไปแรงขึ้น 1.5×',
  },
  // ── Magician: Budget Manipulation ──
  {
    id: 'mana_reserve', name: 'Mana Reserve', icon: '💠', pathAffinity: 'magician', group: 'Budget Manipulation',
    description: 'จบเทิร์นมี Budget เหลือ → เทิร์นถัดไปได้โบนัสดาเมจ +5 ต่อ Budget 1 แต้มที่เหลือ',
  },
  {
    id: 'emergency_cast', name: 'Emergency Cast', icon: '🆘', pathAffinity: 'magician', group: 'Budget Manipulation',
    description: 'Budget = 0 แต่รัน If ที่ออก YES → ได้ Budget +1 ชั่วคราว ทันที (1×/turn)',
  },
  {
    id: 'cheap_code', name: 'Cheap Code', icon: '💸', pathAffinity: 'magician', group: 'Budget Manipulation',
    description: 'Cast Spell ใช้ Budget -1 (ต่ำสุด 1) แต่ Magic Damage ลดลง 20%',
  },
  // ── Magician: Flow Control ──
  {
    id: 'quick_compile', name: 'Quick Compile', icon: '⚡', pathAffinity: 'magician', group: 'Flow Control',
    description: 'เทิร์นก่อนใช้ Budget หมดเกลี้ยง → เทิร์นนี้ SPD +15',
  },
  {
    id: 'endless_node', name: 'Endless Node', icon: '♾️', pathAffinity: 'magician', group: 'Flow Control',
    description: 'Flowchart ชน END → เด้งกลับ START รันอีก 1 รอบ ใช้ Budget pool เดิม',
  },
  {
    id: 'conditional_bypass', name: 'Conditional Bypass', icon: '🔓', pathAffinity: 'magician', group: 'Flow Control',
    description: 'ได้บล็อก Decision [Enemy SPD > Hero SPD?] → ถ้า YES บล็อก Process ถัดไปทำ True Damage',
  },
];

// ── SHOP ITEMS ────────────────────────────────────────────────────────────────

export type HardwareId = 'overclocked_cpu' | 'spaghetti_logic' | 'heavy_plating' | 'greedy_ram';
export type PluginId = 'minor_bug_fix' | 'syntax_optimizer' | 'basic_firewall' | 'data_scraper' | 'cooling_fan' | 'cloud_backup';
export type CorruptedFileId = 'root_access' | 'infinite_dll' | 'condition_of_death' | 'vampire_protocol';
export type VirusId = 'trojan_horse' | 'ransomware' | 'bloatware' | 'lag_spike' | 'memory_leak' | 'adware' | 'corrupted_sector' | 'infinite_recursion';

export interface HardwareItem {
  id: HardwareId;
  name: string;
  icon: string;
  cost: number; // Data Fragments
  pro: string;
  con: string;
}

export interface PluginItem {
  id: PluginId;
  name: string;
  icon: string;
  cost: number;
  description: string;
}

export interface CorruptedFile {
  id: CorruptedFileId;
  name: string;
  icon: string;
  maxHpCost: number; // % of maxHP sacrificed
  description: string;
}

export interface Virus {
  id: VirusId;
  name: string;
  icon: string;
  reward: string;
  penalty: string;
  rewardDataFragments?: number;
  rewardMaxHp?: number;
}

export const HARDWARE_ITEMS: HardwareItem[] = [
  {
    id: 'overclocked_cpu', name: 'Overclocked CPU', icon: '💻', cost: 80,
    pro: 'Max Budget +2 ถาวร', con: 'กด Execute → เสีย HP 2 ทุกครั้ง',
  },
  {
    id: 'spaghetti_logic', name: 'Spaghetti Logic', icon: '🍝', cost: 60,
    pro: 'Attack ทำดาเมจ ×1.5 เสมอ', con: 'Loop กิน Budget 1 แต้ม/รอบ',
  },
  {
    id: 'heavy_plating', name: 'Heavy Plating', icon: '🪖', cost: 70,
    pro: 'ลดดาเมจจากศัตรู 30% ถาวร', con: 'SPD = 0 เสมอ (บอสได้โจมตีก่อนทุก Wave)',
  },
  {
    id: 'greedy_ram', name: 'Greedy RAM', icon: '🧠', cost: 90,
    pro: 'Lifesteal 10% จากทุกการโจมตี', con: 'บล็อก Heal กลายเป็น Error (ใช้ไม่ได้)',
  },
];

export const PLUGIN_ITEMS: PluginItem[] = [
  { id: 'minor_bug_fix', name: 'Minor Bug Fix', icon: '🔧', cost: 20, description: 'ฟื้น HP 2 ทุกครั้งที่จบเทิร์น' },
  { id: 'syntax_optimizer', name: 'Syntax Optimizer', icon: '📝', cost: 25, description: 'Attack ทำดาเมจพื้นฐาน +1 ถาวร' },
  { id: 'basic_firewall', name: 'Basic Firewall', icon: '🔒', cost: 30, description: 'ดาเมจที่รับลดลง 1 (ต่ำสุด 1)' },
  { id: 'data_scraper', name: 'Data Scraper', icon: '📊', cost: 20, description: 'ชนะ Wave → ได้ Data Fragment +1 โบนัส' },
  { id: 'cooling_fan', name: 'Cooling Fan', icon: '🌀', cost: 25, description: 'SPD +2 ถาวร' },
  { id: 'cloud_backup', name: 'Cloud Backup', icon: '☁️', cost: 35, description: 'Max HP +5 ทันที' },
];

export const CORRUPTED_FILES: CorruptedFile[] = [
  {
    id: 'root_access', name: 'Root Access', icon: '👑', maxHpCost: 50,
    description: 'Max Budget +3 ถาวร + เริ่มทุกเทิร์นด้วย Budget เต็มเสมอ',
  },
  {
    id: 'infinite_dll', name: 'The Infinite.dll', icon: '∞', maxHpCost: 30,
    description: 'จำนวนรอบ Loop +1 ฟรีทุก Loop เสมอ',
  },
  {
    id: 'condition_of_death', name: 'Condition of Death', icon: '☠️', maxHpCost: 40,
    description: 'ทุกครั้งที่รันผ่านฝั่ง YES ของ Decision → ศัตรูโดน True Damage 10 ทันที (ไม่ใช้ Budget)',
  },
  {
    id: 'vampire_protocol', name: 'Vampire Protocol', icon: '🧛', maxHpCost: 25,
    description: 'ชนะ Wave Boss (ทุก 10 wave) → Max HP +2 ถาวร (ยอมเสียก่อน แล้วฟาร์มคืน)',
  },
];

export const VIRUSES: Virus[] = [
  {
    id: 'trojan_horse', name: 'Trojan Horse', icon: '🐴',
    reward: 'Data Fragment +300', penalty: 'เริ่ม Wave ใหม่ทุกครั้ง → โดน True Damage 10',
    rewardDataFragments: 300,
  },
  {
    id: 'ransomware', name: 'Ransomware', icon: '💾',
    reward: 'Data Fragment +200', penalty: 'ได้ Data Fragment จาก Wave น้อยลง 30% เสมอ',
    rewardDataFragments: 200,
  },
  {
    id: 'bloatware', name: 'Bloatware', icon: '🗑️',
    reward: 'Max HP +20', penalty: 'Max Budget ถาวร -1',
    rewardMaxHp: 20,
  },
  {
    id: 'lag_spike', name: 'Lag Spike', icon: '📉',
    reward: 'Data Fragment +150', penalty: 'SPD พื้นฐาน ลดลง 50% ถาวร',
    rewardDataFragments: 150,
  },
  {
    id: 'memory_leak', name: 'Memory Leak', icon: '💧',
    reward: 'Max HP +15', penalty: 'ทุกครั้งที่รันครบ 5 บล็อกใน 1 turn → เสีย HP 1',
    rewardMaxHp: 15,
  },
  {
    id: 'adware', name: 'Adware', icon: '📢',
    reward: 'Data Fragment +250', penalty: 'วาง "บล็อกขยะ" 1 อัน ถาวรบน canvas (กิน Budget 1 แต้ม ไม่มีผล)',
    rewardDataFragments: 250,
  },
  {
    id: 'corrupted_sector', name: 'Corrupted Sector', icon: '❓',
    reward: 'สุ่มรับ Sup-card ฟรี 1 ใบ', penalty: 'ซ่อน HP bar และสถานะของศัตรูทั้งหมด',
  },
  {
    id: 'infinite_recursion', name: 'Infinite Recursion', icon: '🔄',
    reward: 'Data Fragment +200', penalty: 'Loop รันเกินที่ตั้งค่า +1 รอบ แต่หัก HP 5 ในรอบส่วนเกิน',
    rewardDataFragments: 200,
  },
];
