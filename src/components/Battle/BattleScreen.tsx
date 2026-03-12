import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LEVELS, ENDLESS_LEVEL, getEndlessWaveEnemy, PASSIVE_BONUSES } from '../../utils/constants';
import { useBattle } from '../../hooks/useBattle';
import { useBattleStore } from '../../stores/battleStore';
import { useGameStore } from '../../stores/gameStore';
import { useFlowchartStore } from '../../stores/flowchartStore';
import { useShopStore } from '../../stores/shopStore';
import ShopScreen from '../Shop/ShopScreen';
import { savePlayerProgress, saveCharacterProgress, saveLeaderboardEntry, saveLevelLeaderboardEntry, saveShopData } from '../../services/authService';
import type { LevelBattleStats } from '../../services/authService';
import { gainXP, levelProgressPct, xpToNextLevel, LEVEL_XP_TABLE, MAX_LEVEL } from '../../utils/levelSystem';
import FlowchartEditor from '../FlowchartEditor/FlowchartEditor';
import { previewFlowchart, calcFlowchartManaCost, calcTurnManaMax, executeEnemyAction, resolveHeroStatuses } from '../../engines/FlowchartEngine';
import type { BattleState, PreviewStep } from '../../engines/FlowchartEngine';
import { useTheme } from '../../contexts/ThemeContext';
import type { ThemeColors } from '../../contexts/ThemeContext';

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

