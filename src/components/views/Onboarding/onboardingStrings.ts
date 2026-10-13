// Partner onboarding page copy — Arabic (default) and English. Converted from
// the standalone onboarding/index.html (Arabic lived in the markup, English
// in its EN table). Multi-part headings are split so the page can style the
// highlighted part and insert line breaks.

export type OnboardingLang = 'ar' | 'en';

export interface OnboardingStrings {
  title: string;
  description: string;
  nav_what: string; nav_how: string; nav_join: string;
  hero_pill: string;
  hero_title: { line1: string; line2: string; highlight: string };
  b_time: string; b_commit: string; b_private: string;
  join_eyebrow: string; join_title: string; join_text: string;
  s1: string; s2: string; s3: string;
  f_name: string; ph_name: string; e_name: string;
  f_business: string; ph_business: string; e_business: string;
  f_phone: string; e_phone: string;
  f_email: string; e_email: string;
  f_socials: string; optional: string; add: string; cancel: string;
  q_offer: string; all_apply: string;
  stays: string; experiences: string; catering: string; e_one: string;
  q_city: string; e_city: string;
  cities: Record<'auh' | 'dxb' | 'shj' | 'ajm' | 'uaq' | 'rak' | 'fuj', string>;
  q_license: string; yes: string; no: string; e_choose: string;
  q_timing: string; t_now: string; t_soon: string; t_explore: string;
  q_booking: string;
  whatsapp: string; phone: string; instagram: string; bk_platform: string; bk_web: string;
  q_platforms: string; list_them: string; ph_platforms: string;
  q_contact: string; email: string; message: string;
  q_notes: string; ph_notes: string;
  privacy: string;
  ok_eyebrow: string; ok_title: string; ok_pre: string; ok_post: string;
  about_eyebrow: string;
  what_title: { line1: string; line2: string };
  what_text: string;
  stays_text: string; exp_text: string; cat_text: string;
  app_eyebrow: string; app_title: string; app_text: string; soon_on: string;
  how_title: { line1: string; highlight: string };
  st1: string; st1_text: string; st2: string; st2_text: string; st3: string; st3_text: string;
  why_eyebrow: string;
  w1: string; w1_text: string; w2: string; w2_text: string; w3: string; w3_text: string; w4: string; w4_text: string;
  tagline: string;
  // Built in code
  submit: string; sending: string; sendFail: string;
  badWebsite: string; badHandle: string; website: string;
  handlePh: (platform: string) => string;
  remove: (platform: string) => string;
  toggle: string;
}

