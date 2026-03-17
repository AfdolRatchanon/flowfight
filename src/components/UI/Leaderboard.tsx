import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  collection, query, limit, getDocs, where,
} from 'firebase/firestore';
import { db } from '../../services/firebaseService';
import { useGameStore } from '../../stores/gameStore';
import { useTheme } from '../../contexts/ThemeContext';
import type { LeaderboardEntry, LevelLeaderboardEntry, EndlessLeaderboardEntry } from '../../types/game.types';
import { LEVELS } from '../../utils/constants';
import { useFlowchartStore } from '../../stores/flowchartStore';

// ===== Types =====
type OverallSort =
  | 'levelsCompleted'   // ด่านมากสุด
  | 'experience'        // XP มากสุด
  | 'totalDamageDealt'  // ทำดาเมจรวมมากสุด
  | 'totalDamageTaken'  // โดนดาเมจรวมน้อยสุด
  | 'totalPlayTime';    // เวลาน้อยสุด (เร็วสุด)

type LevelSort =
  | 'damageDealt'    // ทำดาเมจมากสุด
  | 'damageTaken'    // โดนดาเมจน้อยสุด
  | 'timeMs'         // เวลาน้อยสุด
  | 'heroHPPercent'; // HP เหลือมากสุด

type EndlessSort =
  | 'score'            // คะแนนมากสุด
  | 'wavesCleared'     // wave มากสุด
  | 'totalDamageDealt' // ดาเมจรวมมากสุด
  | 'totalDamageTaken'; // โดนดาเมจน้อยสุด

// ===== Helpers =====
const RANK_BG = ['rgba(255,215,0,0.10)', 'rgba(192,192,192,0.07)', 'rgba(205,127,50,0.07)'];
const RANK_BORDER = ['rgba(255,215,0,0.30)', 'rgba(192,192,192,0.22)', 'rgba(205,127,50,0.22)'];

function fmtTime(ms: number) {
  if (!ms) return '—';
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return m > 0 ? `${m}m ${s % 60}s` : `${s}s`;
}

function fmtDateTime(ts: number) {
  if (!ts) return '—';
  const d = new Date(ts);
  return d.toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: '2-digit' })
    + ' ' + d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
}

function fmtFullTime(ms: number) {
  if (!ms) return '—';
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}ชม. ${m}น. ${sec}ว.`;
  if (m > 0) return `${m}น. ${sec}ว.`;
  return `${sec}ว.`;
}

function RankBadge({ rank }: { rank: number }) {
  const { colors } = useTheme();
  if (rank === 1) return <span style={{ fontSize: 22 }}>🥇</span>;
  if (rank === 2) return <span style={{ fontSize: 22 }}>🥈</span>;
  if (rank === 3) return <span style={{ fontSize: 22 }}>🥉</span>;
  return <span style={{ color: colors.textMuted, fontWeight: 800, fontSize: 15 }}>#{rank}</span>;
}

function CharAvatar({ cls }: { cls: string }) {
  const { colors } = useTheme();
  return (
    <div style={{
      width: 40, height: 40, borderRadius: 10, overflow: 'hidden', flexShrink: 0,
      background: colors.bgSurface, border: `1px solid ${colors.border}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <img src={`/characters/${cls}.png`} alt={cls}
        style={{ width: 36, height: 36, objectFit: 'contain', imageRendering: 'pixelated' }} />
    </div>
  );
}

// ===== Sort config =====
const OVERALL_SORTS: { key: OverallSort; label: string; icon: string; asc: boolean }[] = [
  { key: 'levelsCompleted', label: 'ด่านที่ผ่าน', icon: '🗺️', asc: false },
  { key: 'experience', label: 'XP สะสม', icon: '✨', asc: false },
  { key: 'totalDamageDealt', label: 'ดาเมจรวมมากสุด', icon: '⚔️', asc: false },
  { key: 'totalDamageTaken', label: 'โดนดาเมจน้อยสุด', icon: '🛡️', asc: true },
  { key: 'totalPlayTime', label: 'เวลาน้อยสุด', icon: '⏱️', asc: true },
];

const LEVEL_SORTS: { key: LevelSort; label: string; icon: string; asc: boolean }[] = [
  { key: 'damageDealt', label: 'ดาเมจมากสุด', icon: '⚔️', asc: false },
  { key: 'damageTaken', label: 'โดนดาเมจน้อยสุด', icon: '🛡️', asc: true },
  { key: 'timeMs', label: 'เวลาน้อยสุด', icon: '⏱️', asc: true },
  { key: 'heroHPPercent', label: 'HP เหลือมากสุด', icon: '💚', asc: false },
];

const ENDLESS_SORTS: { key: EndlessSort; label: string; icon: string; asc: boolean }[] = [
  { key: 'score', label: 'คะแนนสูงสุด', icon: '🏆', asc: false },
  { key: 'wavesCleared', label: 'Wave มากสุด', icon: '🌊', asc: false },
  { key: 'totalDamageDealt', label: 'ดาเมจรวมมากสุด', icon: '⚔️', asc: false },
  { key: 'totalDamageTaken', label: 'โดนดาเมจน้อยสุด', icon: '🛡️', asc: true },
];

