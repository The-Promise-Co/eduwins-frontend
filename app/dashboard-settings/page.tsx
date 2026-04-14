'use client';

import { useState, useEffect, ReactElement, ChangeEvent, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import DashboardNavigation from '../../components/DashboardNavigation';
import { User } from '@/src/types';

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

interface Message {
  type: 'success' | 'error' | '';
  text: string;
}

export default function SettingsPage(): ReactElement {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
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
  const [message, setMessage] = useState<Message>({ type: '', text: '' });

  useEffect(() => {
    const init = async () => {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        const userJson = localStorage.getItem('user');

        if (!token || !userJson) {
          router.push('/login');
          return;
        }

        try {
          const userData = JSON.parse(userJson);
          setUser(userData);
        } catch (err) {
          console.error('Error parsing user data:', err);
          router.push('/login');
        } finally {
          setLoading(false);
        }
      }
    };

    init();
  }, [router]);

  const handleSettingChange = (key: keyof Settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSelectChange = (key: keyof Settings, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({ ...prev, [name]: value }));
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
    setMessage({ type: 'success', text: 'Security credentials updated successfully' });
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  const handleSaveSettings = () => {
    setMessage({ type: 'success', text: 'System preferences saved' });
  };

  const handleDeleteAccount = () => {
    if (typeof window !== 'undefined' && window.confirm('CRITICAL: Are you sure you want to delete your account? This action cannot be undone.')) {
      setMessage({ type: 'success', text: 'Decommissioning request received' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#001A72] mx-auto mb-4"></div>
          <p className="text-gray-600 font-black">Loading preferences...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNavigation user={user} />
      <div className="py-12 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-4xl font-black text-[#001A72] mb-1 flex items-center gap-4">
               <span>⚙️</span> System Settings
            </h1>
            <p className="text-gray-500 font-medium">Fine-tune your EduWins experience and security parameters.</p>
          </div>

          {message.text && (
            <div className={`mb-10 p-5 rounded-2xl border-2 animate-in fade-in duration-500 shadow-sm ${
              message.type === 'success'
                ? 'bg-green-50 text-green-700 border-green-100'
                : 'bg-red-50 text-red-700 border-red-100'
            }`}>
              <p className="font-black flex items-center gap-3">
                {message.type === 'success' ? '✅' : '⚠️'} {message.text}
              </p>
            </div>
          )}

          <div className="space-y-10">
            {/* Notification Control */}
            <section className="bg-white rounded-[2.5rem] shadow-xl p-10 border border-gray-100">
               <h2 className="text-xl font-black text-[#001A72] mb-8 flex items-center gap-3">
                  <span>🔔</span> Alert Synchronization
               </h2>
               <div className="space-y-4">
                 <SettingToggle 
                   label="Master Notifications" 
                   sub="Enable/disable all system alerts" 
                   active={settings.notifications} 
                   onClick={() => handleSettingChange('notifications')} 
                 />
                 <SettingToggle 
                   label="Email Dispatches" 
                   sub="Receive detailed reports via email" 
                   active={settings.emailNotifications} 
                   onClick={() => handleSettingChange('emailNotifications')} 
                 />
                 <SettingToggle 
                   label="Direct SMS" 
                   sub="Critical real-time updates via mobile" 
                   active={settings.smsNotifications} 
                   onClick={() => handleSettingChange('smsNotifications')} 
                 />
               </div>
            </section>

            {/* Regional & Language */}
            <section className="bg-white rounded-[2.5rem] shadow-xl p-10 border border-gray-100">
               <h2 className="text-xl font-black text-[#001A72] mb-8 flex items-center gap-3">
                  <span>🌍</span> Localization
               </h2>
               <div className="grid md:grid-cols-2 gap-8 mb-8">
                  <div className="flex flex-col">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Temporal Zone (Timezone)</label>
                    <select
                      value={settings.timezone}
                      onChange={(e) => handleSelectChange('timezone', e.target.value)}
                      className="bg-gray-50 border-2 border-gray-50 rounded-2xl p-4 focus:outline-none focus:border-[#FFB81C] font-black text-[#001A72] transition"
                    >
                      <option value="Africa/Lagos">West Africa Time (WAT)</option>
                      <option value="Africa/Johannesburg">South Africa Time (SAST)</option>
                      <option value="UTC">Universal Time (UTC)</option>
                      <option value="Europe/London">Greenwich Mean Time (GMT)</option>
                    </select>
                  </div>
                  <div className="flex flex-col">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Interface Dialect (Language)</label>
                    <select
                      value={settings.language}
                      onChange={(e) => handleSelectChange('language', e.target.value)}
                      className="bg-gray-50 border-2 border-gray-50 rounded-2xl p-4 focus:outline-none focus:border-[#FFB81C] font-black text-[#001A72] transition"
                    >
                      <option value="English">English (Global)</option>
                      <option value="Yoruba">Èdè Yorùbá</option>
                      <option value="Igbo">Asụsụ Igbo</option>
                      <option value="French">Français</option>
                    </select>
                  </div>
               </div>
               <button
                 onClick={handleSaveSettings}
                 className="bg-[#001A72] text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#1a2d5e] transition shadow-lg shadow-blue-100"
               >
                 Confirm Preferences
               </button>
            </section>

            {/* Security Protocol */}
            <section className="bg-white rounded-[2.5rem] shadow-xl p-10 border border-gray-100">
               <h2 className="text-xl font-black text-[#001A72] mb-8 flex items-center gap-3">
                  <span>🛡️</span> Security Matrix
               </h2>
               
               <div className="bg-[#001A72]/5 border-2 border-[#001A72]/5 rounded-[2rem] p-8 mb-10">
                  <h3 className="font-black text-[#001A72] mb-6 uppercase tracking-widest text-xs border-b border-[#001A72]/10 pb-4">Rotate Password</h3>
                  <form onSubmit={handleUpdatePassword} className="space-y-6">
                    <div className="flex flex-col">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Authenticating Password</label>
                      <input
                        type="password"
                        name="currentPassword"
                        value={passwordForm.currentPassword}
                        onChange={handlePasswordChange}
                        className="bg-white border-2 border-white rounded-2xl p-4 focus:outline-none focus:border-[#FFB81C] font-medium"
                        required
                      />
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="flex flex-col">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">New Signature</label>
                        <input
                          type="password"
                          name="newPassword"
                          value={passwordForm.newPassword}
                          onChange={handlePasswordChange}
                          className="bg-white border-2 border-white rounded-2xl p-4 focus:outline-none focus:border-[#FFB81C] font-medium"
                          required
                        />
                      </div>
                      <div className="flex flex-col">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Confirm Signature</label>
                        <input
                          type="password"
                          name="confirmPassword"
                          value={passwordForm.confirmPassword}
                          onChange={handlePasswordChange}
                          className="bg-white border-2 border-white rounded-2xl p-4 focus:outline-none focus:border-[#FFB81C] font-medium"
                          required
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-[#001A72] text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#1a2d5e] transition"
                    >
                      Re-encrypt Credentials
                    </button>
                  </form>
               </div>

               <div className="flex flex-col md:flex-row items-center justify-between p-6 bg-gray-50 rounded-2xl border-2 border-gray-50">
                 <div className="text-center md:text-left mb-4 md:mb-0">
                   <p className="font-black text-[#001A72] uppercase tracking-widest text-xs mb-1">Two-Factor Authentication (2FA)</p>
                   <p className="text-sm font-medium text-gray-400">High-security verification for all logins</p>
                 </div>
                 <button
                   onClick={() => handleSettingChange('twoFactorEnabled')}
                   className={`px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition shadow-lg ${
                     settings.twoFactorEnabled
                       ? 'bg-green-500 text-white shadow-green-100'
                       : 'bg-gray-200 text-gray-400 shadow-none'
                   }`}
                 >
                   {settings.twoFactorEnabled ? 'Active' : 'Enable 2FA'}
                 </button>
               </div>
            </section>

            {/* Account Termination */}
            <section className="bg-white rounded-[2.5rem] shadow-xl p-10 border border-gray-100 overflow-hidden relative">
               <h2 className="text-xl font-black text-red-600 mb-6 flex items-center gap-3 relative z-10">
                  <span>⚡</span> Danger Zone
               </h2>
               <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                  <p className="text-gray-500 font-medium text-center md:text-left max-w-md">
                    Proceeding with account deletion will purge all associated records, earnings history, and access keys from the EduWins infrastructure.
                  </p>
                  <button
                    onClick={handleDeleteAccount}
                    className="px-10 py-4 bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-700 transition shadow-xl shadow-red-100"
                  >
                    Delete Account Permanently
                  </button>
               </div>
               <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 rounded-bl-[4rem]"></div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

interface SettingToggleProps {
  label: string;
  sub: string;
  active: boolean;
  onClick: () => void;
}

function SettingToggle({ label, sub, active, onClick }: SettingToggleProps): ReactElement {
  return (
    <div className="flex items-center justify-between p-6 bg-gray-50/50 rounded-2xl border-2 border-transparent hover:border-gray-100 transition">
      <div>
        <p className="font-black text-[#001A72] text-sm mb-0.5">{label}</p>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{sub}</p>
      </div>
      <button
        onClick={onClick}
        className={`w-14 h-8 rounded-full transition-colors duration-300 relative ${
          active ? 'bg-[#FFB81C]' : 'bg-gray-200'
        }`}
      >
        <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-sm transition-transform duration-300 ${
          active ? 'translate-x-7' : 'translate-x-1'
        }`} />
      </button>
    </div>
  );
}
