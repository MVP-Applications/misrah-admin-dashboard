import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Edit, Trash2, Image as ImageIcon, Upload, X } from 'lucide-react';
import { Banner } from '../../../types';
import { Badge } from '../../ui/Badge';

interface BannersModuleProps {
  banners: Banner[];
  setBanners: any;
}

export const BannersModule = ({ banners, setBanners }: BannersModuleProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Banner | null>(null);
  const [formData, setFormData] = useState({ title: '', image: '', link: '', active: true });
  const photoInputRef = useRef<HTMLInputElement>(null);

  const handleAddItem = () => {
    setEditingItem(null);
    setFormData({ title: '', image: '', link: '', active: true });
    setIsModalOpen(true);
  };

  const handleEditItem = (item: Banner) => {
    setEditingItem(item);
    setFormData({ title: item.title, image: item.image, link: item.link, active: item.active });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Erase this marketing node?')) {
      setBanners(banners.filter(b => b.id !== id));
    }
  };

  const handleToggleActive = (id: string) => {
    setBanners(banners.map(b => b.id === id ? { ...b, active: !b.active } : b));
  };

  const handleSave = () => {
    if (editingItem) {
      setBanners(banners.map(b => b.id === editingItem.id ? { ...b, ...formData } : b));
    } else {
      setBanners([...banners, { ...formData, id: 'bn' + Date.now() }]);
    }
    setIsModalOpen(false);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData(prev => ({ ...prev, image: event.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-4xl font-sans font-black italic text-primary uppercase tracking-tighter leading-none">Marketing Banners</h1>
          <p className="text-muted-text text-[10px] font-black uppercase tracking-[3px] mt-2 opacity-60">Global Promotional Surfaces & Direct Action Links</p>
        </div>
        <button 
          onClick={handleAddItem}
          className="bg-primary text-accent px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[3px] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20 flex items-center gap-2 group"
        >
          <Plus size={16} className="group-hover:rotate-90 transition-transform" /> Register Banner
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <AnimatePresence mode="popLayout">
          {banners.map(banner => (
            <motion.div 
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              key={banner.id} 
              className="bg-white rounded-[40px] border border-border-misrah overflow-hidden shadow-sm group hover:shadow-luxury transition-all duration-500"
            >
              <div className="h-52 relative overflow-hidden bg-surface">
                <img src={banner.image} alt={banner.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute top-6 right-6">
                  <Badge variant={banner.active ? 'primary' : 'gray'}>{banner.active ? 'Active Node' : 'Draft Mode'}</Badge>
                </div>
                <div className="absolute inset-0 bg-linear-to-t from-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="p-8">
                <div className="mb-8">
                  <p className="text-[9px] font-black text-accent uppercase tracking-[4px] mb-2 italic flex items-center gap-2">
                    <span className="w-1 h-1 bg-accent rounded-full"></span>
                    Marketing Node
                  </p>
                  <h3 className="text-lg font-sans font-black italic text-primary uppercase tracking-tight truncate mb-1">{banner.title}</h3>
                  <p className="text-[10px] font-bold text-muted-text/60 truncate uppercase tracking-widest">{banner.link}</p>
                </div>
                <div className="flex items-center justify-between pt-6 border-t border-border-misrah/50 group-hover:border-accent/20 transition-all">
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleEditItem(banner)} 
                      className="p-3 rounded-xl bg-surface text-muted-text hover:text-primary transition-all border border-transparent hover:border-border-misrah shadow-sm"
                    >
                      <Edit size={14} />
                    </button>
                    <button 
                      onClick={() => handleDelete(banner.id)} 
                      className="p-3 rounded-xl bg-danger/5 text-danger hover:bg-danger hover:text-white transition-all shadow-sm"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <button 
                    onClick={() => handleToggleActive(banner.id)}
                    className={`text-[9px] font-black uppercase tracking-[3px] px-6 py-3 rounded-xl transition-all shadow-sm
                      ${banner.active 
                        ? 'bg-primary text-accent hover:opacity-90' 
                        : 'bg-surface text-muted-text hover:bg-primary hover:text-white'}`}
                  >
                    {banner.active ? 'Offline' : 'Deploy'}
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
              <h2 className="text-2xl font-black italic text-primary uppercase mb-8">{editingItem ? 'Update' : 'New'} Banner</h2>
              <div className="space-y-6">
                <div onClick={() => photoInputRef.current?.click()} className="h-44 rounded-3xl border-2 border-dashed border-border-misrah flex flex-col items-center justify-center cursor-pointer overflow-hidden relative group">
                  {formData.image ? (
                    <img src={formData.image} className="w-full h-full object-cover opacity-50" alt="Preview" />
                  ) : (
                    <Upload className="text-[#D4C3B5]" />
                  )}
                  <span className="text-[9px] font-black uppercase tracking-widest text-[#D4C3B5] relative z-10">Upload Banner Creative</span>
                  <input ref={photoInputRef} type="file" onChange={handlePhotoUpload} className="hidden" />
                </div>
                <input 
                  value={formData.title} 
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Creative Title" 
                  className="w-full bg-surface border border-border-misrah rounded-2xl px-6 py-4 text-xs font-bold"
                />
                <input 
                  value={formData.link} 
                  onChange={e => setFormData({ ...formData, link: e.target.value })}
                  placeholder="Action Redirect (e.g., /promo/summer)" 
                  className="w-full bg-surface border border-border-misrah rounded-2xl px-6 py-4 text-xs font-bold"
                />
                <button onClick={handleSave} className="w-full py-5 bg-primary text-accent rounded-3xl text-[10px] font-black uppercase tracking-widest">Deploy Creative</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
