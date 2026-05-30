const MS_IN_DAY = 86_400_000;

export function getDaysUntil(targetDate: Date, now: Date = new Date()): number {
  const msDifference = targetDate.getTime() - now.getTime();
  return Math.ceil(msDifference / MS_IN_DAY);
}

export function formatDaysUntil(days: number): string {
  if (days > 1) {
    return `${days} days`;
  }

  if (days === 1) {
    return "1 day";
  }

  if (days === 0) {
    return "today";
  }

  return "passed";
}

export function getCountdownLabel(targetDate: Date, now: Date = new Date()): string {
  return formatDaysUntil(getDaysUntil(targetDate, now));
}
