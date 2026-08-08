// Small shared display formatters — used by the Academy Dashboard,
// Learning Paths, and the Certificate view.

export function formatMinutes(totalMinutes: number): string {
  if (totalMinutes < 60) return `${totalMinutes} min`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`;
}

/** yyyy-mm-dd -> "January 5, 2026" (falls back to the raw string if it
 *  doesn't parse — never throws on unexpected/legacy stored data). */
export function formatDate(isoDate: string): string {
  const parsed = new Date(isoDate + "T00:00:00");
  if (Number.isNaN(parsed.getTime())) return isoDate;
  return parsed.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}