export const ONBOARDING_STRINGS: Record<OnboardingLang, OnboardingStrings> = {
  ar: {
    title: 'انضم إلى مسراح — إقامات وتجارب وضيافة في الإمارات',
    description: 'مسراح تطبيق إماراتي منتقى للإقامات الفاخرة والتجارب التي يقودها المضيفون وخدمات الضيافة. سجّل اهتمامك لتصبح شريكاً في مسراح.',
    nav_what: 'ما هو مسراح', nav_how: 'كيف نعمل', nav_join: 'انضم إلينا',
    hero_pill: 'نستقبل الآن شركاءنا المؤسسين.',
    hero_title: { line1: 'إقامات فاخرة وتجارب مميزة وضيافة منتقاة', line2: '', highlight: 'في تطبيق واحد.' },
    b_time: 'دقيقة واحدة تقريباً', b_commit: 'دون أي التزام', b_private: 'بياناتك تبقى خاصة',
    join_eyebrow: '✦ كن شريكاً', join_title: 'لنبدأ بإدراج نشاطك.',
    join_text: 'أخبرنا قليلاً عن نشاطك التجاري. معظم الإجابات بنقرة واحدة، ولا يوجد أي التزام في هذه المرحلة.',
    s1: 'عنك', s2: 'نشاطك التجاري', s3: 'البقاء على تواصل',
    f_name: 'الاسم الكامل', ph_name: 'مثال: مريم الهاشمي', e_name: 'يرجى إدخال اسمك.',
    f_business: 'اسم النشاط التجاري', ph_business: 'مثال: دون هاوس', e_business: 'يرجى إدخال اسم نشاطك التجاري.',
    f_phone: 'رقم التواصل', e_phone: 'يرجى إدخال رقم إماراتي صحيح.',
    f_email: 'البريد الإلكتروني', e_email: 'يرجى إدخال بريد إلكتروني صحيح.',
    f_socials: 'حسابات التواصل الاجتماعي للنشاط', optional: '· اختياري', add: 'إضافة', cancel: 'إلغاء',
    q_offer: 'ماذا تقدّم؟', all_apply: '· اختر كل ما ينطبق',
    stays: 'الإقامات', experiences: 'التجارب', catering: 'الضيافة', e_one: 'اختر خياراً واحداً على الأقل.',
    q_city: 'المدينة في الإمارات', e_city: 'اختر مدينة واحدة على الأقل.',
    cities: { auh: 'أبوظبي', dxb: 'دبي', shj: 'الشارقة', ajm: 'عجمان', uaq: 'أم القيوين', rak: 'رأس الخيمة', fuj: 'الفجيرة' },
    q_license: 'هل لديك رخصة تجارية / سياحية سارية؟', yes: 'نعم', no: 'لا', e_choose: 'يرجى اختيار إجابة.',
    q_timing: 'متى تخطط للانضمام؟', t_now: 'فوراً', t_soon: 'خلال شهر إلى 3 أشهر', t_explore: 'أستكشف فقط',
    q_booking: 'كيف تدير الحجوزات حالياً؟',
    whatsapp: 'واتساب', phone: 'الهاتف', instagram: 'إنستغرام', bk_platform: 'منصة حجز', bk_web: 'مواقع أخرى',
    q_platforms: 'ما هي المنصات أو المواقع؟', list_them: '· يرجى ذكرها', ph_platforms: 'مثال: Airbnb، Booking.com، موقعنا الخاص',
    q_contact: 'أفضل طريقة للتواصل معك', email: 'البريد', message: 'رسالة',
    q_notes: 'هل من شيء آخر؟', ph_notes: 'عدد العقارات، نوع التجارب التي تقدّمها، أسئلتك لنا…',
    privacy: 'سنستخدم بياناتك فقط للتواصل معك بخصوص مسراح.',
    ok_eyebrow: '✦ شكراً لك', ok_title: 'أنت على القائمة.',
    ok_pre: 'سيتواصل معك فريق الشراكات قريباً عبر', ok_post: '. في هذه الأثناء، تابع بريدك الوارد.',
    about_eyebrow: '✦ تعرّف علينا',
    what_title: { line1: 'وجهة واحدة منتقاة', line2: 'للضيافة الإماراتية.' },
    what_text: 'يفتح الضيوف تطبيق مسراح لحجز فيلا في الجبال، أو مخيم بين الكثبان، أو رحلة بحرية على متن قارب الداو عند الغروب، وطاهٍ خاص للأمسية — كل ذلك في رحلة واحدة، ومن مضيفين تحققنا منهم. ويحصل شركاؤنا على واجهة عرض فاخرة وأدوات لإدارتها.',
    stays_text: 'فلل واستراحات ومزارع ومنتجعات صحراوية — مع معارض صور كاملة وقواعد الإقامة وتسعير مرن.',
    exp_text: 'جولات بصحبة مرشدين، وليالٍ تحت النجوم، وتخييم ومشي وركوب دراجات في الطبيعة، ورحلات بالقارب إلى الجزر، وتجارب طبخ تراثي. إذا كنت تقدّم تجربة مثلها، سجّل معنا.',
    cat_text: 'طهاة خاصون وولائم إماراتية وخدمات طعام للمناسبات، يمكن للضيوف إضافتها إلى إقامتهم أو تجربتهم بنقرة واحدة.',
    app_eyebrow: '✦ قريباً', app_title: 'نشاطك في جيب كل ضيف.',
    app_text: 'مسراح تطبيق هاتف محمول لأجهزة iPhone و Android. يتصفح الضيوف ويحجزون من هواتفهم، وسيكون متاحاً للتحميل قريباً. انضم الآن لتكون من أوائل الشركاء عند الإطلاق.',
    soon_on: 'قريباً على',
    how_title: { line1: 'مصمَّمة للمضيفين.', highlight: 'ومحبوبة من الضيوف.' },
    st1: 'سجّل اهتمامك', st1_text: 'املأ النموذج أعلاه — يستغرق دقيقة تقريباً، ومعظمه نقرات.',
    st2: 'تعرّف على الفريق', st2_text: 'نتواصل معك بالطريقة التي تفضّلها، ونعرّفك على المنصة ونجيب عن أسئلتك.',
    st3: 'انطلق', st3_text: 'نساعدك في إعداد صفحتك، والتحقق من نشاطك التجاري، والبدء في استقبال الحجوزات عبر التطبيق.',
    why_eyebrow: '✦ لماذا الشراكة معنا',
    w1: 'جمهور مميّز', w1_text: 'تواصل مع المقيمين والزوار الباحثين عن إقامات وتجارب راقية، لا عن الخيار الأرخص.',
    w2: 'تقويم حجوزات واحد', w2_text: 'توقّف عن التنقل بين محادثات واتساب والرسائل الخاصة. أدِر التوفّر والحجوزات ورسائل الضيوف من لوحة تحكم واحدة.',
    w3: 'شارة المضيف الموثَّق', w3_text: 'يبرز الشركاء المرخّصون والموثَّقون للضيوف، فتُبنى الثقة قبل أول رسالة.',
    w4: 'دخل أكبر من كل ضيف', w4_text: 'يجمع الضيوف بين الإقامات والتجارب والضيافة، فيُكتشف الشركاء جنباً إلى جنب.',
    tagline: 'أفضل الوجهات في الإمارات',
    submit: 'سجّل اهتمامك', sending: 'جارٍ الإرسال…',
    sendFail: 'حدث خطأ أثناء إرسال بياناتك. يرجى المحاولة مرة أخرى.',
    badWebsite: 'يرجى إدخال عنوان موقع صحيح.',
    badHandle: 'يمكن أن يحتوي اسم الحساب على أحرف إنجليزية وأرقام ونقاط وشرطات فقط.',
    website: 'الموقع الإلكتروني',
    handlePh: l => `اسم حسابك على ${l}`,
    remove: l => `إزالة ${l}`,
    toggle: 'EN',
  },
  en: {
    title: 'Partner with MISRAH — Stays, Experiences & Catering in the UAE',
    description: "MISRAH is the UAE's curated mobile app for premium stays, host-led experiences and catering. Register your interest to become a MISRAH partner.",
    nav_what: 'What is Misrah', nav_how: 'How it works', nav_join: 'Join Misrah',
    hero_pill: "We're onboarding our founding partners now.",
    hero_title: { line1: 'Premium stays, host-led experiences', line2: 'and curated catering', highlight: 'in one app.' },
    b_time: 'About 1 minute', b_commit: 'No commitment', b_private: 'Your details stay private',
    join_eyebrow: '✦ Become a partner', join_title: "Let's get you listed.",
    join_text: "Tell us a little about your business. Most answers are a single tap — and there's no commitment at this stage.",
    s1: 'About you', s2: 'Your business', s3: 'Staying in touch',
    f_name: 'Full name', ph_name: 'e.g. Mariam Al Hashimi', e_name: 'Please enter your name.',
    f_business: 'Business name', ph_business: 'e.g. Dune House Retreats', e_business: 'Please enter your business name.',
    f_phone: 'Contact phone', e_phone: 'Please enter a valid UAE number.',
    f_email: 'Email', e_email: 'Please enter a valid email.',
    f_socials: 'Business social media', optional: '· optional', add: 'Add', cancel: 'Cancel',
    q_offer: 'What do you offer?', all_apply: '· select all that apply',
    stays: 'Stays', experiences: 'Experiences', catering: 'Catering', e_one: 'Choose at least one.',
    q_city: 'City in the UAE', e_city: 'Choose at least one city.',
    cities: { auh: 'Abu Dhabi', dxb: 'Dubai', shj: 'Sharjah', ajm: 'Ajman', uaq: 'Umm Al Quwain', rak: 'Ras Al Khaimah', fuj: 'Fujairah' },
    q_license: 'Active trade / tourism licence?', yes: 'Yes', no: 'No', e_choose: 'Please choose one.',
    q_timing: 'When are you planning to join?', t_now: 'Immediately', t_soon: '1–3 months', t_explore: 'Just exploring',
    q_booking: 'How do you manage reservations today?',
    whatsapp: 'WhatsApp', phone: 'Phone', instagram: 'Instagram', bk_platform: 'Booking platform', bk_web: 'Other websites',
    q_platforms: 'Which platforms or websites?', list_them: '· list them please', ph_platforms: 'e.g. Airbnb, Booking.com, our own website',
    q_contact: 'Best way to contact you', email: 'Email', message: 'Message',
    q_notes: 'Anything else?', ph_notes: 'Number of properties, the kind of experiences you run, questions for us…',
    privacy: "We'll only use your details to contact you about MISRAH.",
    ok_eyebrow: '✦ Shukran', ok_title: "You're on the list.",
    ok_pre: 'Our partnerships team will reach out via', ok_post: ' soon. In the meantime, keep an eye on your inbox.',
    about_eyebrow: '✦ Get to know us',
    what_title: { line1: 'One curated home for', line2: 'UAE hospitality.' },
    what_text: "Guests open the MISRAH app to book a villa in the mountains, a dune-side camp, a sunset dhow cruise and a private chef for the evening — all in one trip, all from hosts we've verified. Our partners get a premium storefront and the tools to manage it.",
    stays_text: 'Villas, penthouses, farm stays and desert retreats — listed with full photo galleries, house rules and flexible pricing.',
    exp_text: 'Guided tours, nights under the stars, camping, hiking and cycling in nature, boat trips to the islands and heritage cooking experiences. If you offer something like this, register with us.',
    cat_text: 'Private chefs, Emirati feasts and event catering that guests can add to their stay or experience in a tap.',
    app_eyebrow: '✦ Coming soon', app_title: "Your business, in every guest's pocket.",
    app_text: 'MISRAH is a mobile app for iPhone and Android. Guests browse and book right from their phones, and it will be available to download soon. Join now to be among the first partners at launch.',
    soon_on: 'Coming soon on',
    how_title: { line1: 'Built for hosts.', highlight: 'Loved by guests.' },
    st1: 'Register interest', st1_text: 'Fill in the short form above — it takes about a minute, mostly taps.',
    st2: 'Meet the team', st2_text: 'We reach out the way you prefer, walk you through the platform and answer your questions.',
    st3: 'Go live', st3_text: 'We help you set up your listing, verify your business and start taking bookings in the app.',
    why_eyebrow: '✦ Why partner with us',
    w1: 'Premium audience', w1_text: 'Reach residents and visitors who are looking for high-end stays and experiences, not the cheapest option.',
    w2: 'One booking calendar', w2_text: 'Stop juggling WhatsApp threads and DMs. Manage availability, bookings and guest messages in one host dashboard.',
    w3: 'Verified host badge', w3_text: 'Licensed, verified partners are highlighted to guests, so trust is built before the first message.',
    w4: 'Earn more per guest', w4_text: 'Guests bundle stays, experiences and catering — so partners get discovered alongside each other.',
    tagline: 'The Best UAE Retreats',
    submit: 'Register interest', sending: 'Sending…',
    sendFail: 'Something went wrong sending your details. Please try again.',
    badWebsite: 'Please enter a valid web address.',
    badHandle: 'Handles can only use letters, numbers, dots, dashes and underscores.',
    website: 'Website',
    handlePh: l => `your ${l} handle`,
    remove: l => `Remove ${l}`,
    toggle: 'عربي',
  },
};
