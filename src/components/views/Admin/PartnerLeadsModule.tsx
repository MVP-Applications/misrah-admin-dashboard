import React, { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import {
  Search,
  Loader2,
  TriangleAlert,
  Handshake,
  ChevronLeft,
  ChevronRight,
  X,
  Phone,
  Mail,
  MessageCircle,
  Trash2,
  Save,
  CheckCircle2,
  Home,
  Compass,
  UtensilsCrossed,
  ExternalLink,
  Download,
  BadgeCheck,
} from 'lucide-react';
import { errorMessage } from '../../../api/errors';
import {
  deletePartnerLead,
  downloadPartnerLeadsExcel,
  listPartnerLeads,
  updatePartnerLeadStatus,
  type PartnerLead,
  type PartnerLeadStatus,
} from '../../../features/partnerLeads/api';
import { LoadingSpinner } from '../../ui/LoadingSpinner';

// Admin → Partner Requests: leads from the public /partners form.
//   GET /admin/partner-leads?page&limit&status&search&offering&city
// Review a lead, move it through the pipeline (PATCH …/status with notes),
// or delete it.

const PAGE_SIZE = 20;

const STATUSES: { id: PartnerLeadStatus; label: string; className: string }[] = [
  { id: 'PENDING', label: 'Pending', className: 'bg-accent/15 text-accent' },
  { id: 'CONTACTED', label: 'Contacted', className: 'bg-info/10 text-info' },
  { id: 'QUALIFIED', label: 'Qualified', className: 'bg-primary/10 text-primary' },
  { id: 'ONBOARDED', label: 'Onboarded', className: 'bg-success/10 text-success' },
  { id: 'REJECTED', label: 'Rejected', className: 'bg-danger/10 text-danger' },
];
const statusMeta = (s: string) => STATUSES.find(x => x.id === s) ?? STATUSES[0];

const OFFERINGS: { id: string; label: string; icon: typeof Home }[] = [
  { id: 'STAYS', label: 'Stays', icon: Home },
  { id: 'EXPERIENCES', label: 'Experiences', icon: Compass },
  { id: 'CATERING', label: 'Catering', icon: UtensilsCrossed },
];

const CITIES = ['ABU DHABI', 'DUBAI', 'SHARJAH', 'AJMAN', 'UMM AL QUWAIN', 'RAS AL KHAIMAH', 'FUJAIRAH'];

// "ABU DHABI" → "Abu Dhabi", "1-3 MONTHS" → "1-3 Months", brand names kept.
const BRANDS: Record<string, string> = { WHATSAPP: 'WhatsApp', INSTAGRAM: 'Instagram', TIKTOK: 'TikTok' };
const pretty = (v?: string | null) =>
  BRANDS[(v ?? '').toUpperCase()] ??
  (v ?? '').toLowerCase().replace(/(^|[\s_-])\w/g, m => m.toUpperCase()).replace(/_/g, ' ');

const fullPhone = (l: PartnerLead) => `${l.countryCode || '+971'} ${l.phoneNumber}`.trim();
const phoneDigits = (l: PartnerLead) => `${l.countryCode || '+971'}${l.phoneNumber}`.replace(/[^\d]/g, '');

const shortDate = (iso?: string) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : format(d, 'd MMM yyyy');
};

// Profile link for a social handle (website handles are URLs already).
const socialUrl = (platform: string, handle: string) => {
  const h = handle.replace(/^@/, '');
  switch (platform.toLowerCase()) {
    case 'instagram': return `https://instagram.com/${h}`;
    case 'tiktok': return `https://tiktok.com/@${h}`;
    case 'facebook': return `https://facebook.com/${h}`;
    case 'x': return `https://x.com/${h}`;
    case 'snapchat': return `https://snapchat.com/add/${h}`;
    case 'youtube': return `https://youtube.com/@${h}`;
    case 'linkedin': return `https://linkedin.com/company/${h}`;
    default: return /^https?:\/\//.test(handle) ? handle : `https://${handle}`;
  }
};

