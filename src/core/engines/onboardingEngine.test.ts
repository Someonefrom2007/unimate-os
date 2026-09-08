/**
 * OnboardingEngine unit tests — step validation, initials, merge, progress.
 */
import { describe, expect, it } from 'vitest';
import {
  currentOnboardingStep,
  deriveInitials,
  mergeProfileUpdates,
  onboardingProgress,
  validateProfileStep,
} from './onboardingEngine';
import { AccentColor } from '../domain/enums';
import type { Profile } from '../domain/model/Profile';

const fullProfile: Profile = {
  id: 'test-profile',
  name: 'Alejandra Vega',
  initials: 'AV',
  email: 'a.vega@universidad.es',
  university: 'UPC',
  degree: 'Computer Science',
  yearLabel: 'Year 3',
  semesterLabel: 'Fall 2025',
  targetGpa: 8.0,
  totalEcts: 180,
  completedEcts: 120,
  accent: AccentColor.Primary,
};

describe('validateProfileStep', () => {
  it('validates step 1 requires name', () => {
    expect(validateProfileStep(1, {})).toEqual({ valid: false, errors: ['Name is required'] });
  });

  it('validates step 1 requires min 2 chars', () => {
    expect(validateProfileStep(1, { name: 'A' })).toEqual({ valid: false, errors: ['Name must be at least 2 characters'] });
  });

  it('validates step 1 email format', () => {
    const result = validateProfileStep(1, { name: 'Alex', email: 'bad' });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Invalid email format');
  });

  it('validates step 1 with valid input', () => {
    expect(validateProfileStep(1, { name: 'Alex', email: 'a@b.com' }).valid).toBe(true);
  });

  it('validates step 2 requires university and degree', () => {
    const result = validateProfileStep(2, {});
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBe(2);
  });

  it('validates step 2 passes with valid input', () => {
    expect(validateProfileStep(2, { university: 'UPC', degree: 'CS' }).valid).toBe(true);
  });

  it('validates step 3 requires year and semester', () => {
    expect(validateProfileStep(3, {}).valid).toBe(false);
  });

  it('validates step 3 passes with valid input', () => {
    expect(validateProfileStep(3, { yearLabel: 'Year 3', semesterLabel: 'Fall' }).valid).toBe(true);
  });

  it('validates step 4 GPA range', () => {
    expect(validateProfileStep(4, { targetGpa: 15 }).valid).toBe(false);
  });

  it('validates step 4 total ECTS positive', () => {
    expect(validateProfileStep(4, { totalEcts: -10 }).valid).toBe(false);
  });

  it('validates step 4 completed cannot exceed total', () => {
    expect(validateProfileStep(4, { completedEcts: 200, totalEcts: 100 }).valid).toBe(false);
  });

  it('validates step 4 passes with valid input', () => {
    expect(validateProfileStep(4, { targetGpa: 8, totalEcts: 180, completedEcts: 120 }).valid).toBe(true);
  });
});

describe('deriveInitials', () => {
  it('extracts initials from two-word name', () => {
    expect(deriveInitials('Alejandra Vega')).toBe('AV');
  });

  it('extracts single initial from single name', () => {
    expect(deriveInitials('John')).toBe('J');
  });

  it('handles extra whitespace', () => {
    expect(deriveInitials('  John   Doe  ')).toBe('JD');
  });

  it('returns empty for empty string', () => {
    expect(deriveInitials('')).toBe('');
  });
});

describe('mergeProfileUpdates', () => {
  it('creates default profile when none exists', () => {
    const merged = mergeProfileUpdates(null, { name: 'Test' });
    expect(merged.name).toBe('Test');
    expect(merged.initials).toBe('T');
    expect(merged.targetGpa).toBe(8.0);
  });

  it('preserves existing fields', () => {
    const existing = { ...fullProfile };
    const merged = mergeProfileUpdates(existing, { email: 'new@email.com' });
    expect(merged.name).toBe('Alejandra Vega');
    expect(merged.email).toBe('new@email.com');
  });

  it('auto-derives initials on name change', () => {
    const merged = mergeProfileUpdates(fullProfile, { name: 'John Doe' });
    expect(merged.initials).toBe('JD');
  });

  it('does not touch initials if name unchanged', () => {
    const merged = mergeProfileUpdates(fullProfile, { email: 'new@e.com' });
    expect(merged.initials).toBe('AV');
  });
});

describe('onboardingProgress', () => {
  it('returns 0 for empty profile', () => {
    expect(onboardingProgress({})).toBe(0);
  });

  it('returns 100 for full profile', () => {
    expect(onboardingProgress(fullProfile)).toBe(100);
  });

  it('calculates partial progress', () => {
    expect(onboardingProgress({ name: 'Test' })).toBe(25);
    expect(onboardingProgress({ name: 'Test', university: 'UPC', degree: 'CS' })).toBe(50);
  });
});

describe('currentOnboardingStep', () => {
  it('starts at step 1 for empty profile', () => {
    expect(currentOnboardingStep({})).toBe(1);
  });

  it('moves to step 2 when name provided', () => {
    expect(currentOnboardingStep({ name: 'Test' })).toBe(2);
  });

  it('moves to step 3 when university+degree provided', () => {
    expect(currentOnboardingStep({ name: 'Test', university: 'UPC', degree: 'CS' })).toBe(3);
  });

  it('moves to step 4 when year+semester provided', () => {
    expect(currentOnboardingStep({ name: 'Test', university: 'UPC', degree: 'CS', yearLabel: 'Y3', semesterLabel: 'Fall' })).toBe(4);
  });
});