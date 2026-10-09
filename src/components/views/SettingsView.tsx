import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowUpRight, Sparkles, Banknote, Mail, Phone, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import type { User } from '../../types';
import { getAppSettings, updateAppSettings, type AppSettingKey, type AppSettings } from '../../features/settings/api';

// Settings — admin edits platform defaults (/admin/settings); a host edits
// their own (/host/settings). Each switch saves immediately — only the
// changed field is sent — and rolls back if the save fails.

interface SettingsViewProps {
  user: User;
}

type Row = { id: AppSettingKey; label: string; desc: string; hostDesc?: string; icon: typeof Mail };

const LISTING_ROWS: Row[] = [
  { id: 'earlyCheckInRequests', label: 'Early Check-in Requests', desc: 'Allow guests to request arrivals before 12 PM', icon: ArrowUpRight },
  { id: 'aiConcierge', label: 'AI Concierge', desc: 'Enable Misrah AI assistant for all properties', icon: Sparkles },
  { id: 'dynamicPricing', label: 'Dynamic Pricing', desc: 'Smart price suggestions based on local demand', icon: Banknote },
];

const NOTIFICATION_ROWS: Row[] = [
  { id: 'emailAlerts', label: 'Email Alerts', desc: 'Booking confirmations and security alerts', icon: Mail },
  { id: 'smsNotifications', label: 'SMS Notifications', desc: 'Check-in reminders and high-priority messages', icon: Phone },
  { id: 'payoutUpdates', label: 'Payout Updates', desc: "Alerts when funds are transferred to hosts' banks", hostDesc: 'Alerts when funds are transferred to your bank', icon: Banknote },
];

const errorMessage = (err: unknown, fallback: string) =>
  (err && typeof err === 'object' && typeof (err as { message?: unknown }).message === 'string' && (err as { message: string }).message) || fallback;

export const SettingsView = ({ user }: SettingsViewProps) => {
  const isAdmin = user.role === 'admin';
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [savingKey, setSavingKey] = useState<AppSettingKey | null>(null);
  const [toast, setToast] = useState<{ message: string; tone: 'success' | 'error' } | null>(null);

  const showToast = (message: string, tone: 'success' | 'error' = 'success') => {
    setToast({ message, tone });
    setTimeout(() => setToast(null), 3000);
  };

  const load = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      setSettings(await getAppSettings(user.role));
    } catch (err) {
      setLoadError(errorMessage(err, 'Failed to load settings.'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.role]);

  const toggle = async (row: Row) => {
    if (!settings || savingKey === row.id) return;
    const next = !settings[row.id];
    setSettings(prev => (prev ? { ...prev, [row.id]: next } : prev));
    setSavingKey(row.id);
    try {
      // Only the changed field is sent.
      await updateAppSettings(user.role, { [row.id]: next });
      showToast(`${row.label} ${next ? 'enabled' : 'disabled'}`);
    } catch (err) {
      setSettings(prev => (prev ? { ...prev, [row.id]: !next } : prev));
      showToast(errorMessage(err, `Failed to update ${row.label}.`), 'error');
    } finally {
      setSavingKey(current => (current === row.id ? null : current));
    }
  };

  // Plain render helpers (not nested components) so a save doesn't remount
  // every row; the knob slides with a CSS transition.
  const renderRow = (row: Row) => {
    const active = !!settings?.[row.id];
    const saving = savingKey === row.id;
    return (
      <div key={row.id} className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center text-primary shrink-0"><row.icon size={16} /></div>
          <div>
            <div className="text-[13px] font-bold">{row.label}</div>
            <div className="text-[10px] text-muted-text font-medium">{!isAdmin && row.hostDesc ? row.hostDesc : row.desc}</div>
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={active}
          aria-label={row.label}
          aria-busy={saving}
          onClick={() => toggle(row)}
          disabled={!settings || saving}
          className={`w-9 h-5 rounded-full relative transition-colors duration-300 shadow-inner shrink-0 disabled:cursor-wait
            ${active ? 'bg-success' : 'bg-border-misrah/80'} ${saving ? 'opacity-60' : ''}`}
        >
          <span
            className={`absolute top-1 left-0 w-3 h-3 bg-white rounded-full shadow-sm transition-transform duration-300 flex items-center justify-center
              ${active ? 'translate-x-[18px]' : 'translate-x-[3px]'}`}
          >
            {saving && <Loader2 size={9} className="animate-spin text-muted-text" />}
          </span>
        </button>
      </div>
    );
  };

  const renderCard = (title: string, rows: Row[]) => (
    <div className="bg-white rounded-2xl border border-border-misrah p-6 space-y-6 shadow-sm">
      <h2 className="text-lg font-bold italic mb-6">{title}</h2>
      {rows.map(renderRow)}
    </div>
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-4xl font-black italic text-primary">Settings</h1>
        <p className="text-muted-text text-sm mt-1">
          {isAdmin
            ? 'Platform-wide defaults applied to every host and property'
            : 'Configure your host preferences and application defaults'}
        </p>
      </header>

      {isLoading && !settings ? (
        <div className="bg-white rounded-2xl border border-border-misrah p-16 flex items-center justify-center gap-2 text-muted-text text-[10px] font-black uppercase tracking-widest">
          <Loader2 size={16} className="animate-spin" /> Loading settings…
        </div>
      ) : loadError && !settings ? (
        <div className="bg-danger/5 rounded-2xl border border-danger/20 p-10 text-center space-y-3">
          <AlertCircle size={24} className="mx-auto text-danger" />
          <p className="text-xs font-bold text-danger">{loadError}</p>
          <button type="button" onClick={load} className="px-5 py-2.5 rounded-xl bg-primary text-accent text-[10px] font-black uppercase tracking-widest">
            Retry
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {renderCard(isAdmin ? 'Platform Defaults' : 'Listing Defaults', LISTING_ROWS)}
          {renderCard('Notifications', NOTIFICATION_ROWS)}
        </div>
      )}

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={`fixed bottom-8 right-8 z-[60] px-5 py-3.5 rounded-2xl shadow-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2
              ${toast.tone === 'success' ? 'bg-primary text-accent' : 'bg-danger text-white'}`}
          >
            {toast.tone === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
