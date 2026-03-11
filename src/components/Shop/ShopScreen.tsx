import { useState } from 'react';
import { useShopStore } from '../../stores/shopStore';
import { useGameStore } from '../../stores/gameStore';
import { WEAPONS, ARMORS, HELMETS, ACCESSORIES } from '../../utils/constants';
import { saveShopData } from '../../services/authService';

// ────────────────────────────────────────────────────────────────────────────
// Consumable catalog
// ────────────────────────────────────────────────────────────────────────────
interface ShopItem {
  id: string;
  icon: string;
  label: string;
  description: string;
  price: number;
  max: number;
  stat: string;
  color: string;
  borderColor: string;
}

const SHOP_CATALOG: ShopItem[] = [
  { id: 'potion',   icon: '🧪', label: 'Potion',        description: 'ฟื้นฟู 30 HP ระหว่างการสู้รบ',        price: 30,  max: 5, stat: 'potions',   color: 'rgba(22,101,52,0.3)',  borderColor: '#16a34a' },
  { id: 'antidote', icon: '💊', label: 'Antidote',      description: 'รักษาสถานะ 🔥🟣❄️ ได้ทุกอย่าง',     price: 20,  max: 5, stat: 'antidotes', color: 'rgba(6,95,70,0.3)',   borderColor: '#059669' },
  { id: 'scroll',   icon: '📜', label: 'Attack Scroll', description: '+5 ATK สำหรับการสู้รบถัดไป',         price: 50,  max: 3, stat: 'scroll',    color: 'rgba(124,45,18,0.3)', borderColor: '#c2410c' },
];

// ────────────────────────────────────────────────────────────────────────────
// Equipment catalog (all slots combined)
// ────────────────────────────────────────────────────────────────────────────
const ALL_EQUIPMENT = [...WEAPONS, ...ARMORS, ...HELMETS, ...ACCESSORIES];

const RARITY_COLOR: Record<string, string> = {
  common:    '#9ca3af',
  uncommon:  '#4ade80',
  rare:      '#60a5fa',
  epic:      '#c084fc',
  legendary: '#fbbf24',
};

const SLOT_ICON: Record<string, string> = {
  weapon:    '⚔️',
  armor:     '🛡️',
  head:      '⛑️',
  accessory: '💍',
};

// ────────────────────────────────────────────────────────────────────────────
// Props
// ────────────────────────────────────────────────────────────────────────────
interface ShopScreenProps {
  goldEarned: number;
  characterClass?: string;
  characterLevel?: number;
  onClose: () => void;
  onRetry?: () => void;
}

type Tab = 'items' | 'equip';

