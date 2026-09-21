'use client';

import { useEffect, useState } from 'react';
import { Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { SessionTiming } from '@/misc/types/session';
import { computeSessionTiming, formatCountdown, getNextEndNotificationThreshold } from '@/misc/utils/sessionTiming';
import { Booking } from '@/misc/types';

interface SessionCountdownBannerProps {
  booking: Booking;
  onJoinWindowOpen?: () => void;
}

export default function SessionCountdownBanner({ booking, onJoinWindowOpen }: SessionCountdownBannerProps) {
  const [timing, setTiming] = useState<SessionTiming>(() => computeSessionTiming(booking));
  const [activeThreshold, setActiveThreshold] = useState<number | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const updated = computeSessionTiming(booking);
      setTiming(updated);

      if (updated.canJoin && timing.timeUntilStart > 0) {
        onJoinWindowOpen?.();
      }

      if (updated.canJoin && !updated.isEnded) {
        const threshold = getNextEndNotificationThreshold(updated.scheduledEnd);
        setActiveThreshold(threshold);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [booking, timing.timeUntilStart, onJoinWindowOpen]);

  if (timing.isEnded) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4 flex items-center gap-3">
        <CheckCircle size={18} className="text-gray-400 shrink-0" />
        <div>
          <p className="text-sm font-black text-gray-700">Session ended</p>
          <p className="text-xs text-gray-500 mt-0.5">This session has concluded.</p>
        </div>
      </div>
    );
  }

  if (!timing.canJoin && timing.timeUntilStart > 0) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 flex items-center gap-3">
        <Clock size={18} className="text-amber-600 shrink-0" />
        <div>
          <p className="text-sm font-black text-amber-900">
            Session starts in {formatCountdown(timing.timeUntilStart)}
          </p>
          <p className="text-xs text-amber-700 mt-0.5">You can join 15 minutes before the scheduled start time.</p>
        </div>
      </div>
    );
  }

  if (activeThreshold !== null) {
    return (
      <div className="rounded-2xl border border-orange-200 bg-orange-50 px-5 py-4 flex items-center gap-3">
        <AlertTriangle size={18} className="text-orange-600 shrink-0" />
        <div>
          <p className="text-sm font-black text-orange-900">
            Session ends in {formatCountdown(timing.timeUntilEnd)}
          </p>
          <p className="text-xs text-orange-700 mt-0.5">This session will auto-end shortly.</p>
        </div>
      </div>
    );
  }

  return null;
}
