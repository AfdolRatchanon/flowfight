import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginWithEmail, loginWithGoogle, loginAnonymous, registerWithEmail, resetPassword } from '../../services/authService';
import { useGameStore } from '../../stores/gameStore';

type Mode = 'login' | 'register' | 'guest' | 'reset';

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [surname, setSurname] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { player } = useGameStore();

  useEffect(() => {
    if (player) navigate('/', { replace: true });
  }, [player, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setMessage(''); setLoading(true);
    try {
      if (mode === 'login') await loginWithEmail(email, password);
      else if (mode === 'register') {
        if (!username.trim()) throw new Error('Username is required');
        await registerWithEmail(email, password, username);
      } else if (mode === 'guest') {
        if (!firstName.trim()) throw new Error('Please enter your first name');
        if (!surname.trim()) throw new Error('Please enter your surname');
        await loginAnonymous(firstName.trim(), surname.trim());
      } else {
        await resetPassword(email);
        setMessage('Password reset email sent!');
      }
    } catch (err: any) {
      setError(err.message ?? 'An error occurred');
    } finally { setLoading(false); }
  }

  async function handleGoogle() {
    setError(''); setLoading(true);
    try { await loginWithGoogle(); }
    catch (err: any) { setError(err.message ?? 'Google sign-in failed'); }
    finally { setLoading(false); }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0d0d1a 0%, #1a0a2e 50%, #0d1a2e 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Background orbs */}
      <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)', top: -100, right: -100, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(233,69,96,0.12) 0%, transparent 70%)', bottom: -50, left: -50, pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: 420, position: 'relative' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div className="float" style={{ fontSize: 64, marginBottom: 12 }}>⚔️</div>
          <h1 style={{ fontSize: 36, fontWeight: 800, background: 'linear-gradient(135deg, #e94560, #7c3aed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: 2, marginBottom: 6 }}>
            FLOWFIGHT
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, letterSpacing: 3, textTransform: 'uppercase' }}>
            Flowchart Battle RPG
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: 'rgba(26,26,62,0.8)', backdropFilter: 'blur(20px)',
          border: '1px solid rgba(124,58,237,0.3)', borderRadius: 20,
          padding: 32, boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
        }}>
          {/* Tabs */}
          {mode !== 'reset' && (
            <div style={{ display: 'flex', gap: 3, marginBottom: 24, background: 'rgba(0,0,0,0.3)', borderRadius: 10, padding: 4 }}>
              {([['login','Sign In'],['register','Register'],['guest','Guest']] as [Mode,string][]).map(([m, label]) => (
                <button key={m} onClick={() => { setMode(m); setError(''); }}
                  style={{
                    flex: 1, padding: '9px 4px', borderRadius: 8, border: 'none', cursor: 'pointer',
                    fontWeight: 600, fontSize: 12, transition: 'all 0.2s',
                    background: mode === m ? 'linear-gradient(135deg, #e94560, #7c3aed)' : 'transparent',
                    color: mode === m ? 'white' : 'rgba(255,255,255,0.5)',
                  }}>
                  {label}
                </button>
              ))}
            </div>
          )}

          {/* Guest notice */}
          {mode === 'guest' && (
            <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: '#fbbf24' }}>
              เล่นแบบ Guest — ไม่ต้องสมัครสมาชิก บันทึกข้อมูลชั่วคราว
            </div>
          )}

          {error && (
            <div style={{ background: 'rgba(233,69,96,0.15)', border: '1px solid rgba(233,69,96,0.4)', color: '#ff8099', borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: 13 }}>
              ⚠️ {error}
            </div>
          )}
          {message && (
            <div style={{ background: 'rgba(74,222,128,0.15)', border: '1px solid rgba(74,222,128,0.4)', color: '#4ade80', borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: 13 }}>
              ✅ {message}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {mode === 'register' && (
              <input className="input-field" type="text" placeholder="👤  Username" value={username}
                onChange={(e) => setUsername(e.target.value)} />
            )}
            {mode === 'guest' && (
              <>
                <input className="input-field" type="text" placeholder="✏️  ชื่อจริง (First Name)" value={firstName}
                  onChange={(e) => setFirstName(e.target.value)} autoFocus />
                <input className="input-field" type="text" placeholder="✏️  นามสกุล (Surname)" value={surname}
                  onChange={(e) => setSurname(e.target.value)} />
              </>
            )}
            {mode !== 'guest' && (
              <input className="input-field" type="email" placeholder="📧  Email" value={email}
                onChange={(e) => setEmail(e.target.value)} required />
            )}
            {(mode === 'login' || mode === 'register') && (
              <input className="input-field" type="password" placeholder="🔒  Password" value={password}
                onChange={(e) => setPassword(e.target.value)} required />
            )}
            {mode === 'reset' && (
              <input className="input-field" type="email" placeholder="📧  Email" value={email}
                onChange={(e) => setEmail(e.target.value)} required />
            )}
            <button type="submit" disabled={loading} className="btn-primary" style={{ marginTop: 4, fontSize: 15, padding: '14px' }}>
              {loading ? '⏳ Loading...'
                : mode === 'login'    ? '🚀 Sign In'
                : mode === 'register' ? '✨ Create Account'
                : mode === 'guest'    ? '👤 เล่นเลย (Play as Guest)'
                : '📧 Send Reset Email'}
            </button>
          </form>

          {(mode === 'login' || mode === 'register') && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0', gap: 12 }}>
                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
                <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>OR</span>
                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
              </div>
              <button onClick={handleGoogle} disabled={loading} className="btn-secondary"
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontSize: 14 }}>
                <span style={{ fontSize: 18 }}>G</span> Continue with Google
              </button>
            </>
          )}

          <div style={{ marginTop: 20, textAlign: 'center' }}>
            {mode === 'login' && (
              <button onClick={() => { setMode('reset'); setError(''); }}
                style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, background: 'none', border: 'none', cursor: 'pointer' }}>
                Forgot password?
              </button>
            )}
            {mode === 'reset' && (
              <button onClick={() => { setMode('login'); setError(''); }}
                style={{ color: '#7c3aed', fontSize: 13, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                ← Back to Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
