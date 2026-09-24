import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  MessageCircle, 
  Send, 
  Star, 
  CheckCircle2, 
  ShieldCheck, 
  Mail, 
  Smartphone, 
  Bell, 
  Sparkles, 
  Clock, 
  Check, 
  CornerDownRight,
  UserCheck
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { User } from '../../types';

export interface PrivateReply {
  id: string;
  author: string;
  role: string;
  channel: 'In-App Message' | 'Direct SMS / WhatsApp' | 'VIP Email';
  date: string;
  message: string;
  status: 'Delivered' | 'Read' | 'Dispatched';
}

export interface ReviewItem {
  id: string;
  guest: string;
  avatar: string;
  rating: number;
  date: string;
  property: string;
  comment: string;
  tags: string[];
  helpfulCount: number;
  isHelpful: boolean;
  replies: PrivateReply[];
}

interface PrivateReplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  review: ReviewItem | null;
  user: User;
  onSendReply: (reviewId: string, reply: PrivateReply) => void;
}

export const PrivateReplyModal = ({
  isOpen,
  onClose,
  review,
  user,
  onSendReply
}: PrivateReplyModalProps) => {
  const [message, setMessage] = useState('');
  const [channel, setChannel] = useState<'In-App Message' | 'Direct SMS / WhatsApp' | 'VIP Email'>('In-App Message');
  const [isSending, setIsSending] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // Clear any half-written draft when switching to a different review.
  useEffect(() => {
    setMessage('');
    setShowSuccessToast(false);
  }, [review?.id]);

  if (!isOpen || !review) return null;

  const quickTemplates = [
    {
      title: 'Warm Hospitality Gratitude',
      text: `Dear ${review.guest}, thank you for your generous feedback regarding your stay at ${review.property}. Our on-site team was delighted to host you, and we look forward to welcoming you back soon.`
    },
    {
      title: 'Concierge Resolution & Credit',
      text: `Dear ${review.guest}, thank you for sharing your experience. We appreciate your transparency regarding our concierge response time. We have noted this with our duty manager and credited your profile with 500 Misrah GCC loyalty points.`
    },
    {
      title: 'VIP Return Invitation',
      text: `Dear ${review.guest}, as a valued resident of ${review.property}, we would love to extend a complimentary private airport chauffeur service on your next reservation.`
    }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isSending) return;

    setIsSending(true);

    setTimeout(() => {
      const newReply: PrivateReply = {
        id: `rep-${Date.now()}`,
        author: user.name,
        role: user.role.toUpperCase(),
        channel: channel,
        date: 'Just now',
        message: message.trim(),
        status: 'Delivered'
      };

      onSendReply(review.id, newReply);
      setMessage('');
      setIsSending(false);
      setShowSuccessToast(true);

      setTimeout(() => {
        setShowSuccessToast(false);
        onClose();
      }, 1500);
    }, 600);
  };

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

      {/* Modal Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 20 }}
        className="relative w-full max-w-2xl bg-white rounded-[40px] md:rounded-[48px] border border-border-misrah shadow-luxury overflow-hidden flex flex-col max-h-[92vh] z-10"
      >
        {/* Header */}
        <div className="p-6 md:p-8 border-b border-border-misrah/60 bg-surface/30 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center text-accent shadow-lg shadow-primary/20 shrink-0">
              <MessageCircle size={26} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl md:text-2xl font-black italic text-primary uppercase tracking-tight">
                  Private Guest Reply
                </h2>
                <Badge variant="gold" className="text-[9px] uppercase">
                  Confidential
                </Badge>
              </div>
              <p className="text-[11px] font-bold text-muted-text uppercase tracking-wider flex items-center gap-2">
                <span>Guest: {review.guest}</span>
                <span className="w-1.5 h-1.5 bg-accent rounded-full" />
                <span className="text-primary truncate max-w-[200px]">{review.property}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-2xl bg-white border border-border-misrah flex items-center justify-center text-muted-text hover:text-primary transition-all group shrink-0"
          >
            <X size={18} className="group-hover:rotate-90 transition-transform" />
          </button>
        </div>

        {/* Success Banner */}
        <AnimatePresence>
          {showSuccessToast && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-success/15 border-b border-success/30 px-6 py-3 flex items-center justify-between text-xs font-black uppercase tracking-wider text-success"
            >
              <span className="flex items-center gap-2">
                <CheckCircle2 size={16} />
                <span>Private reply dispatched directly to {review.guest}</span>
              </span>
              <span className="font-mono text-[10px]">DELIVERED</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modal Body */}
        <div className="p-6 md:p-8 overflow-y-auto space-y-6 flex-1">
          {/* Original Review Snippet */}
          <div className="p-5 rounded-3xl bg-surface/50 border border-border-misrah space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={review.avatar}
                  alt={review.guest}
                  className="w-8 h-8 rounded-xl object-cover border border-border-misrah"
                />
                <div>
                  <h4 className="text-xs font-black text-primary uppercase">{review.guest}</h4>
                  <div className="flex items-center gap-1.5">
                    <div className="flex text-accent text-xs">
                      {'★'.repeat(review.rating)}
                    </div>
                    <span className="text-[10px] text-muted-text">{review.date}</span>
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-black text-accent uppercase tracking-wider bg-white px-2.5 py-1 rounded-xl border border-border-misrah">
                {review.property}
              </span>
            </div>
            <p className="text-xs text-primary/80 italic font-medium leading-relaxed bg-white/70 p-3 rounded-2xl border border-border-misrah/40">
              "{review.comment}"
            </p>
          </div>

          {/* Past Replies History (if any) */}
          {review.replies.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-text">
                  Previous Private Communications ({review.replies.length})
                </span>
              </div>
              <div className="space-y-2.5">
                {review.replies.map((rep) => (
                  <div
                    key={rep.id}
                    className="p-4 rounded-2xl bg-white border border-border-misrah space-y-1.5 shadow-xs"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-primary uppercase">{rep.author}</span>
                        <span className="text-[10px] text-muted-text">({rep.role})</span>
                        <span className="w-1 h-1 bg-border-misrah rounded-full" />
                        <span className="text-[10px] font-bold text-accent">{rep.channel}</span>
                      </div>
                      <span className="text-[10px] text-muted-text font-mono">{rep.date}</span>
                    </div>
                    <p className="text-xs text-primary/80 font-medium leading-relaxed">
                      {rep.message}
                    </p>
                    <div className="flex items-center gap-1.5 text-[9px] font-bold text-success pt-1">
                      <Check size={12} />
                      <span>{rep.status} to guest inbox</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reply Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Delivery Channel Selector */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-text block">
                Direct Communication Channel:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {[
                  { id: 'In-App Message' as const, label: 'In-App Message', icon: Bell },
                  { id: 'Direct SMS / WhatsApp' as const, label: 'SMS / WhatsApp', icon: Smartphone },
                  { id: 'VIP Email' as const, label: 'VIP Email', icon: Mail }
                ].map((ch) => {
                  const Icon = ch.icon;
                  const isSelected = channel === ch.id;
                  return (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => setChannel(ch.id)}
                      className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer
                        ${isSelected
                          ? 'bg-primary text-white border-primary shadow-sm'
                          : 'bg-white text-muted-text border-border-misrah hover:text-primary hover:border-accent'}`}
                    >
                      <Icon size={14} className={isSelected ? 'text-accent' : ''} />
                      <span className="text-[11px] font-black uppercase">{ch.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Template Presets */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-text block">
                Quick Concierge Presets:
              </label>
              <div className="flex flex-wrap gap-2">
                {quickTemplates.map((tpl, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setMessage(tpl.text)}
                    className="text-[10px] font-bold text-primary/80 bg-white hover:bg-surface border border-border-misrah px-3 py-1.5 rounded-xl transition-all hover:border-accent cursor-pointer"
                  >
                    {tpl.title}
                  </button>
                ))}
              </div>
            </div>

            {/* Message Area */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-text block">
                Private Message to {review.guest}:
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={`Draft a private, professional message directly to ${review.guest}...`}
                rows={4}
                className="w-full bg-white border border-border-misrah rounded-2xl p-4 text-xs font-medium text-primary placeholder:text-muted-text/60 outline-none focus:border-accent transition-all resize-none shadow-inner"
              />
              <div className="flex items-center justify-between text-[10px] text-muted-text">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck size={12} className="text-accent" />
                  <span>Private communication visible only to guest and property administrators</span>
                </span>
                <span>{message.length} chars</span>
              </div>
            </div>

            {/* Send Button */}
            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 rounded-2xl border border-border-misrah text-muted-text text-[10px] font-black uppercase tracking-wider hover:bg-surface hover:text-primary transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!message.trim() || isSending}
                className={`px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-[2px] transition-all flex items-center gap-2 shadow-md
                  ${message.trim() && !isSending
                    ? 'bg-primary text-accent hover:scale-105 active:scale-95 cursor-pointer'
                    : 'bg-primary/20 text-primary/40 cursor-not-allowed shadow-none'}`}
              >
                <Send size={13} className={isSending ? 'animate-ping' : ''} />
                <span>{isSending ? 'Transmitting Reply...' : 'Send Private Reply'}</span>
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};
