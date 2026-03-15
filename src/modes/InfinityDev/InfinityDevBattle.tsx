import React, { useState, useEffect, useRef, useMemo, Component } from 'react';
import { useNavigate } from 'react-router-dom';
import { PASSIVE_BONUSES } from '../../utils/constants';
import { useBattle } from '../../hooks/useBattle';
import { useBattleStore } from '../../stores/battleStore';
import { useGameStore } from '../../stores/gameStore';
import { useFlowchartStore } from '../../stores/flowchartStore';
import { useInfinityDevStore } from '../../stores/infinityDevStore';
import {
  getEnemyStats,
  getWaveReward,
  rollSupCards,
} from '../../engines/InfinityDevEngine';
import FlowchartEditor from '../../components/FlowchartEditor/FlowchartEditor';
import SubCardSelect from './SubCardSelect';
import TheTerminal from './TheTerminal';
import { useTheme } from '../../contexts/ThemeContext';
import type { ThemeColors } from '../../contexts/ThemeContext';
import {
  previewFlowchart,
  calcFlowchartManaCost,
  executeEnemyAction,
  executeEnemyTurn,
  resolveHeroStatuses,
  ENEMY_ACTION_COST,
} from '../../engines/FlowchartEngine';
import type { BattleState, PreviewStep } from '../../engines/FlowchartEngine';
import { PATH_CARDS, SUP_CARDS, HARDWARE_ITEMS, VIRUSES } from '../../utils/infinityDevConstants';

