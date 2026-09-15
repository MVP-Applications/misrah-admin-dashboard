import { ActivityAddon } from '../types';

export const CATEGORY_DEFAULT_ADDONS: Record<string, ActivityAddon[]> = {
  'culinary': [
    {
      id: 'addon-cul-1',
      title: 'Artisanal Arabic Dessert & Kunafa Platter',
      titleAr: 'طبق حلويات عربية وكنافة نابلسية فاخرة',
      price: 120,
      priceType: 'fixed',
      description: 'Warm freshly baked cheese kunafa with rosewater syrup and crushed pistachios'
    },
    {
      id: 'addon-cul-2',
      title: 'Personal Dedicated Waiter & Butler',
      titleAr: 'نادل خاص للخدمة طوال الجلسة',
      price: 180,
      priceType: 'fixed',
      description: 'Attentive table hospitality, drink pouring, and continuous plate clearing'
    },
    {
      id: 'addon-cul-3',
      title: 'Fresh Tropical Mocktail & Juice Bar',
      titleAr: 'ركن الموكتيلات والعصائر الطبيعية الطازجة',
      price: 150,
      priceType: 'fixed',
      description: 'Unlimited passion fruit mojitos, pomegranate spritz, and fresh coconut water'
    },
    {
      id: 'addon-cul-4',
      title: 'A5 Japanese Wagyu / Lobster Tail Upgrade',
      titleAr: 'ترقية اللحم إلى واغيو ياباني A5 وذيل الاستاكوزا',
      price: 250,
      priceType: 'per_person',
      description: 'Extra prime marbling meat and Gulf lobster tails grilled on charcoal'
    }
  ],
  'marine-beach': [
    {
      id: 'addon-mar-1',
      title: 'Seabob Luxury Underwater Scooter (1 Hr)',
      titleAr: 'سكوتر بحري فاخر تحت الماء سيبوب (ساعة)',
      price: 350,
      priceType: 'hourly',
      description: 'Glide effortlessly through lagoons with a rechargeable high-performance Seabob F5'
    },
    {
      id: 'addon-mar-2',
      title: 'Drone 4K Filming & Aerial Video Reel',
      titleAr: 'تصوير احترافي بطائرة درون وفيديو 4K',
      price: 450,
      priceType: 'fixed',
      description: 'High-res aerial photography and edited social media reel delivered same day'
    },
    {
      id: 'addon-mar-3',
      title: 'Giant Inflatable Floating Sea Island',
      titleAr: 'جزيرة عائمة قابلة للنفخ في البحر',
      price: 180,
      priceType: 'fixed',
      description: 'Spacious floating platform for sunbathing and swimming alongside the yacht'
    },
    {
      id: 'addon-mar-4',
      title: 'Sunset Tapas & Cold Seafood Platter',
      titleAr: 'مقبلات مأكولات بحرية باردة عند الغروب',
      price: 220,
      priceType: 'fixed',
      description: 'Oysters, chilled tiger prawns, smoked salmon canapes and artisan dips'
    }
  ],
  'sports-adventure': [
    {
      id: 'addon-spt-1',
      title: 'Loaner Pro Carbon Rackets & Fresh Ball Can',
      titleAr: 'مضارب كاربون احترافية مع علبة كرات جديدة',
      price: 75,
      priceType: 'fixed',
      description: 'Set of 4 tournament-grade carbon padel rackets and pressurized balls'
    },
    {
      id: 'addon-spt-2',
      title: 'Private Pro Coach & Sparring Clinic (1 Hr)',
      titleAr: 'مدرب محترف وحصة تدريبية خاصة (ساعة)',
      price: 250,
      priceType: 'hourly',
      description: 'Certified coach focusing on serving, bandeja technique, and court positioning'
    },
    {
      id: 'addon-spt-3',
      title: 'Chilled Electrolytes & Cooling Towel Service',
      titleAr: 'مشروبات طاقة باردة ومناشف مثلجة',
      price: 45,
      priceType: 'fixed',
      description: 'Ice box packed with organic electrolyte hydration drinks and mint cooling towels'
    }
  ],
  'leisure-events': [
    {
      id: 'addon-lei-1',
      title: 'Live Acoustic Oud & Arabic Melodies (1.5 Hr)',
      titleAr: 'عازف عود حي وألحان عربية أصيلة',
      price: 450,
      priceType: 'fixed',
      description: 'Professional musician performing ambient melodies under the stars'
    },
    {
      id: 'addon-lei-2',
      title: 'Boho VIP Majlis Floor Seating & Firepit',
      titleAr: 'مجلس بوهيمي فاخر مع موقد نار خارجي',
      price: 300,
      priceType: 'fixed',
      description: 'Handwoven carpets, velvet cushions, lanterns, and fragrant frankincense'
    },
    {
      id: 'addon-lei-3',
      title: 'Outdoor 4K Starlight Cinema Setup',
      titleAr: 'سينما خارجية تحت النجوم مع جهاز عرض 4K',
      price: 380,
      priceType: 'fixed',
      description: 'Laser projector, 120-inch screen, soundbar, and hot gourmet popcorn machine'
    }
  ],
  'wellness': [
    {
      id: 'addon-wel-1',
      title: 'Organic Herbal Infusion & Aromatherapy Kit',
      titleAr: 'مجموعة زيوت عطرية عضوية وشاي أعشاب',
      price: 80,
      priceType: 'fixed',
      description: 'Custom botanical blends, lavender mist, and calming chamomile tea'
    },
    {
      id: 'addon-wel-2',
      title: 'Crystal Sound Bowl Chakra Immersion (30 Min)',
      titleAr: 'جلسة ترددات صوتية إضافية بأوعية الكريستال',
      price: 150,
      priceType: 'fixed',
      description: 'Deep resonant frequencies that stimulate cellular relaxation'
    },
    {
      id: 'addon-wel-3',
      title: 'Cold-Pressed Detox Green Juices Box',
      titleAr: 'صندوق عصائر ديتوكس عضوية معصورة على البارد',
      price: 60,
      priceType: 'fixed',
      description: 'Selection of 4 immunity and recovery cold-pressed blends'
    }
  ],
  'heritage-culture': [
    {
      id: 'addon-her-1',
      title: 'Private Falconry Demonstration & Photo Opp',
      titleAr: 'عرض صقارة خاص مع التقاط صور تذكارية',
      price: 220,
      priceType: 'fixed',
      description: 'Meet champion hunting falcons with a traditional falconer handler'
    },
    {
      id: 'addon-her-2',
      title: 'Handcrafted Gahwa Cup & Dallah Gift Set',
      titleAr: 'طقم فناجيل قهوة ودلة نحاسية تراثية هدية',
      price: 160,
      priceType: 'fixed',
      description: 'Embossed Arabic brass coffee pot and 4 ceramic finjan cups in a gift box'
    }
  ],
  'farm-nature': [
    {
      id: 'addon-frm-1',
      title: 'Organic Farm Harvest Crate to Take Home',
      titleAr: 'صندوق خضار وفواكه عضوية من المزرعة',
      price: 120,
      priceType: 'fixed',
      description: 'Fresh seasonal heirloom tomatoes, figs, organic herbs, and raw honeycomb'
    },
    {
      id: 'addon-frm-2',
      title: 'Bonfire Kindling & Marshmallow Roasting Kit',
      titleAr: 'حطب نار مع كيت شوي المارشميلو',
      price: 85,
      priceType: 'fixed',
      description: 'Sweet acacia firewood, roasting skewers, graham crackers, and Swiss chocolate'
    }
  ],
  'arts-workshops': [
    {
      id: 'addon-art-1',
      title: 'Deluxe Linen Canvas & Artist Acrylic Set to Keep',
      titleAr: 'مجموعة ألوان وأقمشة رسم فاخرة للاحتفاظ بها',
      price: 110,
      priceType: 'fixed',
      description: 'Complete easel-ready art kit with palette knives and pigment tubes'
    },
    {
      id: 'addon-art-2',
      title: 'Artisan Wood Custom Framing Service',
      titleAr: 'خدمة تأطير خشبي فاخر للوحة الفنية',
      price: 140,
      priceType: 'fixed',
      description: 'Custom finished wooden float frame ready to hang in your home'
    }
  ],
  'photography-content': [
    {
      id: 'addon-pht-1',
      title: 'Express 24-Hour Edit & Color Grade Delivery',
      titleAr: 'تسليم سريع خلال 24 ساعة مع تعديل ألوان سينمائي',
      price: 200,
      priceType: 'fixed',
      description: 'Priority queue processing for all high-res photos and video clips'
    },
    {
      id: 'addon-pht-2',
      title: 'Short-Form Social Media Reels Cut (3 Videos)',
      titleAr: 'مونتاج 3 مقاطع ريلز احترافية لمنصات التواصل',
      price: 320,
      priceType: 'fixed',
      description: 'Vertical 9:16 reels with trending audio synchronization and typography'
    }
  ]
};

export const getSuggestedAddons = (categoryId?: string): ActivityAddon[] => {
  if (!categoryId || !CATEGORY_DEFAULT_ADDONS[categoryId]) {
    return CATEGORY_DEFAULT_ADDONS['culinary'];
  }
  return CATEGORY_DEFAULT_ADDONS[categoryId];
};
