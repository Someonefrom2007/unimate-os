/**
 * OnboardingEngine — multi-step profile validation & onboarding state.
 * Pure domain logic with no UI or persistence coupling.
 */
import { AccentColor } from '../domain/enums';
import type { Profile } from '../domain/model/Profile';
export interface StepValidation {
  valid: boolean;
  errors: string[];
}

/** Onboarding step numbers. */
export const STEP_COUNT = 4;

/** Validate each step of the onboarding flow. */
export function validateProfileStep(step: number, payload: Partial<Profile>): StepValidation {
  const errors: string[] = [];

  if (step === 1) {
    // Step 1: personal identity
    if (!payload.name || payload.name.trim().length === 0) errors.push('Name is required');
    if (payload.name && payload.name.trim().length < 2) errors.push('Name must be at least 2 characters');
    if (payload.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
      errors.push('Invalid email format');
    }
  }

  if (step === 2) {
    // Step 2: academic info
    if (!payload.university || payload.university.trim().length === 0) errors.push('University is required');
    if (!payload.degree || payload.degree.trim().length === 0) errors.push('Degree/program is required');
  }

  if (step === 3) {
    // Step 3: semester / year
    if (!payload.yearLabel || payload.yearLabel.trim().length === 0) errors.push('Year is required');
    if (!payload.semesterLabel || payload.semesterLabel.trim().length === 0) errors.push('Semester is required');
  }

  if (step === 4) {
    // Step 4: targets & ECTS
    if (payload.targetGpa !== undefined && (payload.targetGpa < 0 || payload.targetGpa > 10)) {
      errors.push('Target GPA must be between 0 and 10');
    }
    if (payload.totalEcts !== undefined && payload.totalEcts <= 0) {
      errors.push('Total ECTS must be positive');
    }
    if (payload.completedEcts !== undefined && payload.totalEcts !== undefined) {
      if (payload.completedEcts < 0) errors.push('Completed ECTS cannot be negative');
      if (payload.completedEcts > payload.totalEcts) errors.push('Completed ECTS cannot exceed total');
    }
  }

  return { valid: errors.length === 0, errors };
}

/** Build initials from a full name (max 2 characters). */
export function deriveInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/** Merge partial profile updates into an existing profile (or defaults). */
export function mergeProfileUpdates(
  existing: Profile | null,
  updates: Partial<Profile>,
): Profile {
  const base: Profile = existing ?? {
    id: '',
    name: '',
    initials: '',
    email: '',
    university: '',
    degree: '',
    yearLabel: '',
    semesterLabel: '',
    targetGpa: 8.0,
    totalEcts: 180,
    completedEcts: 0,
    accent: AccentColor.Primary,
  };

  const merged = { ...base, ...updates };

  // Auto-derive initials from name if name changed
  if (updates.name && updates.name !== existing?.name) {
    merged.initials = deriveInitials(updates.name);
  }

  return merged;
}

/** Get the onboarding completion percentage. */
export function onboardingProgress(profile: Partial<Profile>): number {
  let filled = 0;
  const total = 4;

  // Step 1: identity
  if (profile.name && profile.name.trim().length > 0) filled++;
  // Step 2: university + degree
  if ((profile.university && profile.university.trim().length > 0) && (profile.degree && profile.degree.trim().length > 0)) filled++;
  // Step 3: year + semester
  if ((profile.yearLabel && profile.yearLabel.trim().length > 0) && (profile.semesterLabel && profile.semesterLabel.trim().length > 0)) filled++;
  // Step 4: targets
  if (profile.targetGpa !== undefined) filled++;

  return Math.round((filled / total) * 100);
}

/** Which step should the user jump to based on their current progress. */
export function currentOnboardingStep(profile: Partial<Profile>): number {
  if (!profile.name || profile.name.trim().length === 0) return 1;
  if (!profile.university || profile.university.trim().length === 0 || !profile.degree || profile.degree.trim().length === 0) return 2;
  if (!profile.yearLabel || profile.yearLabel.trim().length === 0 || !profile.semesterLabel || profile.semesterLabel.trim().length === 0) return 3;
  return 4;
}