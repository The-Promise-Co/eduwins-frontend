'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Award, Pencil, Trash2, Plus, Image as ImageIcon } from 'lucide-react';
import PageHeader from '@/misc/components/PageHeader';
import Modal from '@/misc/components/Modal';
import ImageUpload from '@/misc/components/ImageUpload';
import { useUpdateProfile } from '@/misc/hooks/api/auth';
import { useProfileCompletion } from '@/misc/hooks/api/uploads';
import { useUser } from '@/misc/context/UserContext';
import { useR2 } from '@/misc/hooks/useR2';
import { TeacherCertification, TeacherProfile } from '@/misc/types';
import { toast } from 'sonner';

const EMPTY_CERT: TeacherCertification = {
  certificationName: '',
  issuingOrganization: '',
  credentialId: '',
  credentialUrl: '',
  imageUrl: '',
  issueDate: '',
  expiryDate: '',
  doesNotExpire: false,
  description: '',
};

export default function CertificationsPage() {
  const router = useRouter();
  const { user: ctxUser, refreshUser } = useUser();
  const updateProfile = useUpdateProfile();
  const completionQuery = useProfileCompletion();
  const { uploadFile, isUploading } = useR2();
  const [user, setUser] = useState<TeacherProfile | null>(null);
  const [items, setItems] = useState<TeacherCertification[]>([]);
  const [form, setForm] = useState<TeacherCertification>(EMPTY_CERT);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    const userJson = localStorage.getItem('user');
    if (!userJson) return router.push('/login');
    const userData = JSON.parse(userJson) as TeacherProfile;
    if (userData.role !== 'teacher') return router.replace('/app/profile');
    setUser(userData);
    setItems(userData.certifications || []);
  }, [router]);

  useEffect(() => {
    if (ctxUser?.role !== 'teacher') return;
    setUser(ctxUser);
    setItems(ctxUser.certifications || []);
  }, [ctxUser]);

  useEffect(() => {
    return () => {
      if (imagePreview?.startsWith('blob:')) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const preview = useMemo(() => imagePreview || form.imageUrl || null, [form.imageUrl, imagePreview]);

  const reset = () => {
    setForm(EMPTY_CERT);
    setEditingIndex(null);
    setIsModalOpen(false);
    setImageFile(null);
    setImagePreview(null);
  };

  const openAddModal = () => {
    setForm(EMPTY_CERT);
    setEditingIndex(null);
    setImageFile(null);
    setImagePreview(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item: TeacherCertification, index: number) => {
    setForm(item);
    setEditingIndex(index);
    setImageFile(null);
    setImagePreview(null);
    setIsModalOpen(true);
  };

  const setField = (key: keyof TeacherCertification, value: string | boolean | null) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleImageSelect = (file: File) => {
    if (imagePreview?.startsWith('blob:')) URL.revokeObjectURL(imagePreview);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const clearImage = () => {
    if (imagePreview?.startsWith('blob:')) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview(null);
    setField('imageUrl', null);
  };

  const persistCredentials = async (nextItems: TeacherCertification[], message: string) => {
    await updateProfile.mutateAsync({ certifications: nextItems });
    const updated = { ...(user || {}), certifications: nextItems } as TeacherProfile;
    localStorage.setItem('user', JSON.stringify(updated));
    setUser(updated);
    setItems(nextItems);
    await refreshUser();
    await completionQuery.refetch();
    toast.success(message);
  };

  const addOrUpdate = async () => {
    if (!form.certificationName.trim() || !form.issuingOrganization.trim()) {
      toast.error('Certification name and issuing organization are required.');
      return;
    }

    if (!imageFile && !form.imageUrl && !form.credentialId?.trim()) {
      toast.error('Upload a credential image or provide a Credential ID.');
      return;
    }

    let imageUrl = form.imageUrl || null;
    if (imageFile) {
      imageUrl = await uploadFile(imageFile, 'credentials');
      if (!imageUrl) {
        toast.error('Failed to upload credential image.');
        return;
      }
    }

    const record = { ...form, id: form.id || Math.random().toString(36).slice(2), credentialId: form.credentialId?.trim() || null, imageUrl, expiryDate: form.doesNotExpire ? null : form.expiryDate || null };
    const nextItems = editingIndex === null ? [...items, record] : items.map((item, index) => index === editingIndex ? record : item);
    try {
      await persistCredentials(nextItems, editingIndex === null ? 'Credential added successfully.' : 'Credential updated successfully.');
      reset();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update credentials.');
    }
  };

  const removeCredential = async (index: number) => {
    const nextItems = items.filter((_, itemIndex) => itemIndex !== index);
    try {
      await persistCredentials(nextItems, 'Credential removed successfully.');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update credentials.');
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-12">
      <PageHeader title="Credentials" subtitle="Add, edit, or delete professional certifications and credential documents" />
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-5">
        <div className="flex items-center justify-between gap-3 border-b border-gray-50 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600"><Award size={16} /></div>
            <h2 className="text-xs font-black uppercase tracking-widest text-gray-700">Credential Records</h2>
          </div>
          <button type="button" onClick={openAddModal} className="inline-flex items-center gap-2 rounded-xl bg-[#001A72] px-4 py-2.5 text-xs font-black uppercase tracking-wider text-white">
            <Plus size={14} /> Add Credential
          </button>
        </div>

        <div className="space-y-2">
          {items.length ? items.map((item, index) => (
            <div key={item.id || index} className="flex items-start justify-between rounded-xl border border-gray-100 bg-gray-50 p-3">
              <div className="flex items-start gap-3">
                {item.imageUrl ? <img src={item.imageUrl} alt={item.certificationName} className="h-12 w-12 rounded-lg object-cover border border-gray-100" /> : <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white text-gray-300 border border-gray-100"><ImageIcon size={18} /></div>}
                <div>
                  <p className="text-sm font-bold text-gray-800">{item.certificationName}</p>
                  <p className="text-xs text-gray-500">{item.issuingOrganization}</p>
                  {item.credentialId && <p className="text-[10px] text-gray-400 mt-1">Credential ID: {item.credentialId}</p>}
                  {(item.issueDate || item.expiryDate || item.doesNotExpire) && <p className="text-[10px] text-gray-400 mt-1">{item.issueDate || 'Unknown'} - {item.doesNotExpire ? 'No expiry' : item.expiryDate || 'Unknown'}</p>}
                </div>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => openEditModal(item, index)} className="text-[#001A72]"><Pencil size={14} /></button>
                <button type="button" onClick={() => removeCredential(index)} disabled={updateProfile.isPending} className="text-red-500 disabled:opacity-50"><Trash2 size={14} /></button>
              </div>
            </div>
          )) : <p className="rounded-xl border border-dashed border-gray-200 p-5 text-sm text-gray-400">No credentials added yet.</p>}
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={reset}
        title={editingIndex === null ? 'Add Credential' : 'Edit Credential'}
        subtitle="Upload a credential image or provide a Credential ID."
        size="lg"
        footer={(
          <>
            <button type="button" onClick={reset} className="rounded-xl border border-gray-200 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-gray-500">Cancel</button>
            <button type="button" onClick={addOrUpdate} disabled={isUploading || updateProfile.isPending} className="rounded-xl bg-[#001A72] px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white disabled:opacity-60">{isUploading ? 'Uploading...' : updateProfile.isPending ? 'Saving...' : editingIndex === null ? 'Add' : 'Update'}</button>
          </>
        )}
      >
        <div className="grid lg:grid-cols-[260px_1fr] gap-5">
          <ImageUpload
            preview={preview}
            onFileSelect={handleImageSelect}
            onClear={clearImage}
            aspectRatio="aspect-[4/3]"
            hint="Upload credential image, JPG or PNG. Max: 5MB."
            removeLabel="Remove credential image"
            disabled={isUploading}
            onError={toast.error}
          />
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-800">
              Verification requires one option: upload a credential image, or enter a Credential ID. Credential URL is optional.
            </div>
            <Field label="Credential Name" required><input value={form.certificationName} onChange={(e) => setField('certificationName', e.target.value)} className={INPUT} placeholder="TRCN Certificate" /></Field>
            <Field label="Issuing Organization" required><input value={form.issuingOrganization} onChange={(e) => setField('issuingOrganization', e.target.value)} className={INPUT} placeholder="TRCN" /></Field>
            <Field label="Credential ID"><input value={form.credentialId || ''} onChange={(e) => setField('credentialId', e.target.value)} className={INPUT} placeholder="ABCD123456789" /></Field>
            <Field label="Credential URL"><input value={form.credentialUrl || ''} onChange={(e) => setField('credentialUrl', e.target.value)} className={INPUT} placeholder="https://..." /></Field>
            <Field label="Issue Date"><input type="date" value={form.issueDate || ''} onChange={(e) => setField('issueDate', e.target.value)} className={INPUT} /></Field>
            <Field label="Expiry Date"><input type="date" disabled={form.doesNotExpire} value={form.expiryDate || ''} onChange={(e) => setField('expiryDate', e.target.value)} className={INPUT + ' disabled:opacity-50'} /></Field>
            <label className="sm:col-span-2 flex items-center gap-2 text-xs font-bold text-gray-600"><input type="checkbox" checked={Boolean(form.doesNotExpire)} onChange={(e) => setField('doesNotExpire', e.target.checked)} /> Does not expire</label>
            <Field label="Description" className="sm:col-span-2"><textarea rows={7} value={form.description || ''} onChange={(e) => setField('description', e.target.value)} className={INPUT + ' min-h-40 resize-y'} placeholder="Add details about the credential, verification notes, or the scope of the certification." /></Field>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function Field({ label, required, className = '', children }: { label: string; required?: boolean; className?: string; children: React.ReactNode }) {
  return <label className={`space-y-1.5 text-[10px] font-black uppercase tracking-widest text-gray-400 ${className}`}>{label}{required ? ' *' : ''}{children}</label>;
}

const INPUT = 'w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#001A72]/20 focus:border-[#001A72] transition font-medium text-gray-700 bg-white placeholder-gray-400';