export const PartnerLeadsModule = () => {
  const [status, setStatus] = useState<PartnerLeadStatus | 'ALL'>('ALL');
  const [offering, setOffering] = useState('');
  const [city, setCity] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [leads, setLeads] = useState<PartnerLead[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Detail drawer
  const [selected, setSelected] = useState<PartnerLead | null>(null);
  const [draftStatus, setDraftStatus] = useState<PartnerLeadStatus>('PENDING');
  const [draftNotes, setDraftNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [drawerError, setDrawerError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    const handle = setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => clearTimeout(handle);
  }, [searchInput]);

  useEffect(() => { setPage(1); }, [status, offering, city, search]);

  const load = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const res = await listPartnerLeads({
        page,
        limit: PAGE_SIZE,
        ...(status !== 'ALL' ? { status } : {}),
        ...(search ? { search } : {}),
        ...(offering ? { offering } : {}),
        ...(city ? { city } : {}),
      });
      setLeads(res.items);
      setTotal(res.total);
      setTotalPages(Math.max(1, res.totalPages));
    } catch (err) {
      setLeads([]);
      setLoadError(errorMessage(err, 'Failed to load partner requests.'));
    } finally {
      setIsLoading(false);
    }
  }, [page, status, search, offering, city]);

  useEffect(() => { load(); }, [load]);

  const hasFilters = status !== 'ALL' || !!offering || !!city || !!search;

  // Excel export of everything matching the current filters.
  const handleDownload = async () => {
    setIsDownloading(true);
    setDownloadError(null);
    try {
      await downloadPartnerLeadsExcel(
        {
          ...(status !== 'ALL' ? { status } : {}),
          ...(search ? { search } : {}),
          ...(offering ? { offering } : {}),
          ...(city ? { city } : {}),
        },
        total,
      );
      showToast('Partner requests downloaded');
    } catch (err) {
      setDownloadError(errorMessage(err, 'Failed to download partner requests.'));
    } finally {
      setIsDownloading(false);
    }
  };
  const clearFilters = () => {
    setStatus('ALL');
    setOffering('');
    setCity('');
    setSearchInput('');
  };

  const openLead = (lead: PartnerLead) => {
    setSelected(lead);
    setDraftStatus(lead.status);
    setDraftNotes(lead.adminNotes ?? '');
    setDrawerError(null);
  };

  const saveStatus = async () => {
    if (!selected) return;
    setIsSaving(true);
    setDrawerError(null);
    try {
      await updatePartnerLeadStatus(selected._id, {
        status: draftStatus,
        ...(draftNotes.trim() !== (selected.adminNotes ?? '') ? { adminNotes: draftNotes.trim() } : {}),
      });
      const updated = { ...selected, status: draftStatus, adminNotes: draftNotes.trim() || null };
      setSelected(updated);
      setLeads(list => list.map(l => (l._id === updated._id ? updated : l)));
      showToast(`${selected.businessName || selected.fullName} marked ${statusMeta(draftStatus).label}`);
      // A status filter may no longer match — refresh in the background.
      if (status !== 'ALL' && draftStatus !== status) load();
    } catch (err) {
      setDrawerError(errorMessage(err, 'Failed to update the request.'));
    } finally {
      setIsSaving(false);
    }
  };

  const removeLead = async () => {
    if (!selected || !window.confirm(`Delete the request from ${selected.businessName || selected.fullName}? This can't be undone.`)) return;
    setIsDeleting(true);
    setDrawerError(null);
    try {
      await deletePartnerLead(selected._id);
      showToast('Partner request deleted');
      setSelected(null);
      if (leads.length === 1 && page > 1) setPage(p => p - 1);
      else await load();
    } catch (err) {
      setDrawerError(errorMessage(err, 'Failed to delete the request.'));
    } finally {
      setIsDeleting(false);
    }
  };

  const selectClass = 'py-3 px-4 bg-surface border border-border-misrah rounded-2xl text-xs font-bold text-primary outline-none focus:border-accent cursor-pointer';

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="px-3 py-0.5 rounded-full bg-accent/20 text-accent text-[10px] font-black uppercase tracking-wider">Onboarding</span>
          <span className="text-xs font-bold text-muted-text">طلبات الشركاء</span>
        </div>
        <h1 className="text-4xl font-sans font-black italic text-primary uppercase tracking-tight leading-none">Partner Requests</h1>
        <p className="text-muted-text text-[10px] font-black uppercase tracking-[3px] mt-2 opacity-60">
          {isLoading ? 'Loading…' : `${total.toLocaleString()} ${hasFilters ? 'matching' : ''} request${total === 1 ? '' : 's'} from the partner onboarding page`}
        </p>
        </div>
        <button
          type="button"
          onClick={handleDownload}
          disabled={isDownloading || isLoading || total === 0}
          title={hasFilters ? 'Download the requests matching the current filters (.xlsx)' : 'Download all partner requests (.xlsx)'}
          className="flex items-center gap-2 px-7 py-4 rounded-2xl border border-border-misrah bg-white text-[10px] font-black uppercase tracking-[3px] text-primary hover:border-accent hover:shadow-lg transition-all shadow-sm self-start md:self-auto disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isDownloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
          {isDownloading ? 'Preparing…' : hasFilters ? 'Download Filtered' : 'Download Excel'}
        </button>
      </header>
      {downloadError && (
        <div className="p-4 rounded-2xl bg-danger/5 border border-danger/20 flex items-center justify-between gap-3">
          <p className="text-[11px] font-bold text-danger">{downloadError}</p>
          <button type="button" onClick={() => setDownloadError(null)} className="text-[10px] font-black uppercase tracking-wider text-danger/70 hover:text-danger">Dismiss</button>
        </div>
      )}

      {/* Status tabs */}
      <div className="bg-white border border-border-misrah rounded-2xl p-1.5 shadow-sm flex overflow-x-auto w-full md:w-fit">
        {([{ id: 'ALL', label: 'All' }, ...STATUSES] as { id: PartnerLeadStatus | 'ALL'; label: string }[]).map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setStatus(t.id)}
            className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap
              ${status === t.id ? 'bg-primary text-accent shadow-lg shadow-primary/20' : 'text-muted-text/50 hover:text-primary'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Search & filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1 md:max-w-md">
          <Search size={14} className="absolute left-4 rtl:left-auto rtl:right-4 top-1/2 -translate-y-1/2 text-muted-text/50" />
          <input
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Search name, business, email or phone..."
            className="w-full bg-surface border border-border-misrah rounded-2xl pl-10 pr-10 py-3 text-xs font-bold text-primary outline-none focus:border-accent"
          />
          {searchInput && (
            <button type="button" onClick={() => setSearchInput('')} className="absolute right-3 rtl:right-auto rtl:left-3 top-1/2 -translate-y-1/2 text-muted-text/60 hover:text-primary"><X size={14} /></button>
          )}
        </div>
        <select value={offering} onChange={e => setOffering(e.target.value)} className={selectClass}>
          <option value="">All offerings</option>
          {OFFERINGS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
        </select>
        <select value={city} onChange={e => setCity(e.target.value)} className={selectClass}>
          <option value="">All cities</option>
          {CITIES.map(c => <option key={c} value={c}>{pretty(c)}</option>)}
        </select>
        {hasFilters && (
          <button type="button" onClick={clearFilters} className="px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-wider text-accent hover:underline">
            Clear
          </button>
        )}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="bg-white rounded-[48px] border border-border-misrah p-24 text-center shadow-sm">
          <LoadingSpinner className="mx-auto" />
        </div>
      ) : loadError ? (
        <div className="bg-danger/5 rounded-[48px] border border-danger/20 p-16 text-center shadow-sm space-y-4">
          <TriangleAlert size={36} className="mx-auto text-danger" />
          <p className="text-[10px] font-bold text-danger/70 uppercase tracking-widest">{loadError}</p>
          <button type="button" onClick={load} className="px-6 py-3 rounded-2xl bg-primary text-accent text-[10px] font-black uppercase tracking-[2px]">Retry</button>
        </div>
      ) : leads.length === 0 ? (
        <div className="bg-white rounded-[48px] border border-border-misrah p-24 text-center shadow-sm space-y-3">
          <Handshake size={36} className="mx-auto text-muted-text/30" />
          <p className="text-xs font-bold text-muted-text/60 uppercase tracking-widest">
            {hasFilters ? 'No requests match these filters.' : 'No partner requests yet.'}
          </p>
          {hasFilters && <button type="button" onClick={clearFilters} className="text-[10px] font-black uppercase tracking-wider text-accent hover:underline">Clear filters</button>}
        </div>
      ) : (
        <div className="bg-white rounded-[40px] border border-border-misrah shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left rtl:text-right">
              <thead className="bg-surface/60 border-b border-border-misrah">
                <tr className="text-[9px] font-black uppercase tracking-[2px] text-muted-text">
                  <th className="px-6 py-4">Applicant</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">Offers</th>
                  <th className="px-6 py-4">Cities</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Received</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-misrah/50">
                {leads.map(l => {
                  const meta = statusMeta(l.status);
                  return (
                    <tr key={l._id} onClick={() => openLead(l)} title="Review request" className="hover:bg-surface/40 transition-colors align-middle cursor-pointer">
                      <td className="px-6 py-4">
                        <div className="min-w-[180px]">
                          <p className="text-sm font-bold text-primary truncate">{l.businessName}</p>
                          <p className="text-[11px] font-medium text-muted-text truncate">{l.fullName}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1 min-w-[170px]">
                          <p className="text-[11px] font-bold text-primary/80 flex items-center gap-1.5" dir="ltr"><Phone size={11} className="text-muted-text shrink-0" /> {fullPhone(l)}</p>
                          <p className="text-[11px] font-bold text-primary/80 flex items-center gap-1.5 truncate"><Mail size={11} className="text-muted-text shrink-0" /> {l.email}</p>
                          {l.preferredContactMethod && (
                            <p className="text-[9px] font-black uppercase tracking-widest text-muted-text/70">Prefers {pretty(l.preferredContactMethod)}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1 min-w-[120px]">
                          {(l.offerings ?? []).map(o => (
                            <span key={o} className="px-2.5 py-1 rounded-full bg-primary/5 text-primary text-[9px] font-black uppercase tracking-widest">{pretty(o)}</span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[11px] font-bold text-primary/70 min-w-[140px]">{(l.cities ?? []).map(pretty).join(', ') || '—'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest whitespace-nowrap ${meta.className}`}>{meta.label}</span>
                      </td>
                      <td className="px-6 py-4 text-[11px] font-bold text-muted-text whitespace-nowrap">{shortDate(l.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!isLoading && !loadError && totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button type="button" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="w-10 h-10 rounded-xl bg-white border border-border-misrah flex items-center justify-center text-primary disabled:opacity-40"><ChevronLeft size={16} /></button>
          <span className="text-[10px] font-black text-muted-text uppercase tracking-widest">Page {page} of {totalPages}</span>
          <button type="button" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="w-10 h-10 rounded-xl bg-white border border-border-misrah flex items-center justify-center text-primary disabled:opacity-40"><ChevronRight size={16} /></button>
        </div>
      )}

      {/* Detail drawer */}
      <AnimatePresence>
        {selected && (
          <div className="fixed inset-0 z-50 flex justify-end rtl:justify-start">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !isSaving && !isDeleting && setSelected(null)} className="absolute inset-0 bg-primary/50 backdrop-blur-sm" />
            <motion.div
              initial={{ x: 40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 40, opacity: 0 }}
              className="relative z-10 w-full max-w-xl h-full bg-white shadow-2xl overflow-y-auto"
            >
              <div className="sticky top-0 bg-white/95 backdrop-blur border-b border-border-misrah px-8 py-5 flex items-start justify-between gap-4 z-10">
                <div className="min-w-0">
                  <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${statusMeta(selected.status).className}`}>{statusMeta(selected.status).label}</span>
                  <h2 className="mt-2 text-2xl font-black italic text-primary uppercase truncate">{selected.businessName}</h2>
                  <p className="text-xs font-bold text-muted-text">{selected.fullName} · received {shortDate(selected.createdAt)}</p>
                </div>
                <button type="button" onClick={() => setSelected(null)} className="w-9 h-9 rounded-full bg-surface flex items-center justify-center text-primary shrink-0"><X size={16} /></button>
              </div>

              <div className="px-8 py-6 space-y-7">
                {/* Contact */}
                <section className="space-y-3">
                  <h3 className="text-[10px] font-black uppercase tracking-[2px] text-muted-text">Contact</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <a href={`https://wa.me/${phoneDigits(selected)}`} target="_blank" rel="noopener noreferrer" className="p-3 rounded-2xl border border-border-misrah hover:border-success hover:bg-success/5 flex items-center gap-2 text-xs font-bold text-primary transition-all">
                      <MessageCircle size={15} className="text-success" /> WhatsApp
                    </a>
                    <a href={`tel:+${phoneDigits(selected)}`} className="p-3 rounded-2xl border border-border-misrah hover:border-accent hover:bg-accent/5 flex items-center gap-2 text-xs font-bold text-primary transition-all" dir="ltr">
                      <Phone size={15} className="text-accent" /> {fullPhone(selected)}
                    </a>
                    <a href={`mailto:${selected.email}`} className="p-3 rounded-2xl border border-border-misrah hover:border-info hover:bg-info/5 flex items-center gap-2 text-xs font-bold text-primary transition-all min-w-0">
                      <Mail size={15} className="text-info shrink-0" /> <span className="truncate">{selected.email}</span>
                    </a>
                  </div>
                  <p className="text-[11px] font-bold text-muted-text">Prefers to be contacted by <span className="text-primary">{pretty(selected.preferredContactMethod)}</span></p>
                  {(selected.socialMedia?.length ?? 0) > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {selected.socialMedia!.map(sm => (
                        <a key={`${sm.platform}-${sm.handle}`} href={socialUrl(sm.platform, sm.handle)} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 rounded-full bg-primary text-white text-[11px] font-bold inline-flex items-center gap-1.5 hover:opacity-90">
                          {sm.platform}: <span dir="ltr">{sm.handle}</span> <ExternalLink size={10} className="opacity-60" />
                        </a>
                      ))}
                    </div>
                  )}
                </section>

                {/* Business */}
                <section className="space-y-3">
                  <h3 className="text-[10px] font-black uppercase tracking-[2px] text-muted-text">Business</h3>
                  <div className="flex flex-wrap gap-2">
                    {(selected.offerings ?? []).map(o => {
                      const Icon = OFFERINGS.find(x => x.id === o)?.icon ?? Home;
                      return (
                        <span key={o} className="px-3 py-2 rounded-2xl bg-primary/5 text-primary text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-1.5">
                          <Icon size={13} /> {pretty(o)}
                        </span>
                      );
                    })}
                  </div>
                  <dl className="grid grid-cols-2 gap-3 text-[11px]">
                    {[
                      ['Cities', (selected.cities ?? []).map(pretty).join(', ') || '—'],
                      ['Trade / tourism licence', selected.hasTradeLicense === 'YES' ? 'Yes' : selected.hasTradeLicense === 'NO' ? 'No' : pretty(selected.hasTradeLicense)],
                      ['Plans to join', pretty(selected.joiningTimeline)],
                      ['Manages bookings via', (selected.reservationManagement ?? []).map(pretty).join(', ') || '—'],
                    ].map(([label, value]) => (
                      <div key={label} className="p-3 rounded-2xl bg-surface border border-border-misrah">
                        <dt className="text-[8px] font-black uppercase tracking-[2px] text-muted-text mb-1">{label}</dt>
                        <dd className="font-bold text-primary flex items-center gap-1">
                          {label === 'Trade / tourism licence' && selected.hasTradeLicense === 'YES' && <BadgeCheck size={13} className="text-success" />}
                          {value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                  {selected.notes && (
                    <div className="p-4 rounded-2xl bg-accent/5 border border-accent/20">
                      <p className="text-[8px] font-black uppercase tracking-[2px] text-muted-text mb-1">Their notes</p>
                      <p className="text-xs font-medium text-primary whitespace-pre-line leading-relaxed">{selected.notes}</p>
                    </div>
                  )}
                </section>

                {/* Pipeline */}
                <section className="space-y-3 pt-2 border-t border-border-misrah">
                  <h3 className="text-[10px] font-black uppercase tracking-[2px] text-muted-text pt-4">Pipeline</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {STATUSES.map(st => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => setDraftStatus(st.id)}
                        className={`py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all
                          ${draftStatus === st.id ? 'border-primary bg-primary text-accent' : 'border-border-misrah text-muted-text hover:border-accent hover:text-primary'}`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={draftNotes}
                    onChange={e => setDraftNotes(e.target.value)}
                    rows={3}
                    placeholder="Internal notes, e.g. Called on WhatsApp, contract review scheduled for Tuesday."
                    className="w-full bg-surface border border-border-misrah rounded-2xl px-4 py-3 text-xs font-medium text-primary outline-none focus:border-accent resize-none"
                  />
                  {drawerError && <p className="text-[11px] font-bold text-danger">{drawerError}</p>}
                  <div className="flex gap-3">
                    <button type="button" onClick={removeLead} disabled={isSaving || isDeleting} className="px-4 py-3.5 rounded-2xl border border-danger/30 text-danger text-[10px] font-black uppercase tracking-wider flex items-center gap-2 hover:bg-danger hover:text-white transition-all disabled:opacity-50">
                      {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} Delete
                    </button>
                    <button
                      type="button"
                      onClick={saveStatus}
                      disabled={isSaving || isDeleting || (draftStatus === selected.status && draftNotes.trim() === (selected.adminNotes ?? ''))}
                      className="flex-1 py-3.5 rounded-2xl bg-primary text-accent text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save
                    </button>
                  </div>
                </section>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="fixed bottom-8 right-8 z-[60] px-5 py-3.5 rounded-2xl shadow-2xl bg-primary text-accent text-xs font-black uppercase tracking-wider flex items-center gap-2">
            <CheckCircle2 size={16} /> {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
