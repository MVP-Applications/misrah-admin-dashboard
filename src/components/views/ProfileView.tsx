import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  MessageSquare,
  Check,
  CheckCircle2,
  Copy,
  QrCode,
  Smartphone,
  Fingerprint,
  KeyRound,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { User as UserType } from '../../types';
import { AppearanceNodeView } from './Profile/AppearanceNodeView';

interface SessionItem {
  id: string;
  device: string;
  loc: string;
  status: string;
  iconType: 'globe' | 'app';
  isCurrent?: boolean;
}

interface ProfileViewProps {
  user: UserType;
  onLogout: () => void;
}

export const ProfileView = ({ user, onLogout }: ProfileViewProps) => {
  const [activeTab, setActiveTab] = useState('main');

  // Notification banner
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  // Authenticated Sessions State
  const [sessions, setSessions] = useState<SessionItem[]>([
    { id: '1', device: 'MacBook Pro 16"', loc: 'Dubai, UAE', status: 'Active Node', iconType: 'globe', isCurrent: true },
    { id: '2', device: 'iPhone 15 Pro', loc: 'Abu Dhabi, UAE', status: 'Last sync 2h ago', iconType: 'app' },
    { id: '3', device: 'Chrome on Windows', loc: 'Sharjah, UAE', status: 'Jan 12 · 08:32', iconType: 'globe' },
  ]);

  // Logout All confirmation modal
  const [isLogoutAllModalOpen, setIsLogoutAllModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Password Modal State
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordStrengthEnforced, setPasswordStrengthEnforced] = useState(true);

  // 2FA & Authenticator State
  const [isTwoFactorEnabled, setIsTwoFactorEnabled] = useState(true);
  const [twoFactorType, setTwoFactorType] = useState<'authenticator' | 'biometric'>('authenticator');
  const [isAuthenticatorModalOpen, setIsAuthenticatorModalOpen] = useState(false);
  const [totpCode, setTotpCode] = useState('');
  const [totpError, setTotpError] = useState('');
  const [copiedSecret, setCopiedSecret] = useState(false);
  const authenticatorSecret = 'JBSWY3DPEHPK3PXP';

  const [payoutDestination, setPayoutDestination] = useState({
    accountHolder: 'Ahmed al mansouri',
    accountNumber: '•••• •••• •••• 4521',
    iban: 'AE03 0260 0010 4521 8892 01',
    bankName: 'ENBD Bank PLC',
    currency: 'AED Settlements (Dirhams)',
  });

  // Language state
  const [selectedLanguage, setSelectedLanguage] = useState('en');

  // Payment Node: Update Destination modal
  const [isUpdatePaymentOpen, setIsUpdatePaymentOpen] = useState(false);
  // Form State for Destination Update
  const [editBankName, setEditBankName] = useState(payoutDestination.bankName);
  const [editAccountHolder, setEditAccountHolder] = useState(payoutDestination.accountHolder);
  const [editIban, setEditIban] = useState(payoutDestination.iban);
  const [editCurrency, setEditCurrency] = useState(payoutDestination.currency);

  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 3500);
  };

  // Authenticator verification submit
  const handleVerifyTotp = (e: React.FormEvent) => {
    e.preventDefault();
    if (totpCode.trim().length !== 6) {
      setTotpError('Please enter a valid 6-digit authentication code.');
      return;
    }
    setTotpError('');
    setIsTwoFactorEnabled(true);
    setTwoFactorType('authenticator');
    setIsAuthenticatorModalOpen(false);
    setTotpCode('');
    showToast('Authenticator app configured & 2FA enabled successfully!');
  };

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

  // Remove individual session
  const handleRemoveSession = (id: string, deviceName: string) => {
    setSessions(prev => prev.filter(s => s.id !== id));
    showToast(`Session for ${deviceName} revoked.`);
  };

  // Logout All Handlers
  const handleConfirmLogoutAll = () => {
    setIsLoggingOut(true);
    showToast('Terminating all active sessions and logging out...');
    setTimeout(() => {
      setSessions([]);
      setIsLoggingOut(false);
      setIsLogoutAllModalOpen(false);
      if (onLogout) {
        onLogout();
      }
    }, 800);
  };

  // Password Validation
  const hasMinLength = newPassword.length >= 8;
  const hasNumber = /\d/.test(newPassword);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);
  const hasMatch = newPassword.length > 0 && newPassword === confirmPassword;

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!currentPassword) {
      setPasswordError('Please enter your current password.');
      return;
    }

    if (passwordStrengthEnforced) {
      if (!hasMinLength || !hasNumber || !hasSpecial) {
        setPasswordError('New password must have at least 8 characters, 1 number, and 1 special symbol.');
        return;
      }
    } else {
      if (newPassword.length < 4) {
        setPasswordError('New password must be at least 4 characters long.');
        return;
      }
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }

    setIsUpdatingPassword(true);
    setTimeout(() => {
      setIsUpdatingPassword(false);
      setPasswordSuccess('Password protocol successfully updated.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setIsPasswordModalOpen(false);
        setPasswordSuccess('');
        showToast('Password updated and synchronized.');
      }, 1000);
    }, 600);
  };

  // Floating toast for tabs whose header has no inline toast slot.
  const floatingToast = (
    <AnimatePresence>
      {notification && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          className="fixed top-8 right-8 z-[150] bg-primary text-white border border-accent/40 px-6 py-3.5 rounded-2xl shadow-luxury flex items-center gap-3 backdrop-blur-md"
        >
          <div className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse" />
          <span className="text-xs font-black uppercase tracking-wider">{notification.message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (activeTab === 'language') {
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {floatingToast}
        <header className="flex items-center gap-4">
          <button 
            onClick={() => setActiveTab('main')} 
            className="w-10 h-10 rounded-xl bg-white border border-[#F2E8DF] flex items-center justify-center hover:bg-surface transition-all text-primary cursor-pointer active:scale-95"
          >
            <ChevronRight className="rotate-180" size={20} />
          </button>
          <h1 className="text-2xl font-black italic text-primary uppercase">Language & Region</h1>
        </header>

        <div className="bg-white rounded-[40px] border border-border-misrah p-10 max-w-2xl space-y-8 shadow-sm">
          <div className="space-y-4">
            <label className="text-[10px] font-black text-primary/40 uppercase tracking-[2px]">Primary Interface Language</label>
            <div className="grid grid-cols-2 gap-4">
              {[
                { code: 'en', name: 'English (UK / US)', native: 'English' },
                { code: 'ar', name: 'Arabic (UAE Regional)', native: 'العربية' },
              ].map(lang => (
                <div 
                  key={lang.code} 
                  onClick={() => {
                    setSelectedLanguage(lang.code);
                    showToast(`Language switched to ${lang.name}`);
                  }}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer ${selectedLanguage === lang.code ? 'border-accent bg-accent/5' : 'border-border-misrah hover:border-accent'}`}
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-black text-primary uppercase">{lang.name}</h4>
                    {selectedLanguage === lang.code && <Check size={14} className="text-accent" />}
                  </div>
                  <p className="text-xs text-muted-text mt-1">{lang.native}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black text-primary/40 uppercase tracking-[2px]">Operating Currency & Format</label>
            <div className="p-5 rounded-2xl bg-surface/60 border border-border-misrah flex items-center justify-between">
              <div>
                <h4 className="text-xs font-black text-primary uppercase">United Arab Emirates Dirham (AED)</h4>
                <p className="text-[10px] text-muted-text mt-0.5">Primary currency for valuations & payouts</p>
              </div>
              <Badge variant="gold">Standard</Badge>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (activeTab === 'appearance') {
    return (
      <>
        {floatingToast}
        <AppearanceNodeView
          onBack={() => setActiveTab('main')}
          showToast={showToast}
        />
      </>
    );
  }

  if (activeTab === 'help') {
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {floatingToast}
        <header className="flex items-center gap-4">
          <button 
            onClick={() => setActiveTab('main')} 
            className="w-10 h-10 rounded-xl bg-white border border-[#F2E8DF] flex items-center justify-center hover:bg-surface transition-all text-primary cursor-pointer active:scale-95"
            title="Back to Profile"
          >
            <ChevronRight className="rotate-180" size={20} />
          </button>
          <h1 className="text-2xl font-black italic text-primary uppercase">Strategic Intel Center</h1>
        </header>

        <div className="bg-white rounded-[40px] border border-border-misrah p-10 max-w-3xl space-y-6 shadow-sm">
          <h3 className="text-lg font-black italic text-primary uppercase">Direct Support & Intel Uplink</h3>
          <p className="text-xs text-muted-text leading-relaxed">
            Priority concierge and technical protocol assistance for verified luxury hosts and administrators.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
            <div className="p-6 rounded-3xl bg-surface/60 border border-border-misrah space-y-3">
              <h4 className="text-xs font-black text-primary uppercase">Executive WhatsApp Concierge</h4>
              <p className="text-[10px] text-muted-text">+971 4 800 MISRAH (Verified VIP Hotline)</p>
              <a 
                href="https://wa.me/9714800647724"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => showToast('Opening WhatsApp Concierge (+971 4 800 MISRAH)...')}
                className="text-[9px] font-black uppercase text-accent tracking-wider hover:underline cursor-pointer inline-flex items-center gap-1"
              >
                <span>Connect Hotline →</span>
              </a>
            </div>
            <div className="p-6 rounded-3xl bg-surface/60 border border-border-misrah space-y-3">
              <h4 className="text-xs font-black text-primary uppercase">Operations Telegram Channel</h4>
              <p className="text-[10px] text-muted-text">@MisrahEliteConcierge (Encrypted Relay)</p>
              <a 
                href="https://t.me/MisrahEliteConcierge"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => showToast('Opening Telegram Relay (@MisrahEliteConcierge)...')}
                className="text-[9px] font-black uppercase text-accent tracking-wider hover:underline cursor-pointer inline-flex items-center gap-1"
              >
                <span>Open Telegram Relay →</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => setActiveTab('main')} className="w-10 h-10 rounded-xl bg-white border border-[#F2E8DF] flex items-center justify-center hover:bg-surface transition-all text-primary">
              <ChevronRight className="rotate-180" size={20} />
            </button>
            <h1 className="text-2xl font-black italic text-primary uppercase">Security Node</h1>
          </div>

      {/* Global Toast */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-primary text-white border border-accent/40 px-4 py-2 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold"
          >
            <CheckCircle2 size={15} className="text-accent" />
            <span>{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
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
                 {/* Current Password Box */}
                 <div className="p-6 bg-surface rounded-3xl border border-border-misrah flex items-center justify-between">
                   <div>
                     <p className="text-[10px] font-black text-primary/40 uppercase tracking-[1px] mb-1">
                       Current Password
                     </p>
                     <p className="text-xs font-bold text-primary italic font-mono tracking-widest">
                       ••••••••••••••
                     </p>
                   </div>
                   <button 
                     type="button"
                     onClick={() => setIsPasswordModalOpen(true)}
                     className="text-[10px] font-black text-accent uppercase tracking-widest hover:underline cursor-pointer px-2 py-1 rounded-lg hover:bg-accent/5 transition-all"
                   >
                     Update
                   </button>
                 </div>
                 {/* 2FA / Authenticator Box */}
                 <div className={`p-7 rounded-[32px] border transition-all space-y-3 ${isTwoFactorEnabled ? 'bg-success/5 border-success/15' : 'bg-surface/60 border-border-misrah'}`}>
                   <div className="flex items-center justify-between">
                     <div className="flex items-center gap-3.5">
                       <Shield className={isTwoFactorEnabled ? 'text-success' : 'text-muted-text'} size={24} />
                       <div>
                         <div className="flex items-center gap-2">
                           <p className={`text-xs font-black uppercase italic ${isTwoFactorEnabled ? 'text-success' : 'text-muted-text'}`}>
                             {isTwoFactorEnabled 
                               ? (twoFactorType === 'authenticator' ? '2FA Enabled (Authenticator)' : '2FA Enabled (Biometric)') 
                               : '2FA Disabled'}
                           </p>
                           <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${isTwoFactorEnabled ? 'bg-success/15 text-success' : 'bg-muted-text/15 text-muted-text'}`}>
                             {isTwoFactorEnabled ? 'Active' : 'Off'}
                           </span>
                         </div>
                         <p className="text-[10px] font-medium text-muted-text mt-0.5 leading-tight">
                           {isTwoFactorEnabled 
                             ? (twoFactorType === 'authenticator' 
                                 ? 'Your account is secured with Google Authenticator / TOTP codes.' 
                                 : 'Your account is secured with biometric verification nodes.')
                             : 'Add Authenticator app or biometric nodes for secondary verification.'}
                         </p>
                       </div>
                     </div>

                     {/* Quick Toggle / Setup Action */}
                     <div className="flex items-center gap-2">
                       <button
                         type="button"
                         onClick={() => setIsAuthenticatorModalOpen(true)}
                         className="text-[9px] font-black text-accent uppercase tracking-widest hover:underline cursor-pointer px-2.5 py-1.5 rounded-xl border border-accent/20 bg-white hover:bg-accent hover:text-white transition-all shadow-xs"
                         title="Setup or Reconfigure Authenticator"
                       >
                         Configure Authenticator
                       </button>
                     </div>
                   </div>

                   {/* Sub Action row */}
                   <div className="pt-2 border-t border-border-misrah/40 flex items-center justify-between text-[9px] font-bold">
                     <div className="flex items-center gap-3">
                       <button
                         type="button"
                         onClick={() => {
                           setTwoFactorType('authenticator');
                           setIsTwoFactorEnabled(true);
                           showToast('Switched to Authenticator App verification.');
                         }}
                         className={`cursor-pointer hover:underline flex items-center gap-1 ${twoFactorType === 'authenticator' && isTwoFactorEnabled ? 'text-success font-black' : 'text-muted-text'}`}
                       >
                         <Smartphone size={11} />
                         <span>Authenticator App</span>
                       </button>
                       <span className="text-muted-text/40">·</span>
                       <button
                         type="button"
                         onClick={() => {
                           setTwoFactorType('biometric');
                           setIsTwoFactorEnabled(true);
                           showToast('Switched to Biometric Passkey verification.');
                         }}
                         className={`cursor-pointer hover:underline flex items-center gap-1 ${twoFactorType === 'biometric' && isTwoFactorEnabled ? 'text-success font-black' : 'text-muted-text'}`}
                       >
                         <Fingerprint size={11} />
                         <span>Biometric Passkey</span>
                       </button>
                     </div>

                     <button
                       type="button"
                       onClick={() => {
                         const next = !isTwoFactorEnabled;
                         setIsTwoFactorEnabled(next);
                         showToast(next ? 'Two-Factor Authentication enabled.' : 'Two-Factor Authentication disabled.', next ? 'success' : 'info');
                       }}
                       className={`uppercase tracking-wider cursor-pointer hover:underline ${isTwoFactorEnabled ? 'text-danger' : 'text-success font-black'}`}
                     >
                       {isTwoFactorEnabled ? 'Disable 2FA' : 'Enable 2FA'}
                     </button>
                   </div>
                 </div>
              </div>
           </div>

           <div className="bg-white rounded-[40px] border border-[#F2E8DF] p-10 space-y-8 shadow-sm flex flex-col justify-between">
             <div className="space-y-6">
               <div className="flex items-center justify-between">
                 <div className="flex items-center gap-4">
                   <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                     <AppWindow size={20} />
                   </div>
                   <div>
                     <h3 className="text-lg font-black italic text-primary uppercase tracking-tight">Authenticated Sessions</h3>
                     <p className="text-[10px] font-bold text-muted-text uppercase tracking-widest mt-0.5">
                       Live connections to your profile
                     </p>
                   </div>
                 </div>

                 {/* LOGOUT ALL BUTTON */}
                 <button 
                   type="button"
                   onClick={() => setIsLogoutAllModalOpen(true)}
                   className="text-[10px] font-black text-danger uppercase tracking-widest hover:underline hover:scale-105 active:scale-95 transition-all cursor-pointer px-3 py-1.5 rounded-xl hover:bg-danger/10"
                 >
                   Logout All
                 </button>
               </div>

               {/* Sessions List */}
               {sessions.length === 0 ? (
                 <div className="p-8 text-center rounded-3xl border border-dashed border-border-misrah bg-surface/30 space-y-3">
                   <div className="w-10 h-10 rounded-xl bg-danger/10 text-danger flex items-center justify-center mx-auto">
                     <LogOut size={16} />
                   </div>
                   <p className="text-xs font-black uppercase text-primary">All Sessions Logged Out</p>
                   <p className="text-[10px] text-muted-text leading-relaxed">
                     Every device connection has been terminated.
                   </p>
                   {onLogout && (
                     <button
                       type="button"
                       onClick={onLogout}
                       className="px-5 py-2 rounded-xl bg-primary text-accent text-[10px] font-black uppercase tracking-wider hover:scale-105 transition-all cursor-pointer"
                     >
                       Go to Login
                     </button>
                   )}
                 </div>
               ) : (
                 <div className="space-y-3">
                   {sessions.map((s) => {
                     const Icon = s.iconType === 'globe' ? Globe : AppWindow;
                     return (
                       <div 
                         key={s.id} 
                         className="flex items-center justify-between p-5 rounded-2xl hover:bg-surface transition-all group"
                       >
                         <div className="flex items-center gap-4">
                           <div className="w-10 h-10 rounded-xl bg-white border border-border-misrah flex items-center justify-center text-primary/40 group-hover:border-accent transition-colors">
                             <Icon size={16} />
                           </div>
                           <div>
                             <p className="text-[11px] font-black italic text-primary uppercase">{s.device}</p>
                             <p className="text-[9px] font-bold text-muted-text uppercase mt-0.5">
                               {s.loc} · <span className={s.status.includes('Active') ? 'text-success font-black' : ''}>{s.status}</span>
                             </p>
                           </div>
                         </div>
                         <button 
                           type="button"
                           onClick={() => handleRemoveSession(s.id, s.device)}
                           title={`Terminate ${s.device}`}
                           className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-text hover:text-danger hover:bg-danger/10 transition-colors cursor-pointer"
                         >
                           <X size={14} />
                         </button>
                       </div>
                     );
                   })}
                 </div>
               )}
             </div>

             <div className="pt-4 border-t border-border-misrah/60 flex items-center justify-between text-[10px] text-muted-text font-bold">
               <span className="uppercase tracking-wider">Active Fleet Count</span>
               <span className="font-mono text-primary">{sessions.length} Device{sessions.length === 1 ? '' : 's'}</span>
             </div>
           </div>
        </div>

        {/* AUTHENTICATOR SETUP MODAL */}
        <AnimatePresence>
          {isAuthenticatorModalOpen && (
            <div className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-primary/70 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white rounded-[36px] border border-border-misrah p-8 md:p-10 max-w-md w-full shadow-2xl space-y-6 relative overflow-hidden"
              >
                <div className="flex items-center justify-between border-b border-border-misrah pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-accent/15 text-accent flex items-center justify-center">
                      <QrCode size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-black italic text-primary uppercase">Authenticator Setup</h3>
                      <p className="text-[9px] font-bold text-muted-text uppercase tracking-widest">
                        Google Authenticator / 1Password / Authy
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAuthenticatorModalOpen(false)}
                    className="w-8 h-8 rounded-full bg-surface flex items-center justify-center text-muted-text hover:text-primary transition-colors cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                </div>

                {/* QR Code Mock Preview */}
                <div className="text-center space-y-3">
                  <div className="w-44 h-44 mx-auto p-3 bg-white rounded-2xl border-2 border-dashed border-border-misrah shadow-inner flex flex-col items-center justify-center space-y-2">
                    <QrCode size={110} className="text-primary" />
                    <span className="text-[8px] font-mono text-muted-text uppercase tracking-widest">Scan in Authenticator</span>
                  </div>
                  <p className="text-[11px] text-muted-text leading-tight px-4">
                    Scan this QR code with your authenticator app, or manually enter the key below:
                  </p>
                </div>

                {/* Secret Key with Copy */}
                <div className="p-3 bg-surface rounded-2xl border border-border-misrah flex items-center justify-between">
                  <div className="font-mono text-xs font-bold text-primary tracking-widest">
                    {authenticatorSecret}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(authenticatorSecret);
                      setCopiedSecret(true);
                      setTimeout(() => setCopiedSecret(false), 2000);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-white border border-border-misrah text-[9px] font-black uppercase tracking-wider text-primary hover:border-accent flex items-center gap-1 cursor-pointer transition-all"
                  >
                    {copiedSecret ? <Check size={12} className="text-success" /> : <Copy size={12} className="text-accent" />}
                    <span>{copiedSecret ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                {/* Verification Code Form */}
                <form onSubmit={handleVerifyTotp} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-text block">
                      Enter 6-digit Code from Authenticator:
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={totpCode}
                      onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="123456"
                      className="w-full bg-[#FCFAF8] border border-border-misrah rounded-2xl px-4 py-3 text-center text-lg font-mono font-bold tracking-widest text-primary outline-none focus:border-accent"
                    />
                    {totpError && (
                      <p className="text-[10px] font-bold text-danger">{totpError}</p>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsAuthenticatorModalOpen(false)}
                      className="px-5 py-2.5 rounded-xl border border-border-misrah text-muted-text text-[10px] font-black uppercase tracking-wider hover:bg-surface cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 rounded-xl bg-primary text-accent text-[10px] font-black uppercase tracking-wider hover:scale-105 active:scale-95 transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                    >
                      <Check size={13} />
                      <span>Activate Authenticator</span>
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* LOGOUT ALL MODAL */}
        <AnimatePresence>
          {isLogoutAllModalOpen && (
            <div className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-primary/70 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white rounded-[36px] border border-border-misrah p-8 md:p-10 max-w-md w-full shadow-2xl space-y-6 relative overflow-hidden"
              >
                <div className="flex items-center justify-between border-b border-border-misrah pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-danger/10 text-danger flex items-center justify-center">
                      <LogOut size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-black italic text-primary uppercase">Logout For All</h3>
                      <p className="text-[9px] font-bold text-muted-text uppercase tracking-widest">
                        Terminate all connected sessions
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => !isLoggingOut && setIsLogoutAllModalOpen(false)}
                    disabled={isLoggingOut}
                    className="w-8 h-8 rounded-full bg-surface flex items-center justify-center text-muted-text hover:text-primary transition-colors cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                </div>

                <div className="p-4 bg-danger/5 rounded-2xl border border-danger/15 flex items-start gap-3">
                  <AlertCircle size={18} className="text-danger shrink-0 mt-0.5" />
                  <p className="text-xs text-primary font-medium leading-relaxed">
                    Are you sure you want to <strong>log out of all {sessions.length} sessions</strong>? This will revoke access from all devices and return you to the login screen.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsLogoutAllModalOpen(false)}
                    disabled={isLoggingOut}
                    className="px-5 py-2.5 rounded-xl border border-border-misrah text-muted-text text-[10px] font-black uppercase tracking-wider hover:bg-surface cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmLogoutAll}
                    disabled={isLoggingOut}
                    className="px-6 py-2.5 rounded-xl bg-danger text-white text-[10px] font-black uppercase tracking-wider hover:bg-danger/90 hover:scale-105 active:scale-95 transition-all shadow-md shadow-danger/20 cursor-pointer flex items-center gap-2"
                  >
                    {isLoggingOut ? (
                      <>
                        <RefreshCw size={13} className="animate-spin" />
                        <span>Logging Out...</span>
                      </>
                    ) : (
                      <>
                        <LogOut size={13} />
                        <span>Yes, Logout For All</span>
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* UPDATE PASSWORD MODAL */}
        <AnimatePresence>
          {isPasswordModalOpen && (
            <div className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-primary/70 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white rounded-[36px] border border-border-misrah p-8 md:p-10 max-w-lg w-full shadow-2xl space-y-6 relative overflow-hidden"
              >
                <div className="flex items-center justify-between border-b border-border-misrah pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-danger/10 text-danger flex items-center justify-center">
                      <KeyRound size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-black italic text-primary uppercase">Update Password</h3>
                      <p className="text-[9px] font-bold text-muted-text uppercase tracking-widest">
                        Manage cryptographic access
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsPasswordModalOpen(false)}
                    className="w-8 h-8 rounded-full bg-surface flex items-center justify-center text-muted-text hover:text-primary transition-colors cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                </div>

                <form onSubmit={handleUpdatePassword} className="space-y-4">
                  {passwordError && (
                    <div className="p-3 bg-danger/10 border border-danger/20 rounded-2xl text-xs font-bold text-danger flex items-center gap-2">
                      <AlertCircle size={14} />
                      <span>{passwordError}</span>
                    </div>
                  )}

                  {passwordSuccess && (
                    <div className="p-3 bg-success/10 border border-success/20 rounded-2xl text-xs font-bold text-success flex items-center gap-2">
                      <CheckCircle2 size={14} />
                      <span>{passwordSuccess}</span>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-widest text-muted-text block">
                      Current Password:
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password..."
                        className="w-full bg-[#FCFAF8] border border-border-misrah rounded-2xl px-4 py-3 pr-10 text-xs font-bold text-primary outline-none focus:border-accent"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-text hover:text-primary"
                      >
                        {showCurrentPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-widest text-muted-text block">
                      New Password:
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password..."
                        className="w-full bg-[#FCFAF8] border border-border-misrah rounded-2xl px-4 py-3 pr-10 text-xs font-bold text-primary outline-none focus:border-accent"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-text hover:text-primary"
                      >
                        {showNewPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-widest text-muted-text block">
                      Confirm New Password:
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password..."
                      className="w-full bg-[#FCFAF8] border border-border-misrah rounded-2xl px-4 py-3 text-xs font-bold text-primary outline-none focus:border-accent"
                    />
                  </div>

                  {/* Password Security Strength Toggle Inside Modal */}
                  <div className="p-3 bg-surface/60 rounded-2xl border border-border-misrah space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black uppercase text-primary">
                        Password Security Strength: {passwordStrengthEnforced ? 'Enabled (Strict)' : 'Disabled (Flexible)'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setPasswordStrengthEnforced(!passwordStrengthEnforced)}
                        className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border ${passwordStrengthEnforced ? 'text-danger border-danger/30' : 'text-success border-success/30'}`}
                      >
                        {passwordStrengthEnforced ? 'Disable' : 'Enable'}
                      </button>
                    </div>
                    <div className="flex items-center gap-2 text-[9px] font-bold">
                      <div className={`w-3.5 h-3.5 rounded flex items-center justify-center ${hasMinLength ? 'bg-success text-white' : 'bg-muted-text/20 text-transparent'}`}>
                        <Check size={10} strokeWidth={3} />
                      </div>
                      <span className={hasMinLength ? 'text-success' : 'text-muted-text'}>Minimum 8 characters</span>
                    </div>
                    {passwordStrengthEnforced && (
                      <>
                        <div className="flex items-center gap-2 text-[9px] font-bold">
                          <div className={`w-3.5 h-3.5 rounded flex items-center justify-center ${hasNumber ? 'bg-success text-white' : 'bg-muted-text/20 text-transparent'}`}>
                            <Check size={10} strokeWidth={3} />
                          </div>
                          <span className={hasNumber ? 'text-success' : 'text-muted-text'}>At least one numeric digit (0-9)</span>
                        </div>
                        <div className="flex items-center gap-2 text-[9px] font-bold">
                          <div className={`w-3.5 h-3.5 rounded flex items-center justify-center ${hasSpecial ? 'bg-success text-white' : 'bg-muted-text/20 text-transparent'}`}>
                            <Check size={10} strokeWidth={3} />
                          </div>
                          <span className={hasSpecial ? 'text-success' : 'text-muted-text'}>At least one symbol / special character</span>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsPasswordModalOpen(false)}
                      className="px-5 py-2.5 rounded-xl border border-border-misrah text-muted-text text-[10px] font-black uppercase tracking-wider hover:bg-surface cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isUpdatingPassword}
                      className="px-6 py-2.5 rounded-xl bg-primary text-accent text-[10px] font-black uppercase tracking-wider hover:scale-105 active:scale-95 transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                    >
                      {isUpdatingPassword ? <RefreshCw size={13} className="animate-spin" /> : <Check size={13} />}
                      <span>{isUpdatingPassword ? 'Saving...' : 'Save Password'}</span>
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  if (activeTab === 'payment') {
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => setActiveTab('main')} className="w-10 h-10 rounded-xl bg-white border border-[#F2E8DF] flex items-center justify-center hover:bg-surface transition-all text-primary">
              <ChevronRight className="rotate-180" size={20} />
            </button>
            <h1 className="text-2xl font-black italic text-primary uppercase">Payment Node</h1>
          </div>

          {/* Global Toast */}
          <AnimatePresence>
            {notification && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-primary text-white border border-accent/40 px-4 py-2 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold"
              >
                <CheckCircle2 size={15} className="text-accent" />
                <span>{notification.message}</span>
              </motion.div>
            )}
          </AnimatePresence>
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
                 <h3 className="text-3xl font-black italic uppercase tracking-tighter">{payoutDestination.accountHolder}</h3>
                 <p className="text-xl font-black text-accent tracking-[2px]">{payoutDestination.accountNumber}</p>
              </div>

              <div className="flex items-center justify-between pt-8 border-t border-white/5 relative z-10">
                <div>
                   <p className="text-[8px] font-black text-[#D4C3B5] uppercase tracking-[3px]">{payoutDestination.bankName}</p>
                   <p className="text-[9px] font-bold text-white/50">{payoutDestination.currency}</p>
                </div>
                <button 
                  type="button"
                  onClick={() => {
                    setEditBankName(payoutDestination.bankName);
                    setEditAccountHolder(payoutDestination.accountHolder);
                    setEditIban(payoutDestination.iban);
                    setEditCurrency(payoutDestination.currency);
                    setIsUpdatePaymentOpen(true);
                  }}
                  className="bg-white/10 hover:bg-white/20 px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-[2px] backdrop-blur-sm transition-all cursor-pointer active:scale-95"
                >
                  Update
                </button>
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

        {/* Update Destination Modal */}
        <AnimatePresence>
          {isUpdatePaymentOpen && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                onClick={() => setIsUpdatePaymentOpen(false)}
                className="absolute inset-0 bg-primary/60 backdrop-blur-md"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="relative bg-white w-full max-w-lg rounded-[40px] shadow-2xl border border-border-misrah p-8 space-y-6"
              >
                <div className="flex items-center justify-between pb-4 border-b border-border-misrah">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-accent/15 flex items-center justify-center text-accent">
                      <CreditCard size={20} />
                    </div>
                    <div>
                      <h3 className="text-xl font-black italic text-primary uppercase">Update Payout Destination</h3>
                      <p className="text-[10px] font-bold text-muted-text uppercase tracking-widest">
                        UAE Banking Rail Configuration
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsUpdatePaymentOpen(false)}
                    className="w-8 h-8 rounded-full bg-surface hover:bg-border-misrah/40 text-primary flex items-center justify-center transition-all cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>

                <form onSubmit={(e) => {
                  e.preventDefault();
                  const cleanIban = editIban.replace(/\s+/g, '');
                  const last4 = cleanIban.slice(-4) || '4521';
                  setPayoutDestination({
                    accountHolder: editAccountHolder,
                    accountNumber: `•••• •••• •••• ${last4}`,
                    iban: editIban,
                    bankName: editBankName,
                    currency: editCurrency,
                  });
                  setIsUpdatePaymentOpen(false);
                  showToast('Payout destination updated successfully');
                }} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-primary/60 uppercase tracking-[2px]">Bank Name</label>
                    <select 
                      value={editBankName}
                      onChange={(e) => setEditBankName(e.target.value)}
                      className="w-full bg-[#FCFAF8] border border-border-misrah rounded-2xl px-5 py-3 text-xs font-bold text-primary focus:border-accent outline-hidden"
                    >
                      <option value="ENBD Bank PLC">ENBD Bank PLC (Emirates NBD)</option>
                      <option value="Abu Dhabi Commercial Bank (ADCB)">Abu Dhabi Commercial Bank (ADCB)</option>
                      <option value="First Abu Dhabi Bank (FAB)">First Abu Dhabi Bank (FAB)</option>
                      <option value="Dubai Islamic Bank (DIB)">Dubai Islamic Bank (DIB)</option>
                      <option value="Mashreq Bank">Mashreq Bank</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-primary/60 uppercase tracking-[2px]">Account Holder Name</label>
                    <input 
                      type="text"
                      value={editAccountHolder}
                      onChange={(e) => setEditAccountHolder(e.target.value)}
                      className="w-full bg-[#FCFAF8] border border-border-misrah rounded-2xl px-5 py-3 text-xs font-bold text-primary focus:border-accent outline-hidden"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-primary/60 uppercase tracking-[2px]">IBAN Number</label>
                    <input 
                      type="text"
                      value={editIban}
                      onChange={(e) => setEditIban(e.target.value.toUpperCase())}
                      className="w-full bg-[#FCFAF8] border border-border-misrah rounded-2xl px-5 py-3 text-xs font-mono font-bold text-primary focus:border-accent outline-hidden"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-primary/60 uppercase tracking-[2px]">Settlement Currency</label>
                    <select 
                      value={editCurrency}
                      onChange={(e) => setEditCurrency(e.target.value)}
                      className="w-full bg-[#FCFAF8] border border-border-misrah rounded-2xl px-5 py-3 text-xs font-bold text-primary focus:border-accent outline-hidden"
                    >
                      <option value="AED Settlements (Dirhams)">AED Settlements (Dirhams)</option>
                      <option value="USD Settlements ($)">USD Settlements ($)</option>
                      <option value="EUR Settlements (€)">EUR Settlements (€)</option>
                    </select>
                  </div>

                  <div className="pt-4 flex items-center justify-end gap-3">
                    <button 
                      type="button"
                      onClick={() => setIsUpdatePaymentOpen(false)}
                      className="px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider text-muted-text hover:text-primary cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="px-6 py-2.5 rounded-xl bg-primary text-accent font-black uppercase text-[10px] tracking-wider shadow-lg hover:opacity-95 cursor-pointer active:scale-95"
                    >
                      Save Destination
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

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
