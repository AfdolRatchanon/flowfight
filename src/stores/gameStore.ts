import { create } from 'zustand';
import type { Player, Character, GameMode } from '../types/game.types';

interface GameState {
  player: Player | null;
  character: Character | null;
  isLoading: boolean;
  error: string | null;
  gameMode: GameMode;
  dailyFarmPlays: Record<string, number>;

  setPlayer: (player: Player | null) => void;
  setCharacter: (character: Character | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setGameMode: (mode: GameMode) => void;
  setDailyFarmPlays: (plays: Record<string, number>) => void;
  logout: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  player: null,
  character: null,
  isLoading: true,  // start true — Firebase auth resolves asynchronously on refresh
  error: null,
  gameMode: 'normal',
  dailyFarmPlays: {},

  setPlayer: (player) => set({ player }),
  setCharacter: (character) => set({ character }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setGameMode: (gameMode) => set({ gameMode }),
  setDailyFarmPlays: (dailyFarmPlays) => set({ dailyFarmPlays }),
  logout: () => set({ player: null, character: null, dailyFarmPlays: {}, error: null }),
}));
