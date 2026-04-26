import type { InterestsProfile } from "@/lib/interestsOnboarding";

/** Flatten logged-in user interests for comparison with friends. */
export function flattenUserInterests(
  interests: InterestsProfile | null | undefined,
): string[] {
  if (!interests) return [];
  return [
    ...interests.hobbies,
    ...interests.activities,
    ...interests.foods,
    ...interests.topics,
    ...interests.travelStyle,
  ];
}

/** Shared labels preserving friend's order. */
export function getSharedInterests(
  mine: string[],
  theirs: string[] | undefined,
): string[] {
  if (!theirs?.length) return [];
  const set = new Set(mine);
  return theirs.filter((t) => set.has(t));
}

export function countSharedInterests(
  mine: string[],
  theirs: string[] | undefined,
): number {
  return getSharedInterests(mine, theirs).length;
}
