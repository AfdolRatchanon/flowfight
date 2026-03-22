import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../services/authService';
import {
  getTeacherCodes, createTeacherCode, deleteTeacherCode,
  type TeacherCodeDoc,
} from '../../services/teacherService';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebaseService';
import { useGameStore } from '../../stores/gameStore';
import { useTheme } from '../../contexts/ThemeContext';
import { LEVELS } from '../../utils/constants';
import VolumeButton from '../UI/VolumeButton';

interface UserRecord {
  uid: string;
  username?: string;
  firstName?: string;
  surname?: string;
  email?: string;
  role?: string;
  levelsCompleted?: string[];
  levelScores?: Record<string, number>;
  lastActive?: number;
  createdAt?: number;
}

export default function AdminDashboard() {
  const { colors } = useTheme();
  const { player } = useGameStore();
  const navigate = useNavigate();

  const [codes, setCodes] = useState<TeacherCodeDoc[]>([]);
  const [newCode, setNewCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [codeSaving, setCodeSaving] = useState(false);

  const [activeTab, setActiveTab] = useState<'codes' | 'users'>('codes');
  const [userCount, setUserCount]       = useState<number | null>(null);
  const [classroomCount, setClassroomCount] = useState<number | null>(null);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);

  useEffect(() => {
    loadCodes();
    loadStats();
  }, []);

  async function loadCodes() {
    const list = await getTeacherCodes();
    list.sort((a, b) => b.createdAt - a.createdAt);
    setCodes(list);
  }

  async function loadStats() {
    try {
      const [usersSnap, classSnap] = await Promise.all([
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'classrooms')),
      ]);
      setUserCount(usersSnap.size);
      setClassroomCount(classSnap.size);
    } catch {
      setUserCount(-1);
      setClassroomCount(-1);
    }
  }

  async function loadUsers() {
    setUsersLoading(true);
    try {
      const snap = await getDocs(collection(db, 'users'));
      const list: UserRecord[] = snap.docs.map((d) => ({ uid: d.id, ...d.data() } as UserRecord));
      list.sort((a, b) => (b.lastActive ?? 0) - (a.lastActive ?? 0));
      setUsers(list);
    } finally {
      setUsersLoading(false);
    }
  }

  async function handleCreateCode() {
    setCodeError('');
    if (!newCode.trim()) { setCodeError('ใส่รหัสที่ต้องการสร้าง'); return; }
    setCodeSaving(true);
    try {
      await createTeacherCode(newCode);
      setNewCode('');
      await loadCodes();
    } catch (err: unknown) {
      setCodeError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด');
    } finally {
      setCodeSaving(false);
    }
  }

  async function handleDeleteCode(code: string) {
    if (!confirm(`ลบรหัส ${code} ?`)) return;
    await deleteTeacherCode(code);
    await loadCodes();
  }

  const card: React.CSSProperties = {
    background: colors.bgSurface,
    border: `1px solid ${colors.border}`,
    borderRadius: 14, padding: '18px 20px',
  };

  const availableCodes = codes.filter((c) => !c.usedBy);
  const usedCodes      = codes.filter((c) => c.usedBy);

  return (
    <div style={{ minHeight: '100vh', background: colors.bgGrad, padding: 24, position: 'relative' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate('/')} style={{
            background: colors.bgSurface, border: `1px solid ${colors.borderSubtle}`,
            color: colors.text, width: 40, height: 40, borderRadius: 10, cursor: 'pointer', fontSize: 18, flexShrink: 0,
          }}>←</button>
          <div>
            <h1 style={{ fontFamily: "'Cinzel', serif", color: '#FBBF24', fontSize: 26, margin: 0 }}>
              Admin Dashboard
            </h1>
            <p style={{ color: colors.textMuted, fontSize: 13, margin: '4px 0 0' }}>
              {player?.username} · role: admin
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <VolumeButton variant="header" />
          <button onClick={() => logout()} style={{
            padding: '8px 16px', borderRadius: 10,
            border: `1px solid ${colors.borderSubtle}`, background: 'transparent',
            color: colors.textMuted, fontSize: 13, cursor: 'pointer',
          }}>ออกจากระบบ</button>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 28, flexWrap: 'wrap' }}>
        {[
          { label: 'ผู้ใช้ทั้งหมด', value: userCount, icon: '👤' },
          { label: 'ห้องเรียน', value: classroomCount, icon: '🏫' },
          { label: 'Invite Codes (ว่าง)', value: availableCodes.length, icon: '🎟️' },
          { label: 'Invite Codes (ใช้แล้ว)', value: usedCodes.length, icon: '✅' },
        ].map((s) => (
          <div key={s.label} style={{
            ...card, minWidth: 140, flex: 1,
            display: 'flex', flexDirection: 'column', gap: 4,
          }}>
            <span style={{ fontSize: 22 }}>{s.icon}</span>
            <span style={{ color: s.value === -1 ? '#f87171' : '#FBBF24', fontSize: 28, fontWeight: 800 }}>
              {s.value === null ? '…' : s.value === -1 ? '?' : s.value}
            </span>
            <span style={{ color: colors.textMuted, fontSize: 12 }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
        {([
          { key: 'codes', label: 'Invite Codes' },
          { key: 'users', label: `ผู้ใช้ทั้งหมด${userCount !== null && userCount >= 0 ? ` (${userCount})` : ''}` },
        ] as const).map(({ key, label }) => (
          <button key={key} onClick={() => { setActiveTab(key); if (key === 'users' && users.length === 0) loadUsers(); }} style={{
            padding: '8px 20px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer',
            border: activeTab === key ? '1px solid rgba(251,191,36,0.5)' : `1px solid ${colors.border}`,
            background: activeTab === key ? 'rgba(251,191,36,0.1)' : 'transparent',
            color: activeTab === key ? '#FBBF24' : colors.textMuted,
          }}>{label}</button>
        ))}
      </div>

      {activeTab === 'users' ? (
        <div>
          {usersLoading ? (
            <p style={{ color: colors.textMuted, fontSize: 13 }}>กำลังโหลด...</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 150px 80px 80px 80px 100px', gap: 10, padding: '4px 14px' }}>
                {['ชื่อ / Username', 'อีเมล', 'Role', 'ด่าน', 'Avg Score', 'เล่นล่าสุด'].map((h) => (
                  <span key={h} style={{ color: colors.textMuted, fontSize: 11, fontWeight: 700 }}>{h}</span>
                ))}
              </div>
              {users.map((u) => {
                const displayName = u.firstName && u.surname
                  ? `${u.firstName} ${u.surname}`
                  : (u.username ?? u.uid.slice(0, 10) + '…');
                const levelsDone = (u.levelsCompleted ?? []).length;
                const scores = Object.values(u.levelScores ?? {});
                const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
                const lastActive = u.lastActive
                  ? new Date(u.lastActive).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })
                  : '—';
                const roleColor = u.role === 'admin' ? '#a78bfa' : u.role === 'teacher' ? '#FBBF24' : colors.textMuted;
                return (
                  <div key={u.uid} style={{
                    ...card, display: 'grid',
                    gridTemplateColumns: '1fr 150px 80px 80px 80px 100px', gap: 10, alignItems: 'center', padding: '10px 14px',
                  }}>
                    <div>
                      <span style={{ color: colors.text, fontWeight: 600, fontSize: 13 }}>{displayName}</span>
                      {u.username && u.firstName && (
                        <span style={{ color: colors.textMuted, fontSize: 10, display: 'block' }}>{u.username}</span>
                      )}
                    </div>
                    <span style={{ color: colors.textMuted, fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {u.email || '—'}
                    </span>
                    <span style={{ color: roleColor, fontWeight: 700, fontSize: 12 }}>
                      {u.role ?? 'student'}
                    </span>
                    <span style={{ color: '#FBBF24', fontWeight: 700, fontSize: 13 }}>
                      {levelsDone}/{LEVELS.length}
                    </span>
                    <span style={{
                      color: avgScore === null ? colors.textMuted : avgScore >= 70 ? '#4ade80' : avgScore >= 50 ? '#FBBF24' : '#f87171',
                      fontWeight: avgScore !== null ? 700 : 400, fontSize: 13,
                    }}>
                      {avgScore !== null ? avgScore : '—'}
                    </span>
                    <span style={{ color: colors.textMuted, fontSize: 11 }}>{lastActive}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>

        {/* Create invite code */}
        <div style={{ ...card, width: 300, flexShrink: 0 }}>
          <p style={{ color: colors.textSub, fontWeight: 700, fontSize: 14, margin: '0 0 14px' }}>
            สร้าง Teacher Invite Code
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              placeholder="เช่น TEACHER01"
              value={newCode}
              onChange={(e) => setNewCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => { if (e.key === 'Enter') handleCreateCode(); }}
              maxLength={16}
              style={{
                flex: 1, padding: '9px 12px', borderRadius: 8,
                background: 'rgba(0,0,0,0.3)', border: `1px solid ${colors.border}`,
                color: '#FBBF24', fontSize: 13, fontWeight: 700, letterSpacing: 2,
              }}
            />
            <button onClick={handleCreateCode} disabled={codeSaving} style={{
              padding: '9px 14px', borderRadius: 8,
              border: '1px solid rgba(251,191,36,0.4)',
              background: 'rgba(251,191,36,0.12)',
              color: '#FBBF24', fontWeight: 700, fontSize: 13, cursor: 'pointer',
            }}>
              {codeSaving ? '…' : '+ สร้าง'}
            </button>
          </div>
          {codeError && (
            <p style={{ color: '#f87171', fontSize: 12, margin: '8px 0 0' }}>{codeError}</p>
          )}
        </div>

        {/* Invite codes list */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ color: colors.textSub, fontWeight: 700, fontSize: 14, margin: '0 0 12px' }}>
            Invite Codes ทั้งหมด ({codes.length})
          </p>
          {codes.length === 0 ? (
            <div style={{ ...card, textAlign: 'center', padding: 32 }}>
              <p style={{ color: colors.textMuted, fontSize: 13 }}>ยังไม่มี invite code</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {codes.map((c) => (
                <div key={c.code} style={{
                  ...card, display: 'flex', alignItems: 'center', gap: 16,
                  borderColor: c.usedBy ? colors.borderSubtle : 'rgba(251,191,36,0.3)',
                  opacity: c.usedBy ? 0.6 : 1,
                }}>
                  <span style={{
                    color: c.usedBy ? colors.textMuted : '#FBBF24',
                    fontWeight: 800, fontSize: 16, letterSpacing: 3, minWidth: 120,
                  }}>{c.code}</span>

                  <span style={{
                    fontSize: 11, padding: '3px 8px', borderRadius: 6,
                    background: c.usedBy ? 'rgba(74,222,128,0.12)' : 'rgba(251,191,36,0.1)',
                    color: c.usedBy ? '#4ade80' : '#FBBF24',
                    fontWeight: 700,
                  }}>
                    {c.usedBy ? 'ใช้แล้ว' : 'ว่าง'}
                  </span>

                  {c.usedBy && (
                    <span style={{ color: colors.textMuted, fontSize: 11, flex: 1 }}>
                      UID: {c.usedBy.slice(0, 12)}…
                    </span>
                  )}

                  <span style={{ flex: 1, color: colors.textMuted, fontSize: 11 }}>
                    {new Date(c.createdAt).toLocaleDateString('th-TH')}
                  </span>

                  {!c.usedBy && (
                    <button onClick={() => handleDeleteCode(c.code)} style={{
                      padding: '4px 10px', borderRadius: 6,
                      border: '1px solid rgba(248,113,113,0.3)',
                      background: 'rgba(248,113,113,0.08)',
                      color: '#f87171', fontSize: 11, cursor: 'pointer',
                    }}>ลบ</button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      )}
    </div>
  );
}
