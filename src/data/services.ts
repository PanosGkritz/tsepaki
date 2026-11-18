export type ServiceTemplate = {
  id: string;
  name: string;
  domain: string;
  color: string;
  category: string;
};

export const SERVICE_CATEGORIES = [
  'Όλα',
  'Streaming',
  'Μουσική',
  'Gaming',
  'AI',
  'Αποθήκευση',
  'Κινητό',
  'TV',
] as const;

export const services: ServiceTemplate[] = [
  { id: 'netflix', name: 'Netflix', domain: 'netflix.com', color: '#E50914', category: 'Streaming' },
  { id: 'disney', name: 'Disney+', domain: 'disneyplus.com', color: '#113CCF', category: 'Streaming' },
  { id: 'youtube', name: 'YouTube Premium', domain: 'youtube.com', color: '#FF0000', category: 'Streaming' },
  { id: 'prime', name: 'Amazon Prime', domain: 'primevideo.com', color: '#00A8E1', category: 'Streaming' },
  { id: 'spotify', name: 'Spotify', domain: 'spotify.com', color: '#1DB954', category: 'Μουσική' },
  { id: 'applemusic', name: 'Apple Music', domain: 'music.apple.com', color: '#FA243C', category: 'Μουσική' },
  { id: 'xbox', name: 'Xbox Game Pass', domain: 'xbox.com', color: '#107C10', category: 'Gaming' },
  { id: 'psplus', name: 'PlayStation Plus', domain: 'playstation.com', color: '#0070D1', category: 'Gaming' },
  { id: 'chatgpt', name: 'ChatGPT Plus', domain: 'chatgpt.com', color: '#10A37F', category: 'AI' },
  { id: 'claude', name: 'Claude', domain: 'claude.ai', color: '#D97757', category: 'AI' },
  { id: 'icloud', name: 'iCloud+', domain: 'icloud.com', color: '#3693F3', category: 'Αποθήκευση' },
  { id: 'googleone', name: 'Google One', domain: 'one.google.com', color: '#4285F4', category: 'Αποθήκευση' },
  { id: 'telekom', name: 'Telekom', domain: 'telekom.com', color: '#E20074', category: 'Κινητό' },
  { id: 'vodafone', name: 'Vodafone', domain: 'vodafone.gr', color: '#E60000', category: 'Κινητό' },
  { id: 'magentatv', name: 'MagentaTV', domain: 'telekom.com', color: '#E20074', category: 'TV' },
  { id: 'nova', name: 'Nova', domain: 'nova.gr', color: '#0055A5', category: 'TV' },
];

export const findService = (id: string) => services.find((service) => service.id === id);