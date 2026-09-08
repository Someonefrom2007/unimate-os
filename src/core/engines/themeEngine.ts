/**
 * ThemeEngine — pure domain logic for accent color customization,
 * font sizing, compact mode, and density presets.
 * All settings persist to localStorage (local-first).
 */
import type { AccentColor } from '../domain/enums';

export type DensityPreset = 'compact' | 'comfortable' | 'spacious';

export interface ThemeSettings {
  accentHex: string;
  accentName: AccentColor;
  fontSize: number; // 12..18, base 14
  density: DensityPreset;
  darkMode: boolean;
  reducedMotion: boolean;
  compactCards: boolean;
}

const STORAGE_KEY = 'unimate.theme';

const DEFAULTS: ThemeSettings = {
  accentHex: '#f5a623',
  accentName: 'primary',
  fontSize: 14,
  density: 'comfortable',
  darkMode: true,
  reducedMotion: false,
  compactCards: false,
};

/** Load persisted theme settings (local-first). */
export function loadThemeSettings(): ThemeSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch { /* fallback to defaults */ }
  return { ...DEFAULTS };
}

/** Save theme settings to localStorage. */
export function saveThemeSettings(settings: ThemeSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

/** Reset to defaults. */
export function resetThemeSettings(): ThemeSettings {
  localStorage.removeItem(STORAGE_KEY);
  return { ...DEFAULTS };
}

/** Apply theme settings to the DOM. */
export function applyTheme(settings: ThemeSettings): void {
  const root = document.documentElement;
  root.classList.toggle('dark', settings.darkMode);
  root.style.setProperty('--unimate-accent', settings.accentHex);
  root.style.setProperty('--font-size-base', `${settings.fontSize}px`);
  root.classList.toggle('reduce-motion', settings.reducedMotion);
  root.classList.toggle('compact-cards', settings.compactCards);

  const densityMap: Record<DensityPreset, string> = {
    compact: '0.5rem',
    comfortable: '0.75rem',
    spacious: '1rem',
  };
  root.style.setProperty('--card-gap', densityMap[settings.density]);
}

/** Known accent presets for the color picker. */
export const ACCENT_PRESETS: { name: string; hex: string }[] = [
  { name: 'Amber Gold', hex: '#f5a623' },
  { name: 'Ocean Blue', hex: '#4a90d9' },
  { name: 'Emerald', hex: '#5beaad' },
  { name: 'Rose', hex: '#ff6b8a' },
  { name: 'Violet', hex: '#b4b7ff' },
  { name: 'Coral', hex: '#ff7f6e' },
  { name: 'Teal', hex: '#4ecdc4' },
  { name: 'Slate', hex: '#94a3b8' },
];

/** Font size presets. */
export const FONT_SIZE_PRESETS: { label: string; value: number }[] = [
  { label: 'Small', value: 12 },
  { label: 'Default', value: 14 },
  { label: 'Large', value: 16 },
  { label: 'XL', value: 18 },
];

/** Density presets. */
export const DENSITY_PRESETS: { label: string; value: DensityPreset; desc: string }[] = [
  { label: 'Compact', value: 'compact', desc: 'Minimal spacing, more content' },
  { label: 'Comfortable', value: 'comfortable', desc: 'Balanced spacing (default)' },
  { label: 'Spacious', value: 'spacious', desc: 'Extra breathing room' },
];
