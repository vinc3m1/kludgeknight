import { useState, useEffect } from 'react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { defaultPresets } from '@/utils/theme-presets';
import type { ThemeStyles } from '@/types/theme';

// Zod schema for theme validation
const ThemeSchema = z.enum(['light', 'dark', 'system']);
type Theme = z.infer<typeof ThemeSchema>;

function getThemePreference(): Theme {
  if (typeof window === 'undefined') return 'light';
  const stored = localStorage.getItem('theme');
  const result = ThemeSchema.safeParse(stored);
  return result.success ? result.data : 'light';
}

function getEffectiveTheme(theme: Theme): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return theme;
}

function applyThemeStyles(styles: ThemeStyles) {
  if (typeof window === 'undefined') return;

  const root = document.documentElement;

  // Apply colors as-is
  Object.entries(styles).forEach(([key, value]) => {
    if (typeof value === 'string') {
      root.style.setProperty(`--${key}`, value);
    }
  });
}

function applyTheme(theme: Theme) {
  if (typeof window === 'undefined') return;

  // Add transitioning class to enable smooth animations
  document.documentElement.classList.add('theme-transitioning');

  const effective = getEffectiveTheme(theme);
  document.documentElement.setAttribute('data-theme', effective);

  // Also toggle the 'dark' class for Tailwind
  if (effective === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }

  // Apply theme preset colors if selected
  const presetKey = localStorage.getItem('themePreset');
  if (presetKey && defaultPresets[presetKey]) {
    const preset = defaultPresets[presetKey];
    const styles = preset.styles[effective];
    applyThemeStyles(styles);
  }

  // Remove transitioning class after animation completes
  setTimeout(() => {
    document.documentElement.classList.remove('theme-transitioning');
  }, 300);
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = getThemePreference();
    setTheme(stored);
    applyTheme(stored);

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') {
        applyTheme('system');
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const cycleTheme = () => {
    const nextTheme: Theme = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    applyTheme(nextTheme);
  };

  if (!mounted) {
    return <div className="size-9" />;
  }

  const currentEffective = getEffectiveTheme(theme);

  return (
    <Button
      onClick={cycleTheme}
      variant="ghost"
      size="icon"
      title={`Theme: ${theme}${theme === 'system' ? ` (${currentEffective})` : ''}`}
      aria-label="Toggle theme"
    >
      {theme === 'system' ? (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ) : currentEffective === 'dark' ? (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      )}
    </Button>
  );
}
