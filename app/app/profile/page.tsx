'use client';

import { useState, useEffect, ReactElement, ChangeEvent, FormEvent, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useProfileCompletion, useUploadFile, useTeacherDocuments, useUploadDocument, useDeleteDocument } from '@/misc/hooks/api/uploads';
import { useUpdateProfile } from '@/misc/hooks/api/auth';
import { useUser } from '@/misc/context/UserContext';
import { TeacherProfile } from '@/misc/types';
import {
  User as UserIcon,
  Camera,
  Award,
  GraduationCap,
  Mail,
  Phone,
  FileText,
  Upload,
  CheckCircle2,
  Clock,
  Gem,
  Video,
  ShieldCheck,
  RefreshCw,
  Tags,
  Trash2,
  X,
  Plus,
} from 'lucide-react';
import PageHeader from '@/misc/components/PageHeader';
import Button from '@/misc/components/Button';
import ImageCropModal from '@/misc/components/ImageCropModal';
import { useR2 } from '@/misc/hooks/useR2';
import { toast } from 'sonner';
import type { ProfileCompletion as ApiProfileCompletion } from '@/misc/types/uploads';

type CompletionKey = 'photo' | 'bio' | 'subjects' | 'video_intro' | 'schedule' | 'hourly_pay' | 'certification' | 'education';

type TutorCompletion = Omit<ApiProfileCompletion, 'completion'> & {
  completion: Record<CompletionKey, boolean>;
};

const PROFILE_STEPS: { key: CompletionKey; label: string }[] = [
  { key: 'photo', label: 'Profile picture' },
  { key: 'bio', label: 'Bio' },
  { key: 'subjects', label: 'Subjects' },
  { key: 'video_intro', label: 'Video intro' },
  { key: 'schedule', label: 'Teaching schedule' },
  { key: 'hourly_pay', label: 'Hourly pay' },
  { key: 'certification', label: 'Certification' },
  { key: 'education', label: 'Education' },
];

const asList = (value: unknown): string[] => Array.isArray(value) ? value.filter(Boolean).map(String) : [];
const hasText = (value: unknown) => typeof value === 'string' && value.trim().length > 0;
const hasPositiveNumber = (value: unknown) => Number(value) > 0;
const hasAvailabilityConfig = (value: unknown) => {
  return !!value
    && typeof value === 'object'
    && !Array.isArray(value)
    && Object.values(value as Record<string, unknown>).some((ranges) => Array.isArray(ranges) && ranges.some((range: any) => hasText(range?.from) && hasText(range?.to)));
};

function buildTutorCompletion(user: TeacherProfile | null, formData: Record<string, unknown>, apiCompletion: ApiProfileCompletion | null): TutorCompletion | null {
  if (!user && !apiCompletion) return null;

  const api = apiCompletion?.completion || ({} as ApiProfileCompletion['completion']);
  const mergedUser = { ...(user || {}), ...formData } as TeacherProfile & Record<string, unknown>;
  const completion: Record<CompletionKey, boolean> = {
    photo: Boolean(api.profile_picture ?? api.photo ?? (hasText(mergedUser.photo) || hasText(mergedUser.photoUrl) || hasText(mergedUser.avatarUrl))),
    bio: Boolean(api.bio ?? hasText(mergedUser.bio)),
    subjects: Boolean(api.subjects ?? (asList(mergedUser.subjects).length > 0 || hasText(mergedUser.subjects) || hasText(mergedUser.subject))),
    video_intro: Boolean(api.video_intro ?? api.video_verified ?? hasText(mergedUser.intro_video)),
    schedule: Boolean(api.schedule ?? api.availability ?? (mergedUser.availability && hasAvailabilityConfig(mergedUser.availabilityConfig))),
    hourly_pay: Boolean(api.hourly_pay ?? api.hourly_rate ?? (hasPositiveNumber(mergedUser.hourlyRate) || hasPositiveNumber(mergedUser.baseHourlyRate))),
    certification: Boolean(api.certification ?? api.documents_uploaded ?? api.documents_verified ?? (asList(mergedUser.certifications).length > 0 || hasText(mergedUser.qualification))),
    education: Boolean(api.education ?? (asList(mergedUser.educationLevels).length > 0 || hasText(mergedUser.highestDegree) || hasText(mergedUser.institution))),
  };
  const completed = PROFILE_STEPS.filter((step) => completion[step.key]).length;
  const nextIncomplete = PROFILE_STEPS.find((step) => !completion[step.key]);

  return {
    completionPercentage: Math.round((completed / PROFILE_STEPS.length) * 100),
    nextStep: nextIncomplete ? `Add ${nextIncomplete.label.toLowerCase()}` : 'Profile complete',
    isPremium: Boolean(apiCompletion?.isPremium || mergedUser.is_premium),
    completion,
  };
}

