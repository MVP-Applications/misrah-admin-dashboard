import React, { useState } from 'react';
import { Routes, Route, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard,
  Calendar,
  Home,
  Layout,
  Image as ImageIcon,
  Users,
  Star,
  Banknote,
  MessageSquare,
  User,
  Settings,
  LogOut,
  Search,
  Bell,
  Sparkles,
  Compass,
  X,
  TrendingUp,
  ArrowUpRight
} from 'lucide-react';

// Types
import { User as UserType, UserRole, Property, Booking } from './types';
import type { AdminUser } from './features/auth/types';

// Experiences mock data (standalone — ported from misrah-retreats-admin,
// no backend endpoints exist for this feature yet)
import { INITIAL_EXPERIENCE_PROPERTIES } from './data/experienceProperties';

// Auth
import { AuthProvider, useAuth } from './features/auth/AuthContext';

// UI Components
import { SidebarItem } from './components/ui/SidebarItem';

// Views
import { DashboardView } from './components/views/DashboardView';
import { BookingsView } from './components/views/BookingsView';
import { PropertiesView } from './components/views/Properties';
import { PropertyDetailRoute } from './components/views/Properties/PropertyDetailRoute';
import { EarningsView } from './components/views/EarningsView';
import { MessagesView } from './components/views/MessagesView';
import { ReviewsView } from './components/views/ReviewsView';
import { ExperiencesView } from './components/views/ExperiencesView';
import { ExploreExperiencesView } from './components/views/ExploreExperiencesView';
import { ProfileView } from './components/views/ProfileView';
import { NotificationsView } from './components/views/NotificationsView';
import { SettingsView } from './components/views/SettingsView';
import { LoginView } from './components/views/LoginView';

// Admin Modules
import { CategoriesModule } from './components/views/Admin/CategoriesModule';
import { BannersModule } from './components/views/Admin/BannersModule';
import { HostingModule } from './components/views/Admin/HostingModule';
import { EliteNodesModule } from './components/views/Admin/EliteNodesModule';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'dashboard',
  '/bookings': 'bookings',
  '/listings': 'listings',
  '/admin/categories': 'categories',
  '/admin/banners': 'banners',
  '/admin/hosting': 'hosting',
  '/admin/elite-nodes': 'elite nodes',
  '/experiences': 'experiences',
  '/explore-experiences': 'guest explore',
  '/reviews': 'reviews',
  '/earnings': 'earnings',
  '/profile': 'profile',
  '/settings': 'settings',
  '/notifications': 'notifications',
  '/messages': 'messages',
};

const getPageTitle = (pathname: string) => {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  if (pathname.startsWith('/listings/')) return 'listings';
  if (pathname.startsWith('/admin/hosting/')) return 'hosting';
  return '';
};

const NotFound = () => {
  const navigate = useNavigate();
  return (
    <div className="bg-white rounded-[40px] border border-border-misrah p-16 text-center shadow-sm space-y-4">
      <h2 className="text-xl font-black italic text-primary uppercase">Page Not Found</h2>
      <p className="text-[10px] font-bold text-muted-text uppercase tracking-widest">This route does not exist</p>
      <button
        onClick={() => navigate('/dashboard')}
        className="mt-4 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[2px] bg-primary text-white hover:opacity-90 transition-all"
      >
        Return to Dashboard
      </button>
    </div>
  );
};

interface AppShellProps {
  user: UserType;
  onLogout: () => void;
}

