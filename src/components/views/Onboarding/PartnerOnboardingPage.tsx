import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Languages,
  ArrowRight,
  Clock,
  BadgeCheck,
  Lock,
  User,
  Building2,
  Phone,
  Mail,
  X,
  Home,
  Compass,
  UtensilsCrossed,
  Check,
  Globe,
  MessageCircle,
  MessageSquare,
  Smartphone,
  Play,
  Sparkles,
  CalendarCheck,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { applyDocumentLanguage, getCurrentLanguage } from '../../../i18n/LanguageContext';
import { ONBOARDING_STRINGS, type OnboardingLang } from './onboardingStrings';
import { SOCIALS, SocialIcon, type SocialId } from './socialIcons';
import { createPartnerLead, type PartnerLeadRequest } from '../../../features/partnerLeads/api';
import { errorMessage } from '../../../api/errors';
import './onboarding.css';

// Public partner onboarding page (/partners) — a "register interest" form for
// stays / experiences / catering partners. Converted from the standalone
// onboarding/index.html. Submits to POST /partner-leads (x-api-key only).
//
// It owns its language (Arabic default; ?lang=en|ar, remembered per browser),
// and isolates itself from the dashboard: data-no-translate stops the
// dashboard's Arabic DOM translator, dark mode is lifted while it's open, and
// the document's lang/dir/title are restored on leave.

const ASSET = '/onboarding';
const LANG_KEY = 'misrah-lang';

const readInitialLang = (): OnboardingLang => {
  const param = new URLSearchParams(window.location.search).get('lang');
  if (param === 'en' || param === 'ar') return param;
  try {
    return localStorage.getItem(LANG_KEY) === 'en' ? 'en' : 'ar';
  } catch {
    return 'ar';
  }
};

type GroupKey = 'category' | 'city' | 'license' | 'timing' | 'booking' | 'contact';
type FieldKey = 'name' | 'business' | 'phone' | 'email';

const MULTI: Record<GroupKey, boolean> = { category: true, city: true, license: false, timing: false, booking: true, contact: false };

// Arabic keyboards may type Arabic-Indic digits — normalise before checking.
const westernDigits = (v: string) =>
  v.replace(/[٠-٩]/g, d => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d))).replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));
const cleanPhone = (v: string) => westernDigits(v).replace(/[\s-]/g, '');

const CHECKS: Record<FieldKey, (v: string) => boolean> = {
  name: v => v.trim().length > 1,
  business: v => v.trim().length > 1,
  phone: v => /^0?5\d{8}$|^0?[2-9]\d{7}$/.test(cleanPhone(v)),
  email: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),
};

