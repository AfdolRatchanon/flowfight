import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LEVELS } from '../../utils/constants';
import { useBattle } from '../../hooks/useBattle';
import { useGameStore } from '../../stores/gameStore';
import { useFlowchartStore } from '../../stores/flowchartStore';
import { savePlayerProgress, saveCharacterProgress } from '../../services/authService';
import { gainXP, levelProgressPct, xpToNextLevel, LEVEL_XP_TABLE, MAX_LEVEL } from '../../utils/levelSystem';
import FlowchartEditor from '../FlowchartEditor/FlowchartEditor';

// Speed levels: 1=ช้ามาก ... 5=เร็วมาก
const SPEED_LEVELS = [
  { label: '1x', ms: 1000 },
  { label: '2x', ms: 600 },
  { label: '3x', ms: 350 },
  { label: '4x', ms: 150 },
  { label: '5x', ms: 50 },
];

// ===== CSS Keyframe Animations =====
const ANIM_CSS = `
@keyframes heroAttack {
  0%   { transform: translateX(0) scale(1); }
  30%  { transform: translateX(32px) scale(1.25); filter: drop-shadow(0 0 14px rgba(250,200,0,0.9)); }
  60%  { transform: translateX(18px) scale(1.1); }
  100% { transform: translateX(0) scale(1); filter: none; }
}
@keyframes heroHeal {
  0%,100% { transform: scale(1); filter: none; }
  40%     { transform: scale(1.2); filter: drop-shadow(0 0 22px rgba(74,222,128,1)) brightness(1.4); }
}
@keyframes heroDodge {
  0%   { transform: translateX(0) skewX(0deg); filter: none; }
  28%  { transform: translateX(-30px) skewX(-14deg); filter: drop-shadow(-5px 0 10px rgba(148,163,184,0.9)); }
  70%  { transform: translateX(-10px) skewX(-4deg); }
  100% { transform: translateX(0) skewX(0deg); filter: none; }
}
@keyframes heroSpell {
  0%   { transform: scale(1) rotate(0deg); filter: none; }
  20%  { transform: scale(0.85) rotate(-8deg); filter: drop-shadow(0 0 10px rgba(192,132,252,0.7)); }
  55%  { transform: scale(1.35) rotate(6deg); filter: drop-shadow(0 0 30px rgba(192,132,252,1)) brightness(1.7); }
  100% { transform: scale(1) rotate(0deg); filter: none; }
}
@keyframes enemyHit {
  0%,100% { transform: translateX(0) rotate(0deg); filter: none; }
  20%     { transform: translateX(-14px) rotate(-7deg); filter: drop-shadow(0 0 12px rgba(239,68,68,1)); }
  45%     { transform: translateX(12px) rotate(5deg); }
  65%     { transform: translateX(-8px) rotate(-3deg); }
  82%     { transform: translateX(5px) rotate(2deg); }
}
@keyframes floatUp {
  0%   { opacity: 1; transform: translateY(0) scale(1.3); }
  60%  { opacity: 1; }
  100% { opacity: 0; transform: translateY(-54px) scale(0.85); }
}
@keyframes levelUpPulse {
  0%,100% { transform: scale(1); box-shadow: 0 0 20px rgba(251,191,36,0.5); }
  50%     { transform: scale(1.04); box-shadow: 0 0 55px rgba(251,191,36,0.95), 0 0 90px rgba(251,191,36,0.4); }
}
@keyframes bounceIn {
  0%   { transform: scale(0.3) translateY(40px); opacity: 0; }
  60%  { transform: scale(1.08) translateY(-5px); opacity: 1; }
  100% { transform: scale(1) translateY(0); opacity: 1; }
}
`;

