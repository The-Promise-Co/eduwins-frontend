'use client';

import { useState, ReactElement } from 'react';
import { Bell, Mail, Smartphone, Check, Clock, MessageSquare, Calendar } from 'lucide-react';
import Button from '@/misc/components/Button';
import PageHeader from '@/misc/components/PageHeader';

interface NotificationsSettings {
  notifications: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  sessionReminders: boolean;
  chatMessages: boolean;
}

export default function NotificationsSettingsPage(): ReactElement {
  const [settings, setSettings] = useState<NotificationsSettings>({
    notifications: true,
    emailNotifications: true,
    smsNotifications: false,
    sessionReminders: true,
    chatMessages: true,
  });

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');

  const toggle = (key: keyof NotificationsSettings) => {
    setSettings((p) => ({ ...p, [key]: !p[key] }));
  };

  const handleSave = async () => {
    setSaving(true);
    setSuccess('');
    try {
      // Simulate API call saving preferences
      await new Promise((resolve) => setTimeout(resolve, 800));
      setSuccess('Notification preferences saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-12">
      <PageHeader
        title="Notifications"
        subtitle="Choose how and when you want to receive platform updates, lesson reminders, and student alerts"
      />

      {/* Dynamic Success Alert */}
      {success && (
        <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-3 animate-in fade-in slide-in-from-top-2 transition-all">
          <div className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
            <span className="font-bold">✓</span>
          </div>
          {success}
        </div>
      )}

      {/* Preferences Container */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden p-6 space-y-6">
        <div className="flex items-center gap-2 pb-3 border-b border-gray-50">
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-[#001A72]">
            <Bell size={16} />
          </div>
          <div>
            <h2 className="text-xs font-black text-gray-700 uppercase tracking-widest">Notification Rules</h2>
            <p className="text-[10px] text-gray-400 mt-0.5 leading-normal">
              Manage master alerts, email reports, and SMS time-sensitive notifications.
            </p>
          </div>
        </div>

        <div className="divide-y divide-gray-50">
          <Toggle
            label="Master Push Notifications"
            sub="Master switch for all platform and browser push notification alerts"
            active={settings.notifications}
            onClick={() => toggle('notifications')}
            icon={<Bell size={16} className="text-[#001A72]" />}
          />
          <Toggle
            label="Email Notifications"
            sub="Receive weekly performance updates, passive earnings reports, and student alerts via email"
            active={settings.emailNotifications}
            onClick={() => toggle('emailNotifications')}
            icon={<Mail size={16} className="text-gray-400" />}
          />
          <Toggle
            label="SMS Notifications"
            sub="Receive critical time-sensitive reminders and balance withdrawals notifications via SMS"
            active={settings.smsNotifications}
            onClick={() => toggle('smsNotifications')}
            icon={<Smartphone size={16} className="text-gray-400" />}
          />
          <Toggle
            label="Upcoming Session Reminders"
            sub="Reminders sent 15 minutes and 1 hour before scheduled class sessions start"
            active={settings.sessionReminders}
            onClick={() => toggle('sessionReminders')}
            icon={<Calendar size={16} className="text-gray-400" />}
          />
          <Toggle
            label="Instant Chat Messages"
            sub="Get notified immediately in-app when a student or parent sends you an inbox message"
            active={settings.chatMessages}
            onClick={() => toggle('chatMessages')}
            icon={<MessageSquare size={16} className="text-gray-400" />}
          />
        </div>

        <div className="pt-6 border-t border-gray-100 flex justify-end">
          <Button
            onClick={handleSave}
            isLoading={saving}
            loadingText="Saving preferences..."
            variant="primary"
            className="px-8 py-3.5 text-xs font-black uppercase tracking-wider"
          >
            Save Preferences
          </Button>
        </div>
      </div>
    </div>
  );
}

interface ToggleProps {
  label: string;
  sub: string;
  active: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
}

function Toggle({ label, sub, active, onClick, icon }: ToggleProps) {
  return (
    <div className="flex items-center justify-between py-4 transition-all duration-300">
      <div className="flex items-start gap-3">
        {icon && <div className="mt-0.5 shrink-0">{icon}</div>}
        <div className="space-y-0.5">
          <p className="text-xs font-bold text-gray-800">{label}</p>
          <p className="text-[10px] text-gray-400 leading-normal max-w-lg">{sub}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onClick}
        className={`w-11 h-6 rounded-full relative transition-colors duration-300 shrink-0 select-none ${active ? 'bg-[#FFB81C]' : 'bg-gray-200 hover:bg-gray-300'
          }`}
      >
        <div
          className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-300 ${active ? 'translate-x-5' : 'translate-x-0.5'
            }`}
        />
      </button>
    </div>
  );
}
