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
import { applyThemeStyles } from '@/utils/themeUtils';

// Zod schema for theme mode validation
const ThemeModeSchema = z.enum(['light', 'dark', 'system']);
type ThemeMode = z.infer<typeof ThemeModeSchema>;

function getThemeMode(): ThemeMode {
  if (typeof window === 'undefined') return 'system';
  const stored = localStorage.getItem('theme');
  const result = ThemeModeSchema.safeParse(stored);
  return result.success ? result.data : 'system';
}

function getEffectiveMode(mode: ThemeMode): 'light' | 'dark' {
  if (typeof window === 'undefined') {
    // During SSR, assume light as a safe default for hydration
    return 'light';
  }
  if (mode === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return mode;
}

export function ThemeSelector() {
  const [themePreset, setThemePreset] = useState<string>('claymorphism');
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
      // Default to claymorphism for first-time visitors
      setThemePreset('claymorphism');
      applyCurrentTheme('claymorphism');
      localStorage.setItem('themeStyles', JSON.stringify(defaultPresets['claymorphism'].styles));
    }
  }, []);

  const applyCurrentTheme = (presetKey: string) => {
    const preset = defaultPresets[presetKey];
    if (!preset) return;

    const mode = getThemeMode();
    const effectiveMode = getEffectiveMode(mode);
    const styles = preset.styles[effectiveMode];

    // Apply fonts and letter-spacing from light mode (they're consistent across light/dark)
    // This ensures these typographic properties are applied even when switching themes while in dark mode
    const lightStyles = preset.styles.light;
    const typographyFromLight = {
      'font-sans': lightStyles['font-sans'],
      'font-serif': lightStyles['font-serif'],
      'font-mono': lightStyles['font-mono'],
      'letter-spacing': lightStyles['letter-spacing'],
    };

    // Merge typography from light mode with current mode styles
    const mergedStyles = { ...styles, ...typographyFromLight };

    applyThemeStyles(mergedStyles);
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
