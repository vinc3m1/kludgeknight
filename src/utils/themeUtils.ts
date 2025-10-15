import type { ThemeStyles } from '@/types/theme';
import { loadGoogleFont } from './fontLoader';

function buildShadow(color: string, opacity: string, blur: string, spread: string, offsetX: string, offsetY: string): string {
  // If color already has opacity/alpha, use it directly
  if (color.includes('/') || color.includes('rgba')) {
    return `${offsetX} ${offsetY} ${blur} ${spread} ${color}`;
  }
  // Otherwise apply opacity
  const opacityNum = parseFloat(opacity) || 0.1;
  return `${offsetX} ${offsetY} ${blur} ${spread} ${color.replace(')', ` / ${opacityNum})`)}`;
}

/**
 * Applies theme styles to the document root, handling colors, shadows, and fonts.
 * Automatically clears shadows if not fully defined to prevent inheritance from previous theme.
 */
export function applyThemeStyles(styles: ThemeStyles) {
  if (typeof window === 'undefined') return;

  const root = document.documentElement;

  // Apply ALL properties synchronously first
  Object.entries(styles).forEach(([key, value]) => {
    if (typeof value === 'string') {
      root.style.setProperty(`--${key}`, value);
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
  } else {
    // If shadow properties are not fully defined, clear shadows to prevent inheritance from previous theme
    const noShadow = '0px 0px 0px 0px transparent';
    root.style.setProperty('--shadow-xs', noShadow);
    root.style.setProperty('--shadow-sm', noShadow);
    root.style.setProperty('--shadow', noShadow);
    root.style.setProperty('--shadow-md', noShadow);
    root.style.setProperty('--shadow-lg', noShadow);
    root.style.setProperty('--shadow-xl', noShadow);
    root.style.setProperty('--shadow-2xl', noShadow);
  }

  // Force a reflow to ensure CSS variables are applied
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  root.offsetHeight;

  // Load Google Fonts after CSS variables are set and reflow is forced
  Object.entries(styles).forEach(([key, value]) => {
    if (typeof value === 'string' && (key === 'font-sans' || key === 'font-serif' || key === 'font-mono')) {
      loadGoogleFont(value);
    }
  });
}

/**
 * Applies theme styles for light/dark mode toggles.
 * Skips fonts (they should persist across light/dark) but handles shadows and colors.
 */
export function applyThemeStylesForToggle(styles: ThemeStyles) {
  if (typeof window === 'undefined') return;

  const root = document.documentElement;

  // Apply colors only - fonts should not change when toggling light/dark mode
  Object.entries(styles).forEach(([key, value]) => {
    if (typeof value === 'string' && !key.startsWith('font-')) {
      root.style.setProperty(`--${key}`, value);
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
  } else {
    // If shadow properties are not fully defined, clear shadows to prevent inheritance from previous theme
    const noShadow = '0px 0px 0px 0px transparent';
    root.style.setProperty('--shadow-xs', noShadow);
    root.style.setProperty('--shadow-sm', noShadow);
    root.style.setProperty('--shadow', noShadow);
    root.style.setProperty('--shadow-md', noShadow);
    root.style.setProperty('--shadow-lg', noShadow);
    root.style.setProperty('--shadow-xl', noShadow);
    root.style.setProperty('--shadow-2xl', noShadow);
  }

  // Force a reflow to ensure CSS variables are applied
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  root.offsetHeight;
}
