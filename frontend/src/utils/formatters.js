/**
 * Utility Formatters
 */

/**
 * Format currency to VND
 * @param {number} amount
 * @returns {string} e.g. "250.000 ₫"
 */
export function formatCurrency(amount) {
  if (amount === undefined || amount === null || isNaN(amount)) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format date string to Vietnamese localized date
 * @param {string|Date} date
 * @param {object} options
 * @returns {string}
 */
export function formatDate(date, options = {}) {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...options,
  }).format(d);
}

/**
 * Format date and time
 * @param {string|Date} date
 * @returns {string} e.g. "14:30 25/11/2026"
 */
export function formatDateTime(date) {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';

  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
}

/**
 * Format time only
 * @param {string|Date} date
 * @returns {string} e.g. "14:30"
 */
export function formatTime(date) {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';

  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

/**
 * Format minutes into duration string
 * @param {number} minutes
 * @returns {string} e.g. "1 giờ 30 phút"
 */
export function formatDuration(minutes) {
  if (!minutes || minutes <= 0) return '0 phút';
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (hours === 0) return `${remainingMinutes} phút`;
  if (remainingMinutes === 0) return `${hours} giờ`;
  return `${hours} giờ ${remainingMinutes} phút`;
}
