import { useState, useEffect } from 'react';
import { logout } from '../../services/authService';
import {
  getTeacherCodes, createTeacherCode, deleteTeacherCode,
  type TeacherCodeDoc,
} from '../../services/teacherService';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebaseService';
import { useGameStore } from '../../stores/gameStore';
import { useTheme } from '../../contexts/ThemeContext';
import VolumeButton from '../UI/VolumeButton';

export default function AdminDashboard() {
  const { colors } = useTheme();
  const { player } = useGameStore();

  const [codes, setCodes] = useState<TeacherCodeDoc[]>([]);
  const [newCode, setNewCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [codeSaving, setCodeSaving] = useState(false);

  const [userCount, setUserCount]       = useState<number | null>(null);
  const [classroomCount, setClassroomCount] = useState<number | null>(null);

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
    const [usersSnap, classSnap] = await Promise.all([
      getDocs(collection(db, 'users')),
      getDocs(collection(db, 'classrooms')),
    ]);
    setUserCount(usersSnap.size);
    setClassroomCount(classSnap.size);
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
        <div>
          <h1 style={{ fontFamily: "'Cinzel', serif", color: '#FBBF24', fontSize: 26, margin: 0 }}>
            Admin Dashboard
          </h1>
          <p style={{ color: colors.textMuted, fontSize: 13, margin: '4px 0 0' }}>
            {player?.username} · role: admin
          </p>
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
            <span style={{ color: '#FBBF24', fontSize: 28, fontWeight: 800 }}>
              {s.value ?? '…'}
            </span>
            <span style={{ color: colors.textMuted, fontSize: 12 }}>{s.label}</span>
          </div>
        ))}
      </div>

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
    </div>
  );
}
