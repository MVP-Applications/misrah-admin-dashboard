import React, { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { format, parseISO } from 'date-fns';
import {
  Plus,
  Edit,
  Trash2,
  X,
  Loader2,
  TriangleAlert,
  Search,
  TicketPercent,
  Copy,
  Check,
  CheckCircle2,
} from 'lucide-react';
import { createPromoCode, deletePromoCode, listPromoCodes, togglePromoCodeActive, updatePromoCode } from '../../../features/promoCodes/api';
import type { CreatePromoCodeRequest, PromoAppliesTo, PromoCode, PromoDiscountType } from '../../../features/promoCodes/types';

// Admin → Promo Codes. Add / list / edit / delete / enable-disable against
// /admin/promo-codes (features/promoCodes/api.ts).

interface PromoFormState {
  code: string;
  description: string;
  discountType: PromoDiscountType;
  discountValue: string;
  maxDiscountAmount: string;
  minBookingAmount: string;
  appliesTo: PromoAppliesTo;
  validFrom: string;
  validUntil: string;
  usageLimit: string;
  perUserLimit: string;
  isActive: boolean;
}

const CURRENCY = 'AED';
const today = () => format(new Date(), 'yyyy-MM-dd');

const EMPTY_FORM = (): PromoFormState => ({
  code: '',
  description: '',
  discountType: 'PERCENTAGE',
  discountValue: '',
  maxDiscountAmount: '',
  minBookingAmount: '',
  appliesTo: 'ALL',
  validFrom: today(),
  validUntil: '',
  usageLimit: '',
  perUserLimit: '1',
  isActive: true,
});

const APPLIES_TO_LABELS: Record<PromoAppliesTo, string> = {
  ALL: 'Stays & Experiences',
  STAYS: 'Stays only',
  EXPERIENCES: 'Experiences only',
};

const optionalNumber = (value: string): number | null => {
  if (value.trim() === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

const formatDate = (value: string) => {
  try {
    return format(parseISO(value), 'd MMM yyyy');
  } catch {
    return value;
  }
};

// Live state of a code, beyond the isActive toggle.
const COMPUTED_STATUS_STYLES: Record<string, string> = {
  active: 'bg-success/10 text-success',
  inactive: 'bg-muted-text/10 text-muted-text',
  disabled: 'bg-muted-text/10 text-muted-text',
  expired: 'bg-danger/10 text-danger',
  scheduled: 'bg-info/10 text-info',
  upcoming: 'bg-info/10 text-info',
  exhausted: 'bg-amber-500/10 text-amber-600',
  'used-up': 'bg-amber-500/10 text-amber-600',
};

function codeState(code: PromoCode): { label: string; className: string } {
  // Server's computedStatus wins when present.
  if (code.computedStatus) {
    const key = code.computedStatus.toLowerCase().replace(/[_\s]+/g, '-');
    return {
      label: key.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      className: COMPUTED_STATUS_STYLES[key] ?? 'bg-surface text-primary',
    };
  }
  const now = today();
  if (!code.isActive) return { label: 'Inactive', className: 'bg-muted-text/10 text-muted-text' };
  if (code.validUntil && code.validUntil < now) return { label: 'Expired', className: 'bg-danger/10 text-danger' };
  if (code.validFrom && code.validFrom > now) return { label: 'Scheduled', className: 'bg-info/10 text-info' };
  if (code.usageLimit && code.usedCount >= code.usageLimit) return { label: 'Used Up', className: 'bg-amber-500/10 text-amber-600' };
  return { label: 'Active', className: 'bg-success/10 text-success' };
}

const inputClass = 'w-full bg-surface border border-border-misrah rounded-xl px-4 py-3 text-xs font-bold text-primary outline-none focus:border-accent';
const labelClass = 'text-[10px] font-black uppercase tracking-wider text-muted-text block mb-1';

export const PromoCodesModule = () => {
  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedSearch(searchInput.trim()), 400);
    return () => clearTimeout(handle);
  }, [searchInput]);

  useEffect(() => { setPage(1); }, [debouncedSearch, statusFilter]);

  const [formTarget, setFormTarget] = useState<PromoCode | 'new' | null>(null);
  const [form, setForm] = useState<PromoFormState>(EMPTY_FORM());
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchCodes = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const result = await listPromoCodes({
        page,
        limit: 24,
        search: debouncedSearch || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });
      setCodes(result.data);
      setTotalPages(result.totalPages || 1);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load promo codes.');
    } finally {
      setIsLoading(false);
    }
  }, [page, debouncedSearch, statusFilter]);

  useEffect(() => {
    fetchCodes();
  }, [fetchCodes]);

  const openCreate = () => {
    setForm(EMPTY_FORM());
    setFormError(null);
    setFormTarget('new');
  };

  const openEdit = (code: PromoCode) => {
    setForm({
      code: code.code,
      description: code.description || '',
      discountType: code.discountType,
      discountValue: String(code.discountValue),
      maxDiscountAmount: code.maxDiscountAmount != null ? String(code.maxDiscountAmount) : '',
      minBookingAmount: code.minBookingAmount != null ? String(code.minBookingAmount) : '',
      appliesTo: code.appliesTo,
      validFrom: code.validFrom,
      validUntil: code.validUntil,
      usageLimit: code.usageLimit != null ? String(code.usageLimit) : '',
      perUserLimit: code.perUserLimit != null ? String(code.perUserLimit) : '',
      isActive: code.isActive,
    });
    setFormError(null);
    setFormTarget(code);
  };

  const validate = (): string | null => {
    const code = form.code.trim();
    if (!code) return 'Promo code is required.';
    if (!/^[A-Za-z0-9_-]{3,20}$/.test(code)) return 'Code must be 3–20 letters, numbers, - or _.';
    const value = Number(form.discountValue);
    if (!form.discountValue || !Number.isFinite(value) || value <= 0) return 'Enter a discount value greater than 0.';
    if (form.discountType === 'PERCENTAGE' && value > 100) return 'A percentage discount can’t exceed 100%.';
    if (!form.validFrom || !form.validUntil) return 'Valid from and valid until dates are required.';
    if (form.validUntil < form.validFrom) return 'Valid until must be on or after valid from.';
    for (const [label, raw] of [
      ['Max discount', form.maxDiscountAmount],
      ['Minimum booking amount', form.minBookingAmount],
      ['Total usage limit', form.usageLimit],
      ['Per-guest limit', form.perUserLimit],
    ] as const) {
      if (raw.trim() !== '' && (!Number.isFinite(Number(raw)) || Number(raw) < 0)) return `${label} must be a positive number.`;
    }
    return null;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const error = validate();
    if (error) {
      setFormError(error);
      return;
    }
    const payload: CreatePromoCodeRequest = {
      code: form.code,
      description: form.description.trim() || undefined,
      discountType: form.discountType,
      discountValue: Number(form.discountValue),
      maxDiscountAmount: form.discountType === 'PERCENTAGE' ? optionalNumber(form.maxDiscountAmount) : null,
      minBookingAmount: optionalNumber(form.minBookingAmount),
      currency: CURRENCY,
      appliesTo: form.appliesTo,
      validFrom: form.validFrom,
      validUntil: form.validUntil,
      usageLimit: optionalNumber(form.usageLimit),
      perUserLimit: optionalNumber(form.perUserLimit),
      isActive: form.isActive,
    };
    setIsSaving(true);
    setFormError(null);
    try {
      if (formTarget === 'new') {
        const created = await createPromoCode(payload);
        showToast(`Promo code ${created?.code ?? payload.code.toUpperCase()} created`);
      } else if (formTarget) {
        const updated = await updatePromoCode(formTarget._id, payload);
        showToast(`Promo code ${updated?.code ?? payload.code.toUpperCase()} updated`);
      }
      setFormTarget(null);
      await fetchCodes();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save this promo code.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (code: PromoCode) => {
    setBusyId(code._id);
    setActionError(null);
    try {
      await togglePromoCodeActive(code._id);
      await fetchCodes();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to update this promo code.');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (code: PromoCode) => {
    if (!window.confirm(`Delete promo code ${code.code}? Guests will no longer be able to use it.`)) return;
    setBusyId(code._id);
    setActionError(null);
    try {
      await deletePromoCode(code._id);
      showToast(`Promo code ${code.code} deleted`);
      await fetchCodes();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to delete this promo code.');
    } finally {
      setBusyId(null);
    }
  };

  const handleCopy = (code: PromoCode) => {
    navigator.clipboard?.writeText(code.code);
    setCopiedId(code._id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const discountLabel = (code: PromoCode) =>
    code.discountType === 'PERCENTAGE'
      ? `${code.discountValue}% OFF${code.maxDiscountAmount ? ` · max ${code.currency} ${code.maxDiscountAmount.toLocaleString()}` : ''}`
      : `${code.currency} ${code.discountValue.toLocaleString()} OFF`;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-0.5 rounded-full bg-accent/20 text-accent text-[10px] font-black uppercase tracking-wider">
              Revenue Levers
            </span>
            <span className="text-xs font-bold text-muted-text">رموز الخصم</span>
          </div>
          <h1 className="text-4xl font-sans font-black italic text-primary uppercase tracking-tight leading-none">Promo Codes</h1>
          <p className="text-muted-text text-[10px] font-black uppercase tracking-[3px] mt-2 opacity-60">
            Discount codes for stays & experiences
          </p>
        </div>
        <button
          onClick={openCreate}
          className="bg-primary text-accent px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[3px] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20 flex items-center gap-2 group"
        >
          <Plus size={16} className="group-hover:rotate-90 transition-transform" /> Add Promo Code
        </button>
      </header>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-text/50" />
          <input
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Search code or description..."
            className="w-full bg-surface border border-border-misrah rounded-2xl pl-10 pr-4 py-3 text-xs font-bold text-primary outline-none focus:border-accent"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
          className="py-3 px-4 bg-surface border border-border-misrah rounded-2xl text-xs font-bold text-primary outline-none focus:border-accent cursor-pointer"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {actionError && (
        <div className="bg-danger/5 border border-danger/20 rounded-3xl p-5 flex items-center gap-3 text-danger">
          <TriangleAlert size={18} />
          <p className="text-[10px] font-black uppercase tracking-widest">{actionError}</p>
        </div>
      )}

      {isLoading ? (
        <div className="bg-white rounded-[48px] border border-border-misrah p-32 text-center shadow-sm">
          <Loader2 size={40} className="animate-spin mx-auto text-primary/30" />
        </div>
      ) : loadError ? (
        <div className="bg-danger/5 rounded-[48px] border border-danger/20 p-16 text-center shadow-sm space-y-4">
          <TriangleAlert size={40} className="mx-auto text-danger" />
          <p className="text-[10px] font-bold text-danger/70 uppercase tracking-widest">{loadError}</p>
        </div>
      ) : codes.length === 0 ? (
        <div className="bg-white rounded-[48px] border border-border-misrah p-24 text-center shadow-sm space-y-4">
          <TicketPercent size={40} className="mx-auto text-muted-text/30" />
          <p className="text-xs font-bold text-muted-text/60 uppercase tracking-widest">
            {debouncedSearch || statusFilter !== 'all' ? 'No promo codes match these filters.' : 'No promo codes yet.'}
          </p>
          <button
            onClick={openCreate}
            className="px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[2px] bg-primary text-accent hover:opacity-90 transition-all inline-flex items-center gap-2"
          >
            <Plus size={14} /> Add Promo Code
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {codes.map(code => {
            const state = codeState(code);
            const isBusy = busyId === code._id;
            return (
              <div
                key={code._id}
                className={`bg-white rounded-[36px] border border-border-misrah overflow-hidden shadow-sm hover:shadow-luxury transition-all flex flex-col ${!code.isActive ? 'opacity-70' : ''}`}
              >
                {/* Ticket header */}
                <div className="p-6 bg-primary text-white relative">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <button
                        type="button"
                        onClick={() => handleCopy(code)}
                        title="Copy code"
                        className="flex items-center gap-2 font-mono text-xl font-black tracking-[3px] text-accent hover:opacity-90"
                      >
                        <span className="truncate">{code.code}</span>
                        {copiedId === code._id ? <Check size={14} className="shrink-0" /> : <Copy size={14} className="shrink-0 opacity-60" />}
                      </button>
                      <p className="text-sm font-black italic uppercase mt-1">{discountLabel(code)}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[2px] shrink-0 bg-white ${state.className.replace(/bg-[^\s]+/, '')}`}>
                      {state.label}
                    </span>
                  </div>
                  {/* ticket notches */}
                  <span className="absolute -bottom-3 -left-3 w-6 h-6 rounded-full bg-[#FCFAF8]" />
                  <span className="absolute -bottom-3 -right-3 w-6 h-6 rounded-full bg-[#FCFAF8]" />
                </div>

                <div className="p-6 border-t-2 border-dashed border-border-misrah flex-1 flex flex-col gap-4">
                  {code.description && <p className="text-xs text-muted-text leading-relaxed line-clamp-2">{code.description}</p>}

                  <div className="grid grid-cols-2 gap-3 text-[10px]">
                    <div className="p-3 rounded-2xl bg-surface">
                      <p className="font-black uppercase tracking-wider text-muted-text/70">Valid</p>
                      <p className="font-bold text-primary mt-0.5">{formatDate(code.validFrom)} – {formatDate(code.validUntil)}</p>
                    </div>
                    <div className="p-3 rounded-2xl bg-surface">
                      <p className="font-black uppercase tracking-wider text-muted-text/70">Applies To</p>
                      <p className="font-bold text-primary mt-0.5">{APPLIES_TO_LABELS[code.appliesTo]}</p>
                    </div>
                    <div className="p-3 rounded-2xl bg-surface">
                      <p className="font-black uppercase tracking-wider text-muted-text/70">Usage</p>
                      <p className="font-bold text-primary mt-0.5">
                        {code.usedCount} / {code.usageLimit ? code.usageLimit : '∞'}
                        {code.perUserLimit ? ` · ${code.perUserLimit} per guest` : ''}
                      </p>
                    </div>
                    <div className="p-3 rounded-2xl bg-surface">
                      <p className="font-black uppercase tracking-wider text-muted-text/70">Min Booking</p>
                      <p className="font-bold text-primary mt-0.5">
                        {code.minBookingAmount ? `${code.currency} ${code.minBookingAmount.toLocaleString()}` : 'None'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-auto pt-3 border-t border-border-misrah flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(code)}
                      disabled={isBusy}
                      className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[2px] transition-all disabled:opacity-50 ${
                        code.isActive ? 'bg-success/10 text-success' : 'bg-muted-text/10 text-muted-text'
                      }`}
                    >
                      {code.isActive ? 'Enabled' : 'Disabled'}
                    </button>
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(code)} title="Edit promo code" className="p-2 rounded-lg text-muted-text hover:text-primary hover:bg-surface transition-colors">
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(code)}
                        disabled={isBusy}
                        title="Delete promo code"
                        className="p-2 rounded-lg text-muted-text hover:text-danger hover:bg-danger/10 transition-colors disabled:opacity-50"
                      >
                        {isBusy ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!isLoading && !loadError && totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-5 py-2.5 rounded-xl border border-border-misrah text-[10px] font-black uppercase tracking-widest disabled:opacity-40"
          >
            Prev
          </button>
          <span className="text-[10px] font-black text-muted-text uppercase tracking-widest">Page {page} of {totalPages}</span>
          <button
            type="button"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-5 py-2.5 rounded-xl border border-border-misrah text-[10px] font-black uppercase tracking-widest disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}

      {/* Create / Edit modal */}
      <AnimatePresence>
        {formTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setFormTarget(null)} className="absolute inset-0 bg-primary/60 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[36px] w-full max-w-2xl relative z-10 p-8 shadow-luxury max-h-[90vh] overflow-y-auto space-y-6"
            >
              <div className="flex items-center justify-between pb-4 border-b border-border-misrah">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-accent/20 text-accent"><TicketPercent size={16} /></span>
                  <h2 className="text-xl font-black italic text-primary uppercase">
                    {formTarget === 'new' ? 'New Promo Code' : 'Edit Promo Code'}
                  </h2>
                </div>
                <button type="button" onClick={() => setFormTarget(null)} className="w-8 h-8 rounded-full bg-surface hover:bg-border-misrah flex items-center justify-center text-primary cursor-pointer">
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Promo Code *</label>
                    <input
                      value={form.code}
                      onChange={e => setForm({ ...form, code: e.target.value.toUpperCase().replace(/\s+/g, '') })}
                      placeholder="e.g. RAMADAN25"
                      maxLength={20}
                      className={`${inputClass} font-mono tracking-[2px]`}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Applies To</label>
                    <select value={form.appliesTo} onChange={e => setForm({ ...form, appliesTo: e.target.value as PromoAppliesTo })} className={`${inputClass} cursor-pointer`}>
                      {(Object.keys(APPLIES_TO_LABELS) as PromoAppliesTo[]).map(k => (
                        <option key={k} value={k}>{APPLIES_TO_LABELS[k]}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Description</label>
                  <input
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    placeholder="e.g. Ramadan offer for returning guests"
                    className={inputClass}
                  />
                </div>

                {/* Discount */}
                <div className="p-4 rounded-2xl bg-surface border border-border-misrah space-y-4">
                  <div className="flex bg-white p-1 rounded-xl border border-border-misrah w-fit">
                    {(['PERCENTAGE', 'FIXED'] as PromoDiscountType[]).map(type => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setForm({ ...form, discountType: type })}
                        className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                          form.discountType === type ? 'bg-primary text-accent' : 'text-muted-text hover:text-primary'
                        }`}
                      >
                        {type === 'PERCENTAGE' ? 'Percentage %' : `Fixed ${CURRENCY}`}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className={labelClass}>{form.discountType === 'PERCENTAGE' ? 'Discount (%) *' : `Discount (${CURRENCY}) *`}</label>
                      <input type="number" min={0} step="any" value={form.discountValue} onChange={e => setForm({ ...form, discountValue: e.target.value })} placeholder={form.discountType === 'PERCENTAGE' ? '15' : '200'} className={`${inputClass} bg-white`} />
                    </div>
                    {form.discountType === 'PERCENTAGE' && (
                      <div>
                        <label className={labelClass}>Max Discount ({CURRENCY})</label>
                        <input type="number" min={0} step="any" value={form.maxDiscountAmount} onChange={e => setForm({ ...form, maxDiscountAmount: e.target.value })} placeholder="No cap" className={`${inputClass} bg-white`} />
                      </div>
                    )}
                    <div>
                      <label className={labelClass}>Min Booking ({CURRENCY})</label>
                      <input type="number" min={0} step="any" value={form.minBookingAmount} onChange={e => setForm({ ...form, minBookingAmount: e.target.value })} placeholder="No minimum" className={`${inputClass} bg-white`} />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Valid From *</label>
                    <input type="date" value={form.validFrom} onChange={e => setForm({ ...form, validFrom: e.target.value })} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Valid Until *</label>
                    <input type="date" value={form.validUntil} min={form.validFrom || undefined} onChange={e => setForm({ ...form, validUntil: e.target.value })} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Total Usage Limit</label>
                    <input type="number" min={0} value={form.usageLimit} onChange={e => setForm({ ...form, usageLimit: e.target.value })} placeholder="Unlimited" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Uses Per Guest</label>
                    <input type="number" min={0} value={form.perUserLimit} onChange={e => setForm({ ...form, perUserLimit: e.target.value })} placeholder="Unlimited" className={inputClass} />
                  </div>
                </div>

                <label className="flex items-center justify-between p-4 rounded-2xl bg-surface border border-border-misrah cursor-pointer">
                  <div>
                    <span className="text-xs font-black uppercase text-primary">Enabled</span>
                    <p className="text-[10px] text-muted-text font-bold">Disabled codes can’t be redeemed even within their dates</p>
                  </div>
                  <input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} className="w-4 h-4 accent-accent" />
                </label>

                {formError && <p className="text-[10px] font-black text-danger uppercase tracking-widest text-center">{formError}</p>}

                <div className="flex gap-3 pt-3 border-t border-border-misrah">
                  <button type="button" onClick={() => setFormTarget(null)} className="flex-1 py-3.5 rounded-2xl border border-border-misrah text-xs font-black uppercase tracking-wider text-primary hover:bg-surface cursor-pointer">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex-[2] py-3.5 bg-primary text-accent rounded-2xl text-xs font-black uppercase tracking-wider hover:opacity-95 shadow-md cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSaving && <Loader2 size={14} className="animate-spin" />}
                    {formTarget === 'new' ? 'Create Promo Code' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 right-6 z-[200] max-w-sm bg-[#0B0D14] text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-accent/30 flex items-center gap-3"
          >
            <CheckCircle2 size={18} className="text-accent shrink-0" />
            <span className="text-xs font-bold text-white/90">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
