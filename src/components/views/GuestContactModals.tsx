import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Phone,
  PhoneCall,
  PhoneOff,
  CheckCircle2,
  Send,
  Check,
  Copy,
  Mic,
  MicOff,
  Volume2,
  ExternalLink,
  ArrowRight,
} from 'lucide-react';

// Message + Call modals for a booking's guest, copied from
// misrah-retreats-admin's BookingsView. There's no guest messaging or VoIP
// API yet: messages stay in this modal (never delivered) and the "In-App
// Voice Bridge" is a UI simulation. The Tel / WhatsApp options are real and
// only enabled when the booking has a phone number — no fallback number.

export interface GuestContact {
  name: string;
  phone?: string;
  avatar: string;
  // e.g. "Palm Villa · Ref: 64F2…"
  subtitle: string;
}

interface GuestContactModalsProps {
  contact: GuestContact;
  isMessageOpen: boolean;
  isCallOpen: boolean;
  onCloseMessage: () => void;
  onCloseCall: () => void;
}

export const GuestContactModals = ({ contact, isMessageOpen, isCallOpen, onCloseMessage, onCloseCall }: GuestContactModalsProps) => {
  const navigate = useNavigate();
  const [messageInput, setMessageInput] = useState('');
  // Starts empty — no messaging API to load a real thread from.
  const [messagesList, setMessagesList] = useState<Array<{ id: string; sender: 'guest' | 'host'; text: string; time: string }>>([]);

  const [callStatus, setCallStatus] = useState<'idle' | 'calling' | 'connected' | 'ended'>('idle');
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Reset the call screen each time the call modal is opened.
  useEffect(() => {
    if (isCallOpen) {
      setCallStatus('idle');
      setCallDuration(0);
    }
  }, [isCallOpen]);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;
    if (callStatus === 'connected') {
      timer = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [callStatus]);

  useEffect(() => {
    let callTimer: ReturnType<typeof setTimeout> | undefined;
    if (callStatus === 'calling') {
      callTimer = setTimeout(() => {
        setCallStatus('connected');
        setCallDuration(1);
      }, 2000);
    }
    return () => clearTimeout(callTimer);
  }, [callStatus]);

  const formatCallTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  const handleEndCall = () => {
    setCallStatus('ended');
    showToast(`Call ended (${formatCallTime(callDuration)})`);
    setTimeout(() => {
      onCloseCall();
      setCallStatus('idle');
      setCallDuration(0);
    }, 1000);
  };

  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend || messageInput).trim();
    if (!text) return;
    const newMsg = {
      id: Date.now().toString(),
      sender: 'host' as const,
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessagesList(prev => [...prev, newMsg]);
    setMessageInput('');
    showToast(`Messaging API not connected yet — not delivered to ${contact.name}`);
  };

  return (
    <>
      <AnimatePresence>
          {/* Floating Toast Notification */}
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="fixed top-6 right-6 z-[200] max-w-sm bg-[#0B0D14] text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-accent/30 flex items-center gap-3 pointer-events-auto"
            >
              <div className="w-8 h-8 rounded-xl bg-accent/20 text-accent flex items-center justify-center shrink-0">
                <CheckCircle2 size={18} />
              </div>
              <div className="text-xs font-bold text-white/90">
                {toastMessage}
              </div>
            </motion.div>
          )}

          {/* 1. Secure Message Thread Modal */}
          {isMessageOpen && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onCloseMessage}
                className="absolute inset-0 bg-black/60 backdrop-blur-xs"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="bg-white rounded-[36px] w-full max-w-lg p-6 sm:p-7 relative z-10 shadow-2xl border border-border-misrah space-y-4 flex flex-col max-h-[90vh]"
              >
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-border-misrah">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img 
                        src={contact.avatar} 
                        alt={contact.name}
                        className="w-12 h-12 rounded-2xl object-cover border border-border-misrah" 
                      />
                      <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-black italic text-primary uppercase">
                          {contact.name}
                        </h3>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-accent/20 text-primary border border-accent/30">
                          Guest
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-text font-bold">
                        {contact.subtitle}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={onCloseMessage}
                    className="w-9 h-9 rounded-xl bg-surface hover:bg-border-misrah/50 text-muted-text hover:text-primary flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto space-y-3 p-4 bg-[#F8F9FA] rounded-2xl border border-border-misrah/70 min-h-[200px] max-h-[280px]">
                  <div className="text-center my-1">
                    <span className="text-[9px] font-black uppercase tracking-[1.5px] text-muted-text/70 bg-white px-3 py-1 rounded-full border border-border-misrah/50">
                      End-to-End Encrypted Relay · Misrah Protocol
                    </span>
                  </div>

                  {messagesList.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${msg.sender === 'host' ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[82%] px-4 py-3 rounded-2xl text-xs font-medium leading-relaxed ${
                          msg.sender === 'host'
                            ? 'bg-[#0F1D33] text-white rounded-tr-xs shadow-xs'
                            : 'bg-white text-primary border border-border-misrah rounded-tl-xs shadow-xs'
                        }`}
                      >
                        {msg.text}
                      </div>
                      <span className="text-[10px] text-muted-text mt-1 px-1 font-bold">
                        {msg.time} {msg.sender === 'host' && '✓✓'}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Quick Presets */}
                <div className="space-y-1.5">
                  <p className="text-[10px] font-black uppercase tracking-wider text-muted-text px-1">Quick Responses</p>
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    <button
                      type="button"
                      onClick={() => handleSendMessage('🔑 Check-in PIN: 8492. Smart lock is ready for your entry.')}
                      className="text-[11px] font-bold px-3 py-1.5 bg-surface hover:bg-accent/20 hover:text-primary text-muted-text rounded-xl border border-border-misrah whitespace-nowrap transition-colors cursor-pointer"
                    >
                      🔑 Smart Lock PIN
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSendMessage('📶 High-Speed Wi-Fi: MisrahGuest_VIP / Pass: LuxuryStay2026')}
                      className="text-[11px] font-bold px-3 py-1.5 bg-surface hover:bg-accent/20 hover:text-primary text-muted-text rounded-xl border border-border-misrah whitespace-nowrap transition-colors cursor-pointer"
                    >
                      📶 Wi-Fi Details
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSendMessage('📍 Gate pass has been generated under your name with security.')}
                      className="text-[11px] font-bold px-3 py-1.5 bg-surface hover:bg-accent/20 hover:text-primary text-muted-text rounded-xl border border-border-misrah whitespace-nowrap transition-colors cursor-pointer"
                    >
                      📍 Gate Pass Ready
                    </button>
                  </div>
                </div>

                {/* Message Input Box */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder={`Message ${contact.name.split(' ')[0]}...`}
                    className="flex-1 px-4 py-3 bg-surface border border-border-misrah rounded-2xl text-xs font-bold text-primary placeholder:text-muted-text focus:outline-hidden focus:border-accent transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={!messageInput.trim()}
                    className="h-11 px-5 bg-primary disabled:opacity-40 text-accent font-black text-xs uppercase tracking-wider rounded-2xl flex items-center gap-2 hover:brightness-110 active:scale-95 transition-all shadow-md cursor-pointer shrink-0"
                  >
                    <span>Send</span>
                    <Send size={14} />
                  </button>
                </form>

                {/* Footer link to full messages */}
                <div className="pt-1 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        onCloseMessage();
                        navigate('/messages');
                      }}
                      className="inline-flex items-center gap-1.5 text-[11px] font-black text-primary/70 hover:text-accent uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      <span>Open Full Conversation in Messages Hub</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
              </motion.div>
            </div>
          )}

          {/* 2. Direct Call / Voice Bridge Modal */}
          {isCallOpen && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => {
                  if (callStatus === 'connected' || callStatus === 'calling') {
                    handleEndCall();
                  } else {
                    onCloseCall();
                  }
                }}
                className="absolute inset-0 bg-black/75 backdrop-blur-xs"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="bg-[#0B1528] text-white rounded-[40px] w-full max-w-md p-7 sm:p-8 relative z-10 shadow-2xl border border-white/10 space-y-6 text-center overflow-hidden"
              >
                {/* Decorative radial blur */}
                <div className="absolute -top-12 -right-12 w-48 h-48 bg-accent/15 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => {
                    if (callStatus === 'connected' || callStatus === 'calling') {
                      handleEndCall();
                    } else {
                      onCloseCall();
                    }
                  }}
                  className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>

                {/* Guest Profile & Avatar */}
                <div className="relative pt-2">
                  <div className="relative inline-block">
                    <img 
                      src={contact.avatar} 
                      alt={contact.name}
                      className={`w-24 h-24 rounded-[30px] object-cover mx-auto border-2 ${
                        callStatus === 'connected' ? 'border-emerald-400 shadow-lg shadow-emerald-500/20' : 'border-white/20'
                      }`} 
                    />
                    {callStatus === 'calling' && (
                      <span className="absolute inset-0 rounded-[30px] border-2 border-accent animate-ping opacity-75" />
                    )}
                  </div>
                  <h3 className="text-2xl font-black italic text-white uppercase mt-4 tracking-tight">
                    {contact.name}
                  </h3>
                  <p className="text-[11px] font-black uppercase tracking-[2px] text-[#D4C3B5] mt-1">
                    Verified Guest Mobile Node
                  </p>
                </div>

                {/* State: IDLE - Choice of Calling Mode */}
                {callStatus === 'idle' && (
                  <div className="space-y-4 pt-1">
                    {/* Phone Number Display with Copy */}
                    <div className="bg-white/5 rounded-2xl p-4 border border-white/10 flex items-center justify-between">
                      <div className="text-left">
                        <span className="text-[10px] uppercase font-black text-white/50 tracking-wider block">Direct Phone</span>
                        <span className="text-sm font-black text-white font-mono tracking-wider">
                          {contact.phone || 'No phone on file'}
                        </span>
                      </div>
                      <button
                        type="button"
                        disabled={!contact.phone}
                        onClick={() => {
                          if (!contact.phone) return;
                          navigator.clipboard?.writeText(contact.phone);
                          setCopiedPhone(true);
                          showToast('Phone number copied to clipboard');
                          setTimeout(() => setCopiedPhone(false), 2000);
                        }}
                        className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-[#D4C3B5] flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {copiedPhone ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                        <span>{copiedPhone ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>

                    {/* Calling Options */}
                    <div className="space-y-2.5">
                      {/* 1. Direct In-App VoIP Call */}
                      <button
                        type="button"
                        onClick={() => setCallStatus('calling')}
                        className="w-full py-4 bg-accent text-primary hover:brightness-105 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all shadow-lg active:scale-98 cursor-pointer"
                      >
                        <PhoneCall size={16} />
                        <span>Start In-App Voice Bridge</span>
                      </button>
                      <p className="text-[9px] font-bold text-white/40 uppercase tracking-[1.5px] -mt-1">
                        In-app calling is a preview — no call is placed
                      </p>

                      {/* 2. Direct Cellular Phone Dial */}
                      <a
                        href={contact.phone ? `tel:${contact.phone.replace(/\s+/g, '')}` : undefined}
                        aria-disabled={!contact.phone}
                        onClick={(e) => {
                          if (!contact.phone) { e.preventDefault(); return; }
                          showToast(`Opening cellular dialer for ${contact.name}...`);
                        }}
                        className="w-full py-3.5 bg-white/10 hover:bg-white/15 text-white rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all border border-white/10 active:scale-98 cursor-pointer block aria-disabled:opacity-40 aria-disabled:cursor-not-allowed"
                      >
                        <Phone size={16} className="text-emerald-400" />
                        <span>Cellular Direct Call (Tel)</span>
                      </a>

                      {/* 3. WhatsApp Audio / Chat */}
                      <a
                        href={contact.phone ? `https://wa.me/${contact.phone.replace(/[^0-9]/g, '')}` : undefined}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-disabled={!contact.phone}
                        onClick={(e) => {
                          if (!contact.phone) { e.preventDefault(); return; }
                          showToast('Opening VIP WhatsApp Channel...');
                        }}
                        className="w-full py-3.5 bg-[#25D366]/20 hover:bg-[#25D366]/30 text-[#25D366] rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all border border-[#25D366]/30 active:scale-98 cursor-pointer block aria-disabled:opacity-40 aria-disabled:cursor-not-allowed"
                      >
                        <ExternalLink size={15} />
                        <span>WhatsApp Audio / Message</span>
                      </a>
                    </div>
                  </div>
                )}

                {/* State: CALLING - Connecting */}
                {callStatus === 'calling' && (
                  <div className="space-y-6 py-4">
                    <div className="space-y-2">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/20 text-accent border border-accent/40 text-[11px] font-black uppercase tracking-wider">
                        <span className="w-2 h-2 rounded-full bg-accent animate-ping" />
                        <span>Establishing Voice Relay...</span>
                      </div>
                      <p className="text-xs text-white/60 font-medium">
                        Ringing {contact.phone || 'guest'} via Misrah Node
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setCallStatus('idle')}
                      className="w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center mx-auto shadow-xl active:scale-95 transition-all cursor-pointer"
                      title="Cancel"
                    >
                      <PhoneOff size={24} />
                    </button>
                  </div>
                )}

                {/* State: CONNECTED - In active call */}
                {callStatus === 'connected' && (
                  <div className="space-y-6 py-2">
                    <div className="space-y-2">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[11px] font-black uppercase tracking-wider">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span>Encrypted Voice Bridge Active</span>
                      </div>
                      <div className="text-3xl font-black font-mono text-white tracking-widest">
                        {formatCallTime(callDuration)}
                      </div>
                    </div>

                    {/* Audio wave simulation */}
                    <div className="flex items-center justify-center gap-1.5 h-8">
                      {[40, 75, 55, 90, 65, 80, 45, 70, 85, 50].map((h, i) => (
                        <motion.div
                          key={i}
                          animate={{ height: isMuted ? 6 : [h * 0.3, h * 0.4, h * 0.2] }}
                          transition={{ repeat: Infinity, duration: 0.8 + (i % 3) * 0.2, ease: "easeInOut" }}
                          className={`w-1 rounded-full ${isMuted ? 'bg-white/20' : 'bg-emerald-400'}`}
                          style={{ height: `${h * 0.3}px` }}
                        />
                      ))}
                    </div>

                    {/* Call controls */}
                    <div className="flex items-center justify-center gap-5 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsMuted(!isMuted);
                          showToast(isMuted ? 'Microphone active' : 'Microphone muted');
                        }}
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
                          isMuted ? 'bg-rose-600/30 text-rose-400 border border-rose-500/50' : 'bg-white/10 hover:bg-white/20 text-white'
                        }`}
                        title={isMuted ? 'Unmute' : 'Mute'}
                      >
                        {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                      </button>

                      <button
                        type="button"
                        onClick={handleEndCall}
                        className="w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-xl active:scale-95 transition-all cursor-pointer"
                        title="End Call"
                      >
                        <PhoneOff size={24} />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsSpeaker(!isSpeaker);
                          showToast(isSpeaker ? 'Handset audio selected' : 'Speakerphone active');
                        }}
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
                          isSpeaker ? 'bg-accent/30 text-accent border border-accent/50' : 'bg-white/10 hover:bg-white/20 text-white'
                        }`}
                        title="Speaker"
                      >
                        <Volume2 size={20} />
                      </button>
                    </div>
                  </div>
                )}

                {/* State: ENDED */}
                {callStatus === 'ended' && (
                  <div className="space-y-3 py-6">
                    <div className="w-14 h-14 rounded-full bg-white/10 text-white/70 flex items-center justify-center mx-auto">
                      <CheckCircle2 size={28} className="text-emerald-400" />
                    </div>
                    <h4 className="text-lg font-black uppercase text-white">Call Completed</h4>
                    <p className="text-xs text-white/60 font-mono">
                      Logged Duration: {formatCallTime(callDuration)}
                    </p>
                  </div>
                )}
              </motion.div>
            </div>
          )}
      </AnimatePresence>
    </>
  );
};
