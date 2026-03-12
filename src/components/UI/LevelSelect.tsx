import { useNavigate } from 'react-router-dom';
import { LEVELS, ENDLESS_LEVEL } from '../../utils/constants';
import { useGameStore } from '../../stores/gameStore';
import { useShopStore } from '../../stores/shopStore';
import { levelProgressPct, MAX_LEVEL } from '../../utils/levelSystem';
import { useTheme } from '../../contexts/ThemeContext';

// ── Icons ──────────────────────────────────────────────────────────────────
const ENEMY_ICONS: Record<string, string> = {
  slime: '🟢', goblin: '👺', goblin_knight: '👺', kobold: '🦎',
  orc: '👹', orc_warlord: '👹', ghost: '👻', troll: '🪨',
  spider: '🕷️', ice_giant: '🧊', dragon: '🐉',
  lich: '💀', overlord: '👑', boss: '💀',
};

const BLOCK_ICONS: Record<string, string> = {
  attack: '⚔️', heal: '💚', dodge: '🌀', cast_spell: '✨',
  power_strike: '💥', berserk: '💢', condition: '🔷',
};

// คำอ่านง่ายสำหรับ required block
const BLOCK_LABELS: Record<string, string> = {
  attack: 'Attack', heal: 'Heal', dodge: 'Dodge',
  cast_spell: 'Cast Spell', power_strike: 'Power Strike',
  condition: 'Condition',
};

// สีและไอคอนตาม concept phase
const CONCEPT_META: Record<number, { color: string; bg: string; tag: string }> = {
  1: { color: '#60a5fa', bg: 'rgba(96,165,250,0.12)', tag: 'SEQUENCE' },
  2: { color: '#60a5fa', bg: 'rgba(96,165,250,0.12)', tag: 'SEQUENCE' },
  3: { color: '#4ade80', bg: 'rgba(74,222,128,0.12)', tag: 'LOOP' },
  4: { color: '#34d399', bg: 'rgba(52,211,153,0.12)', tag: 'IF/ELSE' },
  5: { color: '#2dd4bf', bg: 'rgba(45,212,191,0.12)', tag: 'NESTED IF' },
  6: { color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', tag: 'COUNTER' },
  7: { color: '#c084fc', bg: 'rgba(192,132,252,0.12)', tag: 'RESOURCE' },
  8: { color: '#f472b6', bg: 'rgba(244,114,182,0.12)', tag: 'SKILL SELECT' },
  9: { color: '#fb923c', bg: 'rgba(251,146,60,0.12)', tag: 'STATE' },
  10: { color: '#f87171', bg: 'rgba(248,113,113,0.12)', tag: 'HP THRESHOLD' },
  11: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)', tag: 'DECISION TREE' },
  12: { color: '#dc2626', bg: 'rgba(220,38,38,0.12)', tag: 'COUNTER+RESOURCE' },
  13: { color: '#b91c1c', bg: 'rgba(185,28,28,0.12)', tag: 'ALGORITHM' },
  14: { color: '#991b1b', bg: 'rgba(153,27,27,0.12)', tag: 'OPTIMIZE' },
  15: { color: '#e94560', bg: 'rgba(233,69,96,0.12)', tag: 'MASTER' },
};

function DifficultyStars({ n }: { n: number }) {
  return (
    <span>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} style={{ color: i < n ? '#f59e0b' : 'rgba(245,158,11,0.2)', fontSize: 11 }}>★</span>
      ))}
    </span>
  );
}

