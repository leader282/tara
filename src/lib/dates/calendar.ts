const DATE_KEY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_KEY_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

export type DateParts = {
  year: number;
  month: number;
  day: number;
};

export type TimeParts = {
  hours: number;
  minutes: number;
};

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

export function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function toDateKeyFromParts({ year, month, day }: DateParts): string {
  return `${year}-${pad(month)}-${pad(day)}`;
}

export function parseDateKey(value: string | null | undefined): DateParts | null {
  const match = value?.trim().match(DATE_KEY_PATTERN);
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);

  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }

  return { year, month, day };
}

export function compareDateKeys(left: string, right: string): number {
  if (left === right) {
    return 0;
  }

  return left < right ? -1 : 1;
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/** Weeks for a month grid starting on Sunday; days outside the month are null. */
export function getMonthGrid(year: number, month: number): (number | null)[][] {
  const firstWeekday = new Date(year, month - 1, 1).getDay();
  const daysInMonth = getDaysInMonth(year, month);
  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  const weeks: (number | null)[][] = [];
  for (let index = 0; index < cells.length; index += 7) {
    weeks.push(cells.slice(index, index + 7));
  }

  return weeks;
}

export function shiftMonth(year: number, month: number, offset: number): { year: number; month: number } {
  const shifted = new Date(year, month - 1 + offset, 1);
  return { year: shifted.getFullYear(), month: shifted.getMonth() + 1 };
}

/** Moves a month into the [minDate, maxDate] range so the calendar never lands on an all-disabled month. */
export function clampMonthToRange(
  target: { year: number; month: number },
  minDate?: string,
  maxDate?: string,
): { year: number; month: number } {
  const monthIndex = (parts: { year: number; month: number }) => parts.year * 12 + parts.month;
  const min = parseDateKey(minDate);
  const max = parseDateKey(maxDate);

  if (min && monthIndex(target) < monthIndex(min)) {
    return { year: min.year, month: min.month };
  }

  if (max && monthIndex(target) > monthIndex(max)) {
    return { year: max.year, month: max.month };
  }

  return target;
}

export function parseTimeKey(value: string | null | undefined): TimeParts | null {
  const match = value?.trim().match(TIME_KEY_PATTERN);
  if (!match) {
    return null;
  }

  return { hours: Number(match[1]), minutes: Number(match[2]) };
}

export function toTimeKey({ hours, minutes }: TimeParts): string {
  return `${pad(hours)}:${pad(minutes)}`;
}

export function formatTimeKey(value: string | null | undefined, locale = "en-US"): string | null {
  const parts = parseTimeKey(value);
  if (!parts) {
    return null;
  }

  return new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit" }).format(
    new Date(2000, 0, 1, parts.hours, parts.minutes),
  );
}

export function formatDateKey(
  value: string | null | undefined,
  options: Intl.DateTimeFormatOptions = { weekday: "short", month: "short", day: "numeric", year: "numeric" },
  locale = "en-US",
): string | null {
  const parts = parseDateKey(value);
  if (!parts) {
    return null;
  }

  return new Intl.DateTimeFormat(locale, options).format(
    new Date(parts.year, parts.month - 1, parts.day),
  );
}
