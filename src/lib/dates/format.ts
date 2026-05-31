export function formatDate(
  date: Date,
  options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" },
  locale = "en-US"
): string {
  return new Intl.DateTimeFormat(locale, options).format(date);
}

export function formatDateTime(date: Date, locale = "en-US"): string {
  return formatDate(
    date,
    {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    },
    locale
  );
}

export function formatWeekday(date: Date, locale = "en-US"): string {
  return formatDate(
    date,
    {
      weekday: "long",
    },
    locale
  );
}

export function formatUtcDateOnly(date: Date = new Date()): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(
    date.getUTCDate()
  ).padStart(2, "0")}`;
}

export function formatDateOnly(dateString: string | null | undefined, locale = "en-US"): string | null {
  if (!dateString) {
    return null;
  }

  const parsedDateParts = parseDateOnlyToParts(dateString);
  if (!parsedDateParts) {
    return null;
  }

  const utcDate = new Date(
    Date.UTC(parsedDateParts.year, parsedDateParts.month - 1, parsedDateParts.day, 0, 0, 0, 0)
  );

  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(utcDate);
}

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const HH_MM_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

function parseDateOnlyToParts(
  dateString: string
): { year: number; month: number; day: number } | null {
  if (!DATE_ONLY_PATTERN.test(dateString)) {
    return null;
  }

  const [yearString, monthString, dayString] = dateString.split("-");
  const year = Number(yearString);
  const month = Number(monthString);
  const day = Number(dayString);

  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return null;
  }

  const date = new Date(year, month - 1, day, 0, 0, 0, 0);
  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return { year, month, day };
}

export function formatMeetupDateTime(
  isoString: string | null | undefined,
  locale = "en-US"
): string | null {
  if (!isoString) {
    return null;
  }

  const parsedDate = new Date(isoString);
  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return formatDate(
    parsedDate,
    {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    },
    locale
  );
}

export function parseMeetupDateTimeFromFields(
  dateString: string | null | undefined,
  timeString?: string | null
): string | null {
  return parseDateTimeFromFields(dateString, timeString, "12:00");
}

function parseTimeParts(timeValue: string): [number, number] | null {
  if (!HH_MM_PATTERN.test(timeValue)) {
    return null;
  }

  const [hours, minutes] = timeValue.split(":").map(Number);
  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) {
    return null;
  }

  return [hours, minutes];
}

export function parseDateTimeFromFields(
  dateString: string | null | undefined,
  timeString?: string | null,
  fallbackTime: string = "12:00"
): string | null {
  const normalizedDate = dateString?.trim();
  if (!normalizedDate) {
    return null;
  }

  const parsedDateParts = parseDateOnlyToParts(normalizedDate);
  if (!parsedDateParts) {
    return null;
  }

  const normalizedTime = timeString?.trim();
  if (normalizedTime && !HH_MM_PATTERN.test(normalizedTime)) {
    return null;
  }

  const normalizedFallbackTime = fallbackTime.trim();
  const resolvedTime = normalizedTime && normalizedTime.length > 0
    ? normalizedTime
    : normalizedFallbackTime;
  const parsedTimeParts = parseTimeParts(resolvedTime);
  if (!parsedTimeParts) {
    return null;
  }

  const [hours, minutes] = parsedTimeParts;
  const localMeetupDate = new Date(
    parsedDateParts.year,
    parsedDateParts.month - 1,
    parsedDateParts.day,
    hours,
    minutes,
    0,
    0
  );

  if (
    Number.isNaN(localMeetupDate.getTime()) ||
    localMeetupDate.getFullYear() !== parsedDateParts.year ||
    localMeetupDate.getMonth() !== parsedDateParts.month - 1 ||
    localMeetupDate.getDate() !== parsedDateParts.day
  ) {
    return null;
  }

  return localMeetupDate.toISOString();
}

export function formatUnlockDateTime(
  isoString: string | null | undefined,
  locale = "en-US"
): string | null {
  if (!isoString) {
    return null;
  }

  const parsedDate = new Date(isoString);
  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return formatDate(
    parsedDate,
    {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    },
    locale
  );
}

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

function getLocalDayDifference(targetDate: Date, now: Date): number {
  const targetDay = startOfLocalDay(targetDate);
  const nowDay = startOfLocalDay(now);
  const msInDay = 86_400_000;
  return Math.round((targetDay.getTime() - nowDay.getTime()) / msInDay);
}

export function formatCapsuleCountdown(
  unlockAtIso: string | null | undefined,
  openedAtIso?: string | null,
  now: Date = new Date()
): string {
  const openedAt = openedAtIso ? new Date(openedAtIso) : null;
  if (openedAt && !Number.isNaN(openedAt.getTime())) {
    return "Opened";
  }

  if (!unlockAtIso) {
    return "Unavailable";
  }

  const unlockAt = new Date(unlockAtIso);
  if (Number.isNaN(unlockAt.getTime())) {
    return "Unavailable";
  }

  if (unlockAt.getTime() <= now.getTime()) {
    return "Ready to open";
  }

  const dayDifference = getLocalDayDifference(unlockAt, now);
  if (dayDifference === 0) {
    return "Unlocks today";
  }

  if (dayDifference === 1) {
    return "Unlocks tomorrow";
  }

  const unlockLabel = formatUnlockDateTime(unlockAtIso);
  if (!unlockLabel) {
    return "Locked for later";
  }

  return `Locked until ${unlockLabel}`;
}
