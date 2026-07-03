import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { format } from 'date-fns';
import { Banknote, Home, ArrowUpRight, ShieldCheck, Star, MessageSquare, Calendar } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { StatCard } from '../ui/StatCard';
import { Property, User } from '../../types';
import { BOOKINGS } from '../../constants';

interface DashboardViewProps {
  properties: Property[];
  user: User;
}

export const DashboardView = ({ properties, user }: DashboardViewProps) => {
  const navigate = useNavigate();
  const pendingCount = properties.filter(p => !p.status || p.status === 'Pending').length;

  return (
    <div className="space-y-8">
      {user.role === 'manager' && user.verificationStatus !== 'Approved' && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-6 rounded-[32px] border flex items-center justify-between gap-6 shadow-luxury overflow-hidden relative
            ${user.verificationStatus === 'Rejected' ? 'bg-danger/5 border-danger/20' : 'bg-[#C9A84C]/5 border-[#C9A84C]/30'}`}
        >
          <div className="flex items-center gap-6 relative z-10">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl
              ${user.verificationStatus === 'Rejected' ? 'bg-danger/20 text-danger' : 'bg-accent/20 text-accent'}`}
            >
              {user.verificationStatus === 'Rejected' ? '!' : '⚠'}
            </div>
            <div>
              <h3 className="text-sm font-black text-primary uppercase italic">Compliance Protocol Required</h3>
              <p className="text-xs font-bold text-muted-text mt-1">
                {user.verificationStatus === 'Rejected' 
                  ? `Verification rejected: "${user.rejectionReason}". Please update your credentials.`
                  : "Your identity and property assets must be synchronized for market listing activation."}
              </p>
            </div>
          </div>
          <button 
            onClick={() => navigate('/listings')}
            className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-[2px] transition-all relative z-10
              ${user.verificationStatus === 'Rejected' ? 'bg-danger text-white' : 'bg-primary text-accent'}`}
          >
            Verify Identity
          </button>
          
          <div className="absolute top-0 right-0 w-32 h-32 opacity-5 pointer-events-none">
             <ShieldCheck size={128} className="text-primary" />
          </div>
        </motion.div>
      )}

      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-sans font-black italic text-primary uppercase tracking-tighter leading-[0.9]">Marhaba, {user.name.split(' ')[0]} 🌅</h1>
          <p className="text-muted-text text-[11px] font-black uppercase tracking-[4px] mt-3 opacity-60 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse"></span>
            {user.role === 'admin' 
              ? 'Unified Control Node / Global Intelligence' 
              : "Portfolio Synced / Local Operations Center"} 
            <span className="mx-2 opacity-20">|</span>
            {format(new Date(), 'EEEE, d MMMM yyyy').toUpperCase()}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            {[1, 2, 3].map(i => (
              <img key={i} className="w-8 h-8 rounded-full border-2 border-white shadow-sm" src={`https://i.pravatar.cc/150?u=${i}`} alt="Active User" />
            ))}
            <div className="w-8 h-8 rounded-full border-2 border-white bg-surface flex items-center justify-center text-[10px] font-black text-muted-text shadow-sm">+12</div>
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-primary/40 ml-1">Live in Region</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          label={user.role === 'admin' ? "Platform Revenue" : "Portfolio Earnings"} 
          value={user.role === 'admin' ? "1.2M" : "35,400"} 
          change="↑ +12.4% vs prev." 
          icon={Banknote} 
          dark 
          onClick={() => navigate('/earnings')}
        />
        <StatCard 
          label={user.role === 'admin' ? "Inventory Scope" : "Property Volume"} 
          value={properties.filter(p => p.status === 'Approved').length.toString()} 
          change={`${properties.filter(p => p.status === 'Pending').length} pending audit`} 
          icon={Home} 
          onClick={() => navigate('/listings')}
        />
        {user.role === 'admin' ? (
          <StatCard 
            label="Compliance Queue" 
            value={pendingCount.toString()} 
            change={pendingCount > 0 ? "⚠ Needs Optimization" : "✓ Nodes Synchronized"} 
            icon={ShieldCheck}
            onClick={() => navigate('/admin/hosting')}
          />
        ) : (
          <StatCard 
            label="Market Velocity" 
            value="75%" 
            change="↑ +8.2% delta" 
            icon={ArrowUpRight} 
            onClick={() => navigate('/bookings')}
          />
        )}
        <StatCard 
          label="Market Sentiment" 
          value="4.92" 
          change="↑ +2% engagement" 
          icon={Star} 
          onClick={() => navigate('/reviews')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-[40px] border border-border-misrah overflow-hidden shadow-sm hover:shadow-luxury transition-all duration-500 group">
          <div className="flex items-center justify-between p-8 border-b border-border-misrah bg-surface/30">
            <div>
              <h2 className="text-xl font-sans font-black italic text-primary uppercase">Yield Distribution</h2>
              <p className="text-[10px] font-bold text-muted-text uppercase tracking-widest mt-1">Performance matrix by asset node</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse"></span>
              <span className="text-[10px] font-black text-primary uppercase tracking-[2px]">Real-time Yield</span>
            </div>
          </div>
          <div className="p-10 space-y-8">
            {[
              { name: 'Burj View Apt.', val: 8400, percent: 82, color: 'bg-primary' },
              { name: 'Saadiyat Retreat', val: 9100, percent: 89, color: 'bg-accent' },
              { name: 'Jebel Jais Villa', val: 6500, percent: 63, color: 'bg-primary' },
              { name: 'Corniche Suites', val: 3200, percent: 31, color: 'bg-muted-text' },
              { name: 'Other Assets', val: 8200, percent: 85, color: 'bg-accent-light' },
            ].map(item => (
              <div key={item.name} className="space-y-3">
                <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-widest">
                  <span className="text-primary/60">{item.name}</span>
                  <span className="text-primary">{item.val.toLocaleString()} <span className="text-muted-text/50">AED</span></span>
                </div>
                <div className="relative w-full h-3 bg-surface rounded-full overflow-hidden shadow-inner">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${item.percent}%` }}
                    transition={{ duration: 1.5, ease: "circOut" }}
                    className={`h-full ${item.color} rounded-full relative overflow-hidden`}
                  >
                    <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
                  </motion.div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-[40px] border border-border-misrah p-8 shadow-sm hover:shadow-luxury transition-all duration-500">
           <div className="mb-8">
             <h2 className="text-xl font-sans font-black italic text-primary uppercase">Asset Classes</h2>
             <p className="text-[10px] font-bold text-muted-text uppercase tracking-widest mt-1">Portfolio diversification</p>
           </div>
           <div className="flex flex-col items-center gap-10">
             <div className="relative w-48 h-48 group">
               <svg className="w-full h-full -rotate-90 filter drop-shadow-xl" viewBox="0 0 100 100">
                 <circle cx="50" cy="50" r="42" fill="none" stroke="#f0ece5" strokeWidth="10" />
                 <circle cx="50" cy="50" r="42" fill="none" stroke="#1a1a2e" strokeWidth="10" strokeDasharray="263.8" strokeDashoffset={263.8 * (1 - 0.75)} strokeLinecap="round" className="transition-all duration-1000" />
                 <circle cx="50" cy="50" r="42" fill="none" stroke="#c9a84c" strokeWidth="10" strokeDasharray="263.8" strokeDashoffset={263.8 * (1 - 0.45)} strokeLinecap="round" style={{ transform: 'rotate(45deg)', transformOrigin: '50% 50%' }} className="transition-all duration-1000" />
               </svg>
               <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-3xl font-sans font-black italic text-primary leading-none">8</span>
                  <span className="text-[8px] font-black uppercase text-muted-text tracking-widest mt-1">Total Hubs</span>
               </div>
             </div>
             <div className="w-full space-y-4">
               {[
                 { label: 'Beachside', val: '35%', color: 'bg-accent' },
                 { label: 'Skyline', val: '30%', color: 'bg-primary' },
                 { label: 'Desert', val: '20%', color: 'bg-muted-text' },
                 { label: 'Mountain', val: '15%', color: 'bg-accent-light' },
               ].map(t => (
                 <div key={t.label} className="flex items-center justify-between">
                   <div className="flex items-center gap-3">
                     <div className={`w-2.5 h-2.5 rounded-full ${t.color} shadow-sm`} />
                     <span className="text-[11px] font-black uppercase tracking-widest text-primary/60">{t.label}</span>
                   </div>
                   <span className="text-xs font-black text-primary">{t.val}</span>
                 </div>
               ))}
             </div>
           </div>
        </div>
      </div>

      <div className="bg-white rounded-[40px] border border-border-misrah p-10 shadow-sm hover:shadow-luxury transition-all duration-500">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-sans font-black italic text-primary uppercase tracking-tight">Geo Hubs</h2>
            <p className="text-[10px] font-black text-muted-text/50 uppercase tracking-[4px] mt-1.5">Top performing regions</p>
          </div>
          <div className="px-4 py-1.5 rounded-full border border-border-misrah bg-surface flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-success"></span>
            <span className="text-[9px] font-black text-primary uppercase tracking-widest">Active nodes</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { name: 'Dubai', count: 5, img: '/asets/Dubai-1512.webp' },
            { name: 'Abu Dhabi', count: 1, img: '/asets/AdobeStock_46380625.webp' },
            { name: 'Sharjah', count: 1, img: '/asets/Al_Qasba.jpg' },
            { name: 'Ras Al Khaimah', count: 1, img: '/asets/al-marjan-island-1.webp' },
          ].map(city => (
            <div key={city.name} className="group relative h-72 rounded-[48px] overflow-hidden cursor-pointer shadow-luxury border border-border-misrah/20">
              <img src={city.img} alt={city.name} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" referrerPolicy="no-referrer" />
              <div className="absolute inset-0 bg-linear-to-t from-primary via-primary/20 to-transparent flex flex-col justify-end p-8">
                <div className="transform translate-y-2 group-hover:translate-y-0 transition-all duration-500">
                  <Badge variant="gold" className="mb-3 opacity-0 group-hover:opacity-100 transition-all duration-500 scale-90 group-hover:scale-100 origin-left">
                    Top Tier Node
                  </Badge>
                  <h3 className="text-2xl font-sans font-black italic text-white tracking-tighter uppercase leading-none">{city.name}</h3>
                  <div className="flex items-center gap-3 mt-2 border-t border-white/10 pt-3">
                    <span className="text-[10px] font-black text-white/50 uppercase tracking-[3px]">{city.count} {city.count === 1 ? 'PROPERTY' : 'PROPERTIES'}</span>
                    <div className="w-6 h-6 rounded-full border border-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all ml-auto">
                      <ArrowUpRight size={12} className="text-white" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-10">
        <div className="bg-white rounded-[40px] border border-border-misrah shadow-sm overflow-hidden hover:shadow-luxury transition-all duration-500 group">
          <div className="flex items-center justify-between p-8 border-b border-border-misrah bg-surface/30">
            <div>
              <h2 className="text-xl font-sans font-black italic text-primary uppercase">Active Ops</h2>
              <p className="text-[10px] font-bold text-muted-text uppercase tracking-widest mt-1">Live reservation tracking</p>
            </div>
            <button 
              onClick={() => navigate('/bookings')} 
              className="text-[10px] font-black text-accent uppercase tracking-widest hover:scale-105 transition-transform"
            >
              Audit All
            </button>
          </div>
          <div className="divide-y divide-border-misrah/50">
            {BOOKINGS.slice(0, 4).map(booking => (
              <div key={booking.id} className="flex items-center gap-5 p-6 hover:bg-surface/50 transition-colors cursor-pointer group/item">
                <div className="relative">
                  <img src={booking.guestAvatar} alt={booking.guestName} className="w-12 h-12 rounded-2xl object-cover shadow-sm ring-2 ring-white group-hover/item:ring-accent/20 transition-all" />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-success rounded-full border-2 border-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black text-primary uppercase tracking-tight">{booking.guestName}</p>
                  <p className="text-[10px] font-bold text-muted-text truncate uppercase tracking-widest mt-0.5">{booking.propertyName}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[11px] font-black text-primary mb-2 italic">AED {booking.total.toLocaleString()}</p>
                  <Badge variant={booking.status === 'Hosting' ? 'green' : booking.status === 'Arriving Soon' ? 'gold' : 'blue'}>
                    {booking.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-[40px] border border-border-misrah p-8 shadow-sm hover:shadow-luxury transition-all duration-500">
          <div className="mb-8">
            <h2 className="text-xl font-sans font-black italic text-primary uppercase">Intel Feed</h2>
            <p className="text-[10px] font-bold text-muted-text uppercase tracking-widest mt-1">Global event logging</p>
          </div>
          <div className="space-y-8 relative">
            <div className="absolute left-[15px] top-2 bottom-2 w-[1px] bg-border-misrah/50" />
            {[
              { icon: Star, color: 'text-accent bg-accent/10', text: '5-star review synchronized for Burj View Apt.', time: '2h ago', badge: 'High Priority' },
              { icon: Banknote, color: 'text-success bg-success/10', text: 'Payout node AED 4,500 successfully settled', time: 'Jan 15 · 08:00', badge: 'Financial' },
              { icon: Calendar, color: 'text-info bg-info/10', text: 'New booking node confirmed: Saadiyat Retreat', time: 'Jan 14 · 14:32', badge: 'Ops' },
              { icon: MessageSquare, color: 'text-primary bg-surface', text: 'Direct line established with Ahmed (Host)', time: 'Jan 13 · 10:30', badge: 'Comm' },
            ].map((activity, idx) => (
              <div key={idx} className="flex gap-5 relative z-10 group/log">
                <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center transition-all group-hover/log:scale-110 shadow-sm ${activity.color}`}>
                  <activity.icon size={14} className="fill-current opacity-60" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                     <p className="text-[10px] text-muted-text font-black uppercase tracking-widest">{activity.time}</p>
                     <span className="text-[8px] font-black uppercase bg-surface px-2 py-0.5 rounded-md text-primary/30 tracking-widest border border-border-misrah/50">{activity.badge}</span>
                  </div>
                  <p className="text-[11px] font-bold text-primary leading-relaxed opacity-80 group-hover/log:opacity-100 transition-opacity">{activity.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
