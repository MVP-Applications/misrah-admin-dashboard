import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Radio, 
  Signal, 
  ShieldCheck, 
  Send, 
  Terminal, 
  Phone, 
  MessageSquare, 
  Cpu, 
  CheckCircle2, 
  AlertCircle, 
  Lock, 
  Zap, 
  Sparkles, 
  Activity, 
  Thermometer, 
  Volume2, 
  Key, 
  ExternalLink,
  Copy,
  Check,
  Building2,
  Clock,
  UserCheck
} from 'lucide-react';
import { Property, User } from '../../../types';
import { Badge } from '../../ui/Badge';

interface DirectIntelUplinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: Property;
  user: User;
  initialTab?: 'uplink' | 'telemetry';
}

interface IntelDispatch {
  id: string;
  sender: string;
  role: string;
  time: string;
  category: 'Telemetry' | 'Instruction' | 'Security' | 'Concierge';
  message: string;
  status: 'Delivered' | 'Acknowledged' | 'Actioned';
}

export const DirectIntelUplinkModal = ({
  isOpen,
  onClose,
  property,
  user,
  initialTab = 'uplink'
}: DirectIntelUplinkModalProps) => {
  const [activeTab, setActiveTab] = useState<'uplink' | 'telemetry'>(initialTab);
  const [intelMessage, setIntelMessage] = useState('');
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [dispatchType, setDispatchType] = useState<'Instruction' | 'Security' | 'Concierge' | 'Telemetry'>('Instruction');
  const [copiedData, setCopiedData] = useState<string | null>(null);
  const [sentSuccessNotice, setSentSuccessNotice] = useState(false);

  const hostName = property.hostName || 'Ahmed Al Mansouri';
  const hostPhone = '+971 50 892 4410';
  const hostEmail = `host.${property.hostId || 'dxb'}@misrah-elite.ae`;
  const hostId = property.hostId || 'HST-NODE-8821';

  // Seeded live uplink transmissions
  const [dispatches, setDispatches] = useState<IntelDispatch[]>([
    {
      id: 'dsp-1',
      sender: 'Misrah GCC Command',
      role: 'Central Dispatch',
      time: '12 mins ago',
      category: 'Concierge',
      message: `Pre-arrival flight EK-004 landing confirmed for VIP reservation. Champagne vintage service and private chauffeur rendezvous scheduled at ${property.name} gate.`,
      status: 'Actioned'
    },
    {
      id: 'dsp-2',
      sender: hostName,
      role: 'Host Partner Node',
      time: '38 mins ago',
      category: 'Telemetry',
      message: 'Infinity pool heating calibrated to 29.5°C. Cleaners completed sanitation protocol. Smart digital lock code #9842 synchronized.',
      status: 'Acknowledged'
    },
    {
      id: 'dsp-3',
      sender: 'Automated IoT Beacon',
      role: 'Hardware Uplink',
      time: '2 hours ago',
      category: 'Security',
      message: 'Perimeter acoustic and infrared sensors armed. Noise floor steady at 36 dB (Peaceful baseline).',
      status: 'Delivered'
    }
  ]);

  const quickTemplates = [
    { label: 'VIP Pre-Arrival Protocol', text: `VIP guest arriving in 45 mins. Verify private entrance staging, chilled refreshments, and concierge orientation briefing at ${property.name}.`, type: 'Concierge' as const },
    { label: 'Smart Keycode Reset', text: `Initiate keyless keypad code renewal for upcoming reservation. Invalidate prior guest access pins across all perimeter locks.`, type: 'Security' as const },
    { label: 'HVAC & Climate Advisory', text: `High heat advisory in effect for ${property.city}. Ensure smart chillers are set to 21°C 3 hours before check-in.`, type: 'Telemetry' as const },
    { label: 'Operational Status Ping', text: `Standard 12-hour operational check: please acknowledge villa readiness and confirm on-site liaison availability.`, type: 'Instruction' as const }
  ];

  const handleTransmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!intelMessage.trim() || isTransmitting) return;

    setIsTransmitting(true);

    setTimeout(() => {
      const newDispatch: IntelDispatch = {
        id: `dsp-${Date.now()}`,
        sender: `${user.name} (${user.role.toUpperCase()})`,
        role: 'Direct Dispatcher',
        time: 'Just now',
        category: dispatchType,
        message: intelMessage.trim(),
        status: 'Acknowledged'
      };

      setDispatches([newDispatch, ...dispatches]);
      setIntelMessage('');
      setIsTransmitting(false);
      setSentSuccessNotice(true);
      setTimeout(() => setSentSuccessNotice(false), 3000);
    }, 700);
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedData(key);
    setTimeout(() => setCopiedData(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6 md:p-10 overflow-y-auto">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-primary/50 backdrop-blur-xl"
      />

      {/* Main Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 20 }}
        className="relative w-full max-w-4xl bg-white rounded-[40px] md:rounded-[56px] border border-border-misrah shadow-luxury overflow-hidden flex flex-col max-h-[92vh] z-10"
      >
        {/* Header */}
        <div className="p-6 md:p-10 border-b border-border-misrah/60 bg-surface/30 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shrink-0">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-3xl bg-primary flex items-center justify-center text-accent shadow-xl shadow-primary/20 shrink-0 relative">
              <Radio size={30} className="animate-pulse" />
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-success rounded-full ring-4 ring-white" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
                <h2 className="text-2xl md:text-3xl font-sans font-black italic text-primary uppercase tracking-tight">
                  Direct Intel Uplink
                </h2>
                <Badge variant="gold" className="text-[9px] uppercase tracking-wider">
                  TLS 1.3 Encrypted
                </Badge>
              </div>
              <p className="text-[11px] font-black text-muted-text uppercase tracking-[3px] flex items-center gap-2">
                <span>Partner Node: {hostName}</span>
                <span className="w-1.5 h-1.5 bg-accent rounded-full" />
                <span className="font-mono text-accent">{hostId}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-center">
            <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border border-border-misrah text-[10px] font-mono font-bold text-success">
              <Signal size={12} className="text-success animate-pulse" />
              <span>99.9% UPLINK SIGNAL</span>
            </div>
            <button
              onClick={onClose}
              className="w-11 h-11 rounded-2xl bg-white border border-border-misrah flex items-center justify-center text-muted-text hover:text-primary transition-all group"
            >
              <X size={18} className="group-hover:rotate-90 transition-transform" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 md:px-10 border-b border-border-misrah/40 bg-white flex items-center gap-2 shrink-0 overflow-x-auto">
          {[
            { id: 'uplink' as const, label: 'Live Intel Dispatch', icon: MessageSquare },
            { id: 'telemetry' as const, label: 'Hardware & IoT Telemetry', icon: Cpu }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-5 text-xs font-black uppercase tracking-wider flex items-center gap-2.5 border-b-2 transition-all whitespace-nowrap cursor-pointer
                  ${isActive 
                    ? 'border-accent text-primary' 
                    : 'border-transparent text-muted-text hover:text-primary'}`}
              >
                <Icon size={14} className={isActive ? 'text-accent' : ''} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="p-6 md:p-10 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: LIVE INTEL DISPATCH */}
          {activeTab === 'uplink' && (
            <div className="space-y-6">
              {/* Quick Communication Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-surface/60 border border-border-misrah flex items-center justify-between">
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-text block">Host Mobile</span>
                    <span className="text-xs font-bold text-primary font-mono">{hostPhone}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(hostPhone, 'phone')}
                    className="p-2 rounded-xl bg-white hover:bg-surface text-primary border border-border-misrah transition-all"
                    title="Copy Phone"
                  >
                    {copiedData === 'phone' ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                  </button>
                </div>

                <div className="p-4 rounded-2xl bg-surface/60 border border-border-misrah flex items-center justify-between">
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-text block">Dedicated Node Email</span>
                    <span className="text-xs font-bold text-primary truncate max-w-[140px] block">{hostEmail}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(hostEmail, 'email')}
                    className="p-2 rounded-xl bg-white hover:bg-surface text-primary border border-border-misrah transition-all"
                    title="Copy Email"
                  >
                    {copiedData === 'email' ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                  </button>
                </div>

                <div className="p-4 rounded-2xl bg-surface/60 border border-border-misrah flex items-center justify-between">
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-text block">Average Latency</span>
                    <span className="text-xs font-bold text-success font-mono">14ms · High Priority</span>
                  </div>
                  <div className="w-8 h-8 rounded-xl bg-success/10 text-success flex items-center justify-center">
                    <Zap size={14} />
                  </div>
                </div>
              </div>

              {/* Compose Intel Dispatch Form */}
              <form onSubmit={handleTransmit} className="p-6 md:p-8 rounded-[32px] bg-surface/40 border border-border-misrah space-y-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Terminal size={16} className="text-accent" />
                    <span className="text-xs font-black uppercase tracking-wider text-primary">
                      Transmit Direct Tactical Dispatch
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {(['Instruction', 'Security', 'Concierge', 'Telemetry'] as const).map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setDispatchType(cat)}
                        className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all
                          ${dispatchType === cat 
                            ? 'bg-primary text-accent shadow-xs' 
                            : 'bg-white border border-border-misrah text-muted-text hover:text-primary'}`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <textarea
                  value={intelMessage}
                  onChange={(e) => setIntelMessage(e.target.value)}
                  placeholder={`Transmit priority operational directive, access code authorization, or special guest protocol directly to ${hostName}...`}
                  rows={3}
                  className="w-full bg-white border border-border-misrah rounded-2xl p-4 text-xs font-medium text-primary placeholder:text-muted-text/60 outline-none focus:border-accent transition-all resize-none shadow-inner"
                />

                {/* Quick Directive Suggestions */}
                <div className="space-y-1.5">
                  <span className="text-[9px] font-black uppercase tracking-widest text-muted-text/70 block">
                    Quick Tactical Presets:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {quickTemplates.map((tpl, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setIntelMessage(tpl.text);
                          setDispatchType(tpl.type);
                        }}
                        className="text-[10px] font-bold text-primary/80 bg-white hover:bg-surface border border-border-misrah/80 px-3 py-1.5 rounded-xl transition-all hover:border-accent"
                      >
                        {tpl.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-[10px] text-muted-text font-medium flex items-center gap-1.5">
                    <Lock size={12} className="text-accent" />
                    <span>Cryptographically signed with administrator node key</span>
                  </span>

                  <button
                    type="submit"
                    disabled={!intelMessage.trim() || isTransmitting}
                    className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[2px] transition-all flex items-center gap-2 shadow-md
                      ${intelMessage.trim() && !isTransmitting
                        ? 'bg-primary text-accent hover:scale-105 active:scale-95 cursor-pointer'
                        : 'bg-primary/20 text-primary/40 cursor-not-allowed shadow-none'}`}
                  >
                    <Send size={12} className={isTransmitting ? 'animate-ping' : ''} />
                    <span>{isTransmitting ? 'Routing Packet...' : 'Transmit Intel Uplink'}</span>
                  </button>
                </div>
              </form>

              {/* Success Toast */}
              <AnimatePresence>
                {sentSuccessNotice && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="p-3.5 bg-success/15 border border-success/30 rounded-2xl flex items-center justify-between text-xs font-black uppercase tracking-wider text-success px-5"
                  >
                    <span className="flex items-center gap-2">
                      <CheckCircle2 size={16} />
                      <span>Direct Intel Dispatched & Received by Host Node #{hostId}</span>
                    </span>
                    <span className="text-[10px] font-mono">ACKNOWLEDGED</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Live Dispatch Log */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-black uppercase tracking-[3px] text-muted-text">
                    Encrypted Uplink Stream ({dispatches.length})
                  </h4>
                  <span className="text-[10px] text-muted-text/70 flex items-center gap-1 font-mono">
                    <Clock size={11} />
                    <span>Auto-sync active</span>
                  </span>
                </div>

                <div className="space-y-3">
                  {dispatches.map((dsp) => (
                    <div
                      key={dsp.id}
                      className="p-5 rounded-2xl bg-white border border-border-misrah hover:border-accent/60 transition-all space-y-2.5 shadow-xs"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-primary uppercase tracking-tight">{dsp.sender}</span>
                          <span className="text-[10px] text-muted-text font-bold">({dsp.role})</span>
                          <span className="w-1 h-1 bg-border-misrah rounded-full" />
                          <Badge variant="outline" className="text-[8px] uppercase">
                            {dsp.category}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] text-muted-text font-medium">{dsp.time}</span>
                          <span className="text-[9px] font-black uppercase tracking-wider text-success bg-success/10 px-2 py-0.5 rounded-md">
                            {dsp.status}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-primary/80 font-medium leading-relaxed">
                        {dsp.message}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: HARDWARE & IOT TELEMETRY */}
          {activeTab === 'telemetry' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-6 rounded-[28px] bg-white border border-border-misrah space-y-3 shadow-xs">
                  <div className="w-12 h-12 rounded-2xl bg-surface border border-border-misrah flex items-center justify-center text-primary">
                    <Key size={20} className="text-accent" />
                  </div>
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-text block">Smart Keyless Gate</span>
                    <h5 className="text-sm font-black text-primary uppercase mt-0.5">Keypad Synchronized</h5>
                    <p className="text-[11px] text-success font-bold mt-1">Battery 94% · Firmware v4.8</p>
                  </div>
                </div>

                <div className="p-6 rounded-[28px] bg-white border border-border-misrah space-y-3 shadow-xs">
                  <div className="w-12 h-12 rounded-2xl bg-surface border border-border-misrah flex items-center justify-center text-primary">
                    <Thermometer size={20} className="text-accent" />
                  </div>
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-text block">HVAC Climate Loop</span>
                    <h5 className="text-sm font-black text-primary uppercase mt-0.5">21.5°C Ambient</h5>
                    <p className="text-[11px] text-success font-bold mt-1">Target 22.0°C · Optimal Flow</p>
                  </div>
                </div>

                <div className="p-6 rounded-[28px] bg-white border border-border-misrah space-y-3 shadow-xs">
                  <div className="w-12 h-12 rounded-2xl bg-surface border border-border-misrah flex items-center justify-center text-primary">
                    <Volume2 size={20} className="text-accent" />
                  </div>
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-text block">Noise Floor Monitor</span>
                    <h5 className="text-sm font-black text-primary uppercase mt-0.5">38 dB (Quiet Oasis)</h5>
                    <p className="text-[11px] text-success font-bold mt-1">Threshold 70 dB max</p>
                  </div>
                </div>

                <div className="p-6 rounded-[28px] bg-white border border-border-misrah space-y-3 shadow-xs">
                  <div className="w-12 h-12 rounded-2xl bg-surface border border-border-misrah flex items-center justify-center text-primary">
                    <Activity size={20} className="text-accent" />
                  </div>
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-text block">Water & Power Grid</span>
                    <h5 className="text-sm font-black text-primary uppercase mt-0.5">Standard Usage</h5>
                    <p className="text-[11px] text-success font-bold mt-1">Leak Sensor: Clean</p>
                  </div>
                </div>
              </div>

              {/* Technical Node Specifications */}
              <div className="p-6 md:p-8 rounded-[32px] bg-surface/50 border border-border-misrah space-y-4">
                <h4 className="text-xs font-black uppercase tracking-[2px] text-primary flex items-center gap-2">
                  <Cpu size={16} className="text-accent" />
                  <span>On-Premises Gateway Node Architecture</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-medium">
                  <div className="flex justify-between p-3 bg-white rounded-xl border border-border-misrah/60">
                    <span className="text-muted-text">Mesh Gateway IP:</span>
                    <span className="font-mono font-bold text-primary">192.168.10.14 [VLAN-MISRAH]</span>
                  </div>
                  <div className="flex justify-between p-3 bg-white rounded-xl border border-border-misrah/60">
                    <span className="text-muted-text">Cryptographic Node Hash:</span>
                    <span className="font-mono font-bold text-accent">0x7c21...889b</span>
                  </div>
                  <div className="flex justify-between p-3 bg-white rounded-xl border border-border-misrah/60">
                    <span className="text-muted-text">Primary Connection:</span>
                    <span className="font-bold text-primary">Gigabit Fiber (Backup: 5G Failover)</span>
                  </div>
                  <div className="flex justify-between p-3 bg-white rounded-xl border border-border-misrah/60">
                    <span className="text-muted-text">Telemetry Heartbeat:</span>
                    <span className="font-bold text-success">Every 15 seconds (Stable)</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-6 md:px-10 border-t border-border-misrah/60 bg-surface/20 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0 text-xs text-muted-text font-medium">
          <div className="flex items-center gap-2">
            <Building2 size={16} className="text-accent" />
            <span>Misrah Central Dispatch · GCC Network Operations Center</span>
          </div>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-8 py-3.5 bg-primary text-accent rounded-2xl text-[10px] font-black uppercase tracking-[2px] hover:scale-105 transition-transform"
          >
            Close Uplink
          </button>
        </div>
      </motion.div>
    </div>
  );
};
