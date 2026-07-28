import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Check, X, AlertCircle, Info, MapPin, ShieldCheck } from 'lucide-react';
import { Badge } from '../../ui/Badge';
import { Property, User } from '../../../types';
import { AddListingModal } from './AddListingModal';
import { usePropertyActions } from '../../../hooks/usePropertyActions';
import { listAdminProperties, listActiveCities } from '../../../features/properties/api';
import { apiPropertyToViewModel } from '../../../features/properties/mappers';
import type { CityListItem, CreatePropertyRequest } from '../../../features/properties/types';

interface RejectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  propertyName: string;
}

const RejectionModal = ({ isOpen, onClose, onConfirm, propertyName }: RejectionModalProps) => {
  const [reason, setReason] = useState('');
  const reasons = [
    'Missing documentation nodes',
    'Low resolution imagery',
    'Invalid location data',
    'Incomplete property specifications',
    'Security verification failed',
    'Non-compliant with luxury standards'
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-primary/40 backdrop-blur-md"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative bg-white w-full max-w-md rounded-[40px] shadow-luxury overflow-hidden"
      >
        <div className="p-8 pb-0 flex justify-between items-start">
           <div>
              <h3 className="text-[10px] font-black uppercase tracking-[3px] text-danger mb-2">Protocol Rejection</h3>
              <h2 className="text-xl font-black italic text-primary uppercase">De-synchronize Request</h2>
              <p className="text-[11px] font-medium text-muted-text mt-1">{propertyName}</p>
           </div>
           <button onClick={onClose} className="p-2 hover:bg-surface rounded-full transition-all text-primary"><X size={20} /></button>
        </div>

        <div className="p-8 space-y-6">
           <div className="space-y-3">
              <label className="text-[9px] font-black uppercase tracking-[2px] text-primary/40 ml-1">Select Reason Node</label>
              <div className="grid grid-cols-1 gap-2">
                 {reasons.map(r => (
                   <button 
                    key={r}
                    onClick={() => setReason(r)}
                    className={`text-left px-5 py-3 rounded-2xl text-[11px] font-bold border transition-all
                      ${reason === r ? 'bg-danger/10 border-danger text-danger' : 'bg-surface border-border-misrah text-primary hover:border-danger/30'}`}
                   >
                     {r}
                   </button>
                 ))}
              </div>
           </div>

           <div className="space-y-3">
              <label className="text-[9px] font-black uppercase tracking-[2px] text-primary/40 ml-1">Additional Strategic Context</label>
              <textarea 
                className="w-full bg-surface border border-border-misrah rounded-2xl px-5 py-4 text-xs font-bold focus:border-danger outline-none transition-all placeholder:text-muted-text/30" 
                rows={3}
                placeholder="Enter specific audit findings..."
                value={reason.includes(': ') ? reason.split(': ')[1] : ''}
                onChange={(e) => {
                   const base = reasons.find(r => reason.startsWith(r)) || '';
                   setReason(base ? `${base}: ${e.target.value}` : e.target.value);
                }}
              />
           </div>

           <button 
             disabled={!reason}
             onClick={() => onConfirm(reason)}
             className="w-full bg-danger text-white py-5 rounded-[24px] text-[10px] font-black uppercase tracking-[3px] shadow-2xl shadow-danger/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:grayscale disabled:scale-100"
           >
             Confirm Rejection
           </button>
        </div>
      </motion.div>
    </div>
  );
};

interface PropertiesViewProps {
  user: User;
}

