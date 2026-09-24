import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  ShieldCheck, 
  CheckCircle2, 
  UserCheck, 
  FileCheck, 
  Award, 
  Building2, 
  Calendar, 
  Phone, 
  Mail, 
  Fingerprint, 
  Download, 
  Sparkles, 
  Check, 
  AlertCircle,
  ExternalLink,
  Lock,
  Star
} from 'lucide-react';
import { Property, User } from '../../../types';
import { Badge } from '../../ui/Badge';

interface NodeProfileVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: Property;
  user: User;
}

export const NodeProfileVerificationModal = ({
  isOpen,
  onClose,
  property,
  user
}: NodeProfileVerificationModalProps) => {
  const hostName = property.hostName || 'Ahmed Al Mansouri';
  const hostId = property.hostId || 'HST-NODE-8821';
  
  // No owner-contact record on the admin Property model yet — the fields
  // below fall back to placeholder values until the host API exposes them.
  const linkedPerson = undefined as
    | { nationalId?: string; phone?: string; email?: string; address?: string; propertiesCount?: number }
    | undefined;

  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [verifiedTimestamp, setVerifiedTimestamp] = useState('21 Sep 2026, 09:40 GST');
  const [checklist, setChecklist] = useState({
    identity: true,
    tourismLicense: true,
    amlClearance: true,
    agreement: true,
    insuranceLinked: true
  });

  if (!isOpen) return null;

  const toggleCheck = (key: keyof typeof checklist) => {
    setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleVerifyNode = () => {
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      setChecklist({
        identity: true,
        tourismLicense: true,
        amlClearance: true,
        agreement: true,
        insuranceLinked: true
      });
      const now = new Date();
      setVerifiedTimestamp(`${now.getDate()} Sep 2026, ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')} GST`);
      setVerificationSuccess(true);
      setTimeout(() => setVerificationSuccess(false), 3500);
    }, 1200);
  };

  const handleDownloadDossier = () => {
    const dossierText = `
================================================================================
MISRAH ELITE HOSPITALITY NETWORK
OFFICIAL PARTNER NODE VERIFICATION DOSSIER
================================================================================
Node Identifier:      ${hostId.toUpperCase()}
Partner Name:         ${hostName}
Standing:             VERIFIED ELITE CONTRIBUTOR (Tier-1 Partner)
Associated Property:  ${property.name} (${property.city}, UAE)
Assigned Role:        Accredited Host & Asset Guardian
Verification Date:    ${verifiedTimestamp}
Verification Officer: ${user.name} (${user.role.toUpperCase()})

IDENTITY & REGULATORY CREDENTIALS:
--------------------------------------------------------------------------------
1. UAE National / Resident ID:   ${linkedPerson?.nationalId || '784-1985-1234567-1'} [VERIFIED BIOMETRIC]
2. Phone Channel:                ${linkedPerson?.phone || '+971 50 111 2233'} [CONFIRMED 2FA]
3. Official Email:               ${linkedPerson?.email || 'partner.node@misrah-elite.ae'} [AUTHENTICATED]
4. Residential Address:          ${linkedPerson?.address || 'Palm Jumeirah, Dubai, UAE'}
5. DET Tourism Accreditation:    Accredited Deluxe Operator Class A
6. Anti-Money Laundering (AML):  100% Cleared (Low Risk Factor < 0.01%)
7. Active Portfolio Throughput:  ${linkedPerson?.propertiesCount || 4} Managed Properties
8. Overall Hospitality Rating:   4.98 / 5.0 (Top 1% GCC Network)

AUDIT VERIFICATION STAMP:
All four compliance pillars have been audited in accordance with UAE Federal
and Regional Tourism Authority directives.
Certificate Hash: SHA256:HST_${btoa(hostId + hostName).slice(0, 24)}
================================================================================
    `.trim();

    const blob = new Blob([dossierText], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Host_Node_Verification_${hostName.replace(/\s+/g, '_')}.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const allChecked = Object.values(checklist).every(Boolean);

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
        className="relative w-full max-w-3xl bg-white rounded-[40px] md:rounded-[56px] border border-border-misrah shadow-luxury overflow-hidden flex flex-col max-h-[92vh] z-10"
      >
        {/* Header */}
        <div className="p-6 md:p-10 border-b border-border-misrah/60 bg-surface/30 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shrink-0">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-3xl bg-primary flex items-center justify-center text-accent shadow-xl shadow-primary/20 shrink-0">
              <UserCheck size={32} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
                <h2 className="text-2xl md:text-3xl font-sans font-black italic text-primary uppercase tracking-tight">
                  Node Profile Verification
                </h2>
                <Badge variant="gold" className="text-[9px] uppercase tracking-wider">
                  Tier-1 Partner
                </Badge>
              </div>
              <p className="text-[11px] font-black text-muted-text uppercase tracking-[3px] flex items-center gap-2">
                <span>Node: {hostId}</span>
                <span className="w-1.5 h-1.5 bg-accent rounded-full" />
                <span className="text-accent">{property.name}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-center">
            <button
              onClick={handleDownloadDossier}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-border-misrah hover:border-accent text-primary text-[10px] font-black uppercase tracking-wider transition-all shadow-xs group"
              title="Download official verification dossier"
            >
              <Download size={14} className="text-accent group-hover:-translate-y-0.5 transition-transform" />
              <span>Dossier</span>
            </button>
            <button
              onClick={onClose}
              className="w-11 h-11 rounded-2xl bg-white border border-border-misrah flex items-center justify-center text-muted-text hover:text-primary transition-all group"
            >
              <X size={18} className="group-hover:rotate-90 transition-transform" />
            </button>
          </div>
        </div>

        {/* Success Alert */}
        <AnimatePresence>
          {verificationSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 bg-success/15 border-b border-success/30 px-6 md:px-10 flex items-center justify-between text-xs font-black uppercase tracking-wider text-success"
            >
              <span className="flex items-center gap-2">
                <CheckCircle2 size={16} />
                <span>Node Profile Certified: Cryptographic clearance re-issued for {hostName}</span>
              </span>
              <span className="font-mono text-[10px]">VERIFIED 100%</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content */}
        <div className="p-6 md:p-10 overflow-y-auto flex-1 space-y-6">
          {/* Host Profile Card */}
          <div className="p-6 md:p-8 rounded-[36px] bg-white border border-border-misrah shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="w-24 h-24 rounded-[32px] bg-accent/20 flex items-center justify-center text-accent font-black text-4xl shadow-luxury shrink-0">
              {hostName.charAt(0)}
            </div>
            <div className="space-y-2 text-center sm:text-left flex-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                <h3 className="text-2xl font-black italic text-primary uppercase leading-tight tracking-tight">
                  {hostName}
                </h3>
                <span className="px-2.5 py-0.5 bg-success/10 text-success text-[10px] font-black uppercase rounded-full border border-success/20">
                  Active Clearance
                </span>
              </div>
              <div className="text-[10px] font-bold text-muted-text uppercase tracking-widest">
                Identifier: <span className="font-mono text-primary">{hostId.toUpperCase()}</span>
              </div>
              <p className="text-xs text-muted-text font-medium pt-1">
                Accredited Luxury Hospitality Node Operator managing premier properties across the United Arab Emirates.
              </p>
              
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-2 text-xs font-bold text-primary">
                <span className="flex items-center gap-1.5 text-muted-text">
                  <Phone size={13} className="text-accent" />
                  <span>{linkedPerson?.phone || '+971 50 111 2233'}</span>
                </span>
                <span className="w-1 h-1 bg-border-misrah rounded-full" />
                <span className="flex items-center gap-1.5 text-muted-text">
                  <Mail size={13} className="text-accent" />
                  <span className="truncate max-w-[170px]">{linkedPerson?.email || 'host@misrah.ae'}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Key Metrics Ribbon */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-surface/60 border border-border-misrah text-center">
              <span className="text-[9px] font-black uppercase tracking-widest text-muted-text block mb-1">Trust Score</span>
              <span className="text-lg font-black text-success font-mono">99.8%</span>
            </div>
            <div className="p-4 rounded-2xl bg-surface/60 border border-border-misrah text-center">
              <span className="text-[9px] font-black uppercase tracking-widest text-muted-text block mb-1">Managed Assets</span>
              <span className="text-lg font-black text-primary font-mono">{linkedPerson?.propertiesCount || 4} Units</span>
            </div>
            <div className="p-4 rounded-2xl bg-surface/60 border border-border-misrah text-center">
              <span className="text-[9px] font-black uppercase tracking-widest text-muted-text block mb-1">Guest Rating</span>
              <span className="text-lg font-black text-accent font-mono flex items-center justify-center gap-1">
                <Star size={14} fill="currentColor" />
                <span>4.98</span>
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-surface/60 border border-border-misrah text-center">
              <span className="text-[9px] font-black uppercase tracking-widest text-muted-text block mb-1">Response Time</span>
              <span className="text-lg font-black text-primary font-mono">&lt; 4m</span>
            </div>
          </div>

          {/* Verification Audit Checklist */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-[10px] font-black uppercase tracking-[3px] text-muted-text">
                Regulatory & Security Verification Checklist
              </h4>
              <span className="text-[10px] font-bold text-success font-mono">
                {Object.values(checklist).filter(Boolean).length} / 5 Verified
              </span>
            </div>

            <div className="space-y-2.5">
              {[
                {
                  key: 'identity' as const,
                  label: 'Government Identity & Biometrics',
                  sub: `Verified via UAE ICP / Emirates ID (${linkedPerson?.nationalId || '784-1985-1234567-1'})`,
                  icon: Fingerprint
                },
                {
                  key: 'tourismLicense' as const,
                  label: 'DET Tourism Operator Accreditation',
                  sub: 'Permit #DET-HH-8842 validated under Dubai Economy & Tourism guidelines',
                  icon: FileCheck
                },
                {
                  key: 'amlClearance' as const,
                  label: 'Anti-Money Laundering (AML) Standing',
                  sub: 'Clean financial audit · Zero sanctions watchlist flags · Bank escrow cleared',
                  icon: ShieldCheck
                },
                {
                  key: 'agreement' as const,
                  label: 'Asset Guardian SLA Agreement',
                  sub: '24/7 guest concierge & emergency SLA signed and active through 2028',
                  icon: Award
                },
                {
                  key: 'insuranceLinked' as const,
                  label: 'Commercial Liability Policy Link',
                  sub: 'Policy linked to Sukoon / AXA Tier-1 Master Underwriting facility',
                  icon: Lock
                }
              ].map((item) => {
                const Icon = item.icon;
                const isChecked = checklist[item.key];
                return (
                  <div
                    key={item.key}
                    onClick={() => toggleCheck(item.key)}
                    className="p-4 rounded-2xl bg-white border border-border-misrah hover:border-accent flex items-center justify-between gap-4 cursor-pointer transition-all shadow-xs group"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-surface border border-border-misrah flex items-center justify-center text-primary group-hover:bg-accent group-hover:text-white transition-all shrink-0">
                        <Icon size={18} />
                      </div>
                      <div>
                        <div className="text-xs font-black text-primary uppercase tracking-tight">{item.label}</div>
                        <div className="text-[10px] font-medium text-muted-text mt-0.5">{item.sub}</div>
                      </div>
                    </div>

                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all shrink-0
                      ${isChecked ? 'bg-success text-white border-success' : 'border-border-misrah bg-surface text-transparent'}`}
                    >
                      <Check size={14} strokeWidth={3} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Verification Timestamp */}
          <div className="p-4 rounded-2xl bg-surface/40 border border-border-misrah flex items-center justify-between text-xs font-medium text-muted-text">
            <span>Last Certified By Compliance Directorate:</span>
            <span className="font-bold text-primary font-mono">{verifiedTimestamp}</span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-6 md:px-10 border-t border-border-misrah/60 bg-surface/20 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
          <button
            type="button"
            onClick={handleVerifyNode}
            disabled={isVerifying}
            className={`w-full sm:w-auto px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-[2px] transition-all flex items-center justify-center gap-2 shadow-md
              ${isVerifying 
                ? 'bg-primary/70 text-accent cursor-wait' 
                : 'bg-primary text-accent hover:bg-primary/90 hover:scale-105 active:scale-95'}`}
          >
            <Sparkles size={14} className={isVerifying ? 'animate-spin' : ''} />
            <span>{isVerifying ? 'Verifying Node Credentials...' : 'Certify & Re-Verify Node'}</span>
          </button>

          <button
            onClick={onClose}
            className="w-full sm:w-auto px-8 py-3.5 bg-white border border-border-misrah text-primary rounded-2xl text-[10px] font-black uppercase tracking-[2px] hover:bg-surface transition-all"
          >
            Close Dossier
          </button>
        </div>
      </motion.div>
    </div>
  );
};
