import { useNavigate } from 'react-router-dom';
import { logout } from '../../services/authService';
import { useGameStore } from '../../stores/gameStore';
import { levelProgressPct, xpToNextLevel, MAX_LEVEL } from '../../utils/levelSystem';
import { useTheme } from '../../contexts/ThemeContext';

const MENU_ITEMS = [
  { icon: '⚔️', label: 'Play Game', path: '/levels', color: '#e94560' },
  { icon: '🎨', label: 'Character', path: '/character', color: '#7c3aed' },
  { icon: '🏆', label: 'Leaderboard', path: '/leaderboard', color: '#10b981' },
];


export default function MainMenu() {
  const { player, character } = useGameStore();
  const navigate = useNavigate();
  const { colors } = useTheme();

  return (
    <div style={{
      minHeight: '100vh',
      background: colors.bgGrad,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: 24, position: 'relative', overflow: 'hidden',
    }}>
      {/* Background decoration */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%)', top: '10%', right: '-10%' }} />
        <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(233,69,96,0.08) 0%, transparent 70%)', bottom: '10%', left: '-5%' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize: '50px 50px' }} />
      </div>

      <div className="menu-container">
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div className="float" style={{ fontSize: 'clamp(56px, 6vw, 80px)', marginBottom: 16, filter: 'drop-shadow(0 0 20px rgba(233,69,96,0.5))' }}>⚔️</div>
          <h1 style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 800, letterSpacing: 4, marginBottom: 8, background: 'linear-gradient(135deg, #ffffff 0%, #e94560 50%, #7c3aed 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            FLOWFIGHT
          </h1>
          <div style={{ width: 60, height: 3, background: 'linear-gradient(90deg, #e94560, #7c3aed)', margin: '0 auto 12px', borderRadius: 2 }} />
          <p style={{ color: colors.textMuted, fontSize: 12, letterSpacing: 3, textTransform: 'uppercase' }}>Flowchart Battle RPG</p>
          {player && (
            <p style={{ color: colors.textSub, fontSize: 14, marginTop: 12 }}>
              Welcome back, <span style={{ color: '#7c3aed', fontWeight: 700 }}>{player.username}</span>
            </p>
          )}
        </div>

        {/* Character card */}
        {character && (() => {
          const xpPct = levelProgressPct(character.level, character.experience);
          const xpLeft = xpToNextLevel(character.level, character.experience);
          return (
            <div style={{
              background: colors.bgSurface,
              border: `1px solid ${colors.borderSubtle}`,
              borderRadius: 16, padding: '14px 20px', marginBottom: 20,
              display: 'flex', alignItems: 'center', gap: 16,
            }}>
              {/* Avatar */}
              <div style={{
                width: 52, height: 52, borderRadius: 12, flexShrink: 0,
                background: 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(233,69,96,0.2))',
                border: '2px solid rgba(124,58,237,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden',
              }}>
                <img src={`/characters/${character.class}.png`} alt={character.class} style={{ width: 44, height: 44, objectFit: 'contain', imageRendering: 'pixelated' }} />
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                  <span style={{
                    background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                    color: '#1c1917', fontSize: 10, fontWeight: 900,
                    padding: '2px 8px', borderRadius: 6,
                  }}>Lv.{character.level}</span>
                  <span style={{ color: colors.text, fontWeight: 700, fontSize: 14 }}>{character.name}</span>
                  <span style={{ color: colors.textMuted, fontSize: 12, textTransform: 'capitalize' }}>
                    {character.class}
                  </span>
                </div>

                {/* XP bar */}
                <div style={{ width: '100%', height: 6, background: colors.bgSurface, borderRadius: 3, overflow: 'hidden', marginBottom: 4 }}>
                  <div style={{
                    width: xpPct + '%', height: '100%', borderRadius: 3,
                    background: 'linear-gradient(90deg, #fbbf24, #f59e0b)',
                    boxShadow: '0 0 6px rgba(251,191,36,0.5)',
                    transition: 'width 0.5s ease',
                  }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: colors.textMuted, fontSize: 10 }}>
                    {character.level >= MAX_LEVEL ? 'MAX LEVEL' : `${xpLeft} XP → Lv.${character.level + 1}`}
                  </span>
                  <span style={{ color: colors.textMuted, fontSize: 10 }}>
                    {character.experience} XP
                  </span>
                </div>
              </div>

              {/* Stats */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flexShrink: 0, fontSize: 11 }}>
                <span style={{ color: '#f87171' }}>❤️ {character.stats.maxHP}</span>
                <span style={{ color: '#fb923c' }}>⚔️ {character.stats.attack}</span>
                <span style={{ color: '#60a5fa' }}>🛡 {character.stats.defense}</span>
              </div>
            </div>
          );
        })()}

        {/* Fallback if no character yet */}
        {!character && player && (
          <div style={{
            background: 'rgba(124,58,237,0.06)', border: '1px dashed rgba(124,58,237,0.3)',
            borderRadius: 16, padding: '14px 20px', marginBottom: 20,
            textAlign: 'center', cursor: 'pointer',
          }} onClick={() => navigate('/character')}>
            <p style={{ color: colors.textMuted, fontSize: 13, margin: 0 }}>
              ✨ สร้างตัวละครเพื่อเริ่มเกม
            </p>
          </div>
        )}

        {/* Menu buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
          {MENU_ITEMS.map((item) => (
            <MenuButton
              key={item.path}
              icon={item.icon}
              label={item.label}
              color={item.color}
              onClick={() => navigate(item.path)}
            />
          ))}
        </div>

        {/* Sign out */}
        <button
          onClick={() => logout()}
          style={{ width: '100%', padding: 12, borderRadius: 12, border: `1px solid ${colors.borderSubtle}`, background: 'transparent', color: colors.textMuted, cursor: 'pointer', fontSize: 13 }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#e94560'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = colors.textMuted; }}
        >
          Sign Out
        </button>

        <p style={{ textAlign: 'center', color: colors.textMuted, fontSize: 11, marginTop: 20, opacity: 0.5 }}>
          v{import.meta.env.VITE_APP_VERSION ?? '0.10.0'}
        </p>
      </div>
    </div>
  );
}

function MenuButton({ icon, label, color, onClick }: { icon: string; label: string; color: string; onClick: () => void }) {
  const { colors } = useTheme();
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 16,
        padding: '18px 24px', borderRadius: 16, border: 'none', cursor: 'pointer',
        background: colors.bgSurface,
        borderLeft: '4px solid ' + color,
        color: colors.text, fontWeight: 700, fontSize: 16,
        transition: 'all 0.2s ease',
        outline: `1px solid ${colors.borderSubtle}`,
      }}
      onMouseEnter={(e) => {
        const b = e.currentTarget as HTMLButtonElement;
        b.style.background = colors.bgSurfaceHover;
        b.style.transform = 'translateX(4px)';
      }}
      onMouseLeave={(e) => {
        const b = e.currentTarget as HTMLButtonElement;
        b.style.background = colors.bgSurface;
        b.style.transform = 'translateX(0)';
      }}
    >
      <span style={{ fontSize: 24, width: 32, textAlign: 'center' }}>{icon}</span>
      <span>{label}</span>
      <span style={{ marginLeft: 'auto', color: colors.textMuted, fontSize: 18 }}>›</span>
    </button>
  );
}
