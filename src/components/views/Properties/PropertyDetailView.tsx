import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ChevronLeft,
  X,
  Check,
  Trash2,
  Settings,
  Save,
  FileText,
  ShieldCheck,
  CheckCircle2,
  ArrowUpRight,
  MoreVertical,
  AlertCircle,
  RefreshCw,
  UserCheck,
  CalendarRange,
  Infinity as InfinityIcon,
  Loader2,
  Tags,
  ImageOff,
  Upload,
  Star
} from 'lucide-react';
import { Badge } from '../../ui/Badge';
import { Property, User } from '../../../types';
import type { CityListItem, HostAssignmentSelection } from '../../../features/properties/types';
import { listActiveCities, uploadFile } from '../../../features/properties/api';
import { LocationPicker } from './LocationPicker';
import { documentLabel, formatDocumentDate } from '../../../features/properties/documents';
import { ReassignHostModal } from './ReassignHostModal';
import { AuditDocsModal } from './AuditDocsModal';
import { NodeProfileVerificationModal } from './NodeProfileVerificationModal';
import { displayCurrency } from '../../../utils/money';
import { addPropertiesToCategory, listCategories, removePropertiesFromCategory } from '../../../features/categories/api';
import type { ApiCategory } from '../../../features/categories/types';

// Category.propertyIds may come back as ids or populated documents.
const categoryHasProperty = (category: ApiCategory, propertyId: string) =>
  (category.propertyIds ?? []).some(p => (typeof p === 'string' ? p : (p as { _id?: string })?._id) === propertyId);

