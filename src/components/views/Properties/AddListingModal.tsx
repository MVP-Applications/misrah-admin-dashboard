import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  ChevronRight,
  ChevronLeft,
  Minus,
  Plus,
  Home,
  Building2,
  Building as BuildingIcon,
  Maximize,
  Wifi,
  Wind,
  Tv,
  CookingPot,
  Car,
  Waves,
  Upload,
  ArrowUpRight,
  MapPin,
  Calendar,
  FileText,
  ShieldCheck,
  Check,
  AlertCircle,
  Users,
  KeyRound,
  Loader2,
  Infinity as InfinityIcon,
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, isToday, startOfDay, addMonths, subMonths } from 'date-fns';
import { User } from '../../../types';
import { Badge } from '../../ui/Badge';
import { listActiveCities, uploadFile } from '../../../features/properties/api';
import { hostAssignmentToCreateFields } from '../../../features/properties/mappers';
import type { CityListItem, CreatePropertyRequest, HostAssignmentSelection } from '../../../features/properties/types';
import { HostAssignmentPicker } from './HostAssignmentPicker';
import { LocationPicker, type LatLng } from './LocationPicker';

const CATEGORY_TO_PROPERTY_TYPE: Record<string, CreatePropertyRequest['propertyType']> = {
  Villa: 'VILLA',
  Apartment: 'APARTMENT',
  Studio: 'STUDIO',
  Penthouse: 'PENTHOUSE',
};

// A picked calendar day (stored as a local-time ISO string) → that same
// calendar date at 00:00:00.000Z or 23:59:59.999Z.
const toUtcDayBoundary = (iso: string, edge: 'start' | 'end'): string => {
  const d = new Date(iso);
  return new Date(
    edge === 'start'
      ? Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0)
      : Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999),
  ).toISOString();
};

interface AddListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (payload: CreatePropertyRequest) => Promise<void>;
  user: User;
}

