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

export function getTimezoneOffsetMinutes(timeZone: string, date = new Date()): number {
  if (!isValidTimeZone(timeZone)) {
    return 0;
  }

  try {
    const localizedDate = new Date(
      date.toLocaleString("en-US", {
        timeZone,
      })
    );
    return Math.round((localizedDate.getTime() - date.getTime()) / MS_IN_MINUTE);
  } catch {
    return 0;
  }
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