// ────────────────────────────────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────────────────────────────────
export default function ShopScreen({ goldEarned, characterClass, characterLevel = 1, onClose, onRetry }: ShopScreenProps) {
  const shop = useShopStore();
  const { player } = useGameStore();

  const [credited, setCredited] = useState(false);
  const [bought, setBought]     = useState<Record<string, number>>({ potion: 0, antidote: 0, scroll: 0 });
  const [flash, setFlash]       = useState<{ msg: string; ok: boolean } | null>(null);
  const [tab, setTab]           = useState<Tab>('items');

  // Credit gold once on first render
  if (!credited) {
    if (goldEarned > 0) shop.addGold(goldEarned);
    setCredited(true);
  }

  function showFlash(msg: string, ok = false) {
    setFlash({ msg, ok });
    setTimeout(() => setFlash(null), 1600);
  }

  // ── Consumables ──────────────────────────────────────────────────────────
  function getOwned(item: ShopItem): number {
    if (item.stat === 'potions')   return shop.potions;
    if (item.stat === 'antidotes') return shop.antidotes;
    if (item.stat === 'scroll')    return shop.attackBonus / 5;
    return 0;
  }

  function buyConsumable(item: ShopItem) {
    if (shop.gold < item.price) { showFlash(`เงินไม่พอ! ต้องการ ${item.price}g`); return; }
    const owned = getOwned(item);
    if (owned >= item.max) { showFlash(`ถือได้สูงสุด ${item.max} ชิ้นแล้ว`); return; }
    shop.spendGold(item.price);
    if (item.stat === 'potions')   shop.setPotions(shop.potions + 1);
    else if (item.stat === 'antidotes') shop.setAntidotes(shop.antidotes + 1);
    else if (item.stat === 'scroll')    shop.setAttackBonus(shop.attackBonus + 5);
    setBought((b) => ({ ...b, [item.id]: (b[item.id] ?? 0) + 1 }));
  }

  // ── Equipment ─────────────────────────────────────────────────────────────
  const filteredEquip = ALL_EQUIPMENT.filter((e) => {
    const classOk = e.allowedClasses.length === 0 || (characterClass && e.allowedClasses.includes(characterClass as never));
    const levelOk = e.requiredLevel <= characterLevel;
    return classOk && levelOk;
  });

  // Group by slot
  const bySlot: Record<string, typeof filteredEquip> = {};
  for (const e of filteredEquip) {
    if (!bySlot[e.type]) bySlot[e.type] = [];
    bySlot[e.type].push(e);
  }
  const slotOrder = ['weapon', 'armor', 'head', 'accessory'];

  function buyEquip(item: typeof ALL_EQUIPMENT[0]) {
    if (item.requiredLevel > characterLevel) {
      showFlash(`ต้องเป็น Lv.${item.requiredLevel} ก่อน`);
      return;
    }
    const ok = shop.buyEquipment(item.id, item.cost);
    if (ok) {
      showFlash(`ซื้อ ${item.name} สำเร็จ!`, true);
      if (player) {
        const { gold, purchasedEquipment } = useShopStore.getState();
        saveShopData(player.id, gold, purchasedEquipment).catch(() => {});
      }
    } else {
      showFlash(`เงินไม่พอ! ต้องการ ${item.cost}g (มี ${shop.gold}g)`);
    }
  }

  const totalSpent = Object.entries(bought).reduce((sum, [id, qty]) => {
    const item = SHOP_CATALOG.find((i) => i.id === id);
    return sum + (item?.price ?? 0) * qty;
  }, 0);

  // ────────────────────────────────────────────────────────────────────────
  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.85)',
      backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 60,
    }}>
      <div style={{
        width: 500,
        maxHeight: '90vh',
        display: 'flex', flexDirection: 'column',
        background: 'linear-gradient(160deg,#0f172a,#1e1b4b)',
        border: '1px solid rgba(251,191,36,0.25)',
        borderRadius: 20, overflow: 'hidden',
        boxShadow: '0 30px 80px rgba(0,0,0,0.7)',
      }}>

        {/* ── Header ── */}
        <div style={{
          padding: '20px 24px 14px',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          flexShrink: 0,
        }}>
          <div>
            <h2 style={{ color: '#fbbf24', fontWeight: 800, fontSize: 22, margin: 0 }}>🏪 Shop</h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, margin: '3px 0 0' }}>
              เตรียมพร้อมก่อนออกสู้รบถัดไป
            </p>
          </div>
          <div style={{
            background: 'rgba(251,191,36,0.1)',
            border: '1px solid rgba(251,191,36,0.35)',
            borderRadius: 12, padding: '10px 18px', textAlign: 'center',
          }}>
            <div style={{ color: '#fbbf24', fontSize: 22, fontWeight: 900 }}>💰 {shop.gold}g</div>
            {goldEarned > 0 && (
              <div style={{ color: '#4ade80', fontSize: 10, fontWeight: 700 }}>+{goldEarned}g จากชัยชนะ</div>
            )}
          </div>
        </div>

        {/* ── Inventory bar ── */}
        <div style={{
          padding: '8px 24px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', gap: 20, alignItems: 'center',
          flexShrink: 0,
        }}>
          <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, fontWeight: 700 }}>กระเป๋า:</span>
          <Pill icon="🧪" value={shop.potions}           label="Potions" />
          <Pill icon="💊" value={shop.antidotes}         label="Antidotes" />
          <Pill icon="📜" value={`+${shop.attackBonus}`} label="ATK Scroll" />
        </div>

        {/* ── Tabs ── */}
        <div style={{
          display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.08)',
          flexShrink: 0,
        }}>
          {([['items', '🧪 ของใช้'], ['equip', '⚔️ อุปกรณ์']] as [Tab, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              style={{
                flex: 1, padding: '10px 0', border: 'none',
                background: tab === key ? 'rgba(251,191,36,0.12)' : 'transparent',
                color: tab === key ? '#fbbf24' : 'rgba(255,255,255,0.4)',
                fontWeight: tab === key ? 800 : 500, fontSize: 13,
                borderBottom: tab === key ? '2px solid #fbbf24' : '2px solid transparent',
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── Flash message ── */}
        {flash && (
          <div style={{
            margin: '8px 24px 0', flexShrink: 0,
            background: flash.ok ? 'rgba(74,222,128,0.12)' : 'rgba(239,68,68,0.15)',
            border: `1px solid ${flash.ok ? 'rgba(74,222,128,0.4)' : 'rgba(239,68,68,0.4)'}`,
            borderRadius: 8, padding: '7px 14px',
            color: flash.ok ? '#4ade80' : '#fca5a5', fontSize: 12, fontWeight: 600, textAlign: 'center',
          }}>
            {flash.msg}
          </div>
        )}

        {/* ── Scrollable content ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>

          {/* ─── Consumables tab ─── */}
          {tab === 'items' && SHOP_CATALOG.map((item) => {
            const owned  = getOwned(item);
            const canBuy = shop.gold >= item.price && owned < item.max;
            const boughtQty = bought[item.id] ?? 0;
            return (
              <div key={item.id} style={{
                background: item.color,
                border: `1px solid ${item.borderColor}55`,
                borderRadius: 12, padding: '12px 16px',
                display: 'flex', alignItems: 'center', gap: 14,
              }}>
                <div style={{ fontSize: 28, lineHeight: 1 }}>{item.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: 'white', fontWeight: 700, fontSize: 14 }}>{item.label}</span>
                    <span style={{ color: '#fbbf24', fontSize: 12, fontWeight: 700 }}>{item.price}g</span>
                    {boughtQty > 0 && (
                      <span style={{ background: '#4ade8033', border: '1px solid #4ade8055', borderRadius: 20, padding: '1px 8px', color: '#4ade80', fontSize: 10, fontWeight: 700 }}>+{boughtQty}</span>
                    )}
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 2 }}>{item.description}</div>
                  <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, marginTop: 2 }}>ถือได้: {owned}/{item.max}</div>
                </div>
                <button
                  onClick={() => buyConsumable(item)}
                  disabled={!canBuy}
                  style={{
                    padding: '8px 18px', borderRadius: 10, border: 'none',
                    background: canBuy ? `linear-gradient(135deg,${item.borderColor},${item.borderColor}cc)` : 'rgba(255,255,255,0.05)',
                    color: canBuy ? 'white' : 'rgba(255,255,255,0.25)',
                    fontWeight: 700, fontSize: 13,
                    cursor: canBuy ? 'pointer' : 'not-allowed',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {owned >= item.max ? 'เต็มแล้ว' : shop.gold < item.price ? 'เงินไม่พอ' : 'ซื้อ'}
                </button>
              </div>
            );
          })}

          {/* ─── Equipment tab ─── */}
          {tab === 'equip' && (
            filteredEquip.length === 0
              ? (
                <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', padding: '40px 0', fontSize: 13 }}>
                  ไม่มีอุปกรณ์สำหรับ class นี้ในระดับนี้
                </div>
              )
              : slotOrder.filter(s => bySlot[s]?.length).map((slot) => (
                <div key={slot}>
                  {/* Slot header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, marginTop: 4 }}>
                    <span style={{ fontSize: 16 }}>{SLOT_ICON[slot]}</span>
                    <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
                      {slot === 'weapon' ? 'Weapon' : slot === 'armor' ? 'Armor' : slot === 'head' ? 'Helmet' : 'Accessory'}
                    </span>
                  </div>
                  {bySlot[slot].map((item) => {
                    const owned   = shop.hasEquipment(item.id);
                    const canBuy  = !owned && shop.gold >= item.cost;
                    const locked  = item.requiredLevel > characterLevel;
                    const rColor  = RARITY_COLOR[item.rarity] ?? '#9ca3af';
                    const statLine = [
                      item.stats.attackBonus  > 0 ? `ATK+${item.stats.attackBonus}`   : '',
                      item.stats.defenseBonus > 0 ? `DEF+${item.stats.defenseBonus}`  : '',
                      item.stats.hpBonus      > 0 ? `HP+${item.stats.hpBonus}`        : '',
                      item.stats.speedBonus   > 0 ? `SPD+${item.stats.speedBonus}`    : '',
                    ].filter(Boolean).join('  ');

                    return (
                      <div key={item.id} style={{
                        background: owned ? 'rgba(74,222,128,0.06)' : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${owned ? 'rgba(74,222,128,0.25)' : rColor + '33'}`,
                        borderRadius: 10, padding: '10px 14px',
                        display: 'flex', alignItems: 'center', gap: 12,
                        marginBottom: 6, opacity: locked ? 0.45 : 1,
                      }}>
                        {/* Rarity dot */}
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: rColor, flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                            <span style={{ color: 'white', fontWeight: 700, fontSize: 13 }}>{item.name}</span>
                            <span style={{ color: '#fbbf24', fontSize: 11, fontWeight: 700 }}>{item.cost}g</span>
                            {locked && (
                              <span style={{ color: '#f87171', fontSize: 10 }}>Lv.{item.requiredLevel}</span>
                            )}
                          </div>
                          <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10, marginTop: 1 }}>{item.description}</div>
                          {statLine && (
                            <div style={{ color: rColor, fontSize: 10, fontWeight: 700, marginTop: 2 }}>{statLine}</div>
                          )}
                        </div>
                        <button
                          onClick={() => buyEquip(item)}
                          disabled={owned || locked || !canBuy}
                          style={{
                            padding: '6px 14px', borderRadius: 8, border: 'none', flexShrink: 0,
                            background: owned
                              ? 'rgba(74,222,128,0.15)'
                              : canBuy && !locked
                              ? `linear-gradient(135deg,${rColor},${rColor}aa)`
                              : 'rgba(255,255,255,0.05)',
                            color: owned ? '#4ade80' : canBuy && !locked ? 'white' : 'rgba(255,255,255,0.25)',
                            fontWeight: 700, fontSize: 11,
                            cursor: owned || locked || !canBuy ? 'not-allowed' : 'pointer',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {owned ? '✓ มีแล้ว' : locked ? 'ล็อก' : shop.gold < item.cost ? 'เงินไม่พอ' : 'ซื้อ'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              ))
          )}
        </div>

        {/* ── Footer ── */}
        <div style={{
          padding: '12px 24px',
          borderTop: '1px solid rgba(255,255,255,0.07)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          gap: 10, flexShrink: 0,
        }}>
          <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11 }}>
            {totalSpent > 0 ? `ซื้อไปแล้ว ${totalSpent}g` : 'ยังไม่ได้ซื้ออะไร'}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {onRetry && (
              <button
                onClick={onRetry}
                style={{
                  padding: '9px 18px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)',
                  background: 'rgba(255,255,255,0.06)',
                  color: 'white', fontWeight: 700, fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                ↺ Retry
              </button>
            )}
            <button
              onClick={onClose}
              style={{
                padding: '9px 22px', borderRadius: 10, border: 'none',
                background: 'linear-gradient(135deg,#1d4ed8,#1e40af)',
                color: 'white', fontWeight: 700, fontSize: 13,
                cursor: 'pointer',
              }}
            >
              ออกจากร้าน →
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

function Pill({ icon, value, label }: { icon: string; value: number | string; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <span style={{ fontSize: 14 }}>{icon}</span>
      <span style={{ color: 'white', fontWeight: 700, fontSize: 12 }}>{value}</span>
      <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10 }}>{label}</span>
    </div>
  );
}
