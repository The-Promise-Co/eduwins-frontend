'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Plus,
  Trash2,
  Layout,
  FileText,
  Video,
  Save,
  CheckCircle,
  AlertCircle,
  GripVertical,
  ChevronDown,
  ChevronUp,
  Loader2,
  ArrowLeft,
  Clock,
  ExternalLink
} from 'lucide-react';
import Section from '@/components/Section';
import AlertError from '@/components/AlertError';
import PageHeader from '@/components/PageHeader';
import Editor from '@/components/Editor';
import { useCourse, useAddModule, useAddLesson, useUpdateCourse } from '../../misc/api';
import { Module, Lesson, CourseLevel, CourseStatus } from '@/types/course';

export default function EditCoursePage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  
  const { data: course, isLoading: isLoadingCourse, error: courseError } = useCourse(id);
  const addModuleMutation = useAddModule(id);
  const addLessonMutation = useAddLesson(id);
  const updateCourseMutation = useUpdateCourse(id);

  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});
  const [addingModule, setAddingModule] = useState(false);
  const [newModuleTitle, setNewModuleTitle] = useState('');
  
  const [addingLesson, setAddingLesson] = useState<string | null>(null); // moduleId
  const [newLesson, setNewLesson] = useState<{
    title: string;
    type: 'video' | 'article';
    video_url: string;
    duration_seconds: number;
    content: string;
    is_preview: boolean;
  }>({
    title: '',
    type: 'video',
    video_url: '',
    duration_seconds: 600,
    content: '',
    is_preview: false
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => ({ ...prev, [moduleId]: !prev[moduleId] }));
  };

  const handleAddModule = async () => {
    if (!newModuleTitle.trim()) return;
    try {
      await addModuleMutation.mutateAsync({ 
        title: newModuleTitle,
        order_index: course?.modules?.length || 0
      });
      setNewModuleTitle('');
      setAddingModule(false);
      setSuccess('Module added successfully');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add module');
    }
  };

  const handleAddLesson = async (moduleId: string) => {
    if (!newLesson.title.trim()) return;
    try {
      await addLessonMutation.mutateAsync({
        moduleId,
        ...newLesson,
        order_index: course?.modules?.find((m: any) => m.id === moduleId)?.lessons?.length || 0
      });
      setAddingLesson(null);
      setNewLesson({
        title: '',
        type: 'video',
        video_url: '',
        duration_seconds: 600,
        content: '',
        is_preview: false
      });
      setSuccess('Lesson added successfully');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add lesson');
    }
  };

  const handlePublish = async () => {
    // Validation
    if (!course?.modules?.length) {
      setError('Course must have at least one module before publishing.');
      return;
    }
    const hasLessons = course.modules.some((m: any) => m.lessons?.length > 0);
    if (!hasLessons) {
      setError('Course must have at least one lesson before publishing.');
      return;
    }

    try {
      await updateCourseMutation.mutateAsync({ status: 'published' });
      setSuccess('Course published successfully!');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to publish course');
    }
  };

  if (isLoadingCourse) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <Loader2 size={40} className="text-[#001A72] animate-spin mb-3" />
        <p className="text-gray-500">Loading course curriculum...</p>
      </div>
    );
  }

  if (courseError) {
    return <AlertError message="Failed to load course details." />;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <PageHeader
        title={`Edit Curriculum: ${course.title}`}
        subtitle="Manage modules and lessons for your course"
        backHref="/app/courses"
        rightElement={
          <div className="flex items-center gap-3">
             <Link 
               href={`/app/courses/${id}`}
               className="px-4 py-2 text-sm font-bold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition flex items-center gap-2"
             >
               <ExternalLink size={16} />
               Preview
             </Link>
             {course.status === 'draft' ? (
               <button
                 onClick={handlePublish}
                 disabled={updateCourseMutation.isPending}
                 className="px-5 py-2 text-sm font-bold text-white bg-[#001A72] rounded-xl hover:bg-[#001A72]/90 transition shadow-sm disabled:opacity-50 flex items-center gap-2"
               >
                 {updateCourseMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                 Publish Course
               </button>
             ) : (
               <div className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl">
                 <CheckCircle size={16} />
                 Published
               </div>
             )}
          </div>
        }
      />

      {(error || success) && (
        <div className="space-y-4">
          {error && <AlertError message={error} />}
          {success && (
            <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm">
              <CheckCircle size={20} className="text-emerald-500 shrink-0" />
              <p className="font-semibold flex-1">{success}</p>
              <button onClick={() => setSuccess('')} className="text-emerald-400 hover:text-emerald-600">✕</button>
            </div>
          )}
        </div>
      )}

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-5">
          <Section title="Course Modules" icon={Layout}>
            <div className="space-y-4">
              {course?.modules?.map((module: any, mIdx: number) => (
                <div key={module.id} className="border border-gray-200 rounded-2xl overflow-hidden bg-gray-50/30">
                  {/* Module Header */}
                  <div className="flex items-center gap-4 px-4 py-4 bg-white border-b border-gray-100">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-xs uppercase">
                      {mIdx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 truncate">{module.title}</h3>
                      <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">
                        {module.lessons?.length || 0} Lessons
                      </p>
                    </div>
                    <button 
                      onClick={() => toggleModule(module.id)}
                      className="p-2 text-gray-400 hover:text-gray-600 transition"
                    >
                      {expandedModules[module.id] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>
                  </div>

                  {/* Lessons List */}
                  {expandedModules[module.id] && (
                    <div className="p-4 space-y-3">
                      {module.lessons?.map((lesson: any, lIdx: number) => (
                        <div key={lesson.id} className="flex items-center gap-4 p-4 bg-white border border-gray-100 rounded-xl shadow-sm group">
                          <GripVertical size={16} className="text-gray-300 cursor-grab active:cursor-grabbing" />
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            lesson.type === 'video' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'
                          }`}>
                            {lesson.type === 'video' ? <Video size={18} /> : <FileText size={18} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-gray-800 truncate">{lesson.title}</h4>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                                <Clock size={10} />
                                {Math.round(lesson.duration_seconds / 60)} mins
                              </span>
                              {lesson.is_preview && (
                                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded text-center">
                                  Preview
                                </span>
                              )}
                            </div>
                          </div>
                          <button className="text-gray-300 hover:text-red-500 transition opacity-0 group-hover:opacity-100">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}

                      {/* Add Lesson Form */}
                      {addingLesson === module.id ? (
                        <div className="p-5 bg-white border border-[#001A72]/20 rounded-2xl space-y-4 shadow-lg shadow-[#001A72]/5">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-black text-[#001A72] uppercase tracking-widest">New Lesson</h4>
                            <button onClick={() => setAddingLesson(null)} className="text-gray-400 hover:text-gray-600 text-sm">Cancel</button>
                          </div>
                          
                          <div className="grid sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Lesson Title</label>
                              <input 
                                type="text"
                                value={newLesson.title}
                                onChange={e => setNewLesson(p => ({ ...p, title: e.target.value }))}
                                placeholder="e.g. Introduction to Derivatives"
                                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#001A72]/10 focus:border-[#001A72] outline-none"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Content Type</label>
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => setNewLesson(p => ({ ...p, type: 'video' }))}
                                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-bold transition ${
                                    newLesson.type === 'video' ? 'bg-[#001A72] text-white border-[#001A72]' : 'bg-gray-50 text-gray-600 border-gray-200'
                                  }`}
                                >
                                  <Video size={14} /> Video
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setNewLesson(p => ({ ...p, type: 'article' }))}
                                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-bold transition ${
                                    newLesson.type === 'article' ? 'bg-[#001A72] text-white border-[#001A72]' : 'bg-gray-50 text-gray-600 border-gray-200'
                                  }`}
                                >
                                  <FileText size={14} /> Article
                                </button>
                              </div>
                            </div>
                          </div>

                          {newLesson.type === 'video' ? (
                            <div className="grid sm:grid-cols-3 gap-4">
                              <div className="sm:col-span-2 space-y-1.5">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Video URL (YouTube/Vimeo)</label>
                                <input 
                                  type="url"
                                  value={newLesson.video_url}
                                  onChange={e => setNewLesson(p => ({ ...p, video_url: e.target.value }))}
                                  placeholder="https://youtube.com/..."
                                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#001A72]/10 focus:border-[#001A72] outline-none"
                                />
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Duration (mins)</label>
                                <input 
                                  type="number"
                                  value={newLesson.duration_seconds / 60}
                                  onChange={e => setNewLesson(p => ({ ...p, duration_seconds: Number(e.target.value) * 60 }))}
                                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#001A72]/10 focus:border-[#001A72] outline-none"
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-1.5">
                              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Article Content</label>
                              <Editor 
                                content={newLesson.content} 
                                onChange={html => setNewLesson(p => ({ ...p, content: html }))} 
                              />
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-2">
                             <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                                <input 
                                  type="checkbox"
                                  checked={newLesson.is_preview}
                                  onChange={e => setNewLesson(p => ({ ...p, is_preview: e.target.checked }))}
                                  className="rounded border-gray-300 text-[#001A72]"
                                />
                                Preview lesson (allow non-enrolled students)
                             </label>
                             <button
                               onClick={() => handleAddLesson(module.id)}
                               disabled={addLessonMutation.isPending}
                               className="bg-[#001A72] text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-[#001A72]/90 transition shadow-md disabled:opacity-50"
                             >
                               {addLessonMutation.isPending ? 'Adding...' : 'Add Lesson'}
                             </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setAddingLesson(module.id)}
                          className="w-full py-4 border-2 border-dashed border-gray-100 rounded-2xl text-xs font-black text-gray-400 uppercase tracking-widest hover:border-[#001A72]/20 hover:text-[#001A72] hover:bg-[#001A72]/5 transition flex items-center justify-center gap-2"
                        >
                          <Plus size={16} />
                          Add Lesson to this module
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {/* Add Module Flow */}
              {addingModule ? (
                <div className="p-4 border-2 border-[#001A72] rounded-2xl bg-white space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Module Title</label>
                    <input 
                      type="text"
                      autoFocus
                      value={newModuleTitle}
                      onChange={e => setNewModuleTitle(e.target.value)}
                      placeholder="e.g. Module 1: Foundations of Finance"
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-[#001A72]/10 focus:border-[#001A72] outline-none"
                    />
                  </div>
                  <div className="flex justify-end gap-3">
                    <button 
                      onClick={() => setAddingModule(false)}
                      className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-700 transition"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleAddModule}
                      disabled={addModuleMutation.isPending}
                      className="px-6 py-2 bg-[#001A72] text-white rounded-xl font-bold text-sm hover:bg-[#001A72]/90 transition shadow-md disabled:opacity-50"
                    >
                      {addModuleMutation.isPending ? 'Creating...' : 'Create Module'}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setAddingModule(true)}
                  className="w-full py-6 border-2 border-dashed border-gray-200 rounded-2xl text-sm font-black text-gray-400 uppercase tracking-widest hover:border-[#001A72] hover:text-[#001A72] hover:bg-[#001A72]/5 transition flex items-center justify-center gap-3"
                >
                  <Plus size={20} />
                  Add New Module
                </button>
              )}
            </div>
          </Section>
        </div>

        {/* Sidebar Status / Summary */}
        <div className="space-y-6">
          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-5">
            <h3 className="font-black text-gray-900 text-sm uppercase tracking-widest">Setup Status</h3>
            
            <div className="space-y-4">
              <StatusStep 
                label="Course Info" 
                isDone={!!course.title && !!course.description} 
              />
              <StatusStep 
                label="Curriculum" 
                isDone={course.modules?.length > 0} 
                subtext={`${course.modules?.length || 0} modules created`}
              />
              <StatusStep 
                label="Lesson Content" 
                isDone={course.modules?.some((m: any) => m.lessons?.length > 0)} 
                subtext={`${course.modules?.reduce((acc: number, m: any) => acc + (m.lessons?.length || 0), 0)} total lessons`}
              />
            </div>

            <div className="pt-5 border-t border-gray-100">
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Course Checklist</p>
               <ul className="space-y-3">
                 <li className="flex gap-3 text-xs text-gray-600">
                   <div className="w-4 h-4 rounded-full bg-[#001A72]/10 text-[#001A72] flex items-center justify-center shrink-0">✓</div>
                   <span>Add descriptive titles to all lessons</span>
                 </li>
                 <li className="flex gap-3 text-xs text-gray-600">
                   <div className="w-4 h-4 rounded-full bg-[#001A72]/10 text-[#001A72] flex items-center justify-center shrink-0">✓</div>
                   <span>Upload high quality course thumbnail</span>
                 </li>
                 <li className="flex gap-3 text-xs text-gray-600">
                   <div className="w-4 h-4 rounded-full bg-[#001A72]/10 text-[#001A72] flex items-center justify-center shrink-0">✓</div>
                   <span>Check rich text formatting for articles</span>
                 </li>
               </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusStep({ label, isDone, subtext }: { label: string; isDone: boolean; subtext?: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition ${
        isDone ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-300'
      }`}>
        <CheckCircle size={14} />
      </div>
      <div>
        <p className={`text-xs font-bold ${isDone ? 'text-gray-900' : 'text-gray-400'}`}>{label}</p>
        {subtext && <p className="text-[10px] text-gray-400 font-medium mt-0.5">{subtext}</p>}
      </div>
    </div>
  );
}
