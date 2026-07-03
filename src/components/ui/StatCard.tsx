import React from 'react';
import { motion } from 'motion/react';

export const StatCard = ({ label, value, change, icon: Icon, dark = false, onClick }: any) => (
  <motion.div 
    whileHover={{ y: -6, scale: 1.02 }}
    onClick={onClick}
    className={`relative overflow-hidden rounded-[32px] p-8 border group transition-all duration-500
      ${dark 
        ? 'bg-primary border-primary shadow-xl shadow-primary/20' 
        : 'bg-white border-border-misrah shadow-sm hover:shadow-luxury'
      } ${onClick ? 'cursor-pointer active:scale-95' : ''}`}
  >
    <div className="flex flex-col h-full relative z-10">
      <div className="flex items-center justify-between mb-6">
        <p className={`text-[10px] font-black tracking-[4px] uppercase ${dark ? 'text-white/40' : 'text-muted-text/60'}`}>{label}</p>
        <div className={`p-2.5 rounded-xl transition-all duration-500 group-hover:rotate-12 group-hover:scale-110 
          ${dark ? 'bg-white/5 text-accent' : 'bg-surface text-primary/40 group-hover:bg-accent group-hover:text-white'}`}
        >
          <Icon size={18} />
        </div>
      </div>
      
      <div className="mt-auto">
        <h3 className={`text-4xl font-sans font-black italic leading-none tracking-tighter ${dark ? 'text-accent' : 'text-primary'}`}>{value}</h3>
        <p className={`text-[11px] font-bold mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg
          ${dark 
            ? 'bg-white/5 text-white/50' 
            : (change.includes('↑') ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger')}`}>
          {change}
        </p>
      </div>
    </div>
    
    {/* Decorative background element */}
    <div className={`absolute -bottom-6 -right-6 w-32 h-32 rounded-full blur-3xl opacity-20 transition-all duration-700 group-hover:scale-150 group-hover:opacity-10
      ${dark ? 'bg-accent' : 'bg-accent-light'}`} 
    />
  </motion.div>
);
