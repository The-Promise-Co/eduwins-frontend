'use client';

import { useState, useEffect, ReactElement, ChangeEvent, FormEvent, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useProfileCompletion } from '@/misc/hooks/api/uploads';
import { useUpdateProfile } from '@/misc/hooks/api/auth';
import { useUser } from '@/misc/context/UserContext';
import { TeacherProfile } from '@/misc/types';
import {
  User as UserIcon,
  Camera,
  Mail,
  Phone,
  FileText,
  RefreshCw,
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
  });

  // Upload states
  const [uploading, setUploading] = useState<Record<string, boolean>>({});

  // Avatar Cropper States
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [imageSrc, setImageSrc] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const completionQuery = useProfileCompletion();
  const updateProfileMutation = useUpdateProfile();

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
        photo: userData.photo || userData.photoUrl || '',
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
      const updated = { ...(user || {}), photo: r2Url, photoUrl: r2Url } as TeacherProfile;
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

  const completion = buildTutorCompletion(user, formData, completionQuery.data || null);
  const saving = updateProfileMutation.isPending;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <PageHeader title="Profile Details" subtitle="Manage your personal information, profile media, and credentials" />

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        {/* LEFT COLUMN: Basic Information */}
        <div className="lg:col-span-5 space-y-6">
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
          <div className="space-y-6">
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

          </div>
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
