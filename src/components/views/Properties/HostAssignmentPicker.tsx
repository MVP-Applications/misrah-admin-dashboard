import React, { useEffect, useState } from 'react';
import { Search, UserPlus, ShieldCheck, Loader2, Check, Info, RefreshCw } from 'lucide-react';
import { listUsers } from '../../../features/adminUsers/api';
import type { AdminUserRecord } from '../../../features/adminUsers/types';
import type { HostAssignmentSelection } from '../../../features/properties/types';

interface HostAssignmentPickerProps {
  value: HostAssignmentSelection | undefined;
  onChange: (selection: HostAssignmentSelection) => void;
  // Reassignment has no backend operation to un-assign a host, so the
  // "Admin" (unassigned) tab only ever makes sense during creation.
  allowUnassigned: boolean;
  // Prefills the Existing-Owner search box — used by ReassignHostModal to
  // let an admin jump straight to searching by the email/phone they just
  // typed on the New Owner tab after a "user already exists" conflict.
  initialSearch?: string;
  // Same pattern as Badge.tsx — needed so callers can pass `key` to force a
  // remount (ReassignHostModal does this after a conflict to reset the
  // internal tab/search state).
  key?: React.Key;
}

type Tab = 'existing' | 'new' | 'admin';

const emptyNewOwner = { name: '', nationalId: '', phoneNumber: '', email: '', residentialAddress: '', password: '' };

