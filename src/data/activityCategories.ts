export interface CategoryDefinition {
  id: string;
  nameEn: string;
  nameAr: string;
  emoji: string;
  iconName: string;
  description: string;
  coverImage: string;
  activities: {
    nameEn: string;
    nameAr: string;
    defaultDuration: string;
    defaultPriceType: 'per_person' | 'per_group' | 'hourly' | 'fixed';
    suggestedPrice: number;
    defaultIncluded: string[];
    defaultWhatToBring: string[];
    categorySpecificType?: 'yacht' | 'dining' | 'photography' | 'sports' | 'general';
  }[];
}

export const ACTIVITY_CATEGORIES: CategoryDefinition[] = [
  {
    id: 'culinary',
    nameEn: 'Culinary',
    nameAr: 'طبخ',
    emoji: '🍽️',
    iconName: 'Utensils',
    description: 'Bespoke private chefs, authentic Emirati meals, BBQ nights & masterclasses',
    coverImage: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80',
    activities: [
      {
        nameEn: 'Private Chef',
        nameAr: 'طاهٍ خاص',
        defaultDuration: '3 Hours',
        defaultPriceType: 'per_group',
        suggestedPrice: 1200,
        defaultIncluded: ['5-Course Customized Menu', 'Full Table Setup & Service', 'Kitchen Deep Cleaning'],
        defaultWhatToBring: ['Beverages of choice'],
        categorySpecificType: 'dining'
      },
      {
        nameEn: 'BBQ Experiences',
        nameAr: 'تجربة الشواء',
        defaultDuration: '3 Hours',
        defaultPriceType: 'per_person',
        suggestedPrice: 280,
        defaultIncluded: ['Premium Wagyu & Lamb cuts', 'Marinades & Organic sides', 'Pitmaster Grill Setup & Charcoal'],
        defaultWhatToBring: ['Appetite & outdoor mood'],
        categorySpecificType: 'dining'
      },
      {
        nameEn: 'Cooking Classes',
        nameAr: 'دروس الطهي',
        defaultDuration: '2.5 Hours',
        defaultPriceType: 'per_person',
        suggestedPrice: 350,
        defaultIncluded: ['Hands-on culinary workstation', 'All ingredients & spices', 'Recipe booklets & take-home aprons'],
        defaultWhatToBring: ['Comfortable footwear'],
        categorySpecificType: 'dining'
      },
      {
        nameEn: 'Coffee & Tea Tasting',
        nameAr: 'تذوق القهوة والشاي',
        defaultDuration: '1.5 Hours',
        defaultPriceType: 'per_person',
        suggestedPrice: 180,
        defaultIncluded: ['Specialty single-origin beans', 'Cardamom & saffron blends', 'Artisanal dates & pairings'],
        defaultWhatToBring: [],
        categorySpecificType: 'dining'
      },
      {
        nameEn: 'Farm-to-Table Dining',
        nameAr: 'عشاء من المزرعة للمائدة',
        defaultDuration: '3 Hours',
        defaultPriceType: 'per_person',
        suggestedPrice: 420,
        defaultIncluded: ['Organic seasonal harvest dishes', 'Host farm walk & tasting', 'Candlelit al-fresco seating'],
        defaultWhatToBring: ['Warm evening layer'],
        categorySpecificType: 'dining'
      },
      {
        nameEn: 'Dessert Making',
        nameAr: 'صناعة الحلويات',
        defaultDuration: '2 Hours',
        defaultPriceType: 'per_person',
        suggestedPrice: 220,
        defaultIncluded: ['Pastry toolkit & molds', 'Saffron milk cake & luqaimat recipes', 'Boxed confections to take home'],
        defaultWhatToBring: [],
        categorySpecificType: 'dining'
      },
      {
        nameEn: 'Food Tours',
        nameAr: 'جولات التذوق',
        defaultDuration: '3.5 Hours',
        defaultPriceType: 'per_person',
        suggestedPrice: 380,
        defaultIncluded: ['Guided stops across local gems', 'Signature bites at each destination', 'Private transport coordination'],
        defaultWhatToBring: ['Walking shoes', 'Camera'],
        categorySpecificType: 'dining'
      }
    ]
  },
  {
    id: 'marine-beach',
    nameEn: 'Marine & Beach',
    nameAr: 'بحر',
    emoji: '🌊',
    iconName: 'Waves',
    description: 'Yachts, private fishing charters, paddleboarding & coastal adventures',
    coverImage: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80',
    activities: [
      {
        nameEn: 'Yacht Charters',
        nameAr: 'تأجير اليخوت الفاخرة',
        defaultDuration: '3 Hours',
        defaultPriceType: 'hourly',
        suggestedPrice: 950,
        defaultIncluded: ['Licensed Captain & Crew', 'Fuel & Ice / Refreshments', 'Sound System & Bluetooth Setup', 'Safety life vests'],
        defaultWhatToBring: ['Swimwear', 'Sunscreen', 'Emirates ID / Passport'],
        categorySpecificType: 'yacht'
      },
      {
        nameEn: 'Fishing Trips',
        nameAr: 'رحلات صيد الأسماك',
        defaultDuration: '4 Hours',
        defaultPriceType: 'per_group',
        suggestedPrice: 1600,
        defaultIncluded: ['High-end rods & fresh bait', 'Sonar fish-finder assistance', 'Fish cleaning & bagging'],
        defaultWhatToBring: ['Sunglasses & Hat', 'Windbreaker'],
        categorySpecificType: 'yacht'
      },
      {
        nameEn: 'Kayaking',
        nameAr: 'التجديف بالكاياك',
        defaultDuration: '1.5 Hours',
        defaultPriceType: 'per_person',
        suggestedPrice: 140,
        defaultIncluded: ['Single or tandem kayak', 'Paddles & dry-bags', 'Safety briefing & life jacket'],
        defaultWhatToBring: ['Water-friendly shoes', 'Change of clothes'],
        categorySpecificType: 'general'
      },
      {
        nameEn: 'Paddleboarding',
        nameAr: 'التجديف على اللوح الواقف',
        defaultDuration: '1 Hour',
        defaultPriceType: 'per_person',
        suggestedPrice: 120,
        defaultIncluded: ['SUP board & adjustable paddle', 'Leash & buoyancy vest', 'Basic balance coaching'],
        defaultWhatToBring: ['Swimwear', 'Water bottle'],
        categorySpecificType: 'general'
      },
      {
        nameEn: 'Jet Skiing',
        nameAr: 'دراجات مائية (جيت سكي)',
        defaultDuration: '1 Hour',
        defaultPriceType: 'per_person',
        suggestedPrice: 450,
        defaultIncluded: ['Yamaha/Sea-Doo high performance jet ski', 'Instructor escort', 'Goggles & impact vest'],
        defaultWhatToBring: ['Original ID', 'Towel'],
        categorySpecificType: 'general'
      },
      {
        nameEn: 'Snorkeling',
        nameAr: 'الغوص السطحي',
        defaultDuration: '2 Hours',
        defaultPriceType: 'per_person',
        suggestedPrice: 200,
        defaultIncluded: ['Anti-fog mask, snorkel & fins', 'Reef guide', 'Hydration packs'],
        defaultWhatToBring: ['Swimwear', 'Underwater action camera'],
        categorySpecificType: 'general'
      },
      {
        nameEn: 'Diving',
        nameAr: 'الغوص الحر والعميق',
        defaultDuration: '3 Hours',
        defaultPriceType: 'per_person',
        suggestedPrice: 550,
        defaultIncluded: ['PADI certified divemaster', 'Full BCD, regulator & tank', 'Boat transport to dive site'],
        defaultWhatToBring: ['Diver certification card or logbook', 'Swimwear'],
        categorySpecificType: 'general'
      },
      {
        nameEn: 'Sunset Cruises',
        nameAr: 'رحلات بحرية عند الغروب',
        defaultDuration: '2 Hours',
        defaultPriceType: 'per_group',
        suggestedPrice: 1800,
        defaultIncluded: ['Luxury catamaran cruise', 'Canapés & mocktails', 'Panoramic coastline viewpoints'],
        defaultWhatToBring: ['Evening resort wear'],
        categorySpecificType: 'yacht'
      },
      {
        nameEn: 'Beach Picnics',
        nameAr: 'نزهات شاطئية بوهيمية',
        defaultDuration: '2.5 Hours',
        defaultPriceType: 'per_group',
        suggestedPrice: 850,
        defaultIncluded: ['Boho rug, floor cushions & low tables', 'Charcuterie & fruit grazing board', 'Candle lanterns & umbrella'],
        defaultWhatToBring: ['Personal music playlist'],
        categorySpecificType: 'general'
      }
    ]
  },
  {
    id: 'sports-adventure',
    nameEn: 'Sports & Adventure',
    nameAr: 'أنشطة ومغامرات',
    emoji: '🏇',
    iconName: 'Compass',
    description: 'Equestrian trails, dune bashing, padel courts & mountain treks',
    coverImage: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&q=80',
    activities: [
      {
        nameEn: 'Horse Riding',
        nameAr: 'ركوب الخيل',
        defaultDuration: '1.5 Hours',
        defaultPriceType: 'per_person',
        suggestedPrice: 320,
        defaultIncluded: ['Purebred Arabian horses', 'Riding helmet & boots', 'Desert sand trail guide'],
        defaultWhatToBring: ['Long trousers & socks'],
        categorySpecificType: 'sports'
      },
      {
        nameEn: 'Camel Riding',
        nameAr: 'ركوب الجمال',
        defaultDuration: '1 Hour',
        defaultPriceType: 'per_person',
        suggestedPrice: 180,
        defaultIncluded: ['Traditional saddled camel caravan', 'Bedouin handler guide', 'Sunset photo stop'],
        defaultWhatToBring: ['Sunglasses & scarf'],
        categorySpecificType: 'general'
      },
      {
        nameEn: 'Hiking',
        nameAr: 'المشي الجبلي والاستكشاف',
        defaultDuration: '3 Hours',
        defaultPriceType: 'per_person',
        suggestedPrice: 190,
        defaultIncluded: ['Trekking poles & first aid kit', 'Trail master navigation', 'Hydration & electrolyte snacks'],
        defaultWhatToBring: ['Hiking boots', 'Sun protection'],
        categorySpecificType: 'sports'
      },
      {
        nameEn: 'Cycling',
        nameAr: 'ركوب الدراجات الهوائية',
        defaultDuration: '2 Hours',
        defaultPriceType: 'per_person',
        suggestedPrice: 150,
        defaultIncluded: ['Trek gravel or road bike', 'Helmet & repair kit', 'Al Qudra / track permit'],
        defaultWhatToBring: ['Athletic wear'],
        categorySpecificType: 'sports'
      },
      {
        nameEn: 'Tennis',
        nameAr: 'التنس الأرضي',
        defaultDuration: '1 Hour',
        defaultPriceType: 'hourly',
        suggestedPrice: 200,
        defaultIncluded: ['Private court reservation', 'Wilson racquets & pressure balls', 'Ball machine option'],
        defaultWhatToBring: ['Non-marking sports shoes'],
        categorySpecificType: 'sports'
      },
      {
        nameEn: 'Padel',
        nameAr: 'بادل تنس',
        defaultDuration: '1.5 Hours',
        defaultPriceType: 'hourly',
        suggestedPrice: 240,
        defaultIncluded: ['Panoramic glass court access', '4 Pro padel racquets & new balls', 'Court night floodlights'],
        defaultWhatToBring: ['Sportswear & court shoes'],
        categorySpecificType: 'sports'
      },
      {
        nameEn: 'Archery',
        nameAr: 'الرماية والقوس',
        defaultDuration: '1 Hour',
        defaultPriceType: 'per_person',
        suggestedPrice: 160,
        defaultIncluded: ['Recurve bow & carbon arrows', 'Arm guards & finger tabs', 'Target range scoring'],
        defaultWhatToBring: ['Fitted top'],
        categorySpecificType: 'sports'
      },
      {
        nameEn: 'Rock Climbing',
        nameAr: 'تسلق الصخور الطبيعية',
        defaultDuration: '3 Hours',
        defaultPriceType: 'per_person',
        suggestedPrice: 400,
        defaultIncluded: ['Harness, climbing shoes & chalk', 'Certified belayer guide', 'Multi-pitch safety rigging'],
        defaultWhatToBring: ['Flexible athletic clothes'],
        categorySpecificType: 'sports'
      },
      {
        nameEn: 'Zipline',
        nameAr: 'الانزلاق بالحبل (الزبلاين)',
        defaultDuration: '1 Hour',
        defaultPriceType: 'per_person',
        suggestedPrice: 350,
        defaultIncluded: ['World-class safety gear & GoPro mount', 'Speed harness & helmet', 'Fast-track boarding'],
        defaultWhatToBring: ['Enclosed trainers'],
        categorySpecificType: 'general'
      },
      {
        nameEn: 'ATV & Dune Bashing',
        nameAr: 'دراجات الدفع الرباعي والكثبان',
        defaultDuration: '2 Hours',
        defaultPriceType: 'per_person',
        suggestedPrice: 380,
        defaultIncluded: ['Polaris / Can-Am 1000cc buggy', 'Full-face helmet & sand goggles', 'Lead marshal desert guide'],
        defaultWhatToBring: ['Dust scarf / Ghutra'],
        categorySpecificType: 'general'
      },
      {
        nameEn: 'Off-Road Adventures',
        nameAr: 'مغامرات الدروب الوعرة',
        defaultDuration: '4 Hours',
        defaultPriceType: 'per_group',
        suggestedPrice: 1500,
        defaultIncluded: ['Modified 4x4 Land Cruiser with winch', 'Desert recovery gear', 'Campfire pause with fresh tea'],
        defaultWhatToBring: ['Comfortable clothing'],
        categorySpecificType: 'general'
      }
    ]
  },
  {
    id: 'leisure-events',
    nameEn: 'Leisure & Events',
    nameAr: 'استجمام وفعاليات',
    emoji: '✨',
    iconName: 'Sparkles',
    description: 'Outdoor cinema, live acoustic sets, bonfire evenings & celebrations',
    coverImage: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=800&q=80',
    activities: [
      {
        nameEn: 'Outdoor Cinema',
        nameAr: 'السينما الخارجية تحت النجوم',
        defaultDuration: '3 Hours',
        defaultPriceType: 'fixed',
        suggestedPrice: 750,
        defaultIncluded: ['4K laser projector & 150" screen', 'Surround sound speakers', 'Beanbags, blankets & popcorn machine'],
        defaultWhatToBring: ['Movie streaming logins of choice'],
        categorySpecificType: 'general'
      },
      {
        nameEn: 'Bonfire Nights',
        nameAr: 'أمسيات إشعال الحطب والسمر',
        defaultDuration: '3 Hours',
        defaultPriceType: 'per_group',
        suggestedPrice: 450,
        defaultIncluded: ['Fire pit with fragrant olive & ghaf wood', 'S’mores kits & roasting sticks', 'Arabic dullah & copper mugs'],
        defaultWhatToBring: ['Warm layers for desert nights'],
        categorySpecificType: 'general'
      },
      {
        nameEn: 'Live Music',
        nameAr: 'عروض موسيقية حية (عود / عازف)',
        defaultDuration: '2 Hours',
        defaultPriceType: 'hourly',
        suggestedPrice: 800,
        defaultIncluded: ['Professional Oud or Acoustic artist', 'PA sound system & subtle lighting', 'Customized setlist requests'],
        defaultWhatToBring: [],
        categorySpecificType: 'general'
      },
      {
        nameEn: 'DJs',
        nameAr: 'عازف دي جي للمناسبات',
        defaultDuration: '4 Hours',
        defaultPriceType: 'fixed',
        suggestedPrice: 2200,
        defaultIncluded: ['Pioneer DJ console & active speakers', 'Atmospheric mood lights', 'Genre consultation in advance'],
        defaultWhatToBring: [],
        categorySpecificType: 'general'
      },
      {
        nameEn: 'Game Nights',
        nameAr: 'أمسيات الألعاب والتحديات',
        defaultDuration: '2.5 Hours',
        defaultPriceType: 'fixed',
        suggestedPrice: 350,
        defaultIncluded: ['Giant Jenga, Carrom & board games', 'Trivia master kit', 'Snack bowls & leaderboard board'],
        defaultWhatToBring: [],
        categorySpecificType: 'general'
      },
      {
        nameEn: 'Birthday Celebrations',
        nameAr: 'تنسيق أعياد الميلاد الفاخرة',
        defaultDuration: '4 Hours',
        defaultPriceType: 'fixed',
        suggestedPrice: 1800,
        defaultIncluded: ['Bespoke balloon arch & backdrop', 'Personalized cake & table setting', 'Celebration host setup'],
        defaultWhatToBring: ['Gift items'],
        categorySpecificType: 'general'
      },
      {
        nameEn: 'Bridal & Baby Showers',
        nameAr: 'حفلات استقبال وتوديع العزوبية',
        defaultDuration: '4 Hours',
        defaultPriceType: 'fixed',
        suggestedPrice: 2400,
        defaultIncluded: ['Floral floral floral installation', 'High-tea towers & vintage chinaware', 'Keepsake game cards'],
        defaultWhatToBring: [],
        categorySpecificType: 'general'
      },
      {
        nameEn: 'Corporate Retreats',
        nameAr: 'خلوات الشركات والقيادة',
        defaultDuration: '6 Hours',
        defaultPriceType: 'per_group',
        suggestedPrice: 4500,
        defaultIncluded: ['Executive meeting layout & AV screens', 'Catering lunch break', 'Facilitation whiteboards'],
        defaultWhatToBring: ['Laptops'],
        categorySpecificType: 'general'
      },
      {
        nameEn: 'Team-Building Activities',
        nameAr: 'فعاليات بناء فرق العمل',
        defaultDuration: '3 Hours',
        defaultPriceType: 'per_person',
        suggestedPrice: 260,
        defaultIncluded: ['Professional team coach', 'Challenge stations & team bandanas', 'Award medals ceremony'],
        defaultWhatToBring: ['Sportswear'],
        categorySpecificType: 'general'
      },
      {
        nameEn: 'Family Gatherings',
        nameAr: 'تجمعات العائلات الكبيرة',
        defaultDuration: '5 Hours',
        defaultPriceType: 'fixed',
        suggestedPrice: 1500,
        defaultIncluded: ['Large seating layout with majlis rugs', 'Children’s craft corner', 'Tea and dates service'],
        defaultWhatToBring: [],
        categorySpecificType: 'general'
      }
    ]
  },
  {
    id: 'heritage-culture',
    nameEn: 'Heritage & Emirati Culture',
    nameAr: 'تراث وضيافة',
    emoji: '🕌',
    iconName: 'Crown',
    description: 'Arabic coffee ceremonies, desert majlis, falconry & authentic stories',
    coverImage: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80',
    activities: [
      {
        nameEn: 'Arabic Coffee Ceremony',
        nameAr: 'مراسم القهوة العربية وسنع الضيافة',
        defaultDuration: '1.5 Hours',
        defaultPriceType: 'per_group',
        suggestedPrice: 450,
        defaultIncluded: ['Live roasting of raw beans over coals', 'Cardamom & saffron grinding in mehbash', 'Finjan etiquette & Khalas dates'],
        defaultWhatToBring: [],
        categorySpecificType: 'general'
      },
      {
        nameEn: 'Falconry',
        nameAr: 'عرض وتدريب الصقور التراثية',
        defaultDuration: '1.5 Hours',
        defaultPriceType: 'per_group',
        suggestedPrice: 900,
        defaultIncluded: ['Champion hunting falcons interaction', 'Gauntlet glove handling & photo session', 'Flight demonstrations'],
        defaultWhatToBring: ['Camera / phone for photos'],
        categorySpecificType: 'general'
      },
      {
        nameEn: 'Henna Art',
        nameAr: 'نقش الحناء التراثي والعصري',
        defaultDuration: '2 Hours',
        defaultPriceType: 'per_person',
        suggestedPrice: 150,
        defaultIncluded: ['Organic 100% natural henna cones', 'Traditional Emirati & contemporary designs', 'Drying oil & seal treatment'],
        defaultWhatToBring: [],
        categorySpecificType: 'general'
      },
      {
        nameEn: 'Traditional Crafts',
        nameAr: 'الحرف التقليدية (التلي والسدو)',
        defaultDuration: '2 Hours',
        defaultPriceType: 'per_person',
        suggestedPrice: 220,
        defaultIncluded: ['Al Sadu weaving loom & metallic threads', 'Master artisan instructor', 'Handcrafted bookmark or coaster to keep'],
        defaultWhatToBring: [],
        categorySpecificType: 'general'
      },
      {
        nameEn: 'Emirati Cooking',
        nameAr: 'طهي الأطباق الإماراتية الأصيلة',
        defaultDuration: '3 Hours',
        defaultPriceType: 'per_person',
        suggestedPrice: 340,
        defaultIncluded: ['Machboos, Saloona & Khameer bread making', 'Bezar spice blending workshop', 'Shared family feast'],
        defaultWhatToBring: ['Eagerness to taste rich spices'],
        categorySpecificType: 'dining'
      },
      {
        nameEn: 'Storytelling',
        nameAr: 'حكايا أهل البحر والصحراء',
        defaultDuration: '1.5 Hours',
        defaultPriceType: 'per_group',
        suggestedPrice: 500,
        defaultIncluded: ['Bilingual Emirati culture narrator', 'Pearling, trading & Bedouin lore', 'Traditional mint tea service'],
        defaultWhatToBring: [],
        categorySpecificType: 'general'
      },
      {
        nameEn: 'Desert Majlis',
        nameAr: 'المجلس الصحراوي الفاخر',
        defaultDuration: '4 Hours',
        defaultPriceType: 'per_group',
        suggestedPrice: 1800,
        defaultIncluded: ['Luxury low-seating Bedouin tent layout', 'Lantern lit carpet pathway', 'Unlimited Karak, Gahwa & sweets'],
        defaultWhatToBring: ['Comfortable resort attire'],
        categorySpecificType: 'general'
      },
      {
        nameEn: 'Cultural Performances',
        nameAr: 'عروض الفنون الشعبية (العيالة / اليولة)',
        defaultDuration: '1.5 Hours',
        defaultPriceType: 'fixed',
        suggestedPrice: 2800,
        defaultIncluded: ['Authentic traditional troupe', 'Al Ayala rhythmic drumming & stick choreography', 'Interactive guest participation'],
        defaultWhatToBring: [],
        categorySpecificType: 'general'
      }
    ]
  },
  {
    id: 'farm-nature',
    nameEn: 'Farm & Nature',
    nameAr: 'مزارع وطبيعة',
    emoji: '🌿',
    iconName: 'Leaf',
    description: 'Animal encounters, date picking, stargazing & botanical walks',
    coverImage: 'https://images.unsplash.com/photo-1500651230702-0e2d8a49d4ad?w=800&q=80',
    activities: [
      {
        nameEn: 'Animal Feeding',
        nameAr: 'إطعام الحيوانات ورعايتها',
        defaultDuration: '1 Hour',
        defaultPriceType: 'per_person',
        suggestedPrice: 90,
        defaultIncluded: ['Organic feed baskets for deer, goats & camels', 'Guided pen walkthrough', 'Safe petting enclosure'],
        defaultWhatToBring: ['Closed shoes'],
        categorySpecificType: 'general'
      },
      {
        nameEn: 'Fruit & Vegetable Picking',
        nameAr: 'قطاف الفواكه والخضار العضوية',
        defaultDuration: '1.5 Hours',
        defaultPriceType: 'per_person',
        suggestedPrice: 160,
        defaultIncluded: ['Wicker harvesting basket to take home', 'Picking clippers & organic farm tour', 'Fresh produce up to 2kg'],
        defaultWhatToBring: ['Sun hat'],
        categorySpecificType: 'general'
      },
      {
        nameEn: 'Beekeeping',
        nameAr: 'تجربة المناحل وإنتاج عسل السدر',
        defaultDuration: '1.5 Hours',
        defaultPriceType: 'per_person',
        suggestedPrice: 240,
        defaultIncluded: ['Full protective bee suit & gloves', 'Observation hive opening with apiarist', 'Sidr honey jar tasting sample'],
        defaultWhatToBring: ['Thick socks'],
        categorySpecificType: 'general'
      },
      {
        nameEn: 'Stargazing',
        nameAr: 'رصد النجوم والمجرات بالتلسكوب',
        defaultDuration: '2 Hours',
        defaultPriceType: 'per_group',
        suggestedPrice: 650,
        defaultIncluded: ['High-powered motorized Dobsonian telescope', 'Astronomer star mapping tour', 'Red-light headlamps & star charts'],
        defaultWhatToBring: ['Warm desert jacket'],
        categorySpecificType: 'general'
      },
      {
        nameEn: 'Bird Watching',
        nameAr: 'مراقبة الطيور والفلامنغو',
        defaultDuration: '2 Hours',
        defaultPriceType: 'per_person',
        suggestedPrice: 140,
        defaultIncluded: ['High-clarity Nikon binoculars', 'Mangrove bird guide identification booklet', 'Hideout observation blind access'],
        defaultWhatToBring: ['Neutral colored clothing'],
        categorySpecificType: 'general'
      },
      {
        nameEn: 'Nature Walks',
        nameAr: 'المسارات الطبيعية والاسترخاء',
        defaultDuration: '1.5 Hours',
        defaultPriceType: 'per_person',
        suggestedPrice: 100,
        defaultIncluded: ['Naturalist guide', 'Local flora and fauna briefing', 'Herbal water refreshments'],
        defaultWhatToBring: ['Comfortable sneakers'],
        categorySpecificType: 'general'
      },
      {
        nameEn: 'Camping',
        nameAr: 'التخييم الفاخر تحت السماء',
        defaultDuration: 'Overnight',
        defaultPriceType: 'per_group',
        suggestedPrice: 1400,
        defaultIncluded: ['Canvas bell tent with memory foam bedding', 'Firewood & camp stove', 'Morning farm breakfast basket'],
        defaultWhatToBring: ['Personal toiletries'],
        categorySpecificType: 'general'
      },
      {
        nameEn: 'Eco Tours',
        nameAr: 'جولات بيئية مستدامة',
        defaultDuration: '2.5 Hours',
        defaultPriceType: 'per_person',
        suggestedPrice: 180,
        defaultIncluded: ['Electric eco-cart transport', 'Solar farm & desalination briefing', 'Ghaf tree planting session'],
        defaultWhatToBring: ['Sunscreen'],
        categorySpecificType: 'general'
      },
      {
        nameEn: 'Botanical Experiences',
        nameAr: 'تجارب النباتات والزيوت العطرية',
        defaultDuration: '2 Hours',
        defaultPriceType: 'per_person',
        suggestedPrice: 210,
        defaultIncluded: ['Medicinal desert plants workshop', 'Essential oil distillation kit sample', 'Herbal tea brewing'],
        defaultWhatToBring: [],
        categorySpecificType: 'general'
      }
    ]
  },
  {
    id: 'wellness',
    nameEn: 'Wellness',
    nameAr: 'الصحة والعافية',
    emoji: '🧘',
    iconName: 'HeartPulse',
    description: 'Sunset yoga, sound baths, holistic massages & ice therapies',
    coverImage: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=800&q=80',
    activities: [
      {
        nameEn: 'Yoga',
        nameAr: 'جلسات اليوغا عند الشروق والغروب',
        defaultDuration: '1 Hour',
        defaultPriceType: 'per_person',
        suggestedPrice: 150,
        defaultIncluded: ['Manduka eco yoga mat & cork blocks', 'Certified Vinyasa / Yin instructor', 'Infused cucumber-mint hydration'],
        defaultWhatToBring: ['Comfortable stretchwear'],
        categorySpecificType: 'sports'
      },
      {
        nameEn: 'Pilates',
        nameAr: 'بيلاتس وتقوية القوام',
        defaultDuration: '1 Hour',
        defaultPriceType: 'per_person',
        suggestedPrice: 175,
        defaultIncluded: ['Pilates mats & resistance bands', 'Alignment coaching', 'Detox green shot'],
        defaultWhatToBring: ['Grip socks'],
        categorySpecificType: 'sports'
      },
      {
        nameEn: 'Meditation',
        nameAr: 'التأمل واليقظة الذهنية',
        defaultDuration: '45 Mins',
        defaultPriceType: 'per_person',
        suggestedPrice: 120,
        defaultIncluded: ['Meditation cushions & eye masks', 'Guided mindfulness audio / live voice', 'Aromatherapy diffusion'],
        defaultWhatToBring: ['Loose clothing'],
        categorySpecificType: 'general'
      },
      {
        nameEn: 'Breathwork',
        nameAr: 'تمارين التنفس العميق والتحول',
        defaultDuration: '1 Hour',
        defaultPriceType: 'per_person',
        suggestedPrice: 180,
        defaultIncluded: ['Pranayama & Holotropic guide', 'Heart rate monitor option', 'Grounding herbal tea'],
        defaultWhatToBring: [],
        categorySpecificType: 'general'
      },
      {
        nameEn: 'Sound Healing',
        nameAr: 'العلاج بالصوت والأوعية الكريستالية',
        defaultDuration: '1.5 Hours',
        defaultPriceType: 'per_person',
        suggestedPrice: 220,
        defaultIncluded: ['Tibetan singing bowls & gong immersion', 'Silk eye pillow & soft fleece blanket', 'Deep nervous system reset'],
        defaultWhatToBring: ['Warm comfortable clothing'],
        categorySpecificType: 'general'
      },
      {
        nameEn: 'Massage',
        nameAr: 'جلسات التدليك والاسترخاء الخاصة',
        defaultDuration: '1.5 Hours',
        defaultPriceType: 'per_person',
        suggestedPrice: 420,
        defaultIncluded: ['Portable luxury massage table & fresh linens', 'Custom warm botanical massage oils', 'Licensed therapist'],
        defaultWhatToBring: [],
        categorySpecificType: 'general'
      },
      {
        nameEn: 'Spa Treatments',
        nameAr: 'علاجات السبا والعناية بالبشرة',
        defaultDuration: '2 Hours',
        defaultPriceType: 'per_person',
        suggestedPrice: 550,
        defaultIncluded: ['Organic rosewater scrub & facial', 'Moroccan black soap application', 'Plush robes and slippers'],
        defaultWhatToBring: [],
        categorySpecificType: 'general'
      },
      {
        nameEn: 'Ice Baths',
        nameAr: 'العلاج بالماء المثلج (الغطس البارد)',
        defaultDuration: '45 Mins',
        defaultPriceType: 'per_person',
        suggestedPrice: 200,
        defaultIncluded: ['Chilled temperature-monitored cedar tub', 'Breathwork coach for cold tolerance', 'Heated recovery towels & tea'],
        defaultWhatToBring: ['Swimwear'],
        categorySpecificType: 'sports'
      },
      {
        nameEn: 'Wellness Retreats',
        nameAr: 'باقات الاستجمام الشاملة',
        defaultDuration: 'Full Day',
        defaultPriceType: 'per_person',
        suggestedPrice: 1100,
        defaultIncluded: ['Yoga + Sound bath + Healthy lunch + Massage', 'Holistic journal & gifts', 'Private pool sanctuary time'],
        defaultWhatToBring: ['Change of relaxing attire'],
        categorySpecificType: 'general'
      }
    ]
  },
  {
    id: 'arts-workshops',
    nameEn: 'Arts & Workshops',
    nameAr: 'ورش وإبداع',
    emoji: '🎨',
    iconName: 'Palette',
    description: 'Pottery throwing, perfume crafting, canvas painting & artisanal skills',
    coverImage: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&q=80',
    activities: [
      {
        nameEn: 'Pottery',
        nameAr: 'صناعة الفخار وعجلة الخزف',
        defaultDuration: '2 Hours',
        defaultPriceType: 'per_person',
        suggestedPrice: 260,
        defaultIncluded: ['Clay wheel workstation & carving tools', 'Glazing & kiln firing of your piece', 'Courier delivery of fired pottery'],
        defaultWhatToBring: ['Clothes you don’t mind getting dusty'],
        categorySpecificType: 'general'
      },
      {
        nameEn: 'Painting',
        nameAr: 'الرسم على الكانفاس بالأكريليك',
        defaultDuration: '2 Hours',
        defaultPriceType: 'per_person',
        suggestedPrice: 200,
        defaultIncluded: ['Canvas board & wooden easel', 'Premium acrylics & brush kit', 'Protective apron & finished artwork to keep'],
        defaultWhatToBring: [],
        categorySpecificType: 'general'
      },
      {
        nameEn: 'Candle Making',
        nameAr: 'صناعة الشموع العطرية والصويا',
        defaultDuration: '1.5 Hours',
        defaultPriceType: 'per_person',
        suggestedPrice: 190,
        defaultIncluded: ['Natural soy wax & cotton wicks', 'Amber glass jars & custom labels', '10+ luxury fragrance oils'],
        defaultWhatToBring: [],
        categorySpecificType: 'general'
      },
      {
        nameEn: 'Perfume Making',
        nameAr: 'تركيب العطور والبخور الشرقي',
        defaultDuration: '2 Hours',
        defaultPriceType: 'per_person',
        suggestedPrice: 320,
        defaultIncluded: ['Oud, Taif Rose, Musk & Amber essences', 'Personalized 50ml crystal bottle with gold atomizer', 'Formula recipe card for future refills'],
        defaultWhatToBring: [],
        categorySpecificType: 'general'
      },
      {
        nameEn: 'Floral Arranging',
        nameAr: 'تنسيق الزهور الطبيعية',
        defaultDuration: '1.5 Hours',
        defaultPriceType: 'per_person',
        suggestedPrice: 230,
        defaultIncluded: ['Imported seasonal blooms & foliage', 'Ceramic vase & floral shears', 'Bouquet wrapping paper'],
        defaultWhatToBring: [],
        categorySpecificType: 'general'
      },
      {
        nameEn: 'Photography Workshops',
        nameAr: 'ورش تصوير وتكوين الكادر',
        defaultDuration: '2.5 Hours',
        defaultPriceType: 'per_person',
        suggestedPrice: 380,
        defaultIncluded: ['Composition, lighting & mobile/DSLR tricks', 'On-location shooting walk', 'Lightroom mobile presets pack'],
        defaultWhatToBring: ['Camera or Smartphone'],
        categorySpecificType: 'photography'
      },
      {
        nameEn: 'Calligraphy',
        nameAr: 'الخط العربي والزخرفة الإسلامية',
        defaultDuration: '2 Hours',
        defaultPriceType: 'per_person',
        suggestedPrice: 180,
        defaultIncluded: ['Bamboo Qalam pens & calligraphy inkwell', 'Traditional Muqahhar handmade paper', 'Framed custom name piece'],
        defaultWhatToBring: [],
        categorySpecificType: 'general'
      },
      {
        nameEn: 'DIY Craft Workshops',
        nameAr: 'الأعمال اليدوية والريزن',
        defaultDuration: '2 Hours',
        defaultPriceType: 'per_person',
        suggestedPrice: 210,
        defaultIncluded: ['Epoxy resin kit, pigments & silicone coasters', 'Safety masks & gloves', 'Complete finished set'],
        defaultWhatToBring: [],
        categorySpecificType: 'general'
      }
    ]
  },
  {
    id: 'photography-content',
    nameEn: 'Photography & Content Creation',
    nameAr: 'التصوير وصناعة المحتوى',
    emoji: '📸',
    iconName: 'Camera',
    description: 'Pro portrait sessions, drone aerials, reels creation & golden hour memories',
    coverImage: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=800&q=80',
    activities: [
      {
        nameEn: 'Professional Photography',
        nameAr: 'جلسات التصوير الاحترافية',
        defaultDuration: '1.5 Hours',
        defaultPriceType: 'fixed',
        suggestedPrice: 850,
        defaultIncluded: ['Full frame Sony/Canon camera & pro lenses', '30 high-res color graded digital photos', 'Private online gallery link within 48h'],
        defaultWhatToBring: ['2 outfit variations'],
        categorySpecificType: 'photography'
      },
      {
        nameEn: 'Drone Photography',
        nameAr: 'التصوير الجوي بالدرون',
        defaultDuration: '1 Hour',
        defaultPriceType: 'fixed',
        suggestedPrice: 950,
        defaultIncluded: ['Licensed GCAA drone pilot', '4K 60fps cinematic landscape footage', '15 aerial stills & raw clips provided'],
        defaultWhatToBring: [],
        categorySpecificType: 'photography'
      },
      {
        nameEn: 'Family Photoshoots',
        nameAr: 'جلسات تصوير العائلة والذكريات',
        defaultDuration: '2 Hours',
        defaultPriceType: 'fixed',
        suggestedPrice: 950,
        defaultIncluded: ['Posing assistance for all family members', '45 edited portraits in full resolution', '1 printed canvas keepsake'],
        defaultWhatToBring: ['Coordinated color palette outfits'],
        categorySpecificType: 'photography'
      },
      {
        nameEn: 'Proposal Photography',
        nameAr: 'تصوير وتوثيق عروض الزواج',
        defaultDuration: '2 Hours',
        defaultPriceType: 'fixed',
        suggestedPrice: 1500,
        defaultIncluded: ['Secret discreet setup & timeline planning', 'Rose petals & fairy light pathway staging', '50 captured candid moment files'],
        defaultWhatToBring: ['The ring!'],
        categorySpecificType: 'photography'
      },
      {
        nameEn: 'Event Photography',
        nameAr: 'تغطية الفعاليات والمناسبات',
        defaultDuration: '3 Hours',
        defaultPriceType: 'hourly',
        suggestedPrice: 500,
        defaultIncluded: ['Roaming photographer & guest candids', 'Same-night highlights teaser pack (10 photos)', 'Full edited album in 72h'],
        defaultWhatToBring: ['Event itinerary'],
        categorySpecificType: 'photography'
      },
      {
        nameEn: 'Videography',
        nameAr: 'إنتاج الفيديو السينمائي',
        defaultDuration: '2.5 Hours',
        defaultPriceType: 'fixed',
        suggestedPrice: 1400,
        defaultIncluded: ['4K Cinema camera with gimbal stabilization', 'Licensed music soundtrack scoring', '60-second 4K cinematic highlight reel'],
        defaultWhatToBring: [],
        categorySpecificType: 'photography'
      },
      {
        nameEn: 'Social Media Content Creation',
        nameAr: 'صناعة محتوى تيك توك وإنستغرام',
        defaultDuration: '2 Hours',
        defaultPriceType: 'fixed',
        suggestedPrice: 800,
        defaultIncluded: ['3 edited viral-ready Instagram Reels / TikToks', 'Trending audio selection & text hooks', 'Same-day instant AirDrop delivery'],
        defaultWhatToBring: ['Outfit changes'],
        categorySpecificType: 'photography'
      }
    ]
  }
];
