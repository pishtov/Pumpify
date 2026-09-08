export function toDateStr(year, month, day) {
  const mm = String(month + 1).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

export function parseDateStr(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function shiftDateStr(dateStr, deltaDays) {
  const date = parseDateStr(dateStr);
  date.setDate(date.getDate() + deltaDays);
  return toDateStr(date.getFullYear(), date.getMonth(), date.getDate());
}

export function formatDateHeading(dateStr) {
  return parseDateStr(dateStr).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

export function todayDateStr() {
  const today = new Date();
  return toDateStr(today.getFullYear(), today.getMonth(), today.getDate());
}
