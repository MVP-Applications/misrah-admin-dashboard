import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Calendar, ArrowUpRight, Sparkles, Banknote, Mail, Phone } from 'lucide-react';

export const SettingsView = () => {
  const [switches, setSwitches] = useState<Record<string, boolean>>({
    instant: true,
    concierge: true,
    dynamic: true,
    email: true,
    sms: true,
    payout: true
  });

  const toggle = (key: string) => setSwitches(v => ({ ...v, [key]: !v[key] }));

  const Switch = ({ active, onClick }: { active: boolean, onClick: () => void }) => (
    <button 
      onClick={onClick}
      className={`w-9 h-5 rounded-full relative transition-all duration-300 shadow-inner
        ${active ? 'bg-success' : 'bg-border-misrah/80'}`}
    >
      <motion.div 
        animate={{ x: active ? 18 : 3 }}
        className="absolute top-1 w-3 h-3 bg-white rounded-full shadow-sm" 
      />
    </button>
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-4xl font-black italic text-primary">Settings</h1>
        <p className="text-muted-text text-sm mt-1">Configure your host preferences and application defaults</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-border-misrah p-6 space-y-6 shadow-sm">
          <h2 className="text-lg font-bold italic mb-6">Listing Defaults</h2>
          {[
            { id: 'instant', label: 'Instant Booking', desc: 'Allow guests to book without manual approval', icon: Calendar },
            { id: 'early', label: 'Early Check-in Requests', desc: 'Allow guests to request arrivals before 12 PM', icon: ArrowUpRight },
            { id: 'concierge', label: 'AI Concierge', desc: 'Enable Misrah AI assistant for all properties', icon: Sparkles },
            { id: 'dynamic', label: 'Dynamic Pricing', desc: 'Smart price suggestions based on local demand', icon: Banknote },
          ].map(s => (
            <div key={s.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center text-primary"><s.icon size={16} /></div>
                <div>
                  <div className="text-[13px] font-bold">{s.label}</div>
                  <div className="text-[10px] text-muted-text font-medium">{s.desc}</div>
                </div>
              </div>
              <Switch active={switches[s.id]} onClick={() => toggle(s.id)} />
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-border-misrah p-6 space-y-6 shadow-sm">
          <h2 className="text-lg font-bold italic mb-6">Notifications</h2>
          {[
            { id: 'email', label: 'Email Alerts', desc: 'Booking confirmations and security alerts', icon: Mail },
            { id: 'sms', label: 'SMS Notifications', desc: 'Check-in reminders and high-priority messages', icon: Phone },
            { id: 'payout', label: 'Payout Updates', desc: 'Alerts when funds are transferred to your bank', icon: Banknote },
          ].map(s => (
            <div key={s.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center text-primary"><s.icon size={16} /></div>
                <div>
                  <div className="text-[13px] font-bold">{s.label}</div>
                  <div className="text-[10px] text-muted-text font-medium">{s.desc}</div>
                </div>
              </div>
              <Switch active={switches[s.id]} onClick={() => toggle(s.id)} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
