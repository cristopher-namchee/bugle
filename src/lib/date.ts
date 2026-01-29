/**
 * Format a date instace with Day, Date Month Year format.
 * 
 * @param {string | number | Date} date Date-like object 
 * @param {Intl.DateTimeFormatOptions} options Options
 * override for date time formatting.
 * @returns {string} A formatted date, according to the specification
 */
export function formatDate(
  date: string | number | Date,
  options?: Intl.DateTimeFormatOptions,
): string {
  return new Date(date).toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options,
  });
}
