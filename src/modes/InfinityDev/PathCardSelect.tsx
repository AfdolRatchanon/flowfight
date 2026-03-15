import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useInfinityDevStore } from '../../stores/infinityDevStore';
import { useGameStore } from '../../stores/gameStore';
import { PATH_CARDS } from '../../utils/infinityDevConstants';
import type { PathId } from '../../utils/infinityDevConstants';

export default function PathCardSelect() {
  const navigate = useNavigate();
  const { colors } = useTheme();
  const { startRun } = useInfinityDevStore();
  const { character } = useGameStore();
  const [selected, setSelected] = useState<PathId | null>(null);

  function handleStart() {
    if (!selected) return;
    startRun(selected, {
      hp: character?.stats?.maxHP ?? 100,
      atk: character?.stats?.attack ?? 15,
      def: character?.stats?.defense ?? 5,
      spd: character?.stats?.speed ?? 10,
    });
    navigate('/infinity-dev/battle');
  }

  // suppress unused warning — colors available if needed for future use
  void colors;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg,#0f0c29,#302b63,#24243e)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }}>
      {/* Back */}
      <button
        onClick={() => navigate('/levels')}
        style={{
          position: 'absolute', top: 20, left: 20,
          background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
          color: '#fff', width: 40, height: 40, borderRadius: 10, cursor: 'pointer', fontSize: 18,
        }}
      >
        ←
      </button>

      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>⚡</div>
        <h1 style={{ color: '#fff', fontSize: 28, fontWeight: 900, margin: 0, letterSpacing: 1 }}>INFINITY DEV</h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, margin: '6px 0 0' }}>
          เลือกเส้นทาง — ความสามารถของคุณจะเติบโตตาม Path ที่เลือก
        </p>
      </div>

      <div style={{
        display: 'flex', gap: 24, flexWrap: 'wrap', justifyContent: 'center',
        maxWidth: 900, width: '100%',
      }}>
        {PATH_CARDS.map((path) => {
          const isSelected = selected === path.id;
          return (
            <div
              key={path.id}
              onClick={() => setSelected(path.id)}
              style={{
                flex: '1 1 380px', maxWidth: 420,
                background: isSelected ? `${path.color}22` : 'rgba(255,255,255,0.05)',
                border: `2px solid ${isSelected ? path.color : 'rgba(255,255,255,0.1)'}`,
                borderRadius: 20, padding: 28, cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: isSelected ? `0 0 30px ${path.color}44` : 'none',
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                <div style={{ fontSize: 52, filter: `drop-shadow(0 0 12px ${path.color})` }}>
                  {path.icon}
                </div>
                <div>
                  <div style={{ color: path.color, fontSize: 10, fontWeight: 800, letterSpacing: 2 }}>PATH CARD</div>
                  <div style={{ color: '#fff', fontSize: 20, fontWeight: 900 }}>{path.name}</div>
                  <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>{path.subtitle}</div>
                </div>
              </div>

              {/* Base ability */}
              <div style={{
                background: 'rgba(255,255,255,0.06)', borderRadius: 10,
                padding: '10px 14px', marginBottom: 16,
              }}>
                <div style={{ color: path.color, fontSize: 9, fontWeight: 800, letterSpacing: 1, marginBottom: 4 }}>
                  ความสามารถพื้นฐาน
                </div>
                <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13 }}>{path.description}</div>
              </div>

              {/* Synergy scaling */}
              <div>
                <div style={{
                  color: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: 800,
                  letterSpacing: 1, marginBottom: 8,
                }}>
                  SYNERGY SCALING
                </div>
                {path.synergyScaling.map((tier) => (
                  <div key={tier.supCardsRequired} style={{
                    display: 'flex', gap: 10, marginBottom: 6, alignItems: 'flex-start',
                  }}>
                    <div style={{
                      background: path.color, color: '#000', fontSize: 9, fontWeight: 900,
                      borderRadius: 4, padding: '1px 6px', flexShrink: 0, minWidth: 28, textAlign: 'center',
                    }}>
                      ×{tier.supCardsRequired}
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, lineHeight: 1.4 }}>
                      {tier.description}
                    </div>
                  </div>
                ))}
              </div>

              {isSelected && (
                <div style={{
                  marginTop: 16, background: path.color, color: '#000', textAlign: 'center',
                  borderRadius: 8, padding: '6px', fontWeight: 900, fontSize: 12,
                }}>
                  ✓ เลือกแล้ว
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button
        onClick={handleStart}
        disabled={!selected}
        style={{
          marginTop: 32, padding: '14px 48px',
          background: selected ? 'linear-gradient(135deg,#f59e0b,#ef4444)' : 'rgba(255,255,255,0.1)',
          border: 'none', borderRadius: 14, cursor: selected ? 'pointer' : 'not-allowed',
          color: selected ? '#000' : 'rgba(255,255,255,0.3)',
          fontSize: 16, fontWeight: 900, letterSpacing: 1, transition: 'all 0.2s',
        }}
      >
        {selected
          ? `เริ่มด้วย ${PATH_CARDS.find((p) => p.id === selected)?.name}`
          : 'เลือก Path ก่อน'}
      </button>
    </div>
  );
}
