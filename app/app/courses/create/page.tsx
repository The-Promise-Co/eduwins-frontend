'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/services/api';
import { useUser } from '@/context/UserContext';
import {
  BookOpen,
  Image as ImageIcon,
  AlertCircle,
  Loader2,
} from "lucide-react"
import Section from '@/components/Section';
import AlertError from '@/components/AlertError';
import { useCloudinary } from '@/hooks/useCloudinary';
import PageHeader from '@/components/PageHeader';
import { useSubjects } from '@/app/app/courses/misc/api';
import { LEVELS } from '@/types/course';

export default function CreateCoursePage() {
  const router = useRouter();
  const { user } = useUser();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');


  const [form, setForm] = useState({
    title: '',
    description: '',
    subject: '',
    level: LEVELS[0],
    duration_weeks: 4,
    price: '',
    is_free: false,
    status: 'draft' as 'draft' | 'published',
    tags: '',
    requirements: '',
    what_you_learn: '',
    thumbnail_url: '',
  });

  const { uploadFile, isUploading } = useCloudinary();
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

  const { data: subjects, isLoading: loadingSubjects } = useSubjects();

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

  const setField = (key: keyof typeof form, value: any) =>
    setForm((p) => ({ ...p, [key]: value }));

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Quick preview
    const objectUrl = URL.createObjectURL(file);
    setThumbnailPreview(objectUrl);

    const url = await uploadFile(file);
    if (url) {
      setField('thumbnail_url', url);
    } else {
      setError('Failed to upload thumbnail');
      setThumbnailPreview(null);
    }
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) { setError('Course title is required.'); return; }
    if (!form.description.trim()) { setError('Description is required.'); return; }
    if (!form.subject) { setError('Subject is required.'); return; }
    if (!form.is_free && !form.price) { setError('Please enter a price or mark as free.'); return; }
    if (!form.thumbnail_url && !thumbnailPreview) { setError('Please upload a course thumbnail.'); return; }

    setError('');
    setSaving(true);

    const payload = {
      ...form,
      status: 'draft',
      price: form.is_free ? 0 : Number(form.price),
      duration_weeks: Number(form.duration_weeks),
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
    };

    try {
      const res = await api.post('/courses', payload);
      router.push(`/app/courses/${res.data.id}/edit`);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to create course.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <PageHeader
        title="Create New Course"
        subtitle="Fill in all details to publish your course"
        backHref="/app/courses"
      />

      {error && <AlertError message={error} />}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-5">

          {/* Basic Info */}
          <Section title="Basic Information" icon={BookOpen}>
            <div className="space-y-4">
              <FormField label="Course Title *">
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setField('title', e.target.value)}
                  placeholder="e.g. Complete Mathematics for WAEC & JAMB"
                  className={INPUT}
                />
              </FormField>

              <FormField label="Description *">
                <textarea
                  value={form.description}
                  onChange={(e) => setField('description', e.target.value)}
                  rows={4}
                  placeholder="Describe what students will learn in this course..."
                  className={INPUT + ' resize-none'}
                />
              </FormField>

              <div className="grid sm:grid-cols-2 gap-4">
                <FormField label="Subject">
                  <select
                    value={form.subject}
                    onChange={(e) => setField('subject', e.target.value)}
                    className={INPUT}
                    disabled={loadingSubjects}
                  >
                    <option value="" disabled>
                      {loadingSubjects ? 'Loading subjects...' : 'Select a subject'}
                    </option>
                    {subjects?.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </FormField>
                <FormField label="Level">
                  <select value={form.level} onChange={(e) => setField('level', e.target.value)} className={INPUT}>
                    {LEVELS.map((l) => <option key={l} value={l} className="capitalize">{l.replace('_', ' ')}</option>)}
                  </select>
                </FormField>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <FormField label="Duration (weeks)">
                  <input
                    type="number"
                    min={1}
                    max={52}
                    value={form.duration_weeks}
                    onChange={(e) => setField('duration_weeks', e.target.value)}
                    className={INPUT}
                  />
                </FormField>
                <FormField label="Tags (comma-separated)">
                  <input
                    type="text"
                    value={form.tags}
                    onChange={(e) => setField('tags', e.target.value)}
                    placeholder="WAEC, Algebra, Equations"
                    className={INPUT}
                  />
                </FormField>
              </div>

              <FormField label="What Students Will Learn">
                <textarea
                  value={form.what_you_learn}
                  onChange={(e) => setField('what_you_learn', e.target.value)}
                  rows={3}
                  placeholder="List key learning outcomes, one per line..."
                  className={INPUT + ' resize-none'}
                />
              </FormField>

              <FormField label="Requirements / Prerequisites">
                <textarea
                  value={form.requirements}
                  onChange={(e) => setField('requirements', e.target.value)}
                  rows={2}
                  placeholder="What should students know before taking this course?"
                  className={INPUT + ' resize-none'}
                />
              </FormField>

              <FormField label="Thumbnail Image *">
                <div className="relative border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 flex items-center justify-center p-6 text-center hover:bg-gray-100 transition group overflow-hidden">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailUpload}
                    disabled={isUploading}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-20"
                  />
                  {thumbnailPreview ? (
                    <div className="relative w-full aspect-video rounded-lg overflow-hidden flex items-center justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={thumbnailPreview} alt="Thumbnail preview" className={`object-cover w-full h-full ${isUploading ? 'opacity-50' : ''}`} />
                      {isUploading && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-black/30">
                          <Loader2 className="w-8 h-8 animate-spin mb-2" />
                          <span className="text-sm font-bold">Uploading...</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 rounded-full bg-[#001A72]/5 text-[#001A72] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <ImageIcon size={24} />
                      </div>
                      <p className="text-sm font-bold text-gray-700">Click or drag image to upload</p>
                      <p className="text-xs text-gray-400 mt-1">Recommended: 1280x720px (16:9)</p>
                    </div>
                  )}
                </div>
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
                checked={form.is_free}
                onChange={(e) => setField('is_free', e.target.checked)}
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
                    value={form.price}
                    onChange={(e) => setField('price', e.target.value)}
                    placeholder="0"
                    className={INPUT + ' pl-7'}
                  />
                </div>
              </FormField>
            )}

            <div className="flex flex-col gap-2 pt-2 border-t border-gray-100">
              <button
                disabled={saving || isUploading}
                onClick={handleSubmit}
                className="w-full bg-[#001A72] text-white py-2.5 rounded-xl font-bold text-sm hover:bg-[#001A72]/90 transition disabled:opacity-60"
              >
                {saving ? 'Creating...' : 'Continue to Curriculum'}
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
