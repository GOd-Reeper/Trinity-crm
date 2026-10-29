import { ClassSession } from './types';

export interface ClassTimeState {
  scheduledStart: Date;
  scheduledEnd: Date;
  now: Date;
  isUpcoming: boolean;             // Before start_time
  timeUntilStartFormatted: string; // e.g. "in 35m"
  canStart: boolean;               // Between start_time and end_time (status == 'scheduled')
  isLate: boolean;                 // > 10 min after start_time
  lateMinutes: number;             // Minutes late
  isExpiredMissed: boolean;        // After end_time and never started
  canComplete: boolean;            // During in_progress
  statusDisplay: {
    badgeText: string;
    badgeColor: string;
    actionText?: string;
  };
}

export function parseLocalDateTime(dateStr: string, timeStr: string): Date {
  // Safe parsing of "YYYY-MM-DD" and "HH:mm:ss" in user's local timezone
  const cleanTime = timeStr ? timeStr.slice(0, 8) : '00:00:00';
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, minutes, seconds] = cleanTime.split(':').map((n) => Number(n) || 0);
  return new Date(year, month - 1, day, hours, minutes, seconds);
}

export function getClassTimeState(session: ClassSession): ClassTimeState {
  const now = new Date();
  
  // Parse using local date and time strings
  const scheduledStart = parseLocalDateTime(session.class_date, session.start_time);
  const scheduledEnd = parseLocalDateTime(session.class_date, session.end_time);

  const nowMs = now.getTime();
  const startMs = scheduledStart.getTime();
  const endMs = scheduledEnd.getTime();

  // Allow unlock up to 5 minutes early
  const earlyBufferMs = 5 * 60 * 1000;
  const isUpcoming = nowMs < (startMs - earlyBufferMs);

  // Minutes difference from scheduled start
  const diffFromStartMinutes = Math.floor((nowMs - startMs) / (1000 * 60));
  const isLate = diffFromStartMinutes > 10;
  const lateMinutes = Math.max(0, diffFromStartMinutes);

  // Has scheduled class end time passed without being started?
  const isExpiredMissed = (nowMs > endMs) && (session.status === 'scheduled');

  // Can start only if after start time (minus buffer) AND before class end time
  const canStart = (nowMs >= (startMs - earlyBufferMs)) && (nowMs <= endMs) && (session.status === 'scheduled');

  // Can complete if currently in progress
  const canComplete = session.status === 'in_progress';

  // Format countdown string
  let timeUntilStartFormatted = '';
  if (isUpcoming) {
    const diffMins = Math.ceil((startMs - nowMs) / (1000 * 60));
    if (diffMins > 60) {
      const hrs = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      timeUntilStartFormatted = `in ${hrs}h ${mins}m`;
    } else {
      timeUntilStartFormatted = `in ${diffMins}m`;
    }
  }

  // Display badges
  let badgeText = 'Scheduled';
  let badgeColor = 'bg-zinc-100 text-zinc-600 border-zinc-200';

  if (session.status === 'completed') {
    badgeText = 'Completed';
    badgeColor = 'bg-zinc-100 text-zinc-800 border-zinc-200';
  } else if (session.status === 'in_progress') {
    badgeText = 'In Progress';
    badgeColor = 'bg-teal-500 text-zinc-950 border-teal-500 animate-pulse';
  } else if (session.status === 'missed' || isExpiredMissed) {
    badgeText = 'Missed / Expired';
    badgeColor = 'bg-red-100 text-red-800 border-red-200';
  } else if (isUpcoming) {
    badgeText = `Locked (${timeUntilStartFormatted})`;
    badgeColor = 'bg-zinc-100 text-zinc-600 border-zinc-200';
  } else if (canStart) {
    if (isLate) {
      badgeText = `Late Start (+${lateMinutes}m)`;
      badgeColor = 'bg-amber-100 text-amber-900 border-amber-300';
    } else {
      badgeText = 'Ready to Start';
      badgeColor = 'bg-teal-100 text-teal-800 border-teal-200';
    }
  }

  return {
    scheduledStart,
    scheduledEnd,
    now,
    isUpcoming,
    timeUntilStartFormatted,
    canStart,
    isLate,
    lateMinutes,
    isExpiredMissed,
    canComplete,
    statusDisplay: {
      badgeText,
      badgeColor,
    },
  };
}

