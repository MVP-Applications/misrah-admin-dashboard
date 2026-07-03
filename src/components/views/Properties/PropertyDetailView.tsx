import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { 
  ChevronLeft, 
  X, 
  Check, 
  Trash2, 
  Settings, 
  Save, 
  FileText, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowUpRight,
  MoreVertical,
  AlertCircle
} from 'lucide-react';
import { Badge } from '../../ui/Badge';
import { Property, User } from '../../../types';

interface PropertyDetailViewProps {
  property: Property;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<Property>) => void;
  onDelete: (id: string) => void;
  user: User;
}

export const PropertyDetailView = ({ 
  property, 
  onClose, 
  onUpdate, 
  onDelete,
  user
}: PropertyDetailViewProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [formData, setFormData] = useState({ ...property });
  const [showSecondaryMenu, setShowSecondaryMenu] = useState(false);

  useEffect(() => {
    setFormData({ ...property });
  }, [property]);

  if (!property) return null;

  const handleSave = () => {
    onUpdate(property.id, formData);
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this property?')) {
      onDelete(property.id);
    }
  };

  const toggleVisibility = () => {
    const newStatus = !property.active;
    onUpdate(property.id, { active: newStatus });
  };

  const handleStatusUpdate = (status: 'Approved' | 'Rejected') => {
    if (status === 'Rejected') {
      if (!rejectionReason) {
        setIsRejecting(true);
        return;
      }
      onUpdate(property.id, { status, active: false, rejectionReason });
      setIsRejecting(false);
    } else {
      onUpdate(property.id, { status, active: true, rejectionReason: undefined });
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[3px]">
          <button 
            onClick={onClose}
            className="text-muted-text hover:text-primary transition-colors flex items-center gap-1"
          >
            <ChevronLeft size={14} />
            Properties
          </button>
          <span className="text-muted-text/30">/</span>
          <span className="text-primary truncate max-w-[200px] font-bold italic tracking-tighter">{property.name}</span>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Primary Actions */}
          <div className="flex items-center gap-2">
            {user.role === 'admin' && (property.status === 'Pending' || !property.status) && !isRejecting && (
              <>
                <button 
                  onClick={() => setIsRejecting(true)}
                  className="px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[2px] border border-danger/20 text-danger hover:bg-danger hover:text-white transition-all flex items-center gap-2 shadow-sm"
                >
                  <X size={14} />
                  Reject
                </button>
                <button 
                  onClick={() => handleStatusUpdate('Approved')}
                  className="px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[2px] bg-success text-white hover:opacity-90 transition-all shadow-lg flex items-center gap-2"
                >
                  <Check size={14} />
                  Approve
                </button>
              </>
            )}

            {isRejecting && (
              <>
                <button 
                  onClick={() => setIsRejecting(false)}
                  className="px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[2px] border border-border-misrah hover:bg-surface transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => handleStatusUpdate('Rejected')}
                  disabled={!rejectionReason}
                  className="px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[2px] bg-danger text-white hover:opacity-90 transition-all shadow-lg flex items-center gap-2 disabled:opacity-50"
                >
                  Confirm
                </button>
              </>
            )}

            {isEditing ? (
              <div className="flex gap-2">
                <button 
                  onClick={() => setIsEditing(false)}
                  className="px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[2px] border border-border-misrah hover:bg-surface transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSave}
                  className="px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[2px] bg-primary text-white hover:opacity-90 transition-all shadow-lg flex items-center gap-2"
                >
                  <Save size={14} />
                  Save Changes
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setIsEditing(true)}
                className="px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[2px] bg-primary text-white hover:opacity-90 transition-all shadow-lg flex items-center gap-2"
              >
                <Settings size={14} />
                Edit Listing
              </button>
            )}
          </div>

          {/* Secondary Actions (Kebab Menu) */}
          {!isEditing && !isRejecting && (
            <div className="relative">
              <button 
                onClick={() => setShowSecondaryMenu(!showSecondaryMenu)}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all border
                  ${showSecondaryMenu ? 'bg-primary text-white border-primary shadow-lg' : 'bg-white text-muted-text border-border-misrah hover:border-accent hover:text-accent'}`}
              >
                <MoreVertical size={18} />
              </button>

              <AnimatePresence>
                {showSecondaryMenu && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setShowSecondaryMenu(false)} 
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-luxury border border-border-misrah p-2 z-50 overflow-hidden"
                    >
                      <button
                        onClick={() => {
                          toggleVisibility();
                          setShowSecondaryMenu(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-[2px] transition-all
                          ${property.active ? 'text-muted-text hover:bg-surface' : 'text-success hover:bg-success/5'}`}
                      >
                        <div className={`w-2 h-2 rounded-full ${property.active ? 'bg-muted-text' : 'bg-success'}`} />
                        {property.active ? 'Deactivate' : 'Activate'}
                      </button>
                      <div className="h-px bg-border-misrah my-1 mx-2" />
                      <button
                        onClick={() => {
                          handleDelete();
                          setShowSecondaryMenu(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-[2px] text-danger hover:bg-danger/5 transition-all"
                      >
                        <Trash2 size={14} />
                        Delete Asset
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-[40px] shadow-luxury border border-border-misrah overflow-hidden flex flex-col">
        {/* Hero Section: Wide, balanced image */}
        <div className="w-full h-80 relative overflow-hidden shrink-0 border-b border-border-misrah">
          <img src={property.image} alt={property.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-linear-to-t from-primary/80 via-transparent to-transparent" />
          
          <div className="absolute bottom-8 left-8 right-8 flex items-end justify-between text-white">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant={property.active ? 'green' : 'gray'}>{property.active ? 'Active' : 'Hidden'}</Badge>
                {property.status && (
                  <Badge variant={property.status === 'Approved' ? 'green' : property.status === 'Pending' ? 'gold' : 'red'}>
                    {property.status.toUpperCase()}
                  </Badge>
                )}
              </div>
              {isEditing ? (
                <div className="space-y- gap-3">
                  <input 
                    value={formData.name}
                    onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                    className="bg-white/10 backdrop-blur-md border border-white/30 text-white text-3xl font-black italic w-full rounded-xl px-4 py-2 outline-hidden focus:border-white mb-2"
                    placeholder="Property Name"
                  />
                  <div className="flex gap-2">
                    <select 
                      value={formData.city}
                      onChange={e => setFormData(p => ({ ...p, city: e.target.value }))}
                      className="flex-1 bg-white/10 backdrop-blur-md border border-white/30 text-white text-xs font-bold uppercase tracking-widest rounded-xl px-4 py-2 outline-hidden"
                    >
                      {['Dubai', 'Abu Dhabi', 'RAK', 'Sharjah'].map(c => <option key={c} value={c} className="text-primary">{c}</option>)}
                    </select>
                    <select 
                      value={formData.type}
                      onChange={e => setFormData(p => ({ ...p, type: e.target.value }))}
                      className="flex-1 bg-white/10 backdrop-blur-md border border-white/30 text-white text-xs font-bold uppercase tracking-widest rounded-xl px-4 py-2 outline-hidden"
                    >
                      {['City', 'Beach', 'Desert', 'Mountain'].map(t => <option key={t} value={t} className="text-primary">{t}</option>)}
                    </select>
                  </div>
                </div>
              ) : (
                <div>
                  <h2 className="text-4xl font-black italic leading-tight uppercase tracking-tighter">{property.name}</h2>
                  <p className="text-accent text-sm font-bold tracking-[3px] uppercase mt-1">{property.city} · {property.type}</p>
                </div>
              )}
            </div>
            
            <div className="hidden md:flex flex-col items-end gap-2 text-right">
              <span className="text-[10px] font-black uppercase tracking-[4px] opacity-60">Asset ID Tracking</span>
              <span className="font-mono text-sm opacity-90">{property.id.toUpperCase()}</span>
            </div>
          </div>
        </div>

        {/* Content Section: 2 Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 divide-x divide-border-misrah">
          {/* Main Details (2/3) */}
          <div className="lg:col-span-2 p-8 lg:p-12 space-y-12">
            
            {/* Rejection/Status Feedback */}
            {(isRejecting || (property.status === 'Rejected' && property.rejectionReason)) && (
              <div className="space-y-4">
                {isRejecting ? (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="bg-danger/5 border border-danger/20 rounded-[32px] p-8 space-y-6"
                  >
                    <div>
                      <h4 className="text-[11px] font-black uppercase tracking-[3px] text-danger mb-2">Audit Feedback Node</h4>
                      <p className="text-[11px] font-medium text-danger/60 uppercase tracking-widest leading-relaxed">A core protocol violation requires detailed feedback for synchronization.</p>
                    </div>
                    <textarea 
                      value={rejectionReason}
                      onChange={e => setRejectionReason(e.target.value)}
                      placeholder="Detail the listing violation..."
                      className="w-full bg-white border border-border-misrah rounded-2xl p-6 text-sm font-bold text-danger outline-none focus:border-danger transition-all resize-none shadow-inner"
                      rows={4}
                    />
                    <div className="flex flex-wrap gap-2">
                      {['Missing Documentation', 'Low Image Quality', 'Incomplete Specs', 'Safety Standards'].map(r => (
                        <button 
                          key={r}
                          onClick={() => setRejectionReason(r)}
                          className="px-4 py-2 bg-white border border-danger/10 rounded-full text-[10px] font-black uppercase tracking-widest text-danger/70 hover:bg-danger/10 transition-all shadow-sm"
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                ) : (
                  <div className="bg-danger/5 border border-danger/20 rounded-[32px] p-8 flex items-start gap-6">
                    <div className="w-12 h-12 rounded-2xl bg-danger/10 flex items-center justify-center text-danger shrink-0">
                      <AlertCircle size={24} />
                    </div>
                    <div>
                      <h4 className="text-[11px] font-black uppercase tracking-[3px] text-danger mb-1.5">Compliance Failure Log</h4>
                      <p className="text-base font-bold text-danger italic leading-relaxed">"{property.rejectionReason}"</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Core Specs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-surface rounded-3xl p-8 border border-border-misrah/50 group hover:bg-white transition-all shadow-sm">
                <p className="text-[10px] font-black text-muted-text/50 uppercase tracking-[2px] mb-3">Investment Yield</p>
                {isEditing ? (
                  <div className="flex items-baseline gap-2">
                    <input 
                      type="number"
                      value={formData.price}
                      onChange={e => setFormData(p => ({ ...p, price: Number(e.target.value) }))}
                      className="bg-white border border-border-misrah text-2xl font-black italic text-primary w-full rounded-xl px-4 py-2"
                    />
                    <span className="text-xs font-bold text-muted-text">AED</span>
                  </div>
                ) : (
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black italic text-primary">{property.price.toLocaleString()}</span>
                    <span className="text-[11px] font-bold text-accent uppercase tracking-widest">AED / NT</span>
                  </div>
                )}
              </div>
              <div className="bg-surface rounded-3xl p-8 border border-border-misrah/50 group hover:bg-white transition-all shadow-sm">
                <p className="text-[10px] font-black text-muted-text/50 uppercase tracking-[2px] mb-3">Bedrooms</p>
                {isEditing ? (
                  <input 
                    type="number"
                    value={formData.beds}
                    onChange={e => setFormData(p => ({ ...p, beds: Number(e.target.value) }))}
                    className="bg-white border border-border-misrah text-2xl font-black italic text-primary w-full rounded-xl px-4 py-2"
                  />
                ) : (
                  <div className="text-3xl font-black italic text-primary">{property.beds}</div>
                )}
              </div>
              <div className="bg-surface rounded-3xl p-8 border border-border-misrah/50 group hover:bg-white transition-all shadow-sm">
                <p className="text-[10px] font-black text-muted-text/50 uppercase tracking-[2px] mb-3">Bathrooms</p>
                {isEditing ? (
                  <input 
                    type="number"
                    value={formData.baths}
                    onChange={e => setFormData(p => ({ ...p, baths: Number(e.target.value) }))}
                    className="bg-white border border-border-misrah text-2xl font-black italic text-primary w-full rounded-xl px-4 py-2"
                  />
                ) : (
                  <div className="text-3xl font-black italic text-primary">{property.baths}</div>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-6">
              <h4 className="text-[11px] font-black uppercase tracking-[4px] text-muted-text">Strategic Listing Narrative</h4>
              {isEditing ? (
                <textarea 
                  value={formData.description || ''}
                  onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                  className="w-full bg-surface border border-border-misrah rounded-[32px] p-10 text-sm font-bold text-primary outline-none focus:border-accent transition-all resize-none shadow-inner"
                  rows={6}
                  placeholder="Describe the architectural and lifestyle nodes..."
                />
              ) : (
                <div className="bg-surface rounded-[40px] p-10 border border-border-misrah/30 leading-relaxed">
                  <p className="text-base font-medium text-primary/80 italic">
                    {property.description || `This prime asset in ${property.city} offers a curated experience in ${property.type} living. Designed for optimal luxury throughput, the property features advanced architectural integration across its ${property.beds}-bedroom configuration.`}
                  </p>
                </div>
              )}
            </div>

            {/* Compliance Documents */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h4 className="text-[11px] font-black uppercase tracking-[4px] text-muted-text">Legal Compliance Archive</h4>
                <button className="text-[10px] font-black text-accent uppercase tracking-widest hover:underline transition-all">Audit All Docs</button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 {[
                   { label: 'Title Deed Registry', status: 'Legally Verified', icon: FileText },
                   { label: 'Municipal License', status: 'Expires Q4 2026', icon: ShieldCheck },
                   { label: 'Tourism Operator Permit', status: 'Active Node', icon: CheckCircle2 },
                   { label: 'Asset Protection Policy', status: 'Elite Tier', icon: ShieldCheck },
                 ].map(doc => (
                   <div key={doc.label} className="p-6 rounded-[28px] bg-white border border-border-misrah flex items-center gap-5 group hover:border-accent transition-all cursor-pointer shadow-sm">
                      <div className="w-12 h-12 rounded-2xl bg-surface border border-border-misrah flex items-center justify-center text-primary group-hover:bg-accent group-hover:text-white transition-all shadow-sm">
                        <doc.icon size={20} />
                      </div>
                      <div>
                        <div className="text-sm font-black text-primary uppercase tracking-tight">{doc.label}</div>
                        <div className="text-[10px] font-bold text-muted-text uppercase tracking-widest mt-1">{doc.status}</div>
                      </div>
                      <ArrowUpRight size={16} className="ml-auto text-muted-text group-hover:text-accent transition-all" />
                   </div>
                 ))}
              </div>
            </div>
          </div>

          {/* Sidebar Info (1/3) */}
          <div className="p-8 lg:p-12 space-y-12 bg-surface/30">
            {/* Host Section */}
            <div className="space-y-6">
              <h4 className="text-[11px] font-black uppercase tracking-[4px] text-muted-text">Partner Node</h4>
              <div className="p-8 bg-white border border-border-misrah rounded-[40px] shadow-sm space-y-8">
                <div className="flex flex-col items-center text-center">
                  <div className="w-24 h-24 rounded-[32px] bg-accent/20 flex items-center justify-center text-accent font-black text-4xl mb-6 shadow-luxury">
                    {property.hostName?.charAt(0) || 'H'}
                  </div>
                  <div className="space-y-2">
                    <div className="text-[10px] font-black text-accent uppercase tracking-[4px]">Elite Contributor</div>
                    <h3 className="text-2xl font-black italic text-primary uppercase leading-tight tracking-tight">{property.hostName || 'Premier Host'}</h3>
                    <div className="text-[10px] font-bold text-muted-text uppercase tracking-widest mt-2">{property.hostId.toUpperCase()}</div>
                  </div>
                </div>
                
                <div className="pt-8 border-t border-border-misrah flex flex-col gap-3">
                  <button className="w-full py-4 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-[4px] hover:opacity-90 transition-all shadow-lg">Verify Node Profile</button>
                  <button className="w-full py-4 bg-white border border-border-misrah text-primary rounded-2xl text-[10px] font-black uppercase tracking-[4px] hover:bg-surface transition-all">Direct Intel Uplink</button>
                </div>
              </div>
            </div>

            {/* Performance Node */}
            <div className="space-y-6">
              <h4 className="text-[11px] font-black uppercase tracking-[4px] text-muted-text">Network Reputation</h4>
              <div className="p-8 bg-white border border-border-misrah rounded-[40px] shadow-sm space-y-8">
                <div className="flex flex-col items-center text-center">
                   <div className="text-[10px] font-black text-muted-text/50 uppercase tracking-[4px] mb-4">Host Quality Rating</div>
                   <div className="text-6xl font-black italic text-primary mb-2 tracking-tighter">{property.rating || '4.9'}</div>
                   <div className="flex text-accent gap-1">
                     {[...Array(5)].map((_, i) => <CheckCircle2 key={i} size={14} fill="currentColor" />)}
                   </div>
                   <div className="text-[10px] font-bold text-muted-text uppercase tracking-widest mt-4">Calculated from {property.reviews || 0} reviews</div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-8 border-t border-border-misrah">
                  <div className="bg-surface p-5 rounded-2xl text-center">
                    <p className="text-[9px] font-black text-accent uppercase tracking-widest mb-1.5">Load</p>
                    <p className="text-lg font-black italic text-primary">92.4%</p>
                  </div>
                  <div className="bg-surface p-5 rounded-2xl text-center">
                    <p className="text-[9px] font-black text-accent uppercase tracking-widest mb-1.5">Rep</p>
                    <p className="text-lg font-black italic text-primary">Elite</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
