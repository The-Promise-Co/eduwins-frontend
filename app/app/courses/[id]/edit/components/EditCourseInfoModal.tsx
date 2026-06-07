'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { Search, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import ImageUpload from '@/misc/components/ImageUpload';
import Modal from '@/misc/components/Modal';
import { useSubjects } from '../../../misc/api';
import { LEVELS } from '@/misc/types/course';

interface EditCourseInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: any;
  onSave: (data: any, thumbnailFile: File | null) => Promise<void>;
  isSaving: boolean;
}

export default function EditCourseInfoModal({ isOpen, onClose, course, onSave, isSaving }: EditCourseInfoModalProps) {
  const { register, setValue, watch, reset } = useForm<any>({
    defaultValues: {
      title: course?.title || '',
      description: course?.description || '',
      subject: typeof course?.subject === 'object' && course?.subject ? course?.subject.id : (course?.subject || ''),
      level: course?.level || 'beginner',
      duration_weeks: course?.duration_weeks || 4,
      price: course?.price || '',
      is_free: course?.is_free ?? false,
      tags: Array.isArray(course?.tags) ? course.tags.join(', ') : (course?.tags || ''),
      requirements: course?.requirements || '',
      what_you_learn: course?.what_you_learn || '',
      thumbnail_url: course?.thumbnail_url || '',
    }
  });

  const form = watch();

  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(course?.thumbnail_url || null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);

  const [subjectSearch, setSubjectSearch] = useState('');
  const [subjectOpen, setSubjectOpen] = useState(false);
  const subjectRef = useRef<HTMLDivElement>(null);
  const { data: subjects, isLoading: loadingSubjects } = useSubjects();

  // Reset form when course or isOpen changes
  useEffect(() => {
    if (isOpen && course) {
      reset({
        title: course.title || '',
        description: course.description || '',
        subject: typeof course.subject === 'object' && course.subject ? course.subject.id : (course.subject || ''),
        level: course.level || 'beginner',
        duration_weeks: course.duration_weeks || 4,
        price: course.price || '',
        is_free: course.is_free ?? false,
        tags: Array.isArray(course.tags) ? course.tags.join(', ') : (course.tags || ''),
        requirements: course.requirements || '',
        what_you_learn: course.what_you_learn || '',
        thumbnail_url: course.thumbnail_url || '',
      });
      setThumbnailPreview(course.thumbnail_url || null);
      setThumbnailFile(null);
    }
  }, [isOpen, course, reset]);

  const toSentenceCase = (s: string) => {
    const spaced = s.replace(/_/g, ' ');
    return spaced.charAt(0).toUpperCase() + spaced.slice(1).toLowerCase();
  };

  const clearThumbnail = () => {
    setThumbnailFile(null);
    setThumbnailPreview(null);
    setValue('thumbnail_url', '');
  };

  const handleModalSave = () => {
    if (!form.title.trim()) { toast.error('Course title is required.'); return; }
    if (!form.description.trim()) { toast.error('Description is required.'); return; }
    if (!form.subject) { toast.error('Subject is required.'); return; }
    if (!form.is_free && !form.price) { toast.error('Please enter a price or mark as free.'); return; }

    onSave(form, thumbnailFile);
  };

  const modalFooter = (
    <>
      <button
        type="button"
        disabled={isSaving}
        onClick={onClose}
        className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-50 transition disabled:opacity-50"
      >
        Cancel
      </button>
      <button
        type="button"
        disabled={isSaving}
        onClick={handleModalSave}
        className="px-5 py-2.5 bg-[#001A72] text-white rounded-xl text-sm font-bold hover:bg-[#001A72]/90 transition disabled:opacity-50 flex items-center gap-2"
      >
        {isSaving ? (
          <><Loader2 size={14} className="animate-spin" /> Saving Changes…</>
        ) : (
          'Save Changes'
        )}
      </button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Course Info"
      subtitle="Update key course settings, pricing, and tags"
      size="md"
      dismissable={!isSaving}
      showCloseButton={!isSaving}
      footer={modalFooter}
    >
      <div className="space-y-5">
        {/* Thumbnail */}
        <div>
          <label className="block text-xs font-bold text-gray-500 mb-1.5">Thumbnail Image *</label>
          <ImageUpload
            preview={thumbnailPreview}
            onFileSelect={(file) => {
              setThumbnailFile(file);
              setThumbnailPreview(URL.createObjectURL(file));
              setValue('thumbnail_url', '');
            }}
            onClear={clearThumbnail}
            onError={(msg) => toast.error(msg)}
            disabled={isSaving}
          />
        </div>

        {/* Title */}
        <div>
          <label className="block text-xs font-bold text-gray-500 mb-1.5">Course Title *</label>
          <input
            type="text"
            {...register('title')}
            placeholder="Course title..."
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#001A72]/20 focus:border-[#001A72] transition"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-bold text-gray-500 mb-1.5">Description *</label>
          <textarea
            {...register('description')}
            rows={3}
            placeholder="Describe what students will learn in this course..."
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#001A72]/20 focus:border-[#001A72] transition resize-none"
          />
        </div>

        {/* Subject + Level */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1.5">Subject *</label>
            <div className="relative" ref={subjectRef}>
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={subjectSearch || (form.subject ? subjects?.find((s: any) => s.id === form.subject)?.name ?? '' : '')}
                onChange={(e) => { setSubjectSearch(e.target.value); setSubjectOpen(true); }}
                onFocus={() => setSubjectOpen(true)}
                onBlur={() => setTimeout(() => setSubjectOpen(false), 150)}
                placeholder={loadingSubjects ? 'Loading subjects...' : 'Search subjects...'}
                disabled={loadingSubjects}
                className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#001A72]/20 focus:border-[#001A72] transition"
              />
              {subjectOpen && !loadingSubjects && (
                <div className="absolute z-20 top-full mt-1 left-0 right-0 bg-white border border-gray-100 rounded-xl shadow-lg max-h-52 overflow-y-auto">
                  {(subjects || []).filter((s: any) =>
                    s.name.toLowerCase().includes(subjectSearch.toLowerCase())
                  ).map((s: any) => (
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
                  {(subjects || []).filter((s: any) =>
                    s.name.toLowerCase().includes(subjectSearch.toLowerCase())
                  ).length === 0 && (
                      <p className="px-4 py-3 text-xs text-gray-400">No subjects found</p>
                    )}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1.5">Level</label>
            <select
              {...register('level')}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#001A72]/20 focus:border-[#001A72] transition bg-white"
            >
              {LEVELS.map((l) => <option key={l} value={l}>{toSentenceCase(l)}</option>)}
            </select>
          </div>
        </div>

        {/* Duration + Tags */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1.5">Duration (weeks)</label>
            <input
              type="number"
              min={1}
              max={52}
              {...register('duration_weeks', { valueAsNumber: true })}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#001A72]/20 focus:border-[#001A72] transition"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1.5">Tags (comma-separated)</label>
            <input
              type="text"
              {...register('tags')}
              placeholder="WAEC, Algebra, Equations"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#001A72]/20 focus:border-[#001A72] transition"
            />
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              {...register('is_free')}
              className="rounded border-gray-300 text-[#001A72]"
            />
            <span className="text-sm font-semibold text-gray-700">Free Course</span>
          </label>

          {!form.is_free && (
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5">Price (₦)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-bold">₦</span>
                <input
                  type="number"
                  min={0}
                  {...register('price')}
                  placeholder="0"
                  className="w-full border border-gray-200 rounded-xl pl-7 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#001A72]/20 focus:border-[#001A72] transition bg-white"
                />
              </div>
            </div>
          )}
        </div>

        {/* What Students Will Learn */}
        <div>
          <label className="block text-xs font-bold text-gray-500 mb-1.5">What Students Will Learn</label>
          <textarea
            {...register('what_you_learn')}
            rows={2}
            placeholder="List key learning outcomes, one per line..."
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#001A72]/20 focus:border-[#001A72] transition resize-none"
          />
        </div>

        {/* Requirements */}
        <div>
          <label className="block text-xs font-bold text-gray-500 mb-1.5">Requirements / Prerequisites</label>
          <textarea
            {...register('requirements')}
            rows={2}
            placeholder="What should students know before taking this course?"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#001A72]/20 focus:border-[#001A72] transition resize-none"
          />
        </div>
      </div>
    </Modal>
  );
}
