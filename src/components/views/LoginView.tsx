import React, { useState } from 'react';
import { Shield, ArrowRight } from 'lucide-react';
import { UserRole } from '../../types';

interface LoginViewProps {
  onLogin: (role: UserRole) => void;
}

export const LoginView = ({ onLogin }: LoginViewProps) => {
  const [role, setRole] = useState<UserRole>('admin');

  return (
    <div className="min-h-screen bg-primary flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-accent/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-accent/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />
      
      <div className="w-full max-w-sm relative z-10 text-center">
        <div className="flex flex-col items-center mb-12">
           <div className="w-20 h-20 bg-accent flex items-center justify-center rounded-[32px] shadow-2xl shadow-accent/20 mb-8">
             <Shield size={40} className="text-primary" />
           </div>
           <h1 className="text-4xl font-black italic text-white uppercase tracking-tighter leading-none mb-2">Misrah Elite</h1>
           <p className="text-[10px] font-black text-accent uppercase tracking-[4px] opacity-80">Strategic Hospitality Management</p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-10 rounded-[48px] shadow-2xl space-y-10">
           <div className="space-y-4">
             <p className="text-[10px] font-black text-white/40 uppercase tracking-[2px]">Select Operational Tier</p>
             <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => setRole('admin')}
                  className={`py-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-3
                   ${role === 'admin' ? 'bg-accent border-accent text-primary' : 'bg-white/5 border-white/10 text-white hover:border-white/20'}`}
                >
                  <Shield size={24} />
                  <span className="text-[10px] font-black uppercase tracking-widest leading-none">Admin Node</span>
                </button>
                <button 
                  onClick={() => setRole('manager')}
                  className={`py-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-3
                   ${role === 'manager' ? 'bg-accent border-accent text-primary' : 'bg-white/5 border-white/10 text-white hover:border-white/20'}`}
                >
                  <Shield size={24} className="opacity-50" />
                  <span className="text-[10px] font-black uppercase tracking-widest leading-none">Host Hub</span>
                </button>
             </div>
           </div>

           <button 
             onClick={() => onLogin(role)}
             className="w-full bg-accent text-primary py-5 rounded-[28px] text-[10px] font-black uppercase tracking-[3px] shadow-2xl shadow-accent/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 group"
           >
             Initialize Interface
             <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
           </button>
        </div>

        <p className="mt-12 text-[9px] font-bold text-white/30 uppercase tracking-[2px]">Secure encrypted connection active · Production protocol v2.4</p>
      </div>
    </div>
  );
};
