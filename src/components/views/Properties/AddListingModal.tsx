import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  ChevronRight, 
  Minus, 
  Plus, 
  Home, 
  Building2, 
  Building as BuildingIcon, 
  Maximize, 
  Wifi, 
  Wind, 
  Tv, 
  Coffee, 
  Waves,
  Upload,
  ArrowUpRight,
  MapPin,
  Calendar,
  FileText,
  ShieldCheck,
  Check,
  AlertCircle
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, isToday } from 'date-fns';
import { Property } from '../../../types';
import { Badge } from '../../ui/Badge';

interface AddListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (newProp: Omit<Property, 'id' | 'rating' | 'reviews' | 'active' | 'hostId'>) => void;
  user: any;
}

export const AddListingModal = ({ isOpen, onClose, onAdd, user }: AddListingModalProps) => {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    city: 'Dubai',
    type: 'City',
    category: '',
    price: '550',
    priceWeekday: '450',
    priceWeekend: '650',
    beds: 1,
    baths: 1,
    bedrooms: 1,
    guests: 4,
    amenities: [] as string[],
    description: '',
    image: 'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=800&q=80',
    availability: 'Instant',
    availabilityDate: new Date().toISOString(),
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

  useEffect(() => {
    if (isOpen) {
      setStep(0);
      setFormData({
        name: '',
        city: 'Dubai',
        type: 'City',
        category: '',
        price: '550',
        priceWeekday: '450',
        priceWeekend: '650',
        beds: 1,
        baths: 1,
        bedrooms: 1,
        guests: 4,
        amenities: [],
        description: '',
        image: 'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=800&q=80',
        availability: 'Instant',
        availabilityDate: new Date().toISOString(),
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
    }
  }, [isOpen, user]);

  const photoInputRef = useRef<HTMLInputElement>(null);
  const propertyDocRef = useRef<HTMLInputElement>(null);
  const idRef = useRef<HTMLInputElement>(null);
  const licenseRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleNext = () => {
    if (step === 0 && user.verificationStatus !== 'Approved' && user.role !== 'admin') {
      setStep(5); // Jump to verification if not approved
      return;
    }
    setStep(s => s + 1);
  };
  const handleBack = () => {
    if (step === 5 && user.verificationStatus !== 'Approved' && user.role !== 'admin') {
      setStep(0);
      return;
    }
    setStep(s => s - 1);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    onAdd({
      ...formData,
      price: Number(formData.price),
      beds: Number(formData.beds),
      baths: Number(formData.baths),
      isFeatured: false, // Default for new properties
      hostName: 'Current User', // In a real app, this would be user.name
    });
  };

  const handleFileSelect = (field: string, fileName: string) => {
    setFormData(prev => ({
      ...prev,
      verifications: {
        ...prev.verifications,
        [field]: fileName
      }
    }));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData(prev => ({ ...prev, image: event.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const categories = [
    { id: 'Villa', icon: Home, desc: 'A standalone luxury home with private space' },
    { id: 'Apartment', icon: Building2, desc: 'Quality living in shared residential buildings' },
    { id: 'Studio', icon: BuildingIcon, desc: 'Efficient, single-room modern living spaces' },
    { id: 'Penthouse', icon: Maximize, desc: 'Exclusive top-floor luxury with city views' },
  ];

  const amenitiesList = [
    { id: 'Wifi', icon: Wifi },
    { id: 'AC', icon: Wind },
    { id: 'TV', icon: Tv },
    { id: 'Coffee', icon: Coffee },
    { id: 'Pool', icon: Waves },
    { id: 'Parking', icon: Home },
  ];

  const Counter = ({ label, value, onChange }: any) => (
    <div className="flex items-center justify-between p-4 bg-surface rounded-2xl border border-border-misrah">
      <span className="text-sm font-bold text-primary">{label}</span>
      <div className="flex items-center gap-4">
        <button 
          type="button"
          onClick={() => onChange(Math.max(1, value - 1))}
          className="w-8 h-8 rounded-full border border-border-misrah flex items-center justify-center hover:bg-white transition-colors"
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
                { step: 0, label: 'Asset Taxonomy', icon: Building2 },
                { step: 1, label: 'Geography Index', icon: MapPin },
                { step: 2, label: 'Time Synchronization', icon: Calendar },
                { step: 3, label: 'Visual Inventory', icon: Upload },
                { step: 4, label: 'Strategic Narrative', icon: FileText },
                { step: 5, label: 'Security Protocols', icon: ShieldCheck }
              ].map((item) => (
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
                    <div className="text-[8px] font-black uppercase tracking-[2px] text-accent/50 mb-0.5">Phase 0{item.step + 1}</div>
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

        <div className="flex-1 flex flex-col bg-[#FCFAF8]/30">
          <div className="flex-1 p-12 overflow-y-auto scrollbar-hide max-h-[80vh]">
            <AnimatePresence mode="wait">
            {/* Step 0: Category */}
            {step === 0 && (
              <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
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

            {/* Step 1: Location */}
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                <div>
                  <h2 className="text-3xl font-black italic text-primary uppercase leading-tight">Where is it<br />located?</h2>
                </div>
                <div className="space-y-3">
                  {[
                    { id: 'Dubai', label: 'DUBAI' },
                    { id: 'Abu Dhabi', label: 'ABU DHABI' },
                    { id: 'Sharjah', label: 'SHARJAH' },
                    { id: 'RAK', label: 'RAS AL KHAIMAH' }
                  ].map(city => (
                    <button
                      key={city.id}
                      onClick={() => setFormData({...formData, city: city.id})}
                      className={`w-full px-8 py-5 rounded-[32px] border text-xs font-black tracking-[1px] transition-all flex items-center justify-between group
                        ${formData.city === city.id 
                          ? 'bg-primary text-accent border-primary shadow-lg shadow-primary/10' 
                          : 'bg-[#FCFAF8]/50 border-[#F2E8DF] text-[#D4C3B5] hover:border-accent hover:text-accent'}`}
                    >
                      <span className="flex-1 text-center">{city.label}</span>
                      <ChevronRight size={16} className={formData.city === city.id ? 'text-accent' : 'text-[#F2E8DF] group-hover:text-accent'} />
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 2: Availability Calendar */}
            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div className="flex flex-col items-center gap-4 mb-8">
                  <div className="bg-[#FCFAF8] border border-[#F2E8DF] px-6 py-2 rounded-full flex items-center gap-3">
                    <span className="text-[10px] font-black italic text-[#1A2B47] uppercase tracking-[1px]">Setup</span>
                    <div className="w-[1px] h-3 bg-[#D4C3B5]" />
                    <span className="text-[10px] font-bold text-[#D4C3B5] uppercase tracking-[1px]">Step 3</span>
                  </div>
                </div>

                <div className="bg-white rounded-[40px] border border-[#F2E8DF] p-8 shadow-sm">
                  <div className="grid grid-cols-7 mb-6">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                      <div key={`${day}-${i}`} className="text-center text-[10px] font-black text-[#D4C3B5] py-2">{day}</div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-y-4">
                    {(() => {
                      const monthStart = startOfMonth(currentMonth);
                      const monthEnd = endOfMonth(monthStart);
                      const startDate = startOfWeek(monthStart);
                      const endDate = endOfWeek(monthEnd);
                      const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

                      return calendarDays.map(day => {
                        const isCurrentMonth = isSameMonth(day, monthStart);
                        const isSelected = isSameDay(day, new Date(formData.availabilityDate));
                        const isTodayDate = isToday(day);

                        return (
                          <button
                            key={day.toString()}
                            onClick={() => setFormData({ ...formData, availabilityDate: day.toISOString() })}
                            className={`aspect-square w-10 mx-auto rounded-[14px] flex items-center justify-center text-xs transition-all relative
                              ${!isCurrentMonth ? 'text-muted-text/10 pointer-events-none' : ''}
                              ${isSelected 
                                ? 'bg-[#F8F3F0] text-[#1A2B47] font-black' 
                                : 'text-[#1A2B47] font-bold hover:bg-[#F8F3F0]/50'}
                              ${isTodayDate && !isSelected ? 'font-black scale-110' : ''}
                            `}
                          >
                            {format(day, 'd')}
                          </button>
                        );
                      });
                    })()}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 3: Photos (Finalizing the form logic) */}
            {step === 3 && (
                <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
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

                    <div className="grid grid-cols-2 gap-4">
                        <Counter label="Bedrooms" value={formData.bedrooms} onChange={(v: number) => setFormData({...formData, bedrooms: v})} />
                        <Counter label="Max Guests" value={formData.guests} onChange={(v: number) => setFormData({...formData, guests: v})} />
                    </div>
                </motion.div>
            )}

            {/* Step 4: Description */}
            {step === 4 && (
              <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                <div>
                  <h2 className="text-3xl font-black italic text-primary uppercase leading-tight">Strategic<br />Narrative</h2>
                  <p className="text-muted-text text-xs uppercase tracking-widest font-black mt-2">Describe the architectural and lifestyle nodes</p>
                </div>

                <div className="space-y-4">
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

            {/* Step 5: Verification */}
             {step === 5 && (
                <motion.div key="step5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
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
                          <span className="text-[11px] font-black uppercase tracking-[1px]">Emirates ID</span>
                          {formData.verifications.emiratesId ? <Check size={14} className="text-success" /> : <Upload size={14} className="text-muted-text" />}
                        </div>
                        <p className="text-[9px] font-bold text-muted-text uppercase tracking-[1px]">Front & Back clear scans</p>
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

                  <input ref={idRef} type="file" className="hidden" onChange={(e) => handleFileSelect('emiratesId', e.target.files?.[0]?.name || '')} />
                  <input ref={propertyDocRef} type="file" className="hidden" onChange={(e) => handleFileSelect('propertyDoc', e.target.files?.[0]?.name || '')} />
                  <input ref={licenseRef} type="file" className="hidden" onChange={(e) => handleFileSelect('tradeLicense', e.target.files?.[0]?.name || '')} />

                  {user.verificationStatus === 'Rejected' && user.rejectionReason && (
                    <div className="p-6 bg-danger/5 border border-danger/20 rounded-[32px] flex items-start gap-4">
                      <AlertCircle size={20} className="text-danger shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[10px] font-black text-danger uppercase tracking-[2px]">Verification Synchronization Failure</p>
                        <p className="text-xs font-bold text-danger mt-1">"{user.rejectionReason}"</p>
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

        <div className="p-8 pt-0 flex gap-4 w-full">
            {step > 0 && (
                <button 
                  onClick={handleBack}
                  className="flex-1 py-5 rounded-[28px] border border-[#F2E8DF] text-[10px] font-black uppercase tracking-[2px] text-primary hover:bg-surface transition-all"
                >
                  Back
                </button>
            )}
            <button 
              onClick={() => {
                if (step === 5) handleSubmit();
                else handleNext();
              }}
              className="flex-[2] py-5 rounded-[28px] bg-primary text-accent text-[10px] font-black uppercase tracking-[2px] shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
            >
              {step === 5 ? 'Confirm & Sync' : 'Proceed'}
            </button>
        </div>
      </div>
     </motion.div>
    </div>
  );
};
