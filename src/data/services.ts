import type { Ionicons } from '@expo/vector-icons';
import type { StringKey, Translate } from '../i18n';
import { CATEGORIES, type Category } from './categories';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

export type ServiceTemplate = {
  id: string;
  name: string;
  nameKey?: StringKey;
  color: string;
  category: Category;
  domain?: string;
  icon?: IconName;
};

export type ServiceFilter = 'all' | Category;

export const SERVICE_FILTERS: ServiceFilter[] = [
  'all',
  ...CATEGORIES.filter((category) => category !== 'other'),
];

export const services: ServiceTemplate[] = [
  { id: 'netflix', name: 'Netflix', domain: 'netflix.com', color: '#E50914', category: 'streaming' },
  { id: 'disney', name: 'Disney+', domain: 'disneyplus.com', color: '#113CCF', category: 'streaming' },
  { id: 'youtube', name: 'YouTube Premium', domain: 'youtube.com', color: '#FF0000', category: 'streaming' },
  { id: 'prime', name: 'Amazon Prime', domain: 'primevideo.com', color: '#00A8E1', category: 'streaming' },
  { id: 'spotify', name: 'Spotify', domain: 'spotify.com', color: '#1DB954', category: 'music' },
  { id: 'applemusic', name: 'Apple Music', domain: 'music.apple.com', color: '#FA243C', category: 'music' },
  { id: 'xbox', name: 'Xbox Game Pass', domain: 'xbox.com', color: '#107C10', category: 'gaming' },
  { id: 'psplus', name: 'PlayStation Plus', domain: 'playstation.com', color: '#0070D1', category: 'gaming' },
  { id: 'chatgpt', name: 'ChatGPT Plus', domain: 'chatgpt.com', color: '#10A37F', category: 'ai' },
  { id: 'claude', name: 'Claude', domain: 'claude.ai', color: '#D97757', category: 'ai' },
  { id: 'icloud', name: 'iCloud+', domain: 'icloud.com', color: '#3693F3', category: 'storage' },
  { id: 'googleone', name: 'Google One', domain: 'one.google.com', color: '#4285F4', category: 'storage' },
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
];

export const findService = (id: string) => services.find((service) => service.id === id);

export const getServiceName = (service: ServiceTemplate, t: Translate) =>
  service.nameKey ? t(service.nameKey) : service.name;