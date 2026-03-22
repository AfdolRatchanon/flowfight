import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../../stores/gameStore';
import { useTheme } from '../../contexts/ThemeContext';
import { LEVELS } from '../../utils/constants';

const CURRICULUM_BADGES = [
  { name: 'Algorithm Apprentice', levels: 10, icon: '🥉', subtitle: 'ปวช. ระดับพื้นฐาน' },
  { name: 'Algorithm Expert',     levels: 20, icon: '🥈', subtitle: 'ปวช. ระดับสูง' },
  { name: 'Algorithm Master',     levels: 30, icon: '🥇', subtitle: 'ปวส. ระดับผู้เชี่ยวชาญ' },
];

export default function CertificatePage() {
  const { player } = useGameStore();
  const { colors } = useTheme();
  const navigate = useNavigate();

  const completedLevels = new Set(player?.levelsCompleted ?? []);
  const levelsCompleted = LEVELS.filter((l) => completedLevels.has(l.id)).length;
  const scores = Object.values(player?.levelScores ?? {});
  const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

  const earnedBadge = [...CURRICULUM_BADGES].reverse().find(
    (b) => LEVELS.filter((l) => l.number <= b.levels).every((l) => completedLevels.has(l.id))
  );

  const today = new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          body { background: white !important; }
          .no-print { display: none !important; }
          .cert-card { box-shadow: none !important; border: 2px solid #B8960C !important; }
        }
      `}</style>

      {/* Controls — hidden on print */}
      <div className="no-print" style={{ background: colors.bgGrad, padding: '16px 24px', display: 'flex', gap: 10, alignItems: 'center' }}>
        <button onClick={() => navigate('/achievements')} style={{
          background: colors.bgSurface, border: `1px solid ${colors.borderSubtle}`,
          color: colors.text, width: 40, height: 40, borderRadius: 10, cursor: 'pointer', fontSize: 18,
        }}>←</button>
        <span style={{ color: colors.textMuted, fontSize: 13, flex: 1 }}>ใบประกาศนียบัตร</span>
        <button onClick={() => window.print()} style={{
          padding: '8px 20px', borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer',
          border: '1px solid rgba(251,191,36,0.5)', background: 'rgba(251,191,36,0.12)', color: '#FBBF24',
        }}>พิมพ์ / Save PDF</button>
      </div>

      {/* Certificate card */}
      <div style={{ minHeight: '100vh', background: colors.bgGrad, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div className="cert-card" style={{
          background: 'linear-gradient(135deg, #1a1a2e 0%, #0f2040 50%, #1a1a2e 100%)',
          border: '3px solid #B8960C',
          borderRadius: 20, padding: '52px 60px', maxWidth: 680, width: '100%',
          boxShadow: '0 0 60px rgba(184,150,12,0.3)',
          textAlign: 'center', position: 'relative', overflow: 'hidden',
        }}>
          {/* Corner decorations */}
          {['topLeft','topRight','bottomLeft','bottomRight'].map((pos) => (
            <div key={pos} style={{
              position: 'absolute',
              top: pos.startsWith('top') ? 12 : undefined,
              bottom: pos.startsWith('bottom') ? 12 : undefined,
              left: pos.endsWith('Left') ? 12 : undefined,
              right: pos.endsWith('Right') ? 12 : undefined,
              width: 40, height: 40,
              borderTop: pos.startsWith('top') ? '2px solid #B8960C' : undefined,
              borderBottom: pos.startsWith('bottom') ? '2px solid #B8960C' : undefined,
              borderLeft: pos.endsWith('Left') ? '2px solid #B8960C' : undefined,
              borderRight: pos.endsWith('Right') ? '2px solid #B8960C' : undefined,
            }} />
          ))}

          {/* Header */}
          <p style={{ color: '#B8960C', fontSize: 11, fontWeight: 700, letterSpacing: 4, margin: '0 0 8px', textTransform: 'uppercase' }}>
            FlowFight — Flowchart Battle RPG
          </p>
          <h1 style={{ fontFamily: "'Cinzel', serif", color: '#FFD700', fontSize: 32, margin: '0 0 4px', letterSpacing: 2 }}>
            Certificate of Achievement
          </h1>
          <p style={{ color: '#B8960C', fontSize: 12, margin: '0 0 32px', letterSpacing: 2 }}>ใบประกาศนียบัตรความสำเร็จ</p>

          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, margin: '0 0 8px' }}>This certifies that</p>
          <h2 style={{ fontFamily: "'Cinzel', serif", color: '#FFFFFF', fontSize: 28, margin: '0 0 4px', borderBottom: '1px solid rgba(184,150,12,0.4)', paddingBottom: 12 }}>
            {player?.firstName && player?.surname
              ? `${player.firstName} ${player.surname}`
              : player?.username ?? 'ผู้เล่น'}
          </h2>

          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, margin: '20px 0 8px' }}>
            has successfully completed
          </p>

          <div style={{ background: 'rgba(184,150,12,0.1)', border: '1px solid rgba(184,150,12,0.3)', borderRadius: 12, padding: '16px 24px', margin: '0 0 24px' }}>
            <p style={{ color: '#FFD700', fontSize: 22, fontWeight: 800, margin: '0 0 4px' }}>
              {levelsCompleted} / {LEVELS.length} Levels
            </p>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, margin: 0 }}>
              Average Score: {avgScore}/100 · Flowchart Algorithm Curriculum
            </p>
          </div>

          {/* Badge earned */}
          {earnedBadge ? (
            <div style={{ margin: '0 0 28px' }}>
              <span style={{ fontSize: 48 }}>{earnedBadge.icon}</span>
              <p style={{ color: '#FFD700', fontWeight: 800, fontSize: 16, margin: '6px 0 2px' }}>{earnedBadge.name}</p>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, margin: 0 }}>{earnedBadge.subtitle}</p>
            </div>
          ) : (
            <div style={{ margin: '0 0 28px', opacity: 0.4 }}>
              <span style={{ fontSize: 32 }}>⬜</span>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: '4px 0 0' }}>ยังไม่ได้รับ Badge</p>
            </div>
          )}

          {/* Footer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(184,150,12,0.3)', paddingTop: 20, marginTop: 8 }}>
            <div style={{ textAlign: 'left' }}>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, margin: '0 0 4px' }}>วันที่ออกใบประกาศ</p>
              <p style={{ color: '#B8960C', fontSize: 12, fontWeight: 700, margin: 0 }}>{today}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, margin: '0 0 4px' }}>Platform</p>
              <p style={{ color: '#B8960C', fontSize: 12, fontWeight: 700, margin: 0 }}>FlowFight LMS</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
