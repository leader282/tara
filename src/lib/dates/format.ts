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
