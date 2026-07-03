import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Edit, Trash2, Layout, Upload, X } from 'lucide-react';
import { Category } from '../../../types';

interface CategoriesModuleProps {
  categories: Category[];
  setCategories: any;
}

export const CategoriesModule = ({ categories, setCategories }: CategoriesModuleProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Category | null>(null);
  const [formData, setFormData] = useState({ name: '', image: '' });
  const photoInputRef = useRef<HTMLInputElement>(null);

  const handleAddItem = () => {
    setEditingItem(null);
    setFormData({ name: '', image: '' });
    setIsModalOpen(true);
  };

  const handleEditItem = (item: Category) => {
    setEditingItem(item);
    setFormData({ name: item.name, image: item.image });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Purge this category node?')) {
      setCategories(categories.filter(c => c.id !== id));
    }
  };

  const handleSave = () => {
    if (editingItem) {
      setCategories(categories.map(c => c.id === editingItem.id ? { ...c, ...formData } : c));
    } else {
      setCategories([...categories, { ...formData, id: 'cat' + Date.now(), count: 0 }]);
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
          <h1 className="text-4xl font-sans font-black italic text-primary uppercase tracking-tighter leading-none">Asset Categories</h1>
          <p className="text-muted-text text-[10px] font-black uppercase tracking-[3px] mt-2 opacity-60">Classification Framework & Inventory Grouping</p>
        </div>
        <button 
          onClick={handleAddItem}
          className="bg-primary text-accent px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[3px] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20 flex items-center gap-2 group"
        >
          <Plus size={16} className="group-hover:rotate-90 transition-transform" /> Register Category
        </button>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <AnimatePresence mode="popLayout">
          {categories.map(cat => (
            <motion.div 
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              key={cat.id} 
              className="bg-white rounded-[40px] border border-border-misrah p-8 shadow-sm hover:shadow-luxury transition-all group text-center flex flex-col items-center"
            >
              <div className="w-24 h-24 rounded-full border-8 border-surface overflow-hidden mb-6 shadow-inner relative group-hover:scale-110 transition-transform duration-500">
                <img src={cat.image} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt={cat.name} />
                <div className="absolute inset-0 bg-accent/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <h3 className="text-base font-sans font-black italic text-primary uppercase tracking-tight">{cat.name}</h3>
              <p className="text-[10px] font-black text-accent mt-2 tracking-widest uppercase">{cat.count} GLOBAL PROPERTIES</p>
              
              <div className="flex gap-2 mt-8 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                <button 
                  onClick={() => handleEditItem(cat)} 
                  className="p-3 rounded-xl bg-surface text-muted-text hover:text-primary hover:bg-white border border-transparent hover:border-border-misrah transition-all shadow-sm"
                >
                  <Edit size={14} />
                </button>
                <button 
                  onClick={() => handleDelete(cat.id)} 
                  className="p-3 rounded-xl bg-danger/5 text-danger hover:bg-danger hover:text-white transition-all shadow-sm"
                >
                  <Trash2 size={14} />
                </button>
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
              <h2 className="text-2xl font-black italic text-primary uppercase mb-8">{editingItem ? 'Update' : 'New'} Category</h2>
              <div className="space-y-6">
                <div onClick={() => photoInputRef.current?.click()} className="h-40 rounded-3xl border-2 border-dashed border-border-misrah flex flex-col items-center justify-center cursor-pointer overflow-hidden relative group">
                  {formData.image ? (
                    <img src={formData.image} className="w-full h-full object-cover opacity-50" alt="Preview" />
                  ) : (
                    <Upload className="text-[#D4C3B5] mb-2" />
                  )}
                  <span className="text-[9px] font-black uppercase tracking-widest text-[#D4C3B5] relative z-10">Upload Category Icon</span>
                  <input ref={photoInputRef} type="file" onChange={handlePhotoUpload} className="hidden" />
                </div>
                <input 
                  value={formData.name} 
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Category Name" 
                  className="w-full bg-surface border border-border-misrah rounded-2xl px-6 py-4 text-xs font-bold"
                />
                <button onClick={handleSave} className="w-full py-5 bg-primary text-accent rounded-3xl text-[10px] font-black uppercase tracking-widest">Finalize Category</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
