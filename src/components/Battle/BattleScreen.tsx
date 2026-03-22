import React, { useState, useEffect, useRef, useMemo, Component } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LEVELS, ENDLESS_LEVEL, getEndlessWaveEnemy, PASSIVE_BONUSES } from '../../utils/constants';
import { useBattle } from '../../hooks/useBattle';
import { useBattleStore } from '../../stores/battleStore';
import { useGameStore } from '../../stores/gameStore';
import { useFlowchartStore } from '../../stores/flowchartStore';
import { useShopStore } from '../../stores/shopStore';
import ShopScreen from '../Shop/ShopScreen';
import { savePlayerProgress, saveCharacterProgress, saveLeaderboardEntry, saveLevelLeaderboardEntry, saveShopData, saveEndlessLeaderboardEntry, saveEndlessProgress, recordDailyLevelWin, saveFlowchart, loadFlowchart, saveAchievements } from '../../services/authService';
import { checkAchievements } from '../../utils/achievements';
import type { Achievement } from '../../utils/achievements';
import AchievementToast from '../UI/AchievementToast';
import type { LevelBattleStats } from '../../services/authService';
import { gainXP, levelProgressPct, xpToNextLevel, LEVEL_XP_TABLE, MAX_LEVEL } from '../../utils/levelSystem';
import FlowchartEditor from '../FlowchartEditor/FlowchartEditor';
import { previewFlowchart, calcFlowchartManaCost, calcTurnManaMax, executeEnemyAction, executeEnemyTurn, resolveHeroStatuses, ENEMY_ACTION_COST } from '../../engines/FlowchartEngine';
import type { BattleState, PreviewStep } from '../../engines/FlowchartEngine';
import { useTheme } from '../../contexts/ThemeContext';
import type { ThemeColors } from '../../contexts/ThemeContext';
import TutorialGuide from '../Tutorial/TutorialGuide';
import type { TutorialTarget } from '../Tutorial/TutorialGuide';
import BagButton from '../UI/BagButton';
import VolumeButton from '../UI/VolumeButton';
import { soundManager } from '../../services/soundManager';
import type { Character, Enemy, RequiredBlock } from '../../types/game.types';

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
@keyframes tutorialGlow {
  0%,100% { box-shadow: 0 0 0 2px rgba(251,191,36,0.5), 0 0 16px rgba(251,191,36,0.25); }
  50%     { box-shadow: 0 0 0 3px rgba(251,191,36,0.9), 0 0 28px rgba(251,191,36,0.5); }
}
@keyframes heroIdle {
  0%,100% { transform: translateY(0px); }
  50%     { transform: translateY(-7px); }
}
@keyframes enemyIdle {
  0%,100% { transform: translateY(0px) rotate(0deg); }
  30%     { transform: translateY(-6px) rotate(1.5deg); }
  70%     { transform: translateY(-3px) rotate(-1deg); }
}
@keyframes heroLowHP {
  0%,100% { transform: translateY(0px); filter: drop-shadow(0 0 6px rgba(239,68,68,0.6)); }
  50%     { transform: translateY(-4px); filter: drop-shadow(0 0 14px rgba(239,68,68,1)); }
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

const ENEMY_ICONS: Record<string, string> = {
  slime: '🟢', goblin: '👺', kobold: '👺', goblin_knight: '👺',
  orc: '👹', orc_warlord: '👹', ghost: '👻', troll: '🧌',
  spider: '🕷️', ice_giant: '🧊', dragon: '🐉',
  fire_elemental: '🔥', lich: '💀', shadow_demon: '👁️', overlord: '💀',
  vampire: '🧛', frost_titan: '❄️', dark_commander: '⚔️',
};

// Map level.id → image filename (1 ภาพต่อ 1 ด่าน ไม่ซ้ำกัน)
const LEVEL_IMAGE: Record<string, string> = {
  level_1:  'slime.png',
  level_2:  'bigger-slime.png',
  level_3:  'goblin-scout.png',
  level_4:  'goblin-heal.png',
  level_5:  'spider.png',
  level_6:  'kobold.png',
  level_7:  'forest-wraith.png',
  level_8:  'goblin-knight.png',
  level_9:  'orc-warrior.png',
  level_10: 'stone-troll.png',
  level_11: 'orc.png',
  level_12: 'ice-giant.png',
  level_13: 'dragons-lair.png',
  level_14: 'lich-lord.png',
  level_15: 'dark-overlord.png',
  level_16: 'vampire-lord.png',
  level_17: 'frost-titan.png',
  level_18: 'dark-commander.png',
  level_19: 'the-lich-lord.png',
  level_20: 'the-dark-overlord.png',
};

const LEVEL_BG: Record<string, string> = {
  level_endless: 'infinity_dev.jpg',
};

// Endless mode: กลุ่มละ 5 wave → 15 ศัตรู (ตามลำดับความยาก)
const WAVE_IMAGES = [
  'slime.png',        // wave  1–5
  'bigger-slime.png', // wave  6–10
  'goblin-scout.png', // wave 11–15
  'goblin-heal.png',  // wave 16–20
  'spider.png',       // wave 21–25
  'kobold.png',       // wave 26–30
  'forest-wraith.png',  // wave 31–35
  'goblin-knight.png',  // wave 36–40
  'orc-warrior.png',    // wave 41–45
  'stone-troll.png',    // wave 46–50
  'orc.png',            // wave 51–55
  'ice-giant.png',      // wave 56–60
  'dragons-lair.png',   // wave 61–65
  'lich-lord.png',      // wave 66–70
  'dark-overlord.png',  // wave 71+
];

function getWaveImage(wave: number): string {
  return WAVE_IMAGES[Math.min(Math.floor((wave - 1) / 5), WAVE_IMAGES.length - 1)];
}

function EnemySprite({ enemyId, levelId, waveNumber }: { enemyId: string; levelId: string; waveNumber?: number }) {
  const isEndlessMode = levelId === 'level_endless';
  const imgFile = isEndlessMode && waveNumber ? getWaveImage(waveNumber) : LEVEL_IMAGE[levelId];
  const [useImg, setUseImg] = useState(!!imgFile);
  // reset เมื่อ wave เปลี่ยน (endless)
  React.useEffect(() => { setUseImg(!!imgFile); }, [imgFile]);
  return useImg && imgFile ? (
    <img
      src={`/enemies/${imgFile}`}
      alt={enemyId}
      style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'bottom', imageRendering: 'pixelated' }}
      onError={() => setUseImg(false)}
    />
  ) : (
    <span style={{ fontSize: 'var(--enemy-font)', lineHeight: 1 }}>{ENEMY_ICONS[enemyId] ?? '👹'}</span>
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
        {/* Connector line between sibling steps */}
        {i > 0 && (
          <div style={{ display: 'flex', justifyContent: 'center', height: 8 }}>
            <div style={{ width: 1, height: '100%', background: colors.bgSurface }} />
          </div>
        )}

        {/* Step card */}
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
                {/* Hero HP mini bar */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 1 }}>
                    <span style={{ color: colors.textMuted, fontSize: 7 }}>🧍</span>
                    <span style={{ color: heroHPPct < 30 ? '#ef4444' : '#4ade80', fontSize: 7, fontWeight: 700 }}>{step.heroHPAfter}</span>
                  </div>
                  <div style={{ width: '100%', height: 3, background: colors.bgSurface, borderRadius: 2 }}>
                    <div style={{ width: heroHPPct + '%', height: '100%', borderRadius: 2, background: heroHPPct < 30 ? '#ef4444' : '#4ade80', transition: 'width 0.2s' }} />
                  </div>
                </div>
                {/* Enemy HP mini bar */}
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

        {/* Branch sections — rendered below the step card */}
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
interface LevelUpData { oldLevel: number; newLevel: number; hpGain: number; atkGain: number }

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


// Stable empty array — avoids new [] reference on every render (prevents infinite loop)
const EMPTY_REQUIRED_BLOCKS: string[] = [];

/**
 * Diminishing returns per level clear count (BEFORE this run)
 * XP:  1st=100%  2nd=50%  3rd=25%  4th+=10%
 * Gold: 1st=100%  2nd=75%  3rd=50%  4th+=25%
 */
function getRewardMultiplier(clearCountBefore: number): { xp: number; gold: number } {
  if (clearCountBefore === 0) return { xp: 1.0, gold: 1.0 };
  if (clearCountBefore === 1) return { xp: 0.5, gold: 0.75 };
  if (clearCountBefore === 2) return { xp: 0.25, gold: 0.5 };
  return { xp: 0.1, gold: 0.25 };
}

const BONUS_OBJECTIVE_XP_RATIO = 0.5; // bonus XP = 50% ของ base XP เมื่อผ่าน bonus objective

