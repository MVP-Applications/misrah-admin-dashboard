import React, { useEffect, useState } from 'react';
import {
  ChevronRight,
  Loader2,
  MessageCircle,
  Send,
  Phone,
  Mail,
  Headphones,
  Plus,
  Trash2,
  Save,
  RefreshCw,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import {
  getHostSupportChannels,
  setHostSupportChannels,
  SUPPORT_CHANNEL_TYPES,
  type HostSupportChannel,
} from '../../../features/hostSupport/api';

// Strategic Intel Center. Admins configure the host support channels
// (POST /host/support replaces the whole list); hosts see the live list
// (GET /host/support).

interface SupportChannelsViewProps {
  isAdmin: boolean;
  onBack: () => void;
  showToast: (message: string, type?: 'success' | 'info') => void;
}

const CHANNEL_ICONS: Record<string, React.ElementType> = {
  whatsapp: MessageCircle,
  telegram: Send,
  phone: Phone,
  email: Mail,
};

const channelIcon = (c: Pick<HostSupportChannel, 'icon' | 'channel'>) =>
  CHANNEL_ICONS[(c.icon || c.channel || '').toLowerCase()] ?? Headphones;

// Suggested action URL for a contact value, per channel type.
const suggestActionUrl = (channel: string, contact: string): string => {
  const value = contact.trim();
  if (!value) return '';
  const digits = value.replace(/[^\d]/g, '');
  switch (channel) {
    case 'WHATSAPP': return digits ? `https://wa.me/${digits}` : '';
    case 'TELEGRAM': return `https://t.me/${value.replace(/^@/, '')}`;
    case 'PHONE': return digits ? `tel:+${digits}` : '';
    case 'EMAIL': return `mailto:${value}`;
    default: return '';
  }
};

const emptyChannel = (): HostSupportChannel => ({
  channel: 'WHATSAPP',
  title: '',
  displayValue: '',
  contactValue: '',
  actionLabel: '',
  actionUrl: '',
  badge: '',
  icon: 'whatsapp',
  isAvailable: true,
});

const inputClass =
  'w-full bg-[#FCFAF8] border border-border-misrah rounded-2xl px-4 py-3 text-xs font-bold text-primary focus:border-accent outline-hidden transition-all';
const labelClass = 'text-[9px] font-black text-primary/40 uppercase tracking-[2px] ml-1';

export const SupportChannelsView = ({ isAdmin, onBack, showToast }: SupportChannelsViewProps) => {
  const [channels, setChannels] = useState<HostSupportChannel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      setChannels(await getHostSupportChannels());
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load support channels.');
      setChannels([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateChannel = (index: number, patch: Partial<HostSupportChannel>) =>
    setChannels(list => list.map((c, i) => (i === index ? { ...c, ...patch } : c)));

  const moveChannel = (index: number, delta: number) =>
    setChannels(list => {
      const target = index + delta;
      if (target < 0 || target >= list.length) return list;
      const next = [...list];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });

  // POSTs the given list (the API replaces the whole set). Returns false on
  // validation/API failure so callers can roll back.
  const saveChannels = async (list: HostSupportChannel[], successMessage: string): Promise<boolean> => {
    setFormError(null);
    const missing = list.findIndex(c => !c.channel || !c.title.trim() || !c.displayValue.trim() || !c.actionLabel.trim() || !c.actionUrl.trim());
    if (missing !== -1) {
      setFormError(`Channel ${missing + 1}: type, title, display value, action label and action URL are required.`);
      return false;
    }
    setIsSaving(true);
    try {
      // Optional fields are sent only when filled in.
      const payload = list.map(c => ({
        channel: c.channel,
        title: c.title.trim(),
        displayValue: c.displayValue.trim(),
        ...(c.contactValue?.trim() ? { contactValue: c.contactValue.trim() } : {}),
        actionLabel: c.actionLabel.trim(),
        actionUrl: c.actionUrl.trim(),
        ...(c.badge?.trim() ? { badge: c.badge.trim() } : {}),
        icon: c.icon?.trim() || c.channel.toLowerCase(),
        isAvailable: c.isAvailable !== false,
      }));
      const saved = await setHostSupportChannels(payload);
      setChannels(saved.length || !payload.length ? saved : payload);
      showToast(successMessage);
      return true;
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save support channels.');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = () => saveChannels(channels, 'Host support channels configured successfully');

  // Availability switch saves immediately with the new isAvailable value
  // (rolled back if the save fails).
  const toggleAvailability = async (index: number) => {
    if (isSaving) return;
    const previous = channels;
    const isAvailable = channels[index].isAvailable === false;
    const next = channels.map((c, i) => (i === index ? { ...c, isAvailable } : c));
    setChannels(next);
    const title = next[index].title || `Channel ${index + 1}`;
    const ok = await saveChannels(next, `${title} ${isAvailable ? 'enabled' : 'disabled'}`);
    if (!ok) setChannels(previous);
  };

  const header = (
    <header className="flex items-center gap-4">
      <button
        onClick={onBack}
        className="w-10 h-10 rounded-xl bg-white border border-[#F2E8DF] flex items-center justify-center hover:bg-surface transition-all text-primary cursor-pointer active:scale-95"
        title="Back to Profile"
      >
        <ChevronRight className="rotate-180" size={20} />
      </button>
      <h1 className="text-2xl font-black italic text-primary uppercase">Strategic Intel Center</h1>
    </header>
  );

  const loadingState = (
    <div className="p-10 flex items-center justify-center gap-3 text-muted-text">
      <Loader2 size={18} className="animate-spin" />
      <span className="text-[10px] font-black uppercase tracking-widest">Loading channels...</span>
    </div>
  );

  // ---------------------------------------------------------------- Host view
  if (!isAdmin) {
    const visible = channels.filter(c => c.isAvailable !== false);
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {header}
        <div className="bg-white rounded-[40px] border border-border-misrah p-10 max-w-3xl space-y-6 shadow-sm">
          <h3 className="text-lg font-black italic text-primary uppercase">Direct Support & Intel Uplink</h3>
          <p className="text-xs text-muted-text leading-relaxed">
            Priority concierge and technical protocol assistance for verified luxury hosts and administrators.
          </p>
          {isLoading ? loadingState : loadError ? (
            <div className="p-6 rounded-3xl border border-danger/20 flex items-center justify-between gap-4">
              <p className="text-xs font-bold text-danger">{loadError}</p>
              <button type="button" onClick={load} className="px-5 py-2.5 rounded-2xl bg-primary text-accent text-[10px] font-black uppercase tracking-wider shrink-0">
                Retry
              </button>
            </div>
          ) : visible.length === 0 ? (
            <p className="text-[10px] font-black text-muted-text/60 uppercase tracking-widest text-center py-6">No support channels available</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              {visible.map((c, i) => {
                const Icon = channelIcon(c);
                return (
                  <div key={`${c.channel}-${i}`} className="p-6 rounded-3xl bg-surface/60 border border-border-misrah space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <h4 className="text-xs font-black text-primary uppercase">{c.title}</h4>
                      <Icon size={16} className="text-accent shrink-0" />
                    </div>
                    <p className="text-[10px] text-muted-text">{c.displayValue}</p>
                    <a
                      href={c.actionUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => showToast(`Opening ${c.title}...`)}
                      className="text-[9px] font-black uppercase text-accent tracking-wider hover:underline cursor-pointer inline-flex items-center gap-1"
                    >
                      <span>{c.actionLabel} →</span>
                    </a>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------- Admin view
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {header}

      <div className="bg-white rounded-[40px] border border-border-misrah p-8 sm:p-10 max-w-4xl space-y-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h3 className="text-lg font-black italic text-primary uppercase">Host Support Channels</h3>
            <p className="text-xs text-muted-text leading-relaxed mt-1">
              Configure the Direct Support & Intel Uplink channels shown to every host. Saving replaces the full list.
            </p>
          </div>
          <button
            type="button"
            onClick={load}
            disabled={isLoading || isSaving}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-border-misrah text-[10px] font-black uppercase tracking-wider text-primary hover:bg-surface disabled:opacity-50 shrink-0"
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
            Reload
          </button>
        </div>

        {loadError && (
          <p className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-[11px] font-bold text-amber-700">
            Couldn't load the current channels ({loadError}). Saving will replace whatever is configured.
          </p>
        )}

        {isLoading ? loadingState : (
          <div className="space-y-5">
            {channels.length === 0 && (
              <p className="text-[10px] font-black text-muted-text/60 uppercase tracking-widest text-center py-6">
                No channels configured yet
              </p>
            )}

            {channels.map((c, i) => {
              const Icon = channelIcon(c);
              return (
                <div key={i} className="rounded-[32px] border border-border-misrah bg-surface/30 p-6 space-y-5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-2xl bg-primary/5 border border-primary/10 text-primary flex items-center justify-center shrink-0">
                        <Icon size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[9px] font-black text-accent uppercase tracking-widest">Channel {i + 1}</p>
                        <p className="text-sm font-black italic text-primary uppercase truncate">{c.title || 'Untitled channel'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={c.isAvailable !== false}
                        title={c.isAvailable !== false ? 'Available to hosts' : 'Hidden from hosts'}
                        onClick={() => toggleAvailability(i)}
                        disabled={isSaving}
                        className={`w-12 h-6 rounded-full relative transition-all shadow-inner mr-2 disabled:opacity-60 disabled:cursor-wait ${c.isAvailable !== false ? 'bg-success' : 'bg-border-misrah'}`}
                      >
                        <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${c.isAvailable !== false ? 'left-7' : 'left-1'}`} />
                      </button>
                      <button type="button" onClick={() => moveChannel(i, -1)} disabled={i === 0} title="Move up" className="w-8 h-8 rounded-xl border border-border-misrah bg-white flex items-center justify-center text-primary disabled:opacity-30">
                        <ChevronUp size={14} />
                      </button>
                      <button type="button" onClick={() => moveChannel(i, 1)} disabled={i === channels.length - 1} title="Move down" className="w-8 h-8 rounded-xl border border-border-misrah bg-white flex items-center justify-center text-primary disabled:opacity-30">
                        <ChevronDown size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setChannels(list => list.filter((_, idx) => idx !== i))}
                        title="Remove channel"
                        className="w-8 h-8 rounded-xl border border-danger/20 bg-danger/5 flex items-center justify-center text-danger hover:bg-danger hover:text-white transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className={labelClass}>Channel Type *</label>
                      <select
                        value={c.channel}
                        onChange={e => {
                          const channel = e.target.value;
                          updateChannel(i, {
                            channel,
                            icon: channel.toLowerCase(),
                            actionUrl: suggestActionUrl(channel, c.contactValue ?? '') || c.actionUrl,
                          });
                        }}
                        className={inputClass}
                      >
                        {SUPPORT_CHANNEL_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                        {!SUPPORT_CHANNEL_TYPES.includes(c.channel as typeof SUPPORT_CHANNEL_TYPES[number]) && c.channel && (
                          <option value={c.channel}>{c.channel}</option>
                        )}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className={labelClass}>Title *</label>
                      <input className={inputClass} value={c.title} onChange={e => updateChannel(i, { title: e.target.value })} placeholder="EXECUTIVE WHATSAPP CONCIERGE" />
                    </div>
                    <div className="space-y-1.5">
                      <label className={labelClass}>Display Value *</label>
                      <input className={inputClass} value={c.displayValue} onChange={e => updateChannel(i, { displayValue: e.target.value })} placeholder="+971 4 800 MISRAH (Verified VIP Hotline)" />
                    </div>
                    <div className="space-y-1.5">
                      <label className={labelClass}>Contact Value</label>
                      <input
                        className={inputClass}
                        value={c.contactValue ?? ''}
                        onChange={e => updateChannel(i, { contactValue: e.target.value })}
                        onBlur={() => {
                          if (!c.actionUrl.trim()) updateChannel(i, { actionUrl: suggestActionUrl(c.channel, c.contactValue ?? '') });
                        }}
                        placeholder={c.channel === 'EMAIL' ? 'support@misrah.ae' : c.channel === 'TELEGRAM' ? '@MisrahEliteConcierge' : '+9714800647724'}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className={labelClass}>Action Label *</label>
                      <input className={inputClass} value={c.actionLabel} onChange={e => updateChannel(i, { actionLabel: e.target.value })} placeholder="CONNECT HOTLINE" />
                    </div>
                    <div className="space-y-1.5">
                      <label className={labelClass}>Action URL *</label>
                      <input className={inputClass} value={c.actionUrl} onChange={e => updateChannel(i, { actionUrl: e.target.value })} placeholder="https://wa.me/9714800647724" />
                    </div>
                    <div className="space-y-1.5">
                      <label className={labelClass}>Badge</label>
                      <input className={inputClass} value={c.badge ?? ''} onChange={e => updateChannel(i, { badge: e.target.value })} placeholder="Verified VIP Hotline" />
                    </div>
                    <div className="space-y-1.5">
                      <label className={labelClass}>Icon</label>
                      <input className={inputClass} value={c.icon ?? ''} onChange={e => updateChannel(i, { icon: e.target.value })} placeholder="whatsapp" />
                    </div>
                  </div>
                </div>
              );
            })}

            <button
              type="button"
              onClick={() => setChannels(list => [...list, emptyChannel()])}
              className="w-full py-4 rounded-[28px] border-2 border-dashed border-border-misrah text-[10px] font-black uppercase tracking-[2px] text-primary/60 hover:border-accent hover:text-accent transition-colors flex items-center justify-center gap-2"
            >
              <Plus size={14} />
              Add Channel
            </button>
          </div>
        )}

        {formError && (
          <p className="p-4 rounded-2xl bg-danger/5 border border-danger/20 text-[11px] font-bold text-danger">{formError}</p>
        )}

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || isLoading}
            className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-primary text-accent text-[10px] font-black uppercase tracking-[2px] shadow-xl hover:opacity-95 disabled:opacity-60"
          >
            {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {isSaving ? 'Saving...' : 'Save Channels'}
          </button>
        </div>
      </div>
    </div>
  );
};
