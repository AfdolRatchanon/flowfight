import { useNavigate } from 'react-router-dom';
import { LEVELS } from '../../utils/constants';
import { useGameStore } from '../../stores/gameStore';
import { useShopStore } from '../../stores/shopStore';
import { levelProgressPct, MAX_LEVEL } from '../../utils/levelSystem';
import { useTheme } from '../../contexts/ThemeContext';
import { useFlowchartStore } from '../../stores/flowchartStore';
import BagButton from './BagButton';

export default function ModeSelect() {
  const navigate = useNavigate();
  const { player, character } = useGameStore();
  const { colors } = useTheme();
  const shopStore = useShopStore();
  const completed = player?.levelsCompleted ?? [];

  return (
    <div className="page-outer">
      <div className="page-container">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
          <button onClick={() => navigate('/')} style={{
            background: colors.bgSurface, border: `1px solid ${colors.borderSubtle}`,
            color: colors.text, width: 40, height: 40, borderRadius: 10, cursor: 'pointer', fontSize: 18,
          }}>←</button>
          <div style={{ flex: 1 }}>
            <h1 style={{ color: colors.text, fontWeight: 800, fontSize: 26, margin: 0 }}>เลือกโหมด</h1>
            <p style={{ color: colors.textMuted, fontSize: 13, margin: 0 }}>เลือกวิธีที่คุณต้องการเล่น</p>
          </div>

          <BagButton />

          {/* Shop */}
          <button onClick={() => navigate('/shop')} style={{
            background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.35)',
            borderRadius: 12, padding: '8px 14px', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
          }}>
            <span style={{ fontSize: 20 }}>🏪</span>
            <span style={{ color: '#fbbf24', fontSize: 11, fontWeight: 700 }}>{shopStore.gold}g</span>
          </button>

          {/* Character badge */}
          {character && (
            <div style={{
              background: colors.bgSurface, border: `1px solid ${colors.border}`,
              borderRadius: 12, padding: '8px 12px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, minWidth: 72,
            }}>
              <img src={`/characters/${character.class}.png`} alt={character.class}
                style={{ width: 36, height: 36, objectFit: 'contain', imageRendering: 'pixelated' }} />
              <span style={{
                background: 'linear-gradient(135deg,#fbbf24,#f59e0b)',
                color: '#1c1917', fontSize: 9, fontWeight: 900, padding: '1px 6px', borderRadius: 4,
              }}>Lv.{character.level}</span>
              <div style={{ width: 52, height: 3, background: colors.border, borderRadius: 2, overflow: 'hidden' }}>
                <div style={{
                  width: levelProgressPct(character.level, character.experience) + '%',
                  height: '100%', background: 'linear-gradient(90deg,#fbbf24,#f59e0b)', borderRadius: 2,
                }} />
              </div>
              <span style={{ color: colors.textMuted, fontSize: 8 }}>
                {character.level >= MAX_LEVEL ? 'MAX' : `${character.experience} XP`}
              </span>
            </div>
          )}
        </div>

        {/* ── Mode Cards ─────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Tutorial Mode */}
          <div
            onClick={() => navigate('/levels/tutorial')}
            style={{
              background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(99,102,241,0.06))',
              border: '1px solid rgba(59,130,246,0.35)',
              borderRadius: 20, padding: '28px 32px',
              cursor: 'pointer', transition: 'all 0.2s', position: 'relative', overflow: 'hidden',
            }}
            onMouseEnter={(e) => {
              const d = e.currentTarget as HTMLDivElement;
              d.style.background = 'linear-gradient(135deg, rgba(59,130,246,0.18), rgba(99,102,241,0.1))';
              d.style.transform = 'translateY(-3px)';
              d.style.boxShadow = '0 12px 40px rgba(59,130,246,0.2)';
            }}
            onMouseLeave={(e) => {
              const d = e.currentTarget as HTMLDivElement;
              d.style.background = 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(99,102,241,0.06))';
              d.style.transform = 'none';
              d.style.boxShadow = 'none';
            }}
          >
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 5, background: 'linear-gradient(180deg,#3b82f6,#6366f1)', borderRadius: '20px 0 0 20px' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
              <div style={{ fontSize: 56, flexShrink: 0, filter: 'drop-shadow(0 0 12px rgba(59,130,246,0.4))' }}>📚</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <span style={{
                    background: 'rgba(59,130,246,0.2)', color: '#93c5fd',
                    fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 6,
                    border: '1px solid rgba(59,130,246,0.4)', letterSpacing: 1,
                  }}>TUTORIAL MODE</span>
                </div>
                <h2 style={{ color: colors.text, fontWeight: 800, fontSize: 22, margin: '0 0 6px' }}>
                  เรียนรู้ Flowchart
                </h2>
                <p style={{ color: colors.textSub, fontSize: 14, margin: '0 0 14px', lineHeight: 1.5 }}>
                  15 ด่าน สอนการวางแผน Flowchart ทีละขั้นตอน เหมาะสำหรับผู้เริ่มต้น
                </p>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ color: colors.textMuted, fontSize: 11 }}>ความคืบหน้า</span>
                    <span style={{ color: '#93c5fd', fontSize: 11, fontWeight: 700 }}>
                      {completed.length}/{LEVELS.length} ด่าน
                    </span>
                  </div>
                  <div style={{ height: 6, background: colors.border, borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{
                      width: `${(completed.length / LEVELS.length) * 100}%`,
                      height: '100%', background: 'linear-gradient(90deg,#3b82f6,#6366f1)', borderRadius: 3,
                      transition: 'width 0.5s ease',
                    }} />
                  </div>
                </div>
              </div>
              <span style={{ color: '#93c5fd', fontSize: 28, flexShrink: 0 }}>›</span>
            </div>
          </div>

          {/* Endless Mode */}
          <div
            onClick={() => {
              useFlowchartStore.getState().clearToStartEnd();
              navigate('/battle/level_endless');
            }}
            style={{
              background: 'linear-gradient(135deg, rgba(124,58,237,0.1), rgba(239,68,68,0.07))',
              border: '1px solid rgba(124,58,237,0.35)',
              borderRadius: 20, padding: '28px 32px',
              cursor: 'pointer', transition: 'all 0.2s', position: 'relative', overflow: 'hidden',
            }}
            onMouseEnter={(e) => {
              const d = e.currentTarget as HTMLDivElement;
              d.style.background = 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(239,68,68,0.1))';
              d.style.transform = 'translateY(-3px)';
              d.style.boxShadow = '0 12px 40px rgba(124,58,237,0.2)';
            }}
            onMouseLeave={(e) => {
              const d = e.currentTarget as HTMLDivElement;
              d.style.background = 'linear-gradient(135deg, rgba(124,58,237,0.1), rgba(239,68,68,0.07))';
              d.style.transform = 'none';
              d.style.boxShadow = 'none';
            }}
          >
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 5, background: 'linear-gradient(180deg,#7c3aed,#e94560)', borderRadius: '20px 0 0 20px' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
              <div style={{ fontSize: 56, flexShrink: 0, filter: 'drop-shadow(0 0 12px rgba(124,58,237,0.5))' }}>∞</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <span style={{
                    background: 'rgba(124,58,237,0.2)', color: '#c4b5fd',
                    fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 6,
                    border: '1px solid rgba(124,58,237,0.4)', letterSpacing: 1,
                  }}>ENDLESS MODE</span>
                </div>
                <h2 style={{ color: colors.text, fontWeight: 800, fontSize: 22, margin: '0 0 6px' }}>
                  สู้ไม่มีที่สิ้นสุด
                </h2>
                <p style={{ color: colors.textSub, fontSize: 14, margin: 0, lineHeight: 1.5 }}>
                  คลื่นศัตรูที่แข็งแกร่งขึ้นเรื่อยๆ ใช้ทุก Block ที่มี ทำคะแนนให้สูงที่สุด
                </p>
              </div>
              <span style={{ color: '#c4b5fd', fontSize: 28, flexShrink: 0 }}>›</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
