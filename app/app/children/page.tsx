'use client';

import { useState } from 'react';
import { useUser } from '@/misc/context/UserContext';
import {
  UserPlus,
  Baby,
  Loader2,
  AlertCircle,
  Mail,
  Phone,
  Trash2,
} from 'lucide-react';
import PageHeader from '@/misc/components/PageHeader';
import Modal from '@/misc/components/Modal';
import Button from '@/misc/components/Button';
import ChildCard from '@/misc/components/ChildCard';
import { toast } from 'sonner';
import {
  useChildren,
  useRegisterChild,
  useUpdateChild,
  useDeleteChild,
  Child,
} from '@/misc/hooks/useChildren';

const GRADE_OPTIONS = [
  'Nursery 1', 'Nursery 2',
  'Primary 1', 'Primary 2', 'Primary 3', 'Primary 4', 'Primary 5', 'Primary 6',
  'JSS 1', 'JSS 2', 'JSS 3',
  'SS 1', 'SS 2', 'SS 3',
  // 'Year 7', 'Year 8', 'Year 9', 'Year 10', 'Year 11', 'Year 12',
  // 'University (100L)', 'University (200L)', 'University (300L)', 'University (400L)',
  'Other',
];

const INPUT = 'w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#001A72]/20 focus:border-[#001A72] transition font-medium text-gray-700 bg-white placeholder-gray-400';
const LABEL = 'block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5';

const EMPTY_FORM = {
  firstName: '', lastName: '', email: '', phone: '',
  dateOfBirth: '', grade: '', school: '', notes: '',
};

