/**
 * Gregorian date formatting (ar-EG) — DD/MM/YYYY
 * Do not use ar-SA (Hijri calendar).
 */
const DATE_OPTIONS = {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  calendar: 'gregory',
};

export function formatDateGregorian(date) {
  if (!date) return '';
  return new Date(date).toLocaleDateString('ar-EG', DATE_OPTIONS);
}

export function formatDateShortGregorian(date) {
  const formatted = formatDateGregorian(date);
  const parts = formatted.split('/');
  if (parts.length >= 2) {
    return `${parts[0]}/${parts[1]}`;
  }
  return formatted;
}
