import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export type Theme = 'dark' | 'light';

export interface ThemeColors {
  bg: string;
  bgGrad: string;
  bgCard: string;
  bgSurface: string;
  bgSurfaceHover: string;
  text: string;
  textSub: string;
  textMuted: string;
  border: string;
  borderSubtle: string;
  rfBg: string;
}

// ── Classic (backup) ─────────────────────────────────────────────────────────
// เปลี่ยนกลับได้โดย: export const DARK = DARK_CLASSIC;
export const DARK_CLASSIC: ThemeColors = {
  bg: '#0d0d1a',
  bgGrad: 'linear-gradient(135deg, #0d0d1a 0%, #1a0a2e 50%, #0d1a2e 100%)',
  bgCard: 'rgba(26,26,62,0.95)',
  bgSurface: 'rgba(255,255,255,0.04)',
  bgSurfaceHover: 'rgba(255,255,255,0.08)',
  text: '#e2e8f0',
  textSub: 'rgba(255,255,255,0.6)',
  textMuted: 'rgba(255,255,255,0.3)',
  border: 'rgba(255,255,255,0.1)',
  borderSubtle: 'rgba(255,255,255,0.07)',
  rfBg: '#080815',
};

// ── Dark Medieval ─────────────────────────────────────────────────────────────
export const DARK: ThemeColors = {
  bg: '#0E0B1A',
  bgGrad: 'linear-gradient(135deg, #0E0B1A 0%, #180F2E 50%, #0E1525 100%)',
  bgCard: 'rgba(22,16,42,0.97)',
  bgSurface: 'rgba(251,191,36,0.05)',
  bgSurfaceHover: 'rgba(251,191,36,0.10)',
  text: '#F5F0E8',
  textSub: 'rgba(245,240,232,0.65)',
  textMuted: 'rgba(245,240,232,0.35)',
  border: 'rgba(251,191,36,0.18)',
  borderSubtle: 'rgba(251,191,36,0.09)',
  rfBg: '#090716',
};

export const LIGHT: ThemeColors = {
  bg: '#f0f2f8',
  bgGrad: 'linear-gradient(135deg, #e8ecf5 0%, #ede8f5 50%, #e8eef5 100%)',
  bgCard: 'rgba(255,255,255,0.97)',
  bgSurface: 'rgba(0,0,0,0.04)',
  bgSurfaceHover: 'rgba(0,0,0,0.08)',
  text: '#1a1a3e',
  textSub: 'rgba(0,0,0,0.6)',
  textMuted: 'rgba(0,0,0,0.4)',
  border: 'rgba(0,0,0,0.12)',
  borderSubtle: 'rgba(0,0,0,0.08)',
  rfBg: '#dde3f0',
};

interface ThemeContextValue {
  theme: Theme;
  colors: ThemeColors;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dark',
  colors: DARK,
  toggle: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem('ff-theme') as Theme) ?? 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('ff-theme', theme);
    document.body.style.background = theme === 'dark' ? DARK.bg : LIGHT.bg;
    document.body.style.color = theme === 'dark' ? DARK.text : LIGHT.text;
  }, [theme]);

  const toggle = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  return (
    <ThemeContext.Provider value={{ theme, colors: theme === 'dark' ? DARK : LIGHT, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
