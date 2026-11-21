const MAX_REMEMBERED_PULSES = 50;
const announcedPulseIds: string[] = [];

/**
 * Realtime and foreground push both report the same incoming pulse; only the first one
 * to arrive should show a banner. Returns false when the pulse was already announced.
 */
export function claimPulseAnnouncement(presenceEventId: string): boolean {
  if (announcedPulseIds.includes(presenceEventId)) {
    return false;
  }

  announcedPulseIds.push(presenceEventId);
  if (announcedPulseIds.length > MAX_REMEMBERED_PULSES) {
    announcedPulseIds.shift();
  }

  return true;
}