// ===== Sub-components =====
function HPBar({ current, max, color }: { current: number; max: number; color: string }) {
  const pct = Math.max(0, (current / max) * 100);
  const isLow = pct < 30;
  return (
    <div style={{ width: '100%', height: 8, background: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' }}>
      <div style={{
        width: pct + '%', height: '100%', borderRadius: 4,
        background: isLow ? '#ef4444' : color,
        transition: 'width 0.4s ease',
        boxShadow: isLow ? '0 0 8px rgba(239,68,68,0.6)' : undefined,
      }} />
    </div>
  );
}

function XPBar({ pct }: { pct: number }) {
  return (
    <div style={{ width: '100%', height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden', marginTop: 3 }}>
      <div style={{
        width: pct + '%', height: '100%', borderRadius: 2,
        background: 'linear-gradient(90deg, #fbbf24, #f59e0b)',
        transition: 'width 0.7s ease',
        boxShadow: '0 0 6px rgba(251,191,36,0.5)',
      }} />
    </div>
  );
}

const ENEMY_ICONS: Record<string, string> = { slime: '🟢', goblin: '👺', orc: '👹', dragon: '🐉', boss: '💀' };
const CLASS_ICONS: Record<string, string> = { knight: '🛡️', mage: '🔮', rogue: '🗡️', barbarian: '⚔️' };

// ===== Types =====
interface FloatNum { id: number; text: string; color: string; side: 'hero' | 'enemy' }
interface LevelUpData { oldLevel: number; newLevel: number; hpGain: number; atkGain: number }

// Parse battle log to determine animations
function parseLogAction(action: string) {
  const l = action.toLowerCase();
  const enemyDmg = action.match(/enemy -(\d+)/i)?.[1] ?? null;
  const heroDmg  = action.match(/hero -(\d+)/i)?.[1] ?? null;
  const healAmt  = action.match(/\+(\d+)/i)?.[1] ?? null;
  if (l.includes('attacks'))     return { heroAnim: 'heroAttack', enemyAnim: 'enemyHit', enemyDmg, heroDmg, healAmt: null };
  if (l.includes('heals'))       return { heroAnim: 'heroHeal',   enemyAnim: null,        enemyDmg: null, heroDmg: null, healAmt };
  if (l.includes('dodges'))      return { heroAnim: 'heroDodge',  enemyAnim: null,        enemyDmg: null, heroDmg: null, healAmt: null };
  if (l.includes('casts spell')) return { heroAnim: 'heroSpell',  enemyAnim: 'enemyHit',  enemyDmg, heroDmg: null, healAmt: null };
  if (l.includes('failed'))      return { heroAnim: null,          enemyAnim: 'enemyHit',  enemyDmg: null, heroDmg, healAmt: null };
  return { heroAnim: null, enemyAnim: null, enemyDmg: null, heroDmg: null, healAmt: null };
}

// ===== Main Component =====
export default function BattleScreen() {
  const { levelId } = useParams<{ levelId: string }>();
  const navigate = useNavigate();
  const { character, player, setPlayer, setCharacter } = useGameStore();
  const { status, heroHP, heroMaxHP, enemyHP, enemyMaxHP, battleLog, isExecuting, startBattle, stopBattle, executeBattle } = useBattle();
  const { validationError } = useFlowchartStore();
  const [speedIdx, setSpeedIdx] = useState(1);
  const progressSaved = useRef(false);
  const level = LEVELS.find((l) => l.id === levelId);

  // Animation state
  const [heroAnimKey, setHeroAnimKey] = useState(0);
  const [enemyAnimKey, setEnemyAnimKey] = useState(0);
  const [heroAnim, setHeroAnim] = useState('');
  const [enemyAnim, setEnemyAnim] = useState('');
  const [floats, setFloats] = useState<FloatNum[]>([]);
  const floatId = useRef(0);

  // Level-up / XP state (shown in result overlay)
  const [levelUpData, setLevelUpData] = useState<LevelUpData | null>(null);
  const [xpGained, setXpGained] = useState(0);

  const heroChar = character ?? {
    id: 'demo', playerId: 'demo', name: 'Hero', class: 'knight' as const,
    level: 1, experience: 0,
    stats: { maxHP: 100, currentHP: 100, attack: 12, defense: 8, speed: 7 },
    appearance: { skinId: 'knight_blue', colors: { primary: '#1a1a2e', secondary: '#16213e', accent: '#e94560' } },
    equipment: { weapon: null, armor: null, head: null, accessory: null },
    gameMode: 'normal' as const, isAlive: true, currentLevel: 1,
    createdAt: Date.now(), lastModified: Date.now(),
  };

  // Init battle on level change
  useEffect(() => {
    if (level) {
      progressSaved.current = false;
      setLevelUpData(null);
      setXpGained(0);
      startBattle(heroChar, level.enemy as any, level.id);
    }
  }, [levelId]);

  // Trigger animation + floating numbers on each new log entry
  useEffect(() => {
    if (battleLog.length === 0) return;
    const last = battleLog[battleLog.length - 1];
    const { heroAnim: ha, enemyAnim: ea, enemyDmg, heroDmg, healAmt } = parseLogAction(last.action);

    if (ha) { setHeroAnim(ha); setHeroAnimKey(k => k + 1); }
    if (ea) { setEnemyAnim(ea); setEnemyAnimKey(k => k + 1); }

    const newFloats: FloatNum[] = [];
    if (enemyDmg) newFloats.push({ id: ++floatId.current, text: `-${enemyDmg}`, color: '#f87171', side: 'enemy' });
    if (heroDmg)  newFloats.push({ id: ++floatId.current, text: `-${heroDmg}`,  color: '#fda4af', side: 'hero'  });
    if (healAmt)  newFloats.push({ id: ++floatId.current, text: `+${healAmt}`,  color: '#4ade80', side: 'hero'  });
    if (newFloats.length > 0) {
      setFloats(p => [...p, ...newFloats]);
      const ids = newFloats.map(f => f.id);
      setTimeout(() => setFloats(p => p.filter(f => !ids.includes(f.id))), 900);
    }

    const t = setTimeout(() => { setHeroAnim(''); setEnemyAnim(''); }, 560);
    return () => clearTimeout(t);
  }, [battleLog.length]);

  // Save progress + award XP on battle end
  useEffect(() => {
    if ((status === 'victory' || status === 'defeat') && !progressSaved.current && player && level) {
      progressSaved.current = true;
      const won = status === 'victory';

      if (won) {
        const xp = level.rewards.experience;
        setXpGained(xp);
        const { newCharacter, leveledUp, oldLevel, newLevel } = gainXP(heroChar, xp);
        setCharacter(newCharacter);
        if (leveledUp) {
          setLevelUpData({ oldLevel, newLevel, hpGain: (newLevel - oldLevel) * 10, atkGain: (newLevel - oldLevel) * 2 });
        }
        saveCharacterProgress(player.id, newCharacter).catch(() => {});
      }

      savePlayerProgress(player.id, level.id, won).then((updated) => {
        if (updated) setPlayer(updated);
      }).catch(() => {});
    }
  }, [status]);

  if (!level) return (
    <div style={{ minHeight: '100vh', background: '#0d0d1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', color: 'white' }}>
        <p>Level not found</p>
        <button onClick={() => navigate('/levels')} style={{ color: '#e94560', background: 'none', border: 'none', cursor: 'pointer', marginTop: 12 }}>
          Back to Levels
        </button>
      </div>
    </div>
  );

  const statusConfig: Record<string, { label: string; color: string }> = {
    waiting: { label: '⏸ รอ flowchart...', color: 'rgba(255,255,255,0.4)' },
    running: { label: '⚡ กำลังรัน...', color: '#fbbf24' },
    victory: { label: '🏆 ชนะ!', color: '#4ade80' },
    defeat:  { label: '💀 แพ้...', color: '#f87171' },
  };
  const stat = statusConfig[status] ?? statusConfig.waiting;
  const xpPct  = levelProgressPct(heroChar.level, heroChar.experience);
  const xpLeft = xpToNextLevel(heroChar.level, heroChar.experience);

  return (
    <>
      <style>{ANIM_CSS}</style>
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#0d0d1a', overflow: 'hidden' }}>

        {/* ===== BATTLE ARENA (top 46%) ===== */}
        <div style={{
          height: '46vh', flexShrink: 0, display: 'flex', flexDirection: 'column',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          background: 'linear-gradient(180deg, #0d0d1a 0%, #12122a 100%)',
          padding: '10px 16px', gap: 6,
        }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <button onClick={() => navigate('/levels')} style={{
              background: 'rgba(255,255,255,0.06)', border: 'none',
              color: 'rgba(255,255,255,0.6)', padding: '5px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 13,
            }}>← Levels</button>
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: 'white', fontWeight: 700, fontSize: 14, margin: 0 }}>{level.name}</p>
              <p style={{ color: stat.color, fontSize: 12, margin: 0 }}>{stat.label}</p>
            </div>
            <div style={{ width: 80 }} />
          </div>

          {/* Fighters */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-around', position: 'relative' }}>

            {/* ===== Hero ===== */}
            <div style={{ textAlign: 'center', minWidth: 120 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, marginBottom: 4 }}>
                <span style={{
                  background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                  color: '#1c1917', fontSize: 9, fontWeight: 900, padding: '2px 7px', borderRadius: 5,
                }}>Lv.{heroChar.level}</span>
                <span style={{ color: 'white', fontWeight: 700, fontSize: 12 }}>{heroChar.name}</span>
              </div>

              {/* Animated hero icon */}
              <div
                key={`hero-${heroAnimKey}`}
                style={{
                  fontSize: 50, marginBottom: 4, display: 'inline-block',
                  animation: heroAnim ? `${heroAnim} 0.52s ease` : undefined,
                  filter: heroHP < heroMaxHP * 0.3 ? 'grayscale(0.5)' : undefined,
                }}
              >{CLASS_ICONS[heroChar.class] ?? '🧙'}</div>

              <HPBar current={heroHP} max={heroMaxHP} color="#4ade80" />
              <p style={{ color: heroHP < heroMaxHP * 0.3 ? '#ef4444' : '#4ade80', fontSize: 11, marginTop: 3, fontWeight: 600 }}>
                {heroHP} / {heroMaxHP} HP
              </p>

              {/* XP bar */}
              <XPBar pct={xpPct} />
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, marginTop: 2 }}>
                {heroChar.level >= MAX_LEVEL ? 'MAX LEVEL' : `${xpLeft} XP → Lv.${heroChar.level + 1}`}
              </p>
            </div>

            {/* Center controls */}
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
              <span style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 800, fontSize: 12 }}>VS</span>

              {/* Play / Stop */}
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={() => executeBattle(SPEED_LEVELS[speedIdx].ms)}
                  disabled={isExecuting || status === 'victory' || status === 'defeat'}
                  style={{
                    background: isExecuting ? 'rgba(74,222,128,0.15)' : 'linear-gradient(135deg, #16a34a, #15803d)',
                    border: 'none', color: 'white', padding: '9px 16px', borderRadius: 10,
                    cursor: isExecuting ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: 14,
                    opacity: status === 'victory' || status === 'defeat' ? 0.4 : 1,
                    boxShadow: isExecuting ? 'none' : '0 4px 15px rgba(22,163,74,0.4)',
                    minWidth: 76,
                  }}>
                  {isExecuting ? '⏳' : '▶ Play'}
                </button>
                <button
                  onClick={stopBattle}
                  disabled={!isExecuting}
                  style={{
                    background: isExecuting ? 'linear-gradient(135deg, #dc2626, #991b1b)' : 'rgba(255,255,255,0.05)',
                    border: isExecuting ? 'none' : '1px solid rgba(255,255,255,0.1)',
                    color: isExecuting ? 'white' : 'rgba(255,255,255,0.25)',
                    padding: '9px 12px', borderRadius: 10,
                    cursor: isExecuting ? 'pointer' : 'not-allowed', fontWeight: 700, fontSize: 14,
                    boxShadow: isExecuting ? '0 4px 15px rgba(220,38,38,0.4)' : 'none',
                    transition: 'all 0.15s',
                  }}>⏹</button>
              </div>

              {/* Speed control */}
              <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9 }}>ช้า</span>
                {SPEED_LEVELS.map((s, i) => (
                  <button key={i} onClick={() => setSpeedIdx(i)} disabled={isExecuting} style={{
                    width: 24, height: 20, borderRadius: 4, border: 'none',
                    background: speedIdx === i ? 'linear-gradient(135deg, #e94560, #7c3aed)' : 'rgba(255,255,255,0.08)',
                    color: speedIdx === i ? 'white' : 'rgba(255,255,255,0.35)',
                    fontSize: 9, fontWeight: 700, cursor: isExecuting ? 'not-allowed' : 'pointer', transition: 'all 0.15s',
                  }}>{s.label}</button>
                ))}
                <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9 }}>เร็ว</span>
              </div>

              {/* Reset */}
              <button
                onClick={() => { setLevelUpData(null); setXpGained(0); startBattle(heroChar, level.enemy as any, level.id); }}
                disabled={isExecuting}
                style={{
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.5)', padding: '4px 14px', borderRadius: 8,
                  cursor: 'pointer', fontSize: 11,
                }}>↺ Reset</button>

              {validationError && (
                <p style={{ color: '#f87171', fontSize: 10, maxWidth: 130, textAlign: 'center', margin: 0 }}>
                  {validationError}
                </p>
              )}
            </div>

            {/* ===== Enemy ===== */}
            <div style={{ textAlign: 'center', minWidth: 120 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, marginBottom: 4 }}>
                <span style={{
                  background: 'rgba(248,113,113,0.2)', border: '1px solid rgba(248,113,113,0.3)',
                  color: '#f87171', fontSize: 9, fontWeight: 900, padding: '2px 7px', borderRadius: 5,
                }}>ENEMY</span>
                <span style={{ color: 'white', fontWeight: 700, fontSize: 12 }}>{level.enemy.name}</span>
              </div>

              {/* Animated enemy icon */}
              <div
                key={`enemy-${enemyAnimKey}`}
                style={{
                  fontSize: 50, marginBottom: 4, display: 'inline-block',
                  animation: enemyAnim ? `${enemyAnim} 0.52s ease` : undefined,
                  filter: enemyHP < enemyMaxHP * 0.3 ? 'grayscale(0.5)' : undefined,
                }}
              >{ENEMY_ICONS[level.enemy.id] ?? '👹'}</div>

              <HPBar current={enemyHP} max={enemyMaxHP} color="#f87171" />
              <p style={{ color: enemyHP < enemyMaxHP * 0.3 ? '#ef4444' : '#f87171', fontSize: 11, marginTop: 3, fontWeight: 600 }}>
                {enemyHP} / {enemyMaxHP} HP
              </p>
            </div>

            {/* Floating damage/heal numbers */}
            {floats.map(f => (
              <div key={f.id} style={{
                position: 'absolute',
                [f.side === 'hero' ? 'left' : 'right']: '11%',
                top: '8%',
                color: f.color,
                fontSize: 24, fontWeight: 900,
                pointerEvents: 'none',
                animation: 'floatUp 0.88s ease forwards',
                textShadow: `0 2px 10px ${f.color}, 0 0 24px ${f.color}`,
                zIndex: 10,
              }}>{f.text}</div>
            ))}
          </div>

          {/* Battle log */}
          <div className="battle-log" style={{ maxHeight: 52, flexShrink: 0 }}>
            {battleLog.length === 0
              ? <p style={{ color: 'rgba(255,255,255,0.2)', textAlign: 'center', margin: 0, fontSize: 12 }}>
                  วาง flowchart แล้วกด Play!
                </p>
              : battleLog.slice(-4).map((log, i) => (
                <p key={i} style={{
                  color: i === Math.min(battleLog.length, 4) - 1 ? 'white' : 'rgba(255,255,255,0.45)',
                  margin: '0 0 2px', fontSize: 12,
                }}>{log.action}</p>
              ))
            }
          </div>
        </div>

        {/* ===== FLOWCHART EDITOR (bottom 54%) ===== */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <FlowchartEditor />
        </div>

        {/* ===== Result Overlay ===== */}
        {(status === 'victory' || status === 'defeat') && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.78)',
            backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', zIndex: 50,
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #1a1a3e, #12122a)',
              border: `1px solid ${status === 'victory' ? 'rgba(251,191,36,0.3)' : 'rgba(255,255,255,0.15)'}`,
              borderRadius: 24, padding: '36px 48px', textAlign: 'center',
              boxShadow: status === 'victory'
                ? '0 25px 60px rgba(0,0,0,0.6), 0 0 60px rgba(251,191,36,0.15)'
                : '0 25px 60px rgba(0,0,0,0.6)',
              animation: 'bounceIn 0.4s ease',
              minWidth: 320,
            }}>
              <div style={{ fontSize: 64, marginBottom: 8 }}>{status === 'victory' ? '🏆' : '💀'}</div>
              <h2 style={{ fontSize: 28, fontWeight: 800, margin: '0 0 8px', color: status === 'victory' ? '#fbbf24' : '#f87171' }}>
                {status === 'victory' ? 'Victory!' : 'Defeated!'}
              </h2>

              {status === 'victory' && (
                <>
                  <p style={{ color: '#4ade80', margin: '0 0 12px', fontSize: 15 }}>+{xpGained} XP earned!</p>

                  {/* Level-up banner */}
                  {levelUpData && (
                    <div style={{
                      background: 'linear-gradient(135deg, rgba(251,191,36,0.18), rgba(251,191,36,0.05))',
                      border: '1px solid rgba(251,191,36,0.45)',
                      borderRadius: 12, padding: '10px 20px', marginBottom: 14,
                      animation: 'levelUpPulse 1.2s ease infinite',
                    }}>
                      <p style={{ color: '#fbbf24', fontWeight: 900, fontSize: 18, margin: '0 0 4px' }}>
                        LEVEL UP!  {levelUpData.oldLevel} → {levelUpData.newLevel}
                      </p>
                      <p style={{ color: 'rgba(251,191,36,0.7)', fontSize: 12, margin: 0 }}>
                        +{levelUpData.hpGain} Max HP &nbsp;·&nbsp; +{levelUpData.atkGain} ATK &nbsp;·&nbsp; HP Restored!
                      </p>
                    </div>
                  )}

                  {/* XP progress bar */}
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>Lv.{heroChar.level}</span>
                      <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>
                        {heroChar.level < MAX_LEVEL ? `Lv.${heroChar.level + 1}` : 'MAX'}
                      </span>
                    </div>
                    <div style={{ width: '100%', height: 10, background: 'rgba(255,255,255,0.1)', borderRadius: 5, overflow: 'hidden' }}>
                      <div style={{
                        width: levelProgressPct(heroChar.level, heroChar.experience) + '%',
                        height: '100%', borderRadius: 5,
                        background: 'linear-gradient(90deg, #fbbf24, #f59e0b)',
                        transition: 'width 0.8s ease',
                        boxShadow: '0 0 8px rgba(251,191,36,0.6)',
                      }} />
                    </div>
                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, marginTop: 4 }}>
                      {heroChar.experience} / {heroChar.level < MAX_LEVEL ? LEVEL_XP_TABLE[heroChar.level + 1] : '—'} XP
                    </p>
                  </div>
                </>
              )}

              {status === 'defeat' && (
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, margin: '0 0 20px' }}>
                  ปรับ flowchart แล้วลองอีกครั้ง
                </p>
              )}

              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 16 }}>
                <button
                  onClick={() => { setLevelUpData(null); setXpGained(0); startBattle(heroChar, level.enemy as any, level.id); }}
                  style={{ padding: '12px 24px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.08)', color: 'white', cursor: 'pointer', fontWeight: 600 }}>
                  ↺ Retry
                </button>
                <button
                  onClick={() => navigate('/levels')}
                  style={{ padding: '12px 24px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#e94560,#7c3aed)', color: 'white', cursor: 'pointer', fontWeight: 700 }}>
                  {status === 'victory' ? 'Next Level →' : '← Levels'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
