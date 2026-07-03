import React, { useState } from 'react';
import { 
  User, 
  Settings, 
  Shield, 
  CreditCard, 
  Bell, 
  Globe, 
  Moon, 
  BookOpen, 
  HelpCircle, 
  FileText, 
  LogOut, 
  ChevronRight, 
  ArrowUpRight, 
  Plus, 
  Star, 
  History, 
  MapPin, 
  Calendar,
  Eye,
  EyeOff,
  BellRing,
  Lock,
  AppWindow,
  X,
  Image as ImageIcon,
  MessageSquare
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { User as UserType } from '../../types';

interface ProfileViewProps {
  user: UserType;
  onLogout: () => void;
}

export const ProfileView = ({ user, onLogout }: ProfileViewProps) => {
  const [activeTab, setActiveTab] = useState('main');

  const menuItems = [
    { id: 'personal', label: 'Personal Information', icon: User, desc: 'Update your contact and identity details', color: 'bg-info/10 text-info' },
    { id: 'security', label: 'Login & Security', icon: Shield, desc: 'Manage password and authenticated nodes', color: 'bg-danger/10 text-danger' },
    { id: 'payment', label: 'Payment Node', icon: CreditCard, desc: 'Secure payout methods and history', color: 'bg-success/10 text-success' },
    { id: 'notifications', label: 'Global Notifications', icon: Bell, desc: 'Critical alert preferences', color: 'bg-accent/10 text-accent' },
    { id: 'language', label: 'Language & Region', icon: Globe, desc: 'Localized experience control', color: 'bg-primary/10 text-primary' },
    { id: 'appearance', label: 'Interface Appearance', icon: Moon, desc: 'Dark / Light / High Contrast', color: 'bg-muted-text/10 text-muted-text' },
  ];

  const adminMenuItems = [
    { id: 'hosting_guide', label: 'Executive Mastery', icon: BookOpen, desc: 'Premium hosting documentation', color: 'bg-accent/15 text-accent' },
    { id: 'help', label: 'Strategic Intel Center', icon: HelpCircle, desc: 'Direct support & knowledge base', color: 'bg-primary/10 text-primary' },
    { id: 'terms', label: 'Legal Framework', icon: FileText, desc: 'Protocols & service agreements', color: 'bg-muted-text/10 text-muted-text' },
  ];

  if (activeTab === 'personal') {
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <header className="flex items-center gap-4">
          <button onClick={() => setActiveTab('main')} className="w-10 h-10 rounded-xl bg-white border border-[#F2E8DF] flex items-center justify-center hover:bg-surface transition-all text-primary">
            <ChevronRight className="rotate-180" size={20} />
          </button>
          <h1 className="text-2xl font-black italic text-primary uppercase">Personal Information</h1>
        </header>

        <div className="bg-white rounded-[40px] border border-[#F2E8DF] overflow-hidden shadow-sm">
           <div className="p-10 space-y-10">
              <div className="flex flex-col md:flex-row items-center gap-10">
                <div className="relative group">
                   <img src={user.avatar} className="w-32 h-32 rounded-[40px] object-cover shadow-2xl border-4 border-surface group-hover:scale-105 transition-all" />
                   <button className="absolute -bottom-2 -right-2 bg-primary text-accent p-3 rounded-2xl shadow-xl hover:scale-110 active:scale-95 transition-all border-4 border-white"><Plus size={16} /></button>
                </div>
                <div className="text-center md:text-left">
                   <h3 className="text-2xl font-black italic text-primary uppercase tracking-tight">{user.name}</h3>
                   <p className="text-xs font-black text-muted-text uppercase tracking-widest mt-1">Verified {user.role.toUpperCase()} Hub</p>
                   <div className="flex gap-2 justify-center md:justify-start mt-4">
                     <Badge variant="green">Verified Security</Badge>
                     <Badge variant="gold">Legacy Member</Badge>
                   </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-2">
                   <label className="text-[10px] font-black text-primary/40 uppercase tracking-[2px] ml-2">Full Identity Name</label>
                   <input className="w-full bg-[#FCFAF8] border border-border-misrah rounded-2xl px-6 py-4 text-xs font-bold focus:border-accent outline-hidden transition-all" defaultValue={user.name} />
                 </div>
                 <div className="space-y-2">
                   <label className="text-[10px] font-black text-primary/40 uppercase tracking-[2px] ml-2">Contact Email Node</label>
                   <input className="w-full bg-[#FCFAF8] border border-border-misrah rounded-2xl px-6 py-4 text-xs font-bold focus:border-accent outline-hidden transition-all" defaultValue={user.email} />
                 </div>
                 <div className="space-y-2">
                   <label className="text-[10px] font-black text-primary/40 uppercase tracking-[2px] ml-2">Verified Mobile Line</label>
                   <input className="w-full bg-[#FCFAF8] border border-border-misrah rounded-2xl px-6 py-4 text-xs font-bold focus:border-accent outline-hidden transition-all" defaultValue="+971 50 123 4567" />
                 </div>
                 <div className="space-y-2">
                   <label className="text-[10px] font-black text-primary/40 uppercase tracking-[2px] ml-2">Operations Base / City</label>
                   <select className="w-full bg-[#FCFAF8] border border-border-misrah rounded-2xl px-6 py-4 text-xs font-bold focus:border-accent outline-hidden transition-all">
                      <option>Dubai, UAE</option>
                      <option>Abu Dhabi, UAE</option>
                   </select>
                 </div>
              </div>

              <div className="pt-6">
                <button className="w-full md:w-auto px-10 py-4 bg-primary text-accent rounded-full text-[10px] font-black uppercase tracking-[3px] shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all">Synchronize Interface</button>
              </div>
           </div>
        </div>
      </div>
    );
  }

  if (activeTab === 'security') {
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <header className="flex items-center gap-4">
          <button onClick={() => setActiveTab('main')} className="w-10 h-10 rounded-xl bg-white border border-[#F2E8DF] flex items-center justify-center hover:bg-surface transition-all text-primary">
            <ChevronRight className="rotate-180" size={20} />
          </button>
          <h1 className="text-2xl font-black italic text-primary uppercase">Security Node</h1>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           <div className="bg-white rounded-[40px] border border-[#F2E8DF] p-10 space-y-8 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-danger/10 text-danger flex items-center justify-center"><Lock size={20} /></div>
                <div>
                  <h3 className="text-lg font-black italic text-primary uppercase">Identity Access</h3>
                  <p className="text-[10px] font-bold text-muted-text uppercase tracking-widest mt-0.5">Manage password protocols</p>
                </div>
              </div>
              
              <div className="space-y-4">
                 <div className="p-6 bg-surface rounded-3xl border border-border-misrah flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black text-primary/40 uppercase tracking-[1px] mb-1">Current Password</p>
                      <p className="text-xs font-bold text-primary italic">••••••••••••••</p>
                    </div>
                    <button className="text-[10px] font-black text-accent uppercase tracking-widest hover:underline">Update</button>
                 </div>
                 <div className="p-8 bg-success/5 rounded-[32px] border border-success/10 flex items-center gap-4">
                    <Shield className="text-success" size={24} />
                    <div>
                       <p className="text-xs font-black text-success uppercase italic">2FA Enabled</p>
                       <p className="text-[10px] font-medium text-success/60 leading-tight">Your account is secured with biometric verification nodes.</p>
                    </div>
                 </div>
              </div>
           </div>

           <div className="bg-white rounded-[40px] border border-[#F2E8DF] p-10 space-y-8 shadow-sm">
              <div className="flex items-center justify-between">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center"><AppWindow size={20} /></div>
                    <div>
                      <h3 className="text-lg font-black italic text-primary uppercase">Authenticated Sessions</h3>
                      <p className="text-[10px] font-bold text-muted-text uppercase tracking-widest mt-0.5">Live connections to your profile</p>
                    </div>
                 </div>
                 <button className="text-[10px] font-black text-danger uppercase tracking-widest">Logout All</button>
              </div>

              <div className="space-y-3">
                 {[
                   { device: 'MacBook Pro 16"', loc: 'Dubai, UAE', status: 'Active Node', icon: Globe },
                   { device: 'iPhone 15 Pro', loc: 'Abu Dhabi, UAE', status: 'Last sync 2h ago', icon: AppWindow },
                   { device: 'Chrome on Windows', loc: 'Sharjah, UAE', status: 'Jan 12 · 08:32', icon: Globe },
                 ].map((s, i) => (
                   <div key={i} className="flex items-center justify-between p-5 rounded-2xl hover:bg-surface transition-all">
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 rounded-xl bg-white border border-border-misrah flex items-center justify-center text-primary/40"><s.icon size={16} /></div>
                         <div>
                            <p className="text-[11px] font-black italic text-primary uppercase">{s.device}</p>
                            <p className="text-[9px] font-bold text-muted-text uppercase mt-0.5">{s.loc} · <span className={s.status.includes('Active') ? 'text-success' : ''}>{s.status}</span></p>
                         </div>
                      </div>
                      <button className="text-muted-text hover:text-danger transition-colors"><X size={14} /></button>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </div>
    );
  }

  if (activeTab === 'payment') {
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <header className="flex items-center gap-4">
          <button onClick={() => setActiveTab('main')} className="w-10 h-10 rounded-xl bg-white border border-[#F2E8DF] flex items-center justify-center hover:bg-surface transition-all text-primary">
            <ChevronRight className="rotate-180" size={20} />
          </button>
          <h1 className="text-2xl font-black italic text-primary uppercase">Payment Node</h1>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           <div className="bg-[#1A1B2E] rounded-[48px] p-10 text-white min-h-[300px] flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 rounded-full blur-3xl pointer-events-none group-hover:bg-accent/20 transition-all duration-1000" />
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center"><Shield size={20} className="text-accent" /></div>
                  <span className="text-[10px] font-black uppercase tracking-[3px] italic">Verified Treasury</span>
                </div>
                <CreditCard size={32} className="text-[#D4C3B5]/30 group-hover:text-accent transition-all duration-700" />
              </div>

              <div className="space-y-2 relative z-10">
                 <p className="text-[9px] font-black text-[#D4C3B5] uppercase tracking-[4px]">Payout Destination</p>
                 <h3 className="text-3xl font-black italic uppercase tracking-tighter">Ahmed al mansouri</h3>
                 <p className="text-xl font-black text-accent tracking-[2px]">•••• •••• •••• 4521</p>
              </div>

              <div className="flex items-center justify-between pt-8 border-t border-white/5 relative z-10">
                <div>
                   <p className="text-[8px] font-black text-[#D4C3B5] uppercase tracking-[3px]">ENBD Bank PLC</p>
                   <p className="text-[9px] font-bold text-white/50">AED Settlements (Dirhams)</p>
                </div>
                <button className="bg-white/10 hover:bg-white/20 px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-[2px] backdrop-blur-sm transition-all">Update</button>
              </div>
           </div>

           <div className="bg-white rounded-[40px] border border-[#F2E8DF] p-10 space-y-8 shadow-sm">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-success/10 text-success flex items-center justify-center"><History size={20} /></div>
                    <div>
                      <h3 className="text-lg font-black italic text-primary uppercase">Recent Settlements</h3>
                      <p className="text-[10px] font-bold text-muted-text uppercase tracking-widest mt-0.5">Cleared payout history</p>
                    </div>
                </div>
                <button className="text-[10px] font-black text-accent uppercase tracking-widest">View PDF</button>
             </div>

             <div className="space-y-2">
                {[
                  { date: 'Jan 15, 2026', amount: 4500, status: 'Success', node: 'ENBD-4521' },
                  { date: 'Dec 28, 2025', amount: 9200, status: 'Success', node: 'ENBD-4521' },
                  { date: 'Dec 12, 2025', amount: 3750, status: 'Success', node: 'ENBD-4521' },
                ].map((p, i) => (
                  <div key={i} className="group p-5 rounded-3xl border border-border-misrah bg-[#FCFAF8]/50 flex items-center justify-between hover:border-accent transition-all">
                     <div>
                       <p className="text-xs font-black italic text-primary uppercase">{p.date}</p>
                       <p className="text-[9px] font-bold text-muted-text uppercase mt-0.5">{p.node} · BATCH-{i+450}</p>
                     </div>
                     <div className="text-right">
                       <p className="text-sm font-black text-primary italic">AED {p.amount.toLocaleString()}</p>
                       <p className="text-9px text-success font-black uppercase mt-0.5">DISBURSED</p>
                     </div>
                  </div>
                ))}
             </div>
           </div>
        </div>
      </div>
    );
  }

  if (activeTab === 'notifications') {
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <header className="flex items-center gap-4">
          <button onClick={() => setActiveTab('main')} className="w-10 h-10 rounded-xl bg-white border border-[#F2E8DF] flex items-center justify-center hover:bg-surface transition-all text-primary">
            <ChevronRight className="rotate-180" size={20} />
          </button>
          <h1 className="text-2xl font-black italic text-primary uppercase">Notification Center</h1>
        </header>

        <div className="max-w-3xl space-y-6">
           {[
             { id: 'bookings', label: 'Booking Activity', desc: 'Alert me instantly when a guest makes a reservation node.', icon: Calendar, active: true },
             { id: 'security', label: 'Security Alerts', desc: 'Critical unauthorized access or password synchronization attempts.', icon: Shield, active: true },
             { id: 'payouts', label: 'Payout Processing', desc: 'Verification updates when funds leave the Misrah treasury.', icon: CreditCard, active: false },
             { id: 'reviews', label: 'Guest Feedback', desc: 'Real-time alerts for incoming sentiment and reviews.', icon: MapPin, active: true },
           ].map(n => (
             <div key={n.id} className="bg-white rounded-[40px] border border-border-misrah p-8 py-10 flex items-center justify-between shadow-sm hover:shadow-luxury transition-all">
                <div className="flex items-center gap-6">
                   <div className="w-14 h-14 rounded-[24px] bg-primary/5 text-primary flex items-center justify-center shrink-0 border border-primary/10">
                      <n.icon size={24} />
                   </div>
                   <div className="max-w-md">
                      <h4 className="text-lg font-black italic text-primary uppercase tracking-tight">{n.label}</h4>
                      <p className="text-xs font-medium text-muted-text/80 leading-relaxed mt-1">{n.desc}</p>
                   </div>
                </div>
                <button 
                  className={`w-14 h-7 rounded-full relative transition-all duration-300 shadow-inner
                    ${n.active ? 'bg-success' : 'bg-border-misrah'}`}
                >
                  <div className={`absolute top-1.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${n.active ? 'left-8' : 'left-2'}`} />
                </button>
             </div>
           ))}
        </div>
      </div>
    );
  }

  if (activeTab === 'terms') {
    return (
       <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <header className="flex items-center gap-4">
          <button onClick={() => setActiveTab('main')} className="w-10 h-10 rounded-xl bg-white border border-[#F2E8DF] flex items-center justify-center hover:bg-surface transition-all text-primary">
            <ChevronRight className="rotate-180" size={20} />
          </button>
          <h1 className="text-2xl font-black italic text-primary uppercase">Legal Framework</h1>
        </header>

        <div className="bg-white rounded-[40px] border border-border-misrah p-12 shadow-sm space-y-10 max-w-4xl">
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-border-misrah pb-10">
              <div>
                <p className="text-[10px] font-black text-accent uppercase tracking-[4px] italic">Protocol v2.4</p>
                <h3 className="text-4xl font-black italic text-primary uppercase tracking-tighter leading-none mt-2">Terms of Strategic Partnership</h3>
              </div>
              <button className="bg-primary text-accent px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[2px] shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all">Download PDF</button>
           </div>

           <div className="space-y-8 text-primary overflow-y-auto max-h-[500px] scrollbar-hide pr-4">
              {[
                { title: '1. Hospitality Standards', content: 'Hosts are expected to maintain the highest standard of luxury hospitality as defined by the Misrah Elite criteria. This includes property maintenance, cleanliness, and guest interaction nodes.' },
                { title: '2. Payout Protocols', content: 'Misrah processes payouts following a 24-hour verification window after guest check-in. All settlements are executed in UAE Dirhams (AED) via verified banking nodes.' },
                { title: '3. Strategic Compliance', content: 'All properties registered on the Misrah network must be fully compliant with local Department of Tourism and Department of Economic Development regulations.' },
                { title: '4. Integrity of Data', content: 'Protocol integrity is maintained through end-to-end encryption. Any attempt to bypass the automated booking system will result in instant node de-synchronization (suspension).' },
                { title: '5. Guest Sentiment Rights', content: 'Guest reviews represent verified platform history and can only be modified through strategic arbitration in cases of factual error or violation of the community safety framework.' },
              ].map((section, idx) => (
                <section key={idx} className="space-y-3">
                   <h4 className="text-sm font-black italic uppercase tracking-[1px]">{section.title}</h4>
                   <p className="text-xs font-medium text-muted-text/80 leading-relaxed text-justify">{section.content}</p>
                </section>
              ))}
           </div>
        </div>
       </div>
    );
  }

  if (activeTab === 'hosting_guide') {
    return (
       <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <header className="flex items-center gap-4">
          <button onClick={() => setActiveTab('main')} className="w-10 h-10 rounded-xl bg-white border border-[#F2E8DF] flex items-center justify-center hover:bg-surface transition-all text-primary">
            <ChevronRight className="rotate-180" size={20} />
          </button>
          <h1 className="text-2xl font-black italic text-primary uppercase">Hosting Guide</h1>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {[
             { title: 'The Welcome Protocol', desc: 'Crafting the perfect check-in experience for Elite guests.', icon: Star, color: 'bg-accent/10 text-accent' },
             { title: 'Visual Optimization', desc: 'How to capture high-yield gallery nodes for your property.', icon: ImageIcon, color: 'bg-info/10 text-info' },
             { title: 'Pricing Strategies', desc: 'Understanding seasonal demand and automatic rate shifts.', icon: CreditCard, color: 'bg-success/10 text-success' },
             { title: 'Inquiry Management', desc: 'Professional communication tactics for higher conversion.', icon: Bell, color: 'bg-primary/10 text-primary' },
             { title: 'Service Excellence', desc: 'Maintaining your Host Quality Score through details.', icon: Shield, color: 'bg-danger/10 text-danger' },
             { title: 'Resource Network', desc: 'Accessing local cleaning and maintenance nodes.', icon: Globe, color: 'bg-muted-text/10 text-muted-text' },
           ].map((card, i) => (
             <div key={i} className="bg-white rounded-[40px] border border-border-misrah p-8 flex flex-col justify-between hover:shadow-luxury transition-all group cursor-pointer active:scale-95">
                <div className="space-y-6">
                  <div className={`w-14 h-14 rounded-[20px] flex items-center justify-center ${card.color}`}>
                    <card.icon size={26} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black italic text-primary uppercase tracking-tight leading-tight">{card.title}</h3>
                    <p className="text-[11px] font-medium text-muted-text/80 leading-relaxed mt-2">{card.desc}</p>
                  </div>
                </div>
                <div className="mt-8 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#D4C3B5] group-hover:text-accent transition-colors">
                   Enter Guide <ArrowUpRight size={14} />
                </div>
             </div>
           ))}
        </div>
       </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <h1 className="text-4xl font-black italic text-primary">Account</h1>
        <p className="text-muted-text text-sm mt-1">Strategic profile management and configuration node</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-10">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-[#1A2B47] rounded-[40px] p-8 text-center border border-primary/10 shadow-2xl relative overflow-hidden flex flex-col items-center">
             <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-bl-full pointer-events-none" />
             <div className="relative mb-6">
               <img src={user.avatar} className="w-28 h-28 rounded-[36px] object-cover border-4 border-white/10 shadow-inner" />
               <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-xl bg-accent text-primary flex items-center justify-center shadow-lg border-2 border-[#1A2B47]">
                 <Star size={14} fill="currentColor" />
               </div>
             </div>
             <h3 className="text-2xl font-black italic text-white uppercase tracking-tight">{user.name}</h3>
             <p className="text-[10px] font-black text-accent uppercase tracking-[3px] mt-1 opacity-80">Verified Elite {user.role.toUpperCase()}</p>
             
             <div className="grid grid-cols-2 gap-4 w-full mt-8 pt-8 border-t border-white/5">
                <div>
                   <p className="text-[9px] font-black text-white/30 uppercase tracking-[2px] mb-1">Portfolio</p>
                   <p className="text-xl font-black italic text-white">12 Nodes</p>
                </div>
                <div>
                   <p className="text-[9px] font-black text-white/30 uppercase tracking-[2px] mb-1">Quality</p>
                   <p className="text-xl font-black italic text-success">4.92 ★</p>
                </div>
             </div>
          </div>

          <button 
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-3 p-6 rounded-[32px] border-2 border-danger/10 text-danger bg-danger/5 font-black uppercase text-[10px] tracking-[4px] hover:bg-danger hover:text-white transition-all shadow-xl shadow-danger/5 group"
          >
            <LogOut size={16} className="group-hover:-translate-x-1 transition-transform" />
            Terminate Session
          </button>
        </div>

        <div className="lg:col-span-2 space-y-8">
           <div className="bg-white rounded-[48px] border border-border-misrah p-10 space-y-8 shadow-sm">
              <h3 className="text-[11px] font-black uppercase tracking-[3px] text-primary/40 px-2 leading-none">Security & Preferences</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {menuItems.map(item => (
                   <button 
                    key={item.id} 
                    onClick={() => setActiveTab(item.id)}
                    className="flex flex-col items-start gap-4 p-6 rounded-[32px] border border-border-misrah hover:border-accent hover:bg-surface group transition-all text-left"
                   >
                     <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${item.color} group-hover:scale-110`}>
                        <item.icon size={22} />
                     </div>
                     <div>
                       <h4 className="text-[13px] font-black text-primary uppercase tracking-tight">{item.label}</h4>
                       <p className="text-[9px] font-medium text-muted-text mt-1 leading-relaxed">{item.desc}</p>
                     </div>
                   </button>
                 ))}
              </div>
           </div>

           <div className="bg-white rounded-[48px] border border-border-misrah p-10 space-y-8 shadow-sm">
              <h3 className="text-[11px] font-black uppercase tracking-[3px] text-primary/40 px-2 leading-none">Intelligence & Logistics</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 {adminMenuItems.map(item => (
                   <button 
                    key={item.id} 
                    onClick={() => setActiveTab(item.id)}
                    className="flex flex-col items-center gap-3 p-6 rounded-[32px] border border-border-misrah hover:border-accent transition-all text-center group"
                   >
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-1 ${item.color} group-hover:rotate-12 transition-transform`}>
                        <item.icon size={22} />
                      </div>
                      <h4 className="text-[11px] font-black text-primary uppercase tracking-tight">{item.label}</h4>
                   </button>
                 ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
