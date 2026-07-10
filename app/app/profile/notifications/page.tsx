'use client';

import { ReactElement } from 'react';
import { Bell, Check, Clock, Loader2 } from 'lucide-react';
import Button from '@/misc/components/Button';
import PageHeader from '@/misc/components/PageHeader';
import { AppNotification, useMarkNotificationRead, useNotifications } from '@/misc/hooks/api/notifications';

const formatDate = (value?: string) => {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export default function NotificationsSettingsPage(): ReactElement {
  const notificationsQuery = useNotifications();
  const markRead = useMarkNotificationRead();
  const notifications = notificationsQuery.data?.notifications || [];

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-12">
      <PageHeader
        title="Notifications"
        subtitle="Review platform updates, booking requests, payment notices, and lesson alerts."
      />

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden p-6 space-y-6">
        <div className="flex items-center gap-2 pb-3 border-b border-gray-50">
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-[#001A72]">
            <Bell size={16} />
          </div>
          <div>
            <h2 className="text-xs font-black text-gray-700 uppercase tracking-widest">Recent Notifications</h2>
            <p className="text-[10px] text-gray-400 mt-0.5 leading-normal">
              {notificationsQuery.data?.unreadCount || 0} unread notification{notificationsQuery.data?.unreadCount === 1 ? '' : 's'}.
            </p>
          </div>
        </div>

        {notificationsQuery.isLoading ? (
          <div className="py-12 flex items-center justify-center text-gray-400 text-sm">
            <Loader2 size={18} className="animate-spin mr-2" /> Loading notifications...
          </div>
        ) : notificationsQuery.isError ? (
          <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-xs font-bold text-red-600">Could not load notifications.</div>
        ) : notifications.length === 0 ? (
          <div className="py-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-gray-50 text-gray-400 flex items-center justify-center mx-auto mb-3">
              <Bell size={22} />
            </div>
            <p className="text-sm font-bold text-gray-800">No notifications yet</p>
            <p className="text-xs text-gray-400 mt-1">New updates will appear here.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {notifications.map((notification: AppNotification) => (
              <div key={notification.id} className="py-4 flex items-start gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${notification.read ? 'bg-gray-50 text-gray-400' : 'bg-amber-50 text-[#FFB81C]'}`}>
                  {notification.read ? <Check size={16} /> : <Bell size={16} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-black text-gray-900">{notification.title || 'Notification'}</h3>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">{notification.message}</p>
                    </div>
                    {!notification.read && (
                      <Button fullWidth={false} variant="ghost" onClick={() => markRead.mutate(notification.id)} disabled={markRead.isPending} className="px-3 py-2 text-[10px] font-black uppercase tracking-wider">
                        Mark read
                      </Button>
                    )}
                  </div>
                  {notification.createdAt && (
                    <p className="text-[10px] text-gray-400 mt-2 flex items-center gap-1">
                      <Clock size={12} /> {formatDate(notification.createdAt)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
