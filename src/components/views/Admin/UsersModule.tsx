import React, { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { Search, Loader2, TriangleAlert, Users, ChevronLeft, ChevronRight, Star, Phone, Mail, X, Pencil, Trash2, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { GuestAvatar } from '../../GuestAvatar';
import { errorMessage } from '../../../api/errors';
import { deleteConsumerUser, listUsers, patchConsumerUser } from '../../../features/adminUsers/api';
import type { AdminUserRecord, UpdateConsumerUserRequest } from '../../../features/adminUsers/types';

// Admin → Users: platform users (GET /admin/users?userType=consumer&canHost
// &search&page&limit). Search by name / email; filter hosts vs. travellers.
// Edit → PATCH /admin/users/consumer/{id}; Delete → DELETE same path.

const PAGE_SIZE = 20;

type HostFilter = 'all' | 'hosts' | 'travelers';

const HOST_FILTERS: { id: HostFilter; label: string }[] = [
  { id: 'all', label: 'All Users' },
  { id: 'hosts', label: 'Hosts' },
  { id: 'travelers', label: 'Travelers' },
];

const shortDate = (iso?: string | null) => {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : format(d, 'd MMM yyyy');
};

// Profile photo isn't in the typed record — read it defensively.
const avatarOf = (u: AdminUserRecord): string | null => {
  const raw = (u as unknown as Record<string, unknown>).profileImage;
  if (typeof raw === 'string') return raw;
  if (raw && typeof raw === 'object' && typeof (raw as { fullUrl?: unknown }).fullUrl === 'string') return (raw as { fullUrl: string }).fullUrl;
  return null;
};

export const UsersModule = () => {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [hostFilter, setHostFilter] = useState<HostFilter>('all');
  const [page, setPage] = useState(1);
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Edit / delete
  type EditForm = { name: string; email: string; password: string; isActive: boolean; canHost: boolean; isSuperHost: boolean };
  const [editTarget, setEditTarget] = useState<AdminUserRecord | null>(null);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminUserRecord | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    const handle = setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => clearTimeout(handle);
  }, [searchInput]);

  useEffect(() => { setPage(1); }, [search, hostFilter]);

  const load = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const res = await listUsers({
        page,
        limit: PAGE_SIZE,
        userType: 'consumer',
        ...(search ? { search } : {}),
        ...(hostFilter === 'hosts' ? { canHost: true } : hostFilter === 'travelers' ? { canHost: false } : {}),
      });
      setUsers(res.data);
      setTotal(res.total ?? res.data.length);
      setTotalPages(Math.max(1, res.totalPages ?? 1));
    } catch (err) {
      setUsers([]);
      setLoadError(errorMessage(err, 'Failed to load users.'));
    } finally {
      setIsLoading(false);
    }
  }, [page, search, hostFilter]);

  useEffect(() => { load(); }, [load]);

  const hasFilters = !!search || hostFilter !== 'all';

  const openEdit = (u: AdminUserRecord) => {
    setEditTarget(u);
    setEditForm({
      name: u.name ?? '',
      email: u.email ?? '',
      password: '',
      isActive: u.isActive,
      canHost: !!u.canHost,
      isSuperHost: !!u.isSuperHost,
    });
    setShowPassword(false);
    setModalError(null);
  };

  const saveEdit = async () => {
    if (!editTarget || !editForm) return;
    const email = editForm.email.trim();
    if (email && !/^\S+@\S+\.\S+$/.test(email)) {
      setModalError('Enter a valid email address.');
      return;
    }
    if (editForm.password && editForm.password.length < 6) {
      setModalError('The new password must be at least 6 characters.');
      return;
    }
    // Only send what changed (plus a password when one was typed).
    const body: UpdateConsumerUserRequest = {};
    if (editForm.name.trim() !== (editTarget.name ?? '')) body.name = editForm.name.trim();
    if (email !== (editTarget.email ?? '')) body.email = email;
    if (editForm.password) body.password = editForm.password;
    if (editForm.isActive !== editTarget.isActive) body.isActive = editForm.isActive;
    if (editForm.canHost !== !!editTarget.canHost) body.canHost = editForm.canHost;
    // Super Host only applies to hosts.
    const superHost = editForm.canHost && editForm.isSuperHost;
    if (superHost !== !!editTarget.isSuperHost) body.isSuperHost = superHost;
    if (Object.keys(body).length === 0) {
      setEditTarget(null);
      return;
    }
    setIsSaving(true);
    setModalError(null);
    try {
      await patchConsumerUser(editTarget._id, body);
      showToast(`${editForm.name.trim() || 'User'} updated`);
      setEditTarget(null);
      await load();
    } catch (err) {
      setModalError(errorMessage(err, 'Failed to update the user.'));
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsSaving(true);
    setModalError(null);
    try {
      await deleteConsumerUser(deleteTarget._id);
      showToast(`${deleteTarget.name || 'User'} deleted`);
      setDeleteTarget(null);
      // Step back a page if this emptied the current one.
      if (users.length === 1 && page > 1) setPage(p => p - 1);
      else await load();
    } catch (err) {
      setModalError(errorMessage(err, 'Failed to delete the user.'));
    } finally {
      setIsSaving(false);
    }
  };

  const toggleRow = (label: string, desc: string, value: boolean, onChange: (v: boolean) => void, disabled = false) => (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      onClick={() => !disabled && onChange(!value)}
      disabled={disabled}
      className={`w-full p-3.5 rounded-2xl border flex items-center justify-between gap-4 text-left transition-all disabled:opacity-40 disabled:cursor-not-allowed
        ${value ? 'border-accent/50 bg-accent/5' : 'border-border-misrah bg-white hover:border-accent/40'}`}
    >
      <span>
        <span className="block text-xs font-black text-primary">{label}</span>
        <span className="block text-[10px] font-medium text-muted-text mt-0.5">{desc}</span>
      </span>
      <span className={`w-11 h-6 rounded-full relative shrink-0 transition-colors shadow-inner ${value ? 'bg-success' : 'bg-border-misrah'}`}>
        <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${value ? 'left-6' : 'left-1'}`} />
      </span>
    </button>
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-0.5 rounded-full bg-accent/20 text-accent text-[10px] font-black uppercase tracking-wider">Directory</span>
            <span className="text-xs font-bold text-muted-text">المستخدمون</span>
          </div>
          <h1 className="text-4xl font-sans font-black italic text-primary uppercase tracking-tight leading-none">Users</h1>
          <p className="text-muted-text text-[10px] font-black uppercase tracking-[3px] mt-2 opacity-60">
            {isLoading ? 'Loading…' : `${total.toLocaleString()} ${hasFilters ? 'matching' : 'registered'} user${total === 1 ? '' : 's'}`}
          </p>
        </div>
      </header>

      {/* Search & filters */}
      <div className="flex flex-col md:flex-row gap-3 md:items-center justify-between">
        <div className="relative w-full md:max-w-md">
          <Search size={14} className="absolute left-4 rtl:left-auto rtl:right-4 top-1/2 -translate-y-1/2 text-muted-text/50" />
          <input
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full bg-surface border border-border-misrah rounded-2xl pl-10 pr-10 rtl:pl-10 rtl:pr-10 py-3 text-xs font-bold text-primary outline-none focus:border-accent"
          />
          {searchInput && (
            <button type="button" onClick={() => setSearchInput('')} title="Clear search" className="absolute right-3 rtl:right-auto rtl:left-3 top-1/2 -translate-y-1/2 text-muted-text/60 hover:text-primary">
              <X size={14} />
            </button>
          )}
        </div>
        <div className="bg-white border border-border-misrah rounded-2xl p-1.5 shadow-sm flex self-start md:self-auto">
          {HOST_FILTERS.map(f => (
            <button
              key={f.id}
              type="button"
              onClick={() => setHostFilter(f.id)}
              className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap
                ${hostFilter === f.id ? 'bg-primary text-accent shadow-lg shadow-primary/20' : 'text-muted-text/50 hover:text-primary'}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="bg-white rounded-[48px] border border-border-misrah p-24 text-center shadow-sm">
          <Loader2 size={36} className="animate-spin mx-auto text-primary/30" />
        </div>
      ) : loadError ? (
        <div className="bg-danger/5 rounded-[48px] border border-danger/20 p-16 text-center shadow-sm space-y-4">
          <TriangleAlert size={36} className="mx-auto text-danger" />
          <p className="text-[10px] font-bold text-danger/70 uppercase tracking-widest">{loadError}</p>
          <button type="button" onClick={load} className="px-6 py-3 rounded-2xl bg-primary text-accent text-[10px] font-black uppercase tracking-[2px]">Retry</button>
        </div>
      ) : users.length === 0 ? (
        <div className="bg-white rounded-[48px] border border-border-misrah p-24 text-center shadow-sm space-y-3">
          <Users size={36} className="mx-auto text-muted-text/30" />
          <p className="text-xs font-bold text-muted-text/60 uppercase tracking-widest">
            {hasFilters ? 'No users match these filters.' : 'No users yet.'}
          </p>
          {hasFilters && (
            <button type="button" onClick={() => { setSearchInput(''); setHostFilter('all'); }} className="text-[10px] font-black uppercase tracking-wider text-accent hover:underline">
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-[40px] border border-border-misrah shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left rtl:text-right">
              <thead className="bg-surface/60 border-b border-border-misrah">
                <tr className="text-[9px] font-black uppercase tracking-[2px] text-muted-text">
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Joined</th>
                  <th className="px-6 py-4 text-right rtl:text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-misrah/50">
                {users.map(u => {
                  const isHost = u.canHost || u.mode === 'HOST';
                  const hostSince = shortDate(u.hostSince);
                  return (
                    <tr key={u._id} className="hover:bg-surface/40 transition-colors align-middle">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3 min-w-[200px]">
                          <GuestAvatar url={avatarOf(u)} name={u.name || u.email} className="w-10 h-10 rounded-xl" iconSize={18} />
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-primary truncate">{u.name || 'Unnamed user'}</p>
                            <p className="text-[10px] font-medium text-muted-text/70 truncate font-mono">#{u._id.slice(-6).toUpperCase()}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1 min-w-[180px]">
                          {u.email && (
                            <p className="text-[11px] font-bold text-primary/80 flex items-center gap-1.5 truncate"><Mail size={11} className="text-muted-text shrink-0" /> {u.email}</p>
                          )}
                          {u.phoneNumber && (
                            <p className="text-[11px] font-bold text-primary/80 flex items-center gap-1.5"><Phone size={11} className="text-muted-text shrink-0" /> {u.phoneNumber}</p>
                          )}
                          {!u.email && !u.phoneNumber && <p className="text-[11px] text-muted-text/60">—</p>}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col items-start gap-1">
                          <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${isHost ? 'bg-primary/10 text-primary' : 'bg-surface text-muted-text'}`}>
                            {isHost ? 'Host' : 'Traveler'}
                          </span>
                          {u.isSuperHost && (
                            <span className="px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest bg-accent/15 text-accent inline-flex items-center gap-1">
                              <Star size={9} fill="currentColor" /> Super Host
                            </span>
                          )}
                          {isHost && hostSince && <span className="text-[9px] font-bold text-muted-text/70">Hosting since {hostSince}</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${u.isActive ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                          {u.isActive ? 'Active' : 'Suspended'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[11px] font-bold text-muted-text whitespace-nowrap">{shortDate(u.createdAt) ?? '—'}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end rtl:justify-start gap-2">
                          <button
                            type="button"
                            onClick={() => openEdit(u)}
                            title="Edit user"
                            className="w-9 h-9 rounded-xl border border-border-misrah bg-white flex items-center justify-center text-primary hover:border-accent hover:text-accent transition-all"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => { setDeleteTarget(u); setModalError(null); }}
                            title="Delete user"
                            className="w-9 h-9 rounded-xl border border-danger/20 bg-danger/5 flex items-center justify-center text-danger hover:bg-danger hover:text-white transition-all"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
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
          <button type="button" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="w-10 h-10 rounded-xl bg-white border border-border-misrah flex items-center justify-center text-primary disabled:opacity-40">
            <ChevronLeft size={16} />
          </button>
          <span className="text-[10px] font-black text-muted-text uppercase tracking-widest">Page {page} of {totalPages}</span>
          <button type="button" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="w-10 h-10 rounded-xl bg-white border border-border-misrah flex items-center justify-center text-primary disabled:opacity-40">
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Edit modal */}
      <AnimatePresence>
        {editTarget && editForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !isSaving && setEditTarget(null)} className="absolute inset-0 bg-primary/60 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[36px] w-full max-w-lg p-8 relative z-10 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <GuestAvatar url={avatarOf(editTarget)} name={editTarget.name} className="w-11 h-11 rounded-2xl" iconSize={18} />
                  <div className="min-w-0">
                    <span className="text-[10px] font-black uppercase tracking-wider text-accent">Edit User</span>
                    <h3 className="text-lg font-black italic text-primary uppercase truncate">{editTarget.name || 'Unnamed user'}</h3>
                  </div>
                </div>
                <button type="button" onClick={() => setEditTarget(null)} disabled={isSaving} className="w-9 h-9 rounded-full bg-surface flex items-center justify-center text-primary shrink-0"><X size={16} /></button>
              </div>

              <div className="space-y-3">
                <label className="block space-y-1.5">
                  <span className="text-[9px] font-black uppercase tracking-[2px] text-muted-text">Full Name</span>
                  <input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className="w-full bg-surface border border-border-misrah rounded-2xl px-4 py-3 text-xs font-bold text-primary outline-none focus:border-accent" />
                </label>
                <label className="block space-y-1.5">
                  <span className="text-[9px] font-black uppercase tracking-[2px] text-muted-text">Email</span>
                  <input type="email" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} className="w-full bg-surface border border-border-misrah rounded-2xl px-4 py-3 text-xs font-bold text-primary outline-none focus:border-accent" />
                </label>
                <label className="block space-y-1.5">
                  <span className="text-[9px] font-black uppercase tracking-[2px] text-muted-text">New Password</span>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={editForm.password}
                      onChange={e => setEditForm({ ...editForm, password: e.target.value })}
                      placeholder="Leave blank to keep the current password"
                      autoComplete="new-password"
                      className="w-full bg-surface border border-border-misrah rounded-2xl px-4 pr-11 rtl:pr-4 rtl:pl-11 py-3 text-xs font-bold text-primary outline-none focus:border-accent"
                    />
                    <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-4 rtl:right-auto rtl:left-4 top-1/2 -translate-y-1/2 text-muted-text/60 hover:text-primary">
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </label>
              </div>

              <div className="space-y-2">
                {toggleRow('Active', editForm.isActive ? 'Can sign in and use the platform' : 'Suspended — cannot sign in', editForm.isActive, v => setEditForm({ ...editForm, isActive: v }))}
                {toggleRow('Can Host', 'Allowed to list properties and experiences', editForm.canHost, v => setEditForm({ ...editForm, canHost: v, isSuperHost: v ? editForm.isSuperHost : false }))}
                {toggleRow('Super Host', editForm.canHost ? 'Featured as a top-rated host' : 'Only available for hosts', editForm.isSuperHost, v => setEditForm({ ...editForm, isSuperHost: v }), !editForm.canHost)}
              </div>

              {modalError && <p className="text-[11px] font-bold text-danger">{modalError}</p>}

              <div className="flex gap-3">
                <button type="button" onClick={() => setEditTarget(null)} disabled={isSaving} className="flex-1 py-3.5 rounded-2xl border border-border-misrah text-[10px] font-black uppercase tracking-wider text-primary hover:bg-surface disabled:opacity-50">Cancel</button>
                <button type="button" onClick={saveEdit} disabled={isSaving} className="flex-[2] py-3.5 rounded-2xl bg-primary text-accent text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-60">
                  {isSaving && <Loader2 size={14} className="animate-spin" />}
                  {isSaving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete modal */}
      <AnimatePresence>
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !isSaving && setDeleteTarget(null)} className="absolute inset-0 bg-primary/60 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[36px] w-full max-w-md p-8 relative z-10 shadow-2xl space-y-5"
            >
              <div className="w-12 h-12 rounded-2xl bg-danger/10 text-danger flex items-center justify-center"><Trash2 size={20} /></div>
              <div>
                <h3 className="text-xl font-black italic text-primary uppercase">Delete {deleteTarget.name || 'this user'}?</h3>
                <p className="text-xs text-muted-text mt-2 leading-relaxed">
                  {deleteTarget.email || deleteTarget.phoneNumber} will be removed from the platform. This can’t be undone.
                  {(deleteTarget.canHost || deleteTarget.mode === 'HOST') && ' Their host listings and settlements may be affected.'}
                </p>
              </div>
              {modalError && <p className="text-[11px] font-bold text-danger">{modalError}</p>}
              <div className="flex gap-3">
                <button type="button" onClick={() => setDeleteTarget(null)} disabled={isSaving} className="flex-1 py-3.5 rounded-2xl border border-border-misrah text-[10px] font-black uppercase tracking-wider text-primary hover:bg-surface disabled:opacity-50">Cancel</button>
                <button type="button" onClick={confirmDelete} disabled={isSaving} className="flex-[2] py-3.5 rounded-2xl bg-danger text-white text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-60">
                  {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  Delete User
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-8 right-8 z-[60] px-5 py-3.5 rounded-2xl shadow-2xl bg-primary text-accent text-xs font-black uppercase tracking-wider flex items-center gap-2"
          >
            <CheckCircle2 size={16} /> {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