// "2026-10-09" → "9 Oct 2026" (formatted as the UTC calendar day).
const formatAvailabilityDate = (day?: string | null): string | null => {
  if (!day) return null;
  const d = new Date(`${day}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
};

// Same options as AddListingModal — propertyType enum + amenity ids.
const PROPERTY_TYPES = [
  { value: 'VILLA', label: 'Villa' },
  { value: 'APARTMENT', label: 'Apartment' },
  { value: 'STUDIO', label: 'Studio' },
  { value: 'PENTHOUSE', label: 'Penthouse' },
];
const AMENITY_OPTIONS = [
  { id: 'wifi', label: 'WiFi' },
  { id: 'tv', label: 'TV' },
  { id: 'kitchen', label: 'Kitchen' },
  { id: 'ac', label: 'AC' },
  { id: 'parking', label: 'Parking' },
  { id: 'pool', label: 'Pool' },
];
const amenityLabel = (id: string) =>
  AMENITY_OPTIONS.find(a => a.id === id)?.label ?? id.replace(/[_-]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
const propertyTypeLabel = (value?: string) =>
  PROPERTY_TYPES.find(t => t.value === value)?.label ?? (value ? value.charAt(0) + value.slice(1).toLowerCase() : '—');

const MAX_PHOTO_MB = 10;

// Document types offered on upload (create flow's types + ownershipProof).
const DOCUMENT_TYPE_OPTIONS = ['ownershipProof', 'propertyDoc', 'emiratesId', 'tradeLicense'];

interface PropertyDetailViewProps {
  property: Property;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<Property>) => void | Promise<void>;
  onDelete: (id: string) => void;
  onAssignHost: (id: string, selection: Exclude<HostAssignmentSelection, { mode: 'admin' }>) => Promise<void>;
  user: User;
}

export const PropertyDetailView = ({
  property,
  onClose,
  onUpdate,
  onDelete,
  onAssignHost,
  user
}: PropertyDetailViewProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [formData, setFormData] = useState({ ...property });
  const [showSecondaryMenu, setShowSecondaryMenu] = useState(false);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [selectedAuditDocId, setSelectedAuditDocId] = useState<string | null>(null);
  const [showNodeVerificationModal, setShowNodeVerificationModal] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  // Edit form: real city list (GET /city/active/list) and photo uploads.
  const [cities, setCities] = useState<CityListItem[]>([]);
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [newDocType, setNewDocType] = useState<string>(DOCUMENT_TYPE_OPTIONS[0]);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [docError, setDocError] = useState<string | null>(null);

  // Admin only: which property categories this property belongs to. Categories
  // hold the propertyIds, so membership is read from GET /property-categories
  // and changed via POST / DELETE /property-categories/{id}/properties.
  const isAdmin = user.role === 'admin';
  const [allCategories, setAllCategories] = useState<ApiCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [savingCategories, setSavingCategories] = useState(false);
  const memberCategoryIds = allCategories.filter(c => categoryHasProperty(c, property.id)).map(c => c._id);

  const loadCategories = () => {
    setCategoriesLoading(true);
    setCategoriesError(null);
    return listCategories()
      .then(list => {
        const sorted = list.filter(c => !c.deletedAt).sort((a, b) => a.displayOrder - b.displayOrder);
        setAllCategories(sorted);
        setSelectedCategoryIds(sorted.filter(c => categoryHasProperty(c, property.id)).map(c => c._id));
      })
      .catch(err => setCategoriesError(err instanceof Error ? err.message : 'Failed to load categories.'))
      .finally(() => setCategoriesLoading(false));
  };

  useEffect(() => {
    if (isAdmin) loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, property.id]);

  const toggleCategory = (id: string) =>
    setSelectedCategoryIds(prev => (prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]));

  // Applies the edit form's category selection as add/remove calls.
  const saveCategories = async () => {
    const toAdd = selectedCategoryIds.filter(id => !memberCategoryIds.includes(id));
    const toRemove = memberCategoryIds.filter(id => !selectedCategoryIds.includes(id));
    if (toAdd.length === 0 && toRemove.length === 0) return;
    setSavingCategories(true);
    const payload = { propertyIds: [property.id] };
    const results = await Promise.allSettled([
      ...toAdd.map(id => addPropertiesToCategory(id, payload)),
      ...toRemove.map(id => removePropertiesFromCategory(id, payload)),
    ]);
    const failed = results.filter(r => r.status === 'rejected').length;
    await loadCategories();
    if (failed > 0) setCategoriesError(`${failed} category change${failed === 1 ? '' : 's'} couldn't be saved. Please try again.`);
    setSavingCategories(false);
  };

  useEffect(() => {
    setFormData({ ...property });
  }, [property]);

  useEffect(() => {
    if (!isEditing || cities.length > 0) return;
    setCitiesLoading(true);
    listActiveCities()
      .then(setCities)
      .catch(err => console.error('[property] failed to load cities', err))
      .finally(() => setCitiesLoading(false));
  }, [isEditing, cities.length]);

  // Upload one or more photos (POST /files/upload) and append them.
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []) as File[];
    e.target.value = '';
    if (files.length === 0) return;
    const invalid = files.find(f => !f.type.startsWith('image/') || f.size > MAX_PHOTO_MB * 1024 * 1024);
    if (invalid) {
      setPhotoError(`${invalid.name}: choose an image up to ${MAX_PHOTO_MB}MB.`);
      return;
    }
    setIsUploadingPhoto(true);
    setPhotoError(null);
    try {
      const uploaded = await Promise.all(files.map(f => uploadFile(f)));
      setFormData(p => ({ ...p, gallery: [...(p.gallery ?? []), ...uploaded.map(u => ({ id: u.id, url: u.url }))] }));
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : 'Failed to upload the photo.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // Upload a compliance document (POST /files/upload) of the chosen type.
  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > MAX_PHOTO_MB * 1024 * 1024) {
      setDocError(`${file.name} is over ${MAX_PHOTO_MB}MB.`);
      return;
    }
    setIsUploadingDoc(true);
    setDocError(null);
    try {
      const uploaded = await uploadFile(file);
      setFormData(p => ({
        ...p,
        documents: [
          ...(p.documents ?? []),
          { id: `new-${uploaded.id}`, type: newDocType, fileId: uploaded.id, url: uploaded.url, uploadedAt: new Date().toISOString() },
        ],
      }));
    } catch (err) {
      setDocError(err instanceof Error ? err.message : 'Failed to upload the document.');
    } finally {
      setIsUploadingDoc(false);
    }
  };

  const removeDocument = (id: string) =>
    setFormData(p => ({ ...p, documents: (p.documents ?? []).filter(d => d.id !== id) }));

  const removePhoto = (id: string) =>
    setFormData(p => ({ ...p, gallery: (p.gallery ?? []).filter(ph => ph.id !== id) }));

  const makeCover = (id: string) =>
    setFormData(p => {
      const gallery = p.gallery ?? [];
      const photo = gallery.find(ph => ph.id === id);
      return photo ? { ...p, gallery: [photo, ...gallery.filter(ph => ph.id !== id)] } : p;
    });

  if (!property) return null;

  const handleSave = async () => {
    // Availability: a start date is needed, plus an end date unless forever.
    const forever = formData.availableForever !== false;
    if (!formData.availabilityStart) {
      setSaveError('Choose an availability start date.');
      return;
    }
    if (!forever && !formData.availabilityEnd) {
      setSaveError('Choose an end date or turn on Available Forever.');
      return;
    }
    if (!forever && formData.availabilityEnd! < formData.availabilityStart) {
      setSaveError('The end date must be on or after the start date.');
      return;
    }
    if (!formData.name?.trim()) {
      setSaveError('Property title is required.');
      return;
    }
    if (!(Number(formData.price) > 0)) {
      setSaveError('Base price must be greater than 0.');
      return;
    }
    if (isUploadingPhoto || isUploadingDoc) {
      setSaveError('Please wait for the upload to finish.');
      return;
    }
    setSaveError(null);
    setIsSaving(true);
    try {
      const updates: Partial<Property> = { ...formData, availableForever: forever, availabilityEnd: forever ? null : formData.availabilityEnd };
      // Only send photos when they were changed here — so a property whose
      // images came back without URLs (empty gallery) never gets them wiped.
      const photoIds = (list?: Property['gallery']) => (list ?? []).map(ph => ph.id).join(',');
      if (photoIds(formData.gallery) === photoIds(property.gallery)) delete updates.gallery;
      const docKeys = (list?: Property['documents']) => (list ?? []).map(d => `${d.type}:${d.fileId}`).join(',');
      if (docKeys(formData.documents) === docKeys(property.documents)) delete updates.documents;
      await onUpdate(property.id, updates);
      if (isAdmin) saveCategories();
      setIsEditing(false);
    } catch (err) {
      // Stay in edit mode so nothing typed is lost.
      setSaveError(err instanceof Error ? err.message : 'Failed to save changes.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this property?')) {
      onDelete(property.id);
    }
  };

  const toggleVisibility = () => {
    const newStatus = !property.active;
    onUpdate(property.id, { active: newStatus });
  };

  const handleStatusUpdate = (status: 'Approved' | 'Rejected') => {
    if (status === 'Rejected') {
      if (!rejectionReason) {
        setIsRejecting(true);
        return;
      }
      onUpdate(property.id, { status, active: false, rejectionReason });
      setIsRejecting(false);
    } else {
      onUpdate(property.id, { status, active: true, rejectionReason: undefined });
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[3px]">
          <button 
            onClick={onClose}
            className="text-muted-text hover:text-primary transition-colors flex items-center gap-1"
          >
            <ChevronLeft size={14} />
            Properties
          </button>
          <span className="text-muted-text/30">/</span>
          <span className="text-primary truncate max-w-[200px] font-bold italic tracking-tighter">{property.name}</span>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Primary Actions */}
          <div className="flex items-center gap-2">
            {user.role === 'admin' && (property.status === 'Pending' || !property.status) && !isRejecting && (
              <>
                <button 
                  onClick={() => setIsRejecting(true)}
                  className="px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[2px] border border-danger/20 text-danger hover:bg-danger hover:text-white transition-all flex items-center gap-2 shadow-sm"
                >
                  <X size={14} />
                  Reject
                </button>
                <button 
                  onClick={() => handleStatusUpdate('Approved')}
                  className="px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[2px] bg-success text-white hover:opacity-90 transition-all shadow-lg flex items-center gap-2"
                >
                  <Check size={14} />
                  Approve
                </button>
              </>
            )}

            {isRejecting && (
              <>
                <button 
                  onClick={() => setIsRejecting(false)}
                  className="px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[2px] border border-border-misrah hover:bg-surface transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => handleStatusUpdate('Rejected')}
                  disabled={!rejectionReason}
                  className="px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[2px] bg-danger text-white hover:opacity-90 transition-all shadow-lg flex items-center gap-2 disabled:opacity-50"
                >
                  Confirm
                </button>
              </>
            )}

            {isEditing ? (
              <div className="flex gap-2">
                <button 
                  onClick={() => { setIsEditing(false); setFormData({ ...property }); setSaveError(null); setPhotoError(null); setDocError(null); setSelectedCategoryIds(memberCategoryIds); }}
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[2px] border border-border-misrah hover:bg-surface transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSave}
                  disabled={isSaving || isUploadingPhoto || isUploadingDoc}
                  className="px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[2px] bg-primary text-white hover:opacity-90 transition-all shadow-lg flex items-center gap-2 disabled:opacity-60"
                >
                  {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  {isSaving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setIsEditing(true)}
                className="px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[2px] bg-primary text-white hover:opacity-90 transition-all shadow-lg flex items-center gap-2"
              >
                <Settings size={14} />
                Edit Listing
              </button>
            )}
          </div>

          {/* Secondary Actions (Kebab Menu) */}
          {!isEditing && !isRejecting && (
            <div className="relative">
              <button 
                onClick={() => setShowSecondaryMenu(!showSecondaryMenu)}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all border
                  ${showSecondaryMenu ? 'bg-primary text-white border-primary shadow-lg' : 'bg-white text-muted-text border-border-misrah hover:border-accent hover:text-accent'}`}
              >
                <MoreVertical size={18} />
              </button>

              <AnimatePresence>
                {showSecondaryMenu && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setShowSecondaryMenu(false)} 
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-luxury border border-border-misrah p-2 z-50 overflow-hidden"
                    >
                      <button
                        onClick={() => {
                          toggleVisibility();
                          setShowSecondaryMenu(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-[2px] transition-all
                          ${property.active ? 'text-muted-text hover:bg-surface' : 'text-success hover:bg-success/5'}`}
                      >
                        <div className={`w-2 h-2 rounded-full ${property.active ? 'bg-muted-text' : 'bg-success'}`} />
                        {property.active ? 'Deactivate' : 'Activate'}
                      </button>
                      <div className="h-px bg-border-misrah my-1 mx-2" />
                      <button
                        onClick={() => {
                          handleDelete();
                          setShowSecondaryMenu(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-[2px] text-danger hover:bg-danger/5 transition-all"
                      >
                        <Trash2 size={14} />
                        Delete Asset
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-[40px] shadow-luxury border border-border-misrah overflow-hidden flex flex-col">
        {/* Hero Section: Wide, balanced image */}
        <div className="w-full h-80 relative overflow-hidden shrink-0 border-b border-border-misrah">
          {property.image ? (
            <img src={property.image} alt={property.name} className="w-full h-full object-cover" />
          ) : (
            // Dark so the white title/badges overlaid below stay readable.
            <div className="w-full h-full bg-[#0F1D33] flex flex-col items-center justify-start pt-16 gap-2 text-white/30">
              <ImageOff size={36} />
              <span className="text-[10px] font-black uppercase tracking-[3px]">No image</span>
            </div>
          )}
          <div className="absolute inset-0 bg-linear-to-t from-primary/80 via-transparent to-transparent" />
          
          <div className="absolute bottom-8 left-8 right-8 flex items-end justify-between text-white">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant={property.active ? 'green' : 'gray'}>{property.active ? 'Active' : 'Hidden'}</Badge>
                {property.status && (
                  <Badge variant={property.status === 'Approved' ? 'green' : property.status === 'Pending' ? 'gold' : 'red'}>
                    {property.status.toUpperCase()}
                  </Badge>
                )}
              </div>
              {isEditing ? (
                <div className="space-y- gap-3">
                  <input 
                    value={formData.name}
                    onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                    className="bg-white/10 backdrop-blur-md border border-white/30 text-white text-3xl font-black italic w-full rounded-xl px-4 py-2 outline-hidden focus:border-white mb-2"
                    placeholder="Property Name"
                  />
                  {/* Real city list (GET /city/active/list) — saved as cityId. */}
                  <select
                    value={formData.cityId ?? ''}
                    disabled={citiesLoading}
                    onChange={e => {
                      const city = cities.find(c => c._id === e.target.value);
                      setFormData(p => ({ ...p, cityId: e.target.value, city: city?.name ?? p.city }));
                    }}
                    className="w-full max-w-xs bg-white/10 backdrop-blur-md border border-white/30 text-white text-xs font-bold uppercase tracking-widest rounded-xl px-4 py-2 outline-hidden disabled:opacity-60"
                  >
                    {citiesLoading && <option value={formData.cityId ?? ''} className="text-primary">Loading cities…</option>}
                    {!citiesLoading && !formData.cityId && <option value="" className="text-primary">Select city</option>}
                    {/* Keep the current city selectable even if it's no longer active. */}
                    {!citiesLoading && formData.cityId && !cities.some(c => c._id === formData.cityId) && (
                      <option value={formData.cityId} className="text-primary">{property.city}</option>
                    )}
                    {cities.map(c => (
                      <option key={c._id} value={c._id} className="text-primary">{c.name}{c.country ? `, ${c.country}` : ''}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <h2 className="text-4xl font-black italic leading-tight uppercase tracking-tighter">{property.name}</h2>
                  <p className="text-accent text-sm font-bold tracking-[3px] uppercase mt-1">{property.city} · {propertyTypeLabel(property.propertyType ?? property.type)}</p>
                </div>
              )}
            </div>
            
            <div className="hidden md:flex flex-col items-end gap-2 text-right">
              <span className="text-[10px] font-black uppercase tracking-[4px] opacity-60">Asset ID Tracking</span>
              <span className="font-mono text-sm opacity-90">{property.id.toUpperCase()}</span>
            </div>
          </div>
        </div>

        {/* Content Section: 2 Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 divide-x divide-border-misrah">
          {/* Main Details (2/3) */}
          <div className={`${isAdmin ? 'lg:col-span-2' : 'lg:col-span-3'} p-8 lg:p-12 space-y-12`}>
            
            {/* Rejection/Status Feedback */}
            {(isRejecting || (property.status === 'Rejected' && property.rejectionReason)) && (
              <div className="space-y-4">
                {isRejecting ? (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="bg-danger/5 border border-danger/20 rounded-[32px] p-8 space-y-6"
                  >
                    <div>
                      <h4 className="text-[11px] font-black uppercase tracking-[3px] text-danger mb-2">Audit Feedback Node</h4>
                      <p className="text-[11px] font-medium text-danger/60 uppercase tracking-widest leading-relaxed">A core protocol violation requires detailed feedback for synchronization.</p>
                    </div>
                    <textarea 
                      value={rejectionReason}
                      onChange={e => setRejectionReason(e.target.value)}
                      placeholder="Detail the listing violation..."
                      className="w-full bg-white border border-border-misrah rounded-2xl p-6 text-sm font-bold text-danger outline-none focus:border-danger transition-all resize-none shadow-inner"
                      rows={4}
                    />
                    <div className="flex flex-wrap gap-2">
                      {['Missing Documentation', 'Low Image Quality', 'Incomplete Specs', 'Safety Standards'].map(r => (
                        <button 
                          key={r}
                          onClick={() => setRejectionReason(r)}
                          className="px-4 py-2 bg-white border border-danger/10 rounded-full text-[10px] font-black uppercase tracking-widest text-danger/70 hover:bg-danger/10 transition-all shadow-sm"
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                ) : (
                  <div className="bg-danger/5 border border-danger/20 rounded-[32px] p-8 flex items-start gap-6">
                    <div className="w-12 h-12 rounded-2xl bg-danger/10 flex items-center justify-center text-danger shrink-0">
                      <AlertCircle size={24} />
                    </div>
                    <div>
                      <h4 className="text-[11px] font-black uppercase tracking-[3px] text-danger mb-1.5">Compliance Failure Log</h4>
                      <p className="text-base font-bold text-danger italic leading-relaxed">"{property.rejectionReason}"</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {isEditing && saveError && (
              <div className="p-4 rounded-2xl bg-danger/5 border border-danger/20 flex items-center gap-3 text-danger">
                <AlertCircle size={16} className="shrink-0" />
                <p className="text-xs font-bold">{saveError}</p>
              </div>
            )}

            {/* Photos — edit: upload / remove / set cover (saved as `images`). */}
            {isEditing && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-[11px] font-black uppercase tracking-[4px] text-muted-text">Photos</h4>
                  <span className="text-[10px] font-bold text-muted-text/60">First photo is the cover</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {(formData.gallery ?? []).map((photo, idx) => (
                    <div key={photo.id} className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-border-misrah group/photo">
                      <img src={photo.url} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                      {idx === 0 ? (
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-primary text-accent text-[8px] font-black uppercase tracking-wider">Cover</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => makeCover(photo.id)}
                          title="Make cover photo"
                          className="absolute top-2 left-2 w-7 h-7 rounded-full bg-white/90 text-primary flex items-center justify-center opacity-0 group-hover/photo:opacity-100 transition-opacity"
                        >
                          <Star size={13} />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => removePhoto(photo.id)}
                        title="Remove photo"
                        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 text-danger flex items-center justify-center"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  ))}
                  <label className={`aspect-[4/3] rounded-2xl border-2 border-dashed border-border-misrah flex flex-col items-center justify-center gap-1.5 text-muted-text transition-all ${isUploadingPhoto ? 'cursor-wait' : 'cursor-pointer hover:border-accent hover:text-accent'}`}>
                    <input type="file" accept="image/*" multiple className="hidden" disabled={isUploadingPhoto} onChange={handlePhotoUpload} />
                    {isUploadingPhoto ? <Loader2 size={20} className="animate-spin" /> : <Upload size={20} />}
                    <span className="text-[9px] font-black uppercase tracking-wider">{isUploadingPhoto ? 'Uploading…' : 'Add Photos'}</span>
                  </label>
                </div>
                {photoError && <p className="text-[11px] font-bold text-danger">{photoError}</p>}
              </div>
            )}

            {/* Listing details */}
            {(() => {
              const numberField = (key: keyof Property, min = 0) => (
                <input
                  type="number"
                  min={min}
                  value={(formData[key] as number | undefined) ?? ''}
                  onChange={e => setFormData(p => ({ ...p, [key]: e.target.value === '' ? undefined : Number(e.target.value) }))}
                  className="bg-white border border-border-misrah text-lg font-black italic text-primary w-full rounded-xl px-3 py-2 outline-none focus:border-accent"
                />
              );
              const tile = (label: string, view: React.ReactNode, edit: React.ReactNode) => (
                <div className="bg-surface rounded-3xl p-6 border border-border-misrah/50 hover:bg-white transition-all shadow-sm">
                  <p className="text-[10px] font-black text-muted-text/50 uppercase tracking-[2px] mb-3">{label}</p>
                  {isEditing ? edit : <div className="text-2xl font-black italic text-primary">{view}</div>}
                </div>
              );
              const money = (value?: number) => (
                <span className="flex items-baseline gap-2">
                  {value !== undefined ? value.toLocaleString() : '—'}
                  <span className="text-[11px] font-bold not-italic text-accent uppercase tracking-widest">{displayCurrency(property.currency)} / NT</span>
                </span>
              );
              return (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {tile('Base Price', money(property.price), (
                      <div className="flex items-baseline gap-2">
                        {numberField('price', 1)}
                        <span className="text-xs font-bold text-muted-text">{displayCurrency(property.currency)}</span>
                      </div>
                    ))}
                    {tile('Weekday Price', money(property.weekdayPrice ?? property.price), numberField('weekdayPrice'))}
                    {tile('Weekend Price', money(property.weekendPrice ?? property.price), numberField('weekendPrice'))}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {tile('Bedrooms', property.bedrooms ?? '—', numberField('bedrooms'))}
                    {tile('Beds', property.beds, numberField('beds'))}
                    {tile('Bathrooms', property.baths, numberField('baths'))}
                    {tile('Max Adults', property.maxAdults ?? '—', numberField('maxAdults', 1))}
                    {tile('Max Children', property.maxChildren ?? '—', numberField('maxChildren'))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {tile('Property Type', propertyTypeLabel(property.propertyType), (
                      <select
                        value={formData.propertyType ?? ''}
                        onChange={e => setFormData(p => ({ ...p, propertyType: e.target.value }))}
                        className="bg-white border border-border-misrah text-lg font-black italic text-primary w-full rounded-xl px-3 py-2 outline-none focus:border-accent"
                      >
                        {!formData.propertyType && <option value="">Select type</option>}
                        {PROPERTY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                    ))}
                    {!isEditing && (
                      <div className="md:col-span-2">
                        {tile('Address', <span className="text-base not-italic font-bold">{property.address || '—'}</span>, null)}
                      </div>
                    )}
                  </div>

                  {/* Location — same map pin picker as property create; the
                      pin's reverse-geocoded address is saved as `address`. */}
                  {isEditing && (
                    <div className="bg-surface rounded-3xl p-6 border border-border-misrah/50 shadow-sm space-y-3">
                      <p className="text-[10px] font-black text-muted-text/50 uppercase tracking-[2px]">Location & Address</p>
                      <LocationPicker
                        value={formData.latitude !== undefined && formData.longitude !== undefined
                          ? { lat: formData.latitude, lng: formData.longitude }
                          : null}
                        onChange={loc => setFormData(p => ({ ...p, latitude: loc?.lat, longitude: loc?.lng }))}
                        cityQuery={(() => {
                          const city = cities.find(c => c._id === formData.cityId);
                          return city ? [city.name, city.country].filter(Boolean).join(', ') : formData.city || undefined;
                        })()}
                        onAddressResolved={address => setFormData(p => ({ ...p, address }))}
                      />
                      <p className="text-xs font-bold text-primary">
                        <span className="text-[9px] font-black uppercase tracking-[2px] text-muted-text mr-2">Address</span>
                        {formData.address || 'Drop a pin on the map'}
                      </p>
                    </div>
                  )}

                  {/* Amenities */}
                  <div className="bg-surface rounded-3xl p-6 border border-border-misrah/50 shadow-sm space-y-3">
                    <p className="text-[10px] font-black text-muted-text/50 uppercase tracking-[2px]">Amenities</p>
                    {isEditing ? (
                      <div className="flex flex-wrap gap-2">
                        {[...AMENITY_OPTIONS.map(a => a.id), ...(formData.amenities ?? []).filter(id => !AMENITY_OPTIONS.some(a => a.id === id))].map(id => {
                          const selected = (formData.amenities ?? []).includes(id);
                          return (
                            <button
                              key={id}
                              type="button"
                              onClick={() => setFormData(p => ({
                                ...p,
                                amenities: selected ? (p.amenities ?? []).filter(a => a !== id) : [...(p.amenities ?? []), id],
                              }))}
                              className={`flex items-center gap-1.5 px-4 py-2 rounded-full border text-[10px] font-black uppercase tracking-widest transition-all ${
                                selected ? 'bg-accent/10 border-accent text-primary' : 'bg-white border-border-misrah text-muted-text hover:border-accent'
                              }`}
                            >
                              {amenityLabel(id)}
                              {selected && <Check size={12} className="text-accent" />}
                            </button>
                          );
                        })}
                      </div>
                    ) : (property.amenities ?? []).length === 0 ? (
                      <p className="text-xs font-bold text-muted-text/60">No amenities listed</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {property.amenities!.map(id => (
                          <span key={id} className="px-4 py-2 rounded-full bg-white border border-border-misrah text-[10px] font-black uppercase tracking-widest text-primary">
                            {amenityLabel(id)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Self check-in */}
                  <div className="grid grid-cols-1 gap-4">
                    <div className="bg-surface rounded-3xl p-6 border border-border-misrah/50 shadow-sm space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-[10px] font-black text-muted-text/50 uppercase tracking-[2px]">Self Check-in</p>
                        {isEditing ? (
                          <button
                            type="button"
                            role="switch"
                            aria-checked={!!formData.selfCheckIn}
                            onClick={() => setFormData(p => ({ ...p, selfCheckIn: !p.selfCheckIn }))}
                            className={`w-11 h-6 rounded-full relative shrink-0 transition-colors shadow-inner ${formData.selfCheckIn ? 'bg-success' : 'bg-border-misrah'}`}
                          >
                            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${formData.selfCheckIn ? 'left-6' : 'left-1'}`} />
                          </button>
                        ) : (
                          <Badge variant={property.selfCheckIn ? 'green' : 'gray'}>{property.selfCheckIn ? 'Available' : 'Not available'}</Badge>
                        )}
                      </div>
                      {isEditing ? (
                        formData.selfCheckIn && (
                          <textarea
                            value={formData.selfCheckInInstruction ?? ''}
                            onChange={e => setFormData(p => ({ ...p, selfCheckInInstruction: e.target.value }))}
                            rows={3}
                            placeholder="e.g. Go to the lobby, input code 1234 on the smart lock."
                            className="w-full bg-white border border-border-misrah rounded-xl px-4 py-3 text-xs font-medium text-primary outline-none focus:border-accent resize-none"
                          />
                        )
                      ) : (
                        property.selfCheckIn && property.selfCheckInInstruction && (
                          <p className="text-xs font-medium text-primary/80 italic leading-relaxed">"{property.selfCheckInInstruction}"</p>
                        )
                      )}
                    </div>

                  </div>
                </div>
              );
            })()}

            {/* Availability window */}
            <div className="bg-surface rounded-3xl p-8 border border-border-misrah/50 shadow-sm space-y-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[10px] font-black text-muted-text/50 uppercase tracking-[2px] flex items-center gap-2">
                  <CalendarRange size={13} /> Availability
                </p>
                {!isEditing && (
                  property.availableForever !== false ? (
                    <Badge variant="green">Available Forever</Badge>
                  ) : (
                    <Badge variant="gold">Fixed Period</Badge>
                  )
                )}
              </div>

              {isEditing ? (
                <div className="space-y-4">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={formData.availableForever !== false}
                    onClick={() => setFormData(p => ({ ...p, availableForever: p.availableForever === false }))}
                    className={`w-full p-4 rounded-2xl border flex items-center justify-between gap-4 text-left transition-all
                      ${formData.availableForever !== false ? 'border-accent bg-accent/5' : 'border-border-misrah bg-white hover:border-accent/50'}`}
                  >
                    <span className="flex items-center gap-3">
                      <span className={`w-9 h-9 rounded-xl flex items-center justify-center ${formData.availableForever !== false ? 'bg-primary text-accent' : 'bg-primary/5 text-primary'}`}>
                        <InfinityIcon size={16} />
                      </span>
                      <span>
                        <span className="block text-xs font-black uppercase tracking-wider text-primary">Available Forever</span>
                        <span className="block text-[10px] font-medium text-muted-text mt-0.5">No end date — bookable from the start date onwards</span>
                      </span>
                    </span>
                    <span className={`w-11 h-6 rounded-full relative shrink-0 transition-colors shadow-inner ${formData.availableForever !== false ? 'bg-success' : 'bg-border-misrah'}`}>
                      <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${formData.availableForever !== false ? 'left-6' : 'left-1'}`} />
                    </span>
                  </button>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label className="space-y-1.5 block">
                      <span className="text-[9px] font-black uppercase tracking-[2px] text-muted-text">Start Date *</span>
                      <input
                        type="date"
                        value={formData.availabilityStart ?? ''}
                        onChange={e => setFormData(p => ({ ...p, availabilityStart: e.target.value || null }))}
                        className="w-full bg-white border border-border-misrah rounded-xl px-4 py-3 text-sm font-bold text-primary outline-none focus:border-accent"
                      />
                    </label>
                    <label className="space-y-1.5 block">
                      <span className="text-[9px] font-black uppercase tracking-[2px] text-muted-text">End Date {formData.availableForever === false && '*'}</span>
                      <input
                        type="date"
                        value={formData.availableForever !== false ? '' : formData.availabilityEnd ?? ''}
                        min={formData.availabilityStart ?? undefined}
                        disabled={formData.availableForever !== false}
                        onChange={e => setFormData(p => ({ ...p, availabilityEnd: e.target.value || null }))}
                        className="w-full bg-white border border-border-misrah rounded-xl px-4 py-3 text-sm font-bold text-primary outline-none focus:border-accent disabled:bg-surface disabled:text-muted-text/40 disabled:cursor-not-allowed"
                      />
                    </label>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[2px] text-muted-text/60 mb-1">Start Date</p>
                    <p className="text-lg font-black italic text-primary">{formatAvailabilityDate(property.availabilityStart) ?? 'Not set'}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[2px] text-muted-text/60 mb-1">End Date</p>
                    <p className="text-lg font-black italic text-primary flex items-center gap-1.5">
                      {property.availableForever !== false
                        ? <><InfinityIcon size={16} className="text-accent" /> Forever</>
                        : formatAvailabilityDate(property.availabilityEnd) ?? 'Not set'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="space-y-6">
              <h4 className="text-[11px] font-black uppercase tracking-[4px] text-muted-text">Strategic Listing Narrative</h4>
              {isEditing ? (
                <textarea 
                  value={formData.description || ''}
                  onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                  className="w-full bg-surface border border-border-misrah rounded-[32px] p-10 text-sm font-bold text-primary outline-none focus:border-accent transition-all resize-none shadow-inner"
                  rows={6}
                  placeholder="Describe the architectural and lifestyle nodes..."
                />
              ) : (
                <div className="bg-surface rounded-[40px] p-10 border border-border-misrah/30 leading-relaxed">
                  <p className="text-base font-medium text-primary/80 italic">
                    {property.description || `This prime asset in ${property.city} offers a curated experience in ${property.type} living. Designed for optimal luxury throughput, the property features advanced architectural integration across its ${property.beds}-bedroom configuration.`}
                  </p>
                </div>
              )}
            </div>

            {/* Property Categories (admin only) */}
            {isAdmin && (
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <h4 className="text-[11px] font-black uppercase tracking-[4px] text-muted-text">Categories</h4>
                  {(categoriesLoading || savingCategories) && <Loader2 size={14} className="animate-spin text-muted-text" />}
                </div>
                {categoriesError && (
                  <div className="p-4 rounded-2xl bg-danger/5 border border-danger/20 flex items-center justify-between gap-4">
                    <p className="text-xs font-bold text-danger">{categoriesError}</p>
                    <button type="button" onClick={loadCategories} className="px-4 py-2 rounded-xl bg-primary text-accent text-[10px] font-black uppercase tracking-wider shrink-0">
                      Retry
                    </button>
                  </div>
                )}
                {isEditing ? (
                  (() => {
                    // Active categories, plus any inactive one it's already in
                    // (so it can still be removed).
                    const options = allCategories.filter(c => c.isActive || selectedCategoryIds.includes(c._id) || memberCategoryIds.includes(c._id));
                    return options.length === 0 ? (
                      !categoriesLoading && <p className="text-[10px] font-black text-muted-text/60 uppercase tracking-widest">No active categories</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {options.map(c => {
                          const selected = selectedCategoryIds.includes(c._id);
                          return (
                            <button
                              key={c._id}
                              type="button"
                              onClick={() => toggleCategory(c._id)}
                              className={`flex items-center gap-2 px-4 py-2 rounded-full border text-[10px] font-black uppercase tracking-widest transition-all
                                ${selected ? 'bg-accent/10 border-accent text-primary' : 'border-border-misrah text-muted-text hover:border-accent'}`}
                            >
                              {c.iconUrl && <img src={c.iconUrl} alt="" className="w-4 h-4 object-contain" />}
                              {c.name?.en || c.name?.ar || 'Category'}
                              {!c.isActive && <span className="text-[8px] text-muted-text/60">(inactive)</span>}
                              {selected && <Check size={12} className="text-accent" />}
                            </button>
                          );
                        })}
                      </div>
                    );
                  })()
                ) : (
                  !categoriesLoading && (
                    memberCategoryIds.length === 0 ? (
                      <p className="text-xs font-bold text-muted-text/60">Not in any category</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {allCategories.filter(c => memberCategoryIds.includes(c._id)).map(c => (
                          <span key={c._id} className="flex items-center gap-2 px-4 py-2 rounded-full border border-border-misrah bg-surface text-[10px] font-black uppercase tracking-widest text-primary">
                            {c.iconUrl ? <img src={c.iconUrl} alt="" className="w-4 h-4 object-contain" /> : <Tags size={12} className="text-accent" />}
                            {c.name?.en || c.name?.ar || 'Category'}
                          </span>
                        ))}
                      </div>
                    )
                  )
                )}
              </div>
            )}

            {/* Compliance Documents */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h4 className="text-[11px] font-black uppercase tracking-[4px] text-muted-text">Legal Compliance Archive</h4>
                {/* Audit All Docs hidden — AuditDocsModal still shows static sample
                    documents, not this property's real `documents`.
                <button
                  type="button"
                  onClick={() => {
                    setSelectedAuditDocId(null);
                    setShowAuditModal(true);
                  }}
                  className="text-[10px] font-black text-accent uppercase tracking-widest hover:underline transition-all flex items-center gap-1.5 group cursor-pointer"
                >
                  <ShieldCheck size={13} className="text-accent group-hover:scale-110 transition-transform" />
                  <span>Audit All Docs</span>
                </button>
                */}
              </div>
              {isEditing ? (
                <div className="space-y-4">
                  {(formData.documents ?? []).length === 0 ? (
                    <p className="text-[10px] font-black text-muted-text/60 uppercase tracking-widest">No documents uploaded</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {formData.documents!.map(doc => (
                        <div key={doc.id} className="p-4 rounded-2xl bg-white border border-border-misrah flex items-center gap-4 shadow-sm">
                          <div className="w-10 h-10 rounded-xl bg-surface border border-border-misrah flex items-center justify-center text-primary shrink-0">
                            <FileText size={18} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-black text-primary uppercase tracking-tight truncate">{documentLabel(doc.type)}</div>
                            {doc.url ? (
                              <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold text-accent hover:underline">View file</a>
                            ) : (
                              <div className="text-[10px] font-bold text-muted-text uppercase tracking-widest">
                                {formatDocumentDate(doc.uploadedAt) ? `Uploaded ${formatDocumentDate(doc.uploadedAt)}` : 'Uploaded'}
                              </div>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => removeDocument(doc.id)}
                            title="Remove document"
                            className="w-8 h-8 rounded-lg text-muted-text hover:text-danger hover:bg-danger/10 flex items-center justify-center shrink-0"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="p-4 rounded-2xl bg-surface border border-dashed border-border-misrah flex flex-col sm:flex-row sm:items-center gap-3">
                    <select
                      value={newDocType}
                      onChange={e => setNewDocType(e.target.value)}
                      className="bg-white border border-border-misrah rounded-xl px-3 py-2.5 text-xs font-bold text-primary outline-none focus:border-accent"
                    >
                      {DOCUMENT_TYPE_OPTIONS.map(t => <option key={t} value={t}>{documentLabel(t)}</option>)}
                    </select>
                    <label className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-accent text-[10px] font-black uppercase tracking-wider ${isUploadingDoc ? 'opacity-60 cursor-wait' : 'cursor-pointer hover:opacity-90'}`}>
                      <input type="file" accept="image/*,application/pdf" className="hidden" disabled={isUploadingDoc} onChange={handleDocumentUpload} />
                      {isUploadingDoc ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                      {isUploadingDoc ? 'Uploading…' : 'Upload Document'}
                    </label>
                  </div>
                  {docError && <p className="text-[11px] font-bold text-danger">{docError}</p>}
                </div>
              ) : (property.documents ?? []).length === 0 ? (
                <div className="p-8 rounded-[28px] bg-surface border border-dashed border-border-misrah flex flex-col items-center gap-2 text-center">
                  <FileText size={22} className="text-[#D4C3B5]" />
                  <p className="text-[10px] font-black text-muted-text/60 uppercase tracking-widest">No documents uploaded</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {property.documents!.map(doc => {
                    const uploaded = formatDocumentDate(doc.uploadedAt);
                    const content = (
                      <>
                        <div className="w-12 h-12 rounded-2xl bg-surface border border-border-misrah flex items-center justify-center text-primary group-hover:bg-accent group-hover:text-white transition-all shadow-sm shrink-0">
                          <FileText size={20} />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-black text-primary uppercase tracking-tight group-hover:text-accent transition-colors truncate">{documentLabel(doc.type)}</div>
                          <div className="text-[10px] font-bold text-muted-text uppercase tracking-widest mt-1">
                            {uploaded ? `Uploaded ${uploaded}` : 'Uploaded'}
                          </div>
                        </div>
                        {doc.url && (
                          <ArrowUpRight size={16} className="ml-auto shrink-0 text-muted-text group-hover:text-accent group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                        )}
                      </>
                    );
                    // Only openable when the API returns a link for the file —
                    // a bare fileId has no URL to open.
                    return doc.url ? (
                      <a
                        key={doc.id}
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-6 rounded-[28px] bg-white border border-border-misrah flex items-center gap-5 group hover:border-accent hover:shadow-md transition-all shadow-sm"
                      >
                        {content}
                      </a>
                    ) : (
                      <div
                        key={doc.id}
                        title={`File ID: ${doc.fileId}`}
                        className="p-6 rounded-[28px] bg-white border border-border-misrah flex items-center gap-5 shadow-sm"
                      >
                        {content}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Info (1/3) — Partner Node + Network Reputation, admin only. */}
          {isAdmin && (
          <div className="p-8 lg:p-12 space-y-12 bg-surface/30">
            {/* Host Section */}
            <div className="space-y-6">
              <h4 className="text-[11px] font-black uppercase tracking-[4px] text-muted-text">Partner Node</h4>
              {property.hostId ? (
                <div className="p-8 bg-white border border-border-misrah rounded-[40px] shadow-sm space-y-8">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-24 h-24 rounded-[32px] bg-accent/20 flex items-center justify-center text-accent font-black text-4xl mb-6 shadow-luxury">
                      {property.hostName?.charAt(0) || 'H'}
                    </div>
                    <div className="space-y-2">
                      <div className="text-[10px] font-black text-accent uppercase tracking-[4px]">Elite Contributor</div>
                      <h3 className="text-2xl font-black italic text-primary uppercase leading-tight tracking-tight">{property.hostName || 'Premier Host'}</h3>
                      <div className="text-[10px] font-bold text-muted-text uppercase tracking-widest mt-2">{property.hostId.toUpperCase()}</div>
                    </div>
                  </div>

                  <div className="pt-8 border-t border-border-misrah flex flex-col gap-3">
                    <button
                      type="button"
                      onClick={() => setShowNodeVerificationModal(true)}
                      className="w-full py-4 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-[4px] hover:opacity-90 transition-all shadow-lg flex items-center justify-center gap-2.5 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <UserCheck size={14} className="text-accent" />
                      <span>Verify Host Profile</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-8 bg-white border border-border-misrah rounded-[40px] shadow-sm space-y-6">
                  <span className="inline-block px-3 py-1 rounded-full bg-primary/5 text-primary text-[9px] font-black uppercase tracking-[2px]">
                    System Assignment Node
                  </span>
                  <div>
                    <h3 className="text-xl font-black italic text-primary uppercase">Managed by Admin</h3>
                    <p className="text-xs text-muted-text font-medium mt-1">This listing is marked as unassigned. No owner has been linked yet.</p>
                  </div>
                  <div className="p-6 rounded-2xl bg-surface border border-border-misrah flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <ShieldCheck size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-primary">Managed by Admin</p>
                      <span className="text-[9px] font-black uppercase tracking-widest text-accent bg-accent/10 px-2 py-0.5 rounded-full">
                        Unassigned · Admin Managed
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowReassignModal(true)}
                    className="w-full py-4 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-[4px] hover:opacity-90 transition-all shadow-lg flex items-center justify-center gap-2"
                  >
                    <RefreshCw size={14} /> Reassign Node
                  </button>
                </div>
              )}
            </div>

            {/* Performance Node */}
            <div className="space-y-6">
              <h4 className="text-[11px] font-black uppercase tracking-[4px] text-muted-text">Network Reputation</h4>
              <div className="p-8 bg-white border border-border-misrah rounded-[40px] shadow-sm space-y-8">
                <div className="flex flex-col items-center text-center">
                   <div className="text-[10px] font-black text-muted-text/50 uppercase tracking-[4px] mb-4">Host Quality Rating</div>
                   {/* The host's own stats (owner.totalReviews / reviewsCount,
                       owner.avgRating) — falls back to this property's when absent. */}
                   <div className="text-6xl font-black italic text-primary mb-2 tracking-tighter">
                     {Number((property.hostRating ?? property.rating ?? 0).toFixed(1))}
                   </div>
                   <div className="flex text-accent gap-1">
                     {[...Array(5)].map((_, i) => <CheckCircle2 key={i} size={14} fill="currentColor" />)}
                   </div>
                   <div className="text-[10px] font-bold text-muted-text uppercase tracking-widest mt-4">Calculated from {property.hostReviews ?? property.reviews ?? 0} review{(property.hostReviews ?? property.reviews ?? 0) === 1 ? '' : 's'}</div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-8 border-t border-border-misrah">
                  <div className="bg-surface p-5 rounded-2xl text-center">
                    <p className="text-[9px] font-black text-accent uppercase tracking-widest mb-1.5">Load</p>
                    <p className="text-lg font-black italic text-primary">
                      {property.load !== null && property.load !== undefined ? `${Number(property.load.toFixed(1))}%` : '—'}
                    </p>
                  </div>
                  <div className="bg-surface p-5 rounded-2xl text-center">
                    <p className="text-[9px] font-black text-accent uppercase tracking-widest mb-1.5">Rep</p>
                    <p className="text-lg font-black italic text-primary">Elite</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          )}
        </div>
      </div>

      {/* Compliance Audit Modal */}
      <AuditDocsModal
        isOpen={showAuditModal}
        onClose={() => {
          setShowAuditModal(false);
          setSelectedAuditDocId(null);
        }}
        property={property}
        user={user}
        initialDocId={selectedAuditDocId}
      />

      {/* Node Profile Verification Modal */}
      <NodeProfileVerificationModal
        isOpen={showNodeVerificationModal}
        onClose={() => setShowNodeVerificationModal(false)}
        property={property}
        user={user}
      />

      {showReassignModal && (
        <ReassignHostModal
          property={property}
          onClose={() => setShowReassignModal(false)}
          onAssign={onAssignHost}
        />
      )}
    </motion.div>
  );
};
