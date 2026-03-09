import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebaseService';
import type { LeaderboardEntry } from '../../types/game.types';

const CLASS_ICONS: Record<string, string> = { knight: '🛡️', mage: '🔮', rogue: '🗡️', barbarian: '⚔️' };
const RANK_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'];

export default function Leaderboard() {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const q = query(collection(db, 'leaderboards'), orderBy('levelReached', 'desc'), limit(50));
        const snap = await getDocs(q);
        setEntries(snap.docs.map((d, i) => ({ rank: i + 1, ...d.data() } as LeaderboardEntry)));
      } catch {
        setEntries([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0d0d1a 0%, #1a0a2e 50%, #0d1a2e 100%)', padding: 24 }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
          <button onClick={() => navigate('/')} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: 'white', width: 40, height: 40, borderRadius: 10, cursor: 'pointer', fontSize: 18 }}>←</button>
          <div>
            <h1 style={{ color: 'white', fontWeight: 800, fontSize: 26, margin: 0 }}>Leaderboard</h1>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, margin: 0 }}>Top players worldwide</p>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 48 }}>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 16 }}>Loading...</p>
          </div>
        ) : entries.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 64 }}>
            <p style={{ fontSize: 64, marginBottom: 16 }}>🏆</p>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 16 }}>No entries yet. Be the first!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {entries.map((entry) => (
              <div key={entry.playerId} style={{
                display: 'flex', alignItems: 'center', gap: 16,
                background: entry.rank <= 3 ? 'rgba(255,215,0,0.06)' : 'rgba(255,255,255,0.04)',
                border: entry.rank <= 3 ? '1px solid rgba(255,215,0,0.2)' : '1px solid rgba(255,255,255,0.07)',
                borderRadius: 14, padding: '14px 18px',
              }}>
                <span style={{ fontSize: 20, fontWeight: 800, width: 32, textAlign: 'center', color: entry.rank <= 3 ? RANK_COLORS[entry.rank - 1] : 'rgba(255,255,255,0.3)' }}>
                  {entry.rank <= 3 ? ['🥇','🥈','🥉'][entry.rank - 1] : entry.rank}
                </span>
                <span style={{ fontSize: 24 }}>{CLASS_ICONS[entry.characterClass] ?? '⚔️'}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ color: 'white', fontWeight: 700, margin: '0 0 2px', fontSize: 15 }}>{entry.playerName}</p>
                  <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, margin: 0 }}>{entry.characterName} · Level {entry.levelReached}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ color: '#e94560', fontWeight: 700, margin: '0 0 2px', fontSize: 14 }}>{entry.totalKills} kills</p>
                  <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, margin: 0, textTransform: 'capitalize' }}>{entry.gameMode}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
