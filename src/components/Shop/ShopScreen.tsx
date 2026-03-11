import { useState } from 'react';
import { useShopStore } from '../../stores/shopStore';

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
  {
    id: 'potion',
    icon: '🧪',
    label: 'Potion',
    description: 'ฟื้นฟู 30 HP ระหว่างการสู้รบ',
    price: 30,
    max: 5,
    stat: 'potions',
    color: 'rgba(22,101,52,0.3)',
    borderColor: '#16a34a',
  },
  {
    id: 'antidote',
    icon: '💊',
    label: 'Antidote',
    description: 'รักษาสถานะ 🔥🟣❄️ ได้ทุกอย่าง',
    price: 20,
    max: 5,
    stat: 'antidotes',
    color: 'rgba(6,95,70,0.3)',
    borderColor: '#059669',
  },
  {
    id: 'scroll',
    icon: '📜',
    label: 'Attack Scroll',
    description: '+5 ATK สำหรับการสู้รบถัดไป',
    price: 50,
    max: 3,
    stat: 'scroll',
    color: 'rgba(124,45,18,0.3)',
    borderColor: '#c2410c',
  },
];

interface ShopScreenProps {
  goldEarned: number;
  onClose: () => void;
}

export default function ShopScreen({ goldEarned, onClose }: ShopScreenProps) {
  const shop = useShopStore();
  const [credited, setCredited] = useState(false);
  const [bought, setBought] = useState<Record<string, number>>({ potion: 0, antidote: 0, scroll: 0 });
  const [flash, setFlash] = useState<string | null>(null);

  // Credit gold once on first render
  if (!credited) {
    if (goldEarned > 0) shop.addGold(goldEarned);
    setCredited(true);
  }

  function getOwned(item: ShopItem): number {
    if (item.stat === 'potions') return shop.potions;
    if (item.stat === 'antidotes') return shop.antidotes;
    if (item.stat === 'scroll') return shop.attackBonus / 5;
    return 0;
  }

  function buy(item: ShopItem) {
    if (shop.gold < item.price) {
      setFlash(`เงินไม่พอ! ต้องการ ${item.price}g`);
      setTimeout(() => setFlash(null), 1500);
      return;
    }
    const owned = getOwned(item);
    if (owned >= item.max) {
      setFlash(`ถือได้สูงสุด ${item.max} ชิ้นแล้ว`);
      setTimeout(() => setFlash(null), 1500);
      return;
    }
    shop.spendGold(item.price);
    if (item.stat === 'potions') shop.setPotions(shop.potions + 1);
    else if (item.stat === 'antidotes') shop.setAntidotes(shop.antidotes + 1);
    else if (item.stat === 'scroll') shop.setAttackBonus(shop.attackBonus + 5);
    setBought((b) => ({ ...b, [item.id]: (b[item.id] ?? 0) + 1 }));
  }

  const totalSpent = Object.entries(bought).reduce((sum, [id, qty]) => {
    const item = SHOP_CATALOG.find((i) => i.id === id);
    return sum + (item?.price ?? 0) * qty;
  }, 0);

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.85)',
      backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 60,
    }}>
      <div style={{
        width: 460,
        background: 'linear-gradient(160deg,#0f172a,#1e1b4b)',
        border: '1px solid rgba(251,191,36,0.25)',
        borderRadius: 20, overflow: 'hidden',
        boxShadow: '0 30px 80px rgba(0,0,0,0.7)',
      }}>

        {/* Header */}
        <div style={{
          padding: '20px 24px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        }}>
          <div>
            <h2 style={{ color: '#fbbf24', fontWeight: 800, fontSize: 22, margin: 0 }}>🏪 Shop</h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, margin: '3px 0 0' }}>
              เตรียมพร้อมก่อนออกสู้รบถัดไป
            </p>
          </div>
          {/* Gold */}
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

        {/* Inventory bar */}
        <div style={{
          padding: '10px 24px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', gap: 20, alignItems: 'center',
        }}>
          <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, fontWeight: 700 }}>กระเป๋า:</span>
          <Pill icon="🧪" value={shop.potions} label="Potions" />
          <Pill icon="💊" value={shop.antidotes} label="Antidotes" />
          <Pill icon="📜" value={`+${shop.attackBonus}`} label="ATK Scroll" />
        </div>

        {/* Flash message */}
        {flash && (
          <div style={{
            margin: '10px 24px 0',
            background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)',
            borderRadius: 8, padding: '8px 14px',
            color: '#fca5a5', fontSize: 12, fontWeight: 600, textAlign: 'center',
          }}>
            {flash}
          </div>
        )}

        {/* Items */}
        <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {SHOP_CATALOG.map((item) => {
            const owned = getOwned(item);
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
                      <span style={{
                        background: '#4ade8033', border: '1px solid #4ade8055',
                        borderRadius: 20, padding: '1px 8px',
                        color: '#4ade80', fontSize: 10, fontWeight: 700,
                      }}>+{boughtQty}</span>
                    )}
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 2 }}>{item.description}</div>
                  <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, marginTop: 2 }}>
                    ถือได้: {owned}/{item.max}
                  </div>
                </div>
                <button
                  onClick={() => buy(item)}
                  disabled={!canBuy}
                  style={{
                    padding: '8px 18px', borderRadius: 10, border: 'none',
                    background: canBuy
                      ? `linear-gradient(135deg,${item.borderColor},${item.borderColor}cc)`
                      : 'rgba(255,255,255,0.05)',
                    color: canBuy ? 'white' : 'rgba(255,255,255,0.25)',
                    fontWeight: 700, fontSize: 13,
                    cursor: canBuy ? 'pointer' : 'not-allowed',
                    transition: 'all 0.15s',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {owned >= item.max ? 'เต็มแล้ว' : shop.gold < item.price ? 'เงินไม่พอ' : 'ซื้อ'}
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 24px',
          borderTop: '1px solid rgba(255,255,255,0.07)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11 }}>
            {totalSpent > 0 ? `ซื้อไปแล้ว ${totalSpent}g` : 'ยังไม่ได้ซื้ออะไร'}
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '10px 28px', borderRadius: 10, border: 'none',
              background: 'linear-gradient(135deg,#1d4ed8,#1e40af)',
              color: 'white', fontWeight: 700, fontSize: 14,
              cursor: 'pointer',
            }}
          >
            ออกจากร้าน →
          </button>
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
