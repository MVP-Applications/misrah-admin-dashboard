import React from 'react';
import { motion } from 'motion/react';

export const SidebarItem = ({ icon: Icon, label, active, onClick, badge }: any) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3.5 px-4 py-2.5 rounded-2xl transition-all duration-300 relative group
      ${active ? 'text-accent' : 'text-white/40 hover:text-white/90 hover:bg-white/5'}`}
  >
    {active && (
      <motion.div 
        layoutId="sidebarActive"
        className="absolute inset-0 bg-white/5 border border-white/10 rounded-2xl shadow-sm shadow-black/20"
        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
      />
    )}
    
    <div className={`relative z-10 p-1.5 rounded-lg transition-colors duration-300 ${active ? 'bg-accent/10 text-accent' : 'text-inherit group-hover:text-white'}`}>
      <Icon size={18} className="shrink-0" />
    </div>
    
    <span className="relative z-10 text-[11px] font-black uppercase tracking-widest">{label}</span>
    
    {badge && (
      <span className="relative z-10 ml-auto bg-accent text-primary text-[9px] font-black px-2 py-0.5 rounded-lg shadow-sm">
        {badge}
      </span>
    )}
  </button>
);
