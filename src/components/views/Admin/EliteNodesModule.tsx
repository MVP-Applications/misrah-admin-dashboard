import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, ShieldCheck, Star, Loader2, TriangleAlert, UserPlus } from 'lucide-react';
import { listHomePageListingsAdmin, listHomePageListingsForTraveller } from '../../../features/homePageListings/api';
import { listUsers, updateConsumerUser } from '../../../features/adminUsers/api';
import type { AdminHomePageListing } from '../../../features/homePageListings/types';
import type { AdminUserRecord } from '../../../features/adminUsers/types';
import { ManageEliteHostsModal } from './ManageEliteHostsModal';

interface EnrichedHost {
  _id: string;
  name: string;
  email?: string;
  avatar: string | null;
  isSuperHost: boolean;
  isActive: boolean;
  // null = this host is currently inactive/suspended, so the public
  // traveller/all endpoint silently omits it and never computes these stats.
  totalProperties: number | null;
  avgRating: number | null;
  totalReviews: number | null;
}

interface TravellerHostLite {
  name: string;
  profileImage: string | null;
  isSuperHost: boolean;
  totalProperties: number;
  avgRating: number;
  totalReviews: number;
}

// A best-effort placeholder avatar for hosts the public endpoint has no
// profileImage for — keeps the card grid visually consistent.
const fallbackAvatar = (id: string) => `https://api.dicebear.com/7.x/initials/svg?seed=${id}`;

const buildEnrichedHosts = (
  currentSection: AdminHomePageListing,
  users: AdminUserRecord[],
  travellerHosts: Map<string, TravellerHostLite>,
): EnrichedHost[] => {
  const usersById = new Map(users.map((u) => [u._id, u]));
  return currentSection.hostIds.map((hostId) => {
    const rich = travellerHosts.get(hostId);
    const user = usersById.get(hostId);
    return {
      _id: hostId,
      name: rich?.name ?? user?.name ?? 'Unknown Host',
      email: user?.email,
      avatar: rich?.profileImage ?? (user ? fallbackAvatar(hostId) : null),
      // isActive/isSuperHost always come from admin/users, never from the
      // public endpoint — it doesn't expose isActive at all, and would
      // simply be absent (not "false") for a suspended host.
      isSuperHost: user?.isSuperHost ?? rich?.isSuperHost ?? false,
      isActive: user?.isActive ?? true,
      totalProperties: rich?.totalProperties ?? null,
      avgRating: rich?.avgRating ?? null,
      totalReviews: rich?.totalReviews ?? null,
    };
  });
};

