import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useShopStore } from '../../stores/shopStore';
import { useCharacterStore } from '../../stores/characterStore';
import { useGameStore } from '../../stores/gameStore';
import { WEAPONS, ARMORS, HELMETS, ACCESSORIES } from '../../utils/constants';
import { saveEquippedItems } from '../../services/authService';
import type { EquipmentItem } from '../../types/game.types';

const ALL_EQUIPMENT: EquipmentItem[] = [...WEAPONS, ...ARMORS, ...HELMETS, ...ACCESSORIES];

const SLOT_ICON: Record<string, string> = {
  weapon: '⚔️', armor: '🛡️', head: '⛑️', accessory: '💍',
};
const SLOT_LABEL: Record<string, string> = {
  weapon: 'Weapon', armor: 'Armor', head: 'Helmet', accessory: 'Accessory',
};
const SLOT_ORDER = ['weapon', 'armor', 'head', 'accessory'] as const;

const RARITY_COLOR: Record<string, string> = {
  common: '#9ca3af', uncommon: '#4ade80', rare: '#60a5fa',
  epic: '#c084fc', legendary: '#fbbf24',
};

type Tab = 'bag' | 'equip';

interface BagButtonProps {
  compact?: boolean;
  onShopClick?: () => void;
}

export default function BagButton({ compact = false, onShopClick }: BagButtonProps) {
  const navigate    = useNavigate();
  const shop        = useShopStore();
  const charStore   = useCharacterStore();
  const { character } = useGameStore();
  const [open, setOpen] = useState(false);
  const [tab, setTab]   = useState<Tab>('bag');

  const scrolls = Math.round(shop.attackBonus / 5);
  const total   = shop.potions + shop.antidotes + scrolls;

  const bagItems = [
    { icon: '🧪', label: 'Health Potion', value: shop.potions,   max: 5, color: '#16a34a' },
    { icon: '💊', label: 'Antidote',       value: shop.antidotes, max: 5, color: '#059669' },
    { icon: '📜', label: 'ATK Scroll',     value: scrolls,        max: 3, color: '#c2410c',
      sub: shop.attackBonus > 0 ? `+${shop.attackBonus} ATK` : undefined },
  ];

  const charClass = character?.class ?? charStore.selectedClass;
  const charLevel = character?.level ?? 1;

  // อุปกรณ์ที่ซื้อแล้ว (filter ตาม class + level)
  const ownedBySlot: Record<string, EquipmentItem[]> = { weapon: [], armor: [], head: [], accessory: [] };
  for (const id of shop.purchasedEquipment) {
    const item = ALL_EQUIPMENT.find(e => e.id === id);
    if (!item) continue;
    const classOk = item.allowedClasses.length === 0 || item.allowedClasses.includes(charClass as never);
    if (classOk) ownedBySlot[item.type]?.push(item);
  }

  function handleShop() {
    setOpen(false);
    if (onShopClick) onShopClick();
    else navigate('/shop');
  }

  return (
    <>
      {open && createPortal(
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 99999,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'linear-gradient(135deg,#1a1a3e,#12122a)',
              border: '1px solid rgba(124,58,237,0.35)',
              borderRadius: 20, width: 300,
              maxHeight: '80vh', display: 'flex', flexDirection: 'column',
              boxShadow: '0 24px 80px rgba(0,0,0,0.8)',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px 0' }}>
              <span style={{ color: 'white', fontWeight: 800, fontSize: 15 }}>🎒 กระเป๋า</span>
              <button onClick={() => setOpen(false)} style={{
                background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 18, cursor: 'pointer',
              }}>✕</button>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.08)', margin: '10px 0 0' }}>
              {([['bag', '🧪 ของใช้'], ['equip', '⚔️ Equip']] as [Tab, string][]).map(([key, label]) => (
                <button key={key} onClick={() => setTab(key)} style={{
                  flex: 1, padding: '8px 0', border: 'none',
                  background: tab === key ? 'rgba(99,102,241,0.15)' : 'transparent',
                  color: tab === key ? '#a5b4fc' : 'rgba(255,255,255,0.35)',
                  fontWeight: tab === key ? 800 : 500, fontSize: 12,
                  borderBottom: tab === key ? '2px solid #6366f1' : '2px solid transparent',
                  cursor: 'pointer',
                }}>{label}</button>
              ))}
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>

              {/* ── Bag tab ── */}
              {tab === 'bag' && bagItems.map(item => (
                <div key={item.label} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '10px 12px',
                  border: `1px solid ${item.color}22`,
                }}>
                  <span style={{ fontSize: 22, flexShrink: 0 }}>{item.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: 'white', fontSize: 12, fontWeight: 700 }}>{item.label}</div>
                    {item.sub && <div style={{ color: item.color, fontSize: 10, fontWeight: 700 }}>{item.sub}</div>}
                    <div style={{ display: 'flex', gap: 3, marginTop: 4 }}>
                      {Array.from({ length: item.max }).map((_, i) => (
                        <div key={i} style={{
                          width: 8, height: 4, borderRadius: 1,
                          background: i < item.value ? item.color : 'rgba(255,255,255,0.1)',
                        }} />
                      ))}
                    </div>
                  </div>
                  <span style={{ color: item.value > 0 ? 'white' : 'rgba(255,255,255,0.25)', fontSize: 18, fontWeight: 900 }}>
                    {item.value}
                  </span>
                </div>
              ))}

              {/* ── Equip tab ── */}
              {tab === 'equip' && SLOT_ORDER.map(slot => {
                const equipped = charStore.equipment[slot];
                const owned    = ownedBySlot[slot] ?? [];
                return (
                  <div key={slot}>
                    {/* Slot header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                      <span style={{ fontSize: 14 }}>{SLOT_ICON[slot]}</span>
                      <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
                        {SLOT_LABEL[slot]}
                      </span>
                    </div>

                    {/* Equipped item */}
                    {equipped ? (
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        background: 'rgba(74,222,128,0.07)', border: '1px solid rgba(74,222,128,0.25)',
                        borderRadius: 8, padding: '7px 10px', marginBottom: 4,
                      }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: RARITY_COLOR[equipped.rarity] ?? '#9ca3af', flexShrink: 0, display: 'inline-block' }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ color: '#4ade80', fontSize: 11, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{equipped.name}</div>
                        </div>
                        <button onClick={() => {
                          charStore.unequipItem(slot);
                          if (character) {
                            const eq = useCharacterStore.getState().equipment;
                            saveEquippedItems(character.playerId, character.class, {
                              weapon:    eq.weapon?.id    ?? null,
                              armor:     eq.armor?.id     ?? null,
                              head:      eq.head?.id      ?? null,
                              accessory: eq.accessory?.id ?? null,
                              [slot]: null,
                            }).catch(() => {});
                          }
                        }} style={{
                          background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
                          borderRadius: 6, color: '#f87171', fontSize: 10, fontWeight: 700,
                          padding: '2px 8px', cursor: 'pointer',
                        }}>ถอด</button>
                      </div>
                    ) : (
                      <div style={{
                        color: 'rgba(255,255,255,0.2)', fontSize: 11, textAlign: 'center',
                        border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 8,
                        padding: '6px', marginBottom: 4,
                      }}>— ว่าง —</div>
                    )}

                    {/* Owned items for this slot */}
                    {owned.filter(i => i.requiredLevel <= charLevel && i.id !== equipped?.id).map(item => {
                      const rc = RARITY_COLOR[item.rarity] ?? '#9ca3af';
                      return (
                        <div key={item.id} style={{
                          display: 'flex', alignItems: 'center', gap: 8,
                          background: 'rgba(255,255,255,0.03)', border: `1px solid ${rc}22`,
                          borderRadius: 8, padding: '6px 10px', marginBottom: 3,
                        }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: rc, flexShrink: 0, display: 'inline-block' }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ color: 'white', fontSize: 11, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                          </div>
                          <button onClick={() => {
                            charStore.equipItem(item);
                            if (character) {
                              const eq = useCharacterStore.getState().equipment;
                              saveEquippedItems(character.playerId, character.class, {
                                weapon:    eq.weapon?.id    ?? null,
                                armor:     eq.armor?.id     ?? null,
                                head:      eq.head?.id      ?? null,
                                accessory: eq.accessory?.id ?? null,
                                [item.type]: item.id,
                              }).catch(() => {});
                            }
                          }} style={{
                            background: `${rc}22`, border: `1px solid ${rc}55`,
                            borderRadius: 6, color: rc, fontSize: 10, fontWeight: 700,
                            padding: '2px 8px', cursor: 'pointer',
                          }}>ใส่</button>
                        </div>
                      );
                    })}

                    {owned.length === 0 && !equipped && (
                      <div style={{ color: 'rgba(255,255,255,0.15)', fontSize: 10, paddingLeft: 4, marginBottom: 4 }}>
                        ยังไม่มีอุปกรณ์ใน slot นี้
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div style={{ padding: '10px 16px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
              <button onClick={handleShop} style={{
                width: '100%', padding: '9px',
                background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.3)',
                borderRadius: 10, color: '#fbbf24', fontWeight: 700, fontSize: 12, cursor: 'pointer',
              }}>
                🏪 ร้านค้า
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Button */}
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          position: 'relative',
          background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.35)',
          borderRadius: 12, padding: compact ? '5px 10px' : '8px 14px',
          cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
        }}
      >
        <span style={{ fontSize: compact ? 16 : 20 }}>🎒</span>
        {!compact && (
          <span style={{ color: '#a5b4fc', fontSize: 11, fontWeight: 700 }}>{total} ชิ้น</span>
        )}
        {total > 0 && (
          <span style={{
            position: 'absolute', top: -4, right: -4,
            background: '#6366f1', color: 'white', fontSize: 9, fontWeight: 900,
            width: 16, height: 16, borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>{total}</span>
        )}
      </button>
    </>
  );
}
