'use client';

import { useState, ReactElement, ChangeEvent, FormEvent } from 'react';
import { Bell, Globe, Shield, Trash2, KeyRound, Smartphone } from 'lucide-react';
import PageHeader from '@/components/PageHeader';

interface Settings {
  notifications: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  timezone: string;
  language: string;
  twoFactorEnabled: boolean;
}

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function SettingsPage(): ReactElement {
  const [settings, setSettings] = useState<Settings>({
    notifications: true,
    emailNotifications: true,
    smsNotifications: false,
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

  const toggle = (key: keyof Settings) =>
    setSettings((p) => ({ ...p, [key]: !p[key] }));

  const handleSelect = (key: keyof Settings, value: string) =>
    setSettings((p) => ({ ...p, [key]: value }));

  const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordForm((p) => ({ ...p, [name]: value }));
  };

  const handleUpdatePassword = (e: FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }
    setMessage({ type: 'success', text: 'Password updated successfully' });
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  const handleSavePreferences = () =>
    setMessage({ type: 'success', text: 'Preferences saved' });

  const handleDeleteAccount = () => {
    if (window.confirm('Are you sure you want to permanently delete your account? This cannot be undone.')) {
      setMessage({ type: 'success', text: 'Account deletion request received' });
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <PageHeader title="Settings" subtitle="Manage your preferences, security, and account" />

      {/* Alert */}
      {message.text && (
        <div className={`p-4 rounded-xl text-sm font-medium border ${
          message.type === 'success'
            ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
            : 'bg-red-50 text-red-700 border-red-100'
        }`}>
          {message.text}
        </div>
      )}

      {/* Notifications */}
      <Section title="Notifications" icon={Bell}>
        <div className="space-y-2">
          <Toggle
            label="All Notifications"
            sub="Master switch for all alerts"
            active={settings.notifications}
            onClick={() => toggle('notifications')}
          />
          <Toggle
            label="Email Notifications"
            sub="Receive updates and reports via email"
            active={settings.emailNotifications}
            onClick={() => toggle('emailNotifications')}
          />
          <Toggle
            label="SMS Notifications"
            sub="Critical real-time updates via SMS"
            active={settings.smsNotifications}
            onClick={() => toggle('smsNotifications')}
          />
        </div>
      </Section>

      {/* Localization */}
      <Section title="Language & Region" icon={Globe}>
        <div className="grid sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className={LABEL}>Timezone</label>
            <select
              value={settings.timezone}
              onChange={(e) => handleSelect('timezone', e.target.value)}
              className={SELECT}
            >
              <option value="Africa/Lagos">West Africa Time (WAT)</option>
              <option value="Africa/Johannesburg">South Africa Time (SAST)</option>
              <option value="UTC">Universal Time (UTC)</option>
              <option value="Europe/London">Greenwich Mean Time (GMT)</option>
            </select>
          </div>
          <div>
            <label className={LABEL}>Language</label>
            <select
              value={settings.language}
              onChange={(e) => handleSelect('language', e.target.value)}
              className={SELECT}
            >
              <option value="English">English</option>
              <option value="Yoruba">Èdè Yorùbá</option>
              <option value="Igbo">Asụsụ Igbo</option>
              <option value="French">Français</option>
            </select>
          </div>
        </div>
        <button onClick={handleSavePreferences} className={BTN_PRIMARY}>
          Save Preferences
        </button>
      </Section>

      {/* Security */}
      <Section title="Security" icon={Shield}>
        {/* Password */}
        <div className="bg-gray-50 rounded-xl p-5 mb-4">
          <p className={LABEL + ' mb-4'}>Change Password</p>
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
            <button type="submit" className={BTN_PRIMARY}>
              <KeyRound size={14} /> Update Password
            </button>
          </form>
        </div>

        {/* 2FA */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
          <div className="flex items-center gap-3">
            <Smartphone size={16} className="text-[#001A72]" />
            <div>
              <p className="text-xs font-black text-[#001A72]">Two-Factor Authentication</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Add an extra layer of security to your account</p>
            </div>
          </div>
          <button
            onClick={() => toggle('twoFactorEnabled')}
            className={`px-4 py-2 rounded-xl font-bold text-[10px] uppercase tracking-widest transition ${
              settings.twoFactorEnabled
                ? 'bg-emerald-500 text-white'
                : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
            }`}
          >
            {settings.twoFactorEnabled ? 'Enabled' : 'Enable'}
          </button>
        </div>
      </Section>

      {/* Danger Zone */}
      <div className="bg-white rounded-2xl border-2 border-red-100 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Trash2 size={14} className="text-red-500" />
          <h2 className="text-sm font-black text-red-600 uppercase tracking-widest">Danger Zone</h2>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-xs text-gray-500 max-w-sm">
            Deleting your account will permanently remove all your data, earnings history, and access from EduWins.
          </p>
          <button
            onClick={handleDeleteAccount}
            className="shrink-0 flex items-center gap-2 bg-red-600 text-white text-xs font-bold px-5 py-2.5 rounded-xl hover:bg-red-700 transition"
          >
            <Trash2 size={13} /> Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Sub-components ───────────────────────── */

function Section({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-5 flex items-center gap-2">
        <Icon size={14} className="text-[#001A72]" /> {title}
      </h2>
      {children}
    </div>
  );
}

function Toggle({ label, sub, active, onClick }: { label: string; sub: string; active: boolean; onClick: () => void }) {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition">
      <div>
        <p className="text-xs font-bold text-gray-800">{label}</p>
        <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>
      </div>
      <button
        onClick={onClick}
        className={`w-12 h-6 rounded-full relative transition-colors duration-300 ${active ? 'bg-[#FFB81C]' : 'bg-gray-200'}`}
      >
        <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-300 ${active ? 'translate-x-6' : 'translate-x-0.5'}`} />
      </button>
    </div>
  );
}

const LABEL = 'block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5';
const INPUT = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#001A72]/20 focus:border-[#001A72] transition bg-white';
const SELECT = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#001A72]/20 focus:border-[#001A72] transition bg-white font-medium text-gray-800';
const BTN_PRIMARY = 'flex items-center gap-2 bg-[#001A72] text-white text-xs font-bold px-5 py-2.5 rounded-xl hover:bg-[#001A72]/90 transition';