export const EliteNodesModule = () => {
  const [section, setSection] = useState<AdminHomePageListing | null>(null);
  const [allUsers, setAllUsers] = useState<AdminUserRecord[]>([]);
  const [hosts, setHosts] = useState<EnrichedHost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [mutatingId, setMutatingId] = useState<string | null>(null);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);

  const fetchAll = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const adminListings = await listHomePageListingsAdmin();
      const hostSection = adminListings.find((l) => l.catalogueType === 'HOST') ?? null;
      setSection(hostSection);

      if (!hostSection) {
        setHosts([]);
        setAllUsers([]);
        return;
      }

      const [travellerListings, usersResult] = await Promise.all([
        // Best-effort enrichment only — if the public endpoint hiccups, we
        // still have admin/users as ground truth for name/isActive.
        listHomePageListingsForTraveller().catch(() => []),
        listUsers({ userType: 'consumer', limit: 200 }),
      ]);

      const travellerSection = travellerListings.find((l) => l._id === hostSection._id);
      const travellerHostsById = new Map<string, TravellerHostLite>(
        (travellerSection?.hosts ?? []).map((h) => [h._id, h]),
      );

      setAllUsers(usersResult.data);
      setHosts(buildEnrichedHosts(hostSection, usersResult.data, travellerHostsById));
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load Elite Hosts.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleToggleActive = async (host: EnrichedHost) => {
    setMutatingId(host._id);
    setActionError(null);
    try {
      const updated = await updateConsumerUser(host._id, { isActive: !host.isActive });
      setHosts((prev) => prev.map((h) => (h._id === host._id ? { ...h, isActive: updated.isActive } : h)));
      setAllUsers((prev) => prev.map((u) => (u._id === host._id ? { ...u, isActive: updated.isActive } : u)));
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to update host status.');
    } finally {
      setMutatingId(null);
    }
  };

  const handleToggleSuperHost = async (host: EnrichedHost) => {
    setMutatingId(host._id);
    setActionError(null);
    try {
      const updated = await updateConsumerUser(host._id, { isSuperHost: !host.isSuperHost });
      setHosts((prev) => prev.map((h) => (h._id === host._id ? { ...h, isSuperHost: updated.isSuperHost ?? !host.isSuperHost } : h)));
      setAllUsers((prev) => prev.map((u) => (u._id === host._id ? { ...u, isSuperHost: updated.isSuperHost } : u)));
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to update Super Host status.');
    } finally {
      setMutatingId(null);
    }
  };

  const handleSectionUpdated = (updatedSection: AdminHomePageListing) => {
    setSection(updatedSection);
    const travellerHostsById = new Map<string, TravellerHostLite>(
      hosts
        .filter((h) => h.totalProperties !== null)
        .map((h) => [h._id, { name: h.name, profileImage: h.avatar, isSuperHost: h.isSuperHost, totalProperties: h.totalProperties ?? 0, avgRating: h.avgRating ?? 0, totalReviews: h.totalReviews ?? 0 }]),
    );
    setHosts(buildEnrichedHosts(updatedSection, allUsers, travellerHostsById));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="animate-spin text-primary/40" size={32} />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="bg-danger/5 border border-danger/20 rounded-3xl p-8 flex items-center gap-4 text-danger max-w-2xl mx-auto mt-12">
        <TriangleAlert size={20} />
        <p className="text-xs font-bold">{loadError}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-4xl font-sans font-black italic text-primary uppercase tracking-tighter leading-none">Elite Network Nodes</h1>
          <p className="text-muted-text text-[10px] font-black uppercase tracking-[3px] mt-2 opacity-60">Verified Host Identification & Reputation Control</p>
        </div>
        <button
          onClick={() => setIsManageModalOpen(true)}
          disabled={!section}
          className="bg-primary text-accent px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[3px] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20 flex items-center gap-2 group disabled:opacity-40 disabled:hover:scale-100"
        >
          <UserPlus size={16} /> Manage Elite Hosts
        </button>
      </header>

      {!section ? (
        <div className="bg-surface border border-border-misrah rounded-3xl p-12 text-center">
          <Users className="mx-auto text-muted-text/30 mb-4" size={32} />
          <p className="text-xs font-bold text-muted-text/60 uppercase tracking-widest">No Elite Hosts section is configured yet.</p>
        </div>
      ) : (
        <>
          {actionError && (
            <div className="bg-danger/5 border border-danger/20 rounded-2xl p-4 flex items-center gap-3 text-danger">
              <TriangleAlert size={16} />
              <p className="text-[10px] font-black uppercase tracking-widest">{actionError}</p>
            </div>
          )}

          {hosts.length === 0 ? (
            <div className="bg-surface border border-border-misrah rounded-3xl p-12 text-center">
              <Users className="mx-auto text-muted-text/30 mb-4" size={32} />
              <p className="text-xs font-bold text-muted-text/60 uppercase tracking-widest">No hosts added to Elite Hosts yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <AnimatePresence mode="popLayout">
                {hosts.map((host) => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    key={host._id}
                    className="bg-white rounded-[48px] border border-border-misrah p-10 shadow-sm hover:shadow-luxury transition-all duration-500 relative group overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-40 h-40 bg-linear-to-bl from-accent/5 to-transparent rounded-bl-[100px] pointer-events-none" />

                    {host.isSuperHost && (
                      <div className="absolute top-10 left-10">
                        <div className="flex items-center gap-2 px-4 py-1.5 bg-accent/10 text-accent rounded-full text-[9px] font-black uppercase tracking-widest border border-accent/20 backdrop-blur-sm">
                          <ShieldCheck size={12} className="fill-current opacity-30" />
                          <span>Super Host</span>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col items-center text-center space-y-6">
                      <div className="relative group/avatar">
                        <img
                          src={host.avatar ?? fallbackAvatar(host._id)}
                          className="w-28 h-28 rounded-[40px] object-cover shadow-2xl border-6 border-white transition-transform duration-500 group-hover/avatar:scale-105"
                          alt={host.name}
                        />
                        <div className={`absolute -bottom-2 -right-2 w-8 h-8 rounded-2xl border-4 border-white flex items-center justify-center text-[12px] font-black shadow-lg ${!host.isActive ? 'bg-danger text-white' : 'bg-success text-white'}`}>
                          {!host.isActive ? '!' : '✓'}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <h3 className="text-xl font-sans font-black italic text-primary uppercase tracking-tight truncate max-w-full">{host.name}</h3>
                        {host.email && <p className="text-[10px] font-black text-muted-text/50 uppercase tracking-widest truncate max-w-full">{host.email}</p>}
                      </div>

                      <div className="grid grid-cols-2 gap-0 w-full rounded-3xl bg-surface/50 border border-border-misrah/50 overflow-hidden divide-x divide-border-misrah/50">
                        <div className="py-5 hover:bg-white transition-colors">
                          <p className="text-[9px] font-black text-muted-text/60 uppercase tracking-widest mb-1.5">Properties</p>
                          <p className="text-2xl font-sans font-black italic text-primary">{host.totalProperties ?? '—'}</p>
                        </div>
                        <div className="py-5 hover:bg-white transition-colors">
                          <p className="text-[9px] font-black text-muted-text/60 uppercase tracking-widest mb-1.5 flex items-center justify-center gap-1">
                            <Star size={10} /> Rating
                          </p>
                          <p className="text-2xl font-sans font-black italic text-accent">{host.avgRating !== null ? host.avgRating.toFixed(1) : '—'}</p>
                        </div>
                      </div>

                      <div className="flex gap-3 w-full pt-4">
                        <button
                          onClick={() => handleToggleActive(host)}
                          disabled={mutatingId === host._id}
                          className={`flex-1 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[2px] transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50
                            ${!host.isActive
                              ? 'bg-success text-white hover:opacity-90'
                              : 'bg-danger/5 text-danger border border-danger/10 hover:bg-danger hover:text-white'}`}
                        >
                          {mutatingId === host._id ? <Loader2 size={12} className="animate-spin" /> : !host.isActive ? 'Activate' : 'Suspend'}
                        </button>
                        <button
                          onClick={() => handleToggleSuperHost(host)}
                          disabled={mutatingId === host._id}
                          className="flex-1 px-6 py-4 bg-surface hover:bg-primary border border-transparent hover:border-primary text-muted-text hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-[2px] transition-all shadow-sm disabled:opacity-50"
                        >
                          {host.isSuperHost ? 'Unmark Super' : 'Mark Super'}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </>
      )}

      {isManageModalOpen && section && (
        <ManageEliteHostsModal
          section={section}
          allUsers={allUsers}
          onClose={() => setIsManageModalOpen(false)}
          onUpdated={handleSectionUpdated}
        />
      )}
    </div>
  );
};