// Accept "@handle", "handle" or a pasted profile link.
const cleanHandle = (id: SocialId, raw: string) => {
  let v = raw.trim();
  if (id === 'website') return v.replace(/\/+$/, '');
  v = v.replace(/^https?:\/\/(www\.)?[^/]+\//i, '').replace(/^(add|company|@)\/?/i, '');
  return v.split(/[/?#]/)[0].replace(/^@/, '');
};
const handleValid = (id: SocialId, h: string) =>
  id === 'website' ? /^(https?:\/\/)?[^\s.]+\.[^\s]{2,}$/i.test(h) : /^[A-Za-z0-9._-]{1,60}$/.test(h);

// Stateless pieces live at module level so re-renders don't remount them
// (keeps keyboard focus on a chip after toggling it).
const Chip = ({ pressed, onToggle, children, center }: { pressed: boolean; onToggle: () => void; children?: React.ReactNode; center?: boolean }) => (
  <button type="button" className={`ob-chip ${center ? 'justify-center' : ''}`} aria-pressed={pressed} onClick={onToggle}>
    {children}
  </button>
);
const Tick = () => (
  <span className="ob-tick"><Check strokeWidth={4} /></span>
);
const GroupError = ({ show, text }: { show: boolean; text: string }) =>
  show ? <p className="text-[10px] font-bold text-red-500 mt-2">{text}</p> : null;
const Label = ({ children }: { children?: React.ReactNode }) => (
  <span className="block text-[9px] font-black text-gray-400 uppercase tracking-[0.25em] mb-2">{children}</span>
);

export const PartnerOnboardingPage = () => {
  const [lang, setLang] = useState<OnboardingLang>(readInitialLang);
  const s = ONBOARDING_STRINGS[lang];
  const rootRef = useRef<HTMLDivElement>(null);

  // ---- Document language / title, dark-mode isolation
  useEffect(() => {
    const root = document.documentElement;
    root.lang = lang;
    root.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.title = s.title;
    document.querySelector('meta[name="description"]')?.setAttribute('content', s.description);
    try {
      localStorage.setItem(LANG_KEY, lang);
    } catch {
      // storage unavailable
    }
  }, [lang, s.title, s.description]);

  useEffect(() => {
    const html = document.documentElement;
    const wasDark = html.classList.contains('dark');
    const previousTitle = document.title;
    html.classList.remove('dark');
    return () => {
      if (wasDark) html.classList.add('dark');
      document.title = previousTitle;
      applyDocumentLanguage(getCurrentLanguage());
    };
  }, []);

  // ---- Nav: transparent over the hero, solid once scrolled
  const [navSolid, setNavSolid] = useState(false);
  useEffect(() => {
    const onScroll = () => setNavSolid(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // ---- About tabs
  const [tab, setTab] = useState<'what' | 'how'>('what');
  const aboutRef = useRef<HTMLElement>(null);
  const joinRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (window.location.hash === '#what' || window.location.hash === '#how') {
      setTab(window.location.hash.slice(1) as 'what' | 'how');
      aboutRef.current?.scrollIntoView();
    }
  }, []);
  const goToAbout = (next: 'what' | 'how') => (e: React.MouseEvent) => {
    e.preventDefault();
    setTab(next);
    aboutRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  const goToJoin = (e: React.MouseEvent) => {
    e.preventDefault();
    joinRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // ---- Form state
  const [fields, setFields] = useState({ name: '', business: '', phone: '', email: '', platforms: '', notes: '' });
  const [groups, setGroups] = useState<Record<GroupKey, string[]>>({
    category: [], city: [], license: [], timing: [], booking: [], contact: [],
  });
  const [invalid, setInvalid] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const clearInvalid = (key: string) =>
    setInvalid(prev => {
      if (!prev.has(key)) return prev;
      const next = new Set(prev);
      next.delete(key);
      return next;
    });

  const setField = (key: keyof typeof fields, value: string) => {
    setFields(f => ({ ...f, [key]: value }));
    clearInvalid(String(key));
  };

  const toggle = (group: GroupKey, value: string) => {
    setGroups(g => {
      const on = g[group].includes(value);
      const nextValues = MULTI[group] ? (on ? g[group].filter(v => v !== value) : [...g[group], value]) : [value];
      return { ...g, [group]: nextValues };
    });
    clearInvalid(group);
  };

  const showPlatforms = groups.booking.includes('Booking platform') || groups.booking.includes('Other websites');

  // ---- Social profiles — pick a platform, type the handle, it becomes a removable pill
  const [socials, setSocials] = useState<Array<{ id: SocialId; handle: string }>>([]);
  const [editingId, setEditingId] = useState<SocialId | null>(null);
  const [socialInput, setSocialInput] = useState('');
  const [socialError, setSocialError] = useState<string | null>(null);
  const socialInputRef = useRef<HTMLInputElement>(null);
  const socialLabel = (id: SocialId) => (id === 'website' ? s.website : SOCIALS.find(x => x.id === id)!.label);
  const editing = editingId ? SOCIALS.find(x => x.id === editingId)! : null;

  const openSocialEditor = (id: SocialId) => {
    setEditingId(id);
    setSocialInput('');
    setSocialError(null);
    setTimeout(() => socialInputRef.current?.focus(), 0);
  };
  const closeSocialEditor = () => {
    setEditingId(null);
    setSocialError(null);
  };
  // Returns false if the typed handle is invalid.
  const commitSocial = (): boolean => {
    if (!editingId) return true;
    const handle = cleanHandle(editingId, socialInput);
    if (!handle) {
      closeSocialEditor();
      return true;
    }
    if (!handleValid(editingId, handle)) {
      setSocialError(editingId === 'website' ? s.badWebsite : s.badHandle);
      return false;
    }
    setSocials(list => [...list.filter(x => x.id !== editingId), { id: editingId, handle }]);
    closeSocialEditor();
    return true;
  };

  const selectedContactLabel = useMemo(() => {
    const c = groups.contact[0];
    return c === 'Phone' ? s.phone : c === 'WhatsApp' ? s.whatsapp : c === 'Email' ? s.email : c === 'Message' ? s.message : '';
  }, [groups.contact, s]);

  // ---- Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextInvalid = new Set<string>();
    if (!commitSocial()) nextInvalid.add('socials');
    (Object.keys(CHECKS) as FieldKey[]).forEach(key => {
      if (!CHECKS[key](fields[key])) nextInvalid.add(key);
    });
    (Object.keys(groups) as GroupKey[]).forEach(key => {
      if (groups[key].length === 0) nextInvalid.add(key);
    });
    setInvalid(nextInvalid);

    if (nextInvalid.size > 0) {
      const order = ['name', 'business', 'phone', 'email', 'socials', 'category', 'city', 'license', 'timing', 'booking', 'contact'];
      const first = order.find(k => nextInvalid.has(k));
      rootRef.current?.querySelector(`[data-field="${first}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // Option values are the page's own labels upper-cased to the API codes
    // (e.g. "Abu Dhabi" → "ABU DHABI", "1-3 months" → "1-3 MONTHS").
    const code = (v: string) => v.toUpperCase();
    // The API has no field for the listed booking platforms — prepend them to notes.
    const platformsNote = showPlatforms && fields.platforms.trim() ? `Platforms / websites: ${fields.platforms.trim()}` : '';
    const notes = [platformsNote, fields.notes.trim()].filter(Boolean).join('\n\n');
    const payload: PartnerLeadRequest = {
      fullName: fields.name.trim(),
      businessName: fields.business.trim(),
      countryCode: '+971',
      phoneNumber: cleanPhone(fields.phone).replace(/^0/, ''),
      email: fields.email.trim(),
      socialMedia: socials.map(({ id, handle }) => {
        const p = SOCIALS.find(x => x.id === id)!;
        return { platform: p.label, handle: p.prefix + handle };
      }),
      offerings: groups.category.map(code),
      cities: groups.city.map(code),
      hasTradeLicense: code(groups.license[0]),
      joiningTimeline: code(groups.timing[0]),
      reservationManagement: groups.booking.map(code),
      preferredContactMethod: code(groups.contact[0]),
      ...(notes ? { notes } : {}),
    };

    setIsSubmitting(true);
    setFormError(null);
    try {
      await createPartnerLead(payload);
      setSubmitted(true);
      joinRef.current?.scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
      // Backend validation messages are English — show them in English mode only.
      setFormError(lang === 'en' ? errorMessage(err, s.sendFail) : s.sendFail);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---- Small render helpers
  const textField = (
    key: FieldKey,
    label: string,
    error: string,
    icon: React.ReactNode,
    input: React.ReactNode,
    ltr = false,
    extra?: React.ReactNode,
  ) => (
    <label className={`block ${invalid.has(key) ? 'ob-invalid' : ''}`} data-field={key}>
      <Label>{label}</Label>
      <div className="relative ob-field-wrap" dir={ltr ? 'ltr' : undefined}>
        <span className="ob-field-ico absolute start-4 top-1/2 -translate-y-1/2 text-gray-300 transition-colors">{icon}</span>
        {extra}
        {input}
      </div>
      {invalid.has(key) && <span className="block text-[10px] font-bold text-red-500 mt-1.5">{error}</span>}
    </label>
  );

  const cities: Array<[string, keyof typeof s.cities]> = [
    ['Abu Dhabi', 'auh'], ['Dubai', 'dxb'], ['Sharjah', 'shj'], ['Ajman', 'ajm'],
    ['Umm Al Quwain', 'uaq'], ['Ras Al Khaimah', 'rak'], ['Fujairah', 'fuj'],
  ];

  const navLinkClass = `nav-link transition-colors ${navSolid ? 'text-ob-primary' : 'text-white/80'} hover:text-ob-accent`;

  return (
    <div ref={rootRef} className="ob-root" data-lang={lang} dir={lang === 'ar' ? 'rtl' : 'ltr'} lang={lang} data-no-translate>
      {/* ============ NAV ============ */}
      <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${navSolid ? 'bg-white/90 backdrop-blur-xl shadow-sm' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 h-20 flex items-center justify-between">
          <a href="#top" onClick={e => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="bg-ob-primary p-2 rounded-2xl shadow-xl border border-white/10" aria-label="MISRAH">
            <img src={`${ASSET}/misrah-logo.png`} alt="MISRAH" className="h-6 md:h-7 w-auto object-contain" />
          </a>
          <div className="flex items-center gap-3 md:gap-8">
            <a href="#about" onClick={goToAbout('what')} className={`hidden md:inline text-[10px] font-black uppercase tracking-[0.2em] ${navLinkClass}`}>{s.nav_what}</a>
            <a href="#about" onClick={goToAbout('how')} className={`hidden md:inline text-[10px] font-black uppercase tracking-[0.2em] ${navLinkClass}`}>{s.nav_how}</a>
            <button
              type="button"
              onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
              style={{ borderColor: 'color-mix(in srgb, currentColor 30%, transparent)' }}
              className={`h-11 px-4 rounded-2xl border text-[11px] font-black uppercase tracking-[0.15em] flex items-center gap-2 ${navLinkClass}`}
            >
              <Languages className="w-4 h-4" /><span>{s.toggle}</span>
            </button>
            <a href="#join" onClick={goToJoin} className="h-11 px-5 bg-ob-accent text-ob-primary rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl flex items-center gap-2 active:scale-[0.98] transition-all hover:brightness-105">
              <span>{s.nav_join}</span> <ArrowRight className="w-4 h-4" strokeWidth={3} />
            </a>
          </div>
        </div>
      </nav>

      {/* ============ HERO (compact — the form sits right below) ============ */}
      <div id="top" className="relative bg-ob-primary overflow-hidden">
        <img
          src={`${ASSET}/hero-1280.jpg`}
          srcSet={`${ASSET}/hero-720.jpg 720w, ${ASSET}/hero-1280.jpg 1280w`}
          sizes="100vw"
          alt=""
          className="absolute inset-0 w-full h-full object-cover ob-pulse-slow"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-ob-primary/85 via-ob-primary/65 to-ob-primary" />

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pt-28 md:pt-32 pb-36 md:pb-44 text-center">
          <p className="ob-rise inline-flex items-center gap-2 h-8 px-3.5 rounded-full bg-white/10 border border-white/15 backdrop-blur text-white text-[11px] font-bold tracking-[0.04em]">
            <span className="w-1.5 h-1.5 rounded-full bg-ob-accent" /><span>{s.hero_pill}</span>
          </p>
          <h1 className="ob-hero-title ob-rise ob-rise-2 mt-6 text-2xl leading-[1.4] sm:text-3xl sm:leading-[1.4] lg:text-[2.5rem] lg:leading-[1.4] font-black text-white uppercase tracking-[0.01em] italic">
            {s.hero_title.line1}
            <br className="hidden md:block" />{' '}
            {s.hero_title.line2 && <>{s.hero_title.line2} </>}
            <span className="text-ob-accent">{s.hero_title.highlight}</span>
          </h1>
          <ul className="ob-rise ob-rise-3 mt-7 flex flex-wrap justify-center gap-x-6 gap-y-3 text-[10px] font-black uppercase tracking-[0.18em] text-white/80">
            <li className="flex items-center gap-2"><Clock className="w-4 h-4 text-ob-accent" /><span>{s.b_time}</span></li>
            <li className="flex items-center gap-2"><BadgeCheck className="w-4 h-4 text-ob-accent" /><span>{s.b_commit}</span></li>
            <li className="flex items-center gap-2"><Lock className="w-4 h-4 text-ob-accent" /><span>{s.b_private}</span></li>
          </ul>
        </div>
      </div>

      <div>
        {/* ============ FORM ============ */}
        <section id="join" ref={joinRef} className="relative z-20 -mt-24 md:-mt-32 max-w-4xl mx-auto px-4 sm:px-6 pb-16 md:pb-24 scroll-mt-24">
          {!submitted ? (
            <form onSubmit={handleSubmit} noValidate className="bg-white rounded-[2rem] md:rounded-[2.5rem] border border-gray-100 shadow-[0_25px_60px_-20px_rgba(14,35,75,0.25)] p-5 sm:p-8 md:p-10 space-y-10">
              <div className="text-center pb-8 border-b border-gray-100">
                <p className="text-[10px] font-black text-ob-accent uppercase tracking-[0.4em] mb-3">{s.join_eyebrow}</p>
                <h2 className="text-2xl md:text-4xl font-black text-ob-primary uppercase tracking-tight leading-[0.95] italic">{s.join_title}</h2>
                <p className="mt-3 text-gray-500 text-sm leading-relaxed font-medium max-w-md mx-auto">{s.join_text}</p>
              </div>

              {/* 1. Contact */}
              <fieldset className="space-y-4">
                <legend className="flex items-baseline gap-3 mb-5">
                  <span className="text-[10px] font-black text-ob-accent tracking-[0.3em]">01</span>
                  <span className="text-lg md:text-xl font-black text-ob-primary uppercase tracking-tight italic">{s.s1}</span>
                </legend>
                <div className="grid sm:grid-cols-2 gap-4">
                  {textField('name', s.f_name, s.e_name, <User className="w-4 h-4" />,
                    <input name="name" value={fields.name} onChange={e => setField('name', e.target.value)} autoComplete="name" className="ob-field" placeholder={s.ph_name} />)}
                  {textField('business', s.f_business, s.e_business, <Building2 className="w-4 h-4" />,
                    <input name="business" value={fields.business} onChange={e => setField('business', e.target.value)} autoComplete="organization" className="ob-field" placeholder={s.ph_business} />)}
                  {textField('phone', s.f_phone, s.e_phone, <Phone className="w-4 h-4" />,
                    <input
                      name="phone"
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel-national"
                      value={fields.phone}
                      onChange={e => setField('phone', e.target.value)}
                      className="ob-field"
                      style={{ paddingInlineStart: '6.5rem' }}
                      placeholder="50 123 4567"
                    />,
                    true,
                    <>
                      <span className="absolute start-11 top-1/2 -translate-y-1/2 h-4 w-px bg-gray-200" />
                      <span className="absolute start-14 top-1/2 -translate-y-1/2 text-[13px] font-black text-ob-primary/40">+971</span>
                    </>)}
                  {textField('email', s.f_email, s.e_email, <Mail className="w-4 h-4" />,
                    <input name="email" type="email" value={fields.email} onChange={e => setField('email', e.target.value)} autoComplete="email" className="ob-field" placeholder="you@business.ae" />,
                    true)}

                  {/* Social profiles */}
                  <div className="sm:col-span-2" data-field="socials">
                    <Label>{s.f_socials} <span className="text-gray-300">{s.optional}</span></Label>

                    {socials.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {socials.map(({ id, handle }) => {
                          const p = SOCIALS.find(x => x.id === id)!;
                          return (
                            <span key={id} className="ob-social-pill" title={socialLabel(id)}>
                              <span className="ob-social-ico"><SocialIcon id={id} /></span>
                              <span className="ob-handle" dir="ltr">{p.prefix + handle}</span>
                              <button type="button" aria-label={s.remove(socialLabel(id))} onClick={() => setSocials(list => list.filter(x => x.id !== id))}>
                                <X size={14} strokeWidth={3} />
                              </button>
                            </span>
                          );
                        })}
                      </div>
                    )}

                    {editing && (
                      <div className="mb-3">
                        <div className="flex gap-2">
                          <div className="relative ob-field-wrap flex-1 min-w-0" dir="ltr">
                            <span className="ob-social-ico absolute start-4 top-1/2 -translate-y-1/2 text-ob-primary"><SocialIcon id={editing.id} /></span>
                            {editing.prefix && (
                              <>
                                <span className="absolute start-11 top-1/2 -translate-y-1/2 h-4 w-px bg-gray-200" />
                                <span className="absolute start-14 top-1/2 -translate-y-1/2 text-[13px] font-black text-ob-primary/40">{editing.prefix}</span>
                              </>
                            )}
                            <input
                              ref={socialInputRef}
                              value={socialInput}
                              onChange={e => { setSocialInput(e.target.value); setSocialError(null); }}
                              onKeyDown={e => {
                                if (e.key === 'Enter') { e.preventDefault(); commitSocial(); }
                                if (e.key === 'Escape') closeSocialEditor();
                              }}
                              autoComplete="off"
                              autoCapitalize="off"
                              spellCheck={false}
                              className="ob-field"
                              style={{ paddingInlineStart: editing.prefix ? '4.75rem' : '3rem' }}
                              placeholder={editing.id === 'website' ? 'yourbusiness.ae' : s.handlePh(editing.label)}
                            />
                          </div>
                          <button type="button" onClick={commitSocial} className="h-14 px-5 bg-ob-primary text-ob-accent rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shrink-0 active:scale-[0.97] transition-all">{s.add}</button>
                          <button type="button" onClick={closeSocialEditor} aria-label={s.cancel} className="h-14 w-12 rounded-2xl border border-gray-100 text-gray-400 hover:text-ob-primary flex items-center justify-center shrink-0 transition-colors">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        {socialError && <p className="text-[10px] font-bold text-red-500 mt-1.5">{socialError}</p>}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                      {SOCIALS.filter(p => !socials.some(x => x.id === p.id)).map(p => (
                        <button key={p.id} type="button" className="ob-social-suggest" aria-pressed={editingId === p.id} onClick={() => openSocialEditor(p.id)}>
                          <span className="ob-social-ico"><SocialIcon id={p.id} /></span>+ <span>{socialLabel(p.id)}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </fieldset>

              {/* 2. Business */}
              <fieldset className="space-y-7">
                <legend className="flex items-baseline gap-3 mb-5">
                  <span className="text-[10px] font-black text-ob-accent tracking-[0.3em]">02</span>
                  <span className="text-lg md:text-xl font-black text-ob-primary uppercase tracking-tight italic">{s.s2}</span>
                </legend>

                <div data-field="category">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.25em] mb-3">{s.q_offer} <span className="text-gray-300">{s.all_apply}</span></p>
                  <div className="grid grid-cols-3 gap-3">
                    {([['Stays', s.stays, Home], ['Experiences', s.experiences, Compass], ['Catering', s.catering, UtensilsCrossed]] as const).map(([value, label, Icon]) => (
                      <button key={value} type="button" className="ob-type-card" aria-pressed={groups.category.includes(value)} onClick={() => toggle('category', value)}>
                        <span className="ob-ico"><Icon className="w-5 h-5" /></span>
                        <span className="mt-3 font-black uppercase tracking-widest text-[9px] sm:text-[10px] text-ob-primary">{label}</span>
                      </button>
                    ))}
                  </div>
                  <GroupError show={invalid.has('category')} text={s.e_one} />
                </div>

                <div data-field="city">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.25em] mb-3">{s.q_city} <span className="text-gray-300">{s.all_apply}</span></p>
                  <div className="flex flex-wrap gap-2.5">
                    {cities.map(([value, key]) => (
                      <React.Fragment key={value}>
                        <Chip pressed={groups.city.includes(value)} onToggle={() => toggle('city', value)}><Tick /><span>{s.cities[key]}</span></Chip>
                      </React.Fragment>
                    ))}
                  </div>
                  <GroupError show={invalid.has('city')} text={s.e_city} />
                </div>

                <div className="grid sm:grid-cols-2 gap-7">
                  <div data-field="license">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.25em] mb-3">{s.q_license}</p>
                    <div className="flex flex-wrap gap-2.5">
                      <Chip pressed={groups.license.includes('Yes')} onToggle={() => toggle('license', 'Yes')}><Tick /><span>{s.yes}</span></Chip>
                      <Chip pressed={groups.license.includes('No')} onToggle={() => toggle('license', 'No')}><Tick /><span>{s.no}</span></Chip>
                    </div>
                    <GroupError show={invalid.has('license')} text={s.e_choose} />
                  </div>
                  <div data-field="timing">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.25em] mb-3">{s.q_timing}</p>
                    <div className="flex flex-wrap gap-2.5">
                      <Chip pressed={groups.timing.includes('Immediately')} onToggle={() => toggle('timing', 'Immediately')}><Tick /><span>{s.t_now}</span></Chip>
                      <Chip pressed={groups.timing.includes('1-3 months')} onToggle={() => toggle('timing', '1-3 months')}><Tick /><span>{s.t_soon}</span></Chip>
                      <Chip pressed={groups.timing.includes('Just exploring')} onToggle={() => toggle('timing', 'Just exploring')}><Tick /><span>{s.t_explore}</span></Chip>
                    </div>
                    <GroupError show={invalid.has('timing')} text={s.e_choose} />
                  </div>
                </div>

                <div data-field="booking">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.25em] mb-3">{s.q_booking} <span className="text-gray-300">{s.all_apply}</span></p>
                  <div className="flex flex-wrap gap-2.5">
                    <Chip pressed={groups.booking.includes('WhatsApp')} onToggle={() => toggle('booking', 'WhatsApp')}><Tick /><span>{s.whatsapp}</span></Chip>
                    <Chip pressed={groups.booking.includes('Phone')} onToggle={() => toggle('booking', 'Phone')}><Tick /><span>{s.phone}</span></Chip>
                    <Chip pressed={groups.booking.includes('Instagram')} onToggle={() => toggle('booking', 'Instagram')}><Tick /><span>{s.instagram}</span></Chip>
                    <Chip pressed={groups.booking.includes('Booking platform')} onToggle={() => toggle('booking', 'Booking platform')}><Tick /><span>{s.bk_platform}</span></Chip>
                    <Chip pressed={groups.booking.includes('Other websites')} onToggle={() => toggle('booking', 'Other websites')}><Tick /><span>{s.bk_web}</span></Chip>
                  </div>
                  <GroupError show={invalid.has('booking')} text={s.e_one} />

                  {showPlatforms && (
                    <div className="ob-reveal mt-4">
                      <label className="block">
                        <Label>{s.q_platforms} <span className="text-gray-300">{s.list_them}</span></Label>
                        <div className="relative ob-field-wrap">
                          <Globe className="ob-field-ico w-4 h-4 absolute start-4 top-1/2 -translate-y-1/2 text-gray-300 transition-colors" />
                          <input name="platforms" value={fields.platforms} onChange={e => setField('platforms', e.target.value)} className="ob-field" placeholder={s.ph_platforms} />
                        </div>
                      </label>
                    </div>
                  )}
                </div>
              </fieldset>

              {/* 3. Contact preference */}
              <fieldset className="space-y-7">
                <legend className="flex items-baseline gap-3 mb-5">
                  <span className="text-[10px] font-black text-ob-accent tracking-[0.3em]">03</span>
                  <span className="text-lg md:text-xl font-black text-ob-primary uppercase tracking-tight italic">{s.s3}</span>
                </legend>

                <div data-field="contact">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.25em] mb-3">{s.q_contact}</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <Chip pressed={groups.contact.includes('Phone')} onToggle={() => toggle('contact', 'Phone')} center><Phone className="w-4 h-4" /><span>{s.phone}</span></Chip>
                    <Chip pressed={groups.contact.includes('WhatsApp')} onToggle={() => toggle('contact', 'WhatsApp')} center><MessageCircle className="w-4 h-4" /><span>{s.whatsapp}</span></Chip>
                    <Chip pressed={groups.contact.includes('Email')} onToggle={() => toggle('contact', 'Email')} center><Mail className="w-4 h-4" /><span>{s.email}</span></Chip>
                    <Chip pressed={groups.contact.includes('Message')} onToggle={() => toggle('contact', 'Message')} center><MessageSquare className="w-4 h-4" /><span>{s.message}</span></Chip>
                  </div>
                  <GroupError show={invalid.has('contact')} text={s.e_choose} />
                </div>

                <label className="block">
                  <Label>{s.q_notes} <span className="text-gray-300">{s.optional}</span></Label>
                  <textarea
                    name="notes"
                    rows={3}
                    value={fields.notes}
                    onChange={e => setField('notes', e.target.value)}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-[13px] font-semibold text-ob-primary outline-none focus:bg-white focus:border-ob-accent transition-all resize-none placeholder:text-gray-300"
                    placeholder={s.ph_notes}
                  />
                </label>
              </fieldset>

              <div className="pt-2 space-y-4">
                <button type="submit" disabled={isSubmitting} className="w-full h-14 bg-ob-primary text-ob-accent rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-3 hover:brightness-110 disabled:opacity-60">
                  <span>{isSubmitting ? s.sending : s.submit}</span>
                  <ArrowRight className="w-4 h-4" strokeWidth={3} />
                </button>
                {formError && <p className="text-center text-[11px] font-bold text-red-500">{formError}</p>}
                <p className="text-center text-[9px] font-bold text-gray-300 uppercase tracking-widest">{s.privacy}</p>
              </div>
            </form>
          ) : (
            /* Success state */
            <div className="bg-ob-primary rounded-[2rem] md:rounded-[2.5rem] p-8 md:p-14 text-center relative overflow-hidden">
              <div className="absolute -start-20 -bottom-20 w-72 h-72 rounded-full bg-ob-accent/10 blur-2xl" />
              <div className="relative">
                <div className="mx-auto w-16 h-16 rounded-full bg-ob-accent text-ob-primary flex items-center justify-center mb-6"><Check className="w-8 h-8" strokeWidth={3} /></div>
                <p className="text-ob-accent text-[10px] font-black tracking-[0.5em] uppercase">{s.ok_eyebrow}</p>
                <h3 className="mt-4 text-3xl md:text-4xl font-black text-white uppercase tracking-tight italic leading-[0.95]">{s.ok_title}</h3>
                <p className="mt-4 text-white/60 text-sm leading-relaxed max-w-md mx-auto">
                  <span>{s.ok_pre}</span> <span className="text-ob-accent font-bold">{selectedContactLabel}</span><span>{s.ok_post}</span>
                </p>
              </div>
            </div>
          )}
        </section>

        {/* ============ ABOUT (tabs: What is Misrah / How it works) ============ */}
        <section id="about" ref={aboutRef} className="bg-ob-bg rounded-t-[3rem] md:rounded-t-[4rem] scroll-mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-16 md:py-20">
            <div className="flex flex-col items-center text-center mb-10 md:mb-12">
              <p className="text-[10px] font-black text-ob-accent uppercase tracking-[0.4em] mb-5">{s.about_eyebrow}</p>
              <div role="tablist" className="inline-flex bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm">
                {(['what', 'how'] as const).map(id => (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    aria-selected={tab === id}
                    tabIndex={tab === id ? 0 : -1}
                    className="ob-tab"
                    onClick={() => setTab(id)}
                    onKeyDown={e => {
                      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') setTab(tab === 'what' ? 'how' : 'what');
                    }}
                  >
                    {id === 'what' ? s.nav_what : s.nav_how}
                  </button>
                ))}
              </div>
            </div>

            {tab === 'what' ? (
              <div role="tabpanel" className="ob-tab-panel">
                <div className="grid lg:grid-cols-12 gap-6 lg:gap-16 items-end mb-10 md:mb-12">
                  <h2 className="lg:col-span-7 text-3xl md:text-5xl font-black text-ob-primary uppercase tracking-tight leading-[0.95] italic">
                    {s.what_title.line1}<br className="hidden sm:block" /> {s.what_title.line2}
                  </h2>
                  <p className="lg:col-span-5 text-gray-500 text-sm md:text-[15px] leading-relaxed font-medium">{s.what_text}</p>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
                  {([
                    ['stays.jpg', s.stays, s.stays_text, Home, ''],
                    ['experiences.jpg', s.experiences, s.exp_text, Compass, ''],
                    ['catering.jpg', s.catering, s.cat_text, UtensilsCrossed, 'sm:col-span-2 lg:col-span-1'],
                  ] as const).map(([img, title, text, Icon, span]) => (
                    <article key={img} className={`group relative h-[20rem] md:h-[24rem] rounded-[2rem] md:rounded-[2.5rem] overflow-hidden shadow-xl ${span}`}>
                      <img src={`${ASSET}/${img}`} alt="" loading="lazy" decoding="async" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                      <div className="absolute inset-0 bg-gradient-to-t from-ob-primary via-ob-primary/30 to-transparent" />
                      <div className="absolute inset-x-0 bottom-0 p-6 md:p-7">
                        <div className="w-11 h-11 rounded-xl bg-ob-primary text-ob-accent flex items-center justify-center mb-4 border border-white/10"><Icon className="w-5 h-5" /></div>
                        <h3 className="text-2xl font-black text-white uppercase tracking-tight italic">{title}</h3>
                        <p className="mt-2 text-white/70 text-[13px] leading-relaxed font-medium">{text}</p>
                      </div>
                    </article>
                  ))}
                </div>

                {/* It's an app */}
                <div className="mt-6 md:mt-8 bg-ob-primary rounded-[2rem] md:rounded-[2.5rem] p-6 sm:p-8 md:p-10 relative overflow-hidden flex flex-col md:flex-row md:items-center gap-6 md:gap-10">
                  <div className="absolute -end-20 -top-20 w-64 h-64 rounded-full bg-ob-accent/10 blur-2xl" />
                  <div className="relative w-14 h-14 shrink-0 rounded-2xl bg-ob-accent text-ob-primary flex items-center justify-center"><Smartphone className="w-7 h-7" /></div>
                  <div className="relative flex-1">
                    <p className="text-[10px] font-black text-ob-accent uppercase tracking-[0.4em] mb-2">{s.app_eyebrow}</p>
                    <h3 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight italic leading-[0.95]">{s.app_title}</h3>
                    <p className="mt-3 text-white/60 text-[13px] leading-relaxed max-w-xl">{s.app_text}</p>
                  </div>
                  <div className="relative flex flex-wrap gap-2.5 shrink-0">
                    {([[Smartphone, 'App Store'], [Play, 'Google Play']] as const).map(([Icon, store]) => (
                      <span key={store} className="h-12 px-4 rounded-2xl border border-white/15 bg-white/5 text-white flex items-center gap-2.5">
                        <Icon className="w-4 h-4 text-ob-accent" />
                        <span className="leading-tight">
                          <span className="block text-[9px] text-white/50 font-bold">{s.soon_on}</span>
                          <span className="block text-[13px] font-black" dir="ltr">{store}</span>
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div role="tabpanel" className="ob-tab-panel">
                <div className="bg-ob-primary rounded-[2.5rem] md:rounded-[3rem] p-7 sm:p-10 md:p-12 relative overflow-hidden">
                  <div className="absolute -end-24 -top-24 w-72 h-72 rounded-full bg-ob-accent/10 blur-2xl" />
                  <h2 className="relative text-3xl md:text-5xl font-black text-white uppercase tracking-tight leading-[0.95] italic mb-10">
                    {s.how_title.line1}<br /><span className="text-ob-accent">{s.how_title.highlight}</span>
                  </h2>
                  <ol className="relative grid md:grid-cols-3 gap-8 md:gap-10">
                    {([['01', s.st1, s.st1_text], ['02', s.st2, s.st2_text], ['03', s.st3, s.st3_text]] as const).map(([n, title, text]) => (
                      <li key={n}>
                        <span className="text-5xl md:text-6xl font-black italic text-ob-accent/90 tracking-tighter">{n}</span>
                        <h3 className="mt-3 text-base font-black text-white uppercase tracking-tight italic">{title}</h3>
                        <p className="mt-2 text-white/60 text-[13px] leading-relaxed">{text}</p>
                      </li>
                    ))}
                  </ol>
                </div>

                <p className="mt-12 mb-6 text-[10px] font-black text-ob-accent uppercase tracking-[0.4em]">{s.why_eyebrow}</p>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
                  {([
                    [Sparkles, s.w1, s.w1_text],
                    [CalendarCheck, s.w2, s.w2_text],
                    [ShieldCheck, s.w3, s.w3_text],
                    [TrendingUp, s.w4, s.w4_text],
                  ] as const).map(([Icon, title, text]) => (
                    <div key={title} className="bg-white rounded-[2rem] p-6 md:p-7 border border-gray-100 shadow-sm">
                      <div className="w-11 h-11 rounded-xl bg-ob-accent/20 text-ob-primary flex items-center justify-center mb-5"><Icon className="w-5 h-5" /></div>
                      <h3 className="text-[13px] font-black text-ob-primary uppercase tracking-tight italic">{title}</h3>
                      <p className="mt-2 text-gray-500 text-[13px] leading-relaxed">{text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ============ FOOTER ============ */}
        <div className="bg-ob-bg">
          <footer className="bg-ob-primary rounded-t-[3rem] md:rounded-t-[4rem]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-12 md:py-14 flex flex-col md:flex-row items-center md:items-end justify-between gap-6 text-center md:text-start">
              <div>
                <img src={`${ASSET}/misrah-logo.png`} alt="MISRAH" loading="lazy" className="h-10 w-auto object-contain mx-auto md:mx-0" />
                <p className="text-ob-accent text-[9px] font-black tracking-[0.5em] uppercase mt-3">{s.tagline}</p>
              </div>
              <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest" dir="ltr">© {new Date().getFullYear()} MISRAH Retreats UAE</p>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default PartnerOnboardingPage;
