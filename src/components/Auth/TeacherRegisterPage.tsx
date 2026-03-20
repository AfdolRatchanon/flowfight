import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerTeacher } from '../../services/teacherService';
import { useTheme } from '../../contexts/ThemeContext';

export default function TeacherRegisterPage() {
  const { colors } = useTheme();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await registerTeacher(email, password, name, inviteCode);
      navigate('/teacher', { replace: true });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: 10,
    background: colors.bgSurface, border: `1px solid ${colors.border}`,
    color: colors.text, fontSize: 14, outline: 'none',
  };

  return (
    <div style={{
      minHeight: '100vh', background: colors.bgGrad,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div style={{
        width: '100%', maxWidth: 420,
        background: colors.bgCard, borderRadius: 20,
        border: `1px solid ${colors.border}`, padding: 32,
        boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
      }}>
        <h1 style={{
          fontFamily: "'Cinzel', serif", fontSize: 22, fontWeight: 700,
          color: '#FBBF24', textAlign: 'center', margin: '0 0 6px',
        }}>Teacher Register</h1>
        <p style={{ color: colors.textMuted, fontSize: 13, textAlign: 'center', margin: '0 0 24px' }}>
          สมัครบัญชีครู — ต้องใช้รหัสเชิญจากผู้ดูแลระบบ
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <input
            placeholder="ชื่อ-นามสกุลครู"
            value={name} onChange={(e) => setName(e.target.value)}
            required style={inputStyle}
          />
          <input
            type="email" placeholder="อีเมล"
            value={email} onChange={(e) => setEmail(e.target.value)}
            required style={inputStyle}
          />
          <input
            type="password" placeholder="รหัสผ่าน (อย่างน้อย 6 ตัวอักษร)"
            value={password} onChange={(e) => setPassword(e.target.value)}
            required minLength={6} style={inputStyle}
          />
          <input
            placeholder="รหัสเชิญครู (Invite Code)"
            value={inviteCode} onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
            required maxLength={12}
            style={{ ...inputStyle, letterSpacing: 3, fontWeight: 700, color: '#FBBF24' }}
          />

          {error && (
            <p style={{ color: '#f87171', fontSize: 13, margin: 0, textAlign: 'center' }}>{error}</p>
          )}

          <button
            type="submit" disabled={loading}
            style={{
              padding: '12px', borderRadius: 12, border: '1px solid rgba(251,191,36,0.4)',
              background: loading ? 'rgba(251,191,36,0.1)' : 'rgba(251,191,36,0.15)',
              color: '#FBBF24', fontWeight: 700, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >{loading ? 'กำลังสมัคร...' : 'สมัครบัญชีครู'}</button>

          <button
            type="button" onClick={() => navigate('/login')}
            style={{
              padding: '10px', borderRadius: 12, border: `1px solid ${colors.borderSubtle}`,
              background: 'transparent', color: colors.textMuted, fontSize: 13, cursor: 'pointer',
            }}
          >← กลับหน้า Login</button>
        </form>
      </div>
    </div>
  );
}
