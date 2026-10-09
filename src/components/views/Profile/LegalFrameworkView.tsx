import React, { useEffect, useState } from 'react';
import {
  ChevronRight,
  Loader2,
  AlertCircle,
  Pencil,
  Trash2,
  Plus,
  Save,
  X,
  FileText,
  Download,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import {
  addLegalSection,
  deleteLegalSection,
  errorMessage,
  getLegalFramework,
  saveLegalFramework,
  updateLegalSection,
  type LegalDocument,
  type LegalSection,
} from '../../../features/legal/api';

// Profile → Legal Framework. Reads the LEGAL_FRAMEWORK settings document for
// everyone; admins can also edit the header (POST /settings) and add / edit /
// reorder / delete sections (/settings/section).

interface LegalFrameworkViewProps {
  isAdmin: boolean;
  onBack: () => void;
  showToast: (message: string, type?: 'success' | 'info') => void;
}

const EMPTY_DOC: LegalDocument = { title: '', protocolVersion: '', pdfUrl: '', sections: [] };

const inputClass =
  'w-full bg-[#FCFAF8] border border-border-misrah rounded-2xl px-4 py-3 text-xs font-bold text-primary focus:border-accent outline-hidden transition-all';
const labelClass = 'text-[9px] font-black text-primary/40 uppercase tracking-[2px] ml-1';

export const LegalFrameworkView = ({ isAdmin, onBack, showToast }: LegalFrameworkViewProps) => {
  const [doc, setDoc] = useState<LegalDocument | null>(null);
  const [exists, setExists] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Admin editing state
  const [headerDraft, setHeaderDraft] = useState<Pick<LegalDocument, 'title' | 'protocolVersion' | 'pdfUrl'> | null>(null);
  const [sectionDraft, setSectionDraft] = useState<{ order: number | null; title: string; body: string } | null>(null);
  const [busy, setBusy] = useState<string | null>(null); // which action is running
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  // Download PDF — fetches value.pdfUrl and saves it as a file. If the host
  // blocks cross-origin fetches, falls back to opening the PDF in a new tab.
  const downloadPdf = async (url: string, title: string) => {
    setDownloading(true);
    setDownloadError(null);
    let res: Response;
    try {
      res = await fetch(url);
    } catch {
      // Network/CORS failure — let the browser open it directly instead.
      window.open(url, '_blank', 'noopener,noreferrer');
      setDownloading(false);
      return;
    }
    try {
      if (!res.ok) {
        setDownloadError(res.status === 404 ? 'The PDF file could not be found at its link.' : `The PDF could not be downloaded (error ${res.status}).`);
        return;
      }
      const blob = await res.blob();
      const isPdf = blob.type.includes('pdf') || /\.pdf($|\?)/i.test(url);
      if (!isPdf || blob.type.includes('html')) {
        setDownloadError('The PDF link does not point to a PDF file.');
        return;
      }
      const fromUrl = decodeURIComponent(new URL(url, window.location.href).pathname.split('/').pop() || '');
      const fileName = fromUrl.toLowerCase().endsWith('.pdf')
        ? fromUrl
        : `${(title || 'legal-framework').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}.pdf`;
      const objectUrl = URL.createObjectURL(blob.type ? blob : new Blob([blob], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
      showToast('PDF downloaded');
    } finally {
      setDownloading(false);
    }
  };
  const [actionError, setActionError] = useState<string | null>(null);

  const load = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const result = await getLegalFramework();
      setExists(result !== null);
      setDoc(result ?? EMPTY_DOC);
    } catch (err) {
      setLoadError(errorMessage(err, 'Failed to load the legal framework.'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const run = async (key: string, action: () => Promise<void>, success: string) => {
    setBusy(key);
    setActionError(null);
    try {
      await action();
      showToast(success);
      await load();
      return true;
    } catch (err) {
      setActionError(errorMessage(err, 'Something went wrong. Please try again.'));
      return false;
    } finally {
      setBusy(null);
    }
  };

  // ---- Header (title / version / PDF) — upserts the whole document
  const saveHeader = async () => {
    if (!doc || !headerDraft) return;
    if (!headerDraft.title.trim()) {
      setActionError('Document title is required.');
      return;
    }
    const ok = await run(
      'header',
      () => saveLegalFramework({ ...doc, title: headerDraft.title.trim(), protocolVersion: headerDraft.protocolVersion.trim(), pdfUrl: headerDraft.pdfUrl.trim() }),
      exists ? 'Legal framework updated' : 'Legal framework created',
    );
    if (ok) setHeaderDraft(null);
  };

  // ---- Sections
  const saveSection = async () => {
    if (!sectionDraft) return;
    if (!sectionDraft.title.trim() || !sectionDraft.body.trim()) {
      setActionError('Section title and text are required.');
      return;
    }
    const { order, title, body } = sectionDraft;
    const ok = order === null
      ? await run('section-new', () => addLegalSection({ title: title.trim(), body: body.trim() }), 'Section added')
      : await run(`section-${order}`, () => updateLegalSection(order, { title: title.trim(), body: body.trim() }), 'Section updated');
    if (ok) setSectionDraft(null);
  };

  const removeSection = (section: LegalSection) => {
    if (!window.confirm(`Delete "${section.title}"? This cannot be undone.`)) return;
    run(`delete-${section.order}`, () => deleteLegalSection(section.order), 'Section deleted');
  };

  // Swap positions with the neighbouring section (newOrder on both).
  const moveSection = (index: number, delta: number) => {
    if (!doc) return;
    const a = doc.sections[index];
    const b = doc.sections[index + delta];
    if (!a || !b) return;
    run(
      `move-${a.order}`,
      () => saveLegalFramework({
        ...doc,
        sections: doc.sections.map(s => (s.order === a.order ? { ...s, order: b.order } : s.order === b.order ? { ...s, order: a.order } : s)),
      }),
      'Section order updated',
    );
  };

  const header = (
    <header className="flex items-center gap-4">
      <button onClick={onBack} className="w-10 h-10 rounded-xl bg-white border border-[#F2E8DF] flex items-center justify-center hover:bg-surface transition-all text-primary">
        <ChevronRight className="rotate-180" size={20} />
      </button>
      <h1 className="text-2xl font-black italic text-primary uppercase">Legal Framework</h1>
    </header>
  );

  if (isLoading && !doc) {
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {header}
        <div className="bg-white rounded-[40px] border border-border-misrah p-24 shadow-sm max-w-4xl flex items-center justify-center">
          <Loader2 size={32} className="animate-spin text-primary/30" />
        </div>
      </div>
    );
  }

  if (loadError && !doc) {
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {header}
        <div className="p-12 rounded-[40px] bg-danger/5 border border-danger/20 text-center space-y-3 max-w-4xl">
          <AlertCircle size={28} className="mx-auto text-danger" />
          <p className="text-xs font-bold text-danger">{loadError}</p>
          <button type="button" onClick={load} className="px-5 py-2.5 rounded-xl bg-primary text-white text-[10px] font-black uppercase tracking-widest">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const current = doc ?? EMPTY_DOC;

  // Host view of a document that doesn't exist yet.
  if (!exists && !isAdmin) {
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {header}
        <div className="p-16 rounded-[40px] bg-white border border-border-misrah text-center space-y-3 max-w-4xl">
          <FileText size={32} className="mx-auto text-muted-text/30" />
          <p className="text-xs font-bold text-muted-text/60 uppercase tracking-widest">The legal framework hasn't been published yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {header}

      <div className="bg-white rounded-[40px] border border-border-misrah p-8 md:p-12 shadow-sm space-y-10 max-w-4xl">
        {/* Document header */}
        {headerDraft ? (
          <div className="space-y-4 border-b border-border-misrah pb-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5 md:col-span-2">
                <label className={labelClass}>Document Title *</label>
                <input className={inputClass} value={headerDraft.title} onChange={e => setHeaderDraft({ ...headerDraft, title: e.target.value })} placeholder="TERMS OF STRATEGIC PARTNERSHIP" />
              </div>
              <div className="space-y-1.5">
                <label className={labelClass}>Protocol Version</label>
                <input className={inputClass} value={headerDraft.protocolVersion} onChange={e => setHeaderDraft({ ...headerDraft, protocolVersion: e.target.value })} placeholder="PROTOCOL V2.4" />
              </div>
              <div className="space-y-1.5">
                <label className={labelClass}>PDF Link</label>
                <input className={inputClass} value={headerDraft.pdfUrl} onChange={e => setHeaderDraft({ ...headerDraft, pdfUrl: e.target.value })} placeholder="https://misrah.ae/legal/terms.pdf" />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => { setHeaderDraft(null); setActionError(null); }} disabled={busy === 'header'} className="px-6 py-3 rounded-2xl border border-border-misrah text-[10px] font-black uppercase tracking-wider text-primary hover:bg-surface disabled:opacity-50">
                Cancel
              </button>
              <button type="button" onClick={saveHeader} disabled={busy === 'header'} className="px-6 py-3 rounded-2xl bg-primary text-accent text-[10px] font-black uppercase tracking-wider flex items-center gap-2 disabled:opacity-60">
                {busy === 'header' ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                {exists ? 'Save' : 'Create Document'}
              </button>
            </div>
          </div>
        ) : !exists ? (
          <div className="text-center space-y-4 border-b border-border-misrah pb-10">
            <FileText size={32} className="mx-auto text-muted-text/30" />
            <p className="text-xs font-bold text-muted-text/70">No legal framework has been published yet.</p>
            <button
              type="button"
              onClick={() => setHeaderDraft({ title: '', protocolVersion: '', pdfUrl: '' })}
              className="px-6 py-3 rounded-2xl bg-primary text-accent text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-2"
            >
              <Plus size={13} /> Create Legal Framework
            </button>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-border-misrah pb-10">
            <div className="min-w-0">
              {current.protocolVersion && <p className="text-[10px] font-black text-accent uppercase tracking-[4px] italic">{current.protocolVersion}</p>}
              <h3 className="text-3xl md:text-4xl font-black italic text-primary uppercase tracking-tighter leading-none mt-2 break-words">{current.title || 'Legal Framework'}</h3>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setHeaderDraft({ title: current.title, protocolVersion: current.protocolVersion, pdfUrl: current.pdfUrl })}
                  title="Edit document details"
                  className="w-11 h-11 rounded-2xl border border-border-misrah flex items-center justify-center text-primary hover:border-accent hover:text-accent transition-all"
                >
                  <Pencil size={15} />
                </button>
              )}
              {current.pdfUrl && (
                <button
                  type="button"
                  onClick={() => downloadPdf(current.pdfUrl, current.title)}
                  disabled={downloading}
                  className="bg-primary text-accent px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[2px] shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all inline-flex items-center gap-2 disabled:opacity-60 disabled:hover:scale-100"
                >
                  {downloading ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
                  {downloading ? 'Downloading…' : 'Download PDF'}
                </button>
              )}
            </div>
          </div>
        )}

        {actionError && (
          <p className="p-4 rounded-2xl bg-danger/5 border border-danger/20 text-[11px] font-bold text-danger">{actionError}</p>
        )}

        {downloadError && (
          <div className="p-4 rounded-2xl bg-danger/5 border border-danger/20 flex items-start justify-between gap-3">
            <p className="text-[11px] font-bold text-danger">
              {downloadError}
              {isAdmin && ' Update the PDF link in the document details.'}
            </p>
            <button type="button" onClick={() => setDownloadError(null)} className="text-danger/60 hover:text-danger shrink-0">
              <X size={14} />
            </button>
          </div>
        )}

        {/* Sections */}
        {exists && (
          <div className="space-y-8 text-primary">
            {current.sections.length === 0 && !sectionDraft && (
              <p className="text-[10px] font-black text-muted-text/60 uppercase tracking-widest text-center py-6">No sections yet</p>
            )}

            {current.sections.map((section, idx) =>
              sectionDraft && sectionDraft.order === section.order ? (
                <React.Fragment key={section.order}>
                  <SectionEditor
                    draft={sectionDraft}
                    onChange={setSectionDraft}
                    onCancel={() => { setSectionDraft(null); setActionError(null); }}
                    onSave={saveSection}
                    saving={busy === `section-${section.order}`}
                  />
                </React.Fragment>
              ) : (
                <section key={section.order} className="space-y-3 group">
                  <div className="flex items-start justify-between gap-4">
                    <h4 className="text-sm font-black italic uppercase tracking-[1px]">{section.title}</h4>
                    {isAdmin && (
                      <div className="flex items-center gap-1 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
                        <IconButton title="Move up" disabled={idx === 0 || busy !== null} onClick={() => moveSection(idx, -1)}><ChevronUp size={13} /></IconButton>
                        <IconButton title="Move down" disabled={idx === current.sections.length - 1 || busy !== null} onClick={() => moveSection(idx, 1)}><ChevronDown size={13} /></IconButton>
                        <IconButton title="Edit section" disabled={busy !== null} onClick={() => { setActionError(null); setSectionDraft({ order: section.order, title: section.title, body: section.body }); }}><Pencil size={13} /></IconButton>
                        <IconButton title="Delete section" danger disabled={busy !== null} onClick={() => removeSection(section)}>
                          {busy === `delete-${section.order}` ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                        </IconButton>
                      </div>
                    )}
                  </div>
                  <p className="text-xs font-medium text-muted-text/80 leading-relaxed text-justify whitespace-pre-line">{section.body}</p>
                </section>
              ),
            )}

            {isAdmin && (sectionDraft && sectionDraft.order === null ? (
              <SectionEditor
                draft={sectionDraft}
                onChange={setSectionDraft}
                onCancel={() => { setSectionDraft(null); setActionError(null); }}
                onSave={saveSection}
                saving={busy === 'section-new'}
                isNew
              />
            ) : (
              <button
                type="button"
                onClick={() => { setActionError(null); setSectionDraft({ order: null, title: `${current.sections.length + 1}. `, body: '' }); }}
                disabled={busy !== null || sectionDraft !== null}
                className="w-full py-4 rounded-[28px] border-2 border-dashed border-border-misrah text-[10px] font-black uppercase tracking-[2px] text-primary/60 hover:border-accent hover:text-accent transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Plus size={14} /> Add Section
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const IconButton = ({ children, title, onClick, disabled, danger }: { children?: React.ReactNode; title: string; onClick: () => void; disabled?: boolean; danger?: boolean }) => (
  <button
    type="button"
    title={title}
    onClick={onClick}
    disabled={disabled}
    className={`w-8 h-8 rounded-lg border border-border-misrah bg-white flex items-center justify-center transition-colors disabled:opacity-30
      ${danger ? 'text-danger hover:bg-danger hover:text-white hover:border-danger' : 'text-primary hover:border-accent hover:text-accent'}`}
  >
    {children}
  </button>
);

const SectionEditor = ({
  draft,
  onChange,
  onCancel,
  onSave,
  saving,
  isNew,
}: {
  draft: { order: number | null; title: string; body: string };
  onChange: (d: { order: number | null; title: string; body: string }) => void;
  onCancel: () => void;
  onSave: () => void;
  saving: boolean;
  isNew?: boolean;
}) => (
  <div className="p-6 rounded-[28px] border border-accent/40 bg-accent/5 space-y-4">
    <p className="text-[9px] font-black uppercase tracking-[2px] text-accent">{isNew ? 'New Section' : 'Edit Section'}</p>
    <div className="space-y-1.5">
      <label className={labelClass}>Title *</label>
      <input className={inputClass} value={draft.title} onChange={e => onChange({ ...draft, title: e.target.value })} placeholder="4. DISPUTE RESOLUTION" />
    </div>
    <div className="space-y-1.5">
      <label className={labelClass}>Text *</label>
      <textarea
        className={`${inputClass} font-medium resize-y min-h-[120px]`}
        value={draft.body}
        onChange={e => onChange({ ...draft, body: e.target.value })}
        placeholder="Any disputes arising under this agreement shall be settled through arbitration in Dubai, UAE."
      />
    </div>
    <div className="flex justify-end gap-3">
      <button type="button" onClick={onCancel} disabled={saving} className="px-5 py-2.5 rounded-xl border border-border-misrah bg-white text-[10px] font-black uppercase tracking-wider text-primary hover:bg-surface disabled:opacity-50 flex items-center gap-1.5">
        <X size={12} /> Cancel
      </button>
      <button type="button" onClick={onSave} disabled={saving} className="px-5 py-2.5 rounded-xl bg-primary text-accent text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 disabled:opacity-60">
        {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
        {isNew ? 'Add Section' : 'Save Section'}
      </button>
    </div>
  </div>
);
