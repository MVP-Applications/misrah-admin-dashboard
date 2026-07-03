import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Users, ShieldCheck, X, Upload, Trash2 } from 'lucide-react';
import { EliteHost } from '../../../types';
import { Badge } from '../../ui/Badge';

interface EliteNodesModuleProps {
  eliteHosts: EliteHost[];
  setEliteHosts: any;
}

export const EliteNodesModule = ({ eliteHosts, setEliteHosts }: EliteNodesModuleProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', avatar: '', rating: 5, properties: 0 });
  const photoInputRef = useRef<HTMLInputElement>(null);

  const handleToggleSuspended = (id: string) => {
    setEliteHosts(eliteHosts.map(h => h.id === id ? { ...h, suspended: !h.suspended } : h));
  };

  const handleSave = () => {
    setEliteHosts([...eliteHosts, { ...formData, id: 'h' + Date.now(), isElite: true }]);
    setIsModalOpen(false);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData(prev => ({ ...prev, avatar: event.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-4xl font-sans font-black italic text-primary uppercase tracking-tighter leading-none">Elite Network Nodes</h1>
          <p className="text-muted-text text-[10px] font-black uppercase tracking-[3px] mt-2 opacity-60">Verified Host Identification & Reputation Control</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-primary text-accent px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[3px] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20 flex items-center gap-2 group"
        >
          <Plus size={16} className="group-hover:rotate-90 transition-transform" /> Register Host Node
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <AnimatePresence mode="popLayout">
          {eliteHosts.map(host => (
            <motion.div 
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              key={host.id} 
              className="bg-white rounded-[48px] border border-border-misrah p-10 shadow-sm hover:shadow-luxury transition-all duration-500 relative group overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-40 h-40 bg-linear-to-bl from-accent/5 to-transparent rounded-bl-[100px] pointer-events-none" />
              
              {host.isElite && (
                <div className="absolute top-10 left-10">
                  <div className="flex items-center gap-2 px-4 py-1.5 bg-accent/10 text-accent rounded-full text-[9px] font-black uppercase tracking-widest border border-accent/20 backdrop-blur-sm">
                    <ShieldCheck size={12} className="fill-current opacity-30" />
                    <span>Elite Protocol</span>
                  </div>
                </div>
              )}

              <div className="flex flex-col items-center text-center space-y-6">
                <div className="relative group/avatar">
                  <img src={host.avatar} className="w-28 h-28 rounded-[40px] object-cover shadow-2xl border-6 border-white transition-transform duration-500 group-hover/avatar:scale-105" alt={host.name} />
                  <div className={`absolute -bottom-2 -right-2 w-8 h-8 rounded-2xl border-4 border-white flex items-center justify-center text-[12px] font-black shadow-lg ${host.suspended ? 'bg-danger text-white' : 'bg-success text-white'}`}>
                    {host.suspended ? '!' : '✓'}
                  </div>
                </div>
                
                <div className="space-y-1">
                  <h3 className="text-xl font-sans font-black italic text-primary uppercase tracking-tight">{host.name}</h3>
                  <p className="text-[10px] font-black text-muted-text/50 uppercase tracking-[4px]">Node ID: {host.id.toUpperCase()}</p>
                </div>

                <div className="grid grid-cols-2 gap-0 w-full rounded-3xl bg-surface/50 border border-border-misrah/50 overflow-hidden divide-x divide-border-misrah/50">
                  <div className="py-5 hover:bg-white transition-colors">
                    <p className="text-[9px] font-black text-muted-text/60 uppercase tracking-widest mb-1.5">Asset Hubs</p>
                    <p className="text-2xl font-sans font-black italic text-primary">{host.properties}</p>
                  </div>
                  <div className="py-5 hover:bg-white transition-colors">
                    <p className="text-[9px] font-black text-muted-text/60 uppercase tracking-widest mb-1.5">Intel Rep</p>
                    <p className="text-2xl font-sans font-black italic text-accent">{host.rating}</p>
                  </div>
                </div>

                <div className="flex gap-3 w-full pt-4">
                  <button 
                    onClick={() => handleToggleSuspended(host.id)}
                    className={`flex-1 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[2px] transition-all shadow-sm
                      ${host.suspended 
                        ? 'bg-success text-white hover:opacity-90' 
                        : 'bg-danger/5 text-danger border border-danger/10 hover:bg-danger hover:text-white'}`}
                  >
                    {host.suspended ? 'Activate' : 'Suspend'}
                  </button>
                  <button className="flex-1 px-6 py-4 bg-surface hover:bg-primary border border-transparent hover:border-primary text-muted-text hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-[2px] transition-all shadow-sm">
                    Audit
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-primary/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-white rounded-[48px] w-full max-w-lg relative z-10 p-10">
              <button onClick={() => setIsModalOpen(false)} className="absolute top-8 right-8 text-muted-text"><X size={24} /></button>
              <h2 className="text-2xl font-black italic text-primary uppercase mb-8">Register Host Node</h2>
              <div className="space-y-6">
                <div onClick={() => photoInputRef.current?.click()} className="w-32 h-32 mx-auto rounded-[32px] border-2 border-dashed border-border-misrah flex flex-col items-center justify-center cursor-pointer overflow-hidden relative group">
                  {formData.avatar ? (
                    <img src={formData.avatar} className="w-full h-full object-cover" alt="Preview" />
                  ) : (
                    <Upload className="text-[#D4C3B5]" />
                  )}
                  <input ref={photoInputRef} type="file" onChange={handlePhotoUpload} className="hidden" />
                </div>
                <input 
                  value={formData.name} 
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Full Identity Name" 
                  className="w-full bg-surface border border-border-misrah rounded-2xl px-6 py-4 text-xs font-bold"
                />
                <button onClick={handleSave} className="w-full py-5 bg-primary text-accent rounded-3xl text-[10px] font-black uppercase tracking-widest">Register Node</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
