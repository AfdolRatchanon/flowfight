import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LEVELS } from '../../utils/constants';
import { useBattle } from '../../hooks/useBattle';
import { useGameStore } from '../../stores/gameStore';
import { useFlowchartStore } from '../../stores/flowchartStore';
import { savePlayerProgress, saveCharacterProgress, saveLeaderboardEntry } from '../../services/authService';
import { gainXP, levelProgressPct, xpToNextLevel, LEVEL_XP_TABLE, MAX_LEVEL } from '../../utils/levelSystem';
import FlowchartEditor from '../FlowchartEditor/FlowchartEditor';
import { previewFlowchart } from '../../engines/FlowchartEngine';
import type { BattleState } from '../../engines/FlowchartEngine';

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

const ENEMY_ICONS: Record<string, string> = {
  slime: '🟢', goblin: '👺', kobold: '👺', goblin_knight: '👺',
  orc: '👹', orc_warlord: '👹', ghost: '👻', troll: '🧌',
  spider: '🕷️', ice_giant: '🧊', dragon: '🐉',
  fire_elemental: '🔥', lich: '💀', shadow_demon: '👁️', overlord: '💀',
};

// Map enemy id → image filename (only for enemies that have an image)
const ENEMY_IMAGE: Record<string, string> = {
  slime:        'slime.png',
  goblin:       'goblin.png',
  goblin_knight:'goblin_knight.png',
  kobold:       'Kobold.png',
  orc:          'Orc.png',
  orc_warlord:  'Orc.png',
  ghost:        'Haunted.png',
  troll:        'Troll.png',
  spider:       'Spider.png',
  ice_giant:    'Ice.png',
};

