import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  X,
  UserCheck,
  Phone,
  Mail,
  FileText,
  ArrowUpRight,
  Star,
  Calendar,
  TriangleAlert,
  Loader2,
  Download,
} from 'lucide-react';
import { Property, User } from '../../../types';
import { Badge } from '../../ui/Badge';
import { getAdminUserById } from '../../../features/adminUsers/api';
import type { AdminUserRecord } from '../../../features/adminUsers/types';
import { documentLabel, formatDocumentDate } from '../../../features/properties/documents';

// Admin → property details → "Verify Host Profile". Real data only:
//   - name / email / phone: the property's populated `owner`
//   - account status, Super Host, host-since / joined: GET /admin/users/{id}
//   - rating / reviews: this property's
//   - documents: this property's uploaded compliance documents
// There's no host-verification endpoint, so this is a read-only review.

interface NodeProfileVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: Property;
  user: User;
}

export const NodeProfileVerificationModal = ({ isOpen, onClose, property, user }: NodeProfileVerificationModalProps) => {
  const [hostRecord, setHostRecord] = useState<AdminUserRecord | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !property.hostId) return;
    let cancelled = false;
    setIsLoading(true);
    setLoadError(null);
    getAdminUserById(property.hostId)
      .then(record => { if (!cancelled) setHostRecord(record); })
      .catch(err => { if (!cancelled) setLoadError(err instanceof Error ? err.message : 'Failed to load the host account.'); })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [isOpen, property.hostId]);

  if (!isOpen) return null;

  const hostName = hostRecord?.name || property.hostName || 'Host';
  const email = hostRecord?.email || property.hostEmail;
  const phone = hostRecord?.phoneNumber || property.hostPhone;
  const documents = property.documents ?? [];

  // Plain-text host dossier of what's shown here (real data only).
  const handleDownloadDossier = () => {
    const line = (label: string, value?: string | number | null) => `${`${label}:`.padEnd(22)}${value ?? '—'}`;
    const text = [
      'MISRAH — HOST PROFILE DOSSIER',
      '='.repeat(60),
      line('Host Name', hostName),
      line('Host ID', property.hostId),
      line('Email', email),
      line('Phone', phone),
      line('Account Status', hostRecord ? (hostRecord.isActive ? 'Active' : 'Inactive') : undefined),
      line('Super Host', hostRecord ? (hostRecord.isSuperHost ? 'Yes' : 'No') : undefined),
      line('Host Since', formatDocumentDate(hostRecord?.hostSince)),
      line('Joined', formatDocumentDate(hostRecord?.createdAt)),
      '',
      'PROPERTY',
      '-'.repeat(60),
      line('Name', property.name),
      line('City', property.city),
      line('Property ID', property.id),
      line('Rating', property.rating ? property.rating.toFixed(1) : undefined),
      line('Reviews', property.reviews ?? 0),
      '',
      `DOCUMENTS ON FILE (${documents.length})`,
      '-'.repeat(60),
      ...(documents.length === 0
        ? ['None uploaded']
        : documents.map((d, i) => `${i + 1}. ${documentLabel(d.type)} — uploaded ${formatDocumentDate(d.uploadedAt) ?? '—'}${d.url ? ` — ${d.url}` : ''}`)),
      '',
      '='.repeat(60),
      `Generated ${new Date().toLocaleString()} by ${user.name}`,
    ].join('\n');

    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `Host_Profile_${hostName.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const stat = (label: string, value: React.ReactNode) => (
    <div className="p-4 rounded-2xl bg-surface/60 border border-border-misrah text-center">
      <span className="text-[9px] font-black uppercase tracking-widest text-muted-text block mb-1">{label}</span>
      <span className="text-sm font-black text-primary">{value}</span>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6 md:p-10 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-primary/50 backdrop-blur-xl"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 20 }}
        className="relative w-full max-w-2xl bg-white rounded-[40px] border border-border-misrah shadow-luxury overflow-hidden flex flex-col max-h-[92vh] z-10"
      >
        {/* Header */}
        <div className="p-6 md:p-8 border-b border-border-misrah/60 bg-surface/30 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-accent shadow-lg shrink-0">
              <UserCheck size={24} />
            </div>
            <div className="min-w-0">
              <h2 className="text-xl md:text-2xl font-black italic text-primary uppercase tracking-tight">Host Profile</h2>
              <p className="text-[10px] font-black text-accent uppercase tracking-[2px] truncate">{property.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleDownloadDossier}
              title="Download host profile dossier"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-border-misrah hover:border-accent text-primary text-[10px] font-black uppercase tracking-wider transition-all"
            >
              <Download size={14} className="text-accent" />
              <span>Dossier</span>
            </button>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-xl bg-white border border-border-misrah flex items-center justify-center text-muted-text hover:text-primary transition-all"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="p-6 md:p-8 overflow-y-auto flex-1 space-y-6">
          {/* Profile */}
          <div className="p-6 rounded-[32px] bg-white border border-border-misrah shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-5">
            <div className="w-20 h-20 rounded-[28px] bg-accent/20 flex items-center justify-center text-accent font-black text-3xl shrink-0">
              {hostName.charAt(0).toUpperCase()}
            </div>
            <div className="space-y-2 text-center sm:text-left flex-1 min-w-0">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h3 className="text-xl font-black italic text-primary uppercase leading-tight tracking-tight break-words">{hostName}</h3>
                {hostRecord && (
                  <Badge variant={hostRecord.isActive ? 'green' : 'red'}>{hostRecord.isActive ? 'Active' : 'Inactive'}</Badge>
                )}
                {hostRecord?.isSuperHost && <Badge variant="gold">Super Host</Badge>}
                {isLoading && <Loader2 size={14} className="animate-spin text-muted-text" />}
              </div>
              {property.hostId && (
                <div className="text-[10px] font-bold text-muted-text uppercase tracking-widest">
                  ID: <span className="font-mono text-primary">{property.hostId}</span>
                </div>
              )}
              <div className="flex flex-col sm:flex-row sm:flex-wrap items-center gap-x-4 gap-y-1.5 pt-1 text-xs font-bold">
                <span className="flex items-center gap-1.5 text-muted-text">
                  <Phone size={13} className="text-accent" />
                  {phone ? <a href={`tel:${phone.replace(/\s+/g, '')}`} className="text-primary hover:underline">{phone}</a> : 'No phone on file'}
                </span>
                <span className="flex items-center gap-1.5 text-muted-text min-w-0">
                  <Mail size={13} className="text-accent shrink-0" />
                  {email ? <a href={`mailto:${email}`} className="text-primary hover:underline truncate">{email}</a> : 'No email on file'}
                </span>
              </div>
            </div>
          </div>

          {loadError && (
            <div className="p-4 rounded-2xl bg-danger/5 border border-danger/20 flex items-center gap-3 text-danger">
              <TriangleAlert size={16} className="shrink-0" />
              <p className="text-[11px] font-bold">Account details unavailable: {loadError}</p>
            </div>
          )}

          {/* Key facts */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {stat('Property Rating', (
              <span className="flex items-center justify-center gap-1 text-accent">
                <Star size={13} fill="currentColor" /> {property.rating ? property.rating.toFixed(1) : '—'}
              </span>
            ))}
            {stat('Reviews', property.reviews ?? 0)}
            {stat('Host Since', formatDocumentDate(hostRecord?.hostSince) ?? '—')}
            {stat('Joined', formatDocumentDate(hostRecord?.createdAt) ?? '—')}
          </div>

          {/* Documents on file */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-[10px] font-black uppercase tracking-[3px] text-muted-text">Documents on File</h4>
              <span className="text-[10px] font-bold text-muted-text">{documents.length} uploaded</span>
            </div>
            {documents.length === 0 ? (
              <div className="p-6 rounded-2xl bg-surface border border-dashed border-border-misrah text-center">
                <p className="text-[10px] font-black text-muted-text/60 uppercase tracking-widest">No documents uploaded</p>
              </div>
            ) : (
              <div className="space-y-2">
                {documents.map(doc => {
                  const uploaded = formatDocumentDate(doc.uploadedAt);
                  const body = (
                    <>
                      <div className="w-10 h-10 rounded-xl bg-surface border border-border-misrah flex items-center justify-center text-primary shrink-0">
                        <FileText size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-black text-primary uppercase tracking-tight truncate">{documentLabel(doc.type)}</div>
                        <div className="text-[10px] font-medium text-muted-text mt-0.5 flex items-center gap-1">
                          <Calendar size={10} /> {uploaded ? `Uploaded ${uploaded}` : 'Uploaded'}
                        </div>
                      </div>
                      {doc.url && <ArrowUpRight size={16} className="text-muted-text shrink-0" />}
                    </>
                  );
                  return doc.url ? (
                    <a
                      key={doc.id}
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-4 rounded-2xl bg-white border border-border-misrah hover:border-accent flex items-center gap-3.5 transition-all shadow-xs"
                    >
                      {body}
                    </a>
                  ) : (
                    <div key={doc.id} title={`File ID: ${doc.fileId}`} className="p-4 rounded-2xl bg-white border border-border-misrah flex items-center gap-3.5 shadow-xs">
                      {body}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="p-6 md:px-8 border-t border-border-misrah/60 bg-surface/20 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-8 py-3.5 bg-primary text-accent rounded-2xl text-[10px] font-black uppercase tracking-[2px] hover:opacity-90 transition-all"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};
