'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { GraduationCap, Pencil, Trash2, Plus, LockKeyhole } from 'lucide-react';
import PageHeader from '@/misc/components/PageHeader';
import Modal from '@/misc/components/Modal';
import { useUpdateProfile } from '@/misc/hooks/api/auth';
import { useProfileCompletion } from '@/misc/hooks/api/uploads';
import { useUser } from '@/misc/context/UserContext';
import { TeacherEducation, TeacherProfile } from '@/misc/types';
import { toast } from 'sonner';

const EMPTY_EDU: TeacherEducation = {
  institutionName: '',
  degree: '',
  fieldOfStudy: '',
  grade: '',
  startDate: '',
  endDate: '',
  isCurrent: false,
};

export default function EducationPage() {
  const router = useRouter();
  const { user: ctxUser, refreshUser } = useUser();
  const updateProfile = useUpdateProfile();
  const completionQuery = useProfileCompletion();
  const [user, setUser] = useState<TeacherProfile | null>(null);
  const [items, setItems] = useState<TeacherEducation[]>([]);
  const [form, setForm] = useState<TeacherEducation>(EMPTY_EDU);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const userJson = localStorage.getItem('user');
    if (!userJson) return router.push('/login');
    const userData = JSON.parse(userJson) as TeacherProfile;
    if (userData.role !== 'teacher') return router.replace('/app/profile');
    setUser(userData);
    setItems(userData.education || []);
  }, [router]);

  useEffect(() => {
    if (ctxUser?.role !== 'teacher') return;
    setUser(ctxUser);
    setItems(ctxUser.education || []);
  }, [ctxUser]);

  const setField = (key: keyof TeacherEducation, value: string | boolean) => setForm((prev) => ({ ...prev, [key]: value }));
  const reset = () => {
    setForm(EMPTY_EDU);
    setEditingIndex(null);
    setIsModalOpen(false);
  };

  const openAddModal = () => {
    setForm(EMPTY_EDU);
    setEditingIndex(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item: TeacherEducation, index: number) => {
    setForm(item);
    setEditingIndex(index);
    setIsModalOpen(true);
  };

  const persistEducation = async (nextItems: TeacherEducation[], message: string) => {
    await updateProfile.mutateAsync({ education: nextItems });
    const updated = { ...(user || {}), education: nextItems } as TeacherProfile;
    localStorage.setItem('user', JSON.stringify(updated));
    setUser(updated);
    setItems(nextItems);
    await refreshUser();
    await completionQuery.refetch();
    toast.success(message);
  };

  const addOrUpdate = async () => {
    if (!form.institutionName.trim()) return toast.error('Institution name is required.');
    const record = { ...form, id: form.id || Math.random().toString(36).slice(2), endDate: form.isCurrent ? null : form.endDate || null };
    const nextItems = editingIndex === null ? [...items, record] : items.map((item, index) => index === editingIndex ? record : item);
    try {
      await persistEducation(nextItems, editingIndex === null ? 'Education added successfully.' : 'Education updated successfully.');
      reset();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update education.');
    }
  };

  const removeEducation = async (index: number) => {
    const nextItems = items.filter((_, itemIndex) => itemIndex !== index);
    try {
      await persistEducation(nextItems, 'Education removed successfully.');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update education.');
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-12">
      <PageHeader title="Education" subtitle="Add, edit, or delete your education records" />
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-5">
        <div className="flex items-center justify-between gap-3 border-b border-gray-50 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-[#001A72]"><GraduationCap size={16} /></div>
            <h2 className="text-xs font-black uppercase tracking-widest text-gray-700">Education Records</h2>
          </div>
          <button type="button" onClick={openAddModal} className="inline-flex items-center gap-2 rounded-xl bg-[#001A72] px-4 py-2.5 text-xs font-black uppercase tracking-wider text-white">
            <Plus size={14} /> Add Education
          </button>
        </div>

        <div className="space-y-2">
          {items.length ? items.map((item, index) => (
            <div key={item.id || index} className="flex items-start justify-between rounded-xl border border-gray-100 bg-gray-50 p-3">
              <div>
                <p className="text-sm font-bold text-gray-800">{item.institutionName}</p>
                <p className="text-xs text-gray-500">{[item.degree, item.fieldOfStudy].filter(Boolean).join(' • ') || 'Education record'}</p>
                <p className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-gray-400"><LockKeyhole size={10} /> Grade and dates are private and will not be shown to students or parents.</p>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => openEditModal(item, index)} className="text-[#001A72]"><Pencil size={14} /></button>
                <button type="button" onClick={() => removeEducation(index)} disabled={updateProfile.isPending} className="text-red-500 disabled:opacity-50"><Trash2 size={14} /></button>
              </div>
            </div>
          )) : <p className="rounded-xl border border-dashed border-gray-200 p-5 text-sm text-gray-400">No education records added yet.</p>}
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={reset}
        title={editingIndex === null ? 'Add Education' : 'Edit Education'}
        subtitle="Grade and dates are private and will not be shown to students or parents."
        size="md"
        footer={(
          <>
            <button type="button" onClick={reset} className="rounded-xl border border-gray-200 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-gray-500">Cancel</button>
            <button type="button" onClick={addOrUpdate} disabled={updateProfile.isPending} className="rounded-xl bg-[#001A72] px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white disabled:opacity-60">{updateProfile.isPending ? 'Saving...' : editingIndex === null ? 'Add' : 'Update'}</button>
          </>
        )}
      >
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Institution Name" required><input value={form.institutionName} onChange={(e) => setField('institutionName', e.target.value)} className={INPUT} /></Field>
          <Field label="Degree"><input value={form.degree || ''} onChange={(e) => setField('degree', e.target.value)} className={INPUT} placeholder="BSc, MSc, Diploma" /></Field>
          <Field label="Field of Study"><input value={form.fieldOfStudy || ''} onChange={(e) => setField('fieldOfStudy', e.target.value)} className={INPUT} placeholder="Computer Science" /></Field>
          <PrivateField label="Grade"><input value={form.grade || ''} onChange={(e) => setField('grade', e.target.value)} className={INPUT} placeholder="First Class, GPA" /></PrivateField>
          <PrivateField label="Start Date"><input type="date" value={form.startDate || ''} onChange={(e) => setField('startDate', e.target.value)} className={INPUT} /></PrivateField>
          <PrivateField label="End Date"><input type="date" disabled={form.isCurrent} value={form.endDate || ''} onChange={(e) => setField('endDate', e.target.value)} className={INPUT + ' disabled:opacity-50'} /></PrivateField>
          <label className="sm:col-span-2 flex items-center gap-2 text-xs font-bold text-gray-600"><input type="checkbox" checked={Boolean(form.isCurrent)} onChange={(e) => setField('isCurrent', e.target.checked)} /> I currently study here</label>
        </div>
      </Modal>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return <label className="space-y-1.5 text-[10px] font-black uppercase tracking-widest text-gray-400">{label}{required ? ' *' : ''}{children}</label>;
}

function PrivateField({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="space-y-1.5 text-[10px] font-black uppercase tracking-widest text-gray-400">{label}<span className="ml-1 normal-case tracking-normal text-gray-300">Not shown publicly</span>{children}</label>;
}

const INPUT = 'w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#001A72]/20 focus:border-[#001A72] transition font-medium text-gray-700 bg-white placeholder-gray-400';
