import React, { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Loader2, TriangleAlert, LayoutList, Home, Users2, CheckCircle2, Edit, Trash2 } from 'lucide-react';
import { listHomePageListingsAdmin, toggleHomePageListingActive, deleteHomePageListing } from '../../../features/homePageListings/api';
import { listUsers } from '../../../features/adminUsers/api';
import type { AdminHomePageListing } from '../../../features/homePageListings/types';
import type { AdminUserRecord } from '../../../features/adminUsers/types';
import { CreateAssetListingModal } from './CreateAssetListingModal';
import { ManageListingPropertiesModal } from './ManageListingPropertiesModal';
import { ManageEliteHostsModal } from './ManageEliteHostsModal';

const DISPLAY_TYPE_LABELS: Record<string, string> = {
  HORIZONTAL_SCROLL: 'Horizontal Scroll',
  VERTICAL_SCROLL: 'Vertical Scroll',
  GRID: 'Grid',
  LIST: 'List',
};

// Home page sections (GET /home-page-listings) — the rows the traveller app
// renders, e.g. "Local Discoveries". PROPERTY sections hold propertyIds,
// HOST sections hold hostIds.
export const AssetListingsTab = () => {
  const [listings, setListings] = useState<AdminHomePageListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingListing, setEditingListing] = useState<AdminHomePageListing | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [managingProperties, setManagingProperties] = useState<AdminHomePageListing | null>(null);
  const [managingHosts, setManagingHosts] = useState<AdminHomePageListing | null>(null);
  // Loaded lazily the first time a HOST section is managed — same
  // GET /admin/users call EliteNodesModule uses for its host picker.
  const [hostCandidates, setHostCandidates] = useState<AdminUserRecord[] | null>(null);
  const [isLoadingHosts, setIsLoadingHosts] = useState(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchListings = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const result = await listHomePageListingsAdmin();
      setListings([...result].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)));
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load asset listings.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const replaceListing = (updated: AdminHomePageListing) => {
    setListings(prev => prev.map(l => (l._id === updated._id ? { ...l, ...updated } : l)));
  };

  const handleToggleActive = async (listing: AdminHomePageListing) => {
    setTogglingId(listing._id);
    setActionError(null);
    try {
      replaceListing(await toggleHomePageListingActive(listing._id));
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to toggle this listing.');
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (listing: AdminHomePageListing) => {
    if (!window.confirm(`Delete asset listing "${listing.title.en}"? It will be removed from the traveller home page.`)) return;
    setDeletingId(listing._id);
    setActionError(null);
    try {
      await deleteHomePageListing(listing._id);
      showToast(`Asset listing "${listing.title.en}" deleted`);
      await fetchListings();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to delete this listing.');
    } finally {
      setDeletingId(null);
    }
  };

  const openManageHosts = async (listing: AdminHomePageListing) => {
    setActionError(null);
    if (!hostCandidates) {
      setIsLoadingHosts(true);
      try {
        const res = await listUsers({ userType: 'consumer', limit: 200 });
        setHostCandidates(res.data);
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Failed to load hosts.');
        setIsLoadingHosts(false);
        return;
      }
      setIsLoadingHosts(false);
    }
    setManagingHosts(listing);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <p className="text-[10px] font-black text-muted-text uppercase tracking-[2px]">
          {listings.length} home page {listings.length === 1 ? 'section' : 'sections'}
        </p>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="bg-primary text-accent px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-[3px] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20 flex items-center gap-2 group"
        >
          <Plus size={16} className="group-hover:rotate-90 transition-transform" /> Create Asset Listing
        </button>
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
          <h3 className="text-xl font-black italic text-danger uppercase">Failed To Load</h3>
          <p className="text-[10px] font-bold text-danger/70 uppercase tracking-widest">{loadError}</p>
          <button
            onClick={fetchListings}
            className="mt-4 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[2px] bg-primary text-white hover:opacity-90 transition-all"
          >
            Retry
          </button>
        </div>
      ) : listings.length === 0 ? (
        <div className="bg-white rounded-[48px] border border-border-misrah p-24 text-center shadow-sm space-y-4">
          <LayoutList size={40} className="mx-auto text-muted-text/30" />
          <p className="text-xs font-bold text-muted-text/60 uppercase tracking-widest">No asset listings yet.</p>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[2px] bg-primary text-accent hover:opacity-90 transition-all inline-flex items-center gap-2"
          >
            <Plus size={14} /> Create Asset Listing
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {listings.map(listing => {
            const isHostSection = listing.catalogueType === 'HOST';
            const itemCount = isHostSection ? listing.hostIds.length : listing.propertyIds.length;
            return (
              <div
                key={listing._id}
                className={`bg-white rounded-[36px] border border-border-misrah p-7 shadow-sm hover:shadow-luxury transition-all flex flex-col gap-5 ${!listing.isActive ? 'opacity-60' : ''}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className="text-[9px] font-black uppercase tracking-widest text-accent">
                      #{listing.displayOrder} · {DISPLAY_TYPE_LABELS[listing.displayType] ?? listing.displayType}
                    </span>
                    <h3 className="text-lg font-black italic text-primary uppercase tracking-tight truncate mt-0.5">{listing.title.en}</h3>
                    <p className="text-xs text-muted-text truncate">{listing.subtitle.en}</p>
                  </div>
                  <div className="flex items-start gap-3 shrink-0">
                    <div className="text-right" dir="rtl">
                      <p className="text-sm font-bold text-primary font-arabic">{listing.title.ar}</p>
                      <p className="text-[10px] text-muted-text font-arabic">{listing.subtitle.ar}</p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => setEditingListing(listing)}
                        title="Edit listing"
                        className="p-2 rounded-lg text-muted-text hover:text-primary hover:bg-surface transition-colors"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(listing)}
                        disabled={deletingId === listing._id}
                        title="Delete listing"
                        className="p-2 rounded-lg text-muted-text hover:text-danger hover:bg-danger/10 transition-colors disabled:opacity-50"
                      >
                        {deletingId === listing._id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-3 py-1 rounded-full bg-surface border border-border-misrah text-[9px] font-black uppercase tracking-wider text-primary flex items-center gap-1.5">
                    {isHostSection ? <Users2 size={11} /> : <Home size={11} />}
                    {listing.catalogueType}
                  </span>
                  {listing.catalogueType !== 'NONE' && (
                    <span className="px-3 py-1 rounded-full bg-accent/10 text-accent text-[9px] font-black uppercase tracking-wider">
                      {itemCount} {isHostSection ? (itemCount === 1 ? 'Host' : 'Hosts') : (itemCount === 1 ? 'Property' : 'Properties')}
                    </span>
                  )}
                  <button
                    onClick={() => handleToggleActive(listing)}
                    disabled={togglingId === listing._id}
                    className={`ml-auto px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[2px] transition-all disabled:opacity-50 flex items-center gap-1.5
                      ${listing.isActive ? 'bg-success/10 text-success' : 'bg-muted-text/10 text-muted-text'}`}
                  >
                    {togglingId === listing._id && <Loader2 size={10} className="animate-spin" />}
                    {listing.isActive ? 'Active' : 'Inactive'}
                  </button>
                </div>

                {listing.catalogueType !== 'NONE' && (
                  <button
                    onClick={() => (isHostSection ? openManageHosts(listing) : setManagingProperties(listing))}
                    disabled={isHostSection && isLoadingHosts}
                    className="mt-auto w-full py-3 rounded-2xl border border-border-misrah hover:border-accent text-[10px] font-black uppercase tracking-[2px] text-primary transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isHostSection && isLoadingHosts ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} className="text-accent" />}
                    {isHostSection ? 'Manage Hosts' : 'Manage Properties'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {isCreateOpen && (
          <CreateAssetListingModal
            onClose={() => setIsCreateOpen(false)}
            onSaved={(title) => {
              setIsCreateOpen(false);
              showToast(`Asset listing "${title}" created`);
              fetchListings();
            }}
          />
        )}
        {editingListing && (
          <CreateAssetListingModal
            listing={editingListing}
            onClose={() => setEditingListing(null)}
            onSaved={(title) => {
              setEditingListing(null);
              showToast(`Asset listing "${title}" updated`);
              fetchListings();
            }}
          />
        )}
      </AnimatePresence>

      {managingProperties && (
        <ManageListingPropertiesModal
          listing={managingProperties}
          onClose={() => setManagingProperties(null)}
          onUpdated={replaceListing}
        />
      )}

      {managingHosts && hostCandidates && (
        <ManageEliteHostsModal
          section={managingHosts}
          allUsers={hostCandidates}
          onClose={() => setManagingHosts(null)}
          onUpdated={replaceListing}
        />
      )}

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