// ===== Main Component =====
export default function Leaderboard() {
  const navigate = useNavigate();
  const { player } = useGameStore();
  const { colors } = useTheme();

  // Tab: 'overall' | 'level' | 'endless' | 'speedrun'
  const [tab, setTab] = useState<'overall' | 'level' | 'endless' | 'speedrun'>('overall');

  // Overall state
  const [overallEntries, setOverallEntries] = useState<LeaderboardEntry[]>([]);
  const [overallSort, setOverallSort] = useState<OverallSort>('levelsCompleted');
  const [overallLoading, setOverallLoading] = useState(true);
  const [overallError, setOverallError] = useState('');

  // Per-level state
  const [selectedLevel, setSelectedLevel] = useState(LEVELS[0].id);
  const [levelEntries, setLevelEntries] = useState<LevelLeaderboardEntry[]>([]);
  const [levelSort, setLevelSort] = useState<LevelSort>('damageDealt');
  const [levelLoading, setLevelLoading] = useState(false);
  const [levelError, setLevelError] = useState('');

  // Endless state
  const [endlessEntries, setEndlessEntries] = useState<EndlessLeaderboardEntry[]>([]);
  const [endlessSort, setEndlessSort] = useState<EndlessSort>('score');
  const [endlessLoading, setEndlessLoading] = useState(false);
  const [endlessError, setEndlessError] = useState('');

  // ===== Load overall =====
  useEffect(() => {
    async function load() {
      setOverallLoading(true);
      setOverallError('');
      try {
        // Firestore ไม่รองรับ order ที่ซับซ้อน — โหลด 200 records แล้ว sort client-side
        const q = query(collection(db, 'leaderboards'), limit(200));
        const snap = await getDocs(q);
        const rows = snap.docs.map((d) => ({ rank: 0, ...d.data() } as LeaderboardEntry));
        setOverallEntries(rows);
      } catch {
        setOverallError('โหลดข้อมูลไม่ได้ กรุณาลองใหม่');
        setOverallEntries([]);
      } finally {
        setOverallLoading(false);
      }
    }
    load();
  }, []);

  // ===== Load per-level =====
  useEffect(() => {
    if (tab !== 'level') return;
    async function load() {
      setLevelLoading(true);
      setLevelError('');
      try {
        const q = query(
          collection(db, 'levelboards'),
          where('levelId', '==', selectedLevel),
          limit(100),
        );
        const snap = await getDocs(q);
        const rows = snap.docs.map((d) => ({ rank: 0, ...d.data() } as LevelLeaderboardEntry));
        setLevelEntries(rows);
      } catch (e) {
        console.error('[Leaderboard] levelboards fetch error:', e);
        setLevelError('โหลดข้อมูลไม่ได้');
        setLevelEntries([]);
      } finally {
        setLevelLoading(false);
      }
    }
    load();
  }, [tab, selectedLevel]);

  // ===== Load endless =====
  useEffect(() => {
    if (tab !== 'endless') return;
    async function load() {
      setEndlessLoading(true);
      setEndlessError('');
      try {
        const q = query(collection(db, 'endlessboards'), limit(200));
        const snap = await getDocs(q);
        const rows = snap.docs.map((d) => ({ rank: 0, ...d.data() } as EndlessLeaderboardEntry));
        setEndlessEntries(rows);
      } catch {
        setEndlessError('โหลดข้อมูลไม่ได้');
        setEndlessEntries([]);
      } finally {
        setEndlessLoading(false);
      }
    }
    load();
  }, [tab]);

  // ===== Sort overall client-side =====
  const sortedOverall = useMemo(() => {
    const cfg = OVERALL_SORTS.find((s) => s.key === overallSort)!;
    const sorted = [...overallEntries].sort((a, b) => {
      const av = (a as any)[cfg.key] ?? 0;
      const bv = (b as any)[cfg.key] ?? 0;
      return cfg.asc ? av - bv : bv - av;
    });
    return sorted.map((e, i) => ({ ...e, rank: i + 1 }));
  }, [overallEntries, overallSort]);

  // ===== Sort per-level client-side =====
  const sortedLevel = useMemo(() => {
    const cfg = LEVEL_SORTS.find((s) => s.key === levelSort)!;
    const sorted = [...levelEntries].sort((a, b) => {
      const av = (a as any)[cfg.key] ?? 0;
      const bv = (b as any)[cfg.key] ?? 0;
      return cfg.asc ? av - bv : bv - av;
    });
    return sorted.map((e, i) => ({ ...e, rank: i + 1 }));
  }, [levelEntries, levelSort]);

  const myOverall = sortedOverall.find((e) => e.playerId === player?.id);
  const myLevel = sortedLevel.find((e) => e.playerId === player?.id);
  const selLevel = LEVELS.find((l) => l.id === selectedLevel);

  // ===== Sort endless client-side =====
  const sortedEndless = useMemo(() => {
    const cfg = ENDLESS_SORTS.find((s) => s.key === endlessSort)!;
    const sorted = [...endlessEntries].sort((a, b) => {
      const av = (a as any)[cfg.key] ?? 0;
      const bv = (b as any)[cfg.key] ?? 0;
      return cfg.asc ? av - bv : bv - av;
    });
    return sorted.map((e, i) => ({ ...e, rank: i + 1 }));
  }, [endlessEntries, endlessSort]);

  const myEndless = sortedEndless.find((e) => e.playerId === player?.id);

  // ===== Speedrun: sort from overallEntries =====
  const sortedSpeedrun = useMemo(() => {
    // ผู้ที่ครบทุกด่าน — เรียงตามเวลา (เร็วสุดก่อน)
    const finished = overallEntries
      .filter((e) => (e as any).campaignTotalTimeMs > 0 && e.levelsCompleted >= LEVELS.length)
      .sort((a, b) => ((a as any).campaignTotalTimeMs ?? 0) - ((b as any).campaignTotalTimeMs ?? 0))
      .map((e, i) => ({ ...e, rank: i + 1 }));
    // ผู้ที่ยังไม่ครบ — เรียงตามด่านที่ผ่าน มากสุดก่อน
    const inProgress = overallEntries
      .filter((e) => e.levelsCompleted < LEVELS.length)
      .sort((a, b) => b.levelsCompleted - a.levelsCompleted);
    return { finished, inProgress };
  }, [overallEntries]);

  return (
    <div className="page-outer">
      <div className="leaderboard-container">

        {/* ===== Header ===== */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          <button onClick={() => navigate('/')} style={{
            background: colors.bgSurface, border: 'none',
            color: colors.text, width: 40, height: 40, borderRadius: 10, cursor: 'pointer', fontSize: 18,
          }}>←</button>
          <div style={{ flex: 1 }}>
            <h1 style={{ color: colors.text, fontWeight: 800, fontSize: 24, margin: 0 }}>Leaderboard</h1>
            <p style={{ color: colors.textMuted, fontSize: 12, margin: 0 }}>
              {LEVELS.length} levels · อัปเดตหลังจบแต่ละด่าน
            </p>
          </div>
          <div style={{ fontSize: 28 }}>🏆</div>
        </div>

        {/* ===== Tabs ===== */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
          {(['overall', 'level', 'endless', 'speedrun'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex: 1, minWidth: 70, padding: '9px 4px', borderRadius: 10, border: 'none', cursor: 'pointer',
              fontWeight: 700, fontSize: 12,
              background: tab === t
                ? t === 'speedrun'
                  ? 'linear-gradient(135deg,#f59e0b,#ef4444)'
                  : 'linear-gradient(135deg,#e94560,#7c3aed)'
                : colors.bgSurface,
              color: tab === t ? '#ffffff' : colors.textSub,
            }}>
              {t === 'overall' ? '🌐 ภาพรวม' : t === 'level' ? '🗺️ แต่ละด่าน' : t === 'endless' ? '∞ Endless' : '⏱️ Speedrun'}
            </button>
          ))}
        </div>

        {/* ============================= OVERALL TAB ============================= */}
        {tab === 'overall' && (
          <>
            {/* Sort chips */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
              {OVERALL_SORTS.map((s) => (
                <button key={s.key} onClick={() => setOverallSort(s.key)} style={{
                  padding: '5px 11px', borderRadius: 20, border: 'none', cursor: 'pointer',
                  fontSize: 11, fontWeight: 700,
                  background: overallSort === s.key
                    ? 'rgba(233,69,96,0.25)'
                    : colors.bgSurface,
                  color: overallSort === s.key ? '#f87171' : colors.textSub,
                  outline: overallSort === s.key ? '1px solid rgba(233,69,96,0.5)' : 'none',
                }}>
                  {s.icon} {s.label}
                </button>
              ))}
            </div>

            {/* My rank banner */}
            {myOverall && (
              <div style={{
                background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.35)',
                borderRadius: 12, padding: '10px 16px', marginBottom: 14,
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <span style={{ color: '#a78bfa', fontSize: 11, fontWeight: 700 }}>YOUR RANK</span>
                <span style={{ color: colors.text, fontWeight: 900, fontSize: 20 }}>#{myOverall.rank}</span>
                <span style={{ color: colors.textMuted, fontSize: 12 }}>·</span>
                <span style={{ color: colors.textSub, fontSize: 12 }}>
                  {myOverall.levelsCompleted}/{LEVELS.length} ด่าน · Lv.{myOverall.characterLevel} · {myOverall.experience.toLocaleString()} XP
                </span>
              </div>
            )}

            {/* List */}
            {overallLoading ? <LoadingState /> : overallError ? <ErrorState msg={overallError} /> :
              sortedOverall.length === 0 ? <EmptyState onPlay={() => navigate('/levels')} /> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {sortedOverall.slice(0, 50).map((entry) => {
                    const isTop3 = entry.rank <= 3;
                    const isMe = entry.playerId === player?.id;
                    const cfg = OVERALL_SORTS.find((s) => s.key === overallSort)!;
                    return (
                      <OverallRow
                        key={entry.playerId}
                        entry={entry}
                        isTop3={isTop3} isMe={isMe}
                        sortKey={overallSort} sortCfg={cfg}
                      />
                    );
                  })}
                </div>
              )
            }
          </>
        )}

        {/* ============================= PER-LEVEL TAB ============================= */}
        {tab === 'level' && (
          <>
            {/* Level selector */}
            <div style={{
              display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap',
            }}>
              {LEVELS.map((lv) => (
                <button key={lv.id} onClick={() => setSelectedLevel(lv.id)} style={{
                  padding: '4px 10px', borderRadius: 16, border: 'none', cursor: 'pointer',
                  fontSize: 11, fontWeight: 700,
                  background: selectedLevel === lv.id
                    ? 'rgba(124,58,237,0.3)'
                    : colors.bgSurface,
                  color: selectedLevel === lv.id ? '#c4b5fd' : colors.textMuted,
                  outline: selectedLevel === lv.id ? '1px solid rgba(124,58,237,0.5)' : 'none',
                }}>
                  {lv.number}
                </button>
              ))}
            </div>

            {/* Level name */}
            {selLevel && (
              <div style={{
                background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)',
                borderRadius: 10, padding: '8px 14px', marginBottom: 12,
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <span style={{
                  background: 'rgba(124,58,237,0.3)', color: '#c4b5fd',
                  fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 5,
                }}>LEVEL {selLevel.number}</span>
                <span style={{ color: colors.text, fontWeight: 700, fontSize: 13 }}>{selLevel.name}</span>
                <span style={{ color: colors.textMuted, fontSize: 11 }}>{selLevel.concept}</span>
              </div>
            )}

            {/* Sort chips */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
              {LEVEL_SORTS.map((s) => (
                <button key={s.key} onClick={() => setLevelSort(s.key)} style={{
                  padding: '5px 11px', borderRadius: 20, border: 'none', cursor: 'pointer',
                  fontSize: 11, fontWeight: 700,
                  background: levelSort === s.key
                    ? 'rgba(233,69,96,0.25)'
                    : colors.bgSurface,
                  color: levelSort === s.key ? '#f87171' : colors.textSub,
                  outline: levelSort === s.key ? '1px solid rgba(233,69,96,0.5)' : 'none',
                }}>
                  {s.icon} {s.label}
                </button>
              ))}
            </div>

            {/* My rank on this level */}
            {myLevel && (
              <div style={{
                background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.35)',
                borderRadius: 12, padding: '10px 16px', marginBottom: 14,
                display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
              }}>
                <span style={{ color: '#a78bfa', fontSize: 11, fontWeight: 700 }}>YOUR RANK</span>
                <span style={{ color: colors.text, fontWeight: 900, fontSize: 20 }}>#{myLevel.rank}</span>
                <LevelStatChips entry={myLevel} />
              </div>
            )}

            {/* List */}
            {levelLoading ? <LoadingState /> : levelError ? <ErrorState msg={levelError} /> :
              sortedLevel.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40 }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>🏜️</div>
                  <p style={{ color: colors.textSub, fontSize: 14 }}>
                    ยังไม่มีใครผ่านด่านนี้!
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {sortedLevel.slice(0, 50).map((entry) => {
                    const isTop3 = entry.rank <= 3;
                    const isMe = entry.playerId === player?.id;
                    return (
                      <LevelRow
                        key={entry.playerId}
                        entry={entry}
                        isTop3={isTop3} isMe={isMe}
                        sortKey={levelSort}
                      />
                    );
                  })}
                </div>
              )
            }
          </>
        )}

        {/* ============================= ENDLESS TAB ============================= */}
        {tab === 'endless' && (
          <>
            {/* Endless header */}
            <div style={{
              background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)',
              borderRadius: 10, padding: '8px 14px', marginBottom: 12,
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <span style={{
                background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', color: '#e0d7ff',
                fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 5,
              }}>∞ ENDLESS</span>
              <span style={{ color: colors.text, fontWeight: 700, fontSize: 13 }}>Survival Mode</span>
              <span style={{ color: colors.textMuted, fontSize: 11 }}>อยู่รอดให้นานที่สุด!</span>
            </div>

            {/* Sort chips */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
              {ENDLESS_SORTS.map((s) => (
                <button key={s.key} onClick={() => setEndlessSort(s.key)} style={{
                  padding: '5px 11px', borderRadius: 20, border: 'none', cursor: 'pointer',
                  fontSize: 11, fontWeight: 700,
                  background: endlessSort === s.key
                    ? 'rgba(233,69,96,0.25)'
                    : colors.bgSurface,
                  color: endlessSort === s.key ? '#f87171' : colors.textSub,
                  outline: endlessSort === s.key ? '1px solid rgba(233,69,96,0.5)' : 'none',
                }}>
                  {s.icon} {s.label}
                </button>
              ))}
            </div>

            {/* My rank banner */}
            {myEndless && (
              <div style={{
                background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.35)',
                borderRadius: 12, padding: '10px 16px', marginBottom: 14,
                display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
              }}>
                <span style={{ color: '#a78bfa', fontSize: 11, fontWeight: 700 }}>YOUR RANK</span>
                <span style={{ color: colors.text, fontWeight: 900, fontSize: 20 }}>#{myEndless.rank}</span>
                <span style={{ color: colors.textMuted, fontSize: 12 }}>·</span>
                <span style={{ color: colors.textSub, fontSize: 12 }}>
                  🏆 {myEndless.score.toLocaleString()} pts · 🌊 Wave {myEndless.wavesCleared}
                </span>
              </div>
            )}

            {/* List */}
            {endlessLoading ? <LoadingState /> : endlessError ? <ErrorState msg={endlessError} /> :
              sortedEndless.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40 }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>∞</div>
                  <p style={{ color: colors.textSub, fontSize: 14 }}>
                    ยังไม่มีใครเล่น Endless Mode!
                  </p>
                  <button onClick={() => { useFlowchartStore.getState().clearToStartEnd(); navigate('/battle/level_endless'); }} style={{
                    marginTop: 16, padding: '10px 24px', borderRadius: 12, border: 'none',
                    background: 'linear-gradient(135deg,#7c3aed,#4f46e5)',
                    color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: 13,
                  }}>เล่น Endless Mode →</button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {sortedEndless.slice(0, 50).map((entry) => {
                    const isTop3 = entry.rank <= 3;
                    const isMe = entry.playerId === player?.id;
                    return (
                      <EndlessRow
                        key={entry.playerId}
                        entry={entry}
                        isTop3={isTop3} isMe={isMe}
                        sortKey={endlessSort}
                      />
                    );
                  })}
                </div>
              )
            }
          </>
        )}

        {/* ============================= SPEEDRUN TAB ============================= */}
        {tab === 'speedrun' && (
          <>
            {/* Header */}
            <div style={{
              background: 'linear-gradient(135deg,rgba(245,158,11,0.15),rgba(239,68,68,0.1))',
              border: '1px solid rgba(245,158,11,0.35)',
              borderRadius: 14, padding: '14px 16px', marginBottom: 16,
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <span style={{ fontSize: 28 }}>⏱️</span>
              <div>
                <div style={{ color: '#f59e0b', fontWeight: 800, fontSize: 15 }}>Campaign Speedrun</div>
                <div style={{ color: colors.textMuted, fontSize: 11, marginTop: 2 }}>
                  ใครผ่านครบ {LEVELS.length} ด่านเร็วสุด · นับตั้งแต่ชนะด่าน 1 ครั้งแรก จนถึงด่านสุดท้าย
                </div>
              </div>
            </div>

            {overallLoading ? <LoadingState /> : (
              <>
                {/* ===== Finished ===== */}
                {sortedSpeedrun.finished.length > 0 ? (
                  <>
                    <div style={{ color: colors.textSub, fontSize: 11, fontWeight: 700, marginBottom: 8, letterSpacing: 1 }}>
                      FINISHED — {sortedSpeedrun.finished.length} คน
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 20 }}>
                      {sortedSpeedrun.finished.map((entry) => {
                        const isMe = entry.playerId === player?.id;
                        const isFirst = entry.rank === 1;
                        return (
                          <div key={entry.playerId} style={{
                            display: 'flex', alignItems: 'center', gap: 12,
                            background: isFirst
                              ? 'rgba(245,158,11,0.12)'
                              : isMe ? 'rgba(124,58,237,0.08)' : colors.bgSurface,
                            border: isFirst
                              ? '1px solid rgba(245,158,11,0.45)'
                              : isMe ? '1px solid rgba(124,58,237,0.3)' : `1px solid ${colors.borderSubtle}`,
                            borderRadius: 14, padding: '10px 14px',
                          }}>
                            <div style={{ width: 32, textAlign: 'center', flexShrink: 0 }}>
                              {isFirst ? <span style={{ fontSize: 22 }}>👑</span> : <RankBadge rank={entry.rank} />}
                            </div>
                            <CharAvatar cls={entry.characterClass} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                                <span style={{ color: colors.text, fontWeight: 700, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {entry.playerName}
                                </span>
                                {isMe && <span style={{ background: 'rgba(124,58,237,0.3)', color: '#a78bfa', fontSize: 8, fontWeight: 800, padding: '1px 5px', borderRadius: 4 }}>YOU</span>}
                                {isFirst && <span style={{ background: 'rgba(245,158,11,0.3)', color: '#f59e0b', fontSize: 8, fontWeight: 800, padding: '1px 5px', borderRadius: 4 }}>FIRST!</span>}
                              </div>
                              <div style={{ color: colors.textMuted, fontSize: 10 }}>
                                {entry.characterName} · {entry.characterClass} · Lv.{entry.characterLevel}
                              </div>
                            </div>
                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                              <div style={{ color: isFirst ? '#f59e0b' : '#4ade80', fontWeight: 900, fontSize: 14 }}>
                                {fmtFullTime((entry as any).campaignTotalTimeMs)}
                              </div>
                              <div style={{ color: colors.textMuted, fontSize: 9, marginTop: 2 }}>
                                {(entry as any).campaignClearedAt ? fmtDateTime((entry as any).campaignClearedAt) : ''}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <div style={{
                    textAlign: 'center', padding: '24px 0', color: colors.textMuted, fontSize: 13,
                  }}>
                    ยังไม่มีใครผ่านครบ {LEVELS.length} ด่าน — คุณจะเป็นคนแรกไหม?
                  </div>
                )}

                {/* ===== In Progress ===== */}
                {sortedSpeedrun.inProgress.length > 0 && (
                  <>
                    <div style={{ color: colors.textSub, fontSize: 11, fontWeight: 700, marginBottom: 8, letterSpacing: 1 }}>
                      IN PROGRESS — {sortedSpeedrun.inProgress.length} คน
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {sortedSpeedrun.inProgress.map((entry) => {
                        const isMe = entry.playerId === player?.id;
                        const pct = Math.round((entry.levelsCompleted / LEVELS.length) * 100);
                        return (
                          <div key={entry.playerId} style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            background: isMe ? 'rgba(124,58,237,0.08)' : colors.bgSurface,
                            border: isMe ? '1px solid rgba(124,58,237,0.3)' : `1px solid ${colors.borderSubtle}`,
                            borderRadius: 12, padding: '9px 12px',
                          }}>
                            <CharAvatar cls={entry.characterClass} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                <span style={{ color: colors.text, fontWeight: 700, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {entry.playerName}
                                </span>
                                {isMe && <span style={{ background: 'rgba(124,58,237,0.3)', color: '#a78bfa', fontSize: 8, fontWeight: 800, padding: '1px 5px', borderRadius: 4 }}>YOU</span>}
                              </div>
                              {/* Progress bar */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <div style={{ flex: 1, height: 5, borderRadius: 3, background: colors.borderSubtle, overflow: 'hidden' }}>
                                  <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg,#e94560,#7c3aed)', borderRadius: 3, transition: 'width 0.4s' }} />
                                </div>
                                <span style={{ color: colors.textMuted, fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
                                  {entry.levelsCompleted}/{LEVELS.length}
                                </span>
                              </div>
                            </div>
                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                              <div style={{ color: colors.textMuted, fontSize: 11, fontWeight: 700 }}>{pct}%</div>
                              <div style={{ color: colors.textMuted, fontSize: 9, marginTop: 1 }}>
                                {(entry as any).campaignStartedAt
                                  ? `เริ่ม ${fmtDateTime((entry as any).campaignStartedAt)}`
                                  : 'ยังไม่เริ่ม'}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </>
            )}
          </>
        )}

      </div>
    </div>
  );
}

// ===== Overall row =====
function OverallRow({
  entry, isTop3, isMe, sortKey,
}: {
  entry: LeaderboardEntry; isTop3: boolean; isMe: boolean; sortKey: OverallSort; sortCfg: (typeof OVERALL_SORTS)[0];
}) {
  const { colors } = useTheme();
  const bg = isTop3 ? RANK_BG[entry.rank - 1] : isMe ? 'rgba(124,58,237,0.08)' : colors.bgSurface;
  const border = isTop3 ? `1px solid ${RANK_BORDER[entry.rank - 1]}` : isMe ? '1px solid rgba(124,58,237,0.3)' : `1px solid ${colors.borderSubtle}`;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: bg, border, borderRadius: 14, padding: '10px 14px' }}>
      <div style={{ width: 32, textAlign: 'center', flexShrink: 0 }}>
        <RankBadge rank={entry.rank} />
      </div>
      <CharAvatar cls={entry.characterClass} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <span style={{ color: colors.text, fontWeight: 700, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {entry.playerName}
          </span>
          {isMe && <span style={{ background: 'rgba(124,58,237,0.3)', color: '#a78bfa', fontSize: 8, fontWeight: 800, padding: '1px 5px', borderRadius: 4, flexShrink: 0 }}>YOU</span>}
        </div>
        <span style={{ color: colors.textMuted, fontSize: 10, textTransform: 'capitalize' }}>
          {entry.characterName} · {entry.characterClass}
        </span>
      </div>

      {/* Stats column */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3, flexShrink: 0 }}>
        {/* Primary highlighted stat */}
        <PrimaryOverallStat entry={entry} sortKey={sortKey} />
        {/* Secondary always-visible */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ color: '#4ade80', fontSize: 11, fontWeight: 700 }}>
            🗺️ {entry.levelsCompleted}/{LEVELS.length}
          </span>
          <span style={{ background: 'linear-gradient(135deg,#fbbf24,#f59e0b)', color: '#1c1917', fontSize: 9, fontWeight: 900, padding: '1px 5px', borderRadius: 4 }}>
            Lv.{entry.characterLevel}
          </span>
        </div>
      </div>
    </div>
  );
}

function PrimaryOverallStat({ entry, sortKey }: { entry: LeaderboardEntry; sortKey: OverallSort }) {
  if (sortKey === 'levelsCompleted')
    return <span style={{ color: '#4ade80', fontWeight: 900, fontSize: 14 }}>🗺️ {entry.levelsCompleted}/{LEVELS.length}</span>;
  if (sortKey === 'experience')
    return <span style={{ color: '#a78bfa', fontWeight: 700, fontSize: 13 }}>✨ {entry.experience.toLocaleString()} XP</span>;
  if (sortKey === 'totalDamageDealt')
    return <span style={{ color: '#f87171', fontWeight: 700, fontSize: 13 }}>⚔️ {(entry.totalDamageDealt ?? 0).toLocaleString()}</span>;
  if (sortKey === 'totalDamageTaken')
    return <span style={{ color: '#60a5fa', fontWeight: 700, fontSize: 13 }}>🛡️ {(entry.totalDamageTaken ?? 0).toLocaleString()}</span>;
  if (sortKey === 'totalPlayTime')
    return <span style={{ color: '#fbbf24', fontWeight: 700, fontSize: 13 }}>⏱️ {fmtTime(entry.totalPlayTime ?? 0)}</span>;
  return null;
}

// ===== Level row =====
function LevelRow({
  entry, isTop3, isMe, sortKey,
}: {
  entry: LevelLeaderboardEntry; isTop3: boolean; isMe: boolean; sortKey: LevelSort;
}) {
  const { colors } = useTheme();
  const bg = isTop3 ? RANK_BG[entry.rank - 1] : isMe ? 'rgba(124,58,237,0.08)' : colors.bgSurface;
  const border = isTop3 ? `1px solid ${RANK_BORDER[entry.rank - 1]}` : isMe ? '1px solid rgba(124,58,237,0.3)' : `1px solid ${colors.borderSubtle}`;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: bg, border, borderRadius: 14, padding: '10px 14px' }}>
      <div style={{ width: 32, textAlign: 'center', flexShrink: 0 }}>
        <RankBadge rank={entry.rank} />
      </div>
      <CharAvatar cls={entry.characterClass} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <span style={{ color: colors.text, fontWeight: 700, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {entry.playerName}
          </span>
          {isMe && <span style={{ background: 'rgba(124,58,237,0.3)', color: '#a78bfa', fontSize: 8, fontWeight: 800, padding: '1px 5px', borderRadius: 4, flexShrink: 0 }}>YOU</span>}
        </div>
        <span style={{ color: colors.textMuted, fontSize: 10, textTransform: 'capitalize' }}>
          {entry.characterName} · {entry.characterClass}
        </span>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3, flexShrink: 0 }}>
        <PrimaryLevelStat entry={entry} sortKey={sortKey} />
        <LevelStatChips entry={entry} exclude={sortKey} />
      </div>
    </div>
  );
}

function PrimaryLevelStat({ entry, sortKey }: { entry: LevelLeaderboardEntry; sortKey: LevelSort }) {
  if (sortKey === 'damageDealt')
    return <span style={{ color: '#f87171', fontWeight: 900, fontSize: 14 }}>⚔️ {entry.damageDealt.toLocaleString()}</span>;
  if (sortKey === 'damageTaken')
    return <span style={{ color: '#60a5fa', fontWeight: 900, fontSize: 14 }}>🛡️ {entry.damageTaken.toLocaleString()}</span>;
  if (sortKey === 'timeMs')
    return <span style={{ color: '#fbbf24', fontWeight: 900, fontSize: 14 }}>⏱️ {fmtTime(entry.timeMs)}</span>;
  if (sortKey === 'heroHPPercent')
    return <span style={{ color: '#4ade80', fontWeight: 900, fontSize: 14 }}>💚 {entry.heroHPPercent}%</span>;
  return null;
}

function LevelStatChips({ entry, exclude }: { entry: LevelLeaderboardEntry; exclude?: LevelSort }) {
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
      {exclude !== 'damageDealt' && (
        <span style={{ color: '#f87171', fontSize: 10 }}>⚔️ {entry.damageDealt.toLocaleString()}</span>
      )}
      {exclude !== 'damageTaken' && (
        <span style={{ color: '#60a5fa', fontSize: 10 }}>🛡️ {entry.damageTaken.toLocaleString()}</span>
      )}
      {exclude !== 'timeMs' && (
        <span style={{ color: '#fbbf24', fontSize: 10 }}>⏱️ {fmtTime(entry.timeMs)}</span>
      )}
      {exclude !== 'heroHPPercent' && (
        <span style={{ color: '#4ade80', fontSize: 10 }}>💚 {entry.heroHPPercent}%</span>
      )}
    </div>
  );
}

// ===== Endless row =====
function EndlessRow({
  entry, isTop3, isMe, sortKey,
}: {
  entry: EndlessLeaderboardEntry; isTop3: boolean; isMe: boolean; sortKey: EndlessSort;
}) {
  const { colors } = useTheme();
  const bg = isTop3 ? RANK_BG[entry.rank - 1] : isMe ? 'rgba(124,58,237,0.08)' : colors.bgSurface;
  const border = isTop3 ? `1px solid ${RANK_BORDER[entry.rank - 1]}` : isMe ? '1px solid rgba(124,58,237,0.3)' : `1px solid ${colors.borderSubtle}`;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: bg, border, borderRadius: 14, padding: '10px 14px' }}>
      <div style={{ width: 32, textAlign: 'center', flexShrink: 0 }}>
        <RankBadge rank={entry.rank} />
      </div>
      <CharAvatar cls={entry.characterClass} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <span style={{ color: colors.text, fontWeight: 700, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {entry.playerName}
          </span>
          {isMe && <span style={{ background: 'rgba(124,58,237,0.3)', color: '#a78bfa', fontSize: 8, fontWeight: 800, padding: '1px 5px', borderRadius: 4, flexShrink: 0 }}>YOU</span>}
        </div>
        <span style={{ color: colors.textMuted, fontSize: 10, textTransform: 'capitalize' }}>
          {entry.characterName} · {entry.characterClass}
        </span>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3, flexShrink: 0 }}>
        <PrimaryEndlessStat entry={entry} sortKey={sortKey} />
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {sortKey !== 'score' && (
            <span style={{ color: '#c4b5fd', fontSize: 10, fontWeight: 700 }}>🏆 {entry.score.toLocaleString()}</span>
          )}
          {sortKey !== 'wavesCleared' && (
            <span style={{ color: '#7dd3fc', fontSize: 10 }}>🌊 W{entry.wavesCleared}</span>
          )}
        </div>
      </div>
    </div>
  );
}

function PrimaryEndlessStat({ entry, sortKey }: { entry: EndlessLeaderboardEntry; sortKey: EndlessSort }) {
  if (sortKey === 'score')
    return <span style={{ color: '#c4b5fd', fontWeight: 900, fontSize: 14 }}>🏆 {entry.score.toLocaleString()}</span>;
  if (sortKey === 'wavesCleared')
    return <span style={{ color: '#7dd3fc', fontWeight: 900, fontSize: 14 }}>🌊 Wave {entry.wavesCleared}</span>;
  if (sortKey === 'totalDamageDealt')
    return <span style={{ color: '#f87171', fontWeight: 700, fontSize: 13 }}>⚔️ {(entry.totalDamageDealt ?? 0).toLocaleString()}</span>;
  if (sortKey === 'totalDamageTaken')
    return <span style={{ color: '#60a5fa', fontWeight: 700, fontSize: 13 }}>🛡️ {(entry.totalDamageTaken ?? 0).toLocaleString()}</span>;
  return null;
}

// ===== Shared UI =====
function LoadingState() {
  const { colors } = useTheme();
  return (
    <div style={{ textAlign: 'center', padding: 60 }}>
      <div style={{ fontSize: 30, marginBottom: 10 }}>⏳</div>
      <p style={{ color: colors.textMuted, fontSize: 14 }}>Loading...</p>
    </div>
  );
}

function ErrorState({ msg }: { msg: string }) {
  return (
    <div style={{ textAlign: 'center', padding: 40 }}>
      <div style={{ fontSize: 36, marginBottom: 10 }}>⚠️</div>
      <p style={{ color: '#f87171', fontSize: 13 }}>{msg}</p>
    </div>
  );
}

function EmptyState({ onPlay }: { onPlay: () => void }) {
  const { colors } = useTheme();
  return (
    <div style={{ textAlign: 'center', padding: 60 }}>
      <div style={{ fontSize: 56, marginBottom: 14 }}>🏆</div>
      <p style={{ color: colors.text, fontWeight: 700, fontSize: 17, marginBottom: 6 }}>ยังไม่มีผู้เล่น!</p>
      <p style={{ color: colors.textMuted, fontSize: 13 }}>ผ่านด่านแรกเพื่อเข้า Leaderboard</p>
      <button onClick={onPlay} style={{
        marginTop: 22, padding: '11px 28px', borderRadius: 12, border: 'none',
        background: 'linear-gradient(135deg,#e94560,#7c3aed)',
        color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: 13,
      }}>เริ่มเล่น →</button>
    </div>
  );
}
