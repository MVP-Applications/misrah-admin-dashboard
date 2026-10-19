import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Calendar, MapPin, Plus, LayoutList, Home, FileText } from 'lucide-react';
import { LoadingSpinner } from '../../ui/LoadingSpinner';
import { Property, User } from '../../../types';
import { Badge } from '../../ui/Badge';
import { AddListingModal } from '../Properties/AddListingModal';
import { usePropertyActions } from '../../../hooks/usePropertyActions';
import { listAdminProperties } from '../../../features/properties/api';
import { apiPropertyToViewModel } from '../../../features/properties/mappers';
import type { CreatePropertyRequest, PropertyDraft } from '../../../features/properties/types';
import { AssetListingsTab } from './AssetListingsTab';
import { PropertyDraftsTab } from '../Properties/PropertyDraftsTab';
import { formatMoney } from '../../../utils/money';

interface HostingModuleProps {
  user: User;
}

export const HostingModule = ({ user }: HostingModuleProps) => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'Pending' | 'Approved' | 'Rejected'>('Pending');
  const [isModalOpen, setIsModalOpen] = useState(false);
  // 'requests' = hosting moderation queue, 'listings' = home page property
  // listings, 'drafts' = admin's saved creation drafts (/admin/properties/draft).
  const [activeTab, setActiveTab] = useState<'requests' | 'listings' | 'drafts'>('requests');
  const [resumeDraft, setResumeDraft] = useState<PropertyDraft | null>(null);
  const [draftsRefreshKey, setDraftsRefreshKey] = useState(0);
  const openCreate = () => { setResumeDraft(null); setIsModalOpen(true); };
  const closeModal = () => { setIsModalOpen(false); setResumeDraft(null); };
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  // Client-side only — the admin properties endpoint has no isActive param,
  // so this narrows the already-fetched list for the current status tab.
  const [activeFilter, setActiveFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
  const visibleProperties = activeFilter === 'All'
    ? filteredProperties
    : filteredProperties.filter(p => (activeFilter === 'Active' ? p.active : !p.active));

  const refetch = useCallback(() => {
    setLoading(true);
    listAdminProperties({ status: filter.toLowerCase() as 'pending' | 'approved' | 'rejected', limit: 100 })
      .then(res => setFilteredProperties(res.data.map(apiPropertyToViewModel)))
      .catch(err => {
        console.error('[hosting] failed to load properties', err);
        setFilteredProperties([]);
      })
      .finally(() => setLoading(false));
  }, [filter]);

  useEffect(() => { refetch(); }, [refetch]);

  const { addProperty, handleApprove } = usePropertyActions(refetch);

  const handleAddProperty = async (payload: CreatePropertyRequest) => {
    await addProperty(payload);
    closeModal();
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-4xl font-sans font-black italic text-primary uppercase tracking-tighter leading-none">
            {activeTab === 'requests' ? 'Hosting Requests' : activeTab === 'drafts' ? 'Drafts' : 'Property Listings'}
          </h1>
          <p className="text-muted-text text-[10px] font-black uppercase tracking-[3px] mt-2 opacity-60">
            {activeTab === 'requests'
              ? 'Global Moderation Queue & Compliance Protocol'
              : activeTab === 'drafts'
                ? 'Unfinished properties saved during creation'
                : 'Home Page Sections & Curated Collections'}
          </p>
        </div>
        {activeTab === 'requests' && (
        <div className="flex items-center gap-6">
          <div className="flex bg-white border border-border-misrah rounded-2xl p-1.5 shadow-sm">
            {(['Pending', 'Approved', 'Rejected'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all relative
                  ${filter === status ? 'bg-primary text-accent shadow-lg shadow-primary/20' : 'text-muted-text/40 hover:text-primary'}`}
              >
                {status}
              </button>
            ))}
          </div>
          <select
            value={activeFilter}
            onChange={e => setActiveFilter(e.target.value as 'All' | 'Active' | 'Inactive')}
            className="h-8 px-4 rounded-2xl bg-white border border-border-misrah text-[9px] font-black uppercase tracking-widest text-primary outline-none focus:border-accent shadow-sm cursor-pointer"
          >
            <option value="All">All</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
          <button 
            onClick={openCreate}
            className="bg-primary text-accent px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[3px] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20 flex items-center gap-2 group"
          >
            <Plus size={16} className="group-hover:rotate-90 transition-transform" /> Add Hosting
          </button>
        </div>
        )}
        {activeTab === 'drafts' && (
          <button
            onClick={openCreate}
            className="bg-primary text-accent px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[3px] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20 flex items-center gap-2 group"
          >
            <Plus size={16} className="group-hover:rotate-90 transition-transform" /> Add Hosting
          </button>
        )}
      </header>

      {/* Tab Switcher: Hosting Requests vs Property Listings */}
      <div className="bg-surface p-1.5 rounded-2xl border border-border-misrah flex max-w-xl">
        <button
          type="button"
          onClick={() => setActiveTab('requests')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'requests' ? 'bg-primary text-accent shadow-md' : 'text-muted-text hover:text-primary'
          }`}
        >
          <Home size={14} />
          <span>Hosting Requests</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('listings')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'listings' ? 'bg-primary text-accent shadow-md' : 'text-muted-text hover:text-primary'
          }`}
        >
          <LayoutList size={14} />
          <span>Property Listings</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('drafts')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'drafts' ? 'bg-primary text-accent shadow-md' : 'text-muted-text hover:text-primary'
          }`}
        >
          <FileText size={14} />
          <span>Drafts</span>
        </button>
      </div>

      {activeTab === 'listings' && <AssetListingsTab />}

      {activeTab === 'drafts' && (
        <PropertyDraftsTab
          scope="admin"
          refreshKey={draftsRefreshKey}
          onContinue={draft => { setResumeDraft(draft); setIsModalOpen(true); }}
        />
      )}

      {activeTab === 'requests' && (loading && filteredProperties.length === 0 ? (
        <div className="bg-white rounded-[48px] border border-border-misrah p-32 text-center shadow-sm">
          <LoadingSpinner className="mx-auto" />
        </div>
      ) : visibleProperties.length === 0 ? (
        <div className="bg-white rounded-[48px] border border-border-misrah p-32 text-center shadow-sm">
          <div className="w-24 h-24 bg-surface rounded-[40px] flex items-center justify-center mx-auto mb-8 text-[#D4C3B5] ring-8 ring-surface/50">
            <Check size={40} />
          </div>
          <h3 className="text-2xl font-sans font-black italic text-primary uppercase tracking-tight">
            Queue Synchronized
          </h3>
          <p className="text-[10px] font-black text-muted-text/50 uppercase tracking-[4px] mt-3">
            {activeFilter === 'All'
              ? `${filter} moderation list is fully audited`
              : `No ${activeFilter.toLowerCase()} ${filter.toLowerCase()} properties`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <AnimatePresence mode="popLayout">
            {visibleProperties.map(property => (
              <motion.div 
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                key={property.id}
                onClick={() => navigate(`/admin/hosting/${property.id}`)}
                className="bg-white rounded-[40px] border border-border-misrah overflow-hidden shadow-sm hover:shadow-luxury transition-all duration-500 group cursor-pointer flex flex-col"
              >
                <div className="relative h-40 overflow-hidden bg-surface border-b border-border-misrah/20">
                  <img src={property.image} alt={property.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute top-4 left-4 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm border border-border-misrah/50 shadow-sm">
                    <span className={`w-1.5 h-1.5 rounded-full ${property.active ? 'bg-success' : 'bg-muted-text/50'}`} />
                    <span className={`text-[9px] font-black uppercase tracking-wider ${property.active ? 'text-success' : 'text-muted-text'}`}>
                      {property.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="absolute top-4 right-4">
                    <Badge variant={property.status === 'Approved' ? 'green' : property.status === 'Pending' ? 'gold' : 'red'}>
                      {property.status?.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="absolute inset-0 bg-linear-to-t from-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-border-misrah/30 group-hover:border-accent/10 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-2xl bg-surface border border-border-misrah flex items-center justify-center text-accent ring-4 ring-surface shadow-inner">
                         <span className="text-[11px] font-black uppercase italic leading-none">{property.hostName?.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-primary uppercase tracking-tight truncate max-w-[110px]">{property.hostName || 'Elite Host'}</p>
                        <p className="text-[8px] font-black text-muted-text/40 uppercase tracking-[3px] mt-0.5">Proprietor</p>
                      </div>
                    </div>
                    <div className="text-right">
                       <p className="text-[11px] font-black text-primary italic">{formatMoney(property.price, property.currency)}</p>
                       <p className="text-[8px] font-black text-muted-text/40 uppercase tracking-[3px] mt-0.5">Base Price</p>
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-sans font-black italic text-primary uppercase tracking-tight mb-4 line-clamp-2 leading-tight">{property.name}</h3>
                  
                  <div className="mt-auto space-y-4">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-surface border border-border-misrah/50 rounded-xl w-fit">
                      <MapPin size={11} className="text-accent" />
                      <span className="text-[10px] font-black text-primary/60 uppercase tracking-widest">{property.city}</span>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button className="flex-1 py-3.5 bg-primary text-accent text-[9px] font-black uppercase tracking-[3px] rounded-2xl group-hover:shadow-lg group-hover:shadow-primary/20 transition-all border border-primary">
                        View Details
                      </button>
                      {filter === 'Pending' && (
                         <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApprove(property.id);
                          }}
                          className="w-12 h-12 flex items-center justify-center bg-success/10 text-success rounded-2xl hover:bg-success hover:text-white transition-all shadow-sm border border-success/10"
                         >
                           <Check size={18} />
                         </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ))}
      <AnimatePresence>
        {isModalOpen && (
          <AddListingModal 
            isOpen={isModalOpen} 
            onClose={closeModal}
            onAdd={handleAddProperty}
            user={user}
            draft={resumeDraft}
            onDraftsChanged={() => setDraftsRefreshKey(k => k + 1)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
