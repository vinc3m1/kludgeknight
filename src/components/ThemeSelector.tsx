import { useState, useEffect } from 'react';
import { z } from 'zod';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { defaultPresets } from '@/utils/theme-presets';
import type { ThemeStyles } from '@/types/theme';

// Zod schema for theme mode validation
const ThemeModeSchema = z.enum(['light', 'dark', 'system']);
type ThemeMode = z.infer<typeof ThemeModeSchema>;

function getThemeMode(): ThemeMode {
  if (typeof window === 'undefined') return 'light';
  const stored = localStorage.getItem('theme');
  const result = ThemeModeSchema.safeParse(stored);
  return result.success ? result.data : 'light';
}

function getEffectiveMode(mode: ThemeMode): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  if (mode === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return mode;
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

export function ThemeSelector() {
  const [themePreset, setThemePreset] = useState<string>('tangerine');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem('themePreset');
    if (stored && defaultPresets[stored]) {
      setThemePreset(stored);
      applyCurrentTheme(stored);
    } else {
      // Default to tangerine for first-time visitors
      setThemePreset('tangerine');
      applyCurrentTheme('tangerine');
    }
  }, []);

  const applyCurrentTheme = (presetKey: string) => {
    const preset = defaultPresets[presetKey];
    if (!preset) return;

    const mode = getThemeMode();
    const effectiveMode = getEffectiveMode(mode);
    const styles = preset.styles[effectiveMode];

    applyThemeStyles(styles);
  };

  const handleThemeChange = (value: string) => {
    setThemePreset(value);
    localStorage.setItem('themePreset', value);
    applyCurrentTheme(value);
  };

  if (!mounted) {
    return <div className="w-40" />;
  }

  const presetOptions = Object.entries(defaultPresets).map(([key, preset]) => ({
    value: key,
    label: preset.label,
  }));

  return (
    <Select value={themePreset} onValueChange={handleThemeChange}>
      <SelectTrigger className="w-40">
        <SelectValue placeholder="Select theme" />
      </SelectTrigger>
      <SelectContent>
        {presetOptions.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
