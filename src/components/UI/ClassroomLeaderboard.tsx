import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../../stores/gameStore';
import { getClassroomBoard } from '../../services/authService';
import type { ClassroomBoardEntry } from '../../services/authService';
import { useTheme } from '../../contexts/ThemeContext';
import { LEVELS } from '../../utils/constants';

const TOTAL_LEVELS = LEVELS.length;

export default function ClassroomLeaderboard() {
  const navigate = useNavigate();
  const { player } = useGameStore();
  const { colors } = useTheme();
  const [members, setMembers] = useState<ClassroomBoardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const roomCode = player?.classroomCode;

  useEffect(() => {
    if (!roomCode) { setLoading(false); return; }
    setLoading(true);
    getClassroomBoard(roomCode)
      .then((data) => {
        const sorted = [...data].sort((a, b) =>
          b.levelsCompleted - a.levelsCompleted || b.avgScore - a.avgScore || b.totalXP - a.totalXP
        );
        setMembers(sorted);
      })
      .catch(() => setError('ไม่สามารถโหลดข้อมูลห้องเรียนได้'))
      .finally(() => setLoading(false));
  }, [roomCode]);

  const rankColor = (i: number) =>
    i === 0 ? '#fbbf24' : i === 1 ? '#94a3b8' : i === 2 ? '#f97316' : colors.textMuted;

  const rankLabel = (i: number) =>
    i === 0 ? '1' : i === 1 ? '2' : i === 2 ? '3' : String(i + 1);

  if (!roomCode) {
    return (
      <div style={{ minHeight: '100vh', background: colors.bgGrad, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
        <p style={{ color: colors.textMuted, fontSize: 16 }}>คุณยังไม่ได้เข้าร่วมห้องเรียน</p>
        <button onClick={() => navigate('/')} style={{ color: colors.textMuted, background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 14 }}>
          กลับหน้าหลัก
        </button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: colors.bgGrad, padding: '24px 16px' }}>
      {/* Header */}
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <button
            onClick={() => navigate('/')}
            style={{
              background: 'transparent', border: `1px solid ${colors.borderSubtle}`,
              borderRadius: 8, padding: '6px 12px', color: colors.textMuted,
              cursor: 'pointer', fontSize: 13,
            }}
          >
            ← กลับ
          </button>
          <div>
            <h1 style={{ color: colors.text, fontSize: 20, fontWeight: 800, margin: 0 }}>
              อันดับห้องเรียน
            </h1>
            <p style={{ color: colors.textMuted, fontSize: 12, margin: 0 }}>
              รหัสห้อง: <span style={{ color: '#fbbf24', fontWeight: 700 }}>{roomCode}</span>
            </p>
          </div>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: 48, color: colors.textMuted }}>
            กำลังโหลด...
          </div>
        )}

        {error && (
          <div style={{ textAlign: 'center', padding: 48, color: '#f87171' }}>{error}</div>
        )}

        {!loading && !error && members.length === 0 && (
          <div style={{ textAlign: 'center', padding: 48 }}>
            <p style={{ color: colors.textMuted, fontSize: 14 }}>
              ยังไม่มีข้อมูลในห้องเรียน — เล่นเกมชนะด่านแรกเพื่อแสดงชื่อที่นี่
            </p>
          </div>
        )}

        {!loading && !error && members.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {members.map((m, i) => {
              const isMe = m.uid === player?.id;
              return (
                <div
                  key={m.uid}
                  style={{
                    background: isMe
                      ? 'rgba(124,58,237,0.12)'
                      : colors.bgSurface,
                    border: isMe
                      ? '1px solid rgba(124,58,237,0.5)'
                      : `1px solid ${colors.borderSubtle}`,
                    borderRadius: 12,
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  {/* Rank */}
                  <div style={{
                    width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                    background: i < 3 ? `${rankColor(i)}22` : colors.bgSurface,
                    border: `1px solid ${rankColor(i)}44`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 900, fontSize: i < 3 ? 16 : 13, color: rankColor(i),
                  }}>
                    {rankLabel(i)}
                  </div>

                  {/* Name */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ color: colors.text, fontWeight: 700, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {m.name}
                      </span>
                      {isMe && (
                        <span style={{ fontSize: 10, color: '#7c3aed', fontWeight: 700, background: 'rgba(124,58,237,0.15)', padding: '1px 6px', borderRadius: 4, flexShrink: 0 }}>
                          คุณ
                        </span>
                      )}
                    </div>
                    {/* Progress bar */}
                    <div style={{ width: '100%', height: 4, background: colors.bgSurface, borderRadius: 2, marginTop: 4, overflow: 'hidden' }}>
                      <div style={{
                        width: `${Math.min(100, (m.levelsCompleted / TOTAL_LEVELS) * 100)}%`,
                        height: '100%', borderRadius: 2,
                        background: i < 3 ? rankColor(i) : 'rgba(124,58,237,0.6)',
                      }} />
                    </div>
                  </div>

                  {/* Stats */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2, flexShrink: 0 }}>
                    <span style={{ color: colors.text, fontWeight: 700, fontSize: 13 }}>
                      {m.levelsCompleted}
                      <span style={{ color: colors.textMuted, fontWeight: 400, fontSize: 11 }}>/{TOTAL_LEVELS}</span>
                    </span>
                    <span style={{ color: colors.textMuted, fontSize: 11 }}>
                      avg {m.avgScore}%
                    </span>
                    <span style={{ color: '#fbbf24', fontSize: 10 }}>
                      {m.totalXP.toLocaleString()} XP
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Legend */}
        {!loading && members.length > 0 && (
          <div style={{ marginTop: 16, display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <span style={{ color: colors.textMuted, fontSize: 11 }}>ด่านผ่าน = จำนวนด่านที่ชนะ</span>
            <span style={{ color: colors.textMuted, fontSize: 11 }}>avg = คะแนนเฉลี่ย (0–100)</span>
            <span style={{ color: colors.textMuted, fontSize: 11 }}>XP = ประสบการณ์ตัวละคร</span>
          </div>
        )}
      </div>
    </div>
  );
}
