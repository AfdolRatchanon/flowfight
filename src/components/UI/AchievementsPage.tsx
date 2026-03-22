import { useNavigate } from 'react-router-dom';
import { ACHIEVEMENTS } from '../../utils/achievements';
import { useGameStore } from '../../stores/gameStore';
import { useTheme } from '../../contexts/ThemeContext';
import { LEVELS } from '../../utils/constants';
import VolumeButton from './VolumeButton';

const CURRICULUM_BADGES = [
  {
    id: 'badge_apprentice',
    name: 'Algorithm Apprentice',
    subtitle: 'ปวช. — ผ่านด่าน 1–10',
    icon: '🥉',
    color: '#CD7F32',
    requiredLevels: LEVELS.filter((l) => l.number >= 1 && l.number <= 10).map((l) => l.id),
  },
  {
    id: 'badge_expert',
    name: 'Algorithm Expert',
    subtitle: 'ปวช. สูง — ผ่านด่าน 11–20',
    icon: '🥈',
    color: '#C0C0C0',
    requiredLevels: LEVELS.filter((l) => l.number >= 1 && l.number <= 20).map((l) => l.id),
  },
  {
    id: 'badge_master',
    name: 'Algorithm Master',
    subtitle: 'ปวส. — ผ่านด่าน 1–30',
    icon: '🥇',
    color: '#FFD700',
    requiredLevels: LEVELS.filter((l) => l.number >= 1 && l.number <= 30).map((l) => l.id),
  },
];

export default function AchievementsPage() {
  const { player } = useGameStore();
  const { colors } = useTheme();
  const navigate = useNavigate();

  const unlocked = new Set(player?.achievements ?? []);
  const totalUnlocked = ACHIEVEMENTS.filter((a) => unlocked.has(a.id)).length;
  const pct = Math.round((totalUnlocked / ACHIEVEMENTS.length) * 100);
  const completedLevels = new Set(player?.levelsCompleted ?? []);

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

      {/* Curriculum Badges */}
      <div style={{ marginBottom: 24 }}>
        <p style={{ color: '#FBBF24', fontFamily: "'Cinzel', serif", fontSize: 14, fontWeight: 700, margin: '0 0 12px', letterSpacing: 1 }}>
          Curriculum Badges
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
          {CURRICULUM_BADGES.map((badge) => {
            const done = badge.requiredLevels.every((id) => completedLevels.has(id));
            const progress = badge.requiredLevels.filter((id) => completedLevels.has(id)).length;
            const pctB = Math.round((progress / badge.requiredLevels.length) * 100);
            return (
              <div key={badge.id} style={{
                background: done ? `rgba(${badge.color === '#FFD700' ? '251,191,36' : badge.color === '#C0C0C0' ? '192,192,192' : '205,127,50'},0.08)` : colors.bgSurface,
                border: `1px solid ${done ? badge.color + '66' : colors.borderSubtle}`,
                borderRadius: 14, padding: '16px 18px',
                display: 'flex', alignItems: 'center', gap: 14,
                opacity: done ? 1 : 0.6,
              }}>
                <span style={{ fontSize: 40, filter: done ? 'none' : 'grayscale(1)', flexShrink: 0 }}>{badge.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ color: done ? badge.color : colors.textSub, fontWeight: 700, fontSize: 14, margin: '0 0 2px' }}>{badge.name}</p>
                  <p style={{ color: colors.textMuted, fontSize: 11, margin: '0 0 6px' }}>{badge.subtitle}</p>
                  <div style={{ height: 5, background: colors.border, borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: pctB + '%', background: badge.color, borderRadius: 3, transition: 'width 0.5s ease' }} />
                  </div>
                  <p style={{ color: colors.textMuted, fontSize: 10, margin: '3px 0 0' }}>{progress}/{badge.requiredLevels.length} ด่าน</p>
                </div>
                {done && <span style={{ color: '#4ade80', fontSize: 22, flexShrink: 0 }}>✓</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Certificate link */}
      <button
        onClick={() => navigate('/certificate')}
        style={{
          width: '100%', padding: '14px 20px', borderRadius: 12, marginBottom: 24,
          border: '1px solid rgba(184,150,12,0.35)',
          background: 'rgba(184,150,12,0.07)',
          color: '#FFD700', fontWeight: 700, fontSize: 14,
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
          textAlign: 'left',
        }}
      >
        <span style={{ fontSize: 22 }}>📜</span>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontFamily: "'Cinzel', serif", letterSpacing: 1 }}>ใบประกาศนียบัตร</p>
          <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,215,0,0.6)', fontWeight: 400 }}>Certificate of Achievement — พิมพ์/Save PDF</p>
        </div>
        <span style={{ color: 'rgba(255,215,0,0.5)', fontSize: 18 }}>›</span>
      </button>

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
