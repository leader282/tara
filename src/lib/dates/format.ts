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
  const normalizedDate = dateString?.trim();
  if (!normalizedDate) {
    return null;
  }

  const parsedDateParts = parseDateOnlyToParts(normalizedDate);
  if (!parsedDateParts) {
    return null;
  }

  const normalizedTime = timeString?.trim();
  const [hours, minutes] = normalizedTime && HH_MM_PATTERN.test(normalizedTime)
    ? normalizedTime.split(":").map(Number)
    : [12, 0];

  if (
    normalizedTime &&
    (!HH_MM_PATTERN.test(normalizedTime) || !Number.isInteger(hours) || !Number.isInteger(minutes))
  ) {
    return null;
  }

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
