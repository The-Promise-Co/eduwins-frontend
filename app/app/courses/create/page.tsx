'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useApiMutation } from '@/hooks/useApi';
import { useUser } from '@/context/UserContext';
import {
  BookOpen,
  AlertCircle,
  Loader2,
  Search,
} from "lucide-react"
import ImageUpload from '@/components/ImageUpload';
import Section from '@/components/Section';
import { useR2 } from '@/hooks/useR2';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { CourseFormInput } from '@/types/course';

import PageHeader from '@/components/PageHeader';
import { useSubjects } from '@/app/app/courses/misc/api';
import { LEVELS } from '@/types/course';

export default function CreateCoursePage() {
  const router = useRouter();
  const { user } = useUser();
  const [subjectSearch, setSubjectSearch] = useState('');
  const [subjectOpen, setSubjectOpen] = useState(false);
  const subjectRef = useRef<HTMLDivElement>(null);

  const toSentenceCase = (s: string) => {
    const spaced = s.replace(/_/g, ' ');
    return spaced.charAt(0).toUpperCase() + spaced.slice(1).toLowerCase();
  };

  const { register, setValue, watch } = useForm<CourseFormInput>({
    defaultValues: {
      title: '',
      description: '',
      subject: '',
      level: LEVELS[0],
      duration_weeks: 4,
      price: '',
      is_free: false,
      status: 'draft',
      tags: '',
      requirements: '',
      what_you_learn: '',
      thumbnail_url: '',
    }
  });

  const form = watch();

  const { uploadFile, isUploading } = useR2();
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);

  const { data: subjects, isLoading: loadingSubjects } = useSubjects();
  const createCourseMutation = useApiMutation<{ id: string }, any>({
    method: 'post',
    url: '/courses',
    data: (data) => data,
    invalidate: [['courses']],
  });
  const updateCourseMutation = useApiMutation<unknown, { courseId: string; data: any }>({
    method: 'put',
    url: ({ courseId }) => `/courses/${courseId}`,
    data: ({ data }) => data,
    invalidate: [['courses']],
  });

  if (user?.role !== 'teacher') {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <AlertCircle size={40} className="text-red-400 mb-3" />
        <p className="font-bold text-gray-700">Only tutors can create courses.</p>
        <Link href="/app/courses" className="mt-3 text-[#001A72] text-sm font-semibold hover:underline">
          Back to courses
        </Link>
      </div>
    );
  }

  const clearThumbnail = () => {
    setThumbnailFile(null);
    setThumbnailPreview(null);
    setValue('thumbnail_url', '');
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) { toast.error('Course title is required.'); return; }
    if (!form.description.trim()) { toast.error('Description is required.'); return; }
    if (!form.subject) { toast.error('Subject is required.'); return; }
    if (!form.is_free && !form.price) { toast.error('Please enter a price or mark as free.'); return; }
    if (!thumbnailFile && !form.thumbnail_url) { toast.error('Please select a course thumbnail.'); return; }

    try {
      const payload = {
        ...form,
        thumbnail_url: form.thumbnail_url,
        status: 'draft',
        price: form.is_free ? 0 : Number(form.price),
        duration_weeks: Number(form.duration_weeks),
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      };

      const res = await createCourseMutation.mutateAsync(payload);
      const courseId = res.id;

      // Upload thumbnail now if one was selected, grouped under the course ID folder
      if (thumbnailFile) {
        const uploaded = await uploadFile(thumbnailFile, `courses/${courseId}`);
        if (!uploaded) {
          toast.error('Failed to upload thumbnail. Please try again.');
          return;
        }
        // Update the course with the uploaded thumbnail URL
        await updateCourseMutation.mutateAsync({
          courseId,
          data: {
          thumbnail_url: uploaded,
          },
        });
      }

      toast.success('Course created successfully!');
      router.push(`/app/courses/${courseId}/edit`);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Failed to create course.');
    }
  };

  const saving = createCourseMutation.isPending || updateCourseMutation.isPending || isUploading;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <PageHeader
        title="Create New Course"
        subtitle="Fill in all details to publish your course"
        backHref="/app/courses"
      />

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-5">

          {/* Basic Info */}
          <Section title="Basic Information" icon={BookOpen}>
            <div className="space-y-4">
              <FormField label="Thumbnail Image *">
                <ImageUpload
                  preview={thumbnailPreview}
                  onFileSelect={(file) => {
                    setThumbnailFile(file);
                    setThumbnailPreview(URL.createObjectURL(file));
                    setValue('thumbnail_url', '');
                  }}
                  onClear={clearThumbnail}
                  onError={(msg) => toast.error(msg)}
                  disabled={saving}
                />
              </FormField>

              <FormField label="Course Title *">
                <input
                  type="text"
                  {...register('title')}
                  placeholder="e.g. Complete Mathematics for WAEC & JAMB"
                  className={INPUT}
                />
              </FormField>

              <FormField label="Description *">
                <textarea
                  {...register('description')}
                  rows={4}
                  placeholder="Describe what students will learn in this course..."
                  className={INPUT + ' resize-none'}
                />
              </FormField>

              <div className="grid sm:grid-cols-2 gap-4">
                <FormField label="Subject">
                  <div className="relative" ref={subjectRef}>
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input
                      type="text"
                      value={subjectSearch || (form.subject ? subjects?.find(s => s.id === form.subject)?.name ?? '' : '')}
                      onChange={(e) => { setSubjectSearch(e.target.value); setSubjectOpen(true); }}
                      onFocus={() => setSubjectOpen(true)}
                      onBlur={() => setTimeout(() => setSubjectOpen(false), 150)}
                      placeholder={loadingSubjects ? 'Loading subjects...' : 'Search subjects...'}
                      disabled={loadingSubjects}
                      className={INPUT + ' pl-9'}
                    />
                    {subjectOpen && !loadingSubjects && (
                      <div className="absolute z-20 top-full mt-1 left-0 right-0 bg-white border border-gray-100 rounded-xl shadow-lg max-h-52 overflow-y-auto">
                        {(subjects || []).filter(s =>
                          s.name.toLowerCase().includes(subjectSearch.toLowerCase())
                        ).map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            onMouseDown={() => {
                              setValue('subject', s.id);
                              setSubjectSearch('');
                              setSubjectOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2.5 text-sm transition hover:bg-gray-50 ${form.subject === s.id ? 'text-[#001A72] font-bold bg-[#001A72]/5' : 'text-gray-700'
                              }`}
                          >
                            {s.name}
                          </button>
                        ))}
                        {(subjects || []).filter(s =>
                          s.name.toLowerCase().includes(subjectSearch.toLowerCase())
                        ).length === 0 && (
                            <p className="px-4 py-3 text-xs text-gray-400">No subjects found</p>
                          )}
                      </div>
                    )}
                  </div>
                </FormField>
                <FormField label="Level">
                  <select {...register('level')} className={INPUT}>
                    {LEVELS.map((l) => <option key={l} value={l}>{toSentenceCase(l)}</option>)}
                  </select>
                </FormField>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <FormField label="Duration (weeks)">
                  <input
                    type="number"
                    min={1}
                    max={52}
                    {...register('duration_weeks', { valueAsNumber: true })}
                    className={INPUT}
                  />
                </FormField>
                <FormField label="Tags (comma-separated)">
                  <input
                    type="text"
                    {...register('tags')}
                    placeholder="WAEC, Algebra, Equations"
                    className={INPUT}
                  />
                </FormField>
              </div>

              <FormField label="What Students Will Learn">
                <textarea
                  {...register('what_you_learn')}
                  rows={3}
                  placeholder="List key learning outcomes, one per line..."
                  className={INPUT + ' resize-none'}
                />
              </FormField>

              <FormField label="Requirements / Prerequisites">
                <textarea
                  {...register('requirements')}
                  rows={2}
                  placeholder="What should students know before taking this course?"
                  className={INPUT + ' resize-none'}
                />
              </FormField>


            </div>
          </Section>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Publish Card */}
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 space-y-4">
            <h3 className="font-bold text-gray-800 text-sm">Pricing & Publish</h3>

            <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                {...register('is_free')}
                className="rounded border-gray-300 text-[#001A72]"
              />
              <span className="text-sm font-semibold text-gray-700">Free Course</span>
            </label>

            {!form.is_free && (
              <FormField label="Price (₦)">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-bold">₦</span>
                  <input
                    type="number"
                    min={0}
                    {...register('price')}
                    placeholder="0"
                    className={INPUT + ' pl-7'}
                  />
                </div>
              </FormField>
            )}

            <div className="flex flex-col gap-2 pt-2 border-t border-gray-100">
              <button
                disabled={saving}
                onClick={handleSubmit}
                className="w-full bg-[#001A72] text-white py-2.5 rounded-xl font-bold text-sm hover:bg-[#001A72]/90 transition disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {saving && isUploading ? (
                  <><Loader2 size={15} className="animate-spin" /> Uploading image…</>
                ) : saving ? (
                  <><Loader2 size={15} className="animate-spin" /> Creating…</>
                ) : (
                  'Continue to Curriculum'
                )}
              </button>
            </div>
          </div>

          {/* Tips */}
          <div className="bg-[#001A72]/5 border border-[#001A72]/10 rounded-2xl p-5">
            <p className="text-xs font-black text-[#001A72] uppercase tracking-widest mb-3">💡 Tips for Success</p>
            <ul className="space-y-2 text-xs text-gray-600 leading-relaxed">
              <li>✓ Write a clear, keyword-rich title</li>
              <li>✓ Add at least 3 modules with lessons</li>
              <li>✓ Include a free preview lesson to attract students</li>
              <li>✓ Set a competitive price for your subject level</li>
              <li>✓ List specific learning outcomes to build trust</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

const INPUT = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#001A72]/20 focus:border-[#001A72] transition';

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-bold text-gray-500 mb-1.5">{label}</label>
      {children}
    </div>
  );
}
