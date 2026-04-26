export type InterestsProfile = {
  hobbies: string[];
  activities: string[];
  foods: string[];
  topics: string[];
  travelStyle: string[];
};

const KEYS: (keyof InterestsProfile)[] = [
  'hobbies',
  'activities',
  'foods',
  'topics',
  'travelStyle',
];

/** True when the user still needs to complete the multi-step interests onboarding. */
export function needsInterestsOnboarding(interests: unknown): boolean {
  if (interests == null) return true;
  if (typeof interests !== 'object' || Array.isArray(interests)) return true;
  const o = interests as Record<string, unknown>;
  for (const k of KEYS) {
    const v = o[k];
    if (!Array.isArray(v) || v.length < 1) return true;
  }
  return false;
}
