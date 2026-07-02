/**
 * ReminderSettings — Profile card to manage local habit reminders.
 * Requests the Notification permission and shows the current status, plus a
 * count of habits with reminders enabled. Per-habit toggles live in the
 * habit detail sheet (Rituales → tap a habit).
 */

import { useState } from 'react';
import { Bell, BellOff, BellRing, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import { NotificationsService } from '@/services/notifications.service';
import { useHabits } from '@/store';
import { useLocale } from '@/hooks/useLocale';
import { cn } from '@/utils/cn';

export function ReminderSettings() {
  const { t } = useLocale();
  const { habits } = useHabits();
  const [permission, setPermission] = useState(NotificationsService.getPermission());

  const remindersOn = habits.filter((h) => h.reminderEnabled).length;

  const handleEnable = async (): Promise<void> => {
    const result = await NotificationsService.requestPermission();
    setPermission(result);
    if (result === 'granted') {
      toast.success(t('reminders.granted'));
      NotificationsService.show(
        t('reminders.notificationTitle'),
        t('reminders.testBody')
      );
    } else if (result === 'denied') {
      toast.error(t('reminders.denied'));
    }
  };

  const statusMeta = {
    granted: { icon: BellRing, text: t('reminders.statusGranted'), tone: 'text-success-400 bg-success-500/15' },
    denied: { icon: BellOff, text: t('reminders.statusDenied'), tone: 'text-red-400 bg-red-500/15' },
    default: { icon: Bell, text: t('reminders.statusDefault'), tone: 'text-white/60 bg-white/10' },
    unsupported: { icon: BellOff, text: t('reminders.statusUnsupported'), tone: 'text-white/40 bg-white/10' },
  }[permission] ?? { icon: Bell, text: t('reminders.statusDefault'), tone: 'text-white/60 bg-white/10' };

  const StatusIcon = statusMeta.icon;

  return (
    <section className="glass-card rounded-2xl p-5 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <Bell size={18} className="text-gold-400" />
        <h3 className="text-lg font-bold text-white">{t('reminders.title')}</h3>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <span className={cn('shrink-0 w-11 h-11 rounded-full flex items-center justify-center', statusMeta.tone)}>
          <StatusIcon size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-white font-semibold text-sm">{statusMeta.text}</p>
          <p className="text-white/55 text-xs mt-0.5">
            {t('reminders.habitsWithReminder', { count: remindersOn })}
          </p>
        </div>
        {permission === 'default' && (
          <button
            type="button"
            onClick={handleEnable}
            className="shrink-0 px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-600 text-white text-sm font-semibold transition-colors"
          >
            {t('reminders.enable')}
          </button>
        )}
      </div>

      <p className="flex items-start gap-2 text-xs text-white/50 leading-relaxed">
        <Info size={14} className="shrink-0 mt-0.5" />
        {t('reminders.limitationsHint')}
      </p>
    </section>
  );
}

export default ReminderSettings;