const AppShell = ({ user, onLogout }: AppShellProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isAiOpen, setIsAiOpen] = useState(false);

  const isListingsActive = location.pathname === '/listings' || location.pathname.startsWith('/listings/');
  const isHostingActive = location.pathname === '/admin/hosting' || location.pathname.startsWith('/admin/hosting/');

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-primary text-white flex flex-col fixed inset-y-0 left-0 z-50 shadow-2xl">
        <div className="p-8 pb-6 border-b border-white/5">
          <div className="text-2xl font-sans font-black italic text-accent leading-none group cursor-pointer">
            Misrah
            <span className="inline-block w-1.5 h-1.5 bg-accent rounded-full ml-1"></span>
          </div>
          <div className="text-[9px] font-black tracking-[4px] text-white/20 uppercase mt-2 italic px-0.5">
            {user.role === 'admin' ? 'Regional / HQ' : 'Host / Portfolio'}
          </div>
        </div>

        <nav className="flex-1 px-4 py-8 space-y-10 overflow-y-auto scrollbar-hide">
          {user.role === 'admin' ? (
            <>
              <section className="space-y-1">
                <h4 className="text-[8px] font-black tracking-[4px] text-white/10 uppercase px-4 mb-4 flex items-center gap-2">
                  <span className="w-4 h-[1px] bg-white/10"></span>
                  Management
                </h4>
                <SidebarItem icon={LayoutDashboard} label="Overview" active={location.pathname === '/dashboard'} onClick={() => navigate('/dashboard')} />
                <SidebarItem icon={Calendar} label="Bookings" active={location.pathname === '/bookings'} onClick={() => navigate('/bookings')} />
                <SidebarItem icon={Home} label="Assets Queue" active={isHostingActive} onClick={() => navigate('/admin/hosting')} />
              </section>

              <section className="space-y-1">
                <h4 className="text-[8px] font-black tracking-[4px] text-white/10 uppercase px-4 mb-4 flex items-center gap-2">
                  <span className="w-4 h-[1px] bg-white/10"></span>
                  Operations
                </h4>
                <SidebarItem icon={Layout} label="Categories" active={location.pathname === '/admin/categories'} onClick={() => navigate('/admin/categories')} />
                <SidebarItem icon={ImageIcon} label="Banners" active={location.pathname === '/admin/banners'} onClick={() => navigate('/admin/banners')} />
                <SidebarItem icon={Users} label="Elite Nodes" active={location.pathname === '/admin/elite-nodes'} onClick={() => navigate('/admin/elite-nodes')} />
                <SidebarItem icon={Sparkles} label="Experiences" active={location.pathname === '/experiences'} onClick={() => navigate('/experiences')} />
                <SidebarItem icon={Compass} label="Guest Explore" active={location.pathname === '/explore-experiences'} onClick={() => navigate('/explore-experiences')} />
              </section>

              <section className="space-y-1">
                <h4 className="text-[8px] font-black tracking-[4px] text-white/10 uppercase px-4 mb-4 flex items-center gap-2">
                  <span className="w-4 h-[1px] bg-white/10"></span>
                  Analytic Hub
                </h4>
                <SidebarItem icon={Star} label="Reviews" active={location.pathname === '/reviews'} onClick={() => navigate('/reviews')} />
                <SidebarItem icon={Banknote} label="Earnings" active={location.pathname === '/earnings'} onClick={() => navigate('/earnings')} />
              </section>
            </>
          ) : (
            <>
              <section className="space-y-1">
                <h4 className="text-[8px] font-black tracking-[4px] text-white/10 uppercase px-4 mb-4 flex items-center gap-2">
                  <span className="w-4 h-[1px] bg-white/10"></span>
                  Portfolio
                </h4>
                <SidebarItem icon={LayoutDashboard} label="Overview" active={location.pathname === '/dashboard'} onClick={() => navigate('/dashboard')} />
                <SidebarItem icon={Home} label="My Listings" active={isListingsActive} onClick={() => navigate('/listings')} />
                  <SidebarItem icon={Sparkles} label="My Experiences" active={location.pathname === '/experiences'} onClick={() => navigate('/experiences')} />
                <SidebarItem icon={Calendar} label="Bookings" active={location.pathname === '/bookings'} onClick={() => navigate('/bookings')} badge="3" />
                <SidebarItem icon={Banknote} label="Earnings" active={location.pathname === '/earnings'} onClick={() => navigate('/earnings')} />
              </section>
              <section className="space-y-1">
                <h4 className="text-[8px] font-black tracking-[4px] text-white/10 uppercase px-4 mb-4 flex items-center gap-2">
                  <span className="w-4 h-[1px] bg-white/10"></span>
                  Direct Lines
                </h4>
                <SidebarItem icon={Compass} label="Guest Explore" active={location.pathname === '/explore-experiences'} onClick={() => navigate('/explore-experiences')} />
                <SidebarItem icon={MessageSquare} label="Messages" active={location.pathname === '/messages'} onClick={() => navigate('/messages')} badge="1" />
                <SidebarItem icon={Star} label="Reviews" active={location.pathname === '/reviews'} onClick={() => navigate('/reviews')} />
              </section>
            </>
          )}

          <section className="space-y-1">
            <h4 className="text-[8px] font-black tracking-[4px] text-white/10 uppercase px-4 mb-4 flex items-center gap-2">
              <span className="w-4 h-[1px] bg-white/10"></span>
              Identity
            </h4>
            <SidebarItem icon={User} label="Profile" active={location.pathname === '/profile'} onClick={() => navigate('/profile')} />
            <SidebarItem icon={Settings} label="Settings" active={location.pathname === '/settings'} onClick={() => navigate('/settings')} />
          </section>
        </nav>

        <div className="p-6 mt-auto border-t border-white/5 bg-black/10">
          <div
            onClick={onLogout}
            className="group relative flex items-center gap-4 p-3 rounded-2xl border border-white/5 hover:bg-white/5 hover:border-white/10 transition-all cursor-pointer"
          >
            <div className="relative">
              <img className="w-10 h-10 rounded-xl border border-white/10 object-cover shadow-2xl" src={user.avatar} alt="User" />
              <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-accent rounded-full border-2 border-[#1A1A2E] shadow-sm transform group-hover:scale-110 transition-transform" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-black text-white uppercase tracking-tight truncate">{user.name}</div>
              <div className="text-[8px] font-bold text-accent uppercase tracking-[2px] mt-0.5 opacity-60">Sign Out</div>
            </div>

            <div className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/5 text-white/20 group-hover:bg-accent/10 group-hover:text-accent transition-all">
              <LogOut size={14} />
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 flex flex-col min-h-screen">
        {/* Topbar */}
        <header className="sticky top-0 z-40 bg-white/70 backdrop-blur-xl border-b border-border-misrah h-20 flex items-center justify-between px-10">
          <div className="flex items-center gap-3">
            <div className="w-1 h-6 bg-accent rounded-full"></div>
            <div className="text-[11px] font-black uppercase tracking-[4px] text-primary/40 italic">
               {getPageTitle(location.pathname)}
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="relative group hidden md:block">
              <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-text/50" />
              <input
                type="text"
                placeholder="Secure search..."
                className="pl-11 pr-5 py-2.5 bg-surface/50 border border-border-misrah rounded-2xl text-[10px] w-72 focus:outline-none focus:border-accent focus:bg-white transition-all font-black uppercase tracking-widest shadow-inner"
              />
            </div>
            <div className="h-8 w-[1px] bg-border-misrah/50 mx-2"></div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/notifications')}
                className={`w-11 h-11 flex items-center justify-center rounded-2xl transition-all relative group shadow-sm ${location.pathname === '/notifications' ? 'bg-primary text-accent' : 'bg-surface border border-border-misrah hover:border-accent text-primary/60'}`}
              >
                <Bell size={18} />
                <span className="absolute top-3.5 right-3.5 w-2 h-2 bg-accent rounded-full border-2 border-white ring-4 ring-accent/10" />
              </button>
              <button
                onClick={() => setIsAiOpen(true)}
                className="w-11 h-11 flex items-center justify-center bg-surface border border-border-misrah rounded-2xl hover:border-accent text-primary/60 transition-all shadow-sm group"
              >
                <Sparkles size={18} className="group-hover:text-accent transition-colors" />
              </button>
            </div>
          </div>
        </header>

        {/* View Container */}
        <div className="flex-1 p-8 overflow-x-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* AI Concierge Panel */}
      <AnimatePresence>
        {isAiOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAiOpen(false)}
              className="fixed inset-0 bg-primary/20 backdrop-blur-sm z-[60]"
            />
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 w-full max-w-md bg-white z-[70] shadow-luxury flex flex-col"
            >
              <div className="p-8 border-b border-border-misrah flex items-center justify-between bg-[#1A2B47] text-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center text-[#1A2B47]">
                    <Sparkles size={20} className="fill-current" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-widest italic">Concierge AI</h3>
                    <p className="text-[9px] font-bold text-accent uppercase tracking-widest leading-none">Global Host Intelligence</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsAiOpen(false)}
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 transition-all flex items-center justify-center"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 p-8 overflow-y-auto space-y-6 scrollbar-hide">
                <div className="bg-[#FCFAF8] rounded-3xl p-6 border border-[#F2E8DF] relative">
                  <p className="text-xs font-bold text-[#1A2B47] leading-relaxed">
                    Marhaba, {user.name.split(' ')[0]}! I've analyzed your portfolio for today. Your occupancy rate is up 12% compared to last week. Would you like me to optimize your weekend pricing?
                  </p>
                  <div className="absolute top-0 right-0 p-2 transform translate-x-1/3 -translate-y-1/3">
                    <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-white shadow-lg">
                      <TrendingUp size={14} />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-[2px] text-[#D4C3B5]">Suggested Actions</h4>
                  <div className="grid grid-cols-1 gap-3">
                    {[
                      { icon: Banknote, label: 'Review Dynamic Pricing', desc: 'Potential +AED 2,400 revenue' },
                      { icon: MessageSquare, label: 'Reply to High-Priority', desc: '3 pending guest inquiries' },
                      { icon: Star, label: 'Analyze Recent Reviews', desc: 'Maintain your Superhost status' },
                    ].map((action, idx) => (
                      <button
                        key={idx}
                        className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-[#F2E8DF] hover:border-accent hover:shadow-sm transition-all text-left"
                      >
                        <div className="w-10 h-10 rounded-xl bg-[#F8F3F0] flex items-center justify-center text-[#1A2B47]">
                          <action.icon size={18} />
                        </div>
                        <div>
                          <div className="text-[11px] font-black uppercase text-[#1A2B47] tracking-tight">{action.label}</div>
                          <div className="text-[9px] font-bold text-[#D4C3B5] uppercase tracking-wider">{action.desc}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-8 border-t border-border-misrah bg-surface">
                <div className="relative group">
                  <input
                    type="text"
                    placeholder="Ask your concierge anything..."
                    className="w-full bg-white border border-[#F2E8DF] rounded-2xl pl-6 pr-14 py-4 text-xs font-bold focus:outline-none focus:border-accent transition-all ring-accent/5 focus:ring-4"
                  />
                  <button className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl bg-[#1A2B47] text-accent flex items-center justify-center hover:scale-105 transition-transform">
                    <ArrowUpRight size={16} />
                  </button>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

// Temporary bridge: the real backend has no `avatar` field and a DB-driven
// roleIds model (see GET/POST /admin/roles), while every existing view in
// this app still types its `user` prop as the legacy `User` shape below.
// Rather than refactor ~15 view components under a deadline, we adapt the
// real AdminUser into that legacy shape here. `role` comes from `portalRole`
// (the portal picked on the login screen) purely to render the right UI —
// everyone who authenticates via /admin/auth/login is really an admin-panel
// user, so this must NOT be used for real authorization decisions (those
// must happen server-side).
// TODO: once the Roles API is integrated, derive real role/permissions from
// `roleIds` instead of the login-screen portal choice, and consider folding
// this adapter away in favor of using AdminUser directly across views.
function toLegacyUser(admin: AdminUser, portalRole: UserRole): UserType {
  return {
    id: admin.id,
    // The API returns no display name — derive one from the email local-part.
    name: admin.email.split('@')[0],
    email: admin.email,
    role: portalRole,
    avatar: `https://i.pravatar.cc/150?u=${admin.id}`,
  };
}

const BootstrappingScreen = () => (
  <div className="min-h-screen bg-primary flex items-center justify-center">
    <div className="w-10 h-10 border-4 border-white/10 border-t-accent rounded-full animate-spin" />
  </div>
);

function AppRoutes() {
  const { status, user, portalRole, logout } = useAuth();

  // Standalone mock state for the ported Experiences feature — there is no
  // backend for this yet, so it lives here rather than behind features/*/api
  // the way properties/bookings/reviews do.
  const [experienceProperties, setExperienceProperties] = useState<Property[]>(INITIAL_EXPERIENCE_PROPERTIES);
  const [, setExperienceBookings] = useState<Booking[]>([]);
  const handleUpdatePropertyActivities = (propertyId: string, activities: Property['activities']) => {
    setExperienceProperties(prev => prev.map(p => p.id === propertyId ? { ...p, activities } : p));
  };
  const handleAddExperienceBooking = (booking: Booking) => {
    setExperienceBookings(prev => [booking, ...prev]);
  };

  if (status === 'bootstrapping') {
    return <BootstrappingScreen />;
  }

  const isAuthenticated = status === 'authenticated';
  const currentUser = user ? toLegacyUser(user, portalRole) : null;
  const handleLogout = () => {
    void logout();
  };

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginView />}
      />
      <Route
        path="/"
        element={
          isAuthenticated && currentUser
            ? <AppShell user={currentUser} onLogout={handleLogout} />
            : <Navigate to="/login" replace />
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<DashboardView user={currentUser!} />} />
        <Route path="bookings" element={<BookingsView user={currentUser!} />} />
        <Route path="listings" element={<PropertiesView user={currentUser!} />} />
        <Route path="listings/:id" element={<PropertyDetailRoute user={currentUser!} />} />
        <Route path="admin/categories" element={<CategoriesModule />} />
        <Route path="admin/banners" element={<BannersModule />} />
        <Route path="admin/hosting" element={<HostingModule user={currentUser!} />} />
        <Route path="admin/hosting/:id" element={<PropertyDetailRoute user={currentUser!} />} />
        <Route path="admin/elite-nodes" element={<EliteNodesModule />} />
        <Route path="experiences" element={<ExperiencesView user={currentUser!} properties={experienceProperties} onUpdatePropertyActivities={handleUpdatePropertyActivities} />} />
        <Route path="explore-experiences" element={<ExploreExperiencesView properties={experienceProperties} onAddBooking={handleAddExperienceBooking} />} />
        <Route path="reviews" element={<ReviewsView user={currentUser!} />} />
        <Route path="earnings" element={<EarningsView user={currentUser!} />} />
        <Route path="profile" element={<ProfileView user={currentUser!} onLogout={handleLogout} />} />
        <Route path="notifications" element={<NotificationsView />} />
        <Route path="settings" element={<SettingsView />} />
        <Route path="messages" element={<MessagesView user={currentUser!} />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
