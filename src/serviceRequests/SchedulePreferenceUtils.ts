const DATE_KEY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export function toLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function fromLocalDateKey(value: string): Date | null {
  const match = DATE_KEY_PATTERN.exec(value);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day, 12);

  if (
    date.getFullYear() !== year
    || date.getMonth() !== month - 1
    || date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

export function isFutureServiceDate(value: string, now = new Date()): boolean {
  const date = fromLocalDateKey(value);
  if (!date) return false;

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12);
  return date.getTime() > today.getTime();
}

export function isTodayServiceDate(value: string, now = new Date()): boolean {
  const date = fromLocalDateKey(value);
  if (!date) return false;

  return date.getFullYear() === now.getFullYear()
    && date.getMonth() === now.getMonth()
    && date.getDate() === now.getDate();
}

export function isPastServiceDate(value: string, now = new Date()): boolean {
  const date = fromLocalDateKey(value);
  if (!date) return true;

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12);
  return date.getTime() < today.getTime();
}

export function formatServiceDate(value: string): string {
  const date = fromLocalDateKey(value);
  if (!date) return value;

  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}
