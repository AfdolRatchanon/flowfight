import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebaseService';
import { useGameStore } from '../../stores/gameStore';
import type { LeaderboardEntry } from '../../types/game.types';
import { LEVELS } from '../../utils/constants';

const RANK_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'];
const RANK_BG     = ['rgba(255,215,0,0.08)', 'rgba(192,192,192,0.06)', 'rgba(205,127,50,0.06)'];
const RANK_BORDER = ['rgba(255,215,0,0.25)',  'rgba(192,192,192,0.2)',  'rgba(205,127,50,0.2)'];

export default function Leaderboard() {
  const navigate = useNavigate();
  const { player } = useGameStore();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');

  useEffect(() => {
    async function load() {
      try {
        const q = query(
          collection(db, 'leaderboards'),
          orderBy('levelsCompleted', 'desc'),
          orderBy('characterLevel', 'desc'),
          orderBy('experience', 'desc'),
          limit(50),
        );
        const snap = await getDocs(q);
        setEntries(snap.docs.map((d, i) => ({ rank: i + 1, ...d.data() } as LeaderboardEntry)));
      } catch (e) {
        setError('ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่');
        setEntries([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const myEntry = entries.find((e) => e.playerId === player?.id);

  return (
    <div className="page-outer">
      <div className="leaderboard-container">

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <button onClick={() => navigate('/')} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: 'white', width: 40, height: 40, borderRadius: 10, cursor: 'pointer', fontSize: 18 }}>←</button>
          <div style={{ flex: 1 }}>
            <h1 style={{ color: 'white', fontWeight: 800, fontSize: 26, margin: 0 }}>Leaderboard</h1>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, margin: 0 }}>
              Top {entries.length} players · {LEVELS.length} levels total
            </p>
          </div>
          <div style={{ fontSize: 32 }}>🏆</div>
        </div>

        {/* My rank highlight (if in list) */}
        {myEntry && (
          <div style={{
            background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.35)',
            borderRadius: 14, padding: '12px 18px', marginBottom: 16,
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <span style={{ color: '#a78bfa', fontSize: 12, fontWeight: 700 }}>YOUR RANK</span>
            <span style={{ color: 'white', fontWeight: 900, fontSize: 20 }}>#{myEntry.rank}</span>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>·</span>
            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>
              {myEntry.levelsCompleted}/{LEVELS.length} ด่าน · Lv.{myEntry.characterLevel}
            </span>
          </div>
        )}

        {/* Sort legend */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 14, padding: '0 4px' }}>
          {[
            { icon: '🗺️', label: 'ด่านที่ผ่าน', color: '#4ade80' },
            { icon: '⭐', label: 'Level ตัวละคร', color: '#fbbf24' },
            { icon: '✨', label: 'XP สะสม', color: '#a78bfa' },
          ].map((s) => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 12 }}>{s.icon}</span>
              <span style={{ color: s.color, fontSize: 10, fontWeight: 600 }}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 15 }}>Loading...</p>
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
            <p style={{ color: '#f87171', fontSize: 14 }}>{error}</p>
          </div>
        ) : entries.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🏆</div>
            <p style={{ color: 'white', fontWeight: 700, fontSize: 18, marginBottom: 8 }}>ยังไม่มีผู้เล่น!</p>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>เล่นจนจบด่านแรกเพื่อเข้า Leaderboard</p>
            <button onClick={() => navigate('/levels')} style={{
              marginTop: 24, padding: '12px 28px', borderRadius: 12, border: 'none',
              background: 'linear-gradient(135deg,#e94560,#7c3aed)', color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: 14,
            }}>เริ่มเล่น →</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {entries.map((entry) => {
              const isTop3  = entry.rank <= 3;
              const isMe    = entry.playerId === player?.id;
              const bgColor = isTop3 ? RANK_BG[entry.rank - 1] : isMe ? 'rgba(124,58,237,0.08)' : 'rgba(255,255,255,0.03)';
              const border  = isTop3 ? RANK_BORDER[entry.rank - 1] : isMe ? '1px solid rgba(124,58,237,0.3)' : '1px solid rgba(255,255,255,0.06)';

              return (
                <div key={entry.playerId} style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  background: bgColor, border, borderRadius: 14, padding: '12px 16px',
                  transition: 'transform 0.15s',
                }}>
                  {/* Rank */}
                  <div style={{ width: 36, textAlign: 'center', flexShrink: 0 }}>
                    {isTop3 ? (
                      <span style={{ fontSize: 24 }}>{['🥇','🥈','🥉'][entry.rank - 1]}</span>
                    ) : (
                      <span style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 800, fontSize: 16 }}>#{entry.rank}</span>
                    )}
                  </div>

                  {/* Character image */}
                  <div style={{
                    width: 44, height: 44, borderRadius: 10, overflow: 'hidden', flexShrink: 0,
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <img
                      src={`/characters/${entry.characterClass}.png`}
                      alt={entry.characterClass}
                      style={{ width: 38, height: 38, objectFit: 'contain', imageRendering: 'pixelated' }}
                    />
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                      <span style={{ color: 'white', fontWeight: 700, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {entry.playerName}
                      </span>
                      {isMe && (
                        <span style={{ background: 'rgba(124,58,237,0.3)', color: '#a78bfa', fontSize: 9, fontWeight: 800, padding: '1px 6px', borderRadius: 4 }}>YOU</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, textTransform: 'capitalize' }}>
                        {entry.characterName} · {entry.characterClass}
                      </span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3, flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ color: '#4ade80', fontSize: 12, fontWeight: 700 }}>
                        🗺️ {entry.levelsCompleted}/{LEVELS.length}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{
                        background: 'linear-gradient(135deg,#fbbf24,#f59e0b)',
                        color: '#1c1917', fontSize: 9, fontWeight: 900, padding: '1px 6px', borderRadius: 4,
                      }}>Lv.{entry.characterLevel}</span>
                      <span style={{ color: '#a78bfa', fontSize: 11 }}>{entry.experience.toLocaleString()} XP</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.15)', fontSize: 11, marginTop: 24 }}>
          อัปเดตหลังจบแต่ละด่าน
        </p>
      </div>
    </div>
  );
}
