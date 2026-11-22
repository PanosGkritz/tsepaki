import type { Ionicons } from '@expo/vector-icons';
import type { Language, StringKey, Translate } from '../i18n';
import type { BillingCycle } from '../types/subscription';
import { CATEGORIES, type Category } from './categories';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

// Ένα πακέτο μπορεί να έχει μηνιαία τιμή, ετήσια ή και τις δύο.
export type ServicePlan = {
  name: string;
  monthly?: number;
  yearly?: number;
  isDefault?: true;
};

export type ServiceTemplate = {
  id: string;
  name: string;
  nameKey?: StringKey;
  color: string;
  category: Category;
  domain?: string;
  icon?: IconName;
  plans?: ServicePlan[];
};

export type ServiceFilter = 'all' | Category;

export const SERVICE_FILTERS: ServiceFilter[] = [
  'all',
  ...CATEGORIES.filter((category) => category !== 'other'),
];

// Πότε ελέγχθηκαν οι τιμές που είναι μέσα στην εφαρμογή. Αλλάζει μαζί με τις τιμές των πακέτων.
export const CATALOG_PRICES_AS_OF: Record<Language, string> = {
  el: 'Νοεμβρίου 2026',
  en: 'November 2026',
};

// Νεότερες τιμές από το docs/catalog/prices.json (GitHub Pages), αν έχουν κατέβει.
// Αλλάζουν μόνο τον κατάλογο, ποτέ τις συνδρομές που έχει ήδη ο χρήστης.
export type CatalogPrices = {
  asOf: Record<Language, string>;
  plans: Record<string, ServicePlan[]>;
};

let catalogPrices: CatalogPrices | null = null;

export const applyCatalogPrices = (prices: CatalogPrices) => {
  catalogPrices = prices;
};

export const getCatalogAsOf = (language: Language) =>
  catalogPrices?.asOf[language] ?? CATALOG_PRICES_AS_OF[language];

export const getServicePlans = (service?: ServiceTemplate): ServicePlan[] => {
  if (!service) return [];
  return catalogPrices?.plans[service.id] ?? service.plans ?? [];
};

const monthly = (name: string, price: number, isDefault?: true): ServicePlan => ({
  name,
  monthly: price,
  isDefault,
});

const yearly = (name: string, price: number, isDefault?: true): ServicePlan => ({
  name,
  yearly: price,
  isDefault,
});

const both = (
  name: string,
  monthlyPrice: number,
  yearlyPrice: number,
  isDefault?: true,
): ServicePlan => ({ name, monthly: monthlyPrice, yearly: yearlyPrice, isDefault });

