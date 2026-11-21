import { getCalendars } from "expo-localization";

const MS_IN_MINUTE = 60_000;
const FALLBACK_TIMEZONE = "UTC";

function getTimeZoneFromExpoLocalization(): string | null {
  try {
    const expoTimeZone = getCalendars()?.[0]?.timeZone;
    if (expoTimeZone && isValidTimeZone(expoTimeZone)) {
      return expoTimeZone;
    }
  } catch {
    return null;
  }

  return null;
}

export function getDeviceTimeZone(): string {
  const expoTimeZone = getTimeZoneFromExpoLocalization();
  if (expoTimeZone) {
    return expoTimeZone;
  }

  try {
    const intlTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (intlTimeZone && isValidTimeZone(intlTimeZone)) {
      return intlTimeZone;
    }
  } catch {
    return FALLBACK_TIMEZONE;
  }

  return FALLBACK_TIMEZONE;
}

export function isValidTimeZone(timeZone: string): boolean {
  const trimmedTimeZone = timeZone.trim();
  if (trimmedTimeZone.length === 0) {
    return false;
  }

  try {
    Intl.DateTimeFormat(undefined, { timeZone: trimmedTimeZone }).format();
    return true;
  } catch {
    return false;
  }
}

export function getUtcOffsetLabel(date: Date = new Date()): string {
  const offsetMinutes = -date.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const absoluteMinutes = Math.abs(offsetMinutes);
  const hours = Math.floor(absoluteMinutes / 60);
  const minutes = absoluteMinutes % 60;

  return `UTC${sign}${String(hours).padStart(2, "0")}:${String(minutes).padStart(
    2,
    "0"
  )}`;
}

function getZonedParts(date: Date, timeZone: string): Record<string, number> | null {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour12: false,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).formatToParts(date);

    const values: Record<string, number> = {};
    for (const part of parts) {
      if (part.type !== "literal") {
        values[part.type] = Number(part.value);
      }
    }

    return values;
  } catch {
    return null;
  }
}

export function getTimezoneOffsetMinutes(timeZone: string, date = new Date()): number {
  if (!isValidTimeZone(timeZone)) {
    return 0;
  }

  const parts = getZonedParts(date, timeZone);
  if (!parts) {
    return 0;
  }

  const zonedAsUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour % 24,
    parts.minute,
    parts.second
  );
  const wholeSecondTime = date.getTime() - date.getMilliseconds();
  return Math.round((zonedAsUtc - wholeSecondTime) / MS_IN_MINUTE);
}

export function getHourInTimeZone(date: Date, timeZone: string | null | undefined): number {
  if (!timeZone || !isValidTimeZone(timeZone)) {
    return date.getHours();
  }

  const parts = getZonedParts(date, timeZone);
  return parts ? parts.hour % 24 : date.getHours();
}

export type DayPeriod = "morning" | "afternoon" | "evening" | "night";

export function getDayPeriod(hour: number): DayPeriod {
  if (hour >= 5 && hour < 12) {
    return "morning";
  }

  if (hour >= 12 && hour < 17) {
    return "afternoon";
  }

  if (hour >= 17 && hour < 21) {
    return "evening";
  }

  return "night";
}

/** Describes the partner's clock relative to this device, e.g. "3h 30m ahead of you". */
export function describeTimeDifference(partnerTimeZone: string, date = new Date()): string {
  const partnerOffset = getTimezoneOffsetMinutes(partnerTimeZone, date);
  const deviceOffset = -date.getTimezoneOffset();
  const difference = partnerOffset - deviceOffset;

  if (difference === 0) {
    return "Same time as you";
  }

  const absoluteMinutes = Math.abs(difference);
  const hours = Math.floor(absoluteMinutes / 60);
  const minutes = absoluteMinutes % 60;
  const amount = [hours > 0 ? `${hours}h` : null, minutes > 0 ? `${minutes}m` : null]
    .filter(Boolean)
    .join(" ");

  return difference > 0 ? `${amount} ahead of you` : `${amount} behind you`;
}

export function formatTimeInTimeZone(
  date: Date,
  timeZone: string | null | undefined,
  locale = "en-US"
): string {
  if (Number.isNaN(date.getTime())) {
    return "Unknown time";
  }

  const fallbackTime = new Intl.DateTimeFormat(locale, {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);

  if (!timeZone || !isValidTimeZone(timeZone)) {
    return fallbackTime;
  }

  try {
    return new Intl.DateTimeFormat(locale, {
      hour: "numeric",
      minute: "2-digit",
      timeZone,
    }).format(date);
  } catch {
    return fallbackTime;
  }
}
