'use client';

import { useEffect, useMemo, useRef, useState, ReactElement, ChangeEvent, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, Banknote, Calendar, Tags, X, PlusCircle, Copy } from 'lucide-react';
import PageHeader from '@/misc/components/PageHeader';
import Button from '@/misc/components/Button';
import { useUpdateProfile } from '@/misc/hooks/api/auth';
import { useProfileCompletion } from '@/misc/hooks/api/uploads';
import { useUser } from '@/misc/context/UserContext';
import { TeacherProfile } from '@/misc/types';
import { useSubjects } from '@/app/app/courses/misc/api';
import { toast } from 'sonner';

type TimeRange = { from: string; to: string };
type AvailabilityConfig = Record<string, TimeRange[]>;

const DAYS = [
  { key: 'sunday', short: 'S', label: 'Sunday' },
  { key: 'monday', short: 'M', label: 'Monday' },
  { key: 'tuesday', short: 'T', label: 'Tuesday' },
  { key: 'wednesday', short: 'W', label: 'Wednesday' },
  { key: 'thursday', short: 'T', label: 'Thursday' },
  { key: 'friday', short: 'F', label: 'Friday' },
  { key: 'saturday', short: 'S', label: 'Saturday' },
];

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const DEFAULT_RANGE = { from: '09:00', to: '18:00' };
const toMinutes = (value: string) => {
  const [hour, minute] = value.split(':').map(Number);
  return hour * 60 + minute;
};
const isValidRange = (range: TimeRange) => TIME_RE.test(range.from) && TIME_RE.test(range.to) && toMinutes(range.to) > toMinutes(range.from);

const emptyAvailability = (): AvailabilityConfig => DAYS.reduce<AvailabilityConfig>((acc, day) => {
  acc[day.key] = [];
  return acc;
}, {});

const normalizeAvailability = (config: unknown): AvailabilityConfig => {
  const next = emptyAvailability();
  if (!config || typeof config !== 'object' || Array.isArray(config)) return next;

  Object.entries(config as Record<string, unknown>).forEach(([key, ranges]) => {
    const day = DAYS.find((item) => item.key === key.toLowerCase())?.key;
    if (!day || !Array.isArray(ranges)) return;
    next[day] = ranges
      .filter((range): range is TimeRange => !!range && typeof range === 'object' && typeof (range as any).from === 'string' && typeof (range as any).to === 'string')
      .map((range) => ({ from: range.from, to: range.to }))
      .filter(isValidRange);
  });

  return next;
};

const hasAvailability = (config: AvailabilityConfig) => Object.values(config).some((ranges) => ranges.some(isValidRange));

const validateAvailability = (config: AvailabilityConfig) => {
  const errors: Record<string, Record<number, string>> = {};

  DAYS.forEach((day) => {
    const ranges = config[day.key] || [];
    ranges.forEach((range, index) => {
      if (!TIME_RE.test(range.from) || !TIME_RE.test(range.to)) {
        errors[day.key] = { ...(errors[day.key] || {}), [index]: 'Use HH:mm time format.' };
        return;
      }
      if (toMinutes(range.from) >= toMinutes(range.to)) {
        errors[day.key] = { ...(errors[day.key] || {}), [index]: 'Start time must be before end time.' };
      }
    });

    const validRanges = ranges
      .map((range, index) => ({ ...range, index }))
      .filter((range) => TIME_RE.test(range.from) && TIME_RE.test(range.to))
      .sort((a, b) => toMinutes(a.from) - toMinutes(b.from));

    for (let i = 1; i < validRanges.length; i += 1) {
      const previous = validRanges[i - 1];
      const current = validRanges[i];
      if (toMinutes(current.from) < toMinutes(previous.to)) {
        errors[day.key] = {
          ...(errors[day.key] || {}),
          [previous.index]: errors[day.key]?.[previous.index] || 'Time ranges cannot overlap.',
          [current.index]: 'Time ranges cannot overlap.',
        };
      }
    }
  });

  return errors;
};

const hasValidationErrors = (errors: Record<string, Record<number, string>>) => Object.values(errors).some((dayErrors) => Object.keys(dayErrors).length > 0);

const sortAvailability = (config: AvailabilityConfig): AvailabilityConfig => {
  const next = emptyAvailability();
  DAYS.forEach((day) => {
    next[day.key] = (config[day.key] || []).slice().sort((a, b) => toMinutes(a.from) - toMinutes(b.from));
  });
  return next;
};

