/**
 * Utility functions shared across the application.
 */

const DATE_LOCALE = 'ar-EG';
const DATE_OPTIONS = {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  calendar: 'gregory',
};

export function formatNumber(value, decimals = 2) {
  const num = parseFloat(value) || 0;
  return num.toFixed(decimals);
}

/** Gregorian date as DD/MM/YYYY (ar-EG, not Hijri). */
export function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString(DATE_LOCALE, DATE_OPTIONS);
}

/** Short label DD/MM for charts. */
export function formatDateShort(date) {
  const formatted = formatDate(date);
  const parts = formatted.split('/');
  if (parts.length >= 2) {
    return `${parts[0]}/${parts[1]}`;
  }
  return formatted;
}

export function formatDateInput(date) {
  if (!date) return '';
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return date;
  }
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getCurrentTime() {
  return new Date().toTimeString().slice(0, 8);
}

export function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3500);
}

export function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function calculatePrice(weight, pricePerKg) {
  const w = parseFloat(weight) || 0;
  const p = parseFloat(pricePerKg) || 0;
  return Math.round(w * p * 100) / 100;
}
