import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  ShieldCheck, 
  FileText, 
  CheckCircle2, 
  Download, 
  RefreshCw, 
  ExternalLink, 
  Eye, 
  QrCode, 
  Building2, 
  Copy, 
  Check, 
  Clock,
  Sparkles,
  Printer
} from 'lucide-react';
import { Property, User } from '../../../types';
import { Badge } from '../../ui/Badge';

export interface ComplianceDoc {
  id: string;
  label: string;
  category: string;
  refNumber: string;
  issuingAuthority: string;
  issuedDate: string;
  expiryDate: string;
  status: 'Verified' | 'Active' | 'Review Required';
  statusLabel: string;
  fileSize: string;
  fileName: string;
  hash: string;
  summary: string;
  icon: typeof FileText;
}

interface AuditDocsModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: Property;
  user: User;
  initialDocId?: string | null;
}

export const AuditDocsModal = ({
  isOpen,
  onClose,
  property,
  user,
  initialDocId
}: AuditDocsModalProps) => {
  const [selectedDoc, setSelectedDoc] = useState<ComplianceDoc | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditProgress, setAuditProgress] = useState(0);
  const [auditStepText, setAuditStepText] = useState('');
  const [lastAuditDate, setLastAuditDate] = useState('21 Sep 2026, 09:15 GST');
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [auditSuccessToast, setAuditSuccessToast] = useState(false);

  const complianceDocs: ComplianceDoc[] = [
    {
      id: 'title-deed',
      label: 'Title Deed Registry',
      category: 'Land & Property Ownership',
      refNumber: `DLD-DEED-${property.id.slice(0, 5).toUpperCase()}-9842`,
      issuingAuthority: `${property.city || 'Dubai'} Land Department (DLD)`,
      issuedDate: '14 Nov 2024',
      expiryDate: 'Permanent / Indefinite',
      status: 'Verified',
      statusLabel: 'Legally Verified',
      fileSize: '1.8 MB (PDF)',
      fileName: `Title_Deed_${property.name.replace(/\s+/g, '_')}_Official.pdf`,
      hash: '0x8f294a...e109bc42',
      summary: `Certified electronic title deed validating full legal title and ownership registration for ${property.name}. Free of liens and fully authorized for elite hospitality leasing.`,
      icon: FileText
    },
    {
      id: 'municipal-license',
      label: 'Municipal Holiday Home Permit',
      category: 'Municipal & Tourism Registry',
      refNumber: `DET-HH-${property.id.slice(0, 4).toUpperCase()}-2026-A`,
      issuingAuthority: 'Department of Economy and Tourism (DET)',
      issuedDate: '01 Jan 2026',
      expiryDate: '31 Dec 2026 (Valid)',
      status: 'Active',
      statusLabel: 'Expires Q4 2026',
      fileSize: '2.4 MB (PDF)',
      fileName: `Municipal_Permit_DET_${property.id.slice(0, 4)}.pdf`,
      hash: '0x3d719a...ff402b18',
      summary: `Official municipal classification allowing high-end luxury short-term rental throughput. Complies with fire, environmental safety, and hospitality codes.`,
      icon: ShieldCheck
    },
    {
      id: 'tourism-permit',
      label: 'Tourism Operator Permit',
      category: 'Regional Authority Compliance',
      refNumber: `TCL-UAE-MISRAH-${property.id.slice(0, 4).toUpperCase()}`,
      issuingAuthority: 'Tourism Commercial Licensing Bureau',
      issuedDate: '10 Jan 2025',
      expiryDate: '09 Jan 2027 (Active)',
      status: 'Active',
      statusLabel: 'Active Node',
      fileSize: '1.2 MB (PDF)',
      fileName: `Tourism_Operator_Permit_Misrah_Node.pdf`,
      hash: '0x19ca42...bb901e74',
      summary: `Accredited luxury hospitality operator certification issued to Misrah Elite Partners, granting rights for managed guest experiences and concierge deployment.`,
      icon: CheckCircle2
    },
    {
      id: 'asset-protection',
      label: 'Asset Protection Policy',
      category: 'Comprehensive Liability & Risk Underwriting',
      refNumber: `POL-SUK-ELITE-${property.id.slice(0, 6).toUpperCase()}`,
      issuingAuthority: 'Sukoon / AXA Corporate Underwriters',
      issuedDate: '15 Feb 2026',
      expiryDate: '14 Feb 2027 (Auto-Renew)',
      status: 'Verified',
      statusLabel: 'Elite Tier ($10M USD Coverage)',
      fileSize: '3.1 MB (PDF)',
      fileName: `Asset_Protection_Elite_Policy_${property.id.slice(0, 4)}.pdf`,
      hash: '0x99fe10...aa419022',
      summary: `Tier-1 master commercial property & guest indemnity coverage up to 10,000,000 AED per incident. Covers accidental structural damage, guest medical, and asset restoration.`,
      icon: ShieldCheck
    }
  ];

  // Set initial selected doc if requested
  React.useEffect(() => {
    if (initialDocId) {
      const found = complianceDocs.find(d => d.id === initialDocId || d.label.toLowerCase().includes(initialDocId.toLowerCase()));
      if (found) setSelectedDoc(found);
    }
  }, [initialDocId]);

  if (!isOpen) return null;

  // Run audit simulation
  const handleRunFullAudit = () => {
    setIsAuditing(true);
    setAuditProgress(15);
    setAuditStepText('Pinging Dubai Land Department (DLD) Registry API...');

    setTimeout(() => {
      setAuditProgress(40);
      setAuditStepText('Verifying Holiday Home License with DET municipal gateway...');
    }, 500);

    setTimeout(() => {
      setAuditProgress(75);
      setAuditStepText('Checking Tourism Commercial Licensing standing & Anti-Fraud Nodes...');
    }, 1000);

    setTimeout(() => {
      setAuditProgress(95);
      setAuditStepText('Validating Sukoon / AXA Insurance Underwriting hash...');
    }, 1400);

    setTimeout(() => {
      setAuditProgress(100);
      setIsAuditing(false);
      const now = new Date();
      setLastAuditDate(`${now.getDate()} Sep 2026, ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')} GST`);
      setAuditSuccessToast(true);
      setTimeout(() => setAuditSuccessToast(false), 3500);
    }, 1800);
  };

  // Export official audit certificate
  const handleDownloadAuditSummary = () => {
    const certText = `
================================================================================
MISRAH ELITE REGIONAL HOSPITALITY COMPLIANCE PROTOCOL
OFFICIAL AUDIT CERTIFICATE
================================================================================
Property Name:       ${property.name}
Asset ID:            ${property.id}
Location:            ${property.city}, UAE
Host / Owner:        ${property.hostName || 'Misrah Partner'}
Audit Timestamp:     ${lastAuditDate}
Audit Authority:     Misrah Master Compliance & Legal Archive
Protocol Standing:   4 / 4 CRITICAL DOCUMENTS FULLY VERIFIED (100% COMPLIANT)

DOCUMENT REGISTRY BREAKDOWN:
--------------------------------------------------------------------------------
1. Title Deed Registry
   - Reference:      DLD-DEED-${property.id.slice(0, 5).toUpperCase()}-9842
   - Issuing Body:   Dubai Land Department (DLD)
   - Status:         Legally Verified · Active Clear Title
   - Hash:           0x8f294a...e109bc42

2. Municipal Holiday Home Permit
   - Reference:      DET-HH-${property.id.slice(0, 4).toUpperCase()}-2026-A
   - Issuing Body:   Department of Economy and Tourism (DET)
   - Status:         Active (Valid through Q4 2026)
   - Hash:           0x3d719a...ff402b18

3. Tourism Operator Permit
   - Reference:      TCL-UAE-MISRAH-${property.id.slice(0, 4).toUpperCase()}
   - Issuing Body:   Tourism Commercial Licensing Bureau
   - Status:         Class-A Authorized Operator
   - Hash:           0x19ca42...bb901e74

4. Asset Protection Policy
   - Reference:      POL-SUK-ELITE-${property.id.slice(0, 6).toUpperCase()}
   - Issuing Body:   Sukoon / AXA Corporate Underwriters
   - Status:         Elite Tier Policy · 10,000,000 AED Underwritten
   - Hash:           0x99fe10...aa419022

--------------------------------------------------------------------------------
Verification Hash: SHA256:${btoa(property.id + lastAuditDate).slice(0, 32)}
Certified by Regional Compliance Directorate, UAE & GCC
================================================================================
    `.trim();

    const blob = new Blob([certText], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Compliance_Audit_Certificate_${property.name.replace(/\s+/g, '_')}.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyHash = (hash: string) => {
    navigator.clipboard?.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
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

      {/* Main Modal Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 20 }}
        className="relative w-full max-w-5xl bg-white rounded-[40px] md:rounded-[56px] border border-border-misrah shadow-luxury overflow-hidden flex flex-col max-h-[92vh] z-10"
      >
        {/* Modal Header */}
        <div className="p-6 md:p-10 border-b border-border-misrah/60 bg-surface/30 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shrink-0">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-3xl bg-primary flex items-center justify-center text-accent shadow-xl shadow-primary/20 shrink-0">
              <ShieldCheck size={32} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
                <h2 className="text-2xl md:text-3xl font-sans font-black italic text-primary uppercase tracking-tight">
                  Legal Compliance Archive
                </h2>
                <Badge variant="gold" className="text-[9px] uppercase tracking-wider">
                  4/4 Documents Verified
                </Badge>
              </div>
              <p className="text-[11px] font-black text-muted-text uppercase tracking-[3px] flex items-center gap-2">
                <span>{property.name}</span>
                <span className="w-1.5 h-1.5 bg-accent rounded-full" />
                <span className="text-accent">{property.city || 'Dubai, UAE'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-center">
            <button
              onClick={handleDownloadAuditSummary}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white border border-border-misrah hover:border-accent text-primary text-[10px] font-black uppercase tracking-wider transition-all shadow-xs group"
              title="Download official compliance certificate"
            >
              <Download size={14} className="text-accent group-hover:-translate-y-0.5 transition-transform" />
              <span>Audit Certificate</span>
            </button>
            <button
              onClick={onClose}
              className="w-11 h-11 rounded-2xl bg-white border border-border-misrah flex items-center justify-center text-muted-text hover:text-primary transition-all group"
            >
              <X size={18} className="group-hover:rotate-90 transition-transform" />
            </button>
          </div>
        </div>

        {/* Audit Status Bar */}
        <div className="p-6 md:px-10 border-b border-border-misrah/40 bg-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-success rounded-full animate-pulse shrink-0" />
            <div>
              <div className="text-xs font-black text-primary uppercase tracking-wider flex items-center gap-2">
                <span>100% Legal & Regulatory Clearance</span>
                <span className="text-[10px] text-muted-text font-medium">(Zero Outstanding Injunctions)</span>
              </div>
              <div className="text-[10px] text-muted-text/80 font-medium flex items-center gap-2 mt-0.5">
                <Clock size={12} className="text-accent" />
                <span>Last Verified: {lastAuditDate}</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleRunFullAudit}
            disabled={isAuditing}
            className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[2px] transition-all flex items-center gap-2.5 shadow-md
              ${isAuditing 
                ? 'bg-primary/70 text-accent cursor-wait' 
                : 'bg-primary text-accent hover:bg-primary/90 hover:scale-105 active:scale-95'}`}
          >
            <RefreshCw size={14} className={isAuditing ? 'animate-spin' : ''} />
            <span>{isAuditing ? 'Executing Live Audit...' : 'Run Instant Re-Audit'}</span>
          </button>
        </div>

        {/* Live Audit In-Progress Banner */}
        {isAuditing && (
          <div className="p-4 bg-accent/10 border-b border-accent/20 px-6 md:px-10 space-y-2 animate-in fade-in duration-300">
            <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-primary">
              <span className="flex items-center gap-2">
                <Sparkles size={14} className="text-accent animate-spin" />
                <span>{auditStepText}</span>
              </span>
              <span className="font-mono text-accent">{auditProgress}%</span>
            </div>
            <div className="w-full bg-white rounded-full h-2 overflow-hidden border border-accent/20">
              <div 
                className="bg-accent h-full transition-all duration-300 rounded-full"
                style={{ width: `${auditProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Audit Success Toast */}
        <AnimatePresence>
          {auditSuccessToast && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-3.5 bg-success/15 border-b border-success/30 px-6 md:px-10 flex items-center justify-between text-xs font-black uppercase tracking-wider text-success"
            >
              <span className="flex items-center gap-2">
                <CheckCircle2 size={16} />
                <span>Audit Finished: All 4 Document Nodes Successfully Re-Validated with Land Registry & Tourism Authorities</span>
              </span>
              <span className="text-[10px] font-mono text-primary/70">ALL VERIFIED</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Documents Grid / Table */}
        <div className="p-6 md:p-10 overflow-y-auto flex-1 space-y-4">
          <div className="text-[10px] font-black uppercase tracking-[3px] text-muted-text/80 mb-2">
            Verified Municipal & Title Instruments ({complianceDocs.length})
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {complianceDocs.map((doc) => {
              const Icon = doc.icon;
              return (
                <div
                  key={doc.id}
                  onClick={() => setSelectedDoc(doc)}
                  className="p-6 rounded-[32px] bg-white border border-border-misrah hover:border-accent hover:shadow-luxury transition-all cursor-pointer group flex flex-col justify-between space-y-5 relative"
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-surface border border-border-misrah flex items-center justify-center text-primary group-hover:bg-accent group-hover:text-white transition-all shadow-sm shrink-0">
                          <Icon size={24} />
                        </div>
                        <div>
                          <span className="text-[9px] font-black uppercase tracking-widest text-muted-text/60 block">
                            {doc.category}
                          </span>
                          <h4 className="text-base font-black text-primary uppercase tracking-tight group-hover:text-accent transition-colors">
                            {doc.label}
                          </h4>
                        </div>
                      </div>

                      <Badge variant="green" className="text-[8px] uppercase tracking-wider shrink-0">
                        {doc.statusLabel}
                      </Badge>
                    </div>

                    <p className="text-xs text-muted-text/80 font-medium leading-relaxed line-clamp-2">
                      {doc.summary}
                    </p>

                    <div className="p-3.5 rounded-2xl bg-surface/60 border border-border-misrah/40 space-y-1.5 text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-muted-text">Authority:</span>
                        <span className="font-bold text-primary">{doc.issuingAuthority}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-text">Certificate Ref:</span>
                        <span className="font-mono font-bold text-primary">{doc.refNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-text">Validity:</span>
                        <span className="font-bold text-success">{doc.expiryDate}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-border-misrah/40">
                    <span className="text-[10px] font-mono text-muted-text/60">
                      {doc.fileSize}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDoc(doc);
                      }}
                      className="px-4 py-2 rounded-xl bg-surface group-hover:bg-primary group-hover:text-accent border border-border-misrah text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5"
                    >
                      <Eye size={12} />
                      <span>Inspect Voucher</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-6 md:px-10 border-t border-border-misrah/60 bg-surface/20 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0 text-xs text-muted-text font-medium">
          <div className="flex items-center gap-2">
            <Building2 size={16} className="text-accent" />
            <span>Audited under UAE Federal Short-Term Accommodation Directives</span>
          </div>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-8 py-3.5 bg-primary text-accent rounded-2xl text-[10px] font-black uppercase tracking-[2px] hover:scale-105 transition-transform"
          >
            Close Archive
          </button>
        </div>
      </motion.div>

      {/* INDIVIDUAL DOCUMENT VOUCHER INSPECTION POPUP */}
      <AnimatePresence>
        {selectedDoc && (
          <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedDoc(null)}
              className="absolute inset-0 bg-primary/60 backdrop-blur-md"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-lg bg-white rounded-[40px] border border-border-misrah shadow-2xl p-6 sm:p-8 space-y-6 z-10 max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={() => setSelectedDoc(null)}
                className="absolute top-6 right-6 w-10 h-10 rounded-xl bg-surface border border-border-misrah flex items-center justify-center text-muted-text hover:text-primary transition-all"
              >
                <X size={16} />
              </button>

              <div className="text-center space-y-2 pt-2">
                <div className="w-16 h-16 rounded-2xl bg-accent text-primary flex items-center justify-center mx-auto shadow-lg shadow-accent/20">
                  <selectedDoc.icon size={30} />
                </div>
                <h3 className="text-2xl font-black italic text-primary uppercase">
                  {selectedDoc.label}
                </h3>
                <Badge variant="green" className="text-[9px] uppercase tracking-wider">
                  {selectedDoc.statusLabel}
                </Badge>
              </div>

              {/* Digital Slip / Certificate Display */}
              <div className="bg-surface/60 rounded-3xl p-6 border border-border-misrah/60 space-y-4 text-xs font-medium">
                <div className="flex items-center justify-between border-b border-border-misrah/40 pb-3">
                  <span className="text-muted-text">Official Authority:</span>
                  <span className="font-bold text-primary text-right">{selectedDoc.issuingAuthority}</span>
                </div>
                <div className="flex items-center justify-between border-b border-border-misrah/40 pb-3">
                  <span className="text-muted-text">Document Ref:</span>
                  <span className="font-mono font-bold text-primary">{selectedDoc.refNumber}</span>
                </div>
                <div className="flex items-center justify-between border-b border-border-misrah/40 pb-3">
                  <span className="text-muted-text">Associated Asset:</span>
                  <span className="font-bold text-primary text-right">{property.name}</span>
                </div>
                <div className="flex items-center justify-between border-b border-border-misrah/40 pb-3">
                  <span className="text-muted-text">Issuance / Expiry:</span>
                  <span className="font-bold text-primary text-right">{selectedDoc.issuedDate} → {selectedDoc.expiryDate}</span>
                </div>
                <div className="flex items-center justify-between border-b border-border-misrah/40 pb-3">
                  <span className="text-muted-text">File Artifact:</span>
                  <span className="font-mono text-primary text-right">{selectedDoc.fileName}</span>
                </div>

                <div className="pt-2">
                  <span className="text-[10px] font-black uppercase text-muted-text/80 block mb-1">
                    Compliance Verification Summary
                  </span>
                  <p className="text-xs text-primary/80 leading-relaxed italic bg-white p-3.5 rounded-xl border border-border-misrah/40">
                    "{selectedDoc.summary}"
                  </p>
                </div>

                <div className="pt-2 border-t border-border-misrah/40 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-muted-text/60">SHA-256 Hash:</span>
                  <button
                    onClick={() => handleCopyHash(selectedDoc.hash)}
                    className="font-mono text-[10px] text-accent hover:underline flex items-center gap-1"
                    title="Click to copy hash"
                  >
                    <span>{selectedDoc.hash}</span>
                    {copiedHash === selectedDoc.hash ? <Check size={12} className="text-success" /> : <Copy size={12} />}
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={() => {
                    const blob = new Blob([`OFFICIAL INSTRUMENT COPY\n${selectedDoc.label}\nRef: ${selectedDoc.refNumber}\nProperty: ${property.name}\nAuthority: ${selectedDoc.issuingAuthority}\nHash: ${selectedDoc.hash}`], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.setAttribute('download', selectedDoc.fileName.replace('.pdf', '.txt'));
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="w-full py-3.5 rounded-2xl bg-surface hover:bg-surface/80 border border-border-misrah text-primary text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-colors shadow-xs"
                >
                  <Download size={14} className="text-accent" />
                  <span>Download Verified Document Slip</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDoc(null)}
                  className="w-full py-3.5 rounded-2xl bg-primary text-accent text-xs font-black uppercase tracking-wider hover:scale-[1.02] transition-transform"
                >
                  Back to Compliance Archive
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
