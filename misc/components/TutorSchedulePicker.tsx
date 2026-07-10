'use client';

import { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, ChevronLeft, ChevronRight, User, Users } from 'lucide-react';
import Modal from '@/misc/components/Modal';
import { useUser } from '@/misc/context/UserContext';
import { useChildren } from '@/misc/hooks/useChildren';
import { useCreateBookingRequest } from '@/misc/hooks/api/bookings';
import { toast } from 'sonner';

type AvailabilityRange = { from: string; to: string };
type ScheduleDate = {
  key: string;
  date: Date;
  dayKey: string;
  slots: string[];
};

interface TutorSchedulePickerProps {
  availabilityConfig?: Record<string, AvailabilityRange[]> | null;
  bookHref?: string;
  teacherId?: string;
  hourlyRate?: number;
  subject?: string;
}

export interface TutorSchedulePickerRef {
  openBooking: () => void;
}

type BookingStep = 'recipient' | 'children' | 'time' | 'summary';

const DAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const buildDate = (value = new Date()) => new Date(value.getFullYear(), value.getMonth(), value.getDate());

const formatDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const toMinutes = (value: string) => {
  const [hour, minute] = value.split(':').map(Number);
  return hour * 60 + minute;
};

const fromMinutes = (value: number) => {
  const hour = Math.floor(value / 60).toString().padStart(2, '0');
  const minute = (value % 60).toString().padStart(2, '0');
  return `${hour}:${minute}`;
};

const buildSlots = (ranges: AvailabilityRange[] = []) => {
  return ranges.flatMap((range) => {
    const start = toMinutes(range.from);
    const end = toMinutes(range.to);
    const slots: string[] = [];

    for (let time = start; time + 60 <= end; time += 60) {
      slots.push(fromMinutes(time));
    }

    return slots;
  });
};

const buildScheduleDates = (startDate: Date, availabilityConfig?: Record<string, AvailabilityRange[]> | null): ScheduleDate[] => {
  const start = buildDate(startDate);

  return Array.from({ length: 7 }).map((_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);

    const dayKey = DAY_KEYS[date.getDay()];
    const slots = buildSlots(availabilityConfig?.[dayKey] || []);

    return {
      key: formatDateKey(date),
      date,
      dayKey,
      slots,
    };
  });
};

const formatMonth = (date: Date) => date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
const formatDay = (date: Date) => date.toLocaleDateString('en-US', { weekday: 'short' });
const formatSummaryDate = (date: Date) => date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
const buildSelectedTimes = (startTime: string, endTime: string) => {
  if (!TIME_RE.test(startTime) || !TIME_RE.test(endTime)) return [];
  const start = toMinutes(startTime);
  const end = toMinutes(endTime);
  const slots: string[] = [];
  for (let time = start; time + 60 <= end; time += 60) {
    slots.push(fromMinutes(time));
  }
  return slots;
};

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

const PENDING_BOOKING_KEY = 'pendingTutorBookingRequest';

