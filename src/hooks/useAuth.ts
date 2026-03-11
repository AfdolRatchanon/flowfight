import { useEffect } from 'react';
import type { User } from 'firebase/auth';
import { onAuthChange, getPlayerProfile } from '../services/authService';
import { useGameStore } from '../stores/gameStore';
import type { Character } from '../types/game.types';

export function useAuth() {
  const { player, setPlayer, setLoading, setCharacter } = useGameStore();

  useEffect(() => {
    setLoading(true);
    const unsubscribe = onAuthChange(async (user: User | null) => {
      if (user) {
        try {
          const profile = await getPlayerProfile(user.uid);
          if (profile) {
            // ถ้า Firestore ไม่มี username ให้ fallback จาก Firebase Auth
            if (!profile.username) {
              profile.username = user.displayName ?? user.email?.split('@')[0] ?? 'Player';
            }
            setPlayer(profile);
            // Restore character progress (per-class map format)
            if (profile.characterProgress && profile.lastPlayedClass) {
              const cp = profile.characterProgress[profile.lastPlayedClass];
              if (cp) {
                const cls = profile.lastPlayedClass;
                const restoredChar: Character = {
                  id: `char_${user.uid}_${cls}`,
                  playerId: user.uid,
                  name: cp.name ?? profile.username,
                  class: cls,
                  level: cp.level,
                  experience: cp.experience,
                  stats: { maxHP: cp.maxHP, currentHP: cp.maxHP, attack: cp.attack, defense: cp.defense, speed: cp.speed },
                  appearance: { skinId: `${cls}_blue`, colors: { primary: '#1a1a2e', secondary: '#16213e', accent: '#e94560' } },
                  equipment: { weapon: null, armor: null, head: null, accessory: null },
                  gameMode: 'normal',
                  isAlive: true,
                  currentLevel: 1,
                  createdAt: Date.now(),
                  lastModified: Date.now(),
                };
                setCharacter(restoredChar);
              }
            }
          } else {
            // Profile doesn't exist in Firestore yet — use Firebase Auth data as fallback
            setPlayer({
              id: user.uid,
              username: user.displayName ?? user.email?.split('@')[0] ?? 'Player',
              email: user.email ?? '',
              levelsCompleted: [],
              createdAt: Date.now(),
              lastActive: Date.now(),
              stats: { totalKills: 0, totalDefeats: 0, levelReached: 1, totalPlayTime: 0 },
              preferences: { difficulty: 'normal', soundEnabled: true, musicVolume: 0.7, sfxVolume: 0.8 },
            });
          }
        } catch {
          // Even if Firestore fails, keep the user logged in with minimal data
          setPlayer({
            id: user.uid,
            username: user.displayName ?? user.email?.split('@')[0] ?? 'Player',
            email: user.email ?? '',
            levelsCompleted: [],
            createdAt: Date.now(),
            lastActive: Date.now(),
            stats: { totalKills: 0, totalDefeats: 0, levelReached: 1, totalPlayTime: 0 },
            preferences: { difficulty: 'normal', soundEnabled: true, musicVolume: 0.7, sfxVolume: 0.8 },
          });
        }
      } else {
        setPlayer(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return { player, isAuthenticated: !!player };
}
