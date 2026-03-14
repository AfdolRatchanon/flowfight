import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useShopStore, RESTOCK_INTERVAL_MS, RESTOCK_POTIONS, RESTOCK_ANTIDOTES } from '../../stores/shopStore';
import { useGameStore } from '../../stores/gameStore';
import { saveShopData } from '../../services/authService';
import { useTheme } from '../../contexts/ThemeContext';

// ─── Catalog ─────────────────────────────────────────────────────────────────

interface ShopItem {
  id: string;
  icon: string;
  label: string;
  description: string;
  effect: string;
  price: number;
  max: number;
  category: 'consumable' | 'upgrade';
  color: string;
  border: string;
}

const CATALOG: ShopItem[] = [
  {
    id: 'potion',
    icon: '🧪',
    label: 'Health Potion',
    description: 'ฟื้นฟู 30 HP ระหว่างการสู้รบ',
    effect: '+30 HP',
    price: 30,
    max: 5,
    category: 'consumable',
    color: 'rgba(21,128,61,0.2)',
    border: '#16a34a',
  },
  {
    id: 'antidote',
    icon: '💊',
    label: 'Antidote',
    description: 'รักษาสถานะผิดปกติ Burn / Poison / Freeze ทันที',
    effect: 'Cure All',
    price: 20,
    max: 5,
    category: 'consumable',
    color: 'rgba(5,150,105,0.2)',
    border: '#059669',
  },
  {
    id: 'scroll',
    icon: '📜',
    label: 'Attack Scroll',
    description: 'เพิ่ม ATK +5 สำหรับการสู้รบถัดไป',
    effect: '+5 ATK',
    price: 50,
    max: 3,
    category: 'upgrade',
    color: 'rgba(194,65,12,0.2)',
    border: '#c2410c',
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getOwned(id: string, shop: { potions: number; antidotes: number; attackBonus: number }): number {
  if (id === 'potion') return shop.potions;
  if (id === 'antidote') return shop.antidotes;
  if (id === 'scroll') return Math.round(shop.attackBonus / 5);
  return 0;
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return 'พร้อมแล้ว!';
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  if (h > 0) return `${h}ชม. ${m}น.`;
  if (m > 0) return `${m}น. ${s}ว.`;
  return `${s}ว.`;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ShopPage() {
  const navigate = useNavigate();
  const { colors } = useTheme();
  const shop = useShopStore();
  const { player } = useGameStore();
  const [flash, setFlash] = useState<{ msg: string; ok: boolean } | null>(null);
  const [bought, setBought] = useState<Record<string, number>>({});
  const [countdown, setCountdown] = useState(shop.nextRestockMs());
  const [restockReady, setRestockReady] = useState(shop.isRestockReady());

  // Countdown ticker
  useEffect(() => {
    const tick = () => {
      const ms = useShopStore.getState().nextRestockMs();
      setCountdown(ms);
      setRestockReady(ms <= 0);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [shop.lastRestockTime]);

  function showFlash(msg: string, ok: boolean) {
    setFlash({ msg, ok });
    setTimeout(() => setFlash(null), 1800);
  }

  function buy(item: ShopItem) {
    if (shop.gold < item.price) {
      showFlash(`เงินไม่พอ! ต้องการ ${item.price}g (มี ${shop.gold}g)`, false);
      return;
    }
    const owned = getOwned(item.id, shop);
    if (owned >= item.max) {
      showFlash(`ถือ ${item.label} ได้สูงสุด ${item.max} ชิ้น`, false);
      return;
    }
    shop.spendGold(item.price);
    if (item.id === 'potion') shop.setPotions(shop.potions + 1);
    else if (item.id === 'antidote') shop.setAntidotes(shop.antidotes + 1);
    else if (item.id === 'scroll') shop.setAttackBonus(shop.attackBonus + 5);
    setBought((b) => ({ ...b, [item.id]: (b[item.id] ?? 0) + 1 }));
    showFlash(`ซื้อ ${item.label} สำเร็จ!`, true);
    // Save gold + potions/antidotes ทันที
    if (player) {
      const s = useShopStore.getState();
      saveShopData(player.id, s.gold, s.purchasedEquipment, s.lastRestockTime, s.potions, s.antidotes, s.attackBonus).catch(() => {});
    }
  }

  function claimRestock() {
    if (!restockReady) return;
    shop.claimRestock();
    showFlash(`รับของฟรี! +${RESTOCK_POTIONS} 🧪 +${RESTOCK_ANTIDOTES} 💊`, true);
    // save to Firebase
    if (player) {
      const s = useShopStore.getState();
      saveShopData(player.id, s.gold, s.purchasedEquipment, s.lastRestockTime, s.potions, s.antidotes, s.attackBonus).catch(() => {});
    }
  }

  const consumables = CATALOG.filter((i) => i.category === 'consumable');
  const upgrades    = CATALOG.filter((i) => i.category === 'upgrade');

  // Progress for countdown bar (0–1)
  const restockPct = restockReady ? 1 : 1 - countdown / RESTOCK_INTERVAL_MS;

  return (
    <div style={{
      minHeight: '100vh',
      background: colors.bgGrad,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '24px 16px 48px',
    }}>

      {/* ── Header ── */}
      <div style={{
        width: '100%', maxWidth: 640,
        display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24,
      }}>
        <button
          onClick={() => navigate('/levels')}
          style={{
            background: colors.bgSurface, border: `1px solid ${colors.borderSubtle}`,
            color: colors.text, width: 40, height: 40, borderRadius: 10,
            cursor: 'pointer', fontSize: 18, flexShrink: 0,
          }}
        >←</button>
        <div style={{ flex: 1 }}>
          <h1 style={{ color: colors.text, fontWeight: 800, fontSize: 26, margin: 0 }}>
            🏪 Shop
          </h1>
          <p style={{ color: colors.textMuted, fontSize: 12, margin: 0 }}>
            เตรียมพร้อมก่อนออกสู้รบ
          </p>
        </div>

        {/* Gold badge */}
        <div style={{
          background: 'rgba(251,191,36,0.1)',
          border: '1px solid rgba(251,191,36,0.35)',
          borderRadius: 14, padding: '10px 20px', textAlign: 'center',
        }}>
          <div style={{ color: '#fbbf24', fontSize: 22, fontWeight: 900 }}>💰 {shop.gold}g</div>
          <div style={{ color: colors.textMuted, fontSize: 10 }}>เงินสะสม</div>
        </div>
      </div>

      {/* ── Flash message ── */}
      <div style={{
        width: '100%', maxWidth: 640, marginBottom: flash ? 14 : 0,
        transition: 'margin 0.2s',
      }}>
        {flash && (
          <div style={{
            background: flash.ok ? 'rgba(22,163,74,0.15)' : 'rgba(239,68,68,0.15)',
            border: `1px solid ${flash.ok ? '#16a34a' : '#ef4444'}88`,
            borderRadius: 10, padding: '10px 16px',
            color: flash.ok ? '#4ade80' : '#fca5a5',
            fontSize: 13, fontWeight: 600, textAlign: 'center',
          }}>
            {flash.ok ? '✅ ' : '❌ '}{flash.msg}
          </div>
        )}
      </div>

      {/* ── Daily Restock Card ── */}
      <div style={{
        width: '100%', maxWidth: 640, marginBottom: 20,
        background: restockReady
          ? 'linear-gradient(135deg, rgba(74,222,128,0.12), rgba(34,197,94,0.08))'
          : 'linear-gradient(135deg, rgba(124,58,237,0.08), rgba(99,102,241,0.05))',
        border: `1px solid ${restockReady ? 'rgba(74,222,128,0.4)' : 'rgba(124,58,237,0.25)'}`,
        borderRadius: 16, padding: '16px 20px',
        transition: 'all 0.4s',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* Icon */}
          <div style={{
            width: 48, height: 48, borderRadius: 12, flexShrink: 0,
            background: restockReady ? 'rgba(74,222,128,0.15)' : 'rgba(124,58,237,0.12)',
            border: `1px solid ${restockReady ? 'rgba(74,222,128,0.4)' : 'rgba(124,58,237,0.3)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24,
          }}>
            {restockReady ? '🎁' : '⏳'}
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ color: 'white', fontWeight: 800, fontSize: 14 }}>Daily Restock</span>
              {restockReady && (
                <span style={{
                  background: 'rgba(74,222,128,0.2)', border: '1px solid rgba(74,222,128,0.5)',
                  borderRadius: 20, padding: '1px 8px',
                  color: '#4ade80', fontSize: 10, fontWeight: 800,
                }}>พร้อมแล้ว!</span>
              )}
            </div>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, margin: '0 0 8px' }}>
              รับฟรี +{RESTOCK_POTIONS} 🧪 +{RESTOCK_ANTIDOTES} 💊 ทุก 8 ชั่วโมง
            </p>
            {/* Progress bar */}
            <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{
                width: `${restockPct * 100}%`, height: '100%', borderRadius: 2,
                background: restockReady
                  ? 'linear-gradient(90deg, #4ade80, #22c55e)'
                  : 'linear-gradient(90deg, #7c3aed, #6366f1)',
                transition: 'width 1s linear',
              }} />
            </div>
            {!restockReady && (
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, margin: '4px 0 0' }}>
                อีก {formatCountdown(countdown)}
              </p>
            )}
          </div>

          {/* Claim button */}
          <button
            onClick={claimRestock}
            disabled={!restockReady}
            style={{
              padding: '10px 18px', borderRadius: 10, border: 'none',
              background: restockReady
                ? 'linear-gradient(135deg, #16a34a, #22c55e)'
                : 'rgba(255,255,255,0.06)',
              color: restockReady ? 'white' : 'rgba(255,255,255,0.2)',
              fontWeight: 800, fontSize: 13,
              cursor: restockReady ? 'pointer' : 'not-allowed',
              flexShrink: 0, minWidth: 80, textAlign: 'center',
              boxShadow: restockReady ? '0 0 16px rgba(34,197,94,0.4)' : 'none',
              transition: 'all 0.2s',
            }}
          >
            {restockReady ? 'รับเลย!' : 'รอก่อน'}
          </button>
        </div>
      </div>

      {/* ── Inventory card ── */}
      <div style={{
        width: '100%', maxWidth: 640, marginBottom: 24,
        background: colors.bgSurface,
        border: `1px solid ${colors.borderSubtle}`,
        borderRadius: 16, padding: '14px 20px',
      }}>
        <p style={{ color: colors.textMuted, fontSize: 10, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', margin: '0 0 12px' }}>
          กระเป๋าของฉัน
        </p>
        <div style={{ display: 'flex', gap: 16 }}>
          <InventorySlot icon="🧪" label="Health Potion" value={shop.potions} max={5} color="#16a34a" />
          <InventorySlot icon="💊" label="Antidote"      value={shop.antidotes} max={5} color="#059669" />
          <InventorySlot icon="📜" label="ATK Scroll"    value={Math.round(shop.attackBonus / 5)} max={3} color="#c2410c" suffix={`(+${shop.attackBonus} ATK)`} />
        </div>
      </div>

      {/* ── Consumables ── */}
      <Section title="Consumables" subtitle="ใช้ได้ระหว่างการสู้รบ" maxWidth={640}>
        {consumables.map((item) => (
          <ItemCard key={item.id} item={item} shop={shop} bought={bought[item.id] ?? 0} onBuy={buy} />
        ))}
      </Section>

      {/* ── Upgrades ── */}
      <Section title="Upgrades" subtitle="เพิ่มพลังตัวละครถาวร (per battle)" maxWidth={640}>
        {upgrades.map((item) => (
          <ItemCard key={item.id} item={item} shop={shop} bought={bought[item.id] ?? 0} onBuy={buy} />
        ))}
      </Section>

      {/* ── Footer tip ── */}
      <div style={{
        width: '100%', maxWidth: 640, marginTop: 8,
        background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.15)',
        borderRadius: 12, padding: '10px 16px',
        color: 'rgba(251,191,36,0.6)', fontSize: 11, textAlign: 'center',
      }}>
        💡 สามารถหาทองเพิ่มได้จากการชนะการสู้รบในแต่ละด่าน
      </div>

    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Section({ title, subtitle, maxWidth, children }: {
  title: string; subtitle: string; maxWidth: number;
  children: React.ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <div style={{ width: '100%', maxWidth, marginBottom: 20 }}>
      <div style={{ marginBottom: 10 }}>
        <h2 style={{ color: colors.text, fontWeight: 800, fontSize: 15, margin: 0 }}>{title}</h2>
        <p style={{ color: colors.textMuted, fontSize: 11, margin: 0 }}>{subtitle}</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {children}
      </div>
    </div>
  );
}

function ItemCard({ item, shop, bought, onBuy }: {
  item: ShopItem;
  shop: { potions: number; antidotes: number; attackBonus: number; gold: number };
  bought: number;
  onBuy: (item: ShopItem) => void;
}) {
  const owned = getOwned(item.id, shop);
  const full  = owned >= item.max;
  const poor  = shop.gold < item.price;
  const canBuy = !full && !poor;

  return (
    <div style={{
      background: item.color,
      border: `1px solid ${item.border}44`,
      borderRadius: 14, padding: '14px 18px',
      display: 'flex', alignItems: 'center', gap: 16,
    }}>
      {/* Icon */}
      <div style={{
        width: 52, height: 52, borderRadius: 12, flexShrink: 0,
        background: `${item.border}22`,
        border: `1px solid ${item.border}44`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 26,
      }}>
        {item.icon}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
          <span style={{ color: 'white', fontWeight: 700, fontSize: 15 }}>{item.label}</span>
          <span style={{
            background: `${item.border}33`, border: `1px solid ${item.border}66`,
            borderRadius: 6, padding: '1px 7px',
            color: item.border, fontSize: 10, fontWeight: 800,
          }}>{item.effect}</span>
          {bought > 0 && (
            <span style={{
              background: 'rgba(74,222,128,0.15)', border: '1px solid rgba(74,222,128,0.35)',
              borderRadius: 20, padding: '1px 8px',
              color: '#4ade80', fontSize: 10, fontWeight: 700,
            }}>+{bought} ซื้อแล้ว</span>
          )}
        </div>
        <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, margin: '0 0 4px' }}>{item.description}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Stock bar */}
          <div style={{ display: 'flex', gap: 3 }}>
            {Array.from({ length: item.max }).map((_, i) => (
              <div key={i} style={{
                width: 8, height: 8, borderRadius: 2,
                background: i < owned ? item.border : 'rgba(255,255,255,0.1)',
              }} />
            ))}
          </div>
          <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10 }}>{owned}/{item.max}</span>
        </div>
      </div>

      {/* Price + Buy */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
        <span style={{ color: '#fbbf24', fontSize: 16, fontWeight: 900 }}>{item.price}g</span>
        <button
          onClick={() => onBuy(item)}
          disabled={!canBuy}
          style={{
            padding: '8px 20px', borderRadius: 10, border: 'none',
            background: canBuy
              ? `linear-gradient(135deg, ${item.border}, ${item.border}bb)`
              : 'rgba(255,255,255,0.06)',
            color: canBuy ? 'white' : 'rgba(255,255,255,0.25)',
            fontWeight: 700, fontSize: 13,
            cursor: canBuy ? 'pointer' : 'not-allowed',
            transition: 'opacity 0.15s',
            minWidth: 72, textAlign: 'center',
          }}
        >
          {full ? 'เต็มแล้ว' : poor ? 'ไม่พอ' : 'ซื้อ'}
        </button>
      </div>
    </div>
  );
}

function InventorySlot({ icon, label, value, max, color, suffix }: {
  icon: string; label: string; value: number; max: number; color: string; suffix?: string;
}) {
  const { colors } = useTheme();
  return (
    <div style={{
      flex: 1, background: `${color}11`,
      border: `1px solid ${color}33`, borderRadius: 10, padding: '10px 12px',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
    }}>
      <span style={{ fontSize: 22 }}>{icon}</span>
      <span style={{ color: 'white', fontSize: 16, fontWeight: 800 }}>{value}<span style={{ color: colors.textMuted, fontSize: 11 }}>/{max}</span></span>
      <span style={{ color: colors.textMuted, fontSize: 9, textAlign: 'center' }}>{label}</span>
      {suffix && <span style={{ color, fontSize: 9, fontWeight: 700 }}>{suffix}</span>}
    </div>
  );
}
