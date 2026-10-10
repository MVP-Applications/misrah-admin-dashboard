import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { ChevronRight, CreditCard, Shield, History, X, Loader2, AlertCircle, Plus, Trash2, Landmark } from 'lucide-react';
import type { UserRole } from '../../../types';
import { errorMessage } from '../../../api/errors';
import { listCurrencies, type CurrencyOption } from '../../../features/profile/api';
import { deletePaymentNode, getPaymentNode, savePaymentNode, type PaymentNode, type PaymentNodeInput } from '../../../features/paymentNode/api';
import { listSettlements, type Settlement } from '../../../features/settlements/api';
import { usePreferredCurrency } from '../../../hooks/usePreferredCurrency';

// Profile → Payment Node: the payout bank account (admin: /admin/payment-node,
// host: /host/payment-node) plus the latest paid-out settlements.

interface PaymentNodeViewProps {
  role: UserRole;
  onBack: () => void;
  showToast: (message: string, type?: 'success' | 'info') => void;
}

const UAE_BANKS = [
  'ENBD Bank PLC (Emirates NBD)',
  'Abu Dhabi Commercial Bank (ADCB)',
  'First Abu Dhabi Bank (FAB)',
  'Dubai Islamic Bank (DIB)',
  'Mashreq Bank',
  'RAKBANK',
  'Commercial Bank of Dubai (CBD)',
  'Abu Dhabi Islamic Bank (ADIB)',
];

const EMPTY_FORM: PaymentNodeInput = { bankName: '', accountHolderName: '', ibanNumber: '', settlementCurrency: 'AED', swiftCode: '', routingCode: '', accountNumber: '' };

const inputClass = 'w-full bg-[#FCFAF8] border border-border-misrah rounded-2xl px-5 py-3 text-xs font-bold text-primary focus:border-accent outline-hidden';
const labelClass = 'text-[10px] font-black text-primary/60 uppercase tracking-[2px]';

// "AE03 **** **** **** 4521" style, falling back to the last 4 of the IBAN.
const maskedNumber = (n: PaymentNode) =>
  n.maskedIban || (n.last4 ? `•••• •••• •••• ${n.last4}` : `•••• •••• •••• ${n.ibanNumber.replace(/\s+/g, '').slice(-4)}`);

