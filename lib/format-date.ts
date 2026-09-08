const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 31536000],
  ["month", 2592000],
  ["week", 604800],
  ["day", 86400],
  ["hour", 3600],
  ["minute", 60],
];

const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

/** "3 hours ago", "2 days ago", etc. Falls back to "just now" for anything under a minute. */
export function formatDistanceToNow(isoDate: string): string {
  const seconds = Math.round((Date.now() - new Date(isoDate).getTime()) / 1000);
  if (seconds < 60) return "just now";

  for (const [unit, secondsInUnit] of UNITS) {
    if (seconds >= secondsInUnit) {
      return rtf.format(-Math.round(seconds / secondsInUnit), unit);
    }
  }
  return "just now";
}

const eventDateTimeFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});
const eventTimeFormatter = new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" });

/** "Sep 12, 6:00 PM", or with an end time "Sep 12, 6:00 PM – 8:00 PM" (just the time if same day). */
export function formatEventTime(startsAt: string, endsAt: string | null): string {
  const start = new Date(startsAt);
  const startLabel = eventDateTimeFormatter.format(start);
  if (!endsAt) return startLabel;

  const end = new Date(endsAt);
  const sameDay = start.toDateString() === end.toDateString();
  return `${startLabel} – ${sameDay ? eventTimeFormatter.format(end) : eventDateTimeFormatter.format(end)}`;
}
