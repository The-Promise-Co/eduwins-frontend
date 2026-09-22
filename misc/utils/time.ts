export function formatTime(value?: string | null): string {
  if (!value) return '';
  const match = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(value.trim());
  if (!match) return value;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (Number.isNaN(hours) || Number.isNaN(minutes) || hours > 23 || minutes > 59) return value;

  const period = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
}

export function formatTimeRange(start?: string | null, end?: string | null): string {
  if (!start && !end) return '';
  if (!start) return formatTime(end);
  if (!end) return formatTime(start);
  return `${formatTime(start)} - ${formatTime(end)}`;
}
