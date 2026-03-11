import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { useGameStore } from './stores/gameStore';
import { useTheme } from './contexts/ThemeContext';
import LoginPage from './components/Auth/LoginPage';
import MainMenu from './components/UI/MainMenu';
import LevelSelect from './components/UI/LevelSelect';
import BattleScreen from './components/Battle/BattleScreen';
import CharacterCustomizer from './components/Character/CharacterCustomizer';
import Leaderboard from './components/UI/Leaderboard';
import ShopPage from './components/Shop/ShopPage';
import ThemeToggle from './components/UI/ThemeToggle';

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

  // ผู้เล่นใหม่ที่ยังไม่มีตัวละคร ต้องสร้างตัวละครก่อนเสมอ
  if (!character && location.pathname !== '/character') {
    return <Navigate to="/character" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  // เรียก useAuth() ครั้งเดียวที่ root เพื่อ subscribe Firebase Auth
  useAuth();

  return (
    <Router>
      <ThemeToggle />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<ProtectedRoute><MainMenu /></ProtectedRoute>} />
        <Route path="/levels" element={<ProtectedRoute><LevelSelect /></ProtectedRoute>} />
        <Route path="/battle/:levelId" element={<ProtectedRoute><BattleScreen /></ProtectedRoute>} />
        <Route path="/character" element={<ProtectedRoute><CharacterCustomizer /></ProtectedRoute>} />
        <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
        <Route path="/shop" element={<ProtectedRoute><ShopPage /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
