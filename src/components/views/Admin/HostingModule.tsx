import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Calendar, MapPin, Plus } from 'lucide-react';
import { Property, User } from '../../../types';
import { Badge } from '../../ui/Badge';
import { AddListingModal } from '../Properties/AddListingModal';
import { usePropertyActions } from '../../../hooks/usePropertyActions';

interface HostingModuleProps {
  properties: Property[];
  setProperties: React.Dispatch<React.SetStateAction<Property[]>>;
  user: User;
}

export const HostingModule = ({ properties, setProperties, user }: HostingModuleProps) => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'Pending' | 'Approved' | 'Rejected'>('Pending');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { addProperty, updateProperty } = usePropertyActions(properties, setProperties, user);

  const filteredProperties = properties.filter(p => p.status === filter);

  const handleAddProperty = (newProp: Omit<Property, 'id' | 'rating' | 'reviews' | 'active' | 'hostId'>) => {
    addProperty(newProp);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-4xl font-sans font-black italic text-primary uppercase tracking-tighter leading-none">Hosting Requests</h1>
          <p className="text-muted-text text-[10px] font-black uppercase tracking-[3px] mt-2 opacity-60">Global Moderation Queue & Compliance Protocol</p>
        </div>
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
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-primary text-accent px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[3px] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20 flex items-center gap-2 group"
          >
            <Plus size={16} className="group-hover:rotate-90 transition-transform" /> Add Hosting
          </button>
        </div>
      </header>

      {filteredProperties.length === 0 ? (
        <div className="bg-white rounded-[48px] border border-border-misrah p-32 text-center shadow-sm">
          <div className="w-24 h-24 bg-surface rounded-[40px] flex items-center justify-center mx-auto mb-8 text-[#D4C3B5] ring-8 ring-surface/50">
            <Check size={40} />
          </div>
          <h3 className="text-2xl font-sans font-black italic text-primary uppercase tracking-tight">Queue Synchronized</h3>
          <p className="text-[10px] font-black text-muted-text/50 uppercase tracking-[4px] mt-3">{filter} moderation list is fully audited</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <AnimatePresence mode="popLayout">
            {filteredProperties.map(property => (
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
                       <p className="text-[11px] font-black text-primary italic">AED {property.price.toLocaleString()}</p>
                       <p className="text-[8px] font-black text-muted-text/40 uppercase tracking-[3px] mt-0.5">Yield</p>
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
                        Audit Node
                      </button>
                      {filter === 'Pending' && (
                         <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            updateProperty(property.id, { status: 'Approved', active: true });
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
      )}
      <AnimatePresence>
        {isModalOpen && (
          <AddListingModal 
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)} 
            onAdd={handleAddProperty}
            user={user}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