export default function ProfilePage(): ReactElement {
  const router = useRouter();
  const { user: ctxUser, refreshUser } = useUser();
  const { uploadFile } = useR2();
  const [user, setUser] = useState<TeacherProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    bio: '',
    photo: '',
    qualification: '',
    highestDegree: '',
    institution: '',
  });

  // Upload states
  const [uploading, setUploading] = useState<Record<string, boolean>>({});

  // Document state
  const [newDocName, setNewDocName] = useState('');
  const [newDocTags, setNewDocTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  // Avatar Cropper States
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [imageSrc, setImageSrc] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const completionQuery = useProfileCompletion();
  const documentsQuery = useTeacherDocuments();
  const updateProfileMutation = useUpdateProfile();
  const uploadDocumentMutation = useUploadFile();
  const uploadDocMutation = useUploadDocument();
  const deleteDocMutation = useDeleteDocument();

  const init = async () => {
    const token = localStorage.getItem('token');
    const userJson = localStorage.getItem('user');
    if (!token || !userJson) {
      router.push('/login');
      return;
    }

    try {
      const userData = JSON.parse(userJson);
      setUser(userData);
      setFormData({
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        email: userData.email || '',
        phone: userData.phone || '',
        bio: userData.bio || '',
        photo: userData.photo || '',
        qualification: userData.qualification || '',
        highestDegree: userData.highestDegree || '',
        institution: userData.institution || '',
      });
    } catch (err) {
      console.error(err);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    init();
  }, [router]);

  /* ── Input Handlers ── */
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const payload = { ...formData };
      await updateProfileMutation.mutateAsync(payload);
      const updated = { ...(user || {}), ...payload } as TeacherProfile;
      localStorage.setItem('user', JSON.stringify(updated));
      setUser(updated);
      await refreshUser();
      await completionQuery.refetch();
      toast.success('Profile updated successfully!');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update profile.');
    }
  };

  /* ── Interactive Avatar Cropping Handlers ── */
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file.');
      return;
    }

    // Validate size (max 5MB)
    const sizeInMB = file.size / (1024 * 1024);
    if (sizeInMB > 5) {
      toast.error('Headshot file size cannot exceed 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImageSrc(reader.result);
        setCropModalOpen(true);
      }
    };
    reader.readAsDataURL(file);

    // Reset value so the change event triggers again for the same file if re-selected
    e.target.value = '';
  };

  const uploadCroppedFile = async (file: File) => {
    setUploading((p) => ({ ...p, headshot: true }));
    setCropModalOpen(false);

    try {
      // Step 1 - Upload directly to Cloudflare R2 under "identity" folder
      const r2Url = await uploadFile(file, 'identity');
      if (!r2Url) {
        throw new Error('Failed to upload headshot to Cloudflare R2 storage.');
      }

      // Step 2 - Update profile photo URL on the backend database
      await updateProfileMutation.mutateAsync({
        firstName: formData.firstName,
        lastName: formData.lastName,
          bio: formData.bio,
          photoUrl: r2Url,
      });

      setFormData((prev) => ({ ...prev, photo: r2Url }));
      const updated = { ...(user || {}), photo: r2Url } as TeacherProfile;
      localStorage.setItem('user', JSON.stringify(updated));
      setUser(updated);

      await refreshUser();
      await completionQuery.refetch();
      toast.success('Headshot updated and verified successfully!');
    } catch (err: any) {
      toast.error(err.message || err.response?.data?.error || 'Upload failed');
    } finally {
      setUploading((p) => ({ ...p, headshot: false }));
    }
  };

  /* ── General File Upload Handlers (Video) ── */
  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>, uploadType: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const sizeInMB = file.size / (1024 * 1024);
    let maxSize = 5;

    if (uploadType === 'videoIntro') {
      maxSize = 50;
      if (!file.type.startsWith('video/')) {
        toast.error('Please select a valid video file.');
        return;
      }
    }

    if (sizeInMB > maxSize) {
      toast.error(`File is too large (${sizeInMB.toFixed(1)}MB). Max allowed is ${maxSize}MB.`);
      return;
    }

    setUploading((p) => ({ ...p, [uploadType]: true }));

    try {
      const uploadData = new FormData();
      uploadData.append(uploadType, file);

      const res = await uploadDocumentMutation.mutateAsync({
        endpoint: '/uploads/video-intro',
        data: uploadData,
      });

      await refreshUser();
      toast.success(res.message || 'File uploaded successfully!');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploading((p) => ({ ...p, [uploadType]: false }));
    }
  };

  /* ── Document Upload Handler (multi-document with tags) ── */
  const handleDocumentUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error('Please upload a PDF document.');
      return;
    }

    const sizeInMB = file.size / (1024 * 1024);
    if (sizeInMB > 10) {
      toast.error(`File is too large (${sizeInMB.toFixed(1)}MB). Max allowed is 10MB.`);
      return;
    }

    if (!newDocName.trim()) {
      toast.error('Please enter a document name.');
      return;
    }

    setUploading((p) => ({ ...p, document: true }));

    try {
      await uploadDocMutation.mutateAsync({
        file,
        name: newDocName.trim(),
        tags: newDocTags,
      });

      setNewDocName('');
      setNewDocTags([]);
      await refreshUser();
      toast.success('Document uploaded successfully!');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Document upload failed');
    } finally {
      setUploading((p) => ({ ...p, document: false }));
    }
  };

  const handleAddTag = () => {
    const tag = tagInput.trim().toUpperCase();
    if (tag && !newDocTags.includes(tag)) {
      setNewDocTags((p) => [...p, tag]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (tag: string) => {
    setNewDocTags((p) => p.filter((t) => t !== tag));
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm('Delete this document?')) return;
    try {
      await deleteDocMutation.mutateAsync(documentId);
      await refreshUser();
      toast.success('Document deleted.');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to delete document');
    }
  };

  const triggerAvatarUpload = () => {
    fileInputRef.current?.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#001A72]" />
      </div>
    );
  }

  const isTeacher = user?.role === 'teacher';
  const completion = buildTutorCompletion(user, formData, completionQuery.data || null);
  const documents = documentsQuery.data || [];
  const hasDocuments = documents.length > 0;
  const allDocumentsVerified = hasDocuments && documents.every((doc) => doc.verified);
  const saving = updateProfileMutation.isPending;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <PageHeader title="Profile Details" subtitle="Manage your personal information, profile media, and credentials" />

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Basic Information */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-50">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-[#001A72]">
              <UserIcon size={16} />
            </div>
            <h2 className="text-xs font-black text-gray-700 uppercase tracking-widest">Basic Information</h2>
          </div>

          <div className="space-y-4">
            <Field label="First Name">
              <input
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className={INPUT}
                placeholder="First name"
                required
              />
            </Field>

            <Field label="Last Name">
              <input
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className={INPUT}
                placeholder="Last name"
                required
              />
            </Field>

            <Field label="Email Address">
              <div className="relative">
                <input
                  value={formData.email}
                  disabled
                  className={INPUT + ' bg-gray-50/50 cursor-not-allowed pl-10 opacity-70'}
                />
                <Mail size={14} className="absolute left-3.5 top-3.5 text-gray-400" />
              </div>
            </Field>

            <Field label="Phone Number">
              <div className="relative">
                <input
                  value={formData.phone}
                  disabled
                  className={INPUT + ' bg-gray-50/50 cursor-not-allowed pl-10 opacity-70'}
                />
                <Phone size={14} className="absolute left-3.5 top-3.5 text-gray-400" />
              </div>
            </Field>
          </div>

          <div className="pt-2">
            <Button type="submit" isLoading={saving} loadingText="Saving..." className="w-full py-3.5 text-xs font-black uppercase tracking-wider">
              Save Changes
            </Button>
          </div>
        </div>

        {/* RIGHT COLUMN: Bio, Headshot & Verification */}
        <div className="lg:col-span-7 space-y-6">
          {/* Bio & Avatar Container */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
            <div className="flex items-center gap-2 pb-3 border-b border-gray-50">
              <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
                <FileText size={16} />
              </div>
              <h2 className="text-xs font-black text-gray-700 uppercase tracking-widest">Bio & Profile Image</h2>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-6 pb-2">
              {/* Interactive Avatar Uploader */}
              <div className="relative group shrink-0 select-none">
                <div
                  onClick={triggerAvatarUpload}
                  className="w-24 h-24 rounded-full border-4 border-gray-50 bg-[#001A72] flex items-center justify-center text-white text-xl font-bold cursor-pointer overflow-hidden shadow-md relative transition-transform duration-300 active:scale-95 group-hover:shadow-[#001A72]/15"
                >
                  {uploading.headshot ? (
                    <RefreshCw size={24} className="animate-spin text-white" />
                  ) : formData.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={formData.photo}
                      alt="Avatar"
                      className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <span className="text-2xl font-black uppercase">
                      {((formData.firstName?.[0] || '') + (formData.lastName?.[0] || '')).slice(0, 2) || 'U'}
                    </span>
                  )}

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <Camera size={18} className="text-white" />
                    <span className="text-[8px] font-black uppercase text-white mt-1">Upload</span>
                  </div>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              <div className="flex-1 text-center sm:text-left space-y-1">
                <h3 className="text-sm font-bold text-gray-800">Your Avatar Image</h3>
                <p className="text-[10px] text-gray-400 leading-normal max-w-sm">
                  Click the avatar circle to upload a custom professional headshot image. Adjust scale and framing in the crop preview modal. Accepted: JPG, PNG. Max: 5MB.
                </p>
              </div>
            </div>

            <Field label="Professional Bio">
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows={5}
                className={INPUT + ' resize-none'}
                placeholder="Share your qualifications, teaching methodology, achievements, and what students should expect..."
              />
            </Field>

            {isTeacher && (
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Certification">
                  <div className="relative">
                    <input
                      name="qualification"
                      value={formData.qualification}
                      onChange={handleChange}
                      className={INPUT + ' pl-10'}
                      placeholder="TRCN, PGDE, professional certificate"
                    />
                    <Award size={14} className="absolute left-3.5 top-3.5 text-gray-400" />
                  </div>
                </Field>
                <Field label="Education">
                  <div className="relative">
                    <input
                      name="highestDegree"
                      value={formData.highestDegree}
                      onChange={handleChange}
                      className={INPUT + ' pl-10'}
                      placeholder="B.Sc Mathematics"
                    />
                    <GraduationCap size={14} className="absolute left-3.5 top-3.5 text-gray-400" />
                  </div>
                </Field>
                <Field label="Institution">
                  <input
                    name="institution"
                    value={formData.institution}
                    onChange={handleChange}
                    className={INPUT}
                    placeholder="University or school attended"
                  />
                </Field>
              </div>
            )}
          </div>

          {/* Teacher Upload & Verification */}
          {isTeacher && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-gray-50">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <ShieldCheck size={16} />
                  </div>
                  <h2 className="text-xs font-black text-gray-700 uppercase tracking-widest">Tutor Verification & Media</h2>
                </div>

                {completion && (
                  <span className="text-xs font-black text-[#FFB81C] bg-[#FFB81C]/5 px-2.5 py-1 rounded-lg border border-[#FFB81C]/10">
                    {Math.round(completion.completionPercentage)}% Completed
                  </span>
                )}
              </div>

              {/* Progress Bar */}
              {completion && (
                <div className="space-y-1.5 p-4 rounded-xl bg-gray-50 border border-gray-100/50">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-gray-400">
                    <span>Profile Readiness</span>
                    <span className="text-gray-500 font-bold normal-case">{completion.nextStep}</span>
                  </div>
                  <div className="w-full bg-gray-200/80 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-[#001A72] to-[#FFB81C] h-2.5 rounded-full transition-all duration-700"
                      style={{ width: `${completion.completionPercentage}%` }}
                    />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-2 pt-2">
                    {PROFILE_STEPS.map((step) => (
                      <div key={step.key} className="flex items-center gap-2 text-[10px] font-bold text-gray-600">
                        {completion.completion[step.key] ? <CheckCircle2 size={12} className="text-emerald-500" /> : <Clock size={12} className="text-amber-500" />}
                        {step.label}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload Grid */}
              <div className="grid sm:grid-cols-2 gap-4">
                {/* Video Intro Card */}
                <div className="p-4 rounded-xl border border-gray-100 bg-white flex flex-col justify-between space-y-4 hover:border-purple-100 hover:shadow-md hover:shadow-purple-50/20 transition-all duration-300">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
                        <Video size={15} />
                      </div>
                      {completion?.completion?.video_intro ? (
                        <div className="flex items-center gap-1 text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                          <CheckCircle2 size={10} /> Active
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-[9px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">
                          <Clock size={10} /> Pending
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-gray-800">1-Minute Video Intro</h4>
                      <p className="text-[10px] text-gray-400 leading-normal mt-0.5">
                        Introduce your classes. Format: MP4/WebM. Max size: 50MB.
                      </p>
                    </div>
                  </div>

                  <label className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer transition select-none ${uploading.videoIntro ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-[#001A72] text-white hover:bg-[#001A72]/90 shadow-sm shadow-[#001A72]/5'
                    }`}>
                    <Upload size={12} />
                    {uploading.videoIntro ? 'Uploading…' : 'Choose Video'}
                    <input
                      type="file"
                      accept="video/*"
                      onChange={(e) => handleFileUpload(e, 'videoIntro')}
                      className="hidden"
                      disabled={uploading.videoIntro}
                    />
                  </label>
                </div>

                {/* Documents Management Card */}
                <div className="sm:col-span-2 p-4 rounded-xl border border-gray-100 bg-white flex flex-col space-y-4 hover:border-emerald-100 hover:shadow-md hover:shadow-emerald-50/20 transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                        <FileText size={15} />
                      </div>
                      <h4 className="text-xs font-bold text-gray-800">Documents</h4>
                    </div>
                    {allDocumentsVerified ? (
                      <div className="flex items-center gap-1 text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                        <CheckCircle2 size={10} /> All Verified
                      </div>
                    ) : hasDocuments ? (
                      <div className="flex items-center gap-1 text-[9px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">
                        <Clock size={10} /> Pending
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-[9px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">
                        <Clock size={10} /> Not Uploaded
                      </div>
                    )}
                  </div>

                  {/* Upload Form */}
                  <div className="space-y-3 bg-gray-50 rounded-xl p-4 border border-gray-100/50">
                    <p className="text-[10px] text-gray-400 leading-normal">
                      Submit TRCN, NIN or Teaching Certificates. PDF only. Max size: 10MB.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={newDocName}
                        onChange={(e) => setNewDocName(e.target.value)}
                        placeholder="Document name (e.g. TRCN Certificate)"
                        className="flex-1 text-xs border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#001A72] transition"
                      />
                    </div>

                    {/* Tag Input */}
                    <div className="flex items-center gap-2">
                      <Tags size={12} className="text-gray-400 shrink-0" />
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(); } }}
                        placeholder="Add a tag (e.g. TRCN, NIN, DEGREE)"
                        className="flex-1 text-xs border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#001A72] transition"
                      />
                      <button
                        type="button"
                        onClick={handleAddTag}
                        className="text-[10px] font-black text-[#001A72] bg-[#001A72]/5 px-3 py-2 rounded-lg hover:bg-[#001A72]/10 transition"
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    {/* Tags Display */}
                    {newDocTags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {newDocTags.map((tag) => (
                          <span key={tag} className="inline-flex items-center gap-1 text-[9px] font-bold text-[#001A72] bg-[#001A72]/5 px-2 py-0.5 rounded-md border border-[#001A72]/10">
                            {tag}
                            <button type="button" onClick={() => handleRemoveTag(tag)} className="hover:text-red-500 transition">
                              <X size={10} />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}

                    <label className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer transition select-none ${uploading.document ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-[#001A72] text-white hover:bg-[#001A72]/90 shadow-sm shadow-[#001A72]/5'
                      }`}>
                      <Upload size={12} />
                      {uploading.document ? 'Uploading…' : 'Upload PDF'}
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={handleDocumentUpload}
                        className="hidden"
                        disabled={uploading.document}
                      />
                    </label>
                  </div>

                  {/* Uploaded Documents List */}
                  {documents.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Uploaded Documents</p>
                      {documents.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-100/50">
                          <div className="flex items-center gap-3 min-w-0">
                            <FileText size={14} className="text-[#001A72] shrink-0" />
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-gray-800 truncate">{doc.name}</p>
                              <div className="flex flex-wrap gap-1 mt-0.5">
                                {doc.tags.map((tag) => (
                                  <span key={tag} className="text-[8px] font-bold text-gray-500 bg-gray-200/60 px-1.5 py-0.5 rounded">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {doc.verified ? (
                              <span className="flex items-center gap-1 text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                                <CheckCircle2 size={10} /> Verified
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-[9px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">
                                <Clock size={10} /> Pending
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDeleteDocument(doc.id)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Verification Path Roadmap */}
              <div className="bg-[#001A72] rounded-xl p-5 text-white space-y-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Tutor Verification Journey</p>
                  <p className="text-[9px] text-white/60 leading-normal mt-0.5">
                    Verified profiles enjoy higher visibility, digital vault listing tools, and custom premium payouts.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-4 border-t border-white/10 pt-4">
                  {[
                    { n: '1', title: 'Get Verified', text: 'Upload files to verify identity.', active: true },
                    { n: '2', title: 'Go Premium', text: 'Activate marketplace features.', active: completion?.completionPercentage === 100 },
                    { n: '3', title: 'Passive Earnings', text: 'Upload premium material vault.', active: completion?.isPremium },
                  ].map((s) => (
                    <div key={s.n} className={`space-y-1.5 ${s.active ? 'opacity-100' : 'opacity-35'}`}>
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black ${s.active ? 'bg-[#FFB81C] text-[#001A72]' : 'bg-white/10 text-white'}`}>
                        {s.n}
                      </div>
                      <div>
                        <p className="text-[10px] font-black leading-tight">{s.title}</p>
                        <p className="text-[8px] text-white/50 leading-relaxed mt-0.5">{s.text}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {completion?.completionPercentage === 100 && !completion.isPremium && (
                  <button
                    type="button"
                    onClick={() => router.push('/app/premium-subscription')}
                    className="w-full flex items-center justify-center gap-2 bg-[#FFB81C] text-[#001A72] py-2.5 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-[#FFB81C]/90 transition"
                  >
                    <Gem size={13} /> Upgrade to Premium
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </form>

      {/* Reusable Image Crop Modal */}
      <ImageCropModal
        isOpen={cropModalOpen}
        onClose={() => setCropModalOpen(false)}
        imageSrc={imageSrc}
        onSave={uploadCroppedFile}
      />
    </div>
  );
}

function Field({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</label>
      {children}
    </div>
  );
}

const INPUT =
  'w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#001A72]/20 focus:border-[#001A72] transition font-medium text-gray-700 bg-white placeholder-gray-400';