export default function ChildrenPage() {
  const { user } = useUser();

  const { data: children = [], isLoading: loading } = useChildren(user?.role);
  const registerMutation = useRegisterChild();
  const updateMutation = useUpdateChild();
  const deleteMutation = useDeleteChild();

  const [formOpen, setFormOpen] = useState(false);
  const [editChild, setEditChild] = useState<Child | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });

  const [deleteTarget, setDeleteTarget] = useState<Child | null>(null);

  const saving = registerMutation.isPending || updateMutation.isPending;
  const deleting = deleteMutation.isPending;

  /* ── Form helpers ──────────────────────────────────────────────────────── */
  const openRegister = () => {
    setEditChild(null);
    setForm({ ...EMPTY_FORM });
    setFormOpen(true);
  };

  const openEdit = (child: Child) => {
    setEditChild(child);
    setForm({
      firstName: child.firstName,
      lastName: child.lastName,
      email: child.email,
      phone: child.phone || '',
      dateOfBirth: child.dateOfBirth || '',
      grade: child.grade || '',
      school: child.school || '',
      notes: child.notes || '',
    });
    setFormOpen(true);
  };

  const set = (field: keyof typeof EMPTY_FORM) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));

  /* ── Save ──────────────────────────────────────────────────────────────── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editChild) {
      updateMutation.mutate(
        { childId: editChild.id, data: form },
        {
          onSuccess: () => {
            toast.success('Child profile updated!');
            setFormOpen(false);
          },
          onError: (err: any) => {
            toast.error(err.response?.data?.error || 'Failed to save. Please try again.');
          },
        }
      );
    } else {
      registerMutation.mutate(form, {
        onSuccess: () => {
          toast.success(`${form.firstName} has been registered!`);
          setFormOpen(false);
        },
        onError: (err: any) => {
          toast.error(err.response?.data?.error || 'Failed to save. Please try again.');
        },
      });
    }
  };

  /* ── Delete ────────────────────────────────────────────────────────────── */
  const handleDelete = async () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success(`${deleteTarget.firstName} has been removed.`);
        setDeleteTarget(null);
      },
      onError: (err: any) => {
        toast.error(err.response?.data?.error || 'Failed to remove child.');
      },
    });
  };

  /* ── Guard ─────────────────────────────────────────────────────────────── */
  if (user?.role !== 'parent') {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <AlertCircle className="text-amber-500" size={40} />
        <p className="text-gray-500 font-semibold text-sm">This section is only available to parents.</p>
      </div>
    );
  }

  /* ── Render ────────────────────────────────────────────────────────────── */
  return (
    <div className="space-y-6 max-w-5xl mx-auto">

      {/* Page title + add button */}
      <div className="flex items-end justify-between gap-4">
        <PageHeader
          title="My Children"
          subtitle="Manage your children's accounts and monitor their educational journey"
        />
        <Button
          onClick={openRegister}
          variant="primary"
          fullWidth={false}
          className="flex items-center gap-2 text-xs font-black uppercase tracking-wider px-5 py-3 rounded-xl transition shadow-sm shrink-0 mt-0"
        >
          <UserPlus size={15} />
          Add Child
        </Button>
      </div>

      {/* Children grid */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="animate-spin text-[#001A72]" size={32} />
        </div>
      ) : children.length === 0 ? (
        <EmptyState onAdd={openRegister} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {children.map((child) => (
            <ChildCard
              key={child.id}
              child={child}
              onEdit={() => openEdit(child)}
              onDelete={() => setDeleteTarget(child)}
            />
          ))}
        </div>
      )}

      {/* ── Register / Edit Modal ──────────────────────────────────────────── */}
      <Modal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title={editChild ? 'Edit Child Profile' : 'Register a Child'}
        subtitle={
          editChild
            ? "Update your child's information."
            : "Your child will be added as a student user in the system."
        }
        size="md"
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              fullWidth={false}
              onClick={() => setFormOpen(false)}
              className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition mt-0 shadow-none"
            >
              Cancel
            </Button>
            <Button
              form="child-form"
              type="submit"
              isLoading={saving}
              loadingText="Saving..."
              variant="primary"
              fullWidth={false}
              className="px-6 py-2.5 rounded-xl text-sm font-black mt-0"
            >
              {editChild ? 'Save Changes' : 'Register Child'}
            </Button>
          </>
        }
      >
        <form id="child-form" onSubmit={handleSubmit} className="space-y-4">

          {/* Name row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>First Name *</label>
              <input required value={form.firstName} onChange={set('firstName')} className={INPUT} placeholder="e.g. Amara" />
            </div>
            <div>
              <label className={LABEL}>Last Name *</label>
              <input required value={form.lastName} onChange={set('lastName')} className={INPUT} placeholder="e.g. Johnson" />
            </div>
          </div>

          {/* Email — only editable on create; readonly on edit */}
          <div>
            <label className={LABEL}>Email Address *</label>
            <div className="relative">
              <input
                required={!editChild}
                type="email"
                value={form.email}
                onChange={set('email')}
                readOnly={!!editChild}
                className={INPUT + (editChild ? ' bg-gray-50 cursor-not-allowed opacity-60 pl-10' : ' pl-10')}
                placeholder="child@example.com"
              />
              <Mail size={14} className="absolute left-3.5 top-3.5 text-gray-400" />
            </div>
            {!editChild && (
              <p className="text-[10px] text-gray-400 mt-1">This will be their student login email.</p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className={LABEL}>Phone Number <span className="text-gray-300 font-normal normal-case">(optional)</span></label>
            <div className="relative">
              <input
                type="tel"
                value={form.phone}
                onChange={set('phone')}
                className={INPUT + ' pl-10'}
                placeholder="+234 800 000 0000"
              />
              <Phone size={14} className="absolute left-3.5 top-3.5 text-gray-400" />
            </div>
          </div>

          {/* DOB + Grade */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>Date of Birth *</label>
              <input
                required
                type="date"
                value={form.dateOfBirth}
                onChange={set('dateOfBirth')}
                className={INPUT}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div>
              <label className={LABEL}>Grade / Class *</label>
              <select required value={form.grade} onChange={set('grade')} className={INPUT}>
                <option value="">Select grade...</option>
                {GRADE_OPTIONS.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>

          {/* School */}
          <div>
            <label className={LABEL}>School Name</label>
            <input
              value={form.school}
              onChange={set('school')}
              className={INPUT}
              placeholder="e.g. Lagos Preparatory School"
            />
          </div>

          {/* Notes */}
          <div>
            <label className={LABEL}>Notes <span className="text-gray-300 font-normal normal-case">(optional)</span></label>
            <textarea
              value={form.notes}
              onChange={set('notes')}
              rows={3}
              className={INPUT + ' resize-none'}
              placeholder="Any special needs, allergies, or learning notes for the teacher..."
            />
          </div>
        </form>
      </Modal>

      {/* ── Delete Confirmation Modal ──────────────────────────────────────── */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        size="sm"
        footer={
          <>
            <Button
              variant="outline"
              fullWidth={false}
              onClick={() => setDeleteTarget(null)}
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition mt-0 shadow-none"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              isLoading={deleting}
              loadingText="Removing..."
              variant="danger"
              fullWidth={false}
              className="px-6 py-2.5 rounded-xl text-sm font-black mt-0"
            >
              Yes, Remove
            </Button>
          </>
        }
      >
        <div className="text-center space-y-3 py-2">
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto">
            <Trash2 size={24} className="text-red-500" />
          </div>
          <h3 className="font-black text-gray-900 text-lg">Remove {deleteTarget?.firstName}?</h3>
          <p className="text-sm text-gray-500 leading-relaxed">
            This will permanently delete{' '}
            <strong>{deleteTarget?.firstName} {deleteTarget?.lastName}</strong>'s profile and their student account.
            This action cannot be undone.
          </p>
        </div>
      </Modal>
    </div>
  );
}


/* ── Empty state ────────────────────────────────────────────────────────────── */
function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center bg-white rounded-2xl border border-gray-100 shadow-sm py-20 gap-5">
      <div className="w-20 h-20 rounded-full bg-[#001A72]/5 flex items-center justify-center">
        <Baby size={36} className="text-[#001A72]/30" />
      </div>
      <div className="text-center">
        <p className="font-bold text-gray-700 text-base">No children registered yet</p>
        <p className="text-gray-400 text-xs mt-1 max-w-xs mx-auto leading-relaxed">
          Register your children to track their courses, schedules, and learning progress all in one place.
        </p>
      </div>
      <Button
        onClick={onAdd}
        variant="primary"
        fullWidth={false}
        className="flex items-center gap-2 text-xs font-black uppercase tracking-wider px-6 py-3 rounded-xl transition mt-0"
      >
        <UserPlus size={14} />
        Register First Child
      </Button>
    </div>
  );
}