// ===== Main Component =====
export default function BattleScreen() {
  const { colors, theme } = useTheme();
  const { levelId } = useParams<{ levelId: string }>();
  const navigate = useNavigate();
  const { character, player, setPlayer, setCharacter, dailyFarmPlays, setDailyFarmPlays } = useGameStore();
  const { status, heroHP, heroMaxHP, enemyHP, enemyMaxHP, battleLog, isExecuting, totalDamageTaken, heroBurnRounds, heroFreezeRounds, heroPoisonRounds, enemyStunnedRounds, enemyBurnRounds, enemyFreezeRounds, enemyPoisonRounds, heroBerserkRounds, healCharges, comboCount, startBattle, restartBattle, stopBattle, executeBattle } = useBattle();
  const { antidotes: shopAntidotes, potions: shopPotions, gold: shopGold, addGold, setPotions, setAntidotes } = useShopStore();
  const { validationError, nodes: flowNodes, edges: flowEdges, setNodes: setFlowNodes, setEdges: setFlowEdges, clearToStartEnd } = useFlowchartStore();
  const [speedIdx, setSpeedIdx] = useState(1);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  useEffect(() => {
    const onResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  const isMobile = windowWidth < 640;
  const progressSaved = useRef(false);
  const battleStartTime = useRef<number>(0);
  const battleReady = useRef(false); // true after startBattle fires; guards stale-status effects

  // Turn-based state
  const [currentTurn, setCurrentTurn] = useState(1);
  const [battlePhase, setBattlePhase] = useState<'planning' | 'running' | 'enemy_turn' | 'resolution'>('planning');
  const [enemyBehaviorIdx, setEnemyBehaviorIdx] = useState(0);
  // Phase 4: extra action-budget debuff carried over from virus effect
  const [extraManaDebuff, setExtraManaDebuff] = useState(0);

  // Live battle state ref for enemy turn
  const liveBattleStateRef = useRef<BattleState | null>(null);

  // Shop state
  const [showShop, setShowShop] = useState(false);
  const [shopFromBag, setShopFromBag] = useState(false);
  const [goldEarned, setGoldEarned] = useState(0);

  // Endless Wave state
  const isEndless = levelId === 'level_endless';
  const [waveNumber, setWaveNumber] = useState(1);
  const [endlessScore, setEndlessScore] = useState(0);
  const [showWaveClear, setShowWaveClear] = useState(false);
  const [endlessDmgDealt, setEndlessDmgDealt] = useState(0);
  const [endlessDmgTaken, setEndlessDmgTaken] = useState(0);
  const [showTutorial, setShowTutorial] = useState(() => {
    if (!levelId || levelId === 'level_endless') return false;
    return true;
  });
  const [tutorialTarget, setTutorialTarget] = useState<TutorialTarget>(null);

  // useMemo prevents new object reference every render (would cause infinite loop via shieldRequiredTypes)
  const level = useMemo(() => (isEndless
    ? { ...ENDLESS_LEVEL, enemy: getEndlessWaveEnemy(waveNumber) }
    : LEVELS.find((l) => l.id === levelId)
  ) as (typeof LEVELS)[0] | undefined, [isEndless, waveNumber, levelId]);

  // Level access guard — redirect if level is locked, invalid, or no character (prevents URL manipulation)
  useEffect(() => {
    if (isEndless) return;
    if (!character) { navigate('/character', { replace: true }); return; }
    if (!level) { navigate('/levels', { replace: true }); return; }
    const idx = LEVELS.findIndex((l) => l.id === levelId);
    const completed = player?.levelsCompleted ?? [];
    const unlocked = idx === 0 || completed.includes(level.id) || completed.includes(LEVELS[idx - 1]?.id ?? '');
    if (!unlocked) navigate('/levels', { replace: true });
  }, [isEndless, character, level, levelId, player, navigate]);

  // Action budget per turn — scales with turn; base 5 for level ≥ 11
  const turnManaMax = Math.max(1, calcTurnManaMax(currentTurn, level?.number ?? 1) - extraManaDebuff);
  const turnManaUsed = useMemo(() => calcFlowchartManaCost(flowNodes), [flowNodes]);

  // Enemy intention — show all actions it will take this turn based on budget
  const enemyBudget = (level?.enemy as any)?.budgetPerTurn ?? 1;
  const enemyBehaviors = level?.enemy.behaviors ?? ['attack'];
  const intentionLabelMap: Record<string, string> = {
    attack: '🗡️ โจมตี', heal: '💚 ฟื้นฟู', cast_spell: '✨ สเปล',
    poison_strike: '🟣 พิษ', freeze_strike: '❄️ แช่แข็ง', burn_strike: '🔥 เผา', power_strike: '💥 โจมตีหนัก',
  };
  const enemyIntentionActions = (() => {
    const actions: string[] = [];
    let budget = enemyBudget;
    let i = 0;
    while (budget > 0) {
      const beh = enemyBehaviors[(enemyBehaviorIdx + i) % enemyBehaviors.length];
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

  // Animation state
  const [newAchievements, setNewAchievements] = useState<Achievement[]>([]);
  const [heroAnimKey, setHeroAnimKey] = useState(0);
  const [enemyAnimKey, setEnemyAnimKey] = useState(0);
  const [heroAnim, setHeroAnim] = useState('');
  const [enemyAnim, setEnemyAnim] = useState('');
  const [floats, setFloats] = useState<FloatNum[]>([]);
  const floatId = useRef(0);

  // Level-up / XP state (shown in result overlay)
  const [levelUpData, setLevelUpData] = useState<LevelUpData | null>(null);
  const [xpGained, setXpGained] = useState(0);
  const [bonusXpGained, setBonusXpGained] = useState(0);
  const [xpMultiplierPct, setXpMultiplierPct] = useState(100);
  const [missingBlocks, setMissingBlocks] = useState<string[]>([]);
  const [showSimPreview, setShowSimPreview] = useState(true);

  // Shield: compute all missing required block types
  // Icons match the ReactFlow context menu exactly (FlowchartEditor ACTION_GROUPS)
  const SHIELD_ICONS: Record<string, string> = {
    condition: '◇',
    heal: '💚', dodge: '🌀', cast_spell: '✨', power_strike: '💥', attack: '⚔️',
    enemy_alive: '☠️', hp_less: '❤️', turn_gte: '🔢', hero_poisoned: '🟣', hero_frozen: '❄️',
  };
  const SHIELD_LABELS: Record<string, string> = {
    condition: 'Condition',
    heal: 'Heal', dodge: 'Dodge', cast_spell: 'Cast Spell', power_strike: 'Power Strike', attack: 'Attack',
    enemy_alive: 'Enemy Alive?', hp_less: 'HP < N?', turn_gte: 'Turn ≥ N?', hero_poisoned: 'Poisoned?', hero_frozen: 'Frozen?',
  };
  const COND_TYPES = ['enemy_alive', 'hp_less', 'turn_gte', 'hero_poisoned', 'hero_frozen'];

  const missingRequiredTypes = useMemo(() => {
    if (!level?.requiredBlocks?.length) return EMPTY_REQUIRED_BLOCKS;
    return level.requiredBlocks.filter((req) => {
      if (req === 'condition') return !flowNodes.some((n) => n.type === 'condition');
      if (COND_TYPES.includes(req)) return !flowNodes.some((n) => n.type === 'condition' && (n.data as any).conditionType === req);
      return !flowNodes.some((n) => n.type === 'action' && n.data.actionType === req);
    });
  }, [level, flowNodes]);

  const isEnemyShielded = missingRequiredTypes.length > 0;
  const shieldMissing = missingRequiredTypes.length > 0
    ? `ต้องใช้ ${missingRequiredTypes.map((r) => SHIELD_LABELS[r] ?? r).join(' + ')} block`
    : '';

  // Preview: compute expected HP changes from current flowchart
  const previewState = useMemo<BattleState>(() => ({
    heroHP: level?.enemy ? heroMaxHP : 100,
    heroMaxHP,
    enemyHP: level?.enemy.stats.maxHP ?? 100,
    enemyMaxHP: level?.enemy.stats.maxHP ?? 100,
    heroAttack: character?.stats.attack ?? 12,
    heroDefense: character?.stats.defense ?? 8,
    heroParry: 10,
    enemyAttack: level?.enemy.stats.attack ?? 8,
    enemyBaseAttack: level?.enemy.stats.attack ?? 8,
    enemyDefense: level?.enemy.stats.defense ?? 3,
    enemyArmor: (level?.enemy.stats as any)?.armor ?? 0,
    enemyParry: (level?.enemy.stats as any)?.parry ?? 0,
    enemyShielded: isEnemyShielded,
    shieldReason: shieldMissing,
    enemyEnraged: false,
    enrageThreshold: (level?.enemy.stats as any)?.enrageThreshold ?? 0,
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
    enemyAilmentType: (level?.enemy.stats as any)?.ailmentType ?? '',
    enemyAilmentChance: (level?.enemy.stats as any)?.ailmentChance ?? 0,
    antidotes: shopAntidotes,
    potions: shopPotions,
    gold: shopGold,
    round: 1,
    currentTurn: 1,
    turnManaMax: 3,
    heroIsEvading: false,
    conditionBonus: false,
    heroBerserkRounds: 0,
    // Phase 4
    virusTurnWasted: false,
    manaDebuff: 0,
  }), [level, character, heroMaxHP, isEnemyShielded, shieldMissing, shopAntidotes, shopPotions, shopGold]);

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

  // Compute passive bonuses for heroChar based on class + level
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

    return {
      ...heroChar,
      stats: {
        ...heroChar.stats,
        attack: heroChar.stats.attack + totalPassive.atkBonus,
        defense: heroChar.stats.defense + totalPassive.defBonus,
        maxHP: heroChar.stats.maxHP + totalPassive.hpBonus,
        currentHP: heroChar.stats.maxHP + totalPassive.hpBonus,
        speed: heroChar.stats.speed + totalPassive.speedBonus,
      },
    };
  };

  // Apply initial hero HP and status from level definition
  const applyInitialHeroState = (lv: typeof level) => {
    if (!lv) return;
    const maxHP = battleStore.heroMaxHP || 100;
    if (lv.initialHeroHPPercent !== undefined) {
      battleStore.updateHeroHP(Math.max(1, Math.floor(maxHP * lv.initialHeroHPPercent)));
    }
    if (lv.initialHeroStatus) {
      battleStore.setAilments({
        burn: (lv.initialHeroStatus as any).burnRounds ?? 0,
        freeze: lv.initialHeroStatus.freezeRounds ?? 0,
        poison: lv.initialHeroStatus.poisonRounds ?? 0,
        enemyStun: 0,
      });
    }
  };

  // Init battle on level change + load saved flowchart
  useEffect(() => {
    battleReady.current = false;
    if (level) {
      progressSaved.current = false;
      setLevelUpData(null);
      setXpGained(0);
      setMissingBlocks([]);
      setCurrentTurn(1);
      setBattlePhase('planning');
      setEnemyBehaviorIdx(0);
      liveBattleStateRef.current = null;
      startBattle(getBoostedChar() as any, level.enemy as any, level.id);
      applyInitialHeroState(level);
      battleReady.current = true;

      // โหลด flowchart ที่บันทึกไว้ (ถ้ามี)
      if (player?.id && !isEndless) {
        loadFlowchart(player.id, level.id).then((saved) => {
          if (saved) {
            setFlowNodes(saved.nodes);
            setFlowEdges(saved.edges);
            setLoadedFromCloud(true);
            setTimeout(() => setLoadedFromCloud(false), 3000);
          }
        }).catch(() => {});
      }
    }
  }, [levelId]);

  // Auto-save flowchart เมื่อ nodes/edges เปลี่ยน (debounce 800ms)
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveStatusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [loadedFromCloud, setLoadedFromCloud] = useState(false);

  useEffect(() => {
    if (!player?.id || isEndless || flowNodes.length === 0) return;
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    setSaveStatus('saving');
    autoSaveTimerRef.current = setTimeout(async () => {
      try {
        await saveFlowchart(player.id, levelId ?? '', flowNodes, flowEdges);
        setSaveStatus('saved');
        if (saveStatusTimerRef.current) clearTimeout(saveStatusTimerRef.current);
        saveStatusTimerRef.current = setTimeout(() => setSaveStatus('idle'), 2500);
      } catch {
        setSaveStatus('idle');
      }
    }, 800);
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [flowNodes, flowEdges]);

  // Trigger animation + floating numbers on each new log entry
  useEffect(() => {
    if (battleLog.length === 0) return;
    const last = battleLog[battleLog.length - 1];
    soundManager.playFromLog(last.action, last.actor);
    soundManager.playVoiceForAction(last.action, last.actor, heroChar.class);
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
    // When battlePhase is 'running' and execution finishes:
    // - victory (enemy died) or hero died → leave as-is (useBattle already set status)
    // - flowchart ended, enemy still alive → useBattle sets 'defeat' — we override to enemy turn
    if (battlePhase === 'running' && !isExecuting) {
      if (status === 'victory') {
        // enemy died — stay as victory
        setBattlePhase('planning');
        return;
      }
      if (heroHP <= 0) {
        // hero died — stay as defeat
        setBattlePhase('planning');
        return;
      }
      // Fallback: validation failed — execution never started, reset phase so button works again
      if (status === 'waiting' || status === 'running') {
        setBattlePhase('planning');
        return;
      }
      if (status === 'defeat' && enemyHP > 0 && heroHP > 0) {
        // Flowchart ended, enemy still alive — go to enemy turn
        // Override status back to 'waiting' so we can continue
        battleStore.setStatus('waiting');

        // Phase 4: check if any debug_block was executed — remove virus nodes
        const execLog = useFlowchartStore.getState().executionLog;
        const hasDebug = execLog.some((s) => s.action === 'debug_block');
        if (hasDebug) {
          useFlowchartStore.getState().removeVirusNodes();
        }

        const charStats = useBattleStore.getState().battle?.character.stats;
        const enemyStats = useBattleStore.getState().battle?.enemy.stats;
        const store = useBattleStore.getState();

        // Phase 4: handle virusTurnWasted and manaDebuff from final engine state
        const virusTurnWasted = liveBattleStateRef.current?.virusTurnWasted ?? false;
        const manaDebuffVal = liveBattleStateRef.current?.manaDebuff ?? 0;
        if (manaDebuffVal > 0) {
          setExtraManaDebuff((prev) => prev + manaDebuffVal);
        }

        // Carry enemy enrage state: check if HP dropped below threshold during hero turn
        const baseEnemyAtk = (enemyStats as any)?.attack ?? 8;
        const enrageThresholdPct = (enemyStats as any)?.enrageThreshold ?? 0;
        const isEnemyEnragedNow = enrageThresholdPct > 0 &&
          store.enemyMaxHP > 0 &&
          (store.enemyHP / store.enemyMaxHP) * 100 <= enrageThresholdPct;
        const enragedAtk = isEnemyEnragedNow ? Math.floor(baseEnemyAtk * 1.5) : baseEnemyAtk;

        const stateSnap: BattleState = {
          heroHP: store.heroHP,
          heroMaxHP: store.heroMaxHP,
          enemyHP: store.enemyHP,
          enemyMaxHP: store.enemyMaxHP,
          heroAttack: (charStats?.attack ?? 10),
          heroDefense: charStats?.defense ?? 5,
          heroParry: 10,
          enemyAttack: enragedAtk,
          enemyBaseAttack: baseEnemyAtk,
          enemyDefense: (enemyStats as any)?.defense ?? 3,
          enemyArmor: (enemyStats as any)?.armor ?? 0,
          enemyParry: (enemyStats as any)?.parry ?? 0,
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
          enemyAilmentType: (enemyStats as any)?.ailmentType ?? '',
          enemyAilmentChance: (enemyStats as any)?.ailmentChance ?? 0,
          antidotes: 0,
          potions: 0,
          gold: 0,
          round: currentTurn,
          currentTurn,
          turnManaMax,
          heroIsEvading: liveBattleStateRef.current?.heroIsEvading ?? false,
          conditionBonus: false,
          heroBerserkRounds: liveBattleStateRef.current?.heroBerserkRounds ?? 0,
          // Phase 4
          virusTurnWasted: false,
          manaDebuff: 0,
        };
        liveBattleStateRef.current = stateSnap;

        // Phase 4: if virus wasted the turn, enemy gets a free extra attack immediately
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

  // Endless wave: on victory, show wave-clear overlay instead of normal flow
  useEffect(() => {
    if (isEndless && status === 'victory' && !progressSaved.current && battleReady.current) {
      progressSaved.current = true;
      const score = waveNumber * Math.round((heroHP / heroMaxHP) * 100);
      setEndlessScore((prev) => prev + score);
      // Accumulate damage stats across waves
      const waveDmgDealt = Math.max(0, (level?.enemy.stats.maxHP ?? 0) - Math.max(0, enemyHP));
      setEndlessDmgDealt((prev) => prev + waveDmgDealt);
      setEndlessDmgTaken((prev) => prev + totalDamageTaken);
      setShowWaveClear(true);
    }
  }, [isEndless, status]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.code === 'Space') {
        e.preventDefault();
        if (!isExecuting && battlePhase === 'planning' && status !== 'victory' && status !== 'defeat' && level) {
          battleStartTime.current = Date.now();
          setBattlePhase('running');
          executeBattle(SPEED_LEVELS[speedIdx].ms, (level.requiredBlocks ?? []) as RequiredBlock[], turnManaMax);
        }
      } else if (e.code === 'KeyR' && !e.ctrlKey && !e.metaKey) {
        if (!isExecuting && (status === 'victory' || status === 'defeat' || battlePhase === 'planning') && level) {
          setLevelUpData(null); setXpGained(0); setBonusXpGained(0); setXpMultiplierPct(100); setMissingBlocks([]);
          progressSaved.current = false;
          setCurrentTurn(1); setBattlePhase('planning'); setEnemyBehaviorIdx(0);
          liveBattleStateRef.current = null;
          restartBattle(getBoostedChar() as unknown as Character, level.enemy as unknown as Enemy, level.id); applyInitialHeroState(level);
        }
      } else if (e.code === 'Escape') {
        if (isExecuting) stopBattle();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isExecuting, battlePhase, status, speedIdx, turnManaMax]);

  // Play victory/defeat SFX
  useEffect(() => {
    if (status === 'victory' && heroHP > 0) soundManager.playSFX('victory');
    else if (status === 'defeat' && heroHP <= 0) {
      soundManager.playSFX('defeat');
      soundManager.playVoice(heroChar.class === 'mage' ? 'mage-death' : 'warrior-death');
    }
  }, [status]);

  // Save progress + award XP on battle end
  useEffect(() => {
    if ((status === 'victory' || status === 'defeat') && !progressSaved.current && player && level) {
      // Turn-based: 'defeat' while both still alive = hero flowchart ended this turn, NOT a final loss
      // Don't save progress yet — wait for the real final outcome (victory or hero HP = 0)
      if (status === 'defeat' && heroHP > 0 && enemyHP > 0) return;

      progressSaved.current = true;

      // ── Sync potions/antidotes ที่ใช้ในการสู้กลับ shop store + Firebase ──
      const finalPotions = liveBattleStateRef.current?.potions ?? shopPotions;
      const finalAntidotes = liveBattleStateRef.current?.antidotes ?? shopAntidotes;
      if (finalPotions !== shopPotions || finalAntidotes !== shopAntidotes) {
        setPotions(finalPotions);
        setAntidotes(finalAntidotes);
        const { gold: g, purchasedEquipment: pe, lastRestockTime: lrt, attackBonus: ab } = useShopStore.getState();
        saveShopData(player.id, g, pe, lrt, finalPotions, finalAntidotes, ab).catch(() => {});
      }

      // Save endless leaderboard on game-over (hero died)
      if (isEndless) {
        // Add damage from the final (losing) wave
        const finalDmgDealt = endlessDmgDealt + Math.max(0, (level.enemy.stats.maxHP ?? 0) - Math.max(0, enemyHP));
        const finalDmgTaken = endlessDmgTaken + totalDamageTaken;
        saveEndlessLeaderboardEntry(player, heroChar, {
          score: endlessScore,
          wavesCleared: Math.max(0, waveNumber - 1),
          damageDealt: finalDmgDealt,
          damageTaken: finalDmgTaken,
        }).catch((e) => console.error('[Endless] leaderboard save error:', e));
        saveEndlessProgress(player.id, endlessScore, Math.max(0, waveNumber - 1))
          .then(({ highScore, highWave }) => {
            setPlayer({ ...player, endlessHighScore: highScore, endlessHighWave: highWave });
          })
          .catch((e) => console.error('[Endless] progress save error:', e));
        return;
      }

      // Check required blocks — if any are missing, don't count as victory
      let won = status === 'victory';
      if (won && level.requiredBlocks?.length) {
        const BLOCK_LABELS: Record<string, string> = {
          condition: 'Condition',
          heal: 'Heal',
          dodge: 'Dodge',
          cast_spell: 'Cast Spell',
          power_strike: 'Power Strike',
        };
        const missing = level.requiredBlocks.filter((req) => {
          if (req === 'condition') return !flowNodes.some((n) => n.type === 'condition');
          if (req === 'heal') return !flowNodes.some((n) => n.type === 'action' && n.data.actionType === 'heal');
          if (req === 'dodge') return !flowNodes.some((n) => n.type === 'action' && n.data.actionType === 'dodge');
          if (req === 'cast_spell') return !flowNodes.some((n) => n.type === 'action' && n.data.actionType === 'cast_spell');
          if (req === 'power_strike') return !flowNodes.some((n) => n.type === 'action' && n.data.actionType === 'power_strike');
          return false;
        });
        if (missing.length > 0) {
          setMissingBlocks(missing.map((r) => BLOCK_LABELS[r] ?? r));
          won = false;
        }
      }

      let savedChar = heroChar;
      if (won) {
        // ── Diminishing returns (daily, resets midnight UTC+7) ───────────────
        const clearCountBefore = dailyFarmPlays[level.id] ?? 0;
        const mult = getRewardMultiplier(clearCountBefore);
        // บันทึกการชนะวันนี้ใน Firestore + อัพเดต store
        recordDailyLevelWin(player.id, level.id).then((newCount) => {
          setDailyFarmPlays({ ...dailyFarmPlays, [level.id]: newCount });
        }).catch(() => {});
        setXpMultiplierPct(Math.round(mult.xp * 100));

        // Award gold (with multiplier)
        const baseGold = (level.rewards as any).gold ?? 0;
        const earnedGold = Math.max(0, Math.round(baseGold * mult.gold));
        if (earnedGold > 0) {
          setGoldEarned(earnedGold);
          addGold(earnedGold);
          const newGold = shopGold + earnedGold;
          const { purchasedEquipment: pe2, lastRestockTime: lrt2, potions: sp, antidotes: sa, attackBonus: sab } = useShopStore.getState();
          saveShopData(player.id, newGold, pe2, lrt2, sp, sa, sab).catch(() => { });
        }

        // Award XP: base * multiplier + bonus XP (ถ้าผ่าน bonus objective)
        const baseXp = level.rewards.experience;
        const bonusObjPassed = !!level.bonusObjective && heroHP > heroMaxHP * 0.2;
        const bonusXp = bonusObjPassed ? Math.floor(baseXp * BONUS_OBJECTIVE_XP_RATIO) : 0;
        const finalXp = Math.max(1, Math.round(baseXp * mult.xp)) + bonusXp;
        setBonusXpGained(bonusXp);
        setXpGained(finalXp);
        const { newCharacter, leveledUp, oldLevel, newLevel } = gainXP(heroChar, finalXp);
        savedChar = newCharacter;
        setCharacter(newCharacter);
        // sync player.characterProgress ใน store ให้เป็นปัจจุบัน (ป้องกัน stale ใน CharacterCustomizer)
        if (player) {
          setPlayer({
            ...player,
            characterProgress: {
              ...player.characterProgress,
              [newCharacter.class]: {
                level: newCharacter.level, experience: newCharacter.experience,
                maxHP: newCharacter.stats.maxHP, attack: newCharacter.stats.attack,
                defense: newCharacter.stats.defense, speed: newCharacter.stats.speed,
                class: newCharacter.class, name: newCharacter.name,
              },
            },
            lastPlayedClass: newCharacter.class,
          });
        }
        if (leveledUp) {
          setLevelUpData({ oldLevel, newLevel, hpGain: (newLevel - oldLevel) * 10, atkGain: (newLevel - oldLevel) * 2 });
          soundManager.playSFX('level-up');
        }
        saveCharacterProgress(player.id, newCharacter).catch(() => { });
      }

      const battleStats: LevelBattleStats = {
        levelId: level.id,
        levelNumber: level.number,
        damageDealt: Math.max(0, (level.enemy.stats.maxHP) - Math.max(0, enemyHP)),
        damageTaken: totalDamageTaken,
        timeMs: battleStartTime.current > 0 ? (Date.now() - battleStartTime.current) * (speedIdx + 1) : 0,
        heroHPRemaining: Math.max(0, heroHP),
        heroMaxHP: heroMaxHP,
      };

      // Auto-grading score: HP% (60%) + node efficiency (40%)
      const hpScore = Math.round((Math.max(0, heroHP) / heroMaxHP) * 60);
      const nodeCount = flowNodes.filter((n) => n.type === 'action' || n.type === 'condition' || n.type === 'loop').length;
      const nodeScore = Math.max(0, 40 - Math.max(0, nodeCount - 3) * 4);
      const levelScore = won ? Math.min(100, hpScore + nodeScore) : 0;

      savePlayerProgress(player.id, level.id, won, player.username ?? undefined, won ? levelScore : undefined).then((updated) => {
        if (updated) {
          // merge username จาก store เพราะ Firestore อาจไม่มี field นี้
          const mergedPlayer = { ...updated, username: updated.username ?? player.username };
          setPlayer(mergedPlayer);
          if (won) {
            const wasFirstClear = !player.levelsCompleted?.includes(level.id);
            saveLeaderboardEntry(mergedPlayer, savedChar, battleStats, wasFirstClear).catch((e) => console.error('[Leaderboard] overall save error:', e));
            saveLevelLeaderboardEntry(mergedPlayer, savedChar, battleStats).catch((e) => console.error('[Leaderboard] level save error:', e));

            // ── Achievement check ──
            const actionsUsed = flowNodes
              .filter((n) => n.type === 'action')
              .map((n) => n.data.actionType ?? '');
            const unlocked = checkAchievements({
              levelId: level.id,
              won: true,
              turnCount: currentTurn,
              heroHPPercent: Math.round((heroHP / heroMaxHP) * 100),
              damageTaken: totalDamageTaken,
              wave: waveNumber,
              actionsUsed,
              player: mergedPlayer,
            });
            if (unlocked.length > 0) {
              setNewAchievements(unlocked);
              saveAchievements(player.id, unlocked.map((a) => a.id)).catch(() => {});
            }
          }
        }
      }).catch(() => { });
    }
  }, [status]);

  // ===== Turn-based helper functions =====
  const battleStore = useBattleStore();

  function handleResolution(stateAfterEnemy: BattleState) {
    // Use resolveHeroStatuses for hero ailment/berserk ticks
    const { newState: s, logs: ticks } = resolveHeroStatuses(stateAfterEnemy);
    if (ticks.length > 0) {
      battleStore.addLog({ round: currentTurn, action: ticks.join(' | '), actor: 'hero', timestamp: Date.now() });
    }
    // Sync HP/ailments back
    battleStore.updateHeroHP(s.heroHP);
    battleStore.updateEnemyHP(s.enemyHP);
    battleStore.setAilments({
      burn: s.heroBurnRounds, freeze: s.heroFreezeRounds, poison: s.heroPoisonRounds, enemyStun: s.enemyStunnedRounds,
      enemyBurn: s.enemyBurnRounds, enemyFreeze: s.enemyFreezeRounds, enemyPoison: s.enemyPoisonRounds, heroBerserk: s.heroBerserkRounds,
    });
    liveBattleStateRef.current = s;

    // Check end conditions
    if (s.enemyHP <= 0) { battleStore.setStatus('victory'); setBattlePhase('planning'); return; }
    if (s.heroHP <= 0) { battleStore.setStatus('defeat'); setBattlePhase('planning'); return; }

    // Advance turn
    setCurrentTurn(t => t + 1);
    setBattlePhase('planning');
  }

  function handleEnemyTurn(stateAfterHero: BattleState) {
    setBattlePhase('enemy_turn');
    const speedMs = SPEED_LEVELS[speedIdx].ms;
    setTimeout(() => {
      const budget = (level?.enemy as any)?.budgetPerTurn ?? 1;
      const behaviors = level?.enemy.behaviors ?? ['attack'];
      const { newState, logs, actionsUsed } = executeEnemyTurn(behaviors, enemyBehaviorIdx, budget, stateAfterHero);
      logs.forEach((log) => battleStore.addLog({ round: currentTurn, action: log, actor: 'enemy', timestamp: Date.now() }));
      const log = logs[logs.length - 1] ?? '';

      // Phase 4: Boss virus injection (levels 11+) — 35% chance each turn
      if (level && level.number >= 11 && newState.enemyHP > 0) {
        if (Math.random() < 0.35) {
          const { nodes: vNodes, edges: vEdges, injectVirusNode: injectVirus } = useFlowchartStore.getState();
          const validEdges = vEdges.filter((e) => {
            const src = vNodes.find((n) => n.id === e.source);
            const tgt = vNodes.find((n) => n.id === e.target);
            return src?.type !== 'start' && tgt?.type !== 'end'
              && !src?.data.isVirus && !tgt?.data.isVirus;
          });
          if (validEdges.length > 0) {
            const randomEdge = validEdges[Math.floor(Math.random() * validEdges.length)];
            const effects = ['drain_hp', 'waste_turn', 'mana_drain', 'scramble'] as const;
            const effect = effects[Math.floor(Math.random() * effects.length)];
            const effectLabels: Record<string, string> = {
              drain_hp: '☠️ Drain HP', waste_turn: '☠️ Waste Turn',
              mana_drain: '☠️ Mana Drain', scramble: '☠️ Scramble',
            };
            const srcNode = vNodes.find((n) => n.id === randomEdge.source);
            const tgtNode = vNodes.find((n) => n.id === randomEdge.target);
            const midX = ((srcNode?.position.x ?? 0) + (tgtNode?.position.x ?? 0)) / 2;
            const midY = ((srcNode?.position.y ?? 0) + (tgtNode?.position.y ?? 0)) / 2 + 10;
            const virusNode = {
              id: `virus_${Date.now()}`,
              type: 'action' as const,
              position: { x: midX, y: midY },
              data: {
                label: effectLabels[effect],
                actionType: 'debug_block' as const,
                isVirus: true,
                virusEffect: effect,
              },
            };
            injectVirus(virusNode, randomEdge.id);
            battleStore.addLog({ round: currentTurn, action: `☠️ Enemy injected a VIRUS into your flowchart! Place Debug Block to remove it.`, actor: 'enemy', timestamp: Date.now() });
          }
        }
      }

      // Animate enemy
      setEnemyAnim('enemyHit');
      setEnemyAnimKey(k => k + 1);
      // Parse floating numbers
      const heroDmgMatch = log.match(/Hero -(\d+)/i);
      if (heroDmgMatch) {
        const f = { id: ++floatId.current, text: `-${heroDmgMatch[1]}`, color: '#fda4af', side: 'hero' as const };
        setFloats(p => [...p, f]);
        setTimeout(() => setFloats(p => p.filter(x => x.id !== f.id)), 900);
      }
      setTimeout(() => { setEnemyAnim(''); }, 560);
      // Update HP immediately
      battleStore.updateHeroHP(newState.heroHP);
      battleStore.updateEnemyHP(newState.enemyHP);
      battleStore.setAilments({
        burn: newState.heroBurnRounds, freeze: newState.heroFreezeRounds, poison: newState.heroPoisonRounds, enemyStun: newState.enemyStunnedRounds,
        enemyBurn: newState.enemyBurnRounds, enemyFreeze: newState.enemyFreezeRounds, enemyPoison: newState.enemyPoisonRounds, heroBerserk: newState.heroBerserkRounds,
      });
      // Advance enemy behavior by number of actions used
      setEnemyBehaviorIdx(i => i + actionsUsed);
      // Resolution after another delay
      setBattlePhase('resolution');
      setTimeout(() => {
        handleResolution(newState);
      }, speedMs);
    }, speedMs);
  }

  if (!level) return (
    <div style={{ minHeight: '100vh', background: colors.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', color: colors.text }}>
        <p>Level not found</p>
        <button onClick={() => navigate('/levels')} style={{ color: '#e94560', background: 'none', border: 'none', cursor: 'pointer', marginTop: 12 }}>
          Back to Levels
        </button>
      </div>
    </div>
  );

  const statusConfig: Record<string, { label: string; color: string }> = {
    waiting: { label: '⏸ รอ flowchart...', color: colors.textSub },
    running: { label: '⚡ กำลังรัน...', color: '#fbbf24' },
    victory: { label: '🏆 ชนะ!', color: '#4ade80' },
    defeat: { label: '💀 แพ้...', color: '#f87171' },
  };
  const stat = statusConfig[status] ?? statusConfig.waiting;
  const xpPct = levelProgressPct(heroChar.level, heroChar.experience);
  const xpLeft = xpToNextLevel(heroChar.level, heroChar.experience);

  // Overlay state derived from status + missingBlocks
  const isIncomplete = status === 'victory' && missingBlocks.length > 0;
  const isRealVictory = status === 'victory' && missingBlocks.length === 0;

  // Learning Objective icon — based on concept keyword
  const conceptIcon = (() => {
    const c = level?.concept ?? '';
    if (c.includes('Loop') || c.includes('While')) return '🔁';
    if (c.includes('Nested')) return '🔀';
    if (c.includes('Decision') || c.includes('If/Else')) return '↕️';
    if (c.includes('Counter') || c.includes('Turn')) return '🔢';
    if (c.includes('Ailment')) return '💀';
    if (c.includes('Class Skills')) return '✨';
    if (c.includes('Mastery') || c.includes('Final') || c.includes('Sub-Boss')) return '👑';
    if (c.includes('Survival')) return '🌊';
    if (c.includes('Full Algorithm')) return '🧠';
    if (c.includes('Dodge')) return '💨';
    return '📋';
  })();
  const overlayIcon = isRealVictory ? '🏆' : isIncomplete ? '⚠️' : '💀';
  const overlayTitle = isRealVictory ? 'Victory!' : isIncomplete ? 'ยังไม่ผ่านด่าน!' : 'Defeated!';
  const overlayColor = isRealVictory ? '#fbbf24' : isIncomplete ? '#fb923c' : '#f87171';
  const overlayBorder = isRealVictory ? 'rgba(251,191,36,0.3)' : isIncomplete ? 'rgba(251,146,60,0.35)' : 'rgba(255,255,255,0.15)';

  return (
    <>
      <style>{ANIM_CSS}</style>
      {newAchievements.length > 0 && (
        <AchievementToast
          achievements={newAchievements}
          onDone={() => setNewAchievements([])}
        />
      )}
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: colors.bg, overflow: 'hidden' }}>

        {/* ===== BATTLE ARENA ===== */}
        <div className="battle-arena" style={{
          display: 'flex', flexDirection: 'column',
          borderBottom: `1px solid ${colors.borderSubtle}`,
          background: theme === 'dark'
            ? 'linear-gradient(to bottom, #0a0a20 0%, #0d0d1a 100%)'
            : 'linear-gradient(to bottom, #e8edf8 0%, #eef1f8 100%)',
          backgroundImage: `url(/backgrounds/${LEVEL_BG[level.id] ?? `${level.id}.jpg`})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center bottom',
          backgroundRepeat: 'no-repeat',
          padding: '10px 16px', gap: 6,
          position: 'relative',
          maxHeight: isMobile ? '42vh' : undefined,
        }}>
          {/* Dark overlay so text stays readable over background image */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'linear-gradient(180deg, rgba(14,11,26,0.72) 0%, rgba(14,11,26,0.38) 45%, rgba(14,11,26,0.78) 100%)',
          }} />

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, position: 'relative', zIndex: 1 }}>
            <button onClick={() => navigate('/levels')} style={{
              background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.15)',
              backdropFilter: 'blur(6px)',
              color: 'rgba(255,255,255,0.9)', padding: '5px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 13,
            }}>← Levels</button>

            {/* Center: wave badge (Endless) หรือ level name (Tutorial) */}
            {isEndless ? (
              <div style={{
                background: 'linear-gradient(135deg,rgba(124,58,237,0.85),rgba(239,68,68,0.85))',
                border: '1px solid rgba(255,255,255,0.25)', borderRadius: 10,
                padding: '4px 16px', textAlign: 'center',
                backdropFilter: 'blur(6px)',
                boxShadow: '0 2px 12px rgba(0,0,0,0.5)',
              }}>
                <p style={{ color: 'white', fontSize: 12, fontWeight: 800, margin: 0, textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}>WAVE {waveNumber}</p>
                <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 10, margin: 0 }}>Score: {endlessScore}</p>
              </div>
            ) : (
              <div style={{
                textAlign: 'center',
                background: 'rgba(0,0,0,0.45)', borderRadius: 8,
                padding: '3px 12px', backdropFilter: 'blur(6px)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}>
                <p style={{ color: '#fff', fontWeight: 700, fontSize: 14, margin: 0, textShadow: '0 1px 6px rgba(0,0,0,0.8)' }}>{level.name}</p>
                <p style={{ color: stat.color, fontSize: 12, margin: 0, textShadow: '0 1px 4px rgba(0,0,0,0.7)' }}>{stat.label}</p>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <VolumeButton />
              <BagButton compact onShopClick={() => { setShopFromBag(true); setShowShop(true); }} />
            </div>
          </div>

          {/* Level info bar — compact */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
            position: 'relative', zIndex: 1,
            background: 'rgba(0,0,0,0.55)', borderRadius: 8,
            padding: '4px 10px', backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}>
            <span style={{
              background: 'rgba(124,58,237,0.25)', border: '1px solid rgba(124,58,237,0.4)',
              color: '#c4b5fd', fontSize: 10, fontWeight: 800, padding: '1px 7px', borderRadius: 5, whiteSpace: 'nowrap',
            }}>LEVEL {level.number}</span>
            <span style={{ color: colors.textSub, fontSize: 10, fontWeight: 600, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {level.name}
            </span>
          </div>

          {/* Fighters — restructured: sprites on top, status bar below */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1, minHeight: 0 }}>

            {/* ── Row 1: Sprites + center controls ── */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'stretch', gap: 4, minHeight: 0 }}>

              {/* Hero sprite — clean, no HP overlay */}
              <div style={{ flex: 1, position: 'relative', minWidth: 0, overflow: 'hidden' }}>
                <div key={`hero-${heroAnimKey}`} style={{
                  position: 'absolute', inset: 0,
                  animation: heroAnim
                    ? `${heroAnim} 0.52s ease`
                    : heroHP < heroMaxHP * 0.3
                      ? 'heroLowHP 1.4s ease-in-out infinite'
                      : 'heroIdle 2.8s ease-in-out infinite',
                  filter: heroHP < heroMaxHP * 0.3 ? 'grayscale(0.4)' : undefined,
                  display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                }}>
                  <img src={`/characters/${heroChar.class}.png`} alt={heroChar.class}
                    style={{ height: '100%', width: '100%', objectFit: 'contain', objectPosition: 'bottom', imageRendering: 'pixelated' }} />
                </div>
                {/* Name + Level badge */}
                <div style={{ position: 'absolute', top: 4, left: 4, display: 'flex', alignItems: 'center', gap: 3, zIndex: 2 }}>
                  <span style={{ background: 'linear-gradient(135deg,#fbbf24,#f59e0b)', color: '#1c1917', fontSize: 9, fontWeight: 900, padding: '1px 5px', borderRadius: 4 }}>Lv.{heroChar.level}</span>
                  <span style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 4 }}>{heroChar.name}</span>
                </div>
                {/* Ailment badges — horizontal row top-right */}
                <div style={{ position: 'absolute', top: 4, right: 4, display: 'flex', flexDirection: 'row', gap: 2, flexWrap: 'wrap', justifyContent: 'flex-end', zIndex: 2 }}>
                  {heroBurnRounds > 0 && <span style={{ background: 'rgba(220,38,38,0.8)', color: '#fff', fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 4 }}>🔥{heroBurnRounds}</span>}
                  {heroFreezeRounds > 0 && <span style={{ background: 'rgba(37,99,235,0.8)', color: '#fff', fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 4 }}>❄️{heroFreezeRounds}</span>}
                  {heroPoisonRounds > 0 && <span style={{ background: 'rgba(124,58,237,0.8)', color: '#fff', fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 4 }}>🟣{heroPoisonRounds}</span>}
                  {heroBerserkRounds > 0 && <span style={{ background: 'rgba(220,38,38,0.8)', color: '#fff', fontSize: 8, fontWeight: 800, padding: '1px 5px', borderRadius: 4 }}>💢{heroBerserkRounds}</span>}
                  {comboCount >= 2 && <span style={{ background: 'rgba(161,98,7,0.85)', color: '#fef08a', fontSize: 8, fontWeight: 800, padding: '1px 5px', borderRadius: 4 }}>⚡x{comboCount + 1}</span>}
                </div>
              </div>

              {/* Center controls */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 'clamp(3px,0.5vh,6px)', flexShrink: 0, width: 'clamp(110px,14vw,180px)', alignSelf: 'stretch', zIndex: 2, borderRadius: 12, transition: 'box-shadow 0.3s', boxShadow: tutorialTarget === 'run-btn' ? '0 0 0 3px rgba(74,222,128,0.7), 0 0 20px rgba(74,222,128,0.4)' : undefined, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.08)', padding: 'clamp(6px,1.2vh,16px) clamp(4px,0.6vw,10px)', overflow: 'hidden' }}>
                <span style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 800, fontSize: 'clamp(11px,1.3vw,17px)', textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>VS</span>
                <div style={{ background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.4)', borderRadius: 7, padding: '2px 8px' }}>
                  <span style={{ color: '#c4b5fd', fontSize: 'clamp(10px,1.1vw,15px)', fontWeight: 800 }}>Turn {currentTurn}</span>
                </div>
                {flowNodes.some(n => n.data.isVirus) && (
                  <div style={{ background: 'rgba(150,0,30,0.85)', border: '1px solid rgba(220,0,80,0.6)', borderRadius: 5, padding: '2px 6px', fontSize: 'clamp(8px,0.9vw,12px)', fontWeight: 700, color: '#ff4070', textAlign: 'center' }}>☠️ VIRUS!</div>
                )}
                <div style={{ display: 'flex', gap: 4 }}>
                  <button
                    onClick={() => { battleStartTime.current = Date.now(); setBattlePhase('running'); executeBattle(SPEED_LEVELS[speedIdx].ms, (level.requiredBlocks ?? []) as any, turnManaMax); }}
                    disabled={isExecuting || status === 'victory' || status === 'defeat' || battlePhase !== 'planning'}
                    style={{
                      background: isExecuting ? 'rgba(74,222,128,0.15)' : 'linear-gradient(135deg,#16a34a,#15803d)',
                      border: 'none', color: 'white', padding: 'clamp(7px,0.8vh,11px) clamp(10px,1vw,16px)', borderRadius: 9,
                      cursor: (isExecuting || battlePhase !== 'planning') ? 'not-allowed' : 'pointer',
                      fontWeight: 700, fontSize: 'clamp(12px,1.3vw,17px)', opacity: status === 'victory' || status === 'defeat' ? 0.4 : 1,
                      boxShadow: isExecuting ? 'none' : '0 4px 12px rgba(22,163,74,0.4)', minWidth: 'clamp(56px,6vw,80px)',
                    }}>
                    <span style={{ display: 'block' }}>{isExecuting ? '⏳' : battlePhase === 'enemy_turn' ? '👹...' : battlePhase === 'resolution' ? '⚙️...' : '▶ Run'}</span>
                  {!isMobile && <span style={{ display: 'block', fontSize: 'clamp(6px,0.6vw,9px)', opacity: 0.55, fontWeight: 400, letterSpacing: 0.5 }}>Space</span>}
                  </button>
                  <button onClick={stopBattle} disabled={!isExecuting} style={{
                    background: isExecuting ? 'linear-gradient(135deg,#dc2626,#991b1b)' : colors.bgSurface,
                    border: isExecuting ? 'none' : `1px solid ${colors.border}`,
                    color: isExecuting ? colors.text : colors.textMuted,
                    padding: 'clamp(7px,0.8vh,11px) clamp(9px,0.9vw,14px)', borderRadius: 9, cursor: isExecuting ? 'pointer' : 'not-allowed',
                    fontWeight: 700, fontSize: 'clamp(12px,1.3vw,17px)', boxShadow: isExecuting ? '0 4px 12px rgba(220,38,38,0.4)' : 'none',
                    lineHeight: 1.2,
                  }}>
                    <span style={{ display: 'block' }}>⏹</span>
                    {!isMobile && <span style={{ display: 'block', fontSize: 'clamp(6px,0.6vw,9px)', opacity: 0.55, fontWeight: 400, letterSpacing: 0.5 }}>Esc</span>}
                  </button>
                </div>
                <div style={{ display: 'flex', gap: 2, alignItems: 'center', width: '100%', justifyContent: 'center', minWidth: 0 }}>
                  <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 'clamp(6px,0.7vw,10px)', flexShrink: 1, minWidth: 0, overflow: 'hidden' }}>ช้า</span>
                  {SPEED_LEVELS.map((s, i) => (
                    <button key={i} onClick={() => setSpeedIdx(i)} disabled={isExecuting} style={{
                      width: 'clamp(20px,2.2vw,30px)', height: 'clamp(16px,1.8vh,24px)', borderRadius: 3, border: 'none',
                      background: speedIdx === i ? 'linear-gradient(135deg,#e94560,#7c3aed)' : 'rgba(255,255,255,0.15)',
                      color: speedIdx === i ? '#fff' : 'rgba(255,255,255,0.75)',
                      fontSize: 'clamp(7px,0.8vw,11px)', fontWeight: 700, cursor: isExecuting ? 'not-allowed' : 'pointer', flexShrink: 0,
                    }}>{s.label}</button>
                  ))}
                  <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 'clamp(6px,0.7vw,10px)', flexShrink: 1, minWidth: 0, overflow: 'hidden' }}>เร็ว</span>
                </div>
                {validationError && <p style={{ color: '#f87171', fontSize: 'clamp(8px,0.9vw,12px)', maxWidth: '100%', textAlign: 'center', margin: 0 }}>{validationError}</p>}
              </div>

              {/* Enemy sprite — clean, no HP overlay */}
              <div style={{ flex: 1, position: 'relative', minWidth: 0, overflow: 'hidden' }}>
                <div key={`enemy-${enemyAnimKey}`} style={{
                  position: 'absolute', inset: 0,
                  animation: enemyAnim
                    ? `${enemyAnim} 0.52s ease`
                    : 'enemyIdle 3.2s ease-in-out infinite',
                  filter: isEnemyShielded && status === 'waiting'
                    ? 'grayscale(0.3) drop-shadow(0 0 12px rgba(99,102,241,0.8))'
                    : enemyHP < enemyMaxHP * 0.3 ? 'grayscale(0.5)' : undefined,
                  display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                }}>
                  <EnemySprite enemyId={level.enemy.id} levelId={levelId ?? ''} waveNumber={isEndless ? waveNumber : undefined} />
                </div>
                {/* Name + ENEMY badge */}
                <div style={{ position: 'absolute', top: 4, right: 4, display: 'flex', alignItems: 'center', gap: 3, zIndex: 2 }}>
                  <span style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 4 }}>{level.enemy.name}</span>
                  <span style={{ background: 'rgba(248,113,113,0.3)', border: '1px solid rgba(248,113,113,0.4)', color: '#f87171', fontSize: 9, fontWeight: 900, padding: '1px 5px', borderRadius: 4 }}>ENEMY</span>
                </div>
                {/* Ailment badges — horizontal row top-left */}
                <div style={{ position: 'absolute', top: 4, left: 4, display: 'flex', flexDirection: 'row', gap: 2, flexWrap: 'wrap', zIndex: 2 }}>
                  {isEnemyShielded && status === 'waiting' && (
                    <span style={{ background: 'rgba(99,102,241,0.9)', color: '#e0e7ff', fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 5 }}>🛡️</span>
                  )}
                  {enemyStunnedRounds > 0 && <span style={{ background: 'rgba(161,98,7,0.85)', color: '#fef08a', fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 4 }}>⚡{enemyStunnedRounds}</span>}
                  {enemyBurnRounds > 0 && <span style={{ background: 'rgba(220,38,38,0.8)', color: '#fff', fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 4 }}>🔥{enemyBurnRounds}</span>}
                  {enemyFreezeRounds > 0 && <span style={{ background: 'rgba(37,99,235,0.8)', color: '#fff', fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 4 }}>❄️{enemyFreezeRounds}</span>}
                  {enemyPoisonRounds > 0 && <span style={{ background: 'rgba(124,58,237,0.8)', color: '#fff', fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 4 }}>🟣{enemyPoisonRounds}</span>}
                </div>
              </div>
            </div>

            {/* ── Row 2: Status bar — HP bars, shield info, XP ── */}
            <div style={{ flexShrink: 0, display: 'flex', gap: 4, padding: '5px 6px 4px', background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)', borderTop: '1px solid rgba(255,255,255,0.1)', borderRadius: '0 0 8px 8px' }}>

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
                </div>
                <HPBar current={heroHP} max={heroMaxHP} color="#4ade80" />
                <span style={{ color: heroHP < heroMaxHP * 0.3 ? '#ef4444' : '#4ade80', fontSize: 9, fontWeight: 700 }}>{heroHP}/{heroMaxHP}</span>
                <XPBar pct={xpPct} />
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 7, margin: '1px 0 0' }}>
                  {heroChar.level >= MAX_LEVEL ? 'MAX' : `${xpLeft}xp→Lv.${heroChar.level + 1}`}
                </p>
              </div>

              {/* Spacer aligns with center controls */}
              <div style={{ width: 'clamp(110px,14vw,180px)', flexShrink: 0 }} />

              {/* Enemy status */}
              <div style={{ flex: 1, minWidth: 0 }}>
                {isEnemyShielded && status === 'waiting' && (
                  <div style={{
                    background: 'rgba(79,70,229,0.3)', border: '1px solid rgba(99,102,241,0.7)',
                    borderRadius: 5, padding: '2px 6px', marginBottom: 3,
                    display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap',
                  }}>
                    {!isMobile && <span style={{ color: '#a5b4fc', fontSize: 9, fontWeight: 700 }}>วาง</span>}
                    {missingRequiredTypes.map((req) => (
                      <span key={req} title={SHIELD_LABELS[req]} style={{
                        background: 'rgba(99,102,241,0.5)', border: '1px solid rgba(165,180,252,0.6)',
                        borderRadius: 3, padding: isMobile ? '2px 4px' : '1px 5px',
                        color: '#e0e7ff', fontSize: isMobile ? 14 : 10, fontWeight: 800,
                        display: 'inline-flex', alignItems: 'center', gap: isMobile ? 0 : 2,
                      }}>
                        {SHIELD_ICONS[req] ?? '?'}
                        {!isMobile && <span>{SHIELD_LABELS[req]}</span>}
                      </span>
                    ))}
                    {!isMobile && <span style={{ color: '#a5b4fc', fontSize: 9, fontWeight: 700 }}>เพื่อทะลุโล!</span>}
                  </div>
                )}
                {level?.enemy.behaviors && status !== 'victory' && status !== 'defeat' && (
                  <div style={{ marginBottom: 2 }}>
                    <span style={{ background: 'rgba(239,68,68,0.35)', color: '#fca5a5', fontSize: 8, fontWeight: 700, padding: '1px 5px', borderRadius: 3 }}>ท่าต่อไป: {enemyIntentionLabel}</span>
                  </div>
                )}
                <HPBar current={enemyHP} max={enemyMaxHP} color="#f87171" />
                <span style={{ color: enemyHP < enemyMaxHP * 0.3 ? '#ef4444' : '#f87171', fontSize: 9, fontWeight: 700, display: 'block', textAlign: 'right' }}>{enemyHP}/{enemyMaxHP}</span>
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

          {/* Battle log — hidden */}
          {false && (
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
          )}

          {/* Tutorial overlay */}
          {showTutorial && !isEndless && battlePhase === 'planning' && (
            <TutorialGuide levelId={levelId!} onClose={() => setShowTutorial(false)} onTargetChange={setTutorialTarget} />
          )}

        </div>

        {/* ===== FLOWCHART SECTION ===== */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', borderRadius: 12, transition: 'box-shadow 0.3s', boxShadow: tutorialTarget === 'canvas' ? '0 0 0 3px rgba(96,165,250,0.7), 0 0 24px rgba(96,165,250,0.35)' : undefined }}>

          {/* ===== FLOWCHART EDITOR ===== */}
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <FlowchartErrorBoundary key={level.id}>
                <FlowchartEditor key={level.id} allowedBlocks={(level as any).allowedBlocks} shieldRequiredTypes={missingRequiredTypes} turnManaMax={turnManaMax} turnManaUsed={turnManaUsed} characterClass={heroChar.class} characterLevel={heroChar.level} />
              </FlowchartErrorBoundary>
            </div>
            {/* Reset flowchart to Start + End only */}
            <div style={{ flexShrink: 0, padding: '6px 10px', borderTop: `1px solid ${colors.borderSubtle}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {/* Save/Load status indicator */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, minWidth: 0 }}>
                {loadedFromCloud && (
                  <span style={{ color: '#60a5fa', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span>☁️</span> โหลด flowchart จาก cloud แล้ว
                  </span>
                )}
                {!loadedFromCloud && saveStatus === 'saving' && (
                  <span style={{ color: colors.textMuted, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>↻</span> กำลังบันทึก...
                  </span>
                )}
                {!loadedFromCloud && saveStatus === 'saved' && (
                  <span style={{ color: '#4ade80', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span>☁️</span> บันทึกแล้ว ✓
                  </span>
                )}
              </div>
              <button
                onClick={() => {
                  setLevelUpData(null); setXpGained(0); setMissingBlocks([]);
                  progressSaved.current = false;
                  setCurrentTurn(1); setBattlePhase('planning'); setEnemyBehaviorIdx(0);
                  liveBattleStateRef.current = null;
                  clearToStartEnd();
                  restartBattle(getBoostedChar() as any, level.enemy as any, level.id); applyInitialHeroState(level);
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
              {/* Toggle tab — always visible */}
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

              {/* Content */}
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

        {/* ===== Endless Wave Clear Overlay ===== */}
        {isEndless && showWaveClear && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.78)',
            backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', zIndex: 50,
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #1a1a3e, #12122a)',
              border: '1px solid rgba(124,58,237,0.45)',
              borderRadius: 24, padding: '36px 48px', textAlign: 'center',
              boxShadow: '0 25px 60px rgba(0,0,0,0.6), 0 0 60px rgba(124,58,237,0.15)',
              animation: 'bounceIn 0.4s ease', minWidth: 320,
            }}>
              <div style={{ fontSize: 64, marginBottom: 8 }}>⚔️</div>
              <h2 style={{ fontSize: 28, fontWeight: 800, margin: '0 0 8px', color: '#c4b5fd' }}>
                Wave {waveNumber} Clear!
              </h2>
              <p style={{ color: '#a78bfa', margin: '0 0 4px', fontSize: 15 }}>
                +{waveNumber * Math.round((heroHP / heroMaxHP) * 100)} pts
              </p>
              <p style={{ color: 'rgba(255,255,255,0.5)', margin: '0 0 24px', fontSize: 13 }}>
                Total Score: {endlessScore}
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <button
                  onClick={() => navigate('/levels')}
                  style={{ padding: '12px 24px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontWeight: 600 }}>
                  ← หยุดเล่น
                </button>
                <button
                  onClick={() => {
                    setShowWaveClear(false);
                    progressSaved.current = false;
                    const nextWave = waveNumber + 1;
                    setWaveNumber(nextWave);
                    setCurrentTurn(1);
                    setEnemyBehaviorIdx(0);
                    setExtraManaDebuff(0);
                    liveBattleStateRef.current = null;
                    restartBattle(getBoostedChar() as any, getEndlessWaveEnemy(nextWave) as any, 'level_endless');
                  }}
                  style={{ padding: '12px 24px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', color: 'white', cursor: 'pointer', fontWeight: 700, fontSize: 15 }}>
                  Wave {waveNumber + 1} →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===== Endless Game Over Overlay ===== */}
        {isEndless && status === 'defeat' && heroHP <= 0 && (
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
                Survived Wave {waveNumber}
              </p>
              <p style={{ color: 'rgba(255,255,255,0.5)', margin: '0 0 24px', fontSize: 13 }}>
                Final Score: {endlessScore}
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <button
                  onClick={() => navigate('/levels')}
                  style={{ padding: '12px 24px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontWeight: 600 }}>
                  ← หน้าหลัก
                </button>
                <button
                  onClick={() => {
                    progressSaved.current = false;
                    setWaveNumber(1);
                    setEndlessScore(0);
                    setEndlessDmgDealt(0);
                    setEndlessDmgTaken(0);
                    setCurrentTurn(1);
                    setEnemyBehaviorIdx(0);
                    setExtraManaDebuff(0);
                    liveBattleStateRef.current = null;
                    restartBattle(getBoostedChar() as any, getEndlessWaveEnemy(1) as any, 'level_endless');
                  }}
                  style={{ padding: '12px 24px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#dc2626,#b91c1c)', color: 'white', cursor: 'pointer', fontWeight: 700, fontSize: 15 }}>
                  ▶ เล่นใหม่
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===== Result Overlay ===== */}
        {!isEndless && (status === 'victory' || status === 'defeat') && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.78)',
            backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', zIndex: 200,
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
                  <p style={{ color: colors.textSub, fontSize: 12, margin: '0 0 6px' }}>
                    ต้องใช้ block เหล่านี้ใน Flowchart:
                  </p>
                  {missingBlocks.map((b) => (
                    <div key={b} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ color: '#f87171', fontSize: 13 }}>✗</span>
                      <span style={{ color: '#fca5a5', fontSize: 12, fontWeight: 600 }}>{b} block</span>
                    </div>
                  ))}
                  <p style={{ color: colors.textMuted, fontSize: 11, margin: '8px 0 0' }}>
                    ความก้าวหน้าไม่ถูกบันทึก
                  </p>
                </div>
              )}

              {status === 'victory' && (
                <>
                  <div style={{ marginBottom: 12 }}>
                    {/* ── รางวัลหลัก ── */}
                    <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                      <p style={{ color: '#4ade80', margin: 0, fontSize: 15 }}>+{xpGained} XP</p>
                      {goldEarned > 0 && (
                        <p style={{ color: '#fbbf24', margin: 0, fontSize: 15 }}>+{goldEarned}💰</p>
                      )}
                    </div>
                    {/* ── Diminishing returns อธิบาย ── */}
                    {xpMultiplierPct < 100 && (
                      <div style={{
                        marginTop: 6, background: 'rgba(251,191,36,0.07)',
                        border: '1px solid rgba(251,191,36,0.2)',
                        borderRadius: 8, padding: '5px 10px', textAlign: 'center',
                      }}>
                        <p style={{ color: 'rgba(251,191,36,0.8)', fontSize: 10, margin: 0, fontWeight: 600 }}>
                          เล่นซ้ำวันนี้ → XP ×{xpMultiplierPct}% / Gold ×{Math.round((goldEarned / Math.max(1, (level.rewards as any).gold ?? 1)) * 100)}%
                        </p>
                        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 9, margin: '2px 0 0' }}>
                          รีเซ็ตรางวัลเที่ยงคืน (UTC+7) — เล่นด่านอื่นเพื่อ XP เต็ม
                        </p>
                      </div>
                    )}
                    {/* ── Bonus XP ── */}
                    {bonusXpGained > 0 && (
                      <p style={{ color: '#fbbf24', margin: '4px 0 0', fontSize: 11, textAlign: 'center', fontWeight: 700 }}>
                        ⭐ +{bonusXpGained} Bonus XP (Bonus Objective)
                      </p>
                    )}
                  </div>

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
                      <span style={{ color: colors.textSub, fontSize: 11 }}>Lv.{heroChar.level}</span>
                      <span style={{ color: colors.textSub, fontSize: 11 }}>
                        {heroChar.level < MAX_LEVEL ? `Lv.${heroChar.level + 1}` : 'MAX'}
                      </span>
                    </div>
                    <div style={{ width: '100%', height: 10, background: colors.border, borderRadius: 5, overflow: 'hidden' }}>
                      <div style={{
                        width: levelProgressPct(heroChar.level, heroChar.experience) + '%',
                        height: '100%', borderRadius: 5,
                        background: 'linear-gradient(90deg, #fbbf24, #f59e0b)',
                        transition: 'width 0.8s ease',
                        boxShadow: '0 0 8px rgba(251,191,36,0.6)',
                      }} />
                    </div>
                    <p style={{ color: colors.textMuted, fontSize: 10, marginTop: 4 }}>
                      {heroChar.experience} / {heroChar.level < MAX_LEVEL ? LEVEL_XP_TABLE[heroChar.level + 1] : '—'} XP
                    </p>
                  </div>
                </>
              )}

              {/* Learning Objective — แสดงเฉพาะ real victory */}
              {isRealVictory && level?.concept && (
                <div style={{
                  background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1))',
                  border: '1px solid rgba(139,92,246,0.4)',
                  borderRadius: 12, padding: '10px 16px', marginBottom: 12, textAlign: 'left',
                }}>
                  <p style={{ color: 'rgba(167,139,250,0.8)', fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 6px' }}>
                    คุณเพิ่งเรียนรู้
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 28, lineHeight: 1, flexShrink: 0 }}>{conceptIcon}</span>
                    <span style={{ color: '#c4b5fd', fontWeight: 700, fontSize: 13, lineHeight: 1.4 }}>
                      {level.concept}
                    </span>
                  </div>
                </div>
              )}

              {/* Objectives summary */}
              <div style={{ marginBottom: 16, textAlign: 'left' }}>
                <p style={{ color: colors.textSub, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>ภารกิจ</p>
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
                      <span style={{ color: bonusPassed ? '#fbbf24' : colors.textMuted, fontSize: 12, fontStyle: 'italic' }}>
                        โบนัส: {level.bonusObjective}
                      </span>
                    </div>
                  );
                })()}
              </div>

              {status === 'defeat' && (
                <p style={{ color: colors.textSub, fontSize: 13, margin: '0 0 16px' }}>
                  {heroHP <= 0 ? 'Hero ถูกสังหาร — ปรับ flowchart แล้วลองใหม่!' : 'Flowchart จบแต่ยังไม่สังหารศัตรู — เพิ่ม Loop หรือ Action เพิ่มเติม'}
                </p>
              )}

              {/* Save summary (victory only) */}
              {status === 'victory' && (
                <div style={{
                  background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.15)',
                  borderRadius: 10, padding: '8px 14px', marginBottom: 12, textAlign: 'left',
                }}>
                  <p style={{ color: colors.textSub, fontSize: 9, fontWeight: 800, textTransform: 'uppercase', margin: '0 0 5px' }}>บันทึกลง Firestore</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <span style={{ color: '#4ade80', fontSize: 11 }}>✓ ด่าน {level.number} — บันทึกเป็น "ผ่านแล้ว"</span>
                    <span style={{ color: '#4ade80', fontSize: 11 }}>
                      ✓ +{xpGained} XP{xpMultiplierPct < 100 ? ` (×${xpMultiplierPct}%)` : ''}{bonusXpGained > 0 ? ` +${bonusXpGained} Bonus` : ''} → ตัวละคร Lv.{heroChar.level}
                    </span>
                    {goldEarned > 0 && (
                      <span style={{ color: '#fbbf24', fontSize: 11 }}>
                        ✓ +{goldEarned}💰{xpMultiplierPct < 100 ? ` (×${Math.round(goldEarned / Math.max(1, (level.rewards as any).gold ?? 1) * 100)}%)` : ''} → คงเหลือ {shopGold}g
                      </span>
                    )}
                    <span style={{ color: '#4ade80', fontSize: 11 }}>✓ Leaderboard อัปเดตแล้ว</span>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 16, flexWrap: 'wrap' }}>
                <button
                  onClick={() => {
                    setLevelUpData(null); setXpGained(0); setBonusXpGained(0); setXpMultiplierPct(100); setMissingBlocks([]);
                    progressSaved.current = false;
                    setCurrentTurn(1); setBattlePhase('planning'); setEnemyBehaviorIdx(0);
                    liveBattleStateRef.current = null;
                    restartBattle(getBoostedChar() as any, level.enemy as any, level.id); applyInitialHeroState(level);
                  }}
                  style={{ padding: '12px 20px', borderRadius: 12, border: `1px solid ${colors.border}`, background: colors.bgSurfaceHover, color: colors.text, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
                  ↺ Retry
                </button>
                {isRealVictory && (
                  <button
                    onClick={() => { setShopFromBag(false); setShowShop(true); }}
                    style={{ padding: '12px 20px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#d97706,#b45309)', color: 'white', cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>
                    🏪 Shop {goldEarned > 0 ? `(+${goldEarned}💰)` : ''}
                  </button>
                )}
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
                  style={{ padding: '12px 20px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#e94560,#7c3aed)', color: 'white', cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>
                  {status === 'victory' ? 'Next Level →' : '← Levels'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ===== Shop Overlay ===== */}
      {showShop && (
        <ShopScreen
          goldEarned={shopFromBag ? 0 : goldEarned}
          characterClass={heroChar.class}
          characterLevel={heroChar.level}
          fromBag={shopFromBag}
          onRetry={() => {
            setShowShop(false);
            setShopFromBag(false);
            setGoldEarned(0);
            setLevelUpData(null);
            setXpGained(0); setBonusXpGained(0); setXpMultiplierPct(100);
            setMissingBlocks([]);
            progressSaved.current = false;
            setCurrentTurn(1); setBattlePhase('planning'); setEnemyBehaviorIdx(0);
            liveBattleStateRef.current = null;
            restartBattle(getBoostedChar() as any, level.enemy as any, level.id); applyInitialHeroState(level);
          }}
          onClose={() => {
            if (shopFromBag) {
              // กลับสู้รบต่อ — ไม่ navigate ไม่ reset
              setShowShop(false);
              setShopFromBag(false);
              return;
            }
            setShowShop(false);
            setGoldEarned(0);
            const currentIdx = LEVELS.findIndex(l => l.id === levelId);
            const nextLevel = LEVELS[currentIdx + 1];
            navigate(nextLevel ? `/battle/${nextLevel.id}` : '/levels');
          }}
        />
      )}
    </>
  );
}
