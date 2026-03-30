import { useState } from 'react';
import { joinClassroom } from '../../services/teacherService';
import { useTheme } from '../../contexts/ThemeContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebaseService';
import ConfirmModal from './ConfirmModal';

interface Props {
  uid: string;
  currentCode?: string;
  initialCode?: string;
  onClose: () => void;
  onJoined: (className: string, code: string) => void;
}

export default function JoinClassroomModal({ uid, currentCode, initialCode, onClose, onJoined }: Props) {
  const { colors } = useTheme();
  const [code, setCode] = useState(initialCode ?? '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  async function handleJoin() {
    setError(''); setLoading(true);
    try {
      const className = await joinClassroom(uid, code.trim());
      onJoined(className, code.trim());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  }

  async function handleLeave() {
    if (!currentCode) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', uid), { classroomCode: null });
      onJoined('', '');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: colors.bgCard, borderRadius: 20,
        border: `1px solid ${colors.border}`, padding: 28,
        width: '100%', maxWidth: 360,
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
      }}>
        <h2 style={{ fontFamily: "'Cinzel', serif", color: '#FBBF24', fontSize: 18, margin: '0 0 6px' }}>
          เข้าร่วมห้องเรียน
        </h2>

        {currentCode && (
          <div style={{
            background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)',
            borderRadius: 10, padding: '10px 14px', marginBottom: 16,
          }}>
            <p style={{ color: colors.textSub, fontSize: 12, margin: '0 0 4px' }}>ห้องเรียนปัจจุบัน</p>
            <p style={{ color: '#FBBF24', fontWeight: 700, fontSize: 18, letterSpacing: 3, margin: 0 }}>
              {currentCode}
            </p>
            <button onClick={() => setShowLeaveConfirm(true)} disabled={loading} style={{
              marginTop: 8, padding: '4px 12px', borderRadius: 6,
              border: '1px solid rgba(248,113,113,0.4)', background: 'rgba(248,113,113,0.1)',
              color: '#f87171', fontSize: 12, cursor: 'pointer',
            }}>ออกจากห้องเรียน</button>
          </div>
        )}

        <p style={{ color: colors.textMuted, fontSize: 13, margin: '0 0 14px' }}>
          ใส่รหัส 6 หลักที่ครูให้
        </p>

        <input
          placeholder="เช่น 123456"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          maxLength={6}
          style={{
            width: '100%', padding: '10px 14px', borderRadius: 10,
            background: colors.bgSurface, border: `1px solid ${colors.border}`,
            color: colors.text, fontSize: 22, fontWeight: 700, letterSpacing: 6,
            textAlign: 'center', marginBottom: 12,
          }}
        />

        {error && <p style={{ color: '#f87171', fontSize: 13, margin: '0 0 10px', textAlign: 'center' }}>{error}</p>}

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onClose} style={{
            flex: 1, padding: '10px', borderRadius: 10,
            border: `1px solid ${colors.borderSubtle}`, background: 'transparent',
            color: colors.textMuted, fontSize: 13, cursor: 'pointer',
          }}>ยกเลิก</button>
          <button onClick={handleJoin} disabled={loading || code.length !== 6} style={{
            flex: 2, padding: '10px', borderRadius: 10,
            border: '1px solid rgba(251,191,36,0.4)', background: 'rgba(251,191,36,0.12)',
            color: '#FBBF24', fontWeight: 700, fontSize: 14, cursor: 'pointer',
            opacity: code.length !== 6 ? 0.5 : 1,
          }}>{loading ? 'กำลังเข้าร่วม...' : 'เข้าร่วมห้องเรียน'}</button>
        </div>
      </div>
      {showLeaveConfirm && (
        <ConfirmModal
          title="ออกจากห้องเรียน?"
          message="คุณจะถูกลบออกจากห้องเรียนนี้ และต้องใช้รหัสใหม่เพื่อเข้าร่วมอีกครั้ง"
          confirmLabel="ออกจากห้องเรียน"
          danger
          loading={loading}
          onConfirm={handleLeave}
          onCancel={() => setShowLeaveConfirm(false)}
        />
      )}
    </div>
  );
}