// ===== Preview renderer (recursive — supports nested decisions/loops) =====
function renderPreviewSteps(steps: PreviewStep[], heroMaxHP: number, enemyMaxHP: number, colors: ThemeColors, depth = 0): React.ReactElement[] {
  return steps.map((step, i) => {
    const isAction = step.type === 'action';
    const isCond   = step.type === 'condition' || step.type === 'loop';
    const isEdge   = step.type === 'start' || step.type === 'end';

    const accentColor =
      isEdge                                  ? '#22c55e'
      : step.actionType === 'heal'            ? '#4ade80'
      : step.actionType === 'dodge'           ? '#94a3b8'
      : step.actionType === 'cast_spell'      ? '#c084fc'
      : step.actionType === 'power_strike'    ? '#7c3aed'
      : isAction                              ? '#3b82f6'
      : isCond                                ? '#d97706'
      : '#475569';

    const icon =
      isEdge && step.type === 'start'         ? '▶'
      : isEdge                                ? '⏹'
      : step.actionType === 'heal'            ? '💚'
      : step.actionType === 'dodge'           ? '🌀'
      : step.actionType === 'cast_spell'      ? '✨'
      : step.actionType === 'power_strike'    ? '💥'
      : isAction                              ? '⚔️'
      : step.type === 'loop'                  ? '◈'
      : '◇';

    const heroHPPct  = Math.max(0, (step.heroHPAfter  / heroMaxHP)  * 100);
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
  const heroDmg  = action.match(/hero -(\d+)/i)?.[1] ?? null;
  const healAmt  = action.match(/\+(\d+)/i)?.[1] ?? null;
  if (l.includes('attacks'))     return { heroAnim: 'heroAttack', enemyAnim: 'enemyHit', enemyDmg, heroDmg, healAmt: null };
  if (l.includes('heals'))       return { heroAnim: 'heroHeal',   enemyAnim: null,        enemyDmg: null, heroDmg: null, healAmt };
  if (l.includes('dodges'))      return { heroAnim: 'heroDodge',  enemyAnim: null,        enemyDmg: null, heroDmg: null, healAmt: null };
  if (l.includes('casts spell')) return { heroAnim: 'heroSpell',  enemyAnim: 'enemyHit',  enemyDmg, heroDmg: null, healAmt: null };
  if (l.includes('failed'))      return { heroAnim: null,          enemyAnim: 'enemyHit',  enemyDmg: null, heroDmg, healAmt: null };
  return { heroAnim: null, enemyAnim: null, enemyDmg: null, heroDmg: null, healAmt: null };
}

// ===== Tutorial hints per level =====
const TUTORIAL_HINTS: Record<string, string[]> = {
  // Level 1: Sequence
  level_1: [
    '1/3 — คลิก "Attack" ในแผง Blocks (ซ้ายมือ) เพื่อเพิ่ม block ลงใน canvas',
    '2/3 — ลากปลายลูกศรจาก Start ไปยัง Attack แล้วต่อ Attack → End',
    '3/3 — กด ▶ Play แล้วดูผลการต่อสู้! นี่คือ Sequence — ทำงานตามลำดับจากบนลงล่าง',
  ],
  // Level 2: Sequence (longer)
  level_2: [
    '1/3 — วาง Attack หลายตัวต่อกัน: Start → Attack → Attack → Attack → End',
    '2/3 — ยิ่งวาง Attack มาก ยิ่งโจมตีได้มากครั้งต่อรอบ',
    '3/3 — กด Step เพื่อดูทีละขั้นตอน แล้วสังเกตลำดับการทำงาน',
  ],
  // Level 3: While Loop
  level_3: [
    '1/4 — วาง "Enemy Alive?" (Condition) แล้วเชื่อม Start → Enemy Alive?',
    '2/4 — จาก YES → Attack → ลูกศรกลับไปที่ Enemy Alive? (สร้าง loop!)',
    '3/4 — จาก NO → End (ออกจาก loop เมื่อศัตรูตาย)',
    '4/4 — นี่คือ While Loop: "ทำซ้ำ ตราบที่ศัตรูยังมีชีวิต"',
  ],
  // Level 4: If/Else
  level_4: [
    '1/4 — สร้าง While Loop ก่อน: Enemy Alive? → YES: ... → กลับไป, NO: End',
    '2/4 — ใน YES branch วาง "HP < 50?" แล้วแยก 2 ทาง',
    '3/4 — YES (HP ต่ำ) → Heal, NO (HP ปกติ) → Attack',
    '4/4 — นี่คือ If/Else: ตัดสินใจ 2 ทางตามเงื่อนไข',
  ],
  // Level 5: Nested If
  level_5: [
    '1/4 — วาง While Loop (Enemy Alive?) ก่อน',
    '2/4 — ใน YES branch: วาง "HP < 30?" → YES: Dodge, NO: ต่อ',
    '3/4 — ต่อจาก NO: วาง "HP < 60?" → YES: Heal, NO: Attack',
    '4/4 — Nested If = Condition ซ้อนใน Condition — ตรวจหลายระดับ!',
  ],
  // Level 6: Counter Loop
  level_6: [
    '1/3 — วาง While Loop (Enemy Alive?) ก่อน',
    '2/3 — ใน YES branch: วาง "Turn ≥ 4?" → YES: Power Strike, NO: Attack',
    '3/3 — Turn ≥ N เหมือน for-loop counter — นับรอบ แล้วทำท่าพิเศษเมื่อถึง!',
  ],
  // Level 7: Resource Management
  level_7: [
    '1/3 — วาง While Loop (Enemy Alive?) ก่อน',
    '2/3 — ใน YES branch: วาง "MP > 25?" → YES: Cast Spell, NO: Attack',
    '3/3 — ตรวจ resource ก่อนใช้ — เหมือน if (mana >= cost) useSpell() ใน code!',
  ],
};

function TutorialOverlay({ levelId, onClose }: { levelId: string; onClose: () => void }) {
  const hints = TUTORIAL_HINTS[levelId];
  const [step, setStep] = useState(0);
  if (!hints) return null;
  return (
    <div style={{
      position: 'absolute', bottom: 8, left: 8, zIndex: 20,
      background: 'rgba(15,15,40,0.95)', border: '1px solid rgba(251,191,36,0.4)',
      borderRadius: 12, padding: '10px 14px', maxWidth: 260,
      boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ color: '#fbbf24', fontSize: 10, fontWeight: 800, letterSpacing: 1 }}>💡 TUTORIAL</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 12, padding: 0 }}>✕</button>
      </div>
      <p style={{ color: '#fde68a', fontSize: 11, margin: '0 0 8px', lineHeight: 1.5 }}>
        {hints[step]}
      </p>
      <div style={{ display: 'flex', gap: 6 }}>
        {step > 0 && (
          <button onClick={() => setStep(s => s - 1)} style={{
            flex: 1, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
            color: '#cbd5e1', fontSize: 10, padding: '4px 0', borderRadius: 6, cursor: 'pointer',
          }}>← ก่อนหน้า</button>
        )}
        {step < hints.length - 1 ? (
          <button onClick={() => setStep(s => s + 1)} style={{
            flex: 1, background: 'linear-gradient(135deg,#d97706,#b45309)',
            border: 'none', color: 'white', fontSize: 10, padding: '4px 0', borderRadius: 6, cursor: 'pointer', fontWeight: 700,
          }}>ถัดไป →</button>
        ) : (
          <button onClick={onClose} style={{
            flex: 1, background: 'linear-gradient(135deg,#16a34a,#15803d)',
            border: 'none', color: 'white', fontSize: 10, padding: '4px 0', borderRadius: 6, cursor: 'pointer', fontWeight: 700,
          }}>เข้าใจแล้ว ✓</button>
        )}
      </div>
      <div style={{ display: 'flex', gap: 3, justifyContent: 'center', marginTop: 6 }}>
        {hints.map((_, i) => (
          <div key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: i === step ? '#fbbf24' : 'rgba(255,255,255,0.2)' }} />
        ))}
      </div>
    </div>
  );
}

