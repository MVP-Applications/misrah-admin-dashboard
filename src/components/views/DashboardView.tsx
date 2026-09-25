import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import {
  Banknote,
  Home,
  ArrowUpRight,
  ShieldCheck,
  Star,
  MessageSquare,
  Calendar,
  MapPin,
  X,
  TrendingUp,
  CheckCircle2,
  ChevronRight,
  Globe,
  Zap
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { StatCard } from '../ui/StatCard';
import { User, Booking, Property } from '../../types';
import { listAdminProperties } from '../../features/properties/api';
import { apiPropertyToViewModel } from '../../features/properties/mappers';
import { listBookings } from '../../features/bookings/api';
import { toLegacyBooking } from '../../features/bookings/mappers';

interface DashboardViewProps {
  user: User;
}

interface GeoHubConfig {
  name: string;
  tag: string;
  img: string;
  occupancy: number;
  description: string;
  latency: string;
  coordinates: string;
  topAreas: string[];
}

export const DashboardView = ({ user }: DashboardViewProps) => {
  const navigate = useNavigate();
  const [pendingCount, setPendingCount] = useState(0);
  const [approvedCount, setApprovedCount] = useState(0);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  // Geo Hubs: real properties/bookings, grouped by city on the client.
  const [properties, setProperties] = useState<Property[]>([]);
  const [hubBookings, setHubBookings] = useState<Booking[]>([]);

  const [selectedHub, setSelectedHub] = useState<GeoHubConfig | null>(null);
  const [isFleetModalOpen, setIsFleetModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  const normalizeCity = (city?: string) => {
    if (!city) return '';
    const c = city.toLowerCase().trim();
    if (c === 'rak' || c === 'ras al khaimah') return 'Ras Al Khaimah';
    if (c === 'abu dhabi') return 'Abu Dhabi';
    if (c === 'sharjah') return 'Sharjah';
    if (c === 'dubai') return 'Dubai';
    return city;
  };

  const getCityProperties = (cityName: string) => {
    return properties.filter(p => normalizeCity(p.city) === normalizeCity(cityName));
  };

  const getCityBookings = (cityName: string) => {
    const cityProps = getCityProperties(cityName);
    const cityPropIds = new Set(cityProps.map(p => p.id));
    return hubBookings.filter(b => cityPropIds.has(b.propertyId));
  };

  const handleGoToListings = (cityName: string) => {
    showToast(`Filtering portfolio by ${cityName}`);
    navigate(cityName === 'All' ? '/listings' : `/listings?city=${encodeURIComponent(cityName)}`);
    setSelectedHub(null);
    setIsFleetModalOpen(false);
  };

  const GEO_HUBS: GeoHubConfig[] = [
    {
      name: 'Dubai',
      tag: 'Top Tier Node',
      img: '/asets/Dubai-1512.webp',
      occupancy: 94,
      description: 'Premier luxury metropolitan core featuring Downtown Burj Khalifa, Palm Jumeirah waterfront villas, and Dubai Marina duplexes.',
      latency: '12ms',
      coordinates: '25.2048° N, 55.2708° E',
      topAreas: ['Downtown Burj Khalifa', 'Palm Jumeirah', 'Dubai Marina', 'DIFC Luxury Core']
    },
    {
      name: 'Abu Dhabi',
      tag: 'Capital Flagship',
      img: '/asets/AdobeStock_46380625.webp',
      occupancy: 88,
      description: 'Federal capital sanctuaries spanning Saadiyat Island cultural retreats, Yas Island beachfront residences, and royal desert estates.',
      latency: '15ms',
      coordinates: '24.4539° N, 54.3773° E',
      topAreas: ['Saadiyat Cultural District', 'Yas Marina', 'Al Bateen Waterfront']
    },
    {
      name: 'Sharjah',
      tag: 'Culture & Coast',
      img: '/asets/Al_Qasba.jpg',
      occupancy: 82,
      description: 'The UNESCO Cultural Capital of the UAE with Al Qasba waterfront residences, historic arts quarters, and serene coastal views.',
      latency: '18ms',
      coordinates: '25.3463° N, 55.4209° E',
      topAreas: ['Al Qasba Waterfront', 'Arts & Heritage District', 'Al Majaz Canal']
    },
    {
      name: 'Ras Al Khaimah',
      tag: 'Mountain & Island',
      img: '/asets/al-marjan-island-1.webp',
      occupancy: 91,
      description: 'Ultra-luxury coastal retreats on Al Marjan Island integrated with adventure sanctuaries at the peak of Jebel Jais.',
      latency: '21ms',
      coordinates: '25.6741° N, 55.9804° E',
      topAreas: ['Al Marjan Island', 'Jebel Jais Peak', 'Al Hamra Lagoon']
    }
  ];

  useEffect(() => {
    listAdminProperties({ status: 'pending', limit: 1 }).then(r => setPendingCount(r.meta.total));
    listAdminProperties({ status: 'approved', limit: 1 }).then(r => setApprovedCount(r.meta.total));
    listBookings({ page: 1, limit: 4 }).then(r => setRecentBookings(r.data.map(toLegacyBooking)));
    listAdminProperties({ limit: 100 }).then(r => setProperties(r.data.map(apiPropertyToViewModel)));
    listBookings({ page: 1, limit: 100 }).then(r => setHubBookings(r.data.map(toLegacyBooking)));
  }, []);

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
          value={approvedCount.toString()}
          change={`${pendingCount} pending audit`}
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


      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-8 right-8 z-[120] bg-primary text-white border border-accent/40 px-6 py-3.5 rounded-2xl shadow-luxury flex items-center gap-3 backdrop-blur-md"
          >
            <div className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse" />
            <span className="text-xs font-black uppercase tracking-wider">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* GEO HUBS SECTION */}
      <div className="bg-white rounded-[40px] border border-border-misrah p-10 shadow-sm hover:shadow-luxury transition-all duration-500">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-sans font-black italic text-primary uppercase tracking-tight">Geo Hubs</h2>
            <p className="text-[10px] font-black text-muted-text/50 uppercase tracking-[4px] mt-1.5">Top performing regions</p>
          </div>
          
          {/* Active Nodes Network Fleet Pill */}
          <button 
            type="button"
            onClick={() => setIsFleetModalOpen(true)}
            className="group px-4 py-2 rounded-full border border-border-misrah hover:border-accent bg-surface hover:bg-white flex items-center gap-2.5 transition-all shadow-xs cursor-pointer active:scale-95"
            title="Inspect all 4 regional network nodes"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-success"></span>
            </span>
            <span className="text-[9px] font-black text-primary group-hover:text-accent uppercase tracking-widest transition-colors">
              Active nodes (4)
            </span>
            <ChevronRight size={12} className="text-muted-text group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
          </button>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {GEO_HUBS.map(city => {
            const cityProps = getCityProperties(city.name);
            const dynamicCount = cityProps.length;

            return (
              <div 
                key={city.name} 
                onClick={() => setSelectedHub(city)}
                className="group relative h-72 rounded-[48px] overflow-hidden cursor-pointer shadow-luxury border border-border-misrah/20 hover:border-accent/60 transition-all duration-500 hover:-translate-y-1"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter') setSelectedHub(city); }}
                title={`Click to inspect ${city.name} hub or jump to listings`}
              >
                <img 
                  src={city.img} 
                  alt={city.name} 
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
                  referrerPolicy="no-referrer" 
                />
                <div className="absolute inset-0 bg-linear-to-t from-primary via-primary/30 to-transparent flex flex-col justify-end p-8">
                  <div className="transform translate-y-2 group-hover:translate-y-0 transition-all duration-500">
                    <Badge variant="gold" className="mb-3 opacity-0 group-hover:opacity-100 transition-all duration-500 scale-90 group-hover:scale-100 origin-left">
                      {city.tag}
                    </Badge>
                    <h3 className="text-2xl font-sans font-black italic text-white tracking-tighter uppercase leading-none drop-shadow-md">
                      {city.name}
                    </h3>
                    <div className="flex items-center gap-3 mt-2 border-t border-white/15 pt-3">
                      <span className="text-[10px] font-black text-white/70 uppercase tracking-[3px]">
                        {dynamicCount} {dynamicCount === 1 ? 'PROPERTY' : 'PROPERTIES'}
                      </span>
                      
                      {/* Direct Click-through Arrow Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleGoToListings(city.name);
                        }}
                        className="w-8 h-8 rounded-full border border-white/30 hover:border-accent bg-white/10 hover:bg-accent text-white hover:text-primary flex items-center justify-center transition-all ml-auto active:scale-90"
                        title={`Filter and view all ${city.name} listings`}
                      >
                        <ArrowUpRight size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* REGIONAL HUB INSPECTOR MODAL */}
      <AnimatePresence>
        {selectedHub && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setSelectedHub(null)}
              className="absolute inset-0 bg-primary/60 backdrop-blur-md"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.94, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 20 }}
              className="relative bg-white w-full max-w-3xl rounded-[40px] shadow-2xl overflow-hidden border border-border-misrah flex flex-col max-h-[90vh]"
            >
              {/* Cover Banner */}
              <div className="relative h-56 sm:h-64 overflow-hidden shrink-0">
                <img 
                  src={selectedHub.img} 
                  alt={selectedHub.name} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-linear-to-t from-primary via-primary/40 to-transparent flex flex-col justify-between p-8">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full bg-accent/20 backdrop-blur-md border border-accent/40 text-[10px] font-black text-accent uppercase tracking-widest">
                        {selectedHub.tag}
                      </span>
                      <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-success" />
                        {selectedHub.latency}
                      </span>
                    </div>
                    <button 
                      onClick={() => setSelectedHub(null)}
                      className="w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md text-white flex items-center justify-center transition-all border border-white/20"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <div>
                    <span className="text-[10px] font-black uppercase tracking-[3px] text-white/60">United Arab Emirates</span>
                    <h2 className="text-3xl sm:text-4xl font-black italic text-white uppercase tracking-tight drop-shadow-md">
                      {selectedHub.name} Geo Hub
                    </h2>
                  </div>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-8 overflow-y-auto space-y-6 scrollbar-hide">
                <p className="text-xs sm:text-sm font-medium text-muted-text leading-relaxed">
                  {selectedHub.description}
                </p>

                {/* Regional Metrics Grid */}
                {(() => {
                  const hubProps = getCityProperties(selectedHub.name);
                  const cityBookings = getCityBookings(selectedHub.name);
                  const avgPrice = hubProps.length > 0
                    ? Math.round(hubProps.reduce((acc, p) => acc + p.price, 0) / hubProps.length)
                    : 0;
                  const totalRev = cityBookings.reduce((acc, b) => acc + b.total, 0);

                  return (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="p-4 rounded-2xl bg-surface border border-border-misrah">
                        <span className="text-[9px] font-black uppercase tracking-wider text-muted-text">Properties</span>
                        <p className="text-xl font-black italic text-primary mt-1">
                          {hubProps.length}
                        </p>
                        <span className="text-[9px] font-bold text-success flex items-center gap-1 mt-1">
                          <CheckCircle2 size={10} /> Active Node
                        </span>
                      </div>

                      <div className="p-4 rounded-2xl bg-surface border border-border-misrah">
                        <span className="text-[9px] font-black uppercase tracking-wider text-muted-text">Occupancy</span>
                        <p className="text-xl font-black italic text-primary mt-1">
                          {selectedHub.occupancy}%
                        </p>
                        <span className="text-[9px] font-bold text-accent flex items-center gap-1 mt-1">
                          <TrendingUp size={10} /> +5.2% index
                        </span>
                      </div>

                      <div className="p-4 rounded-2xl bg-surface border border-border-misrah">
                        <span className="text-[9px] font-black uppercase tracking-wider text-muted-text">Avg Daily Rate</span>
                        <p className="text-xl font-black italic text-primary mt-1">
                          {avgPrice > 0 ? `AED ${avgPrice.toLocaleString()}` : '—'}
                        </p>
                        <span className="text-[9px] font-bold text-muted-text mt-1">Per night</span>
                      </div>

                      <div className="p-4 rounded-2xl bg-surface border border-border-misrah">
                        <span className="text-[9px] font-black uppercase tracking-wider text-muted-text">Live Bookings</span>
                        <p className="text-xl font-black italic text-primary mt-1">
                          {cityBookings.length}
                        </p>
                        <span className="text-[9px] font-bold text-primary/70 mt-1">
                          {`AED ${totalRev.toLocaleString()}`}
                        </span>
                      </div>
                    </div>
                  );
                })()}

                {/* Key Sub-Locations */}
                <div className="space-y-2.5">
                  <span className="text-[10px] font-black uppercase tracking-[2px] text-muted-text/70">
                    Prime Sub-Territories & Coordinates ({selectedHub.coordinates})
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {selectedHub.topAreas.map((area, idx) => (
                      <span key={idx} className="px-3 py-1.5 rounded-xl bg-[#FCFAF8] border border-border-misrah text-[11px] font-black uppercase text-primary tracking-wider flex items-center gap-1.5">
                        <MapPin size={11} className="text-accent" />
                        {area}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Properties in this Geo Hub */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-[2px] text-primary">
                      Properties Situated In {selectedHub.name}
                    </span>
                    <button
                      onClick={() => handleGoToListings(selectedHub.name)}
                      className="text-[10px] font-black text-accent uppercase tracking-widest hover:underline flex items-center gap-1"
                    >
                      <span>Open in Listings view</span>
                      <ArrowUpRight size={12} />
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {getCityProperties(selectedHub.name).slice(0, 3).map(prop => (
                      <div 
                        key={prop.id}
                        onClick={() => handleGoToListings(selectedHub.name)}
                        className="flex items-center justify-between p-3.5 rounded-2xl border border-border-misrah hover:border-accent bg-surface/40 hover:bg-white transition-all cursor-pointer group"
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <img 
                            src={prop.image} 
                            alt={prop.name} 
                            className="w-12 h-12 rounded-xl object-cover shrink-0" 
                            referrerPolicy="no-referrer"
                          />
                          <div className="min-w-0">
                            <h4 className="text-xs font-black text-primary uppercase tracking-tight truncate group-hover:text-accent transition-colors">
                              {prop.name}
                            </h4>
                            <div className="flex items-center gap-3 text-[10px] font-bold text-muted-text mt-0.5">
                              <span>{prop.type} Retreat</span>
                              <span>·</span>
                              <span>{prop.beds} Beds</span>
                              <span>·</span>
                              <span>★ {prop.rating > 0 ? prop.rating : '5.0'}</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0 pl-3">
                          <span className="text-xs font-black text-primary italic">AED {prop.price.toLocaleString()}</span>
                          <span className="text-[9px] block text-muted-text uppercase tracking-widest">/ night</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="p-6 border-t border-border-misrah bg-surface flex flex-col sm:flex-row items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() => setSelectedHub(null)}
                  className="w-full sm:w-auto px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-muted-text hover:text-primary transition-colors"
                >
                  Close
                </button>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => {
                      navigate('/bookings');
                      setSelectedHub(null);
                    }}
                    className="flex-1 sm:flex-none px-6 py-3 rounded-2xl border border-border-misrah hover:border-accent bg-white text-primary text-[10px] font-black uppercase tracking-widest transition-all"
                  >
                    View Bookings
                  </button>

                  <button
                    type="button"
                    onClick={() => handleGoToListings(selectedHub.name)}
                    className="flex-1 sm:flex-none px-8 py-3.5 rounded-2xl bg-primary text-accent hover:opacity-95 text-[10px] font-black uppercase tracking-widest transition-all shadow-luxury flex items-center justify-center gap-2"
                  >
                    <span>Filter In Listings</span>
                    <ArrowUpRight size={14} />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FLEET GEO NODES HEALTH & STATUS MODAL */}
      <AnimatePresence>
        {isFleetModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setIsFleetModalOpen(false)}
              className="absolute inset-0 bg-primary/60 backdrop-blur-md"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden border border-border-misrah p-8 space-y-6"
            >
              <div className="flex items-center justify-between pb-4 border-b border-border-misrah">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-accent/15 flex items-center justify-center text-accent">
                    <Globe size={20} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black italic text-primary uppercase">Active Geo Nodes Status</h3>
                    <p className="text-[10px] font-bold text-muted-text uppercase tracking-widest">
                      UAE Territorial Grid Synchronization
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsFleetModalOpen(false)}
                  className="w-9 h-9 rounded-full bg-surface hover:bg-border-misrah/40 text-primary flex items-center justify-center transition-all"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {GEO_HUBS.map(hub => {
                  const hubProps = getCityProperties(hub.name);
                  const count = hubProps.length;

                  return (
                    <div 
                      key={hub.name}
                      className="p-5 rounded-3xl border border-border-misrah hover:border-accent bg-[#FCFAF8] flex flex-col justify-between transition-all group"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[9px] font-black text-accent uppercase tracking-widest bg-accent/10 px-2.5 py-0.5 rounded-full">
                            {hub.tag}
                          </span>
                          <span className="text-[9px] font-black text-success uppercase tracking-widest flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                            {hub.latency}
                          </span>
                        </div>
                        <h4 className="text-lg font-black italic text-primary uppercase tracking-tight">
                          {hub.name}
                        </h4>
                        <p className="text-[10px] font-medium text-muted-text mt-1">
                          {count} registered properties · {hub.occupancy}% occupancy
                        </p>
                      </div>

                      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border-misrah/60">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedHub(hub);
                            setIsFleetModalOpen(false);
                          }}
                          className="flex-1 py-2 px-3 rounded-xl bg-white border border-border-misrah hover:border-primary text-[9px] font-black uppercase tracking-wider text-primary text-center transition-colors"
                        >
                          Inspect Hub
                        </button>
                        <button
                          type="button"
                          onClick={() => handleGoToListings(hub.name)}
                          className="py-2 px-3 rounded-xl bg-primary text-accent hover:opacity-90 text-[9px] font-black uppercase tracking-wider flex items-center gap-1 transition-opacity"
                        >
                          <span>Filter</span>
                          <ArrowUpRight size={10} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-4 rounded-2xl bg-surface border border-border-misrah flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Zap size={18} className="text-accent" />
                  <div>
                    <p className="text-xs font-black text-primary uppercase">99.98% System Uptime Across UAE</p>
                    <p className="text-[9px] font-bold text-muted-text uppercase tracking-widest">All regional sync nodes active</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleGoToListings('All')}
                  className="px-4 py-2 rounded-xl bg-primary text-white text-[9px] font-black uppercase tracking-widest hover:opacity-90 transition-opacity"
                >
                  View All Listings
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>


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
            {recentBookings.length === 0 ? (
              <p className="p-8 text-center text-[10px] font-bold text-muted-text/50 uppercase tracking-widest">No recent bookings</p>
            ) : (
              recentBookings.map(booking => (
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
              ))
            )}
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
