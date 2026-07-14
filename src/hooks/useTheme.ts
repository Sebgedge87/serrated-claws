import { createElement, createContext, useContext, useEffect, useState, type ReactNode } from 'react';

type Theme = 'dark' | 'light';
interface ThemeCtx { theme: Theme; toggleTheme: () => void; }

const ThemeContext = createContext<ThemeCtx | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    try { return (localStorage.getItem('theme') as Theme) ?? 'dark'; }
    catch (e) { console.warn('localStorage unavailable:', e); return 'dark'; }
  });
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem('theme', theme); }
    catch (e) { console.warn('localStorage unavailable:', e); }
  }, [theme]);
  return createElement(
    ThemeContext.Provider,
    { value: { theme, toggleTheme: () => setTheme(t => t === 'dark' ? 'light' : 'dark') } },
    children
  );
}

export function useTheme(): ThemeCtx {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
