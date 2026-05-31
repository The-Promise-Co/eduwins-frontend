'use client';

import { useState, ReactElement, ChangeEvent, FormEvent } from 'react';
import { Globe, Shield, Trash2, KeyRound, Smartphone, AlertTriangle } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import Button from '@/components/Button';

interface GeneralSettings {
  timezone: string;
  language: string;
  twoFactorEnabled: boolean;
}

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function SecuritySettingsPage(): ReactElement {
  const [settings, setSettings] = useState<GeneralSettings>({
    timezone: 'Africa/Lagos',
    language: 'English',
    twoFactorEnabled: false,
  });

  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [message, setMessage] = useState<{ type: 'success' | 'error' | ''; text: string }>({
    type: '',
    text: '',
  });

  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);

  const toggle2FA = () =>
    setSettings((p) => ({ ...p, twoFactorEnabled: !p.twoFactorEnabled }));

  const handleSelect = (key: keyof GeneralSettings, value: string) =>
    setSettings((p) => ({ ...p, [key]: value }));

  const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordForm((p) => ({ ...p, [name]: value }));
  };

  const handleUpdatePassword = async (e: FormEvent) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }

    setUpdatingPassword(true);
    try {
      // Simulate API call to update password
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setMessage({ type: 'success', text: 'Password updated successfully!' });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch {
      setMessage({ type: 'error', text: 'Failed to update password.' });
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleSavePreferences = async () => {
    setSavingPrefs(true);
    setMessage({ type: '', text: '' });
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      setMessage({ type: 'success', text: 'Localization preferences saved successfully!' });
    } catch {
      setMessage({ type: 'error', text: 'Failed to save preferences.' });
    } finally {
      setSavingPrefs(false);
    }
  };

  const handleDeleteAccount = () => {
    if (window.confirm('Are you sure you want to permanently delete your account? This cannot be undone.')) {
      setMessage({ type: 'success', text: 'Account deletion request received' });
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-12">
      <PageHeader
        title="Language & Region"
        subtitle="Manage your primary system language, active regional timezone, and localization details"
      />

      {/* Dynamic Alerts */}
      {message.text && (
        <div className={`p-4 rounded-xl text-xs font-bold border transition-all duration-300 animate-in fade-in slide-in-from-top-2 ${
          message.type === 'success'
            ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
            : 'bg-red-50 text-red-700 border-red-100'
        }`}>
          {message.text}
        </div>
      )}

      <div className="space-y-6">

        {/* Security & Authentication Card (Mirrors basic settings but stays nested for convenience) */}
        <Section title="Security & Authentication" icon={Shield}>
          <div className="bg-gray-50/50 border border-gray-100/50 rounded-xl p-5 mb-4 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-100/40">
              <KeyRound size={14} className="text-[#001A72]" />
              <p className="text-[10px] font-black uppercase tracking-widest text-[#001A72]">Change account password</p>
            </div>
            
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <label className={LABEL}>Current Password</label>
                <input
                  type="password"
                  name="currentPassword"
                  value={passwordForm.currentPassword}
                  onChange={handlePasswordChange}
                  className={INPUT}
                  required
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className={LABEL}>New Password</label>
                  <input
                    type="password"
                    name="newPassword"
                    value={passwordForm.newPassword}
                    onChange={handlePasswordChange}
                    className={INPUT}
                    required
                  />
                </div>
                <div>
                  <label className={LABEL}>Confirm Password</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={passwordForm.confirmPassword}
                    onChange={handlePasswordChange}
                    className={INPUT}
                    required
                  />
                </div>
              </div>
              <Button type="submit" isLoading={updatingPassword} className="gap-2 px-6 text-xs font-black uppercase tracking-widest py-3">
                <KeyRound size={13} /> Update Password
              </Button>
            </form>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-gray-50/50 border border-gray-100/50 rounded-xl gap-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-[#001A72] shrink-0 mt-0.5">
                <Smartphone size={16} />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-gray-800">Two-Factor Authentication (2FA)</p>
                <p className="text-[10px] text-gray-400 leading-normal max-w-md">
                  Keep your academic profile and credentials extra secure by setting up secondary two-factor login verification.
                </p>
              </div>
            </div>
            <button
              onClick={toggle2FA}
              className={`px-5 py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all select-none duration-300 shrink-0 ${
                settings.twoFactorEnabled
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/10'
                  : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
              }`}
            >
              {settings.twoFactorEnabled ? 'Enabled' : 'Enable 2FA'}
            </button>
          </div>
        </Section>

        {/* Danger Zone Card */}
        <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-red-50">
            <AlertTriangle size={18} className="text-red-500" />
            <h2 className="text-xs font-black text-red-600 uppercase tracking-widest">Danger Zone</h2>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <p className="text-[10px] text-gray-400 leading-relaxed max-w-md">
              Deleting your account is permanent. Doing so removes all accumulated class metrics, active referrals, lessons, and passive income balances. This action is irreversible.
            </p>
            <button
              onClick={handleDeleteAccount}
              className="shrink-0 flex items-center gap-2 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest px-5 py-3 rounded-xl hover:bg-red-700 transition shadow-sm hover:shadow-red-600/10 select-none"
            >
              <Trash2 size={13} /> Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
      <h2 className="text-xs font-black text-gray-700 uppercase tracking-widest border-b border-gray-50 pb-3 flex items-center gap-2">
        <Icon size={16} className="text-[#001A72]" /> {title}
      </h2>
      {children}
    </div>
  );
}

const LABEL = 'block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5';
const INPUT = 'w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#001A72]/20 focus:border-[#001A72] transition font-medium text-gray-700 bg-white placeholder-gray-400';
const SELECT = 'w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#001A72]/20 focus:border-[#001A72] transition bg-white font-medium text-gray-700 appearance-none shadow-sm';
