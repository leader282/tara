const MS_IN_DAY = 86_400_000;

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

function getCalendarDayDifference(targetDate: Date, now: Date): number {
  const targetDay = startOfLocalDay(targetDate);
  const nowDay = startOfLocalDay(now);
  return Math.round((targetDay.getTime() - nowDay.getTime()) / MS_IN_DAY);
}

export function getDaysUntil(targetDate: Date, now: Date = new Date()): number {
  if (Number.isNaN(targetDate.getTime()) || Number.isNaN(now.getTime())) {
    return 0;
  }

  return getCalendarDayDifference(targetDate, now);
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

export type CountdownParts = {
  status: "none" | "past" | "today" | "tomorrow" | "upcoming";
  daysRemaining: number | null;
  label: string;
};

export function getCountdownParts(
  targetDate: Date | null | undefined,
  now: Date = new Date()
): CountdownParts {
  if (!targetDate || Number.isNaN(targetDate.getTime())) {
    return {
      status: "none",
      daysRemaining: null,
      label: "Set your next reunion date.",
    };
  }

  const daysRemaining = getDaysUntil(targetDate, now);

  if (daysRemaining < 0) {
    return {
      status: "past",
      daysRemaining,
      label: "That reunion date has passed.",
    };
  }

  if (daysRemaining === 0) {
    return {
      status: "today",
      daysRemaining,
      label: "You reunite today.",
    };
  }

  if (daysRemaining === 1) {
    return {
      status: "tomorrow",
      daysRemaining,
      label: "You reunite tomorrow.",
    };
  }

  return {
    status: "upcoming",
    daysRemaining,
    label: `${daysRemaining} days until you're together.`,
  };
}

export function formatReunionCountdown(
  targetDate: Date | null | undefined,
  now: Date = new Date()
): string {
  return getCountdownParts(targetDate, now).label;
}
