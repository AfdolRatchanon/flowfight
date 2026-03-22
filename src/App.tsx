import React, { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { soundManager, type BGMKey } from './services/soundManager';
import { useAuth } from './hooks/useAuth';
import { useGameStore } from './stores/gameStore';
import { useTheme } from './contexts/ThemeContext';
import LoginPage from './components/Auth/LoginPage';
import MainMenu from './components/UI/MainMenu';
import ThemeToggle from './components/UI/ThemeToggle';
import TeacherRegisterPage from './components/Auth/TeacherRegisterPage';

const ModeSelect        = lazy(() => import('./components/UI/ModeSelect'));
const LevelSelect       = lazy(() => import('./components/UI/LevelSelect'));
const BattleScreen      = lazy(() => import('./components/Battle/BattleScreen'));
const CharacterCustomizer = lazy(() => import('./components/Character/CharacterCustomizer'));
const Leaderboard       = lazy(() => import('./components/UI/Leaderboard'));
const ShopPage          = lazy(() => import('./components/Shop/ShopPage'));
const InfinityDevScreen = lazy(() => import('./modes/InfinityDev/InfinityDevScreen'));
const TeacherDashboard  = lazy(() => import('./components/Teacher/TeacherDashboard'));
const AdminDashboard    = lazy(() => import('./components/Admin/AdminDashboard'));
const AchievementsPage  = lazy(() => import('./components/UI/AchievementsPage'));
const CertificatePage   = lazy(() => import('./components/UI/CertificatePage'));
const SandboxMode       = lazy(() => import('./components/UI/SandboxMode'));
const ClassroomLeaderboard = lazy(() => import('./components/UI/ClassroomLeaderboard'));

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isLoading, player, character } = useGameStore();
  const { colors } = useTheme();
  const location = useLocation();

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: colors.bgGrad,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 64, marginBottom: 16 }}>⚔️</p>
          <p style={{ color: colors.text, fontSize: 20 }}>Loading FlowFight...</p>
        </div>
      </div>
    );
  }

  if (!player) return <Navigate to="/login" replace />;

  const role = player.role ?? 'student';

  // ป้องกันผู้ใช้ที่ไม่มีสิทธิ์เข้า privileged routes โดยตรง
  if (location.pathname.startsWith('/admin') && role !== 'admin') {
    return <Navigate to="/" replace />;
  }
  if (location.pathname.startsWith('/teacher') && role !== 'teacher' && role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  // ครู → ไป teacher dashboard ทันที (ไม่ต้องมีตัวละคร)
  if (role === 'teacher' && !location.pathname.startsWith('/teacher')) {
    return <Navigate to="/teacher" replace />;
  }

  // admin เข้าถึงได้ทุก route — ไม่บังคับสร้างตัวละคร
  // ผู้เล่นใหม่ที่ยังไม่มีตัวละคร ต้องสร้างตัวละครก่อนเสมอ (ยกเว้น teacher และ admin)
  if (role !== 'teacher' && role !== 'admin' && !character && location.pathname !== '/character') {
    return <Navigate to="/character" replace />;
  }

  return <>{children}</>;
}

function BGMController() {
  const location = useLocation();
  useEffect(() => {
    const path = location.pathname;
    let key: BGMKey | null = null;
    if (path.startsWith('/battle') || path.startsWith('/custom-battle') || path.startsWith('/infinity-dev')) key = path.startsWith('/infinity-dev') ? 'endless' : 'battle';
    else if (path === '/levels/tutorial' || path === '/levels') key = 'level-select';
    else if (path === '/login') key = null;
    else key = 'menu';
    if (key) soundManager.playBGM(key);
    else soundManager.stopBGM();
  }, [location.pathname]);
  return null;
}

export default function App() {
  // เรียก useAuth() ครั้งเดียวที่ root เพื่อ subscribe Firebase Auth
  useAuth();

  return (
    <Router>
      <BGMController />
      <ThemeToggle />
      <Suspense fallback={null}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/teacher-register" element={<TeacherRegisterPage />} />
          <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
          <Route path="/teacher" element={<ProtectedRoute><TeacherDashboard /></ProtectedRoute>} />
          <Route path="/" element={<ProtectedRoute><MainMenu /></ProtectedRoute>} />
          <Route path="/levels" element={<ProtectedRoute><ModeSelect /></ProtectedRoute>} />
          <Route path="/levels/tutorial" element={<ProtectedRoute><LevelSelect /></ProtectedRoute>} />
          <Route path="/battle/:levelId" element={<ProtectedRoute><BattleScreen /></ProtectedRoute>} />
          <Route path="/custom-battle/:levelId" element={<ProtectedRoute><BattleScreen /></ProtectedRoute>} />
          <Route path="/character" element={<ProtectedRoute><CharacterCustomizer /></ProtectedRoute>} />
          <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
          <Route path="/shop" element={<ProtectedRoute><ShopPage /></ProtectedRoute>} />
          <Route path="/infinity-dev" element={<ProtectedRoute><InfinityDevScreen /></ProtectedRoute>} />
          <Route path="/infinity-dev/battle" element={<ProtectedRoute><InfinityDevScreen /></ProtectedRoute>} />
          <Route path="/achievements" element={<ProtectedRoute><AchievementsPage /></ProtectedRoute>} />
          <Route path="/certificate" element={<ProtectedRoute><CertificatePage /></ProtectedRoute>} />
          <Route path="/sandbox" element={<ProtectedRoute><SandboxMode /></ProtectedRoute>} />
          <Route path="/classroom-leaderboard" element={<ProtectedRoute><ClassroomLeaderboard /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Router>
  );
}