const TutorSchedulePicker = forwardRef<TutorSchedulePickerRef, TutorSchedulePickerProps>(function TutorSchedulePicker({ availabilityConfig, bookHref = '/login', teacherId, hourlyRate = 0, subject }, ref) {
  const router = useRouter();
  const { user, isAuthenticated } = useUser();
  const childrenQuery = useChildren(user?.role);
  const createBookingRequest = useCreateBookingRequest();
  const [weekStart, setWeekStart] = useState(() => buildDate());
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(() => new Date().getFullYear());
  const scheduleDates = useMemo(() => buildScheduleDates(weekStart, availabilityConfig), [availabilityConfig, weekStart]);
  const [selectedDateKey, setSelectedDateKey] = useState('');
  const [selectedTimes, setSelectedTimes] = useState<string[]>([]);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [bookingFor, setBookingFor] = useState<'self' | 'children'>('self');
  const [selectedChildIds, setSelectedChildIds] = useState<string[]>([]);
  const [bookingNote, setBookingNote] = useState('');
  const [bookingStep, setBookingStep] = useState<BookingStep>('recipient');

  useEffect(() => {
    const firstAvailable = scheduleDates.find((item) => item.slots.length > 0);
    if (!firstAvailable) {
      setSelectedDateKey('');
      setSelectedTimes([]);
      return;
    }

    const currentDate = scheduleDates.find((item) => item.key === selectedDateKey && item.slots.length > 0) || firstAvailable;
    setSelectedDateKey(currentDate.key);
    setSelectedTimes((current) => current.length > 0 && current.every((slot) => currentDate.slots.includes(slot)) ? current : [currentDate.slots[0]]);
  }, [scheduleDates, selectedDateKey]);

  const selectedDate = scheduleDates.find((item) => item.key === selectedDateKey) || scheduleDates.find((item) => item.slots.length > 0) || scheduleDates[0];
  const selectedSlots = selectedDate?.slots || [];
  const sortedSelectedTimes = selectedTimes.slice().sort((a, b) => toMinutes(a) - toMinutes(b));
  const startTime = sortedSelectedTimes[0] || '';
  const endTime = sortedSelectedTimes.length > 0 ? fromMinutes(toMinutes(sortedSelectedTimes[sortedSelectedTimes.length - 1]) + 60) : '';
  const durationHours = sortedSelectedTimes.length;
  const totalAmount = hourlyRate * durationHours;
  const selectedChildren = (childrenQuery.data || []).filter((child) => selectedChildIds.includes(child.id));
  const goToWeek = (direction: -1 | 1) => {
    setWeekStart((current) => {
      const next = new Date(current);
      next.setDate(current.getDate() + direction * 7);
      return next;
    });
    setSelectedDateKey('');
    setSelectedTimes([]);
  };
  const selectMonth = (monthIndex: number) => {
    const next = new Date(pickerYear, monthIndex, 1);
    setWeekStart(next);
    setSelectedDateKey('');
    setSelectedTimes([]);
    setMonthPickerOpen(false);
  };
  const selectSlot = (slot: string) => {
    setSelectedTimes((current) => {
      if (current.length === 0) return [slot];

      const sorted = current.slice().sort((a, b) => toMinutes(a) - toMinutes(b));
      const first = sorted[0];
      const last = sorted[sorted.length - 1];
      const slotMinutes = toMinutes(slot);
      const firstMinutes = toMinutes(first);
      const lastMinutes = toMinutes(last);

      if (current.includes(slot)) {
        if (current.length === 1) return current;
        if (slot === first) return sorted.slice(1);
        if (slot === last) return sorted.slice(0, -1);
        return [slot];
      }

      if (slotMinutes === firstMinutes - 60) return [slot, ...sorted];
      if (slotMinutes === lastMinutes + 60) return [...sorted, slot];
      return [slot];
    });
  };
  const toggleChild = (childId: string) => {
    setSelectedChildIds((current) => current.includes(childId) ? current.filter((id) => id !== childId) : [...current, childId]);
  };
  const getBookingPayload = () => {
    if (!teacherId || !selectedDate || !startTime || !endTime) return null;
    return {
      teacherId,
      bookingFor,
      childIds: bookingFor === 'children' ? selectedChildIds : [],
      scheduledDate: selectedDate.key,
      startTime,
      endTime,
      subject,
      note: bookingNote.trim(),
    };
  };
  const openBooking = () => {
    if (!teacherId || !selectedDate || !startTime || !endTime) {
      toast.error('Choose a date and time before booking.');
      return;
    }
    setBookingFor('self');
    setSelectedChildIds([]);
    setBookingNote('');
    setBookingStep('recipient');
    setBookingModalOpen(true);
  };
  useImperativeHandle(ref, () => ({ openBooking }), [teacherId, selectedDate, startTime, endTime]);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'parent' || !teacherId) return;
    const pending = localStorage.getItem(PENDING_BOOKING_KEY);
    if (!pending) return;

    try {
      const payload = JSON.parse(pending);
      if (payload.teacherId !== teacherId) return;
      setBookingFor(payload.bookingFor === 'children' ? 'children' : 'self');
      setSelectedChildIds(Array.isArray(payload.childIds) ? payload.childIds : []);
      setBookingNote(typeof payload.note === 'string' ? payload.note : '');
      setSelectedDateKey(payload.scheduledDate || '');
      setSelectedTimes(buildSelectedTimes(payload.startTime || '', payload.endTime || ''));
      setBookingStep('summary');
      setBookingModalOpen(true);
      localStorage.removeItem(PENDING_BOOKING_KEY);
      toast.success('Review your booking request to continue.');
    } catch {
      localStorage.removeItem(PENDING_BOOKING_KEY);
    }
  }, [isAuthenticated, user?.role, teacherId]);

  const submitBooking = async () => {
    const payload = getBookingPayload();
    if (!payload) return;
    if (bookingFor === 'children' && selectedChildIds.length === 0) {
      toast.error('Select at least one child.');
      return;
    }
    if (!isAuthenticated) {
      localStorage.setItem(PENDING_BOOKING_KEY, JSON.stringify(payload));
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    if (user?.role !== 'parent') {
      toast.error('Only parents can request tutor bookings.');
      return;
    }

    try {
      await createBookingRequest.mutateAsync(payload);
      toast.success('Booking request sent successfully.');
      setBookingModalOpen(false);
      setBookingNote('');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to send booking request.');
    }
  };
  const goNext = () => {
    if (bookingStep === 'recipient') {
      setBookingStep(bookingFor === 'children' ? 'children' : 'time');
      return;
    }
    if (bookingStep === 'children') {
      if (selectedChildIds.length === 0) {
        toast.error('Select at least one child.');
        return;
      }
      setBookingStep('time');
      return;
    }
    if (bookingStep === 'time') {
      if (!startTime || !endTime) {
        toast.error('Choose a date and time.');
        return;
      }
      setBookingStep('summary');
    }
  };
  const goBack = () => {
    if (bookingStep === 'summary') setBookingStep('time');
    else if (bookingStep === 'time') setBookingStep(bookingFor === 'children' ? 'children' : 'recipient');
    else if (bookingStep === 'children') setBookingStep('recipient');
    else setBookingModalOpen(false);
  };
  const renderDateTimeSelector = () => (
    <div className="space-y-4">
      <div className="overflow-x-auto pb-1">
        <div className="grid min-w-[520px] grid-cols-7 gap-2">
          {scheduleDates.map((item) => {
            const isSelected = item.key === selectedDateKey;
            const disabled = item.slots.length === 0;
            return (
              <button key={item.key} type="button" disabled={disabled} onClick={() => { setSelectedDateKey(item.key); setSelectedTimes(item.slots[0] ? [item.slots[0]] : []); }} className={`rounded-2xl px-3 py-3 text-center transition ${isSelected ? 'bg-[#001A72] text-white shadow-lg shadow-[#001A72]/15' : disabled ? 'bg-gray-50 text-gray-300 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-[#001A72]/5 border border-gray-100 hover:border-[#001A72]/10'}`}>
                <span className="block text-[11px] font-medium opacity-80">{formatDay(item.date)}</span>
                <span className="mt-1 block text-sm font-black">{item.date.getDate()}</span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {selectedSlots.map((slot) => {
          const isSelected = selectedTimes.includes(slot);
          return <button key={`modal-${selectedDate?.key}-${slot}`} type="button" onClick={() => selectSlot(slot)} className={`rounded-2xl px-4 py-3 text-xs font-black transition ${isSelected ? 'border border-[#001A72] bg-[#001A72]/5 text-[#001A72]' : 'border border-transparent bg-gray-50 text-gray-700 hover:border-[#001A72]/10 hover:bg-[#001A72]/5'}`}>{slot}</button>;
        })}
      </div>
      <div className="rounded-2xl border border-[#FFB81C]/40 bg-[#FFB81C]/10 px-4 py-3 text-xs font-black text-[#001A72]">
        {selectedDate && startTime && endTime ? `${formatSummaryDate(selectedDate.date)} | ${startTime} - ${endTime}` : 'Choose a date and time'}
      </div>
    </div>
  );

  return (
    <>
    <div className="rounded-[2rem] border border-[#001A72]/10 bg-white p-4 shadow-sm shadow-[#001A72]/5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gray-100 pb-4">
        <p className="text-sm font-semibold text-gray-500">Choose date and time</p>
        <div className="relative flex items-center gap-2 self-start sm:self-auto">
          <button type="button" onClick={() => goToWeek(-1)} className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-100 bg-white text-[#001A72] hover:bg-[#001A72]/5 transition" aria-label="Previous week">
            <ChevronLeft size={16} />
          </button>
          <button type="button" onClick={() => { setPickerYear(weekStart.getFullYear()); setMonthPickerOpen((open) => !open); }} className="inline-flex items-center gap-2 rounded-full bg-[#001A72]/5 px-3 py-2 text-xs font-black text-[#001A72] hover:bg-[#001A72]/10 transition">
            <Calendar size={14} className="text-[#FFB81C]" /> {formatMonth(scheduleDates[0].date)}
          </button>
          <button type="button" onClick={() => goToWeek(1)} className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-100 bg-white text-[#001A72] hover:bg-[#001A72]/5 transition" aria-label="Next week">
            <ChevronRight size={16} />
          </button>

          {monthPickerOpen && (
            <div className="absolute right-0 top-12 z-20 w-72 rounded-3xl border border-[#001A72]/10 bg-white p-4 shadow-xl shadow-[#001A72]/10">
              <div className="flex items-center justify-between gap-3 border-b border-gray-100 pb-3">
                <button type="button" onClick={() => setPickerYear((year) => year - 1)} className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-50 text-[#001A72] hover:bg-[#001A72]/5" aria-label="Previous year">
                  <ChevronLeft size={15} />
                </button>
                <p className="text-sm font-black text-[#001A72]">{pickerYear}</p>
                <button type="button" onClick={() => setPickerYear((year) => year + 1)} className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-50 text-[#001A72] hover:bg-[#001A72]/5" aria-label="Next year">
                  <ChevronRight size={15} />
                </button>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {MONTHS.map((month, index) => {
                  const active = pickerYear === weekStart.getFullYear() && index === weekStart.getMonth();
                  return (
                    <button
                      key={month}
                      type="button"
                      onClick={() => selectMonth(index)}
                      className={`rounded-2xl px-3 py-2.5 text-xs font-black transition ${active ? 'bg-[#001A72] text-white shadow-sm' : 'bg-gray-50 text-gray-600 hover:bg-[#001A72]/5 hover:text-[#001A72]'}`}
                    >
                      {month}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 overflow-x-auto pb-1">
        <div className="grid min-w-[560px] grid-cols-7 gap-2">
          {scheduleDates.map((item) => {
            const isSelected = item.key === selectedDateKey;
            const disabled = item.slots.length === 0;

            return (
              <button
                key={item.key}
                type="button"
                disabled={disabled}
                onClick={() => {
                  setSelectedDateKey(item.key);
                  setSelectedTimes(item.slots[0] ? [item.slots[0]] : []);
                }}
                className={`rounded-2xl px-3 py-3 text-center transition ${isSelected
                  ? 'bg-[#001A72] text-white shadow-lg shadow-[#001A72]/15'
                  : disabled
                    ? 'bg-gray-50 text-gray-300 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-[#001A72]/5 border border-transparent hover:border-[#001A72]/10'
                  }`}
              >
                <span className="block text-[11px] font-medium opacity-80">{formatDay(item.date)}</span>
                <span className="mt-1 block text-sm font-black">{item.date.getDate()}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2">
        {selectedSlots.length > 0 ? selectedSlots.map((slot) => {
          const isSelected = selectedTimes.includes(slot);

          return (
            <button
              key={`${selectedDate?.key}-${slot}`}
              type="button"
              onClick={() => selectSlot(slot)}
              className={`rounded-2xl px-4 py-3 text-xs font-black transition ${isSelected
                ? 'border border-[#001A72] bg-[#001A72]/5 text-[#001A72] shadow-sm'
                : 'border border-transparent bg-gray-50 text-gray-700 hover:border-[#001A72]/10 hover:bg-[#001A72]/5'
                }`}
            >
              {slot}
            </button>
          );
        }) : (
          <div className="col-span-full rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-5 text-sm text-gray-500">
            No time slots available on this date.
          </div>
        )}
      </div>

      <div className="mt-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-[#FFB81C]/40 bg-[#FFB81C]/10 px-4 py-3">
        <p className="text-xs font-black text-[#001A72]">
          {selectedDate && startTime && endTime ? `${formatSummaryDate(selectedDate.date)} | ${startTime} - ${endTime}` : 'Choose a date and time'}
        </p>
        <button type="button" onClick={openBooking} className="inline-flex items-center justify-center rounded-2xl bg-[#FFB81C] px-8 py-3 text-xs font-black uppercase tracking-wider text-[#001A72] hover:bg-[#ffc94d] transition">
          Book
        </button>
      </div>
    </div>

      <Modal
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        title="Request Booking"
        subtitle="Choose who the session is for, confirm time, then send the request."
        size="md"
        footer={(
          <>
            <button type="button" onClick={goBack} className="rounded-xl border border-gray-200 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-gray-500">{bookingStep === 'recipient' ? 'Cancel' : 'Back'}</button>
            <button type="button" onClick={bookingStep === 'summary' ? submitBooking : goNext} disabled={createBookingRequest.isPending} className="rounded-xl bg-[#001A72] px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white disabled:opacity-60">
              {createBookingRequest.isPending ? 'Sending...' : bookingStep === 'summary' ? (isAuthenticated ? 'Send Request' : 'Login To Continue') : 'Continue'}
            </button>
          </>
        )}
      >
        <div className="space-y-5">
          {bookingStep === 'recipient' && <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={() => { setBookingFor('self'); setSelectedChildIds([]); }} className={`rounded-2xl border px-4 py-5 text-left transition ${bookingFor === 'self' ? 'border-[#001A72] bg-[#001A72]/5 shadow-sm' : 'border-gray-100 bg-gray-50 hover:border-[#001A72]/20'}`}>
              <span className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${bookingFor === 'self' ? 'bg-[#001A72] text-white' : 'bg-white text-[#001A72]'}`}><User size={18} /></span>
              <span className="block text-xs font-black uppercase tracking-wider text-gray-800">For Me</span>
              <span className="mt-1 block text-[10px] font-semibold text-gray-400">Book this tutor for yourself.</span>
            </button>
            <button type="button" onClick={() => setBookingFor('children')} className={`rounded-2xl border px-4 py-5 text-left transition ${bookingFor === 'children' ? 'border-[#001A72] bg-[#001A72]/5 shadow-sm' : 'border-gray-100 bg-gray-50 hover:border-[#001A72]/20'}`}>
              <span className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${bookingFor === 'children' ? 'bg-[#001A72] text-white' : 'bg-white text-[#001A72]'}`}><Users size={18} /></span>
              <span className="block text-xs font-black uppercase tracking-wider text-gray-800">For Children</span>
              <span className="mt-1 block text-[10px] font-semibold text-gray-400">Book the same session for one or more children.</span>
            </button>
          </div>}

          {bookingStep === 'children' && (
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Select children</p>
              {childrenQuery.isLoading ? (
                <p className="rounded-xl bg-gray-50 p-4 text-sm text-gray-500">Loading children...</p>
              ) : childrenQuery.data?.length ? (
                <div className="grid sm:grid-cols-2 gap-2">
                  {childrenQuery.data.map((child) => {
                    const active = selectedChildIds.includes(child.id);
                    return (
                      <button key={child.id} type="button" onClick={() => toggleChild(child.id)} className={`rounded-2xl border px-4 py-3 text-left transition ${active ? 'border-[#001A72] bg-[#001A72]/5' : 'border-gray-100 bg-gray-50 hover:border-[#001A72]/20'}`}>
                        <p className="text-sm font-black text-gray-800">{child.firstName} {child.lastName}</p>
                        {child.grade && <p className="text-xs text-gray-400 mt-0.5">{child.grade}</p>}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="rounded-xl bg-gray-50 p-4 text-sm text-gray-500">No children found. Add children from your dashboard first.</p>
              )}
            </div>
          )}

          {bookingStep === 'time' && renderDateTimeSelector()}

          {bookingStep === 'summary' && <div className="rounded-2xl border border-[#001A72]/10 bg-[#001A72]/5 p-4 space-y-2">
            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="font-bold text-gray-500">Booking For</span>
              <span className="font-black text-gray-800 text-right">{bookingFor === 'self' ? 'Me' : selectedChildren.map((child) => `${child.firstName} ${child.lastName}`).join(', ')}</span>
            </div>
            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="font-bold text-gray-500">Session</span>
              <span className="font-black text-[#001A72] text-right">{selectedDate && startTime && endTime ? `${formatSummaryDate(selectedDate.date)} | ${startTime} - ${endTime}` : 'Not selected'}</span>
            </div>
            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="font-bold text-gray-500">Duration</span>
              <span className="font-black text-gray-800">{durationHours} hour{durationHours === 1 ? '' : 's'}</span>
            </div>
            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="font-bold text-gray-500">Hourly Rate</span>
              <span className="font-black text-gray-800">₦{hourlyRate.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between gap-4 border-t border-[#001A72]/10 pt-3 text-sm">
              <span className="font-black text-gray-800">Total</span>
              <span className="text-lg font-black text-[#001A72]">₦{totalAmount.toLocaleString()}</span>
            </div>
            <div className="border-t border-[#001A72]/10 pt-3">
              <label htmlFor="booking-note" className="mb-2 block text-[10px] font-black uppercase tracking-wider text-gray-500">Anything else the tutor should know?</label>
              <textarea
                id="booking-note"
                value={bookingNote}
                onChange={(event) => setBookingNote(event.target.value.slice(0, 1000))}
                rows={4}
                className="w-full resize-none rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-[#001A72] focus:ring-4 focus:ring-[#001A72]/10"
                placeholder="Share learning goals, topics to focus on, current challenges, preferred teaching style, or anything helpful."
              />
              <p className="mt-1 text-right text-[10px] font-semibold text-gray-400">{bookingNote.length}/1000</p>
            </div>
            <p className="text-[10px] font-semibold text-gray-400">Multiple children are taught in the same session, so the price is based on tutor time, not child count.</p>
          </div>}
        </div>
      </Modal>
    </>
  );
});

export default TutorSchedulePicker;
