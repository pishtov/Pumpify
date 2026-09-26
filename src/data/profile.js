// Stored values are the keys; labels are only for display, so they can be
// reworded later without touching saved profiles or old backups.

export const SEX_OPTIONS = [
  { key: 'male', label: 'Male' },
  { key: 'female', label: 'Female' },
  { key: 'other', label: 'Other' },
];

export const GOAL_OPTIONS = [
  { key: 'build_muscle', label: 'Build Muscle' },
  { key: 'lose_fat', label: 'Lose Fat' },
  { key: 'strength', label: 'Get Stronger' },
  { key: 'endurance', label: 'Endurance' },
  { key: 'general', label: 'Stay Fit' },
];

export const EXPERIENCE_OPTIONS = [
  { key: 'beginner', label: 'Beginner' },
  { key: 'intermediate', label: 'Intermediate' },
  { key: 'advanced', label: 'Advanced' },
];

export function optionLabel(options, key) {
  return options.find((option) => option.key === key)?.label ?? null;
}

// Birth year rather than age is stored so the number never goes stale.
// This can be off by one before the user's birthday — fine for a profile.
export function ageFromBirthYear(birthYear) {
  if (birthYear == null) return null;
  return new Date().getFullYear() - birthYear;
}

export function bmi(heightCm, weightKg) {
  if (!heightCm || !weightKg) return null;
  const meters = heightCm / 100;
  return weightKg / (meters * meters);
}