// Τιμές μόνο από επίσημες ελληνικές σελίδες ή επιβεβαιωμένες πηγές για την Ελλάδα.
// Όπου η τιμή αλλάζει ανά store, χώρα ή πακέτο παρόχου, η υπηρεσία μπαίνει χωρίς πακέτα.
export const services: ServiceTemplate[] = [
  {
    id: 'netflix',
    name: 'Netflix',
    domain: 'netflix.com',
    color: '#E50914',
    category: 'streaming',
    plans: [monthly('Basic', 8.99), monthly('Standard', 12.49, true), monthly('Premium', 15.99)],
  },
  {
    id: 'spotify',
    name: 'Spotify',
    domain: 'spotify.com',
    color: '#1DB954',
    category: 'music',
    plans: [
      monthly('Individual', 8.99, true),
      monthly('Student', 4.99),
      monthly('Duo', 11.99),
      monthly('Family', 14.99),
    ],
  },
  {
    id: 'youtube',
    name: 'YouTube Premium',
    domain: 'youtube.com',
    color: '#FF0000',
    category: 'streaming',
    plans: [
      monthly('Premium', 10.99, true),
      monthly('Lite', 6.49),
      monthly('Family', 19.99),
      monthly('Student', 6.99),
    ],
  },
  {
    id: 'disney',
    name: 'Disney+',
    domain: 'disneyplus.com',
    color: '#113CCF',
    category: 'streaming',
    plans: [
      both('Standard', 10.99, 109.9, true),
      both('Premium', 15.99, 159.9),
    ],
  },
  {
    id: 'hbomax',
    name: 'HBO Max',
    domain: 'hbomax.com',
    color: '#002BE7',
    category: 'streaming',
    plans: [monthly('Standard', 10.99, true), monthly('Premium', 15.99)],
  },
  {
    id: 'prime',
    name: 'Prime Video',
    domain: 'primevideo.com',
    color: '#00A8E1',
    category: 'streaming',
    plans: [monthly('Prime Video', 6.99, true)],
  },
  {
    id: 'appletv',
    name: 'Apple TV',
    domain: 'tv.apple.com',
    color: '#1C1C1E',
    category: 'streaming',
    plans: [monthly('Apple TV', 9.99, true)],
  },
  { id: 'crunchyroll', name: 'Crunchyroll', domain: 'crunchyroll.com', color: '#F47521', category: 'streaming' },
  { id: 'mubi', name: 'MUBI', domain: 'mubi.com', color: '#001489', category: 'streaming' },

  {
    id: 'applemusic',
    name: 'Apple Music',
    domain: 'music.apple.com',
    color: '#FA243C',
    category: 'music',
    plans: [
      monthly('Individual', 8.99, true),
      monthly('Student', 4.99),
      monthly('Family', 14.99),
    ],
  },
  { id: 'deezer', name: 'Deezer', domain: 'deezer.com', color: '#A238FF', category: 'music' },
  { id: 'tidal', name: 'TIDAL', domain: 'tidal.com', color: '#000000', category: 'music' },

  {
    id: 'chatgpt',
    name: 'ChatGPT',
    domain: 'chatgpt.com',
    color: '#10A37F',
    category: 'ai',
    plans: [monthly('Plus', 23, true), monthly('Go', 8)],
  },
  { id: 'claude', name: 'Claude', domain: 'claude.ai', color: '#D97757', category: 'ai' },
  {
    id: 'gemini',
    name: 'Gemini',
    domain: 'gemini.google.com',
    color: '#4285F4',
    category: 'ai',
    plans: [monthly('Google AI Plus', 4.99), monthly('Google AI Pro', 22.99, true)],
  },
  { id: 'perplexity', name: 'Perplexity', domain: 'perplexity.ai', color: '#20808D', category: 'ai' },

  {
    id: 'xbox',
    name: 'Xbox Game Pass',
    domain: 'xbox.com',
    color: '#107C10',
    category: 'gaming',
    plans: [
      monthly('Essential', 8.99),
      monthly('Premium', 12.99, true),
      monthly('Ultimate', 20.99),
    ],
  },
  {
    id: 'psplus',
    name: 'PlayStation Plus',
    domain: 'playstation.com',
    color: '#0070D1',
    category: 'gaming',
    plans: [
      both('Essential', 9.99, 71.99, true),
      both('Extra', 15.99, 125.99),
      both('Premium', 18.99, 151.99),
    ],
  },
  { id: 'nintendo', name: 'Nintendo Switch Online', domain: 'nintendo.com', color: '#E60012', category: 'gaming' },
  { id: 'discord', name: 'Discord Nitro', domain: 'discord.com', color: '#5865F2', category: 'gaming' },

  {
    id: 'icloud',
    name: 'iCloud+',
    domain: 'icloud.com',
    color: '#3693F3',
    category: 'storage',
    plans: [monthly('50 GB', 0.99, true), monthly('200 GB', 2.99), monthly('2 TB', 9.99)],
  },
  {
    id: 'googleone',
    name: 'Google One',
    domain: 'one.google.com',
    color: '#4285F4',
    category: 'storage',
    plans: [monthly('100 GB', 1.99, true), monthly('2 TB', 9.99)],
  },
  { id: 'dropbox', name: 'Dropbox', domain: 'dropbox.com', color: '#0061FF', category: 'storage' },
  {
    id: 'appleone',
    name: 'Apple One',
    domain: 'apple.com',
    color: '#1C1C1E',
    category: 'storage',
    plans: [monthly('Individual', 16.95, true), monthly('Family', 21.95)],
  },

  {
    id: 'microsoft365',
    name: 'Microsoft 365',
    domain: 'microsoft.com',
    color: '#D83B01',
    category: 'tools',
    plans: [yearly('Personal', 99, true), yearly('Family', 129)],
  },
  { id: 'canva', name: 'Canva', domain: 'canva.com', color: '#00C4CC', category: 'tools' },
  { id: 'capcut', name: 'CapCut', domain: 'capcut.com', color: '#000000', category: 'tools' },
  { id: 'duolingo', name: 'Duolingo', domain: 'duolingo.com', color: '#58CC02', category: 'tools' },
  { id: 'linkedin', name: 'LinkedIn Premium', domain: 'linkedin.com', color: '#0A66C2', category: 'tools' },
  { id: 'nordvpn', name: 'NordVPN', domain: 'nordvpn.com', color: '#4687FF', category: 'tools' },

  {
    id: 'skroutz',
    name: 'Skroutz Plus',
    domain: 'skroutz.gr',
    color: '#F68B24',
    category: 'delivery',
    plans: [both('Plus', 4, 25, true)],
  },
  {
    id: 'efood',
    name: 'efood pro',
    domain: 'e-food.gr',
    color: '#ED2E2E',
    category: 'delivery',
    plans: [both('pro', 3.99, 34.99, true)],
  },
  {
    id: 'wolt',
    name: 'Wolt+',
    domain: 'wolt.com',
    color: '#009DE0',
    category: 'delivery',
    plans: [monthly('Wolt+', 3.99, true)],
  },
  {
    id: 'publicplus',
    name: 'Public+ Delivery',
    domain: 'public.gr',
    color: '#E30613',
    category: 'delivery',
    plans: [yearly('Public+ Delivery', 9.99, true)],
  },
  { id: 'uberone', name: 'Uber One', domain: 'uber.com', color: '#000000', category: 'delivery' },

  { id: 'telekom', name: 'Telekom', domain: 'telekom.com', color: '#E20074', category: 'mobile' },
  { id: 'vodafone', name: 'Vodafone', domain: 'vodafone.gr', color: '#E60000', category: 'mobile' },
  { id: 'magentatv', name: 'MagentaTV', domain: 'telekom.com', color: '#E20074', category: 'tv' },
  { id: 'nova', name: 'Nova', domain: 'nova.gr', color: '#0055A5', category: 'tv' },
  {
    id: 'gym',
    name: 'Γυμναστήριο',
    nameKey: 'service.gym',
    icon: 'barbell-outline',
    color: '#E8590C',
    category: 'activities',
  },
  {
    id: 'tutoring',
    name: 'Φροντιστήριο',
    nameKey: 'service.tutoring',
    icon: 'school-outline',
    color: '#1971C2',
    category: 'activities',
  },
  {
    id: 'languages',
    name: 'Ξένες γλώσσες',
    nameKey: 'service.languages',
    icon: 'language-outline',
    color: '#0C8599',
    category: 'activities',
  },
  {
    id: 'swimming',
    name: 'Κολύμβηση',
    nameKey: 'service.swimming',
    icon: 'water-outline',
    color: '#1C7ED6',
    category: 'activities',
  },
  {
    id: 'yoga',
    name: 'Γιόγκα & Pilates',
    nameKey: 'service.yoga',
    icon: 'body-outline',
    color: '#AE3EC9',
    category: 'activities',
  },
  {
    id: 'dance',
    name: 'Μαθήματα χορού',
    nameKey: 'service.dance',
    icon: 'footsteps-outline',
    color: '#D6336C',
    category: 'activities',
  },
  {
    id: 'martialarts',
    name: 'Πολεμικές τέχνες',
    nameKey: 'service.martialArts',
    icon: 'hand-left-outline',
    color: '#C92A2A',
    category: 'activities',
  },
  {
    id: 'football',
    name: 'Ακαδημία ποδοσφαίρου',
    nameKey: 'service.football',
    icon: 'football-outline',
    color: '#2F9E44',
    category: 'activities',
  },
  {
    id: 'tennis',
    name: 'Μαθήματα τένις',
    nameKey: 'service.tennis',
    icon: 'tennisball-outline',
    color: '#5C940D',
    category: 'activities',
  },
  {
    id: 'piano',
    name: 'Μαθήματα πιάνου',
    nameKey: 'service.piano',
    icon: 'musical-notes-outline',
    color: '#7048E8',
    category: 'activities',
  },
  {
    id: 'daycare',
    name: 'Παιδικός σταθμός',
    nameKey: 'service.daycare',
    icon: 'happy-outline',
    color: '#F08C00',
    category: 'activities',
  },
  {
    id: 'rent',
    name: 'Ενοίκιο',
    nameKey: 'service.rent',
    icon: 'home-outline',
    color: '#495057',
    category: 'other',
  },
  {
    id: 'parking',
    name: 'Θέση πάρκινγκ',
    nameKey: 'service.parking',
    icon: 'car-outline',
    color: '#364FC7',
    category: 'other',
  },
  {
    id: 'carinsurance',
    name: 'Ασφάλεια αυτοκινήτου',
    nameKey: 'service.carInsurance',
    icon: 'shield-checkmark-outline',
    color: '#087F5B',
    category: 'other',
  },
];

export const findService = (id: string) => services.find((service) => service.id === id);

export const getServiceName = (service: ServiceTemplate, t: Translate) =>
  service.nameKey ? t(service.nameKey) : service.name;

export const getDefaultPlan = (service?: ServiceTemplate) => {
  const plans = getServicePlans(service);
  return plans.find((plan) => plan.isDefault) ?? plans[0];
};

export const getPlanPrice = (plan: ServicePlan, cycle: BillingCycle) =>
  cycle === 'yearly' ? plan.yearly : plan.monthly;

// Η συχνότητα που ταιριάζει στο πακέτο: η ζητούμενη αν υπάρχει, αλλιώς όποια έχει.
export const getPlanCycle = (plan: ServicePlan, preferred: BillingCycle): BillingCycle => {
  if (getPlanPrice(plan, preferred) !== undefined) return preferred;
  return plan.monthly !== undefined ? 'monthly' : 'yearly';
};