const normalizeTime = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
};

const finalizeTime = (value: string) => {
  const normalized = normalizeTime(value);
  const [hour = '', minute = ''] = normalized.split(':');
  if (!hour) return '';
  const safeHour = Math.min(Math.max(Number(hour), 0), 23).toString().padStart(2, '0');
  const safeMinute = Math.min(Math.max(Number(minute || 0), 0), 59).toString().padStart(2, '0');
  return `${safeHour}:${safeMinute}`;
};

const buildTimeOptions = (minuteStep = 15) => {
  const options: string[] = [];
  for (let hour = 0; hour < 24; hour += 1) {
    for (let minute = 0; minute < 60; minute += minuteStep) {
      options.push(`${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);
    }
  }
  return options;
};

export default function TeachingSettingsPage(): ReactElement {
  const router = useRouter();
  const { user: ctxUser, refreshUser } = useUser();
  const updateProfileMutation = useUpdateProfile();
  const completionQuery = useProfileCompletion();
  const subjectsQuery = useSubjects();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<TeacherProfile | null>(null);
  const [subjectSearch, setSubjectSearch] = useState('');
  const [formData, setFormData] = useState({
    subjects: [] as string[],
    hourlyRate: '',
    availabilityConfig: emptyAvailability(),
  });
  const timeOptions = useMemo(() => buildTimeOptions(30), []);

  const applyUser = (userData: TeacherProfile) => {
    setUser(userData);
    setFormData({
      subjects: userData.subjects || [],
      hourlyRate: String(userData.hourlyRate ?? userData.baseHourlyRate ?? ''),
      availabilityConfig: normalizeAvailability(userData.availabilityConfig),
    });
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userJson = localStorage.getItem('user');
    if (!token || !userJson) {
      router.push('/login');
      return;
    }

    try {
      const userData = JSON.parse(userJson) as TeacherProfile;
      if (userData.role !== 'teacher') {
        router.replace('/app/profile');
        return;
      }
      applyUser(userData);
    } catch (err) {
      console.error(err);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (!ctxUser || ctxUser.role !== 'teacher') return;
    applyUser(ctxUser);
  }, [ctxUser]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const addSubject = (subject: string) => {
    const trimmed = subject.trim();
    if (!trimmed || formData.subjects.includes(trimmed)) return;
    setFormData((prev) => ({ ...prev, subjects: [...prev.subjects, trimmed] }));
    setSubjectSearch('');
  };

  const removeSubject = (subject: string) => {
    setFormData((prev) => ({ ...prev, subjects: prev.subjects.filter((item) => item !== subject) }));
  };

  const addRange = (day: string) => {
    setFormData((prev) => ({
      ...prev,
      availabilityConfig: {
        ...prev.availabilityConfig,
        [day]: [...(prev.availabilityConfig[day] || []), { ...DEFAULT_RANGE }],
      },
    }));
  };

  const removeRange = (day: string, index: number) => {
    setFormData((prev) => ({
      ...prev,
      availabilityConfig: {
        ...prev.availabilityConfig,
        [day]: (prev.availabilityConfig[day] || []).filter((_, itemIndex) => itemIndex !== index),
      },
    }));
  };

  const updateRange = (day: string, index: number, key: keyof TimeRange, value: string) => {
    setFormData((prev) => ({
      ...prev,
      availabilityConfig: {
        ...prev.availabilityConfig,
        [day]: (prev.availabilityConfig[day] || []).map((range, itemIndex) => itemIndex === index ? { ...range, [key]: value } : range),
      },
    }));
  };

  const copyFirstAvailableDay = (targetDay: string) => {
    const source = DAYS.find((day) => day.key !== targetDay && (formData.availabilityConfig[day.key] || []).length > 0);
    if (!source) return;
    setFormData((prev) => ({
      ...prev,
      availabilityConfig: {
        ...prev.availabilityConfig,
        [targetDay]: (prev.availabilityConfig[source.key] || []).map((range) => ({ ...range })),
      },
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const normalizedConfig = normalizeAvailability(formData.availabilityConfig);
      const validationErrors = validateAvailability(formData.availabilityConfig);
      if (hasValidationErrors(validationErrors)) {
        toast.error('Fix overlapping or invalid availability times before saving.');
        return;
      }
      const sortedConfig = sortAvailability(normalizedConfig);
      const isAvailable = hasAvailability(normalizedConfig);
      const payload = {
        subjects: formData.subjects,
        hourlyRate: formData.hourlyRate ? Number(formData.hourlyRate) : undefined,
        availability: isAvailable,
        availabilityConfig: isAvailable ? sortedConfig : null,
      };
      await updateProfileMutation.mutateAsync(payload);
      const updated = { ...(user || {}), ...payload } as TeacherProfile;
      localStorage.setItem('user', JSON.stringify(updated));
      setUser(updated);
      await refreshUser();
      await completionQuery.refetch();
      toast.success('Teaching settings updated successfully!');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update teaching settings.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#001A72]" />
      </div>
    );
  }

  const saving = updateProfileMutation.isPending;
  const subjectOptions = (subjectsQuery.data || [])
    .map((subject) => subject.name)
    .filter((name) => name.toLowerCase().includes(subjectSearch.toLowerCase()) && !formData.subjects.includes(name));
  const visibleSubjectOptions = subjectOptions.slice(0, 12);
  const validationErrors = validateAvailability(formData.availabilityConfig);

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-12">
      <PageHeader
        title="Teaching"
        subtitle="Manage the subjects you teach, your hourly pay, and your weekly availability"
      />

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden p-6 space-y-6">
        <div className="flex items-center gap-2 pb-3 border-b border-gray-50">
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-[#001A72]">
            <BookOpen size={16} />
          </div>
          <div>
            <h2 className="text-xs font-black text-gray-700 uppercase tracking-widest">Teaching Settings</h2>
            <p className="text-[10px] text-gray-400 mt-0.5 leading-normal">
              These fields contribute to your public tutor profile completion score.
            </p>
          </div>
        </div>

        <div className="divide-y divide-gray-50">
          <SettingsRow icon={<Tags size={16} className="text-[#001A72]" />} label="Subjects" sub="Choose from available subjects. Selected subjects appear below.">
            <div className="space-y-3">
              <input
                value={subjectSearch}
                onChange={(e) => setSubjectSearch(e.target.value)}
                className={INPUT}
                placeholder={subjectsQuery.isLoading ? 'Loading subjects...' : 'Search subjects'}
              />
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-2 max-h-56 overflow-y-auto">
                {subjectsQuery.isLoading ? (
                  <p className="px-2 py-3 text-[10px] text-gray-400">Loading subjects...</p>
                ) : visibleSubjectOptions.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {visibleSubjectOptions.map((subject) => (
                      <button
                        type="button"
                        key={subject}
                        onClick={() => addSubject(subject)}
                        className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-[10px] font-black text-gray-600 hover:border-[#001A72]/30 hover:text-[#001A72] transition"
                      >
                        {subject}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="px-2 py-3 text-[10px] text-gray-400">No available subjects found.</p>
                )}
              </div>
              {formData.subjects.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {formData.subjects.map((subject) => (
                    <div key={subject} className="inline-flex items-center gap-2 rounded-full border border-[#001A72]/10 bg-[#001A72]/5 px-3 py-1.5">
                      <span className="text-[10px] font-black text-[#001A72]">{subject}</span>
                      <button type="button" onClick={() => removeSubject(subject)} className="rounded-full text-[#001A72]/50 hover:text-red-500 transition" aria-label={`Remove ${subject}`}>
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[10px] text-gray-400">No subjects selected yet.</p>
              )}
            </div>
          </SettingsRow>

          <SettingsRow icon={<Banknote size={16} className="text-[#001A72]" />} label="Hourly Pay" sub="Set the amount students should see for one hour of tutoring.">
            <input name="hourlyRate" type="number" min="0" value={formData.hourlyRate} onChange={handleChange} className={INPUT} placeholder="5000" />
          </SettingsRow>

          <SettingsRow icon={<Calendar size={16} className="text-[#001A72]" />} label="Availability" sub="Add one or more available time ranges per day. Empty days are unavailable.">
            <div className="space-y-3">
              {DAYS.map((day) => {
                const ranges = formData.availabilityConfig[day.key] || [];
                return (
                  <div key={day.key} className="grid grid-cols-[30px_1fr] gap-3 items-start">
                    <div className="w-6 h-6 rounded-full bg-[#001A72] text-white text-[10px] font-black flex items-center justify-center mt-3" title={day.label}>
                      {day.short}
                    </div>
                    <div className="space-y-2 min-w-0">
                      {ranges.length === 0 ? (
                        <div className="flex items-center gap-3 min-h-12">
                          <span className="text-xs text-[#001A72]/70 font-medium">Unavailable</span>
                          <button type="button" onClick={() => addRange(day.key)} className="text-[#001A72] hover:text-[#FFB81C] transition" aria-label={`Add availability for ${day.label}`}>
                            <PlusCircle size={16} />
                          </button>
                        </div>
                      ) : (
                        ranges.map((range, index) => (
                          <div key={`${day.key}-${index}`} className="space-y-1">
                            <div className="flex items-center gap-3">
                              <TimeInput invalid={Boolean(validationErrors[day.key]?.[index])} value={range.from} onChange={(value) => updateRange(day.key, index, 'from', value)} options={timeOptions} />
                              <span className="text-xs text-gray-400">-</span>
                              <TimeInput invalid={Boolean(validationErrors[day.key]?.[index])} value={range.to} onChange={(value) => updateRange(day.key, index, 'to', value)} options={timeOptions} />
                              <button type="button" onClick={() => removeRange(day.key, index)} className="text-[#001A72] hover:text-red-500 transition" aria-label={`Remove ${day.label} availability range`}>
                                <X size={16} />
                              </button>
                              {index === 0 && (
                                <>
                                  <button type="button" onClick={() => addRange(day.key)} className="text-[#001A72] hover:text-[#FFB81C] transition" aria-label={`Add another ${day.label} range`}>
                                    <PlusCircle size={16} />
                                  </button>
                                  <button type="button" onClick={() => copyFirstAvailableDay(day.key)} className="text-[#001A72] hover:text-[#FFB81C] transition" aria-label={`Copy availability to ${day.label}`}>
                                    <Copy size={16} />
                                  </button>
                                </>
                              )}
                            </div>
                            {validationErrors[day.key]?.[index] && (
                              <p className="pl-1 text-[10px] font-bold text-red-500">{validationErrors[day.key][index]}</p>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </SettingsRow>
        </div>

        <div className="pt-6 border-t border-gray-100 flex justify-end">
          <Button type="submit" isLoading={saving} loadingText="Saving teaching settings..." variant="primary" className="px-8 py-3.5 text-xs font-black uppercase tracking-wider">
            Save Teaching Settings
          </Button>
        </div>
      </form>
    </div>
  );
}

function TimeInput({ value, onChange, options, invalid }: { value: string; onChange: (value: string) => void; options: string[]; invalid?: boolean }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const handleInputChange = (nextValue: string) => {
    const formatted = normalizeTime(nextValue);
    onChange(TIME_RE.test(formatted) ? finalizeTime(formatted) : formatted);
  };

  return (
    <div ref={wrapRef} className="relative">
      <input
        value={value}
        onFocus={() => setOpen(true)}
        onChange={(event) => handleInputChange(event.target.value)}
        onBlur={() => {
          window.setTimeout(() => setOpen(false), 120);
          const finalized = finalizeTime(value);
          if (finalized) onChange(finalized);
        }}
        placeholder="09:00"
        inputMode="numeric"
        className={`w-24 rounded-lg border px-4 py-3 text-center text-xs font-bold text-[#001A72] outline-none focus:ring-2 ${invalid ? 'border-red-200 bg-red-50 focus:border-red-300 focus:ring-red-100' : 'border-gray-100 bg-gray-50 focus:border-[#001A72]/30 focus:ring-[#001A72]/10'}`}
      />
      {open && (
        <div className="absolute z-30 mt-1 max-h-44 w-24 overflow-y-auto rounded-xl border border-gray-100 bg-white shadow-xl">
          {options.map((option) => (
            <button
              key={option}
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => { onChange(finalizeTime(option)); setOpen(false); }}
              className={`w-full px-3 py-2 text-center text-xs font-bold transition ${option === value ? 'bg-[#001A72] text-white' : 'text-gray-600 hover:bg-[#001A72]/5 hover:text-[#001A72]'}`}
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function SettingsRow({ icon, label, sub, children }: { icon: React.ReactNode; label: string; sub: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3 py-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 shrink-0">{icon}</div>
        <div className="space-y-0.5">
          <p className="text-xs font-bold text-gray-800">{label}</p>
          <p className="text-[10px] text-gray-400 leading-normal max-w-lg">{sub}</p>
        </div>
      </div>
      <div className="pl-7">{children}</div>
    </div>
  );
}

const INPUT =
  'w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#001A72]/20 focus:border-[#001A72] transition font-medium text-gray-700 bg-white placeholder-gray-400';
