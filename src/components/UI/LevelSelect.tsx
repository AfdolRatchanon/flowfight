import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LEVELS } from '../../utils/constants';
import { useGameStore } from '../../stores/gameStore';
import { useShopStore } from '../../stores/shopStore';
import { getMsUntilMidnightThai } from '../../services/authService';
import { levelProgressPct, MAX_LEVEL } from '../../utils/levelSystem';
import { useTheme } from '../../contexts/ThemeContext';
import BagButton from './BagButton';
import VolumeButton from './VolumeButton';

// ── Enemy image map (by level.id — 1 ภาพต่อ 1 ด่าน) ──────────────────────
const LEVEL_IMAGE: Record<string, string> = {
  level_1: 'slime.png',
  level_2: 'bigger-slime.png',
  level_3: 'goblin-scout.png',
  level_4: 'goblin-heal.png',
  level_5: 'spider.png',
  level_6: 'kobold.png',
  level_7: 'forest-wraith.png',
  level_8: 'goblin-knight.png',
  level_9: 'orc-warrior.png',
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

const ENEMY_EMOJI: Record<string, string> = {
  slime: '🟢', goblin: '👺', goblin_knight: '👺', kobold: '🦎',
  orc: '👹', orc_warlord: '👹', ghost: '👻', troll: '🪨',
  spider: '🕷️', ice_giant: '🧊', dragon: '🐉',
  lich: '💀', overlord: '👑', boss: '💀',
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

function formatCountdown(ms: number): string {
  const totalSec = Math.ceil(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function getDailyEfficiency(plays: number): { label: string; color: string; bg: string } {
  if (plays === 0) return { label: '100%', color: '#4ade80', bg: 'rgba(74,222,128,0.15)' };
  if (plays === 1) return { label: '50%', color: '#fbbf24', bg: 'rgba(251,191,36,0.15)' };
  if (plays === 2) return { label: '25%', color: '#fb923c', bg: 'rgba(251,146,60,0.15)' };
  return { label: '10%', color: '#f87171', bg: 'rgba(248,113,113,0.15)' };
}

export default function LevelSelect() {
  const navigate = useNavigate();
  const { player, character, dailyFarmPlays } = useGameStore();
  const { colors } = useTheme();
  const shopStore = useShopStore();
  const completed = player?.levelsCompleted ?? [];

  const [countdown, setCountdown] = useState('');
  useEffect(() => {
    function update() { setCountdown(formatCountdown(getMsUntilMidnightThai())); }
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  function isUnlocked(_levelId: string, idx: number) {
    if (idx === 0) return true;
    if (completed.includes(LEVELS[idx].id)) return true;
    return completed.includes(LEVELS[idx - 1].id);
  }

  return (
    <div className="page-outer">
      <div className="page-container">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          <button onClick={() => navigate('/levels')} style={{
            background: colors.bgSurface, border: `1px solid ${colors.borderSubtle}`,
            color: colors.text, width: 40, height: 40, borderRadius: 10, cursor: 'pointer', fontSize: 18,
          }}>←</button>
          <div style={{ flex: 1 }}>
            <h1 style={{ color: colors.text, fontWeight: 800, fontSize: 26, margin: 0 }}>เลือกด่าน</h1>
            <p style={{ color: colors.textMuted, fontSize: 13, margin: 0 }}>
              ผ่านแล้ว {completed.length}/{LEVELS.length} ด่าน
            </p>
          </div>

          <VolumeButton variant="header" />
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

        {/* ── Daily Farm Reset Strip ─────────────────────────────────────── */}
        <div style={{
          background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)',
          borderRadius: 10, padding: '6px 14px', marginBottom: 12,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ color: 'rgba(165,180,252,0.85)', fontSize: 11 }}>
            🔄 รางวัลรายวัน — รีเซ็ตทุกเที่ยงคืน (UTC+7)
          </span>
          <span style={{ color: '#a5b4fc', fontSize: 11, fontWeight: 700 }}>
            {countdown}
          </span>
        </div>

        <div className="level-grid">

          {/* ── Level Cards ────────────────────────────────────────────────── */}
          {LEVELS.map((level, i) => {
            const done = completed.includes(level.id);
            const unlocked = isUnlocked(level.id, i);
            const accentColor = done ? '#4ade80' : '#60a5fa';

            return (
              <div key={level.id}
                onClick={() => unlocked && navigate('/battle/' + level.id)}
                style={{
                  background: done ? 'rgba(74,222,128,0.05)' : colors.bgSurface,
                  border: done ? '1px solid rgba(74,222,128,0.3)' : `1px solid ${colors.borderSubtle}`,
                  borderRadius: 16, padding: '16px 18px',
                  cursor: unlocked ? 'pointer' : 'not-allowed',
                  transition: 'all 0.18s', position: 'relative', overflow: 'hidden',
                  opacity: unlocked ? 1 : 0.4,
                }}
                onMouseEnter={(e) => {
                  if (!unlocked) return;
                  const d = e.currentTarget as HTMLDivElement;
                  d.style.background = done ? 'rgba(74,222,128,0.1)' : colors.bgSurfaceHover;
                  d.style.transform = 'translateY(-2px)';
                  d.style.boxShadow = `0 6px 24px ${accentColor}22`;
                }}
                onMouseLeave={(e) => {
                  const d = e.currentTarget as HTMLDivElement;
                  d.style.background = done ? 'rgba(74,222,128,0.05)' : colors.bgSurface;
                  d.style.transform = 'none';
                  d.style.boxShadow = 'none';
                }}
              >
                {/* ขีดสีด้านซ้าย */}
                <div style={{
                  position: 'absolute', left: 0, top: 0, bottom: 0, width: 4,
                  background: accentColor,
                  borderRadius: '16px 0 0 16px',
                }} />

                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  {/* Enemy image */}
                  <div style={{ width: 52, height: 52, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {!unlocked ? (
                      <span style={{ fontSize: 28 }}>🔒</span>
                    ) : LEVEL_IMAGE[level.id] ? (
                      <img
                        src={`/enemies/${LEVEL_IMAGE[level.id]}`}
                        alt={level.enemy.id}
                        style={{ width: '100%', height: '100%', objectFit: 'contain', imageRendering: 'pixelated' }}
                        onError={(e) => {
                          const el = e.currentTarget;
                          el.style.display = 'none';
                          el.parentElement!.innerHTML = `<span style="font-size:32px">${ENEMY_EMOJI[level.enemy.id] ?? '👾'}</span>`;
                        }}
                      />
                    ) : (
                      <span style={{ fontSize: 32 }}>{ENEMY_EMOJI[level.enemy.id] ?? '👾'}</span>
                    )}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 5 }}>
                      <span style={{
                        background: `${accentColor}20`, color: accentColor,
                        fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 5,
                        border: `1px solid ${accentColor}55`,
                      }}>LV {level.number}</span>
                      <DifficultyStars n={level.difficultyEstimate} />
                      {done && (
                        <span style={{ background: 'rgba(74,222,128,0.2)', color: '#4ade80', fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 5 }}>
                          ✓ ผ่านแล้ว
                        </span>
                      )}
                    </div>
                    <h3 style={{ color: colors.text, fontWeight: 700, fontSize: 15, margin: 0, lineHeight: 1.3 }}>
                      {level.name}
                    </h3>
                    {!unlocked && (
                      <p style={{ color: colors.textMuted, fontSize: 11, margin: '4px 0 0' }}>
                        🔒 ผ่านด่านที่ {i} ก่อนเพื่อปลดล็อก
                      </p>
                    )}
                  </div>

                  {/* Rewards */}
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ color: '#f87171', fontSize: 12, fontWeight: 600, margin: '0 0 2px' }}>
                      ❤️ {level.enemy.stats.maxHP} HP
                    </p>
                    <p style={{ color: '#fbbf24', fontSize: 11, fontWeight: 600, margin: '0 0 2px' }}>
                      +{level.rewards.experience} XP
                    </p>
                    {(level.rewards as any).gold && (
                      <p style={{ color: '#f59e0b', fontSize: 11, margin: '0 0 2px' }}>
                        💰 {(level.rewards as any).gold}g
                      </p>
                    )}
                    {(() => {
                      const plays = dailyFarmPlays[level.id] ?? 0;
                      const eff = getDailyEfficiency(plays);
                      return (
                        <span style={{
                          display: 'inline-block',
                          background: eff.bg, color: eff.color,
                          fontSize: 9, fontWeight: 800, padding: '1px 6px',
                          borderRadius: 4, border: `1px solid ${eff.color}55`,
                        }}>
                          {eff.label}
                        </span>
                      );
                    })()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
