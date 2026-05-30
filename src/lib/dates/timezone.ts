const MS_IN_MINUTE = 60_000;

export function getDeviceTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC";
}

export function isValidTimeZone(timeZone: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone }).format();
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
  const localizedDate = new Date(
    date.toLocaleString("en-US", {
      timeZone,
    })
  );
  return Math.round((localizedDate.getTime() - date.getTime()) / MS_IN_MINUTE);
}
