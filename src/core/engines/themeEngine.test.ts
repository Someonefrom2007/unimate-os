/**
 * ThemeEngine unit tests — settings persistence, accent presets, density.
 */
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { installLocalStorageMock, uninstallLocalStorageMock } from '../../test-utils/localStorageMock';
import {
  loadThemeSettings,
  saveThemeSettings,
  resetThemeSettings,
  ACCENT_PRESETS,
  FONT_SIZE_PRESETS,
  DENSITY_PRESETS,
  type ThemeSettings,
} from './themeEngine';

describe('ThemeSettings persistence', () => {
  beforeEach(() => { installLocalStorageMock(); });
  afterEach(() => { uninstallLocalStorageMock(); });

  it('returns defaults on first load', () => {
    const s = loadThemeSettings();
    expect(s.accentHex).toBe('#f5a623');
    expect(s.fontSize).toBe(14);
    expect(s.density).toBe('comfortable');
    expect(s.darkMode).toBe(true);
  });

  it('persists and reloads settings', () => {
    const custom: ThemeSettings = {
      accentHex: '#4a90d9',
      accentName: 'secondary',
      fontSize: 16,
      density: 'compact',
      darkMode: false,
      reducedMotion: true,
      compactCards: true,
    };
    saveThemeSettings(custom);
    const loaded = loadThemeSettings();
    expect(loaded.accentHex).toBe('#4a90d9');
    expect(loaded.fontSize).toBe(16);
    expect(loaded.density).toBe('compact');
    expect(loaded.darkMode).toBe(false);
  });

  it('reset clears and returns defaults', () => {
    saveThemeSettings({ ...loadThemeSettings(), fontSize: 18 });
    const s = resetThemeSettings();
    expect(s.fontSize).toBe(14);
    expect(loadThemeSettings().fontSize).toBe(14);
  });
});

describe('ACCENT_PRESETS', () => {
  it('has at least 5 presets', () => {
    expect(ACCENT_PRESETS.length).toBeGreaterThanOrEqual(5);
  });
  it('each preset has valid hex', () => {
    for (const p of ACCENT_PRESETS) {
      expect(p.hex).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(p.name.length).toBeGreaterThan(0);
    }
  });
});

describe('FONT_SIZE_PRESETS', () => {
  it('has 4 presets with valid sizes', () => {
    expect(FONT_SIZE_PRESETS.length).toBe(4);
    for (const f of FONT_SIZE_PRESETS) {
      expect(f.value).toBeGreaterThanOrEqual(10);
      expect(f.value).toBeLessThanOrEqual(24);
    }
  });
});

describe('DENSITY_PRESETS', () => {
  it('has 3 presets', () => {
    expect(DENSITY_PRESETS.length).toBe(3);
    const values = DENSITY_PRESETS.map((d) => d.value);
    expect(values).toContain('compact');
    expect(values).toContain('comfortable');
    expect(values).toContain('spacious');
  });
});