export const PaymentNodeView = ({ role, onBack, showToast }: PaymentNodeViewProps) => {
  const isAdmin = role === 'admin';
  const currency = usePreferredCurrency();
  const [node, setNode] = useState<PaymentNode | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState<PaymentNodeInput>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currencies, setCurrencies] = useState<CurrencyOption[]>([]);
  const [payouts, setPayouts] = useState<Settlement[] | null>(null);

  const load = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      setNode(await getPaymentNode(role));
    } catch (err) {
      setLoadError(errorMessage(err, 'Failed to load your payout destination.'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
    listCurrencies().then(setCurrencies).catch(() => setCurrencies([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  // Latest paid-out settlements (host: own; admin: released by the platform).
  useEffect(() => {
    listSettlements({ status: 'paid_out', limit: 5, page: 1, currency }, isAdmin ? 'admin' : 'host')
      .then(res => setPayouts(res.items))
      .catch(() => setPayouts([]));
  }, [isAdmin, currency]);

  const openForm = () => {
    setForm(node
      ? {
          bankName: node.bankName,
          accountHolderName: node.accountHolderName,
          ibanNumber: node.formattedIban || node.ibanNumber,
          settlementCurrency: node.settlementCurrency || 'AED',
          swiftCode: node.swiftCode ?? '',
          routingCode: node.routingCode ?? '',
          accountNumber: node.accountNumber ?? '',
        }
      : EMPTY_FORM);
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const iban = form.ibanNumber.replace(/\s+/g, '');
    if (!form.bankName.trim() || !form.accountHolderName.trim() || !iban) {
      setFormError('Bank name, account holder and IBAN are required.');
      return;
    }
    if (!/^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/i.test(iban)) {
      setFormError('Enter a valid IBAN (e.g. AE03 0260 0010 4521 8892 01).');
      return;
    }
    setIsSaving(true);
    setFormError(null);
    try {
      const saved = await savePaymentNode(role, form, !!node);
      if (saved) setNode(saved);
      else await load();
      setIsFormOpen(false);
      showToast(node ? 'Payout destination updated' : 'Payout destination added');
    } catch (err) {
      setFormError(errorMessage(err, 'Failed to save the payout destination.'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!node || !window.confirm('Remove this payout destination? Payouts can’t be sent until a new one is added.')) return;
    setIsDeleting(true);
    try {
      await deletePaymentNode(role);
      setNode(null);
      showToast('Payout destination removed');
    } catch (err) {
      showToast(errorMessage(err, 'Failed to remove the payout destination.'), 'info');
    } finally {
      setIsDeleting(false);
    }
  };

  const currencyOptions = currencies.length
    ? currencies
    : [{ code: 'AED', name: 'UAE Dirham' }, { code: 'USD', name: 'US Dollar' }, { code: 'EUR', name: 'Euro' }];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex items-center gap-4">
        <button onClick={onBack} className="w-10 h-10 rounded-xl bg-white border border-[#F2E8DF] flex items-center justify-center hover:bg-surface transition-all text-primary">
          <ChevronRight className="rotate-180" size={20} />
        </button>
        <h1 className="text-2xl font-black italic text-primary uppercase">Payment Node</h1>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Payout destination card */}
        {isLoading ? (
          <div className="bg-[#1A1B2E] rounded-[48px] p-10 min-h-[300px] flex items-center justify-center">
            <Loader2 size={28} className="animate-spin text-accent" />
          </div>
        ) : loadError ? (
          <div className="rounded-[48px] p-10 min-h-[300px] bg-danger/5 border border-danger/20 flex flex-col items-center justify-center gap-3 text-center">
            <AlertCircle size={26} className="text-danger" />
            <p className="text-xs font-bold text-danger">{loadError}</p>
            <button type="button" onClick={load} className="px-5 py-2.5 rounded-xl bg-primary text-accent text-[10px] font-black uppercase tracking-widest">Retry</button>
          </div>
        ) : !node ? (
          <div className="rounded-[48px] p-10 min-h-[300px] border-2 border-dashed border-border-misrah bg-white flex flex-col items-center justify-center gap-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-primary/5 text-primary flex items-center justify-center"><Landmark size={24} /></div>
            <div>
              <h3 className="text-lg font-black italic text-primary uppercase">No Payout Destination</h3>
              <p className="text-xs text-muted-text mt-1 max-w-xs">
                {isAdmin ? 'Add the treasury bank account used for platform settlements.' : 'Add the bank account your settlements should be paid to.'}
              </p>
            </div>
            <button type="button" onClick={openForm} className="px-6 py-3 rounded-2xl bg-primary text-accent text-[10px] font-black uppercase tracking-[2px] flex items-center gap-2">
              <Plus size={14} /> Add Payout Destination
            </button>
          </div>
        ) : (
          <div className="bg-[#1A1B2E] rounded-[48px] p-10 text-white min-h-[300px] flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 rounded-full blur-3xl pointer-events-none group-hover:bg-accent/20 transition-all duration-1000" />
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center"><Shield size={20} className="text-accent" /></div>
                <span className="text-[10px] font-black uppercase tracking-[3px] italic">
                  {node.treasuryStatus || (node.isVerified ? 'Verified Treasury' : 'Pending Verification')}
                </span>
              </div>
              <CreditCard size={32} className="text-[#D4C3B5]/30 group-hover:text-accent transition-all duration-700" />
            </div>

            <div className="space-y-2 relative z-10 py-6">
              <p className="text-[9px] font-black text-[#D4C3B5] uppercase tracking-[4px]">Payout Destination</p>
              <h3 className="text-3xl font-black italic uppercase tracking-tighter break-words">{node.accountHolderNameUpper || node.accountHolderName}</h3>
              <p className="text-xl font-black text-accent tracking-[2px]">{maskedNumber(node)}</p>
              {node.swiftCode && <p className="text-[10px] font-bold text-white/40 tracking-widest">SWIFT {node.swiftCode}</p>}
            </div>

            <div className="flex items-center justify-between gap-3 pt-6 border-t border-white/5 relative z-10">
              <div className="min-w-0">
                <p className="text-[8px] font-black text-[#D4C3B5] uppercase tracking-[3px] truncate">{node.bankName}</p>
                <p className="text-[9px] font-bold text-white/50">{node.settlementCurrency} Settlements</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  title="Remove payout destination"
                  className="w-9 h-9 rounded-xl bg-white/5 hover:bg-danger/80 flex items-center justify-center transition-all disabled:opacity-50"
                >
                  {isDeleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                </button>
                <button
                  type="button"
                  onClick={openForm}
                  className="bg-white/10 hover:bg-white/20 px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-[2px] backdrop-blur-sm transition-all cursor-pointer active:scale-95"
                >
                  Update
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Recent paid-out settlements */}
        <div className="bg-white rounded-[40px] border border-[#F2E8DF] p-10 space-y-8 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-success/10 text-success flex items-center justify-center"><History size={20} /></div>
            <div>
              <h3 className="text-lg font-black italic text-primary uppercase">Recent Settlements</h3>
              <p className="text-[10px] font-bold text-muted-text uppercase tracking-widest mt-0.5">Cleared payout history</p>
            </div>
          </div>

          <div className="space-y-2">
            {payouts === null ? (
              <div className="py-8 flex justify-center"><Loader2 size={18} className="animate-spin text-muted-text" /></div>
            ) : payouts.length === 0 ? (
              <p className="py-8 text-center text-[10px] font-black text-muted-text/60 uppercase tracking-widest">No payouts yet</p>
            ) : (
              payouts.map(p => (
                <div key={p.id} className="p-5 rounded-3xl border border-border-misrah bg-[#FCFAF8]/50 flex items-center justify-between gap-4 hover:border-accent transition-all">
                  <div className="min-w-0">
                    <p className="text-xs font-black italic text-primary uppercase">
                      {p.releasedAt ? format(new Date(p.releasedAt), 'MMM d, yyyy') : p.period?.formattedPeriod ?? '—'}
                    </p>
                    <p className="text-[9px] font-bold text-muted-text uppercase mt-0.5 truncate">
                      {isAdmin ? `${p.host.name} · ` : ''}{p.reference}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-black text-primary italic">
                      {p.currency} {p.settlementAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-[9px] text-success font-black uppercase mt-0.5">Disbursed</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Add / Update modal */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isSaving && setIsFormOpen(false)}
              className="absolute inset-0 bg-primary/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative bg-white w-full max-w-lg rounded-[40px] shadow-2xl border border-border-misrah p-8 space-y-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-4 border-b border-border-misrah">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-accent/15 flex items-center justify-center text-accent"><CreditCard size={20} /></div>
                  <div>
                    <h3 className="text-xl font-black italic text-primary uppercase">{node ? 'Update' : 'Add'} Payout Destination</h3>
                    <p className="text-[10px] font-bold text-muted-text uppercase tracking-widest">UAE Banking Rail Configuration</p>
                  </div>
                </div>
                <button type="button" onClick={() => setIsFormOpen(false)} disabled={isSaving} className="w-8 h-8 rounded-full bg-surface hover:bg-border-misrah/40 text-primary flex items-center justify-center transition-all">
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div className="space-y-1.5">
                  <label className={labelClass}>Bank Name *</label>
                  <input
                    list="payment-node-banks"
                    value={form.bankName}
                    onChange={e => setForm({ ...form, bankName: e.target.value })}
                    placeholder="Select or type your bank"
                    className={inputClass}
                    required
                  />
                  <datalist id="payment-node-banks">
                    {UAE_BANKS.map(b => <option key={b} value={b} />)}
                  </datalist>
                </div>
                <div className="space-y-1.5">
                  <label className={labelClass}>Account Holder Name *</label>
                  <input value={form.accountHolderName} onChange={e => setForm({ ...form, accountHolderName: e.target.value })} className={inputClass} required />
                </div>
                <div className="space-y-1.5">
                  <label className={labelClass}>IBAN Number *</label>
                  <input
                    value={form.ibanNumber}
                    onChange={e => setForm({ ...form, ibanNumber: e.target.value.toUpperCase() })}
                    placeholder="AE03 0260 0010 4521 8892 01"
                    className={`${inputClass} font-mono`}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className={labelClass}>SWIFT / BIC</label>
                    <input value={form.swiftCode} onChange={e => setForm({ ...form, swiftCode: e.target.value.toUpperCase() })} placeholder="EBILAEADXXX" className={`${inputClass} font-mono`} />
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelClass}>Routing Code</label>
                    <input value={form.routingCode} onChange={e => setForm({ ...form, routingCode: e.target.value })} placeholder="026" className={inputClass} />
                  </div>
                </div>
                {isAdmin && (
                  <div className="space-y-1.5">
                    <label className={labelClass}>Account Number</label>
                    <input value={form.accountNumber} onChange={e => setForm({ ...form, accountNumber: e.target.value })} placeholder="104521889201" className={inputClass} />
                  </div>
                )}
                <div className="space-y-1.5">
                  <label className={labelClass}>Settlement Currency</label>
                  <select value={form.settlementCurrency} onChange={e => setForm({ ...form, settlementCurrency: e.target.value })} className={inputClass}>
                    {currencyOptions.map(c => <option key={c.code} value={c.code}>{c.code} — {c.name}</option>)}
                    {form.settlementCurrency && !currencyOptions.some(c => c.code === form.settlementCurrency) && (
                      <option value={form.settlementCurrency}>{form.settlementCurrency}</option>
                    )}
                  </select>
                </div>

                {formError && <p className="text-[11px] font-bold text-danger">{formError}</p>}

                <div className="pt-4 flex items-center justify-end gap-3">
                  <button type="button" onClick={() => setIsFormOpen(false)} disabled={isSaving} className="px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider text-muted-text hover:text-primary">
                    Cancel
                  </button>
                  <button type="submit" disabled={isSaving} className="px-6 py-2.5 rounded-xl bg-primary text-accent font-black uppercase text-[10px] tracking-wider shadow-lg hover:opacity-95 flex items-center gap-2 disabled:opacity-60">
                    {isSaving && <Loader2 size={13} className="animate-spin" />}
                    {isSaving ? 'Saving…' : 'Save Destination'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