export const AddListingModal = ({ isOpen, onClose, onAdd, user }: AddListingModalProps) => {
  // Hosts list their own property — no "Who owns this property?" step.
  const isHost = user.role !== 'admin';
  const firstStep = isHost ? 1 : 0;
  // Displayed phase number for a step (hosts skip the ownership step).
  const phaseNo = (s: number) => String(isHost ? s : s + 1).padStart(2, '0');
  const [step, setStep] = useState(firstStep);
  const [ownerSelection, setOwnerSelection] = useState<HostAssignmentSelection | undefined>(undefined);
  const [cities, setCities] = useState<CityListItem[]>([]);
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [citiesError, setCitiesError] = useState<string | null>(null);

  // "Where is it located?" — GET /city/active/list. No city is preselected;
  // the admin picks one (required on submit).
  const loadCities = () => {
    setCitiesLoading(true);
    setCitiesError(null);
    listActiveCities()
      .then(setCities)
      .catch(err => {
        setCities([]);
        setCitiesError(err instanceof Error ? err.message : 'Failed to load cities.');
      })
      .finally(() => setCitiesLoading(false));
  };
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [verificationFiles, setVerificationFiles] = useState<{
    emiratesId?: File;
    propertyDoc?: File;
    tradeLicense?: File;
  }>({});
  const [formData, setFormData] = useState({
    name: '',
    cityId: '',
    cityName: '',
    category: '',
    address: '',
    location: null as LatLng | null,
    price: '',
    priceWeekday: '',
    priceWeekend: '',
    beds: 1,
    baths: 1,
    bedrooms: 1,
    adults: 2,
    children: 0,
    amenities: [] as string[],
    selfCheckIn: false,
    selfCheckInInstruction: '',
    description: '',
    image: '',
    availability: 'Instant',
    availabilityDate: new Date().toISOString(),
    availabilityEndDate: '',
    availabilityForever: false,
    availabilityTime: '12:00',
    verified: false,
    verifications: {
      emiratesId: null as string | null,
      phone: user?.verificationData?.phone || '',
      email: user?.email || '',
      propertyDoc: null as string | null, // Title Deed, Ejari, etc
      tradeLicense: null as string | null, // Company only
    },
  });

  const [currentMonth, setCurrentMonth] = useState(new Date());
  // Which end of the availability range the next calendar click sets.
  const [rangeField, setRangeField] = useState<'start' | 'end'>('start');

  useEffect(() => {
    if (isOpen) {
      setStep(firstStep);
      setOwnerSelection(undefined);
      setSubmitError(null);
      setImageFile(null);
      setVerificationFiles({});
      setFormData({
        name: '',
        cityId: '',
        cityName: '',
        category: '',
        address: '',
        location: null as LatLng | null,
        price: '',
        priceWeekday: '',
        priceWeekend: '',
        beds: 1,
        baths: 1,
        bedrooms: 1,
        adults: 2,
        children: 0,
        amenities: [],
        selfCheckIn: false,
        selfCheckInInstruction: '',
        description: '',
        image: '',
        availability: 'Instant',
        availabilityDate: new Date().toISOString(),
        availabilityEndDate: '',
        availabilityForever: false,
        availabilityTime: '12:00',
        verified: false,
        verifications: {
          emiratesId: null as string | null,
          phone: user?.verificationData?.phone || '',
          email: user?.email || '',
          propertyDoc: null as string | null,
          tradeLicense: null as string | null,
        },
      });
      setCurrentMonth(new Date());
      setRangeField('start');
      loadCities();
    }
  }, [isOpen, user]);

  const photoInputRef = useRef<HTMLInputElement>(null);
  const propertyDocRef = useRef<HTMLInputElement>(null);
  const idRef = useRef<HTMLInputElement>(null);
  const licenseRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Every step is shown in order — host verification is the last step
  // either way, so there's no shortcut past the listing details.
  const handleNext = () => setStep(s => Math.min(s + 1, 6));
  const handleBack = () => setStep(s => Math.max(s - 1, firstStep));

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!isHost && !ownerSelection) return;
    // AdminCreatePropertyDto requires title, description and pricing.basePrice;
    // point the admin at the phase that's missing it.
    const basePrice = Number(formData.price);
    const missing =
      !formData.name.trim() ? { step: 5, message: `Property title is required (Phase ${phaseNo(5)} · Strategic Narrative).` } :
      !formData.description.trim() ? { step: 5, message: `Description is required (Phase ${phaseNo(5)} · Strategic Narrative).` } :
      !formData.cityId ? { step: 2, message: `Select a city (Phase ${phaseNo(2)} · Geography Index).` } :
      !(basePrice > 0) ? { step: 4, message: `Base price per night is required (Phase ${phaseNo(4)} · Visual Inventory).` } :
      !formData.availabilityDate
        ? { step: 3, message: `Choose an availability start date (Phase ${phaseNo(3)} · Time Synchronization).` } :
      !formData.availabilityForever && !formData.availabilityEndDate
        ? { step: 3, message: `Choose an end date or turn on Available Forever (Phase ${phaseNo(3)} · Time Synchronization).` } :
      null;
    if (missing) {
      setSubmitError(missing.message);
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const imageId = imageFile ? (await uploadFile(imageFile)).id : undefined;
      const documentEntries = await Promise.all(
        (Object.entries(verificationFiles) as Array<[string, File | undefined]>)
          .filter((entry): entry is [string, File] => Boolean(entry[1]))
          .map(async ([type, file]) => ({ type, fileId: (await uploadFile(file)).id })),
      );

      await onAdd({
        ...(!isHost && ownerSelection ? hostAssignmentToCreateFields(ownerSelection) : {}),
        title: formData.name.trim(),
        description: formData.description.trim(),
        propertyType: CATEGORY_TO_PROPERTY_TYPE[formData.category] ?? 'APARTMENT',
        maxAdults: formData.adults,
        maxChildren: formData.children,
        bedrooms: formData.bedrooms,
        beds: formData.beds,
        bathrooms: formData.baths,
        pets: { allowed: false, maxPets: 0 },
        amenities: formData.amenities,
        selfCheckInAvailable: formData.selfCheckIn,
        // Availability: the picked calendar days as UTC start / end of day,
        // e.g. 2026-10-09T00:00:00.000Z → 2026-10-16T23:59:59.999Z.
        availableForever: formData.availabilityForever,
        startDate: toUtcDayBoundary(formData.availabilityDate, 'start'),
        ...(!formData.availabilityForever && formData.availabilityEndDate
          ? { endDate: toUtcDayBoundary(formData.availabilityEndDate, 'end') }
          : {}),
        ...(formData.selfCheckIn && formData.selfCheckInInstruction.trim()
          ? { selfCheckInInstruction: formData.selfCheckInInstruction.trim() }
          : {}),
        documents: documentEntries,
        images: imageId ? [imageId] : [],
        pricing: {
          basePrice,
          // Weekday/weekend rates are optional in the form — default to the base price.
          weekdayPrice: Number(formData.priceWeekday) > 0 ? Number(formData.priceWeekday) : basePrice,
          weekendPrice: Number(formData.priceWeekend) > 0 ? Number(formData.priceWeekend) : basePrice,
          currency: 'AED',
        },
        cityId: formData.cityId || undefined,
        ...(formData.address.trim() ? { address: formData.address.trim() } : {}),
        ...(formData.location ? { latitude: formData.location.lat, longitude: formData.location.lng } : {}),
      });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to create listing. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileSelect = (field: 'emiratesId' | 'propertyDoc' | 'tradeLicense', file: File) => {
    setVerificationFiles(prev => ({ ...prev, [field]: file }));
    setFormData(prev => ({
      ...prev,
      verifications: {
        ...prev.verifications,
        [field]: file.name
      }
    }));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData(prev => ({ ...prev, image: event.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleAmenity = (id: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(id)
        ? prev.amenities.filter(a => a !== id)
        : [...prev.amenities, id],
    }));
  };

  const categories = [
    { id: 'Villa', icon: Home, desc: 'A standalone luxury home with private space' },
    { id: 'Apartment', icon: Building2, desc: 'Quality living in shared residential buildings' },
    { id: 'Studio', icon: BuildingIcon, desc: 'Efficient, single-room modern living spaces' },
    { id: 'Penthouse', icon: Maximize, desc: 'Exclusive top-floor luxury with city views' },
  ];

  // ids are what's sent in `amenities` (lowercase, matching the API examples).
  const amenitiesList = [
    { id: 'wifi', label: 'WiFi', icon: Wifi },
    { id: 'tv', label: 'TV', icon: Tv },
    { id: 'kitchen', label: 'Kitchen', icon: CookingPot },
    { id: 'ac', label: 'AC', icon: Wind },
    { id: 'parking', label: 'Parking', icon: Car },
    { id: 'pool', label: 'Pool', icon: Waves },
  ];

  const Counter = ({ label, value, onChange, min = 1 }: any) => (
    <div className="flex items-center justify-between p-4 bg-surface rounded-2xl border border-border-misrah">
      <span className="text-sm font-bold text-primary">{label}</span>
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className="w-8 h-8 rounded-full border border-border-misrah flex items-center justify-center hover:bg-white transition-colors disabled:opacity-30"
        >
          <Minus size={14} />
        </button>
        <span className="w-4 text-center font-black italic">{value}</span>
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          className="w-8 h-8 rounded-full border border-border-misrah flex items-center justify-center hover:bg-white transition-colors"
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-primary/60 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-[48px] w-full max-w-5xl min-h-[700px] relative z-10 shadow-luxury overflow-hidden flex flex-col md:flex-row"
      >
        {/* Progress Sidebar */}
        <div className="w-full md:w-80 bg-primary p-12 flex flex-col justify-between relative overflow-hidden shrink-0">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
             <div className="absolute -top-24 -left-24 w-64 h-64 rounded-full border border-accent rotate-12" />
             <div className="absolute top-1/2 -right-32 w-80 h-80 rounded-full border border-accent -rotate-12" />
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-16">
               <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center text-primary font-black italic">M</div>
               <span className="text-[10px] font-black uppercase tracking-[4px] text-accent">Strategic Node</span>
            </div>

            <div className="space-y-8">
              {[
                { step: 0, label: 'Ownership Node', icon: Users },
                { step: 1, label: 'Asset Taxonomy', icon: Building2 },
                { step: 2, label: 'Geography Index', icon: MapPin },
                { step: 3, label: 'Time Synchronization', icon: Calendar },
                { step: 4, label: 'Visual Inventory', icon: Upload },
                { step: 5, label: 'Strategic Narrative', icon: FileText },
                { step: 6, label: 'Security Protocols', icon: ShieldCheck }
              ].filter(item => !(isHost && item.step === 0)).map((item) => (
                <div
                  key={item.step}
                  className={`flex items-center gap-4 transition-all duration-500 ${step >= item.step ? 'opacity-100' : 'opacity-30'}`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center border transition-all duration-500
                    ${step === item.step ? 'bg-accent border-accent text-primary scale-110 shadow-lg shadow-accent/20' :
                      step > item.step ? 'bg-accent/10 border-accent/20 text-accent' : 'bg-transparent border-white/20 text-white'}`}
                  >
                    {step > item.step ? <Check size={14} /> : <item.icon size={14} />}
                  </div>
                  <div>
                    <div className="text-[8px] font-black uppercase tracking-[2px] text-accent/50 mb-0.5">Phase {phaseNo(item.step)}</div>
                    <div className="text-[11px] font-bold text-white uppercase tracking-wider">{item.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 pt-10 border-t border-white/10">
             <p className="text-[9px] font-black text-accent/30 uppercase tracking-[2px] leading-relaxed">
                Misrah Infrastructure Layer<br />
                Asset Onboarding Flow v2.4
             </p>
          </div>
        </div>

        <div className="flex-1 flex flex-col bg-[#FCFAF8]/30 justify-between">
          <div className="flex-1 p-12 overflow-y-auto scrollbar-hide max-h-[75vh]">
            <AnimatePresence mode="wait">
            {/* Step 0: Ownership */}
            {step === 0 && (
              <motion.div key="step-owner" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div>
                  <h2 className="text-2xl font-black italic text-primary">Who owns this property?</h2>
                  <p className="text-muted-text text-sm mt-1">Link an existing owner, register a new one, or list it as admin-managed</p>
                </div>
                <HostAssignmentPicker value={ownerSelection} onChange={setOwnerSelection} allowUnassigned />
              </motion.div>
            )}

            {/* Step 1: Category */}
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div>
                  <h2 className="text-2xl font-black italic text-primary">What kind of place is it?</h2>
                  <p className="text-muted-text text-sm mt-1">Choose the category that best describes your property</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => { setFormData({ ...formData, category: cat.id }); handleNext(); }}
                      className={`p-5 rounded-2xl border text-left flex flex-col gap-3 transition-all
                        ${formData.category === cat.id ? 'border-accent bg-accent/5' : 'border-border-misrah hover:border-accent hover:border-surface'}`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary">
                        <cat.icon size={20} />
                      </div>
                      <div>
                        <div className="font-bold text-sm">{cat.id}</div>
                        <div className="text-[10px] text-muted-text font-medium mt-0.5">{cat.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 2: Location */}
            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div>
                  <h2 className="text-3xl font-black italic text-primary uppercase leading-tight">Where is it<br />located?</h2>
                  <p className="text-muted-text text-xs mt-2">Choose the city, then pin the exact location on the map below.</p>
                </div>
                <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-[2px] text-muted-text block">City <span className="text-accent">*</span></label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {citiesLoading && (
                    <div className="col-span-full flex items-center justify-center gap-2 py-6 text-muted-text text-[10px] font-black uppercase tracking-widest">
                      <Loader2 size={14} className="animate-spin" /> Loading cities…
                    </div>
                  )}
                  {!citiesLoading && citiesError && (
                    <div className="col-span-full p-5 rounded-[28px] bg-danger/5 border border-danger/20 flex items-center justify-between gap-4">
                      <p className="text-xs font-bold text-danger">{citiesError}</p>
                      <button type="button" onClick={loadCities} className="px-5 py-2.5 rounded-2xl bg-primary text-accent text-[10px] font-black uppercase tracking-wider shrink-0">
                        Retry
                      </button>
                    </div>
                  )}
                  {!citiesLoading && !citiesError && cities.length === 0 && (
                    <p className="col-span-full text-center py-6 text-[10px] font-black text-muted-text/60 uppercase tracking-widest">No active cities available</p>
                  )}
                  {!citiesLoading && cities.map(city => (
                    <button
                      key={city._id}
                      type="button"
                      title={city.description}
                      onClick={() => setFormData({ ...formData, cityId: city._id, cityName: city.name })}
                      className={`px-4 py-3 rounded-2xl border text-left transition-all
                        ${formData.cityId === city._id
                          ? 'bg-primary text-accent border-primary shadow-lg shadow-primary/10'
                          : 'bg-[#FCFAF8] border-[#F2E8DF] text-primary hover:border-accent hover:bg-accent/10'}`}
                    >
                      <span className="block text-[11px] font-black uppercase tracking-[1px] truncate">{city.name}</span>
                      <span className={`block text-[9px] font-bold uppercase tracking-wider truncate ${formData.cityId === city._id ? 'text-white/50' : 'text-muted-text/60'}`}>
                        {city.country || '\u00a0'}
                      </span>
                    </button>
                  ))}
                </div>
                </div>
                <LocationPicker
                  value={formData.location}
                  onChange={location => setFormData(prev => ({ ...prev, location }))}
                  cityQuery={(() => {
                    const city = cities.find(c => c._id === formData.cityId);
                    return city ? [city.name, city.country].filter(Boolean).join(', ') : undefined;
                  })()}
                  // No street-address field — the pin's resolved address is sent as `address`.
                  onAddressResolved={address => setFormData(prev => ({ ...prev, address }))}
                />
              </motion.div>
            )}

            {/* Step 3: Availability Calendar */}
            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div className="flex flex-col items-center gap-4 mb-8">
                  <div className="bg-[#FCFAF8] border border-[#F2E8DF] px-6 py-2 rounded-full flex items-center gap-3">
                    <span className="text-[10px] font-black italic text-[#1A2B47] uppercase tracking-[1px]">Setup</span>
                    <div className="w-[1px] h-3 bg-[#D4C3B5]" />
                    <span className="text-[10px] font-bold text-[#D4C3B5] uppercase tracking-[1px]">Step 4</span>
                  </div>
                </div>

                {(() => {
                  const startDate = formData.availabilityDate ? new Date(formData.availabilityDate) : null;
                  const endDate = formData.availabilityEndDate ? new Date(formData.availabilityEndDate) : null;
                  const today = startOfDay(new Date());
                  const thisYear = today.getFullYear();
                  const years = Array.from({ length: 6 }, (_, i) => thisYear + i);
                  const canGoBack = startOfMonth(currentMonth) > startOfMonth(today);
                  const canGoForward = !(currentMonth.getFullYear() === years[years.length - 1] && currentMonth.getMonth() === 11);

                  // A click sets whichever end is active; the range is kept valid
                  // (an end before the start becomes the new start).
                  const isForever = formData.availabilityForever;
                  const setForever = (forever: boolean) => {
                    setFormData({ ...formData, availabilityForever: forever, availabilityEndDate: forever ? '' : formData.availabilityEndDate });
                    setRangeField(forever ? 'start' : 'end');
                  };

                  const pickDay = (day: Date) => {
                    // Clicking a selected day unselects it. Clearing the start
                    // clears the end too and goes back to picking a start.
                    if (startDate && isSameDay(day, startDate)) {
                      setFormData({ ...formData, availabilityDate: '', availabilityEndDate: '' });
                      setRangeField('start');
                      return;
                    }
                    if (endDate && isSameDay(day, endDate)) {
                      setFormData({ ...formData, availabilityEndDate: '' });
                      setRangeField('end');
                      return;
                    }
                    if (rangeField === 'start' || isForever || !startDate) {
                      setFormData({
                        ...formData,
                        availabilityDate: day.toISOString(),
                        availabilityEndDate: endDate && day > endDate ? '' : formData.availabilityEndDate,
                      });
                      if (!isForever) setRangeField('end');
                    } else if (startDate && day < startOfDay(startDate)) {
                      setFormData({ ...formData, availabilityDate: day.toISOString(), availabilityEndDate: '' });
                    } else {
                      setFormData({ ...formData, availabilityEndDate: day.toISOString() });
                    }
                  };

                  const monthStart = startOfMonth(currentMonth);
                  const calendarDays = eachDayOfInterval({ start: startOfWeek(monthStart), end: endOfWeek(endOfMonth(monthStart)) });

                  return (
                    <div className="space-y-6">
                      {/* Forever: start date only, never ends */}
                      <button
                        type="button"
                        role="switch"
                        aria-checked={isForever}
                        onClick={() => setForever(!isForever)}
                        className={`w-full p-4 rounded-[24px] border flex items-center justify-between gap-4 text-left transition-all ${isForever ? 'border-accent bg-accent/5' : 'border-[#F2E8DF] bg-white hover:border-accent/50'}`}
                      >
                        <span className="flex items-center gap-3">
                          <span className={`w-10 h-10 rounded-2xl flex items-center justify-center ${isForever ? 'bg-primary text-accent' : 'bg-primary/5 text-primary'}`}>
                            <InfinityIcon size={18} />
                          </span>
                          <span>
                            <span className="block text-xs font-black uppercase tracking-wider text-primary">Available Forever</span>
                            <span className="block text-[10px] font-medium text-muted-text mt-0.5">No end date — stays bookable from the start date onwards</span>
                          </span>
                        </span>
                        <span className={`w-12 h-6 rounded-full relative shrink-0 transition-all shadow-inner ${isForever ? 'bg-success' : 'bg-border-misrah'}`}>
                          <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${isForever ? 'left-7' : 'left-1'}`} />
                        </span>
                      </button>

                      {/* Start / End selectors */}
                      <div className="grid grid-cols-2 gap-4">
                        {([
                          { field: 'start' as const, label: 'Start Date', value: startDate },
                          { field: 'end' as const, label: 'End Date', value: endDate },
                        ]).map(f => (
                          <button
                            key={f.field}
                            type="button"
                            disabled={f.field === 'end' && isForever}
                            onClick={() => {
                              setRangeField(f.field);
                              if (f.value) setCurrentMonth(f.value);
                            }}
                            className={`p-4 rounded-[24px] border text-left transition-all disabled:cursor-not-allowed ${
                              f.field === 'end' && isForever
                                ? 'border-[#F2E8DF] bg-surface/60'
                                : rangeField === f.field ? 'border-accent bg-accent/5 shadow-sm' : 'border-[#F2E8DF] bg-white hover:border-accent/50'}`}
                          >
                            <span className="text-[9px] font-black uppercase tracking-[2px] text-muted-text block">{f.label}</span>
                            {f.field === 'end' && isForever ? (
                              <span className="text-sm font-black italic mt-1 text-accent flex items-center gap-1.5">
                                <InfinityIcon size={14} /> Forever
                              </span>
                            ) : (
                              <span className={`text-sm font-black italic block mt-1 ${f.value ? 'text-primary' : 'text-muted-text/40'}`}>
                                {f.value ? format(f.value, 'EEE, d MMM yyyy') : f.field === 'end' ? 'Select end date' : 'Select date'}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>

                      <div className="bg-white rounded-[40px] border border-[#F2E8DF] p-8 shadow-sm">
                        {/* Month / year navigation */}
                        <div className="flex items-center justify-between gap-3 mb-6">
                          <button
                            type="button"
                            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                            disabled={!canGoBack}
                            className="w-9 h-9 rounded-xl border border-[#F2E8DF] flex items-center justify-center text-primary hover:bg-surface disabled:opacity-30"
                          >
                            <ChevronLeft size={16} />
                          </button>
                          <div className="flex items-center gap-2">
                            <select
                              value={currentMonth.getMonth()}
                              onChange={e => setCurrentMonth(new Date(currentMonth.getFullYear(), Number(e.target.value), 1))}
                              className="bg-[#FCFAF8] border border-[#F2E8DF] rounded-xl px-3 py-2 text-xs font-black uppercase tracking-wider text-primary outline-none focus:border-accent"
                            >
                              {Array.from({ length: 12 }, (_, m) => (
                                <option key={m} value={m} disabled={currentMonth.getFullYear() === thisYear && m < today.getMonth()}>
                                  {format(new Date(2000, m, 1), 'MMMM')}
                                </option>
                              ))}
                            </select>
                            <select
                              value={currentMonth.getFullYear()}
                              onChange={e => {
                                const year = Number(e.target.value);
                                const month = year === thisYear ? Math.max(currentMonth.getMonth(), today.getMonth()) : currentMonth.getMonth();
                                setCurrentMonth(new Date(year, month, 1));
                              }}
                              className="bg-[#FCFAF8] border border-[#F2E8DF] rounded-xl px-3 py-2 text-xs font-black tracking-wider text-primary outline-none focus:border-accent"
                            >
                              {years.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                          </div>
                          <button
                            type="button"
                            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                            disabled={!canGoForward}
                            className="w-9 h-9 rounded-xl border border-[#F2E8DF] flex items-center justify-center text-primary hover:bg-surface disabled:opacity-30"
                          >
                            <ChevronRight size={16} />
                          </button>
                        </div>

                        <div className="grid grid-cols-7 mb-4">
                          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                            <div key={`${day}-${i}`} className="text-center text-[10px] font-black text-[#D4C3B5] py-2">{day}</div>
                          ))}
                        </div>

                        <div className="grid grid-cols-7 gap-y-2">
                          {calendarDays.map(day => {
                            const isCurrentMonth = isSameMonth(day, monthStart);
                            const isPast = day < today;
                            const isStart = !!startDate && isSameDay(day, startDate);
                            const isEnd = !!endDate && isSameDay(day, endDate);
                            const inRange = !!startDate && !!endDate && day > startDate && day < endDate;

                            return (
                              <button
                                key={day.toString()}
                                type="button"
                                disabled={!isCurrentMonth || isPast}
                                onClick={() => pickDay(day)}
                                className={`aspect-square w-10 mx-auto rounded-[14px] flex items-center justify-center text-xs transition-all relative
                                  ${!isCurrentMonth ? 'invisible' : ''}
                                  ${isStart || isEnd
                                    ? 'bg-primary text-accent font-black shadow-md'
                                    : inRange
                                      ? 'bg-accent/15 text-[#1A2B47] font-black'
                                      : isPast
                                        ? 'text-muted-text/25 cursor-not-allowed'
                                        : 'text-[#1A2B47] font-bold hover:bg-[#F8F3F0]'}
                                  ${isToday(day) && !isStart && !isEnd ? 'ring-1 ring-accent/50' : ''}
                                `}
                              >
                                {format(day, 'd')}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-3 px-2">
                        <p className="text-[10px] font-bold text-muted-text">
                          {isForever
                            ? 'Tap a day to set the start date. Available forever from then on.'
                            : rangeField === 'start' ? 'Tap a day to set the start date.' : 'Tap a day to set the end date.'}
                          {!isForever && startDate && endDate && ` · ${Math.round((startOfDay(endDate).getTime() - startOfDay(startDate).getTime()) / 86400000) + 1} days`}
                          {startDate && ' Tap a selected date again to clear it.'}
                        </p>
                        {!isForever && endDate && (
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, availabilityEndDate: '' })}
                            className="text-[10px] font-black uppercase tracking-wider text-accent hover:underline"
                          >
                            Clear end date
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </motion.div>
            )}

            {/* Step 4: Photos (Finalizing the form logic) */}
            {step === 4 && (
                <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                     <div>
                        <h2 className="text-3xl font-black italic text-primary uppercase leading-tight">Visual<br />Inventory</h2>
                        <p className="text-muted-text text-xs uppercase tracking-widest font-black mt-2">Upload high-resolution property imagery</p>
                    </div>

                    <div
                        onClick={() => photoInputRef.current?.click()}
                        className="group relative w-full h-80 rounded-[40px] border-2 border-dashed border-[#F2E8DF] overflow-hidden flex flex-col items-center justify-center gap-4 transition-all hover:bg-surface cursor-pointer"
                    >
                        {formData.image ? (
                        <>
                            <img src={formData.image} alt="Preview" className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform" />
                            <div className="relative z-10 bg-white/40 backdrop-blur-md px-6 py-2 rounded-full border border-white/40 text-[10px] font-black uppercase tracking-[2px]">Change Image</div>
                        </>
                        ) : (
                        <>
                            <div className="w-16 h-16 rounded-full bg-[#FCFAF8] flex items-center justify-center text-[#D4C3B5] group-hover:scale-110 transition-all">
                                <Upload size={24} />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[2px] text-[#D4C3B5]">Drop images here</span>
                        </>
                        )}
                        <input ref={photoInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-[10px] font-black uppercase tracking-[2px] text-accent">Nightly Pricing (AED)</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {([
                          { key: 'price', label: 'Base Price *', placeholder: '1200' },
                          { key: 'priceWeekday', label: 'Weekday', placeholder: 'Same as base' },
                          { key: 'priceWeekend', label: 'Weekend', placeholder: 'Same as base' },
                        ] as const).map(f => (
                          <div key={f.key} className="space-y-2">
                            <label className="text-[9px] font-black uppercase tracking-[2px] text-muted-text">{f.label}</label>
                            <input
                              type="number"
                              min={0}
                              inputMode="decimal"
                              value={formData[f.key]}
                              onChange={e => setFormData({ ...formData, [f.key]: e.target.value })}
                              placeholder={f.placeholder}
                              className="w-full bg-surface border border-border-misrah rounded-2xl px-5 py-4 text-xs font-bold text-primary outline-none focus:border-accent transition-all"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Counter label="Bedrooms" value={formData.bedrooms} onChange={(v: number) => setFormData({...formData, bedrooms: v})} />
                        <Counter label="Max Adults" value={formData.adults} onChange={(v: number) => setFormData({...formData, adults: v})} />
                        <Counter label="Max Children" min={0} value={formData.children} onChange={(v: number) => setFormData({...formData, children: v})} />
                        <Counter label="Beds" value={formData.beds} onChange={(v: number) => setFormData({...formData, beds: v})} />
                        <Counter label="Baths" value={formData.baths} onChange={(v: number) => setFormData({...formData, baths: v})} />
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-[10px] font-black uppercase tracking-[2px] text-accent">Amenities</h4>
                      <div className="flex flex-wrap gap-2">
                        {amenitiesList.map(a => (
                          <button
                            key={a.id}
                            type="button"
                            onClick={() => toggleAmenity(a.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full border text-[10px] font-black uppercase tracking-widest transition-all
                              ${formData.amenities.includes(a.id) ? 'bg-accent/10 border-accent text-primary' : 'border-border-misrah text-muted-text hover:border-accent'}`}
                          >
                            <a.icon size={14} /> {a.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Self check-in — selfCheckInAvailable (+ optional instructions) */}
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-black uppercase tracking-[2px] text-accent">Check-in</h4>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={formData.selfCheckIn}
                        onClick={() => setFormData({ ...formData, selfCheckIn: !formData.selfCheckIn })}
                        className={`w-full p-4 rounded-2xl border flex items-center justify-between gap-4 text-left transition-all
                          ${formData.selfCheckIn ? 'border-accent bg-accent/5' : 'border-border-misrah bg-surface hover:border-accent/50'}`}
                      >
                        <span className="flex items-center gap-3">
                          <span className={`w-10 h-10 rounded-xl flex items-center justify-center ${formData.selfCheckIn ? 'bg-primary text-accent' : 'bg-primary/5 text-primary'}`}>
                            <KeyRound size={16} />
                          </span>
                          <span>
                            <span className="block text-sm font-bold text-primary">Self Check-in</span>
                            <span className="block text-[10px] font-medium text-muted-text mt-0.5">
                              {formData.selfCheckIn ? 'Travelers can check themselves in' : 'Travelers are checked in by the host'}
                            </span>
                          </span>
                        </span>
                        <span className={`w-12 h-6 rounded-full relative shrink-0 transition-all shadow-inner ${formData.selfCheckIn ? 'bg-success' : 'bg-border-misrah'}`}>
                          <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${formData.selfCheckIn ? 'left-7' : 'left-1'}`} />
                        </span>
                      </button>
                      {formData.selfCheckIn && (
                        <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase tracking-[2px] text-muted-text">Self Check-in Instructions</label>
                          <textarea
                            value={formData.selfCheckInInstruction}
                            onChange={e => setFormData({ ...formData, selfCheckInInstruction: e.target.value })}
                            rows={3}
                            placeholder="e.g. Go to the lobby, input code 1234 on the smart lock."
                            className="w-full bg-surface border border-border-misrah rounded-2xl px-5 py-4 text-xs font-medium text-primary outline-none focus:border-accent transition-all resize-none"
                          />
                        </div>
                      )}
                    </div>
                </motion.div>
            )}

            {/* Step 5: Description */}
            {step === 5 && (
              <motion.div key="step5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                <div>
                  <h2 className="text-3xl font-black italic text-primary uppercase leading-tight">Strategic<br />Narrative</h2>
                  <p className="text-muted-text text-xs uppercase tracking-widest font-black mt-2">Describe the architectural and lifestyle nodes</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-[2px] text-muted-text">Property Title <span className="text-accent">*</span></label>
                    <input
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Modern Luxury Villa"
                      className="w-full bg-surface border border-border-misrah rounded-2xl px-6 py-4 text-sm font-bold text-primary outline-none focus:border-accent transition-all"
                    />
                  </div>
                  <label className="text-[9px] font-black uppercase tracking-[2px] text-muted-text block">Description <span className="text-accent">*</span></label>
                  <textarea
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    placeholder="This high-synchronization asset offers..."
                    className="w-full bg-surface border border-border-misrah rounded-[32px] p-8 text-sm font-medium text-primary outline-none focus:border-accent transition-all resize-none"
                    rows={8}
                  />
                  <div className="flex flex-wrap gap-2">
                    {['Luxury High-Rise', 'Beachfront Sanctuary', 'Desert Escape', 'Urban Modular'].map(tag => (
                      <button
                        key={tag}
                        onClick={() => setFormData({ ...formData, description: formData.description + ' ' + tag })}
                        className="px-4 py-2 border border-border-misrah rounded-full text-[9px] font-black uppercase tracking-widest text-[#D4C3B5] hover:border-accent hover:text-accent transition-all"
                      >
                        + {tag}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 6: Verification */}
             {step === 6 && (
                <motion.div key="step6" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-3xl font-black italic text-primary uppercase leading-tight">Host<br />Verification</h2>
                      {user.verificationStatus === 'Pending' && <Badge variant="gold">Audit Pending</Badge>}
                    </div>
                    <p className="text-muted-text text-xs uppercase tracking-widest font-black mt-2">UAE Compliance & Property Authentication</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black uppercase tracking-[2px] text-accent">Identity Verification</h4>
                      <div
                        onClick={() => idRef.current?.click()}
                        className={`p-6 rounded-[32px] border transition-all flex flex-col gap-2 cursor-pointer
                          ${formData.verifications.emiratesId ? 'bg-success/5 border-success/20' : 'bg-surface border-border-misrah hover:border-accent'}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-black uppercase tracking-[1px]">Passport / Emirates ID</span>
                          {formData.verifications.emiratesId ? <Check size={14} className="text-success" /> : <Upload size={14} className="text-muted-text" />}
                        </div>
                        <p className="text-[9px] font-bold text-muted-text uppercase tracking-[1px]">Passport photo page or Emirates ID front & back</p>
                      </div>

                      <div className="flex gap-3">
                         <div className="flex-1 p-4 bg-surface rounded-2xl border border-border-misrah flex flex-col gap-1">
                            <span className="text-[9px] font-black uppercase tracking-[1px] text-muted-text">Verified Phone</span>
                            <span className="text-[11px] font-bold text-primary">{formData.verifications.phone || '+971 -- --- ----'}</span>
                         </div>
                         <div className="flex-1 p-4 bg-surface rounded-2xl border border-border-misrah flex flex-col gap-1">
                            <span className="text-[9px] font-black uppercase tracking-[1px] text-muted-text">Verified Email</span>
                            <span className="text-[11px] font-bold text-primary">{formData.verifications.email}</span>
                          </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black uppercase tracking-[2px] text-accent">Property Authentication</h4>
                      <div
                        onClick={() => propertyDocRef.current?.click()}
                        className={`p-6 rounded-[32px] border transition-all flex flex-col gap-2 cursor-pointer
                          ${formData.verifications.propertyDoc ? 'bg-success/5 border-success/20' : 'bg-surface border-border-misrah hover:border-accent'}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-black uppercase tracking-[1px]">Title Deed / Ejari</span>
                          {formData.verifications.propertyDoc ? <Check size={14} className="text-success" /> : <Upload size={14} className="text-muted-text" />}
                        </div>
                        <p className="text-[9px] font-bold text-muted-text uppercase tracking-[1px]">Or Management Authorization</p>
                      </div>

                      <div
                        onClick={() => licenseRef.current?.click()}
                        className={`p-6 rounded-[32px] border transition-all flex flex-col gap-2 cursor-pointer
                          ${formData.verifications.tradeLicense ? 'bg-success/5 border-success/20' : 'bg-surface border-border-misrah hover:border-accent'}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-black uppercase tracking-[1px]">Trade License</span>
                          <span className="text-[8px] font-black text-muted-text uppercase tracking-[1px] bg-white px-2 py-0.5 rounded border">Optional</span>
                        </div>
                        <p className="text-[9px] font-bold text-muted-text uppercase tracking-[1px]">Required for corporate nodes</p>
                      </div>
                    </div>
                  </div>

                  <input ref={idRef} type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect('emiratesId', f); }} />
                  <input ref={propertyDocRef} type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect('propertyDoc', f); }} />
                  <input ref={licenseRef} type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect('tradeLicense', f); }} />

                  {user.verificationStatus === 'Rejected' && user.rejectionReason && (
                    <div className="p-6 bg-danger/5 border border-danger/20 rounded-[32px] flex items-start gap-4">
                      <AlertCircle size={20} className="text-danger shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[10px] font-black text-danger uppercase tracking-[2px]">Verification Synchronization Failure</p>
                        <p className="text-xs font-bold text-danger mt-1">"{user.rejectionReason}"</p>
                      </div>
                    </div>
                  )}

                  {submitError && (
                    <div className="p-6 bg-danger/5 border border-danger/20 rounded-[32px] flex items-start gap-4">
                      <AlertCircle size={20} className="text-danger shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[10px] font-black text-danger uppercase tracking-[2px]">Sync Failed</p>
                        <p className="text-xs font-bold text-danger mt-1">{submitError}</p>
                      </div>
                    </div>
                  )}

                  <div className="bg-primary/5 p-6 rounded-[32px] border border-primary/10">
                    <p className="text-[10px] font-black text-primary/40 uppercase tracking-[1.5px] leading-relaxed">
                      Hosts cannot publish listings until verification protocols are synchronized and approved by the Global Intelligence node.
                    </p>
                  </div>
                </motion.div>
             )}
          </AnimatePresence>
        </div>

        {/* Sticky Footer Navigation */}
        <div className="p-8 pt-4 pb-8 flex gap-4 w-full bg-white border-t border-border-misrah/40 items-center">
            {step > firstStep && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex-1 py-5 rounded-[28px] border border-[#F2E8DF] text-[10px] font-black uppercase tracking-[2px] text-primary hover:bg-surface transition-all"
                >
                  Back
                </button>
            )}
            <button
              type="button"
              disabled={submitting || (!isHost && step === 0 && !ownerSelection)}
              onClick={() => {
                if (step === 6) handleSubmit();
                else handleNext();
              }}
              className={`flex-[2] py-5 rounded-[28px] text-[10px] font-black uppercase tracking-[2px] transition-all
                ${(submitting || (!isHost && step === 0 && !ownerSelection))
                  ? 'bg-primary/30 text-white/50 cursor-not-allowed shadow-none'
                  : 'bg-primary text-accent shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95'}`}
            >
              {step === 6 ? (submitting ? 'Syncing…' : 'Confirm & Sync') : 'Proceed'}
            </button>
        </div>
      </div>
     </motion.div>
    </div>
  );
};