export default function LevelSelect() {
  const navigate = useNavigate();
  const { player, character } = useGameStore();
  const { colors } = useTheme();
  const shopStore = useShopStore();
  const completed = player?.levelsCompleted ?? [];

  function isUnlocked(_levelId: string, idx: number) {
    if (idx === 0) return true;
    // ด่านที่เคยผ่านแล้ว — เล่นซ้ำได้เสมอ
    if (completed.includes(LEVELS[idx].id)) return true;
    // ด่านใหม่ — ปลดล็อกเมื่อผ่านด่านก่อนหน้า
    return completed.includes(LEVELS[idx - 1].id);
  }

  return (
    <div className="page-outer">
      <div className="page-container">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          <button onClick={() => navigate('/')} style={{
            background: colors.bgSurface, border: `1px solid ${colors.borderSubtle}`,
            color: colors.text, width: 40, height: 40, borderRadius: 10, cursor: 'pointer', fontSize: 18,
          }}>←</button>
          <div style={{ flex: 1 }}>
            <h1 style={{ color: colors.text, fontWeight: 800, fontSize: 26, margin: 0 }}>เลือกด่าน</h1>
            <p style={{ color: colors.textMuted, fontSize: 13, margin: 0 }}>
              ผ่านแล้ว {completed.length}/{LEVELS.length} ด่าน — แต่ละด่านสอน 1 concept ของ Flowchart
            </p>
          </div>

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

        {/* ── Concept Legend ──────────────────────────────────────────────── */}
        <div style={{
          background: colors.bgSurface, border: `1px solid ${colors.borderSubtle}`,
          borderRadius: 12, padding: '10px 16px', marginBottom: 16,
          display: 'flex', flexWrap: 'wrap', gap: '6px 18px', alignItems: 'center',
        }}>
          <span style={{ color: colors.textMuted, fontSize: 11, fontWeight: 700 }}>Flowchart Concepts:</span>
          {[
            { tag: 'SEQUENCE', color: '#60a5fa', levels: '1-2' },
            { tag: 'LOOP', color: '#4ade80', levels: '3' },
            { tag: 'IF/ELSE', color: '#34d399', levels: '4' },
            { tag: 'NESTED IF', color: '#2dd4bf', levels: '5' },
            { tag: 'COUNTER', color: '#a78bfa', levels: '6' },
            { tag: 'RESOURCE', color: '#c084fc', levels: '7' },
            { tag: 'SKILL SELECT', color: '#f472b6', levels: '8' },
            { tag: 'STATE', color: '#fb923c', levels: '9' },
            { tag: 'HP THRESHOLD', color: '#f87171', levels: '10' },
            { tag: 'COMPLEX', color: '#ef4444', levels: '11-15' },
          ].map(({ tag, color, levels }) => (
            <span key={tag} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
              <span style={{ color: colors.textMuted, fontSize: 10 }}>{tag}</span>
              <span style={{ color: colors.textMuted, fontSize: 9, opacity: 0.6 }}>({levels})</span>
            </span>
          ))}
        </div>

        <div className="level-grid">

          {/* ── Endless Mode Card ──────────────────────────────────────────── */}
          <div
            onClick={() => navigate('/battle/' + ENDLESS_LEVEL.id)}
            style={{
              background: 'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(239,68,68,0.08))',
              border: '1px solid rgba(124,58,237,0.4)',
              borderRadius: 16, padding: '18px 22px',
              cursor: 'pointer', transition: 'all 0.2s', position: 'relative', overflow: 'hidden',
              gridColumn: '1 / -1',
            }}
            onMouseEnter={(e) => {
              const d = e.currentTarget as HTMLDivElement;
              d.style.background = 'linear-gradient(135deg, rgba(124,58,237,0.22), rgba(239,68,68,0.14))';
              d.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              const d = e.currentTarget as HTMLDivElement;
              d.style.background = 'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(239,68,68,0.08))';
              d.style.transform = 'none';
            }}
          >
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: 'linear-gradient(180deg,#7c3aed,#e94560)', borderRadius: '16px 0 0 16px' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
              <div style={{ fontSize: 38, width: 48, textAlign: 'center' }}>∞</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ background: 'rgba(124,58,237,0.25)', color: '#c4b5fd', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6, border: '1px solid rgba(124,58,237,0.5)' }}>
                    ENDLESS MODE
                  </span>
                  <DifficultyStars n={5} />
                </div>
                <h3 style={{ color: colors.text, fontWeight: 700, fontSize: 16, margin: '0 0 3px' }}>{ENDLESS_LEVEL.name}</h3>
                <p style={{ color: colors.textSub, fontSize: 12, margin: 0 }}>{ENDLESS_LEVEL.description}</p>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <p style={{ color: '#c4b5fd', fontSize: 12, fontWeight: 600, margin: '0 0 2px' }}>Wave × Score</p>
                <p style={{ color: '#4ade80', fontSize: 11, margin: 0 }}>ไม่จำกัด</p>
              </div>
            </div>
          </div>

          {/* ── Level Cards ────────────────────────────────────────────────── */}
          {LEVELS.map((level, i) => {
            const done = completed.includes(level.id);
            const unlocked = isUnlocked(level.id, i);
            const meta = CONCEPT_META[level.number] ?? { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', tag: '' };
            const requiredBlocks: string[] = (level as any).requiredBlocks ?? [];
            const allowedBlocks: string[] = (level as any).allowedBlocks ?? [];

            return (
              <div key={level.id}
                onClick={() => unlocked && navigate('/battle/' + level.id)}
                style={{
                  background: done
                    ? 'rgba(74,222,128,0.05)'
                    : unlocked ? colors.bgSurface : colors.bgSurface,
                  border: done
                    ? '1px solid rgba(74,222,128,0.3)'
                    : unlocked ? `1px solid ${colors.borderSubtle}` : `1px solid ${colors.borderSubtle}`,
                  borderRadius: 16, padding: '18px 20px',
                  cursor: unlocked ? 'pointer' : 'not-allowed',
                  transition: 'all 0.18s', position: 'relative', overflow: 'hidden',
                  opacity: unlocked ? 1 : 0.4,
                }}
                onMouseEnter={(e) => {
                  if (!unlocked) return;
                  const d = e.currentTarget as HTMLDivElement;
                  d.style.background = done ? 'rgba(74,222,128,0.1)' : colors.bgSurfaceHover;
                  d.style.transform = 'translateY(-2px)';
                  d.style.boxShadow = `0 6px 24px ${meta.color}22`;
                }}
                onMouseLeave={(e) => {
                  const d = e.currentTarget as HTMLDivElement;
                  d.style.background = done ? 'rgba(74,222,128,0.05)' : colors.bgSurface;
                  d.style.transform = 'none';
                  d.style.boxShadow = 'none';
                }}
              >
                {/* ขีดสีด้านซ้ายตาม concept */}
                <div style={{
                  position: 'absolute', left: 0, top: 0, bottom: 0, width: 4,
                  background: done ? '#4ade80' : meta.color,
                  borderRadius: '16px 0 0 16px',
                }} />

                {/* ── Row 1: Badge + Enemy icon + Rewards ─────────────────── */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                  {/* Enemy icon */}
                  <div style={{ fontSize: 36, width: 44, textAlign: 'center', flexShrink: 0, filter: unlocked ? undefined : 'grayscale(1)' }}>
                    {unlocked ? (ENEMY_ICONS[level.enemy.id] ?? '👾') : '🔒'}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* LV badge + concept tag + stars + CLEARED */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 5 }}>
                      <span style={{
                        background: meta.bg, color: meta.color,
                        fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 5,
                        border: `1px solid ${meta.color}55`,
                      }}>LV {level.number}</span>
                      <span style={{
                        background: meta.bg, color: meta.color,
                        fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 5,
                        border: `1px solid ${meta.color}44`,
                      }}>{meta.tag}</span>
                      <DifficultyStars n={level.difficultyEstimate} />
                      {done && (
                        <span style={{ background: 'rgba(74,222,128,0.2)', color: '#4ade80', fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 5 }}>
                          ✓ ผ่านแล้ว
                        </span>
                      )}
                    </div>

                    {/* Level name */}
                    <h3 style={{ color: colors.text, fontWeight: 700, fontSize: 15, margin: '0 0 2px', lineHeight: 1.3 }}>
                      {level.name}
                    </h3>

                    {/* Concept */}
                    <p style={{ color: meta.color, fontSize: 11, margin: '0 0 4px', fontWeight: 600 }}>
                      📚 {level.concept}
                    </p>

                    {/* Description */}
                    <p style={{ color: colors.textSub, fontSize: 11, margin: 0, lineHeight: 1.4 }}>
                      {level.description}
                    </p>
                  </div>

                  {/* Rewards column */}
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ color: '#f87171', fontSize: 12, fontWeight: 600, margin: '0 0 2px' }}>
                      ❤️ {level.enemy.stats.maxHP} HP
                    </p>
                    <p style={{ color: '#fbbf24', fontSize: 11, fontWeight: 600, margin: '0 0 2px' }}>
                      +{level.rewards.experience} XP
                    </p>
                    {(level.rewards as any).gold && (
                      <p style={{ color: '#f59e0b', fontSize: 11, margin: 0 }}>
                        💰 {(level.rewards as any).gold}g
                      </p>
                    )}
                  </div>
                </div>

                {/* ── ล็อก ─────────────────────────────────────────────────── */}
                {!unlocked && (
                  <p style={{ color: colors.textMuted, fontSize: 11, margin: '8px 0 0 58px' }}>
                    🔒 ผ่านด่านที่ {i} ก่อนเพื่อปลดล็อก
                  </p>
                )}

                {/* ── Blocks info + Tutorial (unlocked only) ──────────────── */}
                {unlocked && (
                  <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>

                    {/* Allowed blocks */}
                    {allowedBlocks.length > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ color: colors.textMuted, fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
                          Blocks ที่ใช้ได้:
                        </span>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {allowedBlocks.map((b) => (
                            <span key={b} style={{
                              background: requiredBlocks.includes(b)
                                ? `${meta.color}22`
                                : colors.bgSurfaceHover,
                              border: requiredBlocks.includes(b)
                                ? `1px solid ${meta.color}66`
                                : `1px solid ${colors.border}`,
                              borderRadius: 5, padding: '2px 7px',
                              fontSize: 10, color: requiredBlocks.includes(b) ? meta.color : colors.textSub,
                              fontWeight: requiredBlocks.includes(b) ? 700 : 400,
                              display: 'flex', alignItems: 'center', gap: 3,
                            }}>
                              {BLOCK_ICONS[b] ?? '▪'} {BLOCK_LABELS[b] ?? b}
                              {requiredBlocks.includes(b) && <span style={{ fontSize: 8 }}>★</span>}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Required blocks note */}
                    {requiredBlocks.length > 0 && (
                      <p style={{ color: colors.textMuted, fontSize: 10, margin: 0 }}>
                        <span style={{ color: meta.color }}>★</span> = บังคับใช้เพื่อผ่านด่าน
                      </p>
                    )}

                    {/* Objectives */}
                    {level.objectives && level.objectives.length > 0 && (
                      <div style={{
                        background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.18)',
                        borderRadius: 8, padding: '7px 10px',
                      }}>
                        <p style={{ color: '#f87171', fontSize: 10, fontWeight: 700, margin: '0 0 4px' }}>
                          🎯 วัตถุประสงค์:
                        </p>
                        {level.objectives.map((obj, j) => (
                          <p key={j} style={{ color: colors.textSub, fontSize: 11, margin: '1px 0' }}>• {obj}</p>
                        ))}
                        {level.bonusObjective && (
                          <p style={{ color: '#fbbf24', fontSize: 10, margin: '4px 0 0' }}>
                            ⭐ โบนัส: {level.bonusObjective}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Tutorial hint */}
                    {level.tutorialText && (
                      <div style={{
                        background: meta.bg,
                        border: `1px solid ${meta.color}33`,
                        borderRadius: 8, padding: '8px 12px',
                      }}>
                        <p style={{ color: colors.textMuted, fontSize: 9, fontWeight: 700, margin: '0 0 3px', letterSpacing: 0.5 }}>
                          💡 HINT — {meta.tag}
                        </p>
                        <p style={{ color: meta.color, fontSize: 11, margin: 0, lineHeight: 1.5, fontWeight: 600 }}>
                          {level.tutorialText}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