export const PropertiesView = ({ user }: PropertiesViewProps) => {
  const navigate = useNavigate();
  const [cities, setCities] = useState<CityListItem[]>([]);
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);
  const [isRequestsView, setIsRequestsView] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(() => {
    setLoading(true);
    listAdminProperties({ limit: 100, cityId: selectedCityId ?? undefined })
      .then(res => setProperties(res.data.map(apiPropertyToViewModel)))
      .finally(() => setLoading(false));
  }, [selectedCityId]);

  useEffect(() => { refetch(); }, [refetch]);
  useEffect(() => { listActiveCities().then(setCities); }, []);

  const {
    addProperty,
    handleApprove,
    rejectionModal,
    openRejectModal,
    closeRejectModal,
    confirmRejection
  } = usePropertyActions(refetch);

  const { approvedListings, pendingRequests } = useMemo(() => {
    let approved = properties.filter(p => p.status === 'Approved');
    let requests = properties.filter(p => !p.status || p.status === 'Pending' || p.status === 'Rejected');

    if (user.role === 'manager') {
      approved = approved.filter(p => p.hostId === user.id);
      requests = requests.filter(p => p.hostId === user.id);
    }

    return { approvedListings: approved, pendingRequests: requests };
  }, [properties, user]);

  const handleAddProperty = async (payload: CreatePropertyRequest) => {
    await addProperty(payload);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black italic text-primary">
            {user.role === 'admin' ? 'Global Assets' : 'My Listings'}
          </h1>
          <p className="text-muted-text text-sm mt-1 uppercase tracking-widest font-black">
            {user.role === 'admin' 
              ? 'Monitoring all platform nodes in the network' 
              : 'Managing your curated luxury retreats'}
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-primary text-accent px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:opacity-90 transition-all flex items-center gap-2 shadow-lg"
        >
          <Plus size={18} />
          <span>Create Listing</span>
        </button>
      </header>

      <div className="flex flex-col gap-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-[9px] font-black uppercase tracking-[2px] text-muted-text/60 mr-2">Geography:</span>
            <button
              onClick={() => { setSelectedCityId(null); setIsRequestsView(false); }}
              className={`px-6 py-2 rounded-xl text-[10px] font-black tracking-wider uppercase border transition-all shrink-0
                ${!isRequestsView && selectedCityId === null ? 'bg-primary text-accent border-primary shadow-sm' : 'bg-[#FCFAF8] text-muted-text border-transparent hover:border-accent'}`}
            >
              All
            </button>
            {cities.map(c => (
              <button
                key={c._id}
                onClick={() => { setSelectedCityId(c._id); setIsRequestsView(false); }}
                className={`px-6 py-2 rounded-xl text-[10px] font-black tracking-wider uppercase border transition-all shrink-0
                  ${!isRequestsView && selectedCityId === c._id ? 'bg-primary text-accent border-primary shadow-sm' : 'bg-[#FCFAF8] text-muted-text border-transparent hover:border-accent'}`}
              >
                {c.name}
              </button>
            ))}
          </div>

          {user.role === 'admin' && (
            <button 
              onClick={() => setIsRequestsView(!isRequestsView)}
              className={`flex items-center gap-3 px-6 py-2 rounded-xl text-[10px] font-black tracking-widest uppercase border transition-all
                ${isRequestsView 
                  ? 'bg-accent text-primary border-accent shadow-luxury' 
                  : 'bg-white text-primary border-border-misrah hover:border-accent'}`}
            >
              <ShieldCheck size={14} />
              New Requests
              {properties.filter(p => !p.status || p.status === 'Pending').length > 0 && (
                <span className="ml-1 w-5 h-5 bg-danger text-white rounded-full flex items-center justify-center text-[9px] shadow-sm">
                  {properties.filter(p => !p.status || p.status === 'Pending').length}
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      {loading && properties.length === 0 && (
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-text/50 py-10 text-center">Loading assets…</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <AnimatePresence mode="popLayout">
          {(isRequestsView ? pendingRequests : approvedListings).map(property => {
            if (property.status === 'Pending' || (!property.status)) {
              return (
                <motion.div 
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  key={property.id}
                  className="bg-white rounded-[40px] border border-border-misrah p-8 flex flex-col justify-between shadow-sm hover:shadow-luxury transition-all group"
                >
                  <div className="space-y-6">
                    <div className="flex justify-between items-start">
                       <div className="w-20 h-20 rounded-[28px] overflow-hidden border-2 border-surface">
                          <img src={property.image} className="w-full h-full object-cover" />
                       </div>
                       <Badge variant="gold">REQUEST-A{property.id.substr(0, 4).toUpperCase()}</Badge>
                    </div>
                    
                    <div>
                       <p className="text-[10px] font-bold text-accent tracking-[2px] uppercase mb-1">{property.city} · {property.type}</p>
                       <h3 className="text-xl font-black italic text-primary uppercase tracking-tight leading-tight">{property.name}</h3>
                       <div className="flex items-center gap-3 mt-4 text-[10px] font-black text-muted-text uppercase tracking-widest">
                          <span className="flex items-center gap-1"><Info size={14} className="text-accent" /> New Listing</span>
                          <span className="flex items-center gap-1"><MapPin size={14} className="text-accent" /> {property.city}</span>
                       </div>
                    </div>
                  </div>

                  <div className="mt-10 pt-8 border-t border-border-misrah space-y-4">
                     {user.role === 'admin' ? (
                       <div className="grid grid-cols-2 gap-3">
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleApprove(property.id); }}
                            className="bg-success text-white py-4 rounded-2xl text-[9px] font-black uppercase tracking-[2px] flex items-center justify-center gap-2 hover:opacity-90 transition-all"
                          >
                            <Check size={14} /> Approve
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); openRejectModal(property); }}
                            className="bg-white border border-danger text-danger py-4 rounded-2xl text-[9px] font-black uppercase tracking-[2px] flex items-center justify-center gap-2 hover:bg-danger/5 transition-all"
                          >
                            <X size={14} /> Reject
                          </button>
                       </div>
                     ) : (
                       <div className="flex items-center justify-center p-4 bg-surface rounded-2xl">
                          <span className="text-[10px] font-black text-primary/40 uppercase tracking-[2px]">Awaiting Strategic Review</span>
                       </div>
                     )}
                     <button
                        onClick={() => navigate(`/listings/${property.id}`)}
                        className="w-full py-4 text-[10px] font-black uppercase tracking-[3px] text-primary hover:text-accent transition-colors"
                     >
                        Audit Details
                     </button>
                  </div>
                </motion.div>
              );
            }

            return (
              <motion.div 
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                whileHover={{ y: -6 }}
                key={property.id}
                onClick={() => navigate(`/listings/${property.id}`)}
                className="bg-white rounded-[32px] border border-border-misrah overflow-hidden shadow-sm hover:shadow-luxury transition-all group cursor-pointer"
              >
                <div className="relative h-48 overflow-hidden">
                  <img src={property.image} alt={property.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  <div className="absolute top-4 right-4 flex flex-col items-end gap-2">
                    {property.status === 'Rejected' && (
                      <Badge variant="red">REJECTED</Badge>
                    )}
                    {property.status === 'Approved' && (
                      <Badge variant="green">LIVE</Badge>
                    )}
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-[10px] font-bold text-accent tracking-[3px] uppercase mb-1.5">{property.city} · {property.type}</p>
                  <h3 className="text-lg font-black italic text-primary uppercase mb-2 truncate">{property.name}</h3>
                  
                  {property.status === 'Rejected' && property.rejectionReason && (
                    <div className="mb-4 p-4 bg-danger/5 border border-danger/10 rounded-2xl flex items-start gap-3">
                       <AlertCircle size={16} className="text-danger shrink-0 mt-0.5" />
                       <div>
                          <p className="text-[9px] font-black text-danger uppercase tracking-wider">Protocol Violation</p>
                          <p className="text-[10px] font-medium text-danger/80 leading-relaxed mt-1">{property.rejectionReason}</p>
                       </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-border-misrah">
                     <p className="text-2xl font-sans font-black italic text-primary">
                        {property.price.toLocaleString()} <span className="text-[10px] font-sans font-bold not-italic text-muted-text uppercase tracking-widest">AED</span>
                     </p>
                     <div className="flex items-center gap-2 text-[10px] font-black text-muted-text uppercase tracking-widest">
                       {property.beds} Bed · {property.baths} Bath
                     </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        <button
          onClick={() => setIsModalOpen(true)}
          className="h-full min-h-[280px] bg-white/50 border-2 border-dashed border-border-misrah rounded-2xl flex flex-col items-center justify-center gap-3 text-muted-text hover:text-accent hover:border-accent transition-all group"
        >
          <div className="w-12 h-12 rounded-full bg-white border border-border-misrah flex items-center justify-center group-hover:scale-110 transition-transform">
            <Plus size={24} />
          </div>
          <span className="text-xs font-bold uppercase tracking-widest">Add New Listing</span>
        </button>
      </div>

      <AddListingModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAdd={handleAddProperty} user={user} />

      <RejectionModal
        isOpen={rejectionModal.isOpen}
        onClose={closeRejectModal}
        onConfirm={confirmRejection}
        propertyName={rejectionModal.propertyName}
      />
    </div>
  )
}
