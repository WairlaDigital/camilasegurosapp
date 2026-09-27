// Policy start dates travel as "YYYY-MM-DD" (the format of POST /query-info and
// of <input type="date">), so they compare as strings.

const limaDate = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Lima",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Today in Peru, whatever the server or browser time zone is. */
export function todayInLima(now: Date = new Date()): string {
  return limaDate.format(now);
}

export function addDays(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

/** "2026-09-27" → "27/09/2026". */
export function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year}`;
}
