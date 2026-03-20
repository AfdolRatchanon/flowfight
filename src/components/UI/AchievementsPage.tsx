import { useNavigate } from 'react-router-dom';
import { ACHIEVEMENTS } from '../../utils/achievements';
import { useGameStore } from '../../stores/gameStore';
import { useTheme } from '../../contexts/ThemeContext';
import VolumeButton from './VolumeButton';

export default function AchievementsPage() {
  const { player } = useGameStore();
  const { colors } = useTheme();
  const navigate = useNavigate();

  const unlocked = new Set(player?.achievements ?? []);
  const totalUnlocked = ACHIEVEMENTS.filter((a) => unlocked.has(a.id)).length;
  const pct = Math.round((totalUnlocked / ACHIEVEMENTS.length) * 100);

  return (
    <div style={{ minHeight: '100vh', background: colors.bgGrad, padding: 24 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <button
          onClick={() => navigate('/')}
          style={{
            background: colors.bgSurface, border: `1px solid ${colors.borderSubtle}`,
            color: colors.text, width: 40, height: 40, borderRadius: 10,
            cursor: 'pointer', fontSize: 18, flexShrink: 0,
          }}
        >←</button>

        <div style={{ flex: 1 }}>
          <h1 style={{
            fontFamily: "'Cinzel', serif", color: '#FBBF24',
            fontSize: 22, margin: 0, letterSpacing: 2,
          }}>Achievements</h1>
          <p style={{ color: colors.textMuted, fontSize: 13, margin: '2px 0 0' }}>
            {totalUnlocked}/{ACHIEVEMENTS.length} ปลดล็อคแล้ว
          </p>
        </div>

        <VolumeButton variant="header" />
      </div>

      {/* Progress bar */}
      <div style={{
        background: colors.bgSurface, border: `1px solid ${colors.borderSubtle}`,
        borderRadius: 12, padding: '12px 16px', marginBottom: 20,
        display: 'flex', alignItems: 'center', gap: 14,
      }}>
        <span style={{ color: '#FBBF24', fontSize: 24 }}>🏆</span>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ color: colors.textSub, fontSize: 13, fontWeight: 700 }}>ความคืบหน้าทั้งหมด</span>
            <span style={{ color: '#FBBF24', fontSize: 13, fontWeight: 800 }}>{pct}%</span>
          </div>
          <div style={{ height: 8, background: colors.border, borderRadius: 4, overflow: 'hidden' }}>
            <div style={{
              width: pct + '%', height: '100%', borderRadius: 4,
              background: 'linear-gradient(90deg, #fbbf24, #f59e0b)',
              transition: 'width 0.6s ease',
            }} />
          </div>
        </div>
      </div>

      {/* Achievement grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: 12,
      }}>
        {ACHIEVEMENTS.map((a) => {
          const done = unlocked.has(a.id);
          return (
            <div
              key={a.id}
              style={{
                background: done ? 'rgba(251,191,36,0.07)' : colors.bgSurface,
                border: done
                  ? '1px solid rgba(251,191,36,0.35)'
                  : `1px solid ${colors.borderSubtle}`,
                borderRadius: 14,
                padding: '16px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                opacity: done ? 1 : 0.45,
                transition: 'all 0.2s',
                position: 'relative',
              }}
            >
              {/* Icon */}
              <span style={{
                fontSize: 36,
                filter: done ? 'none' : 'grayscale(1)',
                flexShrink: 0,
                lineHeight: 1,
              }}>{a.icon}</span>

              {/* Text */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  color: done ? '#FBBF24' : colors.textSub,
                  fontWeight: 700, fontSize: 14, margin: '0 0 3px',
                }}>{a.name}</p>
                <p style={{
                  color: colors.textMuted, fontSize: 12, margin: 0,
                  lineHeight: 1.4,
                }}>{done ? a.description : '???'}</p>
              </div>

              {/* Checkmark */}
              {done && (
                <span style={{
                  color: '#4ade80', fontSize: 20, fontWeight: 900,
                  flexShrink: 0,
                }}>✓</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