// ===== Error Boundary for FlowchartEditor =====
class FlowchartErrorBoundary extends Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: '' };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error?.message ?? String(error) };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[FlowchartErrorBoundary] Error caught:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          height: '100%', background: '#1a0a0a', color: '#f87171', gap: 12, padding: 20,
        }}>
          <span style={{ fontSize: 32 }}>⚠️</span>
          <p style={{ fontWeight: 800, fontSize: 14, margin: 0 }}>FlowchartEditor Error</p>
          <p style={{ fontSize: 11, color: '#fca5a5', textAlign: 'center', margin: 0, maxWidth: 400, wordBreak: 'break-word' }}>
            {this.state.error}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: '' })}
            style={{ background: '#dc2626', border: 'none', color: 'white', padding: '6px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 12 }}
          >
            ลองอีกครั้ง
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

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
@keyframes enemyHeal {
  0%,100% { transform: scale(1); filter: none; }
  40%     { transform: scale(1.2); filter: drop-shadow(0 0 22px rgba(74,222,128,1)) brightness(1.4); }
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
  const { colors } = useTheme();
  const pct = Math.max(0, (current / max) * 100);
  const isLow = pct < 30;
  return (
    <div style={{ width: '100%', height: 8, background: colors.border, borderRadius: 4, overflow: 'hidden' }}>
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
  const { colors } = useTheme();
  return (
    <div style={{ width: '100%', height: 4, background: colors.bgSurface, borderRadius: 2, overflow: 'hidden', marginTop: 3 }}>
      <div style={{
        width: pct + '%', height: '100%', borderRadius: 2,
        background: 'linear-gradient(90deg, #fbbf24, #f59e0b)',
        transition: 'width 0.7s ease',
        boxShadow: '0 0 6px rgba(251,191,36,0.5)',
      }} />
    </div>
  );
}

// Infinity Dev wave images
const WAVE_IMAGES = [
  'slime.png',              // wave  1–5
  'Bigger Slime.png',       // wave  6–10
  'Goblin Scout.png',       // wave 11–15
  'Goblin Heal When Low.png', // wave 16–20
  'Spider.png',             // wave 21–25
  'Kobold.png',             // wave 26–30
  'Forest Wraith.png',      // wave 31–35
  'Goblin Knight.png',      // wave 36–40
  'Orc Warrior.png',        // wave 41–45
  'Stone Troll.png',        // wave 46–50
  'Orc.png',                // wave 51–55
  'Ice Giant.png',          // wave 56–60
  "Dragon's Lair.png",      // wave 61–65
  'The Lich Lord.png',      // wave 66–70
  'The Dark Overlord.png',  // wave 71+
];

function getWaveImage(wave: number): string {
  return WAVE_IMAGES[Math.min(Math.floor((wave - 1) / 5), WAVE_IMAGES.length - 1)];
}

// EnemySprite for Infinity Dev
function InfinityEnemySprite({
  wave,
  isBoss,
  corruptedSectorActive,
}: {
  wave: number;
  isBoss: boolean;
  corruptedSectorActive: boolean;
}) {
  const imgFile = isBoss ? 'The Dark Overlord.png' : getWaveImage(wave);
  const [useImg, setUseImg] = useState(true);
  React.useEffect(() => { setUseImg(true); }, [wave]);

  if (corruptedSectorActive) {
    return <span style={{ fontSize: 'var(--enemy-font, 72px)', lineHeight: 1 }}>❓</span>;
  }

  return useImg ? (
    <img
      src={`/enemies/${imgFile}`}
      alt="enemy"
      style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'bottom', imageRendering: 'pixelated' }}
      onError={() => setUseImg(false)}
    />
  ) : (
    <span style={{ fontSize: 'var(--enemy-font, 72px)', lineHeight: 1 }}>👹</span>
  );
}

// ===== Preview renderer (recursive — supports nested decisions/loops) =====
function renderPreviewSteps(steps: PreviewStep[], heroMaxHP: number, enemyMaxHP: number, colors: ThemeColors, depth = 0): React.ReactElement[] {
  return steps.map((step, i) => {
    const isAction = step.type === 'action';
    const isCond = step.type === 'condition' || step.type === 'loop';
    const isEdge = step.type === 'start' || step.type === 'end';

    const accentColor =
      isEdge ? '#22c55e'
        : step.actionType === 'heal' ? '#4ade80'
          : step.actionType === 'dodge' ? '#94a3b8'
            : step.actionType === 'cast_spell' ? '#c084fc'
              : step.actionType === 'power_strike' ? '#7c3aed'
                : isAction ? '#3b82f6'
                  : isCond ? '#d97706'
                    : '#475569';

    const icon =
      isEdge && step.type === 'start' ? '▶'
        : isEdge ? '⏹'
          : step.actionType === 'heal' ? '💚'
            : step.actionType === 'dodge' ? '🌀'
              : step.actionType === 'cast_spell' ? '✨'
                : step.actionType === 'power_strike' ? '💥'
                  : isAction ? '⚔️'
                    : step.type === 'loop' ? '◈'
                      : '◇';

    const heroHPPct = Math.max(0, (step.heroHPAfter / heroMaxHP) * 100);
    const enemyHPPct = Math.max(0, (step.enemyHPAfter / enemyMaxHP) * 100);

    const hasBranches =
      (step.yesBranch?.length ?? 0) > 0 || (step.noBranch?.length ?? 0) > 0 ||
      (step.loopBranch?.length ?? 0) > 0 || (step.nextBranch?.length ?? 0) > 0;

    return (
      <div key={`${depth}-${step.nodeId}-${i}`}>
        {i > 0 && (
          <div style={{ display: 'flex', justifyContent: 'center', height: 8 }}>
            <div style={{ width: 1, height: '100%', background: colors.bgSurface }} />
          </div>
        )}

        <div style={{ borderLeft: `2px solid ${accentColor}`, borderRadius: '0 6px 6px 0', background: colors.bgSurface, padding: '4px 7px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
            <span style={{ fontSize: 10 }}>{icon}</span>
            <span style={{ color: colors.textSub, fontSize: 10, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {step.label}
            </span>
          </div>

          {isAction && (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1, marginBottom: 3 }}>
                {step.enemyDelta !== 0 && <span style={{ color: '#f87171', fontSize: 9, fontWeight: 700 }}>👹 {step.enemyDelta}</span>}
                {step.heroDelta !== 0 && (
                  <span style={{ color: step.heroDelta > 0 ? '#4ade80' : '#fda4af', fontSize: 9, fontWeight: step.heroDelta > 0 ? 700 : 400 }}>
                    🧍 {step.heroDelta > 0 ? '+' : ''}{step.heroDelta}
                  </span>
                )}
                {step.note && <p style={{ color: colors.textMuted, fontSize: 8, margin: 0, fontStyle: 'italic' }}>{step.note}</p>}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 1 }}>
                    <span style={{ color: colors.textMuted, fontSize: 7 }}>🧍</span>
                    <span style={{ color: heroHPPct < 30 ? '#ef4444' : '#4ade80', fontSize: 7, fontWeight: 700 }}>{step.heroHPAfter}</span>
                  </div>
                  <div style={{ width: '100%', height: 3, background: colors.bgSurface, borderRadius: 2 }}>
                    <div style={{ width: heroHPPct + '%', height: '100%', borderRadius: 2, background: heroHPPct < 30 ? '#ef4444' : '#4ade80', transition: 'width 0.2s' }} />
                  </div>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 1 }}>
                    <span style={{ color: colors.textMuted, fontSize: 7 }}>👹</span>
                    <span style={{ color: '#f87171', fontSize: 7, fontWeight: 700 }}>{step.enemyHPAfter}</span>
                  </div>
                  <div style={{ width: '100%', height: 3, background: colors.bgSurface, borderRadius: 2 }}>
                    <div style={{ width: enemyHPPct + '%', height: '100%', borderRadius: 2, background: '#f87171', transition: 'width 0.2s' }} />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {hasBranches && (
          <div style={{ marginLeft: 8, marginTop: 3, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {(step.yesBranch?.length ?? 0) > 0 && (
              <div style={{ borderLeft: '2px solid rgba(74,222,128,0.4)', paddingLeft: 6 }}>
                <div style={{ color: '#4ade80', fontSize: 8, fontWeight: 800, letterSpacing: 0.8, marginBottom: 3 }}>✓ YES</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {renderPreviewSteps(step.yesBranch!, heroMaxHP, enemyMaxHP, colors, depth + 1)}
                </div>
              </div>
            )}
            {(step.noBranch?.length ?? 0) > 0 && (
              <div style={{ borderLeft: '2px solid rgba(248,113,113,0.4)', paddingLeft: 6 }}>
                <div style={{ color: '#f87171', fontSize: 8, fontWeight: 800, letterSpacing: 0.8, marginBottom: 3 }}>✗ NO</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {renderPreviewSteps(step.noBranch!, heroMaxHP, enemyMaxHP, colors, depth + 1)}
                </div>
              </div>
            )}
            {(step.loopBranch?.length ?? 0) > 0 && (
              <div style={{ borderLeft: '2px solid rgba(251,191,36,0.4)', paddingLeft: 6 }}>
                <div style={{ color: '#fbbf24', fontSize: 8, fontWeight: 800, letterSpacing: 0.8, marginBottom: 3 }}>◈ LOOP</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {renderPreviewSteps(step.loopBranch!, heroMaxHP, enemyMaxHP, colors, depth + 1)}
                </div>
              </div>
            )}
            {(step.nextBranch?.length ?? 0) > 0 && (
              <div style={{ borderLeft: '2px solid rgba(148,163,184,0.4)', paddingLeft: 6 }}>
                <div style={{ color: '#94a3b8', fontSize: 8, fontWeight: 800, letterSpacing: 0.8, marginBottom: 3 }}>→ NEXT</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {renderPreviewSteps(step.nextBranch!, heroMaxHP, enemyMaxHP, colors, depth + 1)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  });
}

// ===== Types =====
interface FloatNum { id: number; text: string; color: string; side: 'hero' | 'enemy' }

// Parse battle log to determine animations
function parseLogAction(action: string) {
  const l = action.toLowerCase();
  const enemyDmg = action.match(/enemy -(\d+)/i)?.[1] ?? null;
  const heroDmg = action.match(/hero -(\d+)/i)?.[1] ?? null;
  const healAmt = action.match(/\+(\d+)/i)?.[1] ?? null;
  if (l.includes('attacks')) return { heroAnim: 'heroAttack', enemyAnim: 'enemyHit', enemyDmg, heroDmg, healAmt: null };
  if (l.includes('enemy heals')) return { heroAnim: null, enemyAnim: 'enemyHeal', enemyDmg: null, heroDmg: null, healAmt };
  if (l.includes('heals')) return { heroAnim: 'heroHeal', enemyAnim: null, enemyDmg: null, heroDmg: null, healAmt };
  if (l.includes('dodges')) return { heroAnim: 'heroDodge', enemyAnim: null, enemyDmg: null, heroDmg: null, healAmt: null };
  if (l.includes('casts spell')) return { heroAnim: 'heroSpell', enemyAnim: 'enemyHit', enemyDmg, heroDmg: null, healAmt: null };
  if (l.includes('failed')) return { heroAnim: null, enemyAnim: 'enemyHit', enemyDmg: null, heroDmg, healAmt: null };
  return { heroAnim: null, enemyAnim: null, enemyDmg: null, heroDmg: null, healAmt: null };
}

// Stable empty array — avoids new [] reference on every render
const EMPTY_REQUIRED_BLOCKS: string[] = [];

// ===== Main Component =====
export default function InfinityDevBattle() {
  const { colors, theme } = useTheme();
  const navigate = useNavigate();
  const { character } = useGameStore();
  const infStore = useInfinityDevStore();
  const { status, heroHP, heroMaxHP, enemyHP, enemyMaxHP, battleLog, isExecuting, heroBurnRounds, heroFreezeRounds, heroPoisonRounds, enemyStunnedRounds, enemyBurnRounds, enemyFreezeRounds, enemyPoisonRounds, heroBerserkRounds, healCharges, comboCount, startBattle, restartBattle, stopBattle, executeBattle } = useBattle();
  const { validationError, nodes: flowNodes, clearToStartEnd } = useFlowchartStore();
  const [speedIdx, setSpeedIdx] = useState(1);
  const progressSaved = useRef(false);
  const battleStartTime = useRef<number>(0);
  const battleReady = useRef(false);

  // Turn-based state
  const [currentTurn, setCurrentTurn] = useState(1);
  const [battlePhase, setBattlePhase] = useState<'planning' | 'running' | 'enemy_turn' | 'resolution'>('planning');
  const [enemyBehaviorIdx, setEnemyBehaviorIdx] = useState(0);
  const [extraManaDebuff, setExtraManaDebuff] = useState(0);

  // Live battle state ref for enemy turn
  const liveBattleStateRef = useRef<BattleState | null>(null);

  // Wave clear overlay state (for non-milestone waves)
  const [showWaveClear, setShowWaveClear] = useState(false);
  const [waveClearFragments, setWaveClearFragments] = useState(0);

  // Overlay phase for SubCardSelect / TheTerminal
  const [overlayPhase, setOverlayPhase] = useState<'none' | 'sub_card' | 'terminal'>('none');

  // Animation state
  const [heroAnimKey, setHeroAnimKey] = useState(0);
  const [enemyAnimKey, setEnemyAnimKey] = useState(0);
  const [heroAnim, setHeroAnim] = useState('');
  const [enemyAnim, setEnemyAnim] = useState('');
  const [floats, setFloats] = useState<FloatNum[]>([]);
  const floatId = useRef(0);

  // Preview panel
  const [showSimPreview, setShowSimPreview] = useState(true);

  // Derived
  const wave = infStore.wave;
  const enemyData = getEnemyStats(wave);
  const pathCard = PATH_CARDS.find((p) => p.id === infStore.selectedPath);

  // Build a synthetic level object compatible with useBattle / BattleState
  const level = useMemo(() => ({
    id: 'level_infinity_dev',
    number: wave,
    name: `Wave ${wave}`,
    requiredBlocks: [] as string[],
    allowedBlocks: undefined as undefined,
    enemy: {
      id: `enemy_wave_${wave}`,
      name: enemyData.name,
      stats: {
        maxHP: enemyData.hp,
        attack: enemyData.atk,
        defense: enemyData.def,
        speed: 10,
        armor: 0,
        parry: 0,
        enrageThreshold: enemyData.isBoss ? 30 : 0,
        ailmentType: '',
        ailmentChance: 0,
      },
      behaviors: ['attack', 'attack', 'heal'] as string[],
    },
    objectives: { main: { description: `ชนะ Wave ${wave}`, target: 'win' } },
    bonusObjective: null,
  }), [wave, enemyData.hp, enemyData.atk, enemyData.def, enemyData.name, enemyData.isBoss]);

  // Action budget per turn — uses infinityMaxBudget from store
  const turnManaMax = Math.max(1, infStore.infinityMaxBudget - extraManaDebuff);
  const turnManaUsed = useMemo(() => calcFlowchartManaCost(flowNodes), [flowNodes]);

  // Enemy intention — show all actions for this turn based on budget
  const enemyBudget = (level.enemy as any).budgetPerTurn ?? 1;
  const intentionLabelMap: Record<string, string> = {
    attack: '🗡️ โจมตี', heal: '💚 ฟื้นฟู', cast_spell: '✨ สเปล',
    poison_strike: '🟣 พิษ', freeze_strike: '❄️ แช่แข็ง', burn_strike: '🔥 เผา', power_strike: '💥 โจมตีหนัก',
  };
  const enemyIntentionActions = (() => {
    const actions: string[] = [];
    let budget = enemyBudget;
    let i = 0;
    while (budget > 0) {
      const beh = level.enemy.behaviors[(enemyBehaviorIdx + i) % level.enemy.behaviors.length];
      const cost = ENEMY_ACTION_COST[beh] ?? 1;
      if (cost > budget) break;
      actions.push(beh);
      budget -= cost;
      i++;
    }
    if (actions.length === 0) actions.push('attack');
    return actions;
  })();
  const enemyIntentionLabel = enemyIntentionActions.map((a) => intentionLabelMap[a] ?? '👁️').join(' → ');

  // Hero character (with passive bonuses applied)
  const heroChar = character ?? {
    id: 'demo', playerId: 'demo', name: 'Hero', class: 'knight' as const,
    level: 1, experience: 0,
    stats: { maxHP: infStore.heroMaxHp, currentHP: infStore.heroCurrentHp, attack: infStore.heroBaseAttack, defense: infStore.heroBaseDefense, speed: 10 },
    appearance: { skinId: 'knight_blue', colors: { primary: '#1a1a2e', secondary: '#16213e', accent: '#e94560' } },
    equipment: { weapon: null, armor: null, head: null, accessory: null },
    gameMode: 'normal' as const, isAlive: true, currentLevel: 1,
    createdAt: Date.now(), lastModified: Date.now(),
  };

  // Passive bonuses summary (for display)
  const passiveBonusSummary = (() => {
    const passives = PASSIVE_BONUSES.filter(p => p.class === heroChar.class && p.requiredLevel <= heroChar.level);
    return passives.reduce((acc, p) => ({
      atkBonus: acc.atkBonus + p.atkBonus,
      defBonus: acc.defBonus + p.defBonus,
      hpBonus: acc.hpBonus + p.hpBonus,
      speedBonus: acc.speedBonus + p.speedBonus,
    }), { atkBonus: 0, defBonus: 0, hpBonus: 0, speedBonus: 0 });
  })();

  const getBoostedChar = () => {
    const passives = PASSIVE_BONUSES.filter(p => p.class === heroChar.class && p.requiredLevel <= heroChar.level);
    const totalPassive = passives.reduce((acc, p) => ({
      atkBonus: acc.atkBonus + p.atkBonus,
      defBonus: acc.defBonus + p.defBonus,
      hpBonus: acc.hpBonus + p.hpBonus,
      speedBonus: acc.speedBonus + p.speedBonus,
    }), { atkBonus: 0, defBonus: 0, hpBonus: 0, speedBonus: 0 });

    // Override stats with infinityDevStore values (which track HP across waves)
    const baseAtk = (infStore.heroBaseAttack) + totalPassive.atkBonus +
      (infStore.plugins.includes('syntax_optimizer') ? 1 : 0);
    const baseDef = infStore.heroBaseDefense + totalPassive.defBonus;
    const baseMaxHp = infStore.heroMaxHp + totalPassive.hpBonus;
    const baseCurrentHp = Math.min(infStore.heroCurrentHp, baseMaxHp);

    return {
      ...heroChar,
      stats: {
        ...heroChar.stats,
        attack: baseAtk,
        defense: baseDef,
        maxHP: baseMaxHp,
        currentHP: baseCurrentHp,
        speed: heroChar.stats.speed + totalPassive.speedBonus,
      },
    };
  };

  // No shield requirement (Infinity Dev has no requiredBlocks)
  const missingRequiredTypes = EMPTY_REQUIRED_BLOCKS;

  // Preview state
  const previewState = useMemo<BattleState>(() => ({
    heroHP: heroMaxHP,
    heroMaxHP,
    enemyHP: level.enemy.stats.maxHP,
    enemyMaxHP: level.enemy.stats.maxHP,
    heroAttack: character?.stats.attack ?? infStore.heroBaseAttack,
    heroDefense: character?.stats.defense ?? infStore.heroBaseDefense,
    heroParry: 10,
    enemyAttack: level.enemy.stats.attack,
    enemyBaseAttack: level.enemy.stats.attack,
    enemyDefense: level.enemy.stats.defense,
    enemyArmor: 0,
    enemyParry: 0,
    enemyShielded: false,
    shieldReason: '',
    enemyEnraged: false,
    enrageThreshold: level.enemy.stats.enrageThreshold,
    healCharges: 3,
    powerStrikeCooldown: 0,
    lastActionType: '',
    comboCount: 0,
    heroBurnRounds: 0,
    heroFreezeRounds: 0,
    heroPoisonRounds: 0,
    enemyStunnedRounds: 0,
    enemyBurnRounds: 0,
    enemyFreezeRounds: 0,
    enemyPoisonRounds: 0,
    enemyAilmentType: '',
    enemyAilmentChance: 0,
    antidotes: 0,
    potions: 0,
    gold: 0,
    round: 1,
    currentTurn: 1,
    turnManaMax: infStore.infinityMaxBudget,
    heroIsEvading: false,
    conditionBonus: false,
    heroBerserkRounds: 0,
    virusTurnWasted: false,
    manaDebuff: 0,
  }), [level, character, heroMaxHP, infStore.heroBaseAttack, infStore.heroBaseDefense, infStore.infinityMaxBudget]);

  const flowPreview = useMemo(() => {
    if (status !== 'waiting' || validationError) return [];
    try {
      return previewFlowchart(flowNodes, useFlowchartStore.getState().edges, previewState, 20);
    } catch {
      return [];
    }
  }, [flowNodes, useFlowchartStore.getState().edges, previewState, status, validationError]);

  // Init battle on wave change
  useEffect(() => {
    battleReady.current = false;
    progressSaved.current = false;
    setCurrentTurn(1);
    setBattlePhase('planning');
    setEnemyBehaviorIdx(0);
    liveBattleStateRef.current = null;
    startBattle(getBoostedChar() as any, level.enemy as any, level.id);
    battleReady.current = true;
  }, [wave]);

  // Trigger animation + floating numbers on each new log entry
  useEffect(() => {
    if (battleLog.length === 0) return;
    const last = battleLog[battleLog.length - 1];
    const { heroAnim: ha, enemyAnim: ea, enemyDmg, heroDmg, healAmt } = parseLogAction(last.action);

    if (ha) { setHeroAnim(ha); setHeroAnimKey(k => k + 1); }
    if (ea) { setEnemyAnim(ea); setEnemyAnimKey(k => k + 1); }

    const newFloats: FloatNum[] = [];
    if (enemyDmg) newFloats.push({ id: ++floatId.current, text: `-${enemyDmg}`, color: '#f87171', side: 'enemy' });
    if (heroDmg) newFloats.push({ id: ++floatId.current, text: `-${heroDmg}`, color: '#fda4af', side: 'hero' });
    if (healAmt) newFloats.push({ id: ++floatId.current, text: `+${healAmt}`, color: '#4ade80', side: ea === 'enemyHeal' ? 'enemy' : 'hero' });
    if (newFloats.length > 0) {
      setFloats(p => [...p, ...newFloats]);
      const ids = newFloats.map(f => f.id);
      setTimeout(() => setFloats(p => p.filter(f => !ids.includes(f.id))), 900);
    }

    const t = setTimeout(() => { setHeroAnim(''); setEnemyAnim(''); }, 560);
    return () => clearTimeout(t);
  }, [battleLog.length]);

  // After hero's flowchart finishes in turn-based mode, trigger enemy turn
  useEffect(() => {
    if (battlePhase === 'running' && !isExecuting) {
      if (status === 'victory') {
        setBattlePhase('planning');
        return;
      }
      if (heroHP <= 0) {
        setBattlePhase('planning');
        return;
      }
      if (status === 'waiting' || status === 'running') {
        setBattlePhase('planning');
        return;
      }
      if (status === 'defeat' && enemyHP > 0 && heroHP > 0) {
        battleStore.setStatus('waiting');

        // Phase 4: check if any debug_block was executed
        const execLog = useFlowchartStore.getState().executionLog;
        const hasDebug = execLog.some((s) => s.action === 'debug_block');
        if (hasDebug) {
          useFlowchartStore.getState().removeVirusNodes();
        }

        const charStats = useBattleStore.getState().battle?.character.stats;
        const enemyStats = useBattleStore.getState().battle?.enemy.stats;
        const store = useBattleStore.getState();

        const virusTurnWasted = liveBattleStateRef.current?.virusTurnWasted ?? false;
        const manaDebuffVal = liveBattleStateRef.current?.manaDebuff ?? 0;
        if (manaDebuffVal > 0) {
          setExtraManaDebuff((prev) => prev + manaDebuffVal);
        }

        const baseEnemyAtk = (enemyStats as any)?.attack ?? enemyData.atk;
        const enrageThresholdPct = (enemyStats as any)?.enrageThreshold ?? (enemyData.isBoss ? 30 : 0);
        const isEnemyEnragedNow = enrageThresholdPct > 0 &&
          store.enemyMaxHP > 0 &&
          (store.enemyHP / store.enemyMaxHP) * 100 <= enrageThresholdPct;
        const enragedAtk = isEnemyEnragedNow ? Math.floor(baseEnemyAtk * 1.5) : baseEnemyAtk;

        const stateSnap: BattleState = {
          heroHP: store.heroHP,
          heroMaxHP: store.heroMaxHP,
          enemyHP: store.enemyHP,
          enemyMaxHP: store.enemyMaxHP,
          heroAttack: (charStats?.attack ?? infStore.heroBaseAttack),
          heroDefense: charStats?.defense ?? infStore.heroBaseDefense,
          heroParry: 10,
          enemyAttack: enragedAtk,
          enemyBaseAttack: baseEnemyAtk,
          enemyDefense: (enemyStats as any)?.defense ?? enemyData.def,
          enemyArmor: 0,
          enemyParry: 0,
          enemyShielded: false,
          shieldReason: '',
          enemyEnraged: isEnemyEnragedNow,
          enrageThreshold: enrageThresholdPct,
          healCharges: store.healCharges,
          powerStrikeCooldown: 0,
          lastActionType: '',
          comboCount: store.comboCount,
          heroBurnRounds: store.heroBurnRounds,
          heroFreezeRounds: store.heroFreezeRounds,
          heroPoisonRounds: store.heroPoisonRounds,
          enemyStunnedRounds: store.enemyStunnedRounds,
          enemyBurnRounds: liveBattleStateRef.current?.enemyBurnRounds ?? 0,
          enemyFreezeRounds: liveBattleStateRef.current?.enemyFreezeRounds ?? 0,
          enemyPoisonRounds: liveBattleStateRef.current?.enemyPoisonRounds ?? 0,
          enemyAilmentType: '',
          enemyAilmentChance: 0,
          antidotes: 0,
          potions: 0,
          gold: 0,
          round: currentTurn,
          currentTurn,
          turnManaMax,
          heroIsEvading: liveBattleStateRef.current?.heroIsEvading ?? false,
          conditionBonus: false,
          heroBerserkRounds: liveBattleStateRef.current?.heroBerserkRounds ?? 0,
          virusTurnWasted: false,
          manaDebuff: 0,
        };
        liveBattleStateRef.current = stateSnap;

        if (virusTurnWasted) {
          battleStore.addLog({ round: currentTurn, action: '☠️ Virus wasted your turn! Enemy attacks for free!', actor: 'enemy', timestamp: Date.now() });
          const { newState: extraState, log: extraLog } = executeEnemyAction('attack', stateSnap);
          battleStore.addLog({ round: currentTurn, action: extraLog, actor: 'enemy', timestamp: Date.now() });
          battleStore.updateHeroHP(extraState.heroHP);
          battleStore.updateEnemyHP(extraState.enemyHP);
          liveBattleStateRef.current = { ...extraState, virusTurnWasted: false, manaDebuff: 0 };
          handleEnemyTurn(liveBattleStateRef.current);
        } else {
          handleEnemyTurn(stateSnap);
        }
      }
    }
  }, [isExecuting, battlePhase, status]);

  // Wave victory: gain Data Fragments and show overlay
  useEffect(() => {
    if (status === 'victory' && !progressSaved.current && battleReady.current) {
      progressSaved.current = true;
      const reward = getWaveReward(wave, infStore.plugins.includes('data_scraper'));
      infStore.gainDataFragments(reward);
      setWaveClearFragments(reward);

      // Trojan Horse virus: -10 HP on wave start
      if (infStore.viruses.includes('trojan_horse')) {
        infStore.setHeroHp(infStore.heroCurrentHp - 10);
      }

      // minor_bug_fix: heal +2 on wave clear
      if (infStore.plugins.includes('minor_bug_fix')) {
        infStore.setHeroHp(Math.min(infStore.heroMaxHp, infStore.heroCurrentHp + 2));
      }

      setTimeout(() => {
        infStore.advanceWave();
        const nextWave = wave + 1;
        if (nextWave % 10 === 0) {
          setOverlayPhase('terminal');
          setShowWaveClear(false);
        } else if (nextWave % 5 === 0) {
          infStore.setPendingSupCardChoices(rollSupCards(infStore.supCards));
          setOverlayPhase('sub_card');
          setShowWaveClear(false);
        } else {
          setShowWaveClear(true);
          setTimeout(() => {
            setShowWaveClear(false);
          }, 2000);
        }
      }, 600);
    }
  }, [status]);

  // ===== Turn-based helper functions =====
  const battleStore = useBattleStore();

  function handleResolution(stateAfterEnemy: BattleState) {
    const { newState: s, logs: ticks } = resolveHeroStatuses(stateAfterEnemy);
    if (ticks.length > 0) {
      battleStore.addLog({ round: currentTurn, action: ticks.join(' | '), actor: 'hero', timestamp: Date.now() });
    }
    battleStore.updateHeroHP(s.heroHP);
    battleStore.updateEnemyHP(s.enemyHP);
    battleStore.setAilments({
      burn: s.heroBurnRounds, freeze: s.heroFreezeRounds, poison: s.heroPoisonRounds, enemyStun: s.enemyStunnedRounds,
      enemyBurn: s.enemyBurnRounds, enemyFreeze: s.enemyFreezeRounds, enemyPoison: s.enemyPoisonRounds, heroBerserk: s.heroBerserkRounds,
    });
    liveBattleStateRef.current = s;

    if (s.enemyHP <= 0) { battleStore.setStatus('victory'); setBattlePhase('planning'); return; }
    if (s.heroHP <= 0) { battleStore.setStatus('defeat'); setBattlePhase('planning'); return; }

    setCurrentTurn(t => t + 1);
    setBattlePhase('planning');
  }

  function handleEnemyTurn(stateAfterHero: BattleState) {
    setBattlePhase('enemy_turn');
    const speedMs = SPEED_LEVELS[speedIdx].ms;
    setTimeout(() => {
      const budget = (level.enemy as any).budgetPerTurn ?? 1;
      const { newState, logs, actionsUsed } = executeEnemyTurn(level.enemy.behaviors, enemyBehaviorIdx, budget, stateAfterHero);
      logs.forEach((log) => battleStore.addLog({ round: currentTurn, action: log, actor: 'enemy', timestamp: Date.now() }));
      const log = logs[logs.length - 1] ?? '';

      // Virus injection (Infinity Dev doesn't use BattleScreen's level.number check — skip)

      setEnemyAnim('enemyHit');
      setEnemyAnimKey(k => k + 1);
      const heroDmgMatch = log.match(/Hero -(\d+)/i);
      if (heroDmgMatch) {
        const f = { id: ++floatId.current, text: `-${heroDmgMatch[1]}`, color: '#fda4af', side: 'hero' as const };
        setFloats(p => [...p, f]);
        setTimeout(() => setFloats(p => p.filter(x => x.id !== f.id)), 900);
      }
      setTimeout(() => { setEnemyAnim(''); }, 560);
      battleStore.updateHeroHP(newState.heroHP);
      battleStore.updateEnemyHP(newState.enemyHP);
      battleStore.setAilments({
        burn: newState.heroBurnRounds, freeze: newState.heroFreezeRounds, poison: newState.heroPoisonRounds, enemyStun: newState.enemyStunnedRounds,
        enemyBurn: newState.enemyBurnRounds, enemyFreeze: newState.enemyFreezeRounds, enemyPoison: newState.enemyPoisonRounds, heroBerserk: newState.heroBerserkRounds,
      });
      setEnemyBehaviorIdx(i => i + actionsUsed);
      setBattlePhase('resolution');
      setTimeout(() => {
        handleResolution(newState);
      }, speedMs);
    }, speedMs);
  }

  const statusConfig: Record<string, { label: string; color: string }> = {
    waiting: { label: '⏸ รอ flowchart...', color: colors.textSub },
    running: { label: '⚡ กำลังรัน...', color: '#fbbf24' },
    victory: { label: '🏆 ชนะ!', color: '#4ade80' },
    defeat: { label: '💀 แพ้...', color: '#f87171' },
  };
  const stat = statusConfig[status] ?? statusConfig.waiting;

  // SubCardSelect overlay
  if (overlayPhase === 'sub_card') {
    return (
      <SubCardSelect
        onDone={() => {
          setOverlayPhase('none');
          // Re-init battle for new wave (wave already advanced)
          progressSaved.current = false;
          setCurrentTurn(1);
          setBattlePhase('planning');
          setEnemyBehaviorIdx(0);
          setExtraManaDebuff(0);
          liveBattleStateRef.current = null;
        }}
      />
    );
  }

  // TheTerminal overlay
  if (overlayPhase === 'terminal') {
    return (
      <TheTerminal
        onClose={() => {
          setOverlayPhase('none');
          progressSaved.current = false;
          setCurrentTurn(1);
          setBattlePhase('planning');
          setEnemyBehaviorIdx(0);
          setExtraManaDebuff(0);
          liveBattleStateRef.current = null;
        }}
      />
    );
  }

  return (
    <>
      <style>{ANIM_CSS}</style>
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: colors.bg, overflow: 'hidden' }}>

        {/* ===== BATTLE ARENA ===== */}
        <div className="battle-arena" style={{
          display: 'flex', flexDirection: 'column',
          borderBottom: `1px solid ${colors.borderSubtle}`,
          background: theme === 'dark'
            ? 'linear-gradient(to bottom, #0a0a20 0%, #0d0d1a 100%)'
            : 'linear-gradient(to bottom, #e8edf8 0%, #eef1f8 100%)',
          backgroundImage: 'url(/backgrounds/infinity_dev.png)',
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
              background: colors.bgSurface, border: 'none',
              color: colors.textSub, padding: '5px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 13,
            }}>← Levels</button>

            {/* Center: wave badge */}
            <div style={{
              background: 'linear-gradient(135deg,rgba(0,255,136,0.2),rgba(0,204,102,0.2))',
              border: '1px solid rgba(0,255,136,0.35)', borderRadius: 10,
              padding: '4px 16px', textAlign: 'center',
            }}>
              <p style={{ color: '#00ff88', fontSize: 12, fontWeight: 800, margin: 0, letterSpacing: 2 }}>INFINITY DEV</p>
              <p style={{ color: 'white', fontSize: 14, fontWeight: 900, margin: 0 }}>
                WAVE {wave}{enemyData.isBoss ? ' — BOSS' : ''}
              </p>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, margin: 0 }}>{stat.label}</p>
            </div>

            {/* Right: Path badge + Data Fragments */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
              {pathCard && (
                <div style={{
                  background: `${pathCard.color}22`, border: `1px solid ${pathCard.color}66`,
                  borderRadius: 8, padding: '3px 8px',
                }}>
                  <span style={{ color: pathCard.color, fontSize: 10, fontWeight: 700 }}>
                    {pathCard.icon} {pathCard.name}
                  </span>
                  <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, marginLeft: 3 }}>
                    ×{infStore.pathSynergyCount}
                  </span>
                </div>
              )}
              <span style={{ color: '#fbbf24', fontSize: 11, fontWeight: 800 }}>💾 {infStore.dataFragments} DF</span>
            </div>
          </div>

          {/* Level info bar */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
            position: 'relative', zIndex: 1,
            background: 'rgba(0,0,0,0.35)', borderRadius: 8,
            padding: '4px 10px',
          }}>
            <span style={{
              background: 'rgba(0,255,136,0.15)', border: '1px solid rgba(0,255,136,0.3)',
              color: '#00ff88', fontSize: 10, fontWeight: 800, padding: '1px 7px', borderRadius: 5, whiteSpace: 'nowrap',
            }}>WAVE {wave}</span>
            {enemyData.isBoss && (
              <span style={{ background: 'rgba(239,68,68,0.25)', border: '1px solid rgba(239,68,68,0.4)', color: '#f87171', fontSize: 10, fontWeight: 800, padding: '1px 7px', borderRadius: 5 }}>BOSS</span>
            )}
            <span style={{ color: colors.textSub, fontSize: 10, fontWeight: 600, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {infStore.corruptedSectorActive ? '❓ Corrupted Sector' : enemyData.name}
            </span>
          </div>

          {/* Fighters — restructured: sprites on top, status bar below */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1, minHeight: 0 }}>

            {/* Row 1: Sprites + center controls */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'stretch', gap: 4, minHeight: 0 }}>

              {/* Hero sprite */}
              <div style={{ flex: 1, position: 'relative', minWidth: 0, overflow: 'hidden' }}>
                <div key={`hero-${heroAnimKey}`} style={{
                  position: 'absolute', inset: 0,
                  animation: heroAnim ? `${heroAnim} 0.52s ease` : undefined,
                  filter: heroHP < heroMaxHP * 0.3 ? 'grayscale(0.5)' : undefined,
                  display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                }}>
                  <img src={`/characters/${heroChar.class}.png`} alt={heroChar.class}
                    style={{ height: '100%', width: '100%', objectFit: 'contain', objectPosition: 'bottom', imageRendering: 'pixelated' }} />
                </div>
                {/* Name + Level badge */}
                <div style={{ position: 'absolute', top: 4, left: 4, display: 'flex', alignItems: 'center', gap: 3, zIndex: 2 }}>
                  <span style={{ background: 'linear-gradient(135deg,#00ff88,#00cc66)', color: '#0a1a0f', fontSize: 9, fontWeight: 900, padding: '1px 5px', borderRadius: 4 }}>Lv.{heroChar.level}</span>
                  <span style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 4 }}>{heroChar.name}</span>
                </div>
                {/* Ailment badges */}
                <div style={{ position: 'absolute', top: 4, right: 4, display: 'flex', flexDirection: 'row', gap: 2, flexWrap: 'wrap', justifyContent: 'flex-end', zIndex: 2 }}>
                  {heroBurnRounds > 0 && <span style={{ background: 'rgba(220,38,38,0.8)', color: '#fff', fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 4 }}>🔥{heroBurnRounds}</span>}
                  {heroFreezeRounds > 0 && <span style={{ background: 'rgba(37,99,235,0.8)', color: '#fff', fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 4 }}>❄️{heroFreezeRounds}</span>}
                  {heroPoisonRounds > 0 && <span style={{ background: 'rgba(124,58,237,0.8)', color: '#fff', fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 4 }}>🟣{heroPoisonRounds}</span>}
                  {heroBerserkRounds > 0 && <span style={{ background: 'rgba(220,38,38,0.8)', color: '#fff', fontSize: 8, fontWeight: 800, padding: '1px 5px', borderRadius: 4 }}>💢{heroBerserkRounds}</span>}
                  {comboCount >= 2 && <span style={{ background: 'rgba(161,98,7,0.85)', color: '#fef08a', fontSize: 8, fontWeight: 800, padding: '1px 5px', borderRadius: 4 }}>⚡x{comboCount + 1}</span>}
                  {infStore.heroShield > 0 && <span style={{ background: 'rgba(147,197,253,0.3)', border: '1px solid rgba(147,197,253,0.5)', color: '#93c5fd', fontSize: 9, fontWeight: 800, padding: '1px 5px', borderRadius: 4 }}>🛡️{infStore.heroShield}</span>}
                </div>
              </div>

              {/* Center controls */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, flexShrink: 0, width: 110, zIndex: 2, borderRadius: 12 }}>
                <span style={{ color: colors.textSub, fontWeight: 800, fontSize: 11 }}>VS</span>
                <div style={{ background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.3)', borderRadius: 7, padding: '2px 8px' }}>
                  <span style={{ color: '#00ff88', fontSize: 10, fontWeight: 800 }}>Turn {currentTurn}</span>
                </div>
                {flowNodes.some(n => n.data.isVirus) && (
                  <div style={{ background: 'rgba(150,0,30,0.85)', border: '1px solid rgba(220,0,80,0.6)', borderRadius: 5, padding: '2px 6px', fontSize: 8, fontWeight: 700, color: '#ff4070', textAlign: 'center' }}>☠️ VIRUS!</div>
                )}
                <div style={{ display: 'flex', gap: 4 }}>
                  <button
                    onClick={() => { battleStartTime.current = Date.now(); setBattlePhase('running'); executeBattle(SPEED_LEVELS[speedIdx].ms, [], turnManaMax); }}
                    disabled={isExecuting || status === 'victory' || status === 'defeat' || battlePhase !== 'planning'}
                    style={{
                      background: isExecuting ? 'rgba(74,222,128,0.15)' : 'linear-gradient(135deg,#00cc66,#009944)',
                      border: 'none', color: 'white', padding: '7px 10px', borderRadius: 9,
                      cursor: (isExecuting || battlePhase !== 'planning') ? 'not-allowed' : 'pointer',
                      fontWeight: 700, fontSize: 12, opacity: status === 'victory' || status === 'defeat' ? 0.4 : 1,
                      boxShadow: isExecuting ? 'none' : '0 4px 12px rgba(0,204,102,0.4)', minWidth: 56,
                    }}>
                    {isExecuting ? '⏳' : battlePhase === 'enemy_turn' ? '👹...' : battlePhase === 'resolution' ? '⚙️...' : '▶ Run'}
                  </button>
                  <button onClick={stopBattle} disabled={!isExecuting} style={{
                    background: isExecuting ? 'linear-gradient(135deg,#dc2626,#991b1b)' : colors.bgSurface,
                    border: isExecuting ? 'none' : `1px solid ${colors.border}`,
                    color: isExecuting ? colors.text : colors.textMuted,
                    padding: '7px 9px', borderRadius: 9, cursor: isExecuting ? 'pointer' : 'not-allowed',
                    fontWeight: 700, fontSize: 12, boxShadow: isExecuting ? '0 4px 12px rgba(220,38,38,0.4)' : 'none',
                  }}>⏹</button>
                </div>
                <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <span style={{ color: colors.textMuted, fontSize: 7 }}>ช้า</span>
                  {SPEED_LEVELS.map((s, i) => (
                    <button key={i} onClick={() => setSpeedIdx(i)} disabled={isExecuting} style={{
                      width: 20, height: 16, borderRadius: 3, border: 'none',
                      background: speedIdx === i ? 'linear-gradient(135deg,#00ff88,#009944)' : colors.bgSurfaceHover,
                      color: speedIdx === i ? '#000' : colors.textSub,
                      fontSize: 7, fontWeight: 700, cursor: isExecuting ? 'not-allowed' : 'pointer',
                    }}>{s.label}</button>
                  ))}
                  <span style={{ color: colors.textMuted, fontSize: 7 }}>เร็ว</span>
                </div>
                {validationError && <p style={{ color: '#f87171', fontSize: 8, maxWidth: 100, textAlign: 'center', margin: 0 }}>{validationError}</p>}
              </div>

              {/* Enemy sprite */}
              <div style={{ flex: 1, position: 'relative', minWidth: 0, overflow: 'hidden' }}>
                <div key={`enemy-${enemyAnimKey}`} style={{
                  position: 'absolute', inset: 0,
                  animation: enemyAnim ? `${enemyAnim} 0.52s ease` : undefined,
                  filter: enemyHP < enemyMaxHP * 0.3 ? 'grayscale(0.5)' : enemyData.isBoss ? 'drop-shadow(0 0 12px rgba(239,68,68,0.6))' : undefined,
                  display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                }}>
                  <InfinityEnemySprite wave={wave} isBoss={enemyData.isBoss} corruptedSectorActive={infStore.corruptedSectorActive} />
                </div>
                {/* Name + ENEMY badge */}
                <div style={{ position: 'absolute', top: 4, right: 4, display: 'flex', alignItems: 'center', gap: 3, zIndex: 2 }}>
                  <span style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 4 }}>
                    {infStore.corruptedSectorActive ? '???' : enemyData.name}
                  </span>
                  <span style={{ background: 'rgba(248,113,113,0.3)', border: '1px solid rgba(248,113,113,0.4)', color: '#f87171', fontSize: 9, fontWeight: 900, padding: '1px 5px', borderRadius: 4 }}>
                    {enemyData.isBoss ? 'BOSS' : 'ENEMY'}
                  </span>
                </div>
                {/* Ailment badges */}
                <div style={{ position: 'absolute', top: 4, left: 4, display: 'flex', flexDirection: 'row', gap: 2, flexWrap: 'wrap', zIndex: 2 }}>
                  {enemyStunnedRounds > 0 && <span style={{ background: 'rgba(161,98,7,0.85)', color: '#fef08a', fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 4 }}>⚡{enemyStunnedRounds}</span>}
                  {enemyBurnRounds > 0 && <span style={{ background: 'rgba(220,38,38,0.8)', color: '#fff', fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 4 }}>🔥{enemyBurnRounds}</span>}
                  {enemyFreezeRounds > 0 && <span style={{ background: 'rgba(37,99,235,0.8)', color: '#fff', fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 4 }}>❄️{enemyFreezeRounds}</span>}
                  {enemyPoisonRounds > 0 && <span style={{ background: 'rgba(124,58,237,0.8)', color: '#fff', fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 4 }}>🟣{enemyPoisonRounds}</span>}
                </div>
              </div>
            </div>

            {/* Row 2: Status bar — HP bars */}
            <div style={{ flexShrink: 0, display: 'flex', gap: 4, padding: '4px 2px 2px', borderTop: `1px solid ${colors.borderSubtle}` }}>

              {/* Hero status */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', gap: 3, marginBottom: 2, flexWrap: 'wrap' }}>
                  <span style={{
                    background: healCharges > 0 ? 'rgba(74,222,128,0.3)' : 'rgba(255,255,255,0.1)',
                    color: healCharges > 0 ? '#4ade80' : 'rgba(255,255,255,0.3)',
                    fontSize: 8, fontWeight: 700, padding: '1px 4px', borderRadius: 3,
                  }}>💊{healCharges}/3</span>
                  {(passiveBonusSummary.atkBonus > 0 || passiveBonusSummary.defBonus > 0) && (
                    <span style={{ background: 'rgba(168,85,247,0.35)', color: '#e9d5ff', fontSize: 7, fontWeight: 700, padding: '1px 4px', borderRadius: 3 }}>
                      {[passiveBonusSummary.atkBonus > 0 && `ATK+${passiveBonusSummary.atkBonus}`, passiveBonusSummary.defBonus > 0 && `DEF+${passiveBonusSummary.defBonus}`].filter(Boolean).join(' ')}
                    </span>
                  )}
                  <span style={{ background: 'rgba(0,255,136,0.15)', color: '#00ff88', fontSize: 7, fontWeight: 700, padding: '1px 4px', borderRadius: 3 }}>
                    ATK {infStore.heroBaseAttack}
                  </span>
                  <span style={{ background: 'rgba(147,197,253,0.15)', color: '#93c5fd', fontSize: 7, fontWeight: 700, padding: '1px 4px', borderRadius: 3 }}>
                    DEF {infStore.heroBaseDefense}
                  </span>
                </div>
                <HPBar current={heroHP} max={heroMaxHP} color="#4ade80" />
                <span style={{ color: heroHP < heroMaxHP * 0.3 ? '#ef4444' : '#4ade80', fontSize: 9, fontWeight: 700 }}>{heroHP}/{heroMaxHP}</span>
                {/* Mini XP-like bar replaced with a Data Fragments indicator */}
                <XPBar pct={(infStore.dataFragments % 100)} />
                <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 7, margin: '1px 0 0' }}>
                  💾 {infStore.dataFragments} DF
                </p>
              </div>

              {/* Spacer aligns with center controls */}
              <div style={{ width: 110, flexShrink: 0 }} />

              {/* Enemy status */}
              <div style={{ flex: 1, minWidth: 0 }}>
                {level.enemy.behaviors && status !== 'victory' && status !== 'defeat' && (
                  <div style={{ marginBottom: 2 }}>
                    <span style={{ background: 'rgba(239,68,68,0.35)', color: '#fca5a5', fontSize: 8, fontWeight: 700, padding: '1px 5px', borderRadius: 3 }}>ท่าต่อไป: {enemyIntentionLabel}</span>
                  </div>
                )}
                {infStore.corruptedSectorActive ? (
                  <div style={{ color: '#f87171', fontSize: 12, fontWeight: 700 }}>❓ Corrupted Sector: ข้อมูลซ่อน</div>
                ) : (
                  <>
                    <HPBar current={enemyHP} max={enemyMaxHP} color="#f87171" />
                    <span style={{ color: enemyHP < enemyMaxHP * 0.3 ? '#ef4444' : '#f87171', fontSize: 9, fontWeight: 700, display: 'block', textAlign: 'right' }}>{enemyHP}/{enemyMaxHP}</span>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4, marginTop: 2, flexWrap: 'wrap' }}>
                      <span style={{ background: 'rgba(239,68,68,0.2)', color: '#f87171', fontSize: 7, fontWeight: 700, padding: '1px 4px', borderRadius: 3 }}>
                        ATK {enemyData.atk}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Floating damage/heal numbers */}
            {floats.map(f => (
              <div key={f.id} style={{
                position: 'absolute',
                [f.side === 'hero' ? 'left' : 'right']: '11%',
                top: '8%',
                color: f.color, fontSize: 24, fontWeight: 900,
                pointerEvents: 'none',
                animation: 'floatUp 0.88s ease forwards',
                textShadow: `0 2px 10px ${f.color}, 0 0 24px ${f.color}`,
                zIndex: 10,
              }}>{f.text}</div>
            ))}
          </div>
        </div>

        {/* Active items row (Infinity Dev specific) */}
        {(infStore.supCards.length > 0 || infStore.hardware.length > 0 || infStore.viruses.length > 0) && (
          <div style={{
            padding: '4px 16px', background: 'rgba(0,0,0,0.3)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', flexShrink: 0,
          }}>
            {infStore.supCards.map((id) => {
              const card = SUP_CARDS.find((c) => c.id === id);
              return card ? (
                <span key={id} title={card.description} style={{
                  fontSize: 10, background: 'rgba(139,92,246,0.2)',
                  border: '1px solid rgba(139,92,246,0.4)', borderRadius: 6,
                  padding: '2px 8px', color: '#c4b5fd', cursor: 'default',
                }}>
                  {card.icon} {card.name}
                </span>
              ) : null;
            })}
            {infStore.hardware.map((id) => {
              const item = HARDWARE_ITEMS.find((h) => h.id === id);
              return item ? (
                <span key={id} title={item.pro} style={{
                  fontSize: 10, background: 'rgba(251,191,36,0.15)',
                  border: '1px solid rgba(251,191,36,0.3)', borderRadius: 6,
                  padding: '2px 8px', color: '#fbbf24', cursor: 'default',
                }}>
                  {item.icon} {item.name}
                </span>
              ) : null;
            })}
            {infStore.viruses.map((id) => {
              const virus = VIRUSES.find((v) => v.id === id);
              return virus ? (
                <span key={id} title={virus.penalty} style={{
                  fontSize: 10, background: 'rgba(239,68,68,0.15)',
                  border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6,
                  padding: '2px 8px', color: '#f87171', cursor: 'default',
                }}>
                  {virus.icon} {virus.name}
                </span>
              ) : null;
            })}
          </div>
        )}

        {/* ===== FLOWCHART SECTION ===== */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', borderRadius: 12 }}>

          {/* ===== FLOWCHART EDITOR ===== */}
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <FlowchartErrorBoundary key={`infinity-wave-${wave}`}>
                <FlowchartEditor
                  key={`infinity-wave-${wave}`}
                  allowedBlocks={undefined}
                  shieldRequiredTypes={missingRequiredTypes}
                  turnManaMax={turnManaMax}
                  turnManaUsed={turnManaUsed}
                  characterClass={heroChar.class}
                  characterLevel={heroChar.level}
                />
              </FlowchartErrorBoundary>
            </div>
            {/* Reset flowchart */}
            <div style={{ flexShrink: 0, padding: '6px 10px', borderTop: `1px solid ${colors.borderSubtle}`, display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  progressSaved.current = false;
                  setCurrentTurn(1); setBattlePhase('planning'); setEnemyBehaviorIdx(0);
                  liveBattleStateRef.current = null;
                  clearToStartEnd();
                  restartBattle(getBoostedChar() as any, level.enemy as any, level.id);
                }}
                disabled={isExecuting}
                style={{
                  background: colors.bgSurface, border: `1px solid ${colors.border}`,
                  color: colors.textSub, padding: '4px 16px', borderRadius: 8,
                  cursor: isExecuting ? 'not-allowed' : 'pointer', fontSize: 11,
                }}>↺ Reset Flowchart</button>
            </div>
          </div>

          {/* ===== PREVIEW SIDEBAR (vertical, right) ===== */}
          {flowPreview.length > 1 && status === 'waiting' && (
            <>
              <button
                onClick={() => setShowSimPreview((v) => !v)}
                title={showSimPreview ? 'ซ่อน Sim Preview' : 'แสดง Sim Preview'}
                style={{
                  flexShrink: 0, width: 14, border: 'none', cursor: 'pointer',
                  background: colors.bgSurface,
                  borderLeft: `1px solid ${colors.borderSubtle}`,
                  color: colors.textMuted, fontSize: 9,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                {showSimPreview ? '▶' : '◀'}
              </button>

              {showSimPreview && (
                <div style={{
                  width: 165, flexShrink: 0,
                  background: colors.bg,
                  display: 'flex', flexDirection: 'column',
                  overflowY: 'auto',
                }}>
                  <div style={{ padding: '7px 8px 6px', borderBottom: `1px solid ${colors.borderSubtle}`, flexShrink: 0 }}>
                    <p style={{ color: colors.textSub, fontSize: 9, fontWeight: 800, letterSpacing: 1.5, textTransform: 'uppercase', margin: 0 }}>
                      Sim Preview
                    </p>
                    <p style={{ color: colors.textMuted, fontSize: 8, margin: '2px 0 0' }}>ประมาณการก่อนกด Play</p>
                  </div>
                  <div style={{ padding: '6px 6px', display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {renderPreviewSteps(flowPreview, previewState.heroMaxHP, previewState.enemyMaxHP, colors)}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* ===== Wave Clear Overlay ===== */}
        {showWaveClear && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.78)',
            backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', zIndex: 50,
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #1a1a3e, #12122a)',
              border: '1px solid rgba(0,255,136,0.45)',
              borderRadius: 24, padding: '36px 48px', textAlign: 'center',
              boxShadow: '0 25px 60px rgba(0,0,0,0.6), 0 0 60px rgba(0,255,136,0.15)',
              animation: 'bounceIn 0.4s ease', minWidth: 320,
            }}>
              <div style={{ fontSize: 64, marginBottom: 8 }}>⚔️</div>
              <h2 style={{ fontSize: 28, fontWeight: 800, margin: '0 0 8px', color: '#00ff88' }}>
                Wave {wave} Clear!
              </h2>
              <p style={{ color: '#fbbf24', margin: '0 0 4px', fontSize: 15, fontWeight: 800 }}>
                +{waveClearFragments} 💾 Data Fragments
              </p>
              <p style={{ color: 'rgba(255,255,255,0.5)', margin: '0 0 8px', fontSize: 13 }}>
                กำลังโหลด Wave {wave + 1}...
              </p>
            </div>
          </div>
        )}

        {/* ===== Game Over Overlay ===== */}
        {status === 'defeat' && heroHP <= 0 && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', zIndex: 50,
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #1a1a2e, #12122a)',
              border: '1px solid rgba(239,68,68,0.45)',
              borderRadius: 24, padding: '36px 48px', textAlign: 'center',
              boxShadow: '0 25px 60px rgba(0,0,0,0.6), 0 0 60px rgba(239,68,68,0.12)',
              animation: 'bounceIn 0.4s ease', minWidth: 320,
            }}>
              <div style={{ fontSize: 64, marginBottom: 8 }}>💀</div>
              <h2 style={{ fontSize: 28, fontWeight: 800, margin: '0 0 8px', color: '#f87171' }}>
                GAME OVER
              </h2>
              <p style={{ color: '#fca5a5', margin: '0 0 4px', fontSize: 15 }}>
                ถึง Wave {wave}
              </p>
              <p style={{ color: '#fbbf24', margin: '0 0 24px', fontSize: 18, fontWeight: 800 }}>
                💾 {infStore.dataFragments} Data Fragments
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <button
                  onClick={() => navigate('/levels')}
                  style={{ padding: '12px 24px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontWeight: 600 }}>
                  ← หน้าหลัก
                </button>
                <button
                  onClick={() => { infStore.resetRun(); navigate('/infinity-dev'); }}
                  style={{ padding: '12px 24px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#dc2626,#b91c1c)', color: 'white', cursor: 'pointer', fontWeight: 700, fontSize: 15 }}>
                  ▶ เล่นใหม่
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===== Defeat (flowchart ended, still alive) — handled by turn-based logic, no separate overlay ===== */}

      </div>
    </>
  );
}
