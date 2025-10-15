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
import { loadGoogleFont } from '@/utils/fontLoader';
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

function buildShadow(color: string, opacity: string, blur: string, spread: string, offsetX: string, offsetY: string): string {
  // If color already has opacity/alpha, use it directly
  if (color.includes('/') || color.includes('rgba')) {
    return `${offsetX} ${offsetY} ${blur} ${spread} ${color}`;
  }
  // Otherwise apply opacity
  const opacityNum = parseFloat(opacity) || 0.1;
  return `${offsetX} ${offsetY} ${blur} ${spread} ${color.replace(')', ` / ${opacityNum})`)}`;
}

function applyThemeStyles(styles: ThemeStyles) {
  if (typeof window === 'undefined') return;

  const root = document.documentElement;

  // Apply colors and other properties
  Object.entries(styles).forEach(([key, value]) => {
    if (typeof value === 'string') {
      root.style.setProperty(`--${key}`, value);

      // Load Google Font if this is a font property
      if (key === 'font-sans' || key === 'font-serif' || key === 'font-mono') {
        loadGoogleFont(value);
      }
    }
  });

  // Build shadow utilities from individual shadow properties if available
  const shadowColor = styles['shadow-color'];
  const shadowOpacity = styles['shadow-opacity'];
  const shadowBlur = styles['shadow-blur'];
  const shadowSpread = styles['shadow-spread'];
  const shadowOffsetX = styles['shadow-offset-x'];
  const shadowOffsetY = styles['shadow-offset-y'];

  if (shadowColor && shadowOpacity && shadowBlur !== undefined && shadowOffsetX && shadowOffsetY) {
    const spread = shadowSpread || '0px';

    // Build shadow variants
    const baseShadow = buildShadow(shadowColor, shadowOpacity, shadowBlur, spread, shadowOffsetX, shadowOffsetY);

    // Apply to Tailwind shadow utilities
    root.style.setProperty('--shadow-xs', baseShadow);
    root.style.setProperty('--shadow-sm', baseShadow);
    root.style.setProperty('--shadow', baseShadow);
    root.style.setProperty('--shadow-md', baseShadow);
    root.style.setProperty('--shadow-lg', baseShadow);
    root.style.setProperty('--shadow-xl', baseShadow);
    root.style.setProperty('--shadow-2xl', baseShadow);
  }
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
      // Ensure styles are stored for next load
      localStorage.setItem('themeStyles', JSON.stringify(defaultPresets[stored].styles));
    } else {
      // Default to doom-64 for first-time visitors
      setThemePreset('doom-64');
      applyCurrentTheme('doom-64');
      localStorage.setItem('themeStyles', JSON.stringify(defaultPresets['doom-64'].styles));
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

    // Store the full theme styles for instant loading
    const preset = defaultPresets[value];
    if (preset) {
      localStorage.setItem('themeStyles', JSON.stringify(preset.styles));
    }

    applyCurrentTheme(value);
  };

  if (!mounted) {
    return <div className="w-40" />;
  }

  const presetOptions = Object.entries(defaultPresets)
    .map(([key, preset]) => ({
      value: key,
      label: preset.label,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

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