export const HostAssignmentPicker = ({ value, onChange, allowUnassigned, initialSearch }: HostAssignmentPickerProps) => {
  const [tab, setTab] = useState<Tab>(value?.mode ?? 'existing');
  const [search, setSearch] = useState(initialSearch ?? '');
  const [results, setResults] = useState<AdminUserRecord[]>([]);
  const [searching, setSearching] = useState(false);
  const [newOwner, setNewOwner] = useState(
    value?.mode === 'new'
      ? {
          name: value.name,
          nationalId: value.nationalId,
          phoneNumber: value.phoneNumber,
          email: value.email,
          residentialAddress: value.residentialAddress,
          password: value.password ?? '',
        }
      : emptyNewOwner,
  );

  useEffect(() => {
    if (tab !== 'existing') return;
    const term = search.trim();
    if (term.length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    const timeout = setTimeout(() => {
      listUsers({ search: term, userType: 'consumer', limit: 10 })
        .then((res) => setResults(res.data))
        .finally(() => setSearching(false));
    }, 300);
    return () => clearTimeout(timeout);
  }, [search, tab]);

  const selectExisting = (u: AdminUserRecord) => {
    onChange({ mode: 'existing', userId: u._id, label: u.name || u.email || u._id });
  };

  // password is optional — the backend (AdminCreatePropertyDto/AssignHostDto)
  // only requires >= 6 chars when one is actually provided.
  const passwordError = newOwner.password && newOwner.password.length < 6 ? 'Must be at least 6 characters' : undefined;
  const newOwnerValid =
    newOwner.name.trim() &&
    newOwner.nationalId.trim() &&
    newOwner.phoneNumber.trim() &&
    newOwner.email.trim() &&
    newOwner.residentialAddress.trim() &&
    !passwordError;

  const registerNewOwner = () => {
    if (!newOwnerValid) return;
    onChange({ mode: 'new', ...newOwner, password: newOwner.password.trim() || undefined });
  };

  const selectAdmin = () => onChange({ mode: 'admin' });

  const tabs: Array<{ id: Tab; icon: typeof Search; title: string; desc: string }> = [
    { id: 'existing', icon: Search, title: 'Existing Owner', desc: 'Search & link an existing registered owner in the system' },
    { id: 'new', icon: UserPlus, title: 'New Owner', desc: 'Register a new owner profile with Emirates ID & contact details' },
    ...(allowUnassigned
      ? [{ id: 'admin' as Tab, icon: ShieldCheck, title: 'Admin', desc: 'Create as unassigned property managed directly by admin' }]
      : []),
  ];

  return (
    <div className="space-y-6">
      <div className={`grid gap-4 ${allowUnassigned ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2'}`}>
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              setTab(t.id);
              if (t.id === 'admin') selectAdmin();
            }}
            className={`p-5 rounded-2xl border text-left flex flex-col gap-3 transition-all
              ${tab === t.id ? 'border-accent bg-accent/5' : 'border-border-misrah hover:border-accent'}`}
          >
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-primary/5 flex items-center justify-center text-primary">
                <t.icon size={16} />
              </div>
              <span className="text-[9px] font-black uppercase tracking-[2px] text-accent">{t.title}</span>
            </div>
            <div>
              <div className="font-bold text-sm">{t.title}</div>
              <p className="text-[10px] text-muted-text font-medium mt-0.5">{t.desc}</p>
            </div>
          </button>
        ))}
      </div>

      {tab === 'existing' && (
        <div className="space-y-3">
          <div className="relative">
            <Search size={14} className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-text/50" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email or phone…"
              className="w-full bg-surface border border-border-misrah rounded-2xl pl-12 pr-5 py-3 text-xs font-bold outline-none focus:border-accent"
            />
          </div>
          {value?.mode === 'existing' && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-success/5 border border-success/20 text-success text-[10px] font-black uppercase tracking-widest">
              <Check size={14} /> Linked: {value.label}
            </div>
          )}
          <div className="space-y-2 max-h-56 overflow-y-auto">
            {searching && (
              <div className="flex items-center gap-2 text-muted-text text-[10px] font-bold uppercase tracking-widest px-1">
                <Loader2 size={12} className="animate-spin" /> Searching…
              </div>
            )}
            {!searching && search.trim().length >= 2 && results.length === 0 && (
              <p className="text-[10px] font-bold text-muted-text/50 uppercase tracking-widest px-1">No matching owners</p>
            )}
            {results.map((u) => (
              <button
                key={u._id}
                type="button"
                onClick={() => selectExisting(u)}
                className={`w-full flex items-center justify-between rounded-2xl px-5 py-3 border transition-all text-left
                  ${value?.mode === 'existing' && value.userId === u._id ? 'border-accent bg-accent/5' : 'border-border-misrah bg-surface hover:border-accent'}`}
              >
                <div className="min-w-0">
                  <p className="text-xs font-bold text-primary truncate">{u.name || 'Unnamed'}</p>
                  <p className="text-[9px] font-bold text-muted-text/50 truncate">{u.email || u.phoneNumber}</p>
                </div>
                {value?.mode === 'existing' && value.userId === u._id && <Check size={14} className="text-accent shrink-0" />}
              </button>
            ))}
          </div>
        </div>
      )}

      {tab === 'new' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Full Name" required value={newOwner.name} placeholder="e.g. Tariq Al-Hashimi" onChange={(v) => setNewOwner((p) => ({ ...p, name: v }))} />
            <Field
              label="National ID / Emirates ID"
              required
              value={newOwner.nationalId}
              placeholder="784-1990-1234567-1"
              onChange={(v) => setNewOwner((p) => ({ ...p, nationalId: v }))}
            />
            <Field
              label="Mobile Number"
              required
              value={newOwner.phoneNumber}
              placeholder="+971 50 123 4567"
              onChange={(v) => setNewOwner((p) => ({ ...p, phoneNumber: v }))}
            />
            <Field
              label="Email Address"
              required
              value={newOwner.email}
              placeholder="tariq@example.com"
              onChange={(v) => setNewOwner((p) => ({ ...p, email: v }))}
            />
          </div>
          <Field
            label="Residential / Office Address"
            required
            value={newOwner.residentialAddress}
            placeholder="e.g. Villa 14, Al Safa 2, Dubai, UAE"
            onChange={(v) => setNewOwner((p) => ({ ...p, residentialAddress: v }))}
          />
          <Field
            label="Password"
            type="password"
            value={newOwner.password}
            placeholder="Leave blank to set up later"
            hint="Optional — lets this owner log in immediately instead of waiting on a password reset."
            error={passwordError}
            onChange={(v) => setNewOwner((p) => ({ ...p, password: v }))}
          />
          <button
            type="button"
            disabled={!newOwnerValid}
            onClick={registerNewOwner}
            className="w-full py-4 rounded-2xl bg-primary text-white text-[10px] font-black uppercase tracking-[2px] flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-40"
          >
            <Check size={14} /> Register & Link New Owner
          </button>
          {value?.mode === 'new' && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-success/5 border border-success/20 text-success text-[10px] font-black uppercase tracking-widest">
              <Check size={14} /> Linked: {value.name}
            </div>
          )}
        </div>
      )}

      {tab === 'admin' && allowUnassigned && (
        <div className="space-y-4">
          <div className="p-6 rounded-[32px] border border-border-misrah bg-white space-y-4">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-full bg-primary/5 text-primary text-[9px] font-black uppercase tracking-[2px]">System Assignment Node</span>
            </div>
            <h3 className="text-xl font-black italic text-primary uppercase">Managed by Admin</h3>
            <p className="text-xs text-muted-text font-medium">This listing is marked as unassigned. An owner can be assigned later.</p>
            <div className="p-6 rounded-2xl bg-surface border border-border-misrah flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <p className="text-sm font-black text-primary">Managed by Admin</p>
                  <span className="text-[9px] font-black uppercase tracking-widest text-accent bg-accent/10 px-2 py-0.5 rounded-full">
                    Unassigned · Admin Managed
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-muted-text">
                <RefreshCw size={12} /> Reassign Node
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-primary/5">
              <Info size={14} className="text-primary/60 shrink-0 mt-0.5" />
              <p className="text-[11px] font-medium text-primary/60">
                This property will be saved as <span className="font-bold">Unassigned</span>. You can search or register an owner later at any time from
                the Property Details dashboard.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Field = ({
  label,
  value,
  placeholder,
  required,
  type = 'text',
  hint,
  error,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  required?: boolean;
  type?: string;
  hint?: string;
  error?: string;
  onChange: (v: string) => void;
}) => (
  <div className="space-y-2">
    <label className="text-[9px] font-black uppercase tracking-[2px] text-muted-text">
      {label} {required && <span className="text-accent">*</span>}
    </label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full bg-surface border rounded-2xl px-5 py-3 text-xs font-bold outline-none transition-all
        ${error ? 'border-danger focus:border-danger' : 'border-border-misrah focus:border-accent'}`}
    />
    {error ? (
      <p className="text-[9px] font-bold text-danger px-1">{error}</p>
    ) : hint ? (
      <p className="text-[9px] font-medium text-muted-text/60 px-1">{hint}</p>
    ) : null}
  </div>
);
