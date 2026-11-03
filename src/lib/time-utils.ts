// Unified Indian Standard Time (IST, UTC+05:30) & 12-Hour AM/PM Utility

/**
 * Returns current date string formatted as "YYYY-MM-DD" strictly in IST.
 */
export function getTodayIST(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

/**
 * Converts a 24-hour time string ("HH:mm:ss" or "HH:mm") into 12-hour AM/PM format (e.g. "06:00 PM").
 */
export function formatTime12Hour(timeStr?: string | null): string {
  if (!timeStr) return '--';
  const clean = timeStr.trim();
  const parts = clean.split(':');
  if (parts.length < 2) return clean;

  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);

  if (isNaN(hours) || isNaN(minutes)) return clean;

  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  const displayHoursStr = String(displayHours).padStart(2, '0');
  const displayMinutesStr = String(minutes).padStart(2, '0');

  return `${displayHoursStr}:${displayMinutesStr} ${period}`;
}

/**
 * Formats a time range (e.g. "18:00:00" to "19:00:00" -> "06:00 PM - 07:00 PM").
 */
export function formatTimeRange12Hour(startStr?: string | null, endStr?: string | null): string {
  if (!startStr) return '--';
  const formattedStart = formatTime12Hour(startStr);
  if (!endStr) return formattedStart;
  const formattedEnd = formatTime12Hour(endStr);
  return `${formattedStart} - ${formattedEnd}`;
}

/**
 * Formats an ISO string or Date into IST 12-hour format (e.g. "02:30 PM").
 */
export function formatTimeOnlyIST(dateOrIso?: string | Date | null): string {
  if (!dateOrIso) return '--';
  try {
    const d = typeof dateOrIso === 'string' ? new Date(dateOrIso) : dateOrIso;
    if (isNaN(d.getTime())) return '--';

    return new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(d);
  } catch {
    return '--';
  }
}

/**
 * Formats a date string (YYYY-MM-DD or ISO) into a clean IST readable date (e.g. "03 Nov 2026").
 */
export function formatDateIST(dateOrIso?: string | Date | null): string {
  if (!dateOrIso) return '--';
  try {
    // If it's a simple YYYY-MM-DD string, parse parts to avoid timezone shift
    if (typeof dateOrIso === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateOrIso)) {
      const [year, month, day] = dateOrIso.split('-').map(Number);
      const d = new Date(year, month - 1, day);
      return new Intl.DateTimeFormat('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(d);
    }

    const d = typeof dateOrIso === 'string' ? new Date(dateOrIso) : dateOrIso;
    if (isNaN(d.getTime())) return '--';

    return new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(d);
  } catch {
    return String(dateOrIso);
  }
}

/**
 * Formats an ISO string into both Date and Time in IST (e.g. "03 Nov 2026, 06:15 PM").
 */
export function formatDateTimeIST(dateOrIso?: string | Date | null): string {
  if (!dateOrIso) return '--';
  try {
    const d = typeof dateOrIso === 'string' ? new Date(dateOrIso) : dateOrIso;
    if (isNaN(d.getTime())) return '--';

    return new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(d);
  } catch {
    return '--';
  }
}

/**
 * Converts 12-hour format (hour 1-12, minute 0-59, 'AM' | 'PM') to 24-hour "HH:mm:ss" for database storage.
 */
export function to24HourTime(hour12: number, minute: number, period: 'AM' | 'PM'): string {
  let h = hour12 % 12;
  if (period === 'PM') {
    h += 12;
  }
  const hh = String(h).padStart(2, '0');
  const mm = String(minute).padStart(2, '0');
  return `${hh}:${mm}:00`;
}

/**
 * Parses "HH:mm:ss" or "HH:mm" into 12-hour components.
 */
export function from24HourTime(timeStr?: string | null): { hour12: number; minute: number; period: 'AM' | 'PM' } {
  if (!timeStr) {
    return { hour12: 10, minute: 0, period: 'AM' };
  }
  const clean = timeStr.trim();
  const parts = clean.split(':');
  const h24 = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;

  const period: 'AM' | 'PM' = h24 >= 12 ? 'PM' : 'AM';
  const hour12 = h24 % 12 === 0 ? 12 : h24 % 12;

  return { hour12, minute: m, period };
}

