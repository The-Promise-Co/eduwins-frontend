import { SessionTiming, JOIN_WINDOW_MINUTES, END_NOTIFICATION_THRESHOLDS } from '@/misc/types/session';
import { Booking } from '@/misc/types';
import { parseBookingDateTime } from '@/misc/utils/bookingTime';

export function computeSessionTiming(booking?: Booking | null): SessionTiming {
  if (!booking || !booking.scheduledDate || !booking.startTime) {
    const now = new Date();
    return {
      scheduledStart: now,
      scheduledEnd: now,
      joinWindowOpen: now,
      canJoin: false,
      isEnded: false,
      timeUntilStart: 0,
      timeUntilEnd: 0,
    };
  }
  // Booking wall-clock is Africa/Lagos time — parse explicitly so countdown
  // and canJoin agree with the server regardless of browser timezone.
  const start = parseBookingDateTime(booking.scheduledDate, booking.startTime);
  if (!start) {
    const now = new Date();
    return {
      scheduledStart: now,
      scheduledEnd: now,
      joinWindowOpen: now,
      canJoin: false,
      isEnded: false,
      timeUntilStart: 0,
      timeUntilEnd: 0,
    };
  }
  const durationMs = Number(booking.durationHours || 1) * 60 * 60 * 1000;
  const end = new Date(start.getTime() + durationMs);
  const joinWindowOpen = new Date(start.getTime() - JOIN_WINDOW_MINUTES * 60 * 1000);
  const now = new Date();

  return {
    scheduledStart: start,
    scheduledEnd: end,
    joinWindowOpen,
    canJoin: now >= joinWindowOpen && now < end,
    isEnded: now >= end,
    timeUntilStart: joinWindowOpen.getTime() - now.getTime(),
    timeUntilEnd: end.getTime() - now.getTime(),
  };
}

export function getNextEndNotificationThreshold(endTime: Date): number | null {
  const now = Date.now();
  const endMs = endTime.getTime();
  const thresholds = [...END_NOTIFICATION_THRESHOLDS].sort((a, b) => b - a);

  for (const minutes of thresholds) {
    const thresholdMs = endMs - minutes * 60 * 1000;
    if (now >= thresholdMs && now < thresholdMs + 60 * 1000) {
      return minutes;
    }
  }
  return null;
}

export function formatCountdown(ms: number): string {
  if (ms <= 0) return '0:00';
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