// ===== Main Component =====
export default function BattleScreen() {
  const { colors, theme } = useTheme();
  const { levelId } = useParams<{ levelId: string }>();
  const navigate = useNavigate();
  const { character, player, setPlayer, setCharacter } = useGameStore();
  const { status, heroHP, heroMaxHP, enemyHP, enemyMaxHP, battleLog, isExecuting, totalDamageTaken, heroBurnRounds, heroFreezeRounds, heroPoisonRounds, enemyStunnedRounds, enemyBurnRounds, enemyFreezeRounds, enemyPoisonRounds, heroBerserkRounds, healCharges, comboCount, startBattle, restartBattle, stopBattle, executeBattle } = useBattle();
  const { antidotes: shopAntidotes, potions: shopPotions, gold: shopGold, addGold, purchasedEquipment } = useShopStore();
  const { validationError, nodes: flowNodes, clearToStartEnd } = useFlowchartStore();
  const [speedIdx, setSpeedIdx] = useState(1);
  const progressSaved = useRef(false);
  const battleStartTime = useRef<number>(0);

  // Turn-based state
  const [currentTurn, setCurrentTurn] = useState(1);
  const [battlePhase, setBattlePhase] = useState<'planning' | 'running' | 'enemy_turn' | 'resolution'>('planning');
  const [enemyBehaviorIdx, setEnemyBehaviorIdx] = useState(0);
  // Phase 4: extra action-budget debuff carried over from virus effect
  const [extraManaDebuff, setExtraManaDebuff] = useState(0);

  // Action budget per turn
  const turnManaMax  = Math.max(1, calcTurnManaMax(currentTurn) - extraManaDebuff);
  const turnManaUsed = useMemo(() => calcFlowchartManaCost(flowNodes), [flowNodes]);

  // Live battle state ref for enemy turn
  const liveBattleStateRef = useRef<BattleState | null>(null);

  // Shop state
  const [showShop, setShowShop] = useState(false);
  const [goldEarned, setGoldEarned] = useState(0);

  // Endless Wave state
  const isEndless = levelId === 'level_endless';
  const [waveNumber, setWaveNumber] = useState(1);
  const [endlessScore, setEndlessScore] = useState(0);
  const [showWaveClear, setShowWaveClear] = useState(false);
  const [showTutorial, setShowTutorial] = useState(true);

  const level = (isEndless
    ? { ...ENDLESS_LEVEL, enemy: getEndlessWaveEnemy(waveNumber) }
    : LEVELS.find((l) => l.id === levelId)) as (typeof LEVELS)[0] | undefined;

  // Enemy intention (needs level to be defined first)
  const enemyIntention = level?.enemy.behaviors?.[enemyBehaviorIdx % (level?.enemy.behaviors?.length ?? 1)] ?? 'attack';
  const intentionLabel: Record<string, string> = {
    attack: '🗡️ โจมตี',
    heal: '💚 ฟื้นฟู',
    cast_spell: '✨ ใช้สเปล',
  };
  const enemyIntentionLabel = intentionLabel[enemyIntention] ?? '👁️ เฝ้าดู';

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
  const [showSimPreview, setShowSimPreview] = useState(true);

  // Shield: enemy shielded when required blocks are missing
  const isEnemyShielded = useMemo(() => {
    if (!level?.requiredBlocks?.length) return false;
    return level.requiredBlocks.some((req) => {
      if (req === 'condition')    return !flowNodes.some((n) => n.type === 'condition');
      if (req === 'heal')         return !flowNodes.some((n) => n.type === 'action' && n.data.actionType === 'heal');
      if (req === 'dodge')        return !flowNodes.some((n) => n.type === 'action' && n.data.actionType === 'dodge');
      if (req === 'cast_spell')   return !flowNodes.some((n) => n.type === 'action' && n.data.actionType === 'cast_spell');
      if (req === 'power_strike') return !flowNodes.some((n) => n.type === 'action' && n.data.actionType === 'power_strike');
      return false;
    });
  }, [level, flowNodes]);

  const shieldMissing = useMemo(() => {
    if (!level?.requiredBlocks?.length) return '';
    const labels: Record<string, string> = { condition: 'Condition', heal: 'Heal', dodge: 'Dodge', cast_spell: 'Cast Spell', power_strike: 'Power Strike' };
    const first = level.requiredBlocks.find((req) => {
      if (req === 'condition')    return !flowNodes.some((n) => n.type === 'condition');
      if (req === 'heal')         return !flowNodes.some((n) => n.type === 'action' && n.data.actionType === 'heal');
      if (req === 'dodge')        return !flowNodes.some((n) => n.type === 'action' && n.data.actionType === 'dodge');
      if (req === 'cast_spell')   return !flowNodes.some((n) => n.type === 'action' && n.data.actionType === 'cast_spell');
      if (req === 'power_strike') return !flowNodes.some((n) => n.type === 'action' && n.data.actionType === 'power_strike');
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
    enemyAttack:      level?.enemy.stats.attack  ?? 8,
    enemyBaseAttack:  level?.enemy.stats.attack  ?? 8,
    enemyDefense:     level?.enemy.stats.defense ?? 3,
    enemyArmor:       (level?.enemy.stats as any)?.armor ?? 0,
    enemyParry:       (level?.enemy.stats as any)?.parry ?? 0,
    enemyShielded:    isEnemyShielded,
    shieldReason:     shieldMissing,
    enemyEnraged:     false,
    enrageThreshold:  (level?.enemy.stats as any)?.enrageThreshold ?? 0,
    healCharges:      3,
    powerStrikeCooldown: 0,
    lastActionType:   '',
    comboCount:       0,
    heroBurnRounds:   0,
    heroFreezeRounds: 0,
    heroPoisonRounds: 0,
    enemyStunnedRounds: 0,
    enemyBurnRounds: 0,
    enemyFreezeRounds: 0,
    enemyPoisonRounds: 0,
    enemyAilmentType:   (level?.enemy.stats as any)?.ailmentType  ?? '',
    enemyAilmentChance: (level?.enemy.stats as any)?.ailmentChance ?? 0,
    antidotes: shopAntidotes,
    potions:   shopPotions,
    gold:      shopGold,
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
      atkBonus:   acc.atkBonus   + p.atkBonus,
      defBonus:   acc.defBonus   + p.defBonus,
      hpBonus:    acc.hpBonus    + p.hpBonus,
      speedBonus: acc.speedBonus + p.speedBonus,
    }), { atkBonus: 0, defBonus: 0, hpBonus: 0, speedBonus: 0 });
  })();

  const getBoostedChar = () => {
    const passives = PASSIVE_BONUSES.filter(p => p.class === heroChar.class && p.requiredLevel <= heroChar.level);
    const totalPassive = passives.reduce((acc, p) => ({
      atkBonus:   acc.atkBonus   + p.atkBonus,
      defBonus:   acc.defBonus   + p.defBonus,
      hpBonus:    acc.hpBonus    + p.hpBonus,
      speedBonus: acc.speedBonus + p.speedBonus,
    }), { atkBonus: 0, defBonus: 0, hpBonus: 0, speedBonus: 0 });

    return {
      ...heroChar,
      stats: {
        ...heroChar.stats,
        attack:    heroChar.stats.attack    + totalPassive.atkBonus,
        defense:   heroChar.stats.defense   + totalPassive.defBonus,
        maxHP:     heroChar.stats.maxHP     + totalPassive.hpBonus,
        currentHP: heroChar.stats.maxHP     + totalPassive.hpBonus,
        speed:     heroChar.stats.speed     + totalPassive.speedBonus,
      },
    };
  };

  // Init battle on level change
  useEffect(() => {
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

        const charStats  = useBattleStore.getState().battle?.character.stats;
        const enemyStats = useBattleStore.getState().battle?.enemy.stats;
        const store = useBattleStore.getState();

        // Phase 4: handle virusTurnWasted and manaDebuff from final engine state
        const virusTurnWasted = liveBattleStateRef.current?.virusTurnWasted ?? false;
        const manaDebuffVal   = liveBattleStateRef.current?.manaDebuff ?? 0;
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
          heroAttack:  (charStats?.attack ?? 10),
          heroDefense: charStats?.defense ?? 5,
          heroParry: 10,
          enemyAttack:  enragedAtk,
          enemyBaseAttack: baseEnemyAtk,
          enemyDefense: (enemyStats as any)?.defense ?? 3,
          enemyArmor:   (enemyStats as any)?.armor ?? 0,
          enemyParry:   (enemyStats as any)?.parry ?? 0,
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
          const { newState: extraState, log: extraLog } = executeEnemyAction(enemyIntention, stateSnap);
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
    if (isEndless && status === 'victory' && !progressSaved.current) {
      progressSaved.current = true;
      const score = waveNumber * Math.round((heroHP / heroMaxHP) * 100);
      setEndlessScore((prev) => prev + score);
      setShowWaveClear(true);
    }
  }, [isEndless, status]);

  // Save progress + award XP on battle end
  useEffect(() => {
    if ((status === 'victory' || status === 'defeat') && !progressSaved.current && player && level) {
      // Turn-based: 'defeat' while both still alive = hero flowchart ended this turn, NOT a final loss
      // Don't save progress yet — wait for the real final outcome (victory or hero HP = 0)
      if (status === 'defeat' && heroHP > 0 && enemyHP > 0) return;

      progressSaved.current = true;

      // Skip normal save logic for endless mode
      if (isEndless) return;

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
          if (req === 'condition')    return !flowNodes.some((n) => n.type === 'condition');
          if (req === 'heal')         return !flowNodes.some((n) => n.type === 'action' && n.data.actionType === 'heal');
          if (req === 'dodge')        return !flowNodes.some((n) => n.type === 'action' && n.data.actionType === 'dodge');
          if (req === 'cast_spell')   return !flowNodes.some((n) => n.type === 'action' && n.data.actionType === 'cast_spell');
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
        // Award gold
        const earnedGold = (level.rewards as any).gold ?? 0;
        if (earnedGold > 0) {
          setGoldEarned(earnedGold);
          addGold(earnedGold);
          const newGold = shopGold + earnedGold;
          saveShopData(player.id, newGold, purchasedEquipment).catch(() => {});
        }

        const xp = level.rewards.experience;
        setXpGained(xp);
        const { newCharacter, leveledUp, oldLevel, newLevel } = gainXP(heroChar, xp);
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
        }
        saveCharacterProgress(player.id, newCharacter).catch(() => {});
      }

      const battleStats: LevelBattleStats = {
        levelId:         level.id,
        levelNumber:     level.number,
        damageDealt:     Math.max(0, (level.enemy.stats.maxHP) - Math.max(0, enemyHP)),
        damageTaken:     totalDamageTaken,
        timeMs:          battleStartTime.current > 0 ? (Date.now() - battleStartTime.current) * (speedIdx + 1) : 0,
        heroHPRemaining: Math.max(0, heroHP),
        heroMaxHP:       heroMaxHP,
      };

      savePlayerProgress(player.id, level.id, won, player.username ?? undefined).then((updated) => {
        if (updated) {
          // merge username จาก store เพราะ Firestore อาจไม่มี field นี้
          const mergedPlayer = { ...updated, username: updated.username ?? player.username };
          setPlayer(mergedPlayer);
          if (won) {
            saveLeaderboardEntry(mergedPlayer, savedChar, battleStats).catch((e) => console.error('[Leaderboard] overall save error:', e));
            saveLevelLeaderboardEntry(mergedPlayer, savedChar, battleStats).catch((e) => console.error('[Leaderboard] level save error:', e));
          }
        }
      }).catch(() => {});
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
    if (s.heroHP <= 0)  { battleStore.setStatus('defeat');  setBattlePhase('planning'); return; }

    // Advance turn
    setCurrentTurn(t => t + 1);
    setBattlePhase('planning');
  }

  function handleEnemyTurn(stateAfterHero: BattleState) {
    setBattlePhase('enemy_turn');
    const speedMs = SPEED_LEVELS[speedIdx].ms;
    setTimeout(() => {
      const { newState, log } = executeEnemyAction(enemyIntention, stateAfterHero);
      battleStore.addLog({ round: currentTurn, action: log, actor: 'enemy', timestamp: Date.now() });

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
      // Advance enemy behavior
      setEnemyBehaviorIdx(i => i + 1);
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
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: colors.bg, overflow: 'hidden' }}>

        {/* ===== BATTLE ARENA ===== */}
        <div className="battle-arena" style={{
          display: 'flex', flexDirection: 'column',
          borderBottom: `1px solid ${colors.borderSubtle}`,
          background: theme === 'dark'
            ? 'linear-gradient(to bottom, #0a0a20 0%, #0d0d1a 100%)'
            : 'linear-gradient(to bottom, #e8edf8 0%, #eef1f8 100%)',
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
              background: colors.bgSurface, border: 'none',
              color: colors.textSub, padding: '5px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 13,
            }}>← Levels</button>
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: colors.text, fontWeight: 700, fontSize: 14, margin: 0 }}>{level.name}</p>
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
            <span style={{ color: colors.textSub, fontSize: 11, fontWeight: 600, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
            <span style={{ color: colors.textSub, fontSize: 9, fontWeight: 800, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>ภารกิจ</span>
            {level.objectives.map((obj, i) => (
              <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ color: status === 'victory' ? '#4ade80' : colors.textMuted, fontSize: 11 }}>
                  {status === 'victory' ? '✅' : '⬜'}
                </span>
                <span style={{ color: status === 'victory' ? '#4ade80' : colors.textSub, fontSize: 10 }}>{obj}</span>
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
                <span style={{ color: colors.text, fontWeight: 700, fontSize: 12 }}>{heroChar.name}</span>
              </div>

              {/* Passive bonus indicator */}
              {(passiveBonusSummary.atkBonus > 0 || passiveBonusSummary.defBonus > 0 || passiveBonusSummary.hpBonus > 0 || passiveBonusSummary.speedBonus > 0) && (
                <div style={{
                  display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 2, marginBottom: 3,
                }}>
                  <span style={{
                    background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.4)',
                    color: '#c084fc', fontSize: 8, fontWeight: 700, padding: '1px 5px', borderRadius: 4,
                  }}>
                    Passive: {[
                      passiveBonusSummary.atkBonus > 0 && `ATK+${passiveBonusSummary.atkBonus}`,
                      passiveBonusSummary.defBonus > 0 && `DEF+${passiveBonusSummary.defBonus}`,
                      passiveBonusSummary.hpBonus > 0 && `HP+${passiveBonusSummary.hpBonus}`,
                      passiveBonusSummary.speedBonus > 0 && `SPD+${passiveBonusSummary.speedBonus}`,
                    ].filter(Boolean).join(' ')}
                  </span>
                </div>
              )}

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

              {/* Heal charges + Combo + Berserk */}
              <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginTop: 3, flexWrap: 'wrap' }}>
                <span style={{
                  background: healCharges > 0 ? 'rgba(74,222,128,0.15)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${healCharges > 0 ? 'rgba(74,222,128,0.4)' : 'rgba(255,255,255,0.1)'}`,
                  color: healCharges > 0 ? '#4ade80' : 'rgba(255,255,255,0.3)',
                  fontSize: 8, fontWeight: 700, padding: '1px 5px', borderRadius: 4,
                }}>💊 {healCharges}/3</span>
                {comboCount >= 2 && (
                  <span style={{
                    background: 'rgba(251,191,36,0.2)', border: '1px solid rgba(251,191,36,0.5)',
                    color: '#fbbf24', fontSize: 8, fontWeight: 800, padding: '1px 5px', borderRadius: 4,
                  }}>⚡ Combo x{comboCount + 1}</span>
                )}
                {heroBerserkRounds > 0 && (
                  <span title={`Berserk: ${heroBerserkRounds} turns`} style={{
                    background: 'rgba(220,38,38,0.25)', border: '1px solid rgba(220,38,38,0.6)',
                    color: '#fca5a5', fontSize: 8, fontWeight: 800, padding: '1px 5px', borderRadius: 4,
                  }}>💢 Berserk {heroBerserkRounds}</span>
                )}
              </div>

              {/* Ailment badges */}
              {(heroBurnRounds > 0 || heroFreezeRounds > 0 || heroPoisonRounds > 0) && (
                <div style={{ display: 'flex', gap: 3, justifyContent: 'center', marginTop: 3 }}>
                  {heroBurnRounds > 0 && (
                    <span title={`Burn: ${heroBurnRounds} turns`} style={{
                      background: 'rgba(220,38,38,0.25)', border: '1px solid rgba(220,38,38,0.5)',
                      color: '#fca5a5', fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 4,
                    }}>🔥{heroBurnRounds}</span>
                  )}
                  {heroFreezeRounds > 0 && (
                    <span title={`Freeze: ${heroFreezeRounds} turns`} style={{
                      background: 'rgba(37,99,235,0.25)', border: '1px solid rgba(37,99,235,0.5)',
                      color: '#93c5fd', fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 4,
                    }}>❄️{heroFreezeRounds}</span>
                  )}
                  {heroPoisonRounds > 0 && (
                    <span title={`Poison: ${heroPoisonRounds} turns`} style={{
                      background: 'rgba(124,58,237,0.25)', border: '1px solid rgba(124,58,237,0.5)',
                      color: '#c4b5fd', fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 4,
                    }}>🟣{heroPoisonRounds}</span>
                  )}
                </div>
              )}

              {/* XP bar */}
              <XPBar pct={xpPct} />
              <p style={{ color: colors.textMuted, fontSize: 9, marginTop: 2 }}>
                {heroChar.level >= MAX_LEVEL ? 'MAX LEVEL' : `${xpLeft} XP → Lv.${heroChar.level + 1}`}
              </p>
            </div>

            {/* Center controls */}
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
              <span style={{ color: colors.textSub, fontWeight: 800, fontSize: 12 }}>VS</span>

              {/* Turn counter */}
              <div style={{
                background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.4)',
                borderRadius: 8, padding: '2px 10px', textAlign: 'center',
              }}>
                <span style={{ color: '#c4b5fd', fontSize: 11, fontWeight: 800 }}>Turn {currentTurn}</span>
              </div>

              {/* Phase 4: Virus warning banner */}
              {flowNodes.some((n) => n.data.isVirus) && (
                <div style={{
                  background: 'rgba(150,0,30,0.8)', border: '1px solid rgba(220,0,80,0.6)',
                  borderRadius: 8, padding: '4px 12px', fontSize: 11, fontWeight: 700,
                  color: '#ff4070', textAlign: 'center',
                }}>
                  ☠️ VIRUS DETECTED in flowchart! Place Debug Block to remove.
                </div>
              )}

              {/* Play / Stop */}
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={() => {
                    battleStartTime.current = Date.now();
                    setBattlePhase('running');
                    executeBattle(SPEED_LEVELS[speedIdx].ms, (level.requiredBlocks ?? []) as any, turnManaMax);
                  }}
                  disabled={isExecuting || status === 'victory' || status === 'defeat' || battlePhase !== 'planning'}
                  style={{
                    background: isExecuting ? 'rgba(74,222,128,0.15)' : 'linear-gradient(135deg, #16a34a, #15803d)',
                    border: 'none',
                    color: 'white', padding: '9px 16px', borderRadius: 10,
                    cursor: (isExecuting || battlePhase !== 'planning') ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: 14,
                    opacity: status === 'victory' || status === 'defeat' ? 0.4 : 1,
                    boxShadow: isExecuting ? 'none' : '0 4px 15px rgba(22,163,74,0.4)',
                    minWidth: 76,
                  }}>
                  {isExecuting ? '⏳' : battlePhase === 'enemy_turn' ? '👹 Enemy...' : battlePhase === 'resolution' ? '⚙️...' : '▶ Execute Turn'}
                </button>
                <button
                  onClick={stopBattle}
                  disabled={!isExecuting}
                  style={{
                    background: isExecuting ? 'linear-gradient(135deg, #dc2626, #991b1b)' : colors.bgSurface,
                    border: isExecuting ? 'none' : `1px solid ${colors.border}`,
                    color: isExecuting ? colors.text : colors.textMuted,
                    padding: '9px 12px', borderRadius: 10,
                    cursor: isExecuting ? 'pointer' : 'not-allowed', fontWeight: 700, fontSize: 14,
                    boxShadow: isExecuting ? '0 4px 15px rgba(220,38,38,0.4)' : 'none',
                    transition: 'all 0.15s',
                  }}>⏹</button>
              </div>

              {/* Speed control */}
              <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                <span style={{ color: colors.textMuted, fontSize: 9 }}>ช้า</span>
                {SPEED_LEVELS.map((s, i) => (
                  <button key={i} onClick={() => setSpeedIdx(i)} disabled={isExecuting} style={{
                    width: 24, height: 20, borderRadius: 4, border: 'none',
                    background: speedIdx === i ? 'linear-gradient(135deg, #e94560, #7c3aed)' : colors.bgSurfaceHover,
                    color: speedIdx === i ? colors.text : colors.textSub,
                    fontSize: 9, fontWeight: 700, cursor: isExecuting ? 'not-allowed' : 'pointer', transition: 'all 0.15s',
                  }}>{s.label}</button>
                ))}
                <span style={{ color: colors.textMuted, fontSize: 9 }}>เร็ว</span>
              </div>

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
                <span style={{ color: colors.text, fontWeight: 700, fontSize: 12 }}>{level.enemy.name}</span>
              </div>

              {/* Shield indicator — above icon */}
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
              {(enemyStunnedRounds > 0 || enemyBurnRounds > 0 || enemyFreezeRounds > 0 || enemyPoisonRounds > 0) && (
                <div style={{ display: 'flex', gap: 3, justifyContent: 'center', marginTop: 3, flexWrap: 'wrap' }}>
                  {enemyStunnedRounds > 0 && (
                    <span title={`Stunned: ${enemyStunnedRounds} turns`} style={{
                      background: 'rgba(251,191,36,0.2)', border: '1px solid rgba(251,191,36,0.5)',
                      color: '#fbbf24', fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 4,
                    }}>⚡ {enemyStunnedRounds}</span>
                  )}
                  {enemyBurnRounds > 0 && (
                    <span title={`Enemy Burn: ${enemyBurnRounds} turns`} style={{
                      background: 'rgba(220,38,38,0.25)', border: '1px solid rgba(220,38,38,0.5)',
                      color: '#fca5a5', fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 4,
                    }}>🔥 {enemyBurnRounds}</span>
                  )}
                  {enemyFreezeRounds > 0 && (
                    <span title={`Enemy Freeze: ${enemyFreezeRounds} turns`} style={{
                      background: 'rgba(37,99,235,0.25)', border: '1px solid rgba(37,99,235,0.5)',
                      color: '#93c5fd', fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 4,
                    }}>❄️ {enemyFreezeRounds}</span>
                  )}
                  {enemyPoisonRounds > 0 && (
                    <span title={`Enemy Poison: ${enemyPoisonRounds} turns`} style={{
                      background: 'rgba(124,58,237,0.25)', border: '1px solid rgba(124,58,237,0.5)',
                      color: '#c4b5fd', fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 4,
                    }}>🟣 {enemyPoisonRounds}</span>
                  )}
                </div>
              )}

              {/* Enemy intention — below HP and status effects */}
              {level?.enemy.behaviors && status !== 'victory' && status !== 'defeat' && (
                <div style={{
                  background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                  borderRadius: 8, padding: '3px 8px', marginTop: 4, display: 'inline-block',
                }}>
                  <span style={{ color: '#fca5a5', fontSize: 9, fontWeight: 700 }}>ท่าต่อไป: {enemyIntentionLabel}</span>
                </div>
              )}
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

          {/* Tutorial overlay for levels 1–5 */}
          {showTutorial && TUTORIAL_HINTS[levelId ?? ''] && status === 'waiting' && (
            <TutorialOverlay levelId={levelId!} onClose={() => setShowTutorial(false)} />
          )}

          {/* Endless wave badge */}
          {isEndless && (
            <div style={{
              position: 'absolute', top: 8, right: 12, zIndex: 10,
              background: 'linear-gradient(135deg,rgba(124,58,237,0.8),rgba(239,68,68,0.8))',
              border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10,
              padding: '4px 12px', textAlign: 'center',
            }}>
              <p style={{ color: 'white', fontSize: 11, fontWeight: 800, margin: 0 }}>WAVE {waveNumber}</p>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 9, margin: 0 }}>Score: {endlessScore}</p>
            </div>
          )}
        </div>

        {/* ===== FLOWCHART SECTION ===== */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

          {/* ===== FLOWCHART EDITOR ===== */}
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <FlowchartEditor key={level.id} allowedBlocks={(level as any).allowedBlocks} turnManaMax={turnManaMax} turnManaUsed={turnManaUsed} characterClass={heroChar.class} characterLevel={heroChar.level} />
            </div>
            {/* Reset flowchart to Start + End only */}
            <div style={{ flexShrink: 0, padding: '6px 10px', borderTop: `1px solid ${colors.borderSubtle}`, display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setLevelUpData(null); setXpGained(0); setMissingBlocks([]);
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
        {isEndless && status === 'defeat' && (
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
                  <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 12 }}>
                    <p style={{ color: '#4ade80', margin: 0, fontSize: 15 }}>+{xpGained} XP</p>
                    {goldEarned > 0 && (
                      <p style={{ color: '#fbbf24', margin: 0, fontSize: 15 }}>+{goldEarned}💰</p>
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
                    <span style={{ color: '#4ade80', fontSize: 11 }}>✓ +{level.rewards.experience} XP → ตัวละคร Lv.{heroChar.level}</span>
                    <span style={{ color: '#4ade80', fontSize: 11 }}>✓ Leaderboard อัปเดตแล้ว</span>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 16, flexWrap: 'wrap' }}>
                <button
                  onClick={() => {
                    setLevelUpData(null); setXpGained(0); setMissingBlocks([]);
                    progressSaved.current = false;
                    setCurrentTurn(1); setBattlePhase('planning'); setEnemyBehaviorIdx(0);
                    liveBattleStateRef.current = null;
                    restartBattle(getBoostedChar() as any, level.enemy as any, level.id);
                  }}
                  style={{ padding: '12px 20px', borderRadius: 12, border: `1px solid ${colors.border}`, background: colors.bgSurfaceHover, color: colors.text, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
                  ↺ Retry
                </button>
                {isRealVictory && (
                  <button
                    onClick={() => setShowShop(true)}
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
          goldEarned={goldEarned}
          characterClass={heroChar.class}
          characterLevel={heroChar.level}
          onRetry={() => {
            setShowShop(false);
            setGoldEarned(0);
            setLevelUpData(null);
            setXpGained(0);
            setMissingBlocks([]);
            progressSaved.current = false;
            setCurrentTurn(1); setBattlePhase('planning'); setEnemyBehaviorIdx(0);
            liveBattleStateRef.current = null;
            restartBattle(getBoostedChar() as any, level.enemy as any, level.id);
          }}
          onClose={() => {
            setShowShop(false);
            setGoldEarned(0);
            // Navigate to next level after shop
            const currentIdx = LEVELS.findIndex(l => l.id === levelId);
            const nextLevel = LEVELS[currentIdx + 1];
            navigate(nextLevel ? `/battle/${nextLevel.id}` : '/levels');
          }}
        />
      )}
    </>
  );
}
