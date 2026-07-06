/**
 * Shared date helpers for daily sessions.
 * Uses dateKey (YYYY-MM-DD) for reliable MongoDB lookups.
 * Always treats YYYY-MM-DD strings as local calendar dates (not UTC).
 */
export function toDateKey(date) {
  const d = parseToLocalDay(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function startOfDay(date = new Date()) {
  return parseToLocalDay(date);
}

export function dateFromKey(dateKey) {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

/**
 * Normalize any date input to local midnight.
 */
export function parseToLocalDay(date) {
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return dateFromKey(date);
  }
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}