function EnemySprite({ id }: { id: string }) {
  const [useImg, setUseImg] = useState(!!ENEMY_IMAGE[id]);
  const imgFile = ENEMY_IMAGE[id];
  return useImg && imgFile ? (
    <img
      src={`/enemies/${imgFile}`}
      alt={id}
      style={{ width: '100%', height: '100%', objectFit: 'contain', imageRendering: 'pixelated' }}
      onError={() => setUseImg(false)}
    />
  ) : (
    <span style={{ fontSize: 'var(--enemy-font)', lineHeight: 1 }}>{ENEMY_ICONS[id] ?? '👹'}</span>
  );
}

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
  const { validationError, nodes: flowNodes } = useFlowchartStore();
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
  const [missingBlocks, setMissingBlocks] = useState<string[]>([]);

  // Shield: enemy shielded when required blocks are missing
  const isEnemyShielded = useMemo(() => {
    if (!level?.requiredBlocks?.length) return false;
    return level.requiredBlocks.some((req) => {
      if (req === 'condition')  return !flowNodes.some((n) => n.type === 'condition');
      if (req === 'loop')       return !flowNodes.some((n) => n.type === 'loop');
      if (req === 'heal')       return !flowNodes.some((n) => n.type === 'action' && n.data.actionType === 'heal');
      if (req === 'dodge')      return !flowNodes.some((n) => n.type === 'action' && n.data.actionType === 'dodge');
      if (req === 'cast_spell') return !flowNodes.some((n) => n.type === 'action' && n.data.actionType === 'cast_spell');
      return false;
    });
  }, [level, flowNodes]);

  const shieldMissing = useMemo(() => {
    if (!level?.requiredBlocks?.length) return '';
    const labels: Record<string, string> = { condition: 'Condition', loop: 'Loop', heal: 'Heal', dodge: 'Dodge', cast_spell: 'Cast Spell' };
    const first = level.requiredBlocks.find((req) => {
      if (req === 'condition')  return !flowNodes.some((n) => n.type === 'condition');
      if (req === 'loop')       return !flowNodes.some((n) => n.type === 'loop');
      if (req === 'heal')       return !flowNodes.some((n) => n.type === 'action' && n.data.actionType === 'heal');
      if (req === 'dodge')      return !flowNodes.some((n) => n.type === 'action' && n.data.actionType === 'dodge');
      if (req === 'cast_spell') return !flowNodes.some((n) => n.type === 'action' && n.data.actionType === 'cast_spell');
      return false;
    });
    return first ? `ต้องใช้ ${labels[first]} block` : '';
  }, [level, flowNodes]);

  // Preview: compute expected HP changes from current flowchart
  const previewState = useMemo<BattleState>(() => ({
    heroHP: level?.enemy ? heroMaxHP : 100,
    heroMaxHP,
    enemyHP: level?.enemy.stats.maxHP ?? 100,
    enemyMaxHP: level?.enemy.stats.maxHP ?? 100,
    heroAttack:  character?.stats.attack  ?? 12,
    heroDefense: character?.stats.defense ?? 8,
    heroParry: 10,
    enemyAttack:  level?.enemy.stats.attack  ?? 8,
    enemyDefense: level?.enemy.stats.defense ?? 3,
    enemyArmor:    (level?.enemy.stats as any)?.armor ?? 0,
    enemyParry:    (level?.enemy.stats as any)?.parry ?? 0,
    enemyShielded: isEnemyShielded,
    shieldReason:  shieldMissing,
    round: 1,
  }), [level, character, heroMaxHP, isEnemyShielded, shieldMissing]);

  const flowPreview = useMemo(() => {
    if (status !== 'waiting' || validationError) return [];
    try {
      return previewFlowchart(flowNodes, useFlowchartStore.getState().edges, previewState, 20);
    } catch {
      return [];
    }
  }, [flowNodes, useFlowchartStore.getState().edges, previewState, status, validationError]);

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
      setMissingBlocks([]);
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

      // Check required blocks — if any are missing, don't count as victory
      let won = status === 'victory';
      if (won && level.requiredBlocks?.length) {
        const BLOCK_LABELS: Record<string, string> = {
          condition: 'Condition',
          loop: 'Loop',
          heal: 'Heal',
          dodge: 'Dodge',
          cast_spell: 'Cast Spell',
        };
        const missing = level.requiredBlocks.filter((req) => {
          if (req === 'condition') return !flowNodes.some((n) => n.type === 'condition');
          if (req === 'loop')      return !flowNodes.some((n) => n.type === 'loop');
          if (req === 'heal')      return !flowNodes.some((n) => n.type === 'action' && n.data.actionType === 'heal');
          if (req === 'dodge')     return !flowNodes.some((n) => n.type === 'action' && n.data.actionType === 'dodge');
          if (req === 'cast_spell') return !flowNodes.some((n) => n.type === 'action' && n.data.actionType === 'cast_spell');
          return false;
        });
        if (missing.length > 0) {
          setMissingBlocks(missing.map((r) => BLOCK_LABELS[r] ?? r));
          won = false;
        }
      }

      let savedChar = heroChar;
      if (won) {
        const xp = level.rewards.experience;
        setXpGained(xp);
        const { newCharacter, leveledUp, oldLevel, newLevel } = gainXP(heroChar, xp);
        savedChar = newCharacter;
        setCharacter(newCharacter);
        if (leveledUp) {
          setLevelUpData({ oldLevel, newLevel, hpGain: (newLevel - oldLevel) * 10, atkGain: (newLevel - oldLevel) * 2 });
        }
        saveCharacterProgress(player.id, newCharacter).catch(() => {});
      }

      savePlayerProgress(player.id, level.id, won).then((updated) => {
        if (updated) {
          setPlayer(updated);
          if (won) saveLeaderboardEntry(updated, savedChar).catch(() => {});
        }
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

  // Overlay state derived from status + missingBlocks
  const isIncomplete  = status === 'victory' && missingBlocks.length > 0;
  const isRealVictory = status === 'victory' && missingBlocks.length === 0;
  const overlayIcon   = isRealVictory ? '🏆' : isIncomplete ? '⚠️' : '💀';
  const overlayTitle  = isRealVictory ? 'Victory!' : isIncomplete ? 'ยังไม่ผ่านด่าน!' : 'Defeated!';
  const overlayColor  = isRealVictory ? '#fbbf24' : isIncomplete ? '#fb923c' : '#f87171';
  const overlayBorder = isRealVictory ? 'rgba(251,191,36,0.3)' : isIncomplete ? 'rgba(251,146,60,0.35)' : 'rgba(255,255,255,0.15)';

  return (
    <>
      <style>{ANIM_CSS}</style>
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#0d0d1a', overflow: 'hidden' }}>

        {/* ===== BATTLE ARENA ===== */}
        <div className="battle-arena" style={{
          display: 'flex', flexDirection: 'column',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          backgroundImage: `url(/backgrounds/${level.id}.png)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center bottom',
          backgroundRepeat: 'no-repeat',
          padding: '10px 16px', gap: 6,
          position: 'relative',
        }}>
          {/* Dark overlay so text stays readable over background image */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'linear-gradient(180deg, rgba(13,13,26,0.55) 0%, rgba(13,13,26,0.25) 50%, rgba(13,13,26,0.65) 100%)',
          }} />

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, position: 'relative', zIndex: 1 }}>
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

          {/* Level info bar */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
            position: 'relative', zIndex: 1,
            background: 'rgba(0,0,0,0.35)', borderRadius: 10,
            padding: '5px 12px', flexWrap: 'wrap',
          }}>
            <span style={{
              background: 'rgba(124,58,237,0.25)', border: '1px solid rgba(124,58,237,0.4)',
              color: '#c4b5fd', fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 5, whiteSpace: 'nowrap',
            }}>LEVEL {level.number}</span>
            <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: 11, fontWeight: 600, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {level.description}
            </span>
            <span style={{
              background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)',
              color: '#fbbf24', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 5, whiteSpace: 'nowrap',
            }}>📚 {level.concept}</span>
          </div>

          {/* Tutorial hint */}
          {level.tutorialText && (
            <div style={{
              position: 'relative', zIndex: 1, flexShrink: 0,
              background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)',
              borderRadius: 8, padding: '4px 12px',
            }}>
              <p style={{ color: '#fde68a', fontSize: 10, margin: 0 }}>💡 {level.tutorialText}</p>
            </div>
          )}

          {/* Objectives */}
          <div style={{
            position: 'relative', zIndex: 1, flexShrink: 0,
            background: 'rgba(0,0,0,0.30)', borderRadius: 8, padding: '5px 12px',
            display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
          }}>
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 9, fontWeight: 800, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>ภารกิจ</span>
            {level.objectives.map((obj, i) => (
              <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ color: status === 'victory' ? '#4ade80' : 'rgba(255,255,255,0.25)', fontSize: 11 }}>
                  {status === 'victory' ? '✅' : '⬜'}
                </span>
                <span style={{ color: status === 'victory' ? '#4ade80' : 'rgba(255,255,255,0.6)', fontSize: 10 }}>{obj}</span>
              </span>
            ))}
            {level.bonusObjective && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 11 }}>⭐</span>
                <span style={{ color: '#fbbf24', fontSize: 10, fontStyle: 'italic' }}>{level.bonusObjective}</span>
              </span>
            )}
          </div>

          {/* Fighters */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-around', position: 'relative', zIndex: 1 }}>

            {/* ===== Hero ===== */}
            <div style={{ textAlign: 'center', minWidth: 'clamp(100px, 12vw, 160px)' }}>
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
                  width: 'var(--hero-size)', height: 'var(--hero-size)', marginBottom: 4, display: 'inline-block',
                  animation: heroAnim ? `${heroAnim} 0.52s ease` : undefined,
                  filter: heroHP < heroMaxHP * 0.3 ? 'grayscale(0.5)' : undefined,
                }}
              >
                <img
                  src={`/characters/${heroChar.class}.png`}
                  alt={heroChar.class}
                  style={{ width: '100%', height: '100%', objectFit: 'contain', imageRendering: 'pixelated' }}
                />
              </div>

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
                  onClick={() => executeBattle(SPEED_LEVELS[speedIdx].ms, (level.requiredBlocks ?? []) as any)}
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
            <div style={{ textAlign: 'center', minWidth: 'clamp(100px, 12vw, 160px)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, marginBottom: 4 }}>
                <span style={{
                  background: 'rgba(248,113,113,0.2)', border: '1px solid rgba(248,113,113,0.3)',
                  color: '#f87171', fontSize: 9, fontWeight: 900, padding: '2px 7px', borderRadius: 5,
                }}>ENEMY</span>
                <span style={{ color: 'white', fontWeight: 700, fontSize: 12 }}>{level.enemy.name}</span>
              </div>

              {/* Shield indicator */}
              {isEnemyShielded && status === 'waiting' && (
                <div style={{
                  background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.5)',
                  borderRadius: 8, padding: '3px 8px', marginBottom: 4, display: 'inline-block',
                }}>
                  <span style={{ color: '#a5b4fc', fontSize: 10, fontWeight: 700 }}>🛡️ Shielded</span>
                  <p style={{ color: 'rgba(165,180,252,0.7)', fontSize: 9, margin: '1px 0 0', whiteSpace: 'nowrap' }}>
                    {shieldMissing}
                  </p>
                </div>
              )}

              {/* Animated enemy icon */}
              <div
                key={`enemy-${enemyAnimKey}`}
                style={{
                  width: 'var(--hero-size)', height: 'var(--hero-size)', marginBottom: 4, display: 'inline-block',
                  animation: enemyAnim ? `${enemyAnim} 0.52s ease` : undefined,
                  filter: isEnemyShielded && status === 'waiting'
                    ? 'grayscale(0.3) drop-shadow(0 0 12px rgba(99,102,241,0.8))'
                    : enemyHP < enemyMaxHP * 0.3 ? 'grayscale(0.5)' : undefined,
                }}
              ><EnemySprite id={level.enemy.id} /></div>

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
          <div className="battle-log" style={{ maxHeight: 52, flexShrink: 0, position: 'relative', zIndex: 1 }}>
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

        {/* ===== FLOWCHART SECTION ===== */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

          {/* ===== FLOWCHART EDITOR ===== */}
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <FlowchartEditor />
          </div>

          {/* ===== PREVIEW SIDEBAR (vertical, right) ===== */}
          {flowPreview.length > 1 && status === 'waiting' && (
            <div style={{
              width: 130, flexShrink: 0,
              background: '#09090f',
              borderLeft: '1px solid rgba(255,255,255,0.07)',
              display: 'flex', flexDirection: 'column',
              overflowY: 'auto',
            }}>
              {/* Header */}
              <div style={{
                padding: '7px 8px 6px',
                borderBottom: '1px solid rgba(255,255,255,0.07)',
                flexShrink: 0,
              }}>
                <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 9, fontWeight: 800, letterSpacing: 1.5, textTransform: 'uppercase', margin: 0 }}>
                  Sim Preview
                </p>
                <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 8, margin: '2px 0 0' }}>ประมาณการก่อนกด Play</p>
              </div>

              {/* Steps */}
              <div style={{ padding: '6px 6px', display: 'flex', flexDirection: 'column', gap: 3 }}>
                {flowPreview.map((step, i) => {
                  const isAction = step.type === 'action';
                  const isCond   = step.type === 'condition' || step.type === 'loop';
                  const isEdge   = step.type === 'start' || step.type === 'end';

                  const accentColor =
                    isEdge                             ? '#22c55e'
                    : step.actionType === 'heal'       ? '#4ade80'
                    : step.actionType === 'dodge'      ? '#94a3b8'
                    : step.actionType === 'cast_spell' ? '#c084fc'
                    : isAction                         ? '#3b82f6'
                    : isCond                           ? '#d97706'
                    : '#475569';

                  const icon =
                    isEdge && step.type === 'start'    ? '▶'
                    : isEdge                           ? '⏹'
                    : step.actionType === 'heal'       ? '💚'
                    : step.actionType === 'dodge'      ? '🌀'
                    : step.actionType === 'cast_spell' ? '✨'
                    : isAction                         ? '⚔️'
                    : step.type === 'loop'             ? '◈'
                    : '◇';

                  const heroHPPct  = Math.max(0, (step.heroHPAfter  / previewState.heroMaxHP)  * 100);
                  const enemyHPPct = Math.max(0, (step.enemyHPAfter / previewState.enemyMaxHP) * 100);

                  return (
                    <div key={i}>
                      {/* Connector line */}
                      {i > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'center', height: 8, marginBottom: 0 }}>
                          <div style={{ width: 1, height: '100%', background: 'rgba(255,255,255,0.08)' }} />
                        </div>
                      )}

                      {/* Step card */}
                      <div style={{
                        borderLeft: `2px solid ${accentColor}`,
                        borderRadius: '0 6px 6px 0',
                        background: 'rgba(255,255,255,0.03)',
                        padding: '4px 7px',
                      }}>
                        {/* Step label row */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                          <span style={{ fontSize: 10 }}>{icon}</span>
                          <span style={{
                            color: 'rgba(255,255,255,0.75)', fontSize: 10, fontWeight: 600,
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}>{step.label}</span>
                          {step.branch && (
                            <span style={{
                              background: accentColor + '22', color: accentColor,
                              fontSize: 8, fontWeight: 700, borderRadius: 3, padding: '0 3px',
                              flexShrink: 0,
                            }}>{step.branch}</span>
                          )}
                        </div>

                        {/* Damage/heal deltas */}
                        {isAction && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 1, marginBottom: 3 }}>
                            {step.enemyDelta !== 0 && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                <span style={{ color: '#f87171', fontSize: 9, fontWeight: 700 }}>
                                  👹 {step.enemyDelta}
                                </span>
                              </div>
                            )}
                            {step.heroDelta !== 0 && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                <span style={{
                                  color: step.heroDelta > 0 ? '#4ade80' : '#fda4af',
                                  fontSize: 9, fontWeight: step.heroDelta > 0 ? 700 : 400,
                                }}>
                                  🧍 {step.heroDelta > 0 ? '+' : ''}{step.heroDelta}
                                </span>
                              </div>
                            )}
                            {step.note && (
                              <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 8, margin: 0, fontStyle: 'italic' }}>
                                {step.note}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Mini HP bars — show after each action step */}
                        {isAction && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {/* Hero HP */}
                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 1 }}>
                                <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 7 }}>🧍</span>
                                <span style={{ color: heroHPPct < 30 ? '#ef4444' : '#4ade80', fontSize: 7, fontWeight: 700 }}>
                                  {step.heroHPAfter}
                                </span>
                              </div>
                              <div style={{ width: '100%', height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 2 }}>
                                <div style={{
                                  width: heroHPPct + '%', height: '100%', borderRadius: 2,
                                  background: heroHPPct < 30 ? '#ef4444' : '#4ade80',
                                  transition: 'width 0.2s',
                                }} />
                              </div>
                            </div>
                            {/* Enemy HP */}
                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 1 }}>
                                <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 7 }}>👹</span>
                                <span style={{ color: '#f87171', fontSize: 7, fontWeight: 700 }}>
                                  {step.enemyHPAfter}
                                </span>
                              </div>
                              <div style={{ width: '100%', height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 2 }}>
                                <div style={{
                                  width: enemyHPPct + '%', height: '100%', borderRadius: 2,
                                  background: '#f87171',
                                  transition: 'width 0.2s',
                                }} />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

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
              border: `1px solid ${overlayBorder}`,
              borderRadius: 24, padding: '36px 48px', textAlign: 'center',
              boxShadow: isRealVictory
                ? '0 25px 60px rgba(0,0,0,0.6), 0 0 60px rgba(251,191,36,0.15)'
                : '0 25px 60px rgba(0,0,0,0.6)',
              animation: 'bounceIn 0.4s ease',
              minWidth: 320, maxWidth: 420,
            }}>
              <div style={{ fontSize: 64, marginBottom: 8 }}>{overlayIcon}</div>
              <h2 style={{ fontSize: 28, fontWeight: 800, margin: '0 0 8px', color: overlayColor }}>
                {overlayTitle}
              </h2>

              {/* Missing blocks warning */}
              {isIncomplete && (
                <div style={{
                  background: 'rgba(251,146,60,0.1)', border: '1px solid rgba(251,146,60,0.3)',
                  borderRadius: 12, padding: '10px 16px', marginBottom: 16, textAlign: 'left',
                }}>
                  <p style={{ color: '#fb923c', fontWeight: 700, fontSize: 13, margin: '0 0 6px' }}>
                    ศัตรูตายแล้ว แต่ไม่ผ่านเงื่อนไขด่าน!
                  </p>
                  <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, margin: '0 0 6px' }}>
                    ต้องใช้ block เหล่านี้ใน Flowchart:
                  </p>
                  {missingBlocks.map((b) => (
                    <div key={b} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ color: '#f87171', fontSize: 13 }}>✗</span>
                      <span style={{ color: '#fca5a5', fontSize: 12, fontWeight: 600 }}>{b} block</span>
                    </div>
                  ))}
                  <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, margin: '8px 0 0' }}>
                    ความก้าวหน้าไม่ถูกบันทึก
                  </p>
                </div>
              )}

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

              {/* Objectives summary */}
              <div style={{ marginBottom: 16, textAlign: 'left' }}>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>ภารกิจ</p>
                {level.objectives.map((obj, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 14 }}>{status === 'victory' ? '✅' : '❌'}</span>
                    <span style={{ color: status === 'victory' ? '#4ade80' : '#f87171', fontSize: 12 }}>{obj}</span>
                  </div>
                ))}
                {level.bonusObjective && (() => {
                  const bonusPassed = status === 'victory' && heroHP > heroMaxHP * 0.2;
                  return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                      <span style={{ fontSize: 14 }}>{bonusPassed ? '⭐' : '☆'}</span>
                      <span style={{ color: bonusPassed ? '#fbbf24' : 'rgba(255,255,255,0.3)', fontSize: 12, fontStyle: 'italic' }}>
                        โบนัส: {level.bonusObjective}
                      </span>
                    </div>
                  );
                })()}
              </div>

              {status === 'defeat' && (
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, margin: '0 0 16px' }}>
                  {heroHP <= 0 ? 'Hero ถูกสังหาร — ปรับ flowchart แล้วลองใหม่!' : 'Flowchart จบแต่ยังไม่สังหารศัตรู — เพิ่ม Loop หรือ Action เพิ่มเติม'}
                </p>
              )}

              {/* Save summary (victory only) */}
              {status === 'victory' && (
                <div style={{
                  background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.15)',
                  borderRadius: 10, padding: '8px 14px', marginBottom: 12, textAlign: 'left',
                }}>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: 800, textTransform: 'uppercase', margin: '0 0 5px' }}>บันทึกลง Firestore</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <span style={{ color: '#4ade80', fontSize: 11 }}>✓ ด่าน {level.number} — บันทึกเป็น "ผ่านแล้ว"</span>
                    <span style={{ color: '#4ade80', fontSize: 11 }}>✓ +{level.rewards.experience} XP → ตัวละคร Lv.{heroChar.level}</span>
                    <span style={{ color: '#4ade80', fontSize: 11 }}>✓ Leaderboard อัปเดตแล้ว</span>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 16 }}>
                <button
                  onClick={() => { setLevelUpData(null); setXpGained(0); startBattle(heroChar, level.enemy as any, level.id); }}
                  style={{ padding: '12px 24px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.08)', color: 'white', cursor: 'pointer', fontWeight: 600 }}>
                  ↺ Retry
                </button>
                <button
                  onClick={() => {
                    if (status === 'victory') {
                      const currentIdx = LEVELS.findIndex(l => l.id === levelId);
                      const nextLevel = LEVELS[currentIdx + 1];
                      navigate(nextLevel ? `/battle/${nextLevel.id}` : '/levels');
                    } else {
                      navigate('/levels');
                    }
                  }}
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
