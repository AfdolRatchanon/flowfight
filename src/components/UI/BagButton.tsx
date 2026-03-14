import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useShopStore } from '../../stores/shopStore';

interface BagButtonProps {
  /** ซ่อน label "X ชิ้น" — ใช้ใน battle header ที่พื้นที่แคบ */
  compact?: boolean;
  /** ระยะห่างจากบนหน้าจอที่ overlay panel จะเปิด (default 68) */
  overlayTop?: number;
}

export default function BagButton({ compact = false, overlayTop = 68 }: BagButtonProps) {
  const navigate = useNavigate();
  const shop = useShopStore();
  const [open, setOpen] = useState(false);

  const scrolls = Math.round(shop.attackBonus / 5);
  const total   = shop.potions + shop.antidotes + scrolls;

  const items = [
    { icon: '🧪', label: 'Health Potion', value: shop.potions,   max: 5, color: '#16a34a' },
    { icon: '💊', label: 'Antidote',       value: shop.antidotes, max: 5, color: '#059669' },
    { icon: '📜', label: 'ATK Scroll',     value: scrolls,        max: 3, color: '#c2410c',
      sub: shop.attackBonus > 0 ? `+${shop.attackBonus} ATK` : undefined },
  ];

  return (
    <>
      {/* ── Overlay (portal → document.body ให้อยู่เหนือทุก stacking context) ── */}
      {open && createPortal(
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 99999,
            background: 'rgba(0,0,0,0.55)',
            display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end',
            padding: `${overlayTop}px 16px 0`,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'linear-gradient(135deg,#1a1a3e,#12122a)',
              border: '1px solid rgba(124,58,237,0.35)',
              borderRadius: 18, padding: '18px 18px 14px',
              minWidth: 210, boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <span style={{ color: 'white', fontWeight: 800, fontSize: 14 }}>🎒 กระเป๋า</span>
              <button onClick={() => setOpen(false)} style={{
                background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 16, cursor: 'pointer',
              }}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {items.map((item) => (
                <div key={item.label} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '8px 12px',
                  border: `1px solid ${item.color}22`,
                }}>
                  <span style={{ fontSize: 20, flexShrink: 0 }}>{item.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: 'white', fontSize: 11, fontWeight: 700 }}>{item.label}</div>
                    {item.sub && <div style={{ color: item.color, fontSize: 10, fontWeight: 700 }}>{item.sub}</div>}
                    <div style={{ display: 'flex', gap: 3, marginTop: 3 }}>
                      {Array.from({ length: item.max }).map((_, i) => (
                        <div key={i} style={{
                          width: 8, height: 4, borderRadius: 1,
                          background: i < item.value ? item.color : 'rgba(255,255,255,0.1)',
                        }} />
                      ))}
                    </div>
                  </div>
                  <span style={{ color: item.value > 0 ? 'white' : 'rgba(255,255,255,0.25)', fontSize: 16, fontWeight: 900 }}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={() => { setOpen(false); navigate('/shop'); }}
              style={{
                marginTop: 12, width: '100%', padding: '9px',
                background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.3)',
                borderRadius: 10, color: '#fbbf24', fontWeight: 700, fontSize: 12, cursor: 'pointer',
              }}
            >
              🏪 ไปร้านค้า
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* ── Button ── */}
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          position: 'relative',
          background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.35)',
          borderRadius: 12,
          padding: compact ? '6px 10px' : '8px 14px',
          cursor: 'pointer',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
        }}
      >
        <span style={{ fontSize: compact ? 18 : 20 }}>🎒</span>
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
