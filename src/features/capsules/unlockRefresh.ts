import type { MemoryCapsule } from "@/features/capsules/types";

const UNLOCK_REFRESH_GRACE_MS = 1_000;
// Very long timers are unreliable on mobile, so far-off unlocks are re-checked hourly.
const MAX_UNLOCK_REFRESH_MS = 60 * 60 * 1000;

/**
 * Capsule status is derived from the clock when data loads, so a capsule on screen stays
 * "locked" past its unlock time unless something refetches. Returns how long to wait before
 * refetching so the next unlock shows up on time, or false when nothing is waiting to unlock.
 */
export function getNextUnlockRefreshMs(
  capsules: Pick<MemoryCapsule, "unlock_at" | "opened_at">[],
  now: number = Date.now()
): number | false {
  let nextUnlockAt: number | null = null;

  for (const capsule of capsules) {
    if (capsule.opened_at) {
      continue;
    }

    const unlockAt = Date.parse(capsule.unlock_at);
    if (Number.isNaN(unlockAt) || unlockAt <= now) {
      continue;
    }

    nextUnlockAt = nextUnlockAt === null ? unlockAt : Math.min(nextUnlockAt, unlockAt);
  }

  if (nextUnlockAt === null) {
    return false;
  }

  return Math.min(nextUnlockAt - now + UNLOCK_REFRESH_GRACE_MS, MAX_UNLOCK_REFRESH_MS);
}
