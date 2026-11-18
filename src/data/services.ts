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
  { id: 'netflix', name: 'Netflix', domain: 'netflix.com', color: '#9E1B22', category: 'Streaming' },
  { id: 'disney', name: 'Disney+', domain: 'disneyplus.com', color: '#1E3A8A', category: 'Streaming' },
  { id: 'youtube', name: 'YouTube Premium', domain: 'youtube.com', color: '#B42318', category: 'Streaming' },
  { id: 'prime', name: 'Amazon Prime', domain: 'primevideo.com', color: '#0E7490', category: 'Streaming' },
  { id: 'spotify', name: 'Spotify', domain: 'spotify.com', color: '#2E8B57', category: 'Μουσική' },
  { id: 'applemusic', name: 'Apple Music', domain: 'music.apple.com', color: '#BE123C', category: 'Μουσική' },
  { id: 'xbox', name: 'Xbox Game Pass', domain: 'xbox.com', color: '#2F5E2B', category: 'Gaming' },
  { id: 'psplus', name: 'PlayStation Plus', domain: 'playstation.com', color: '#1D4ED8', category: 'Gaming' },
  { id: 'chatgpt', name: 'ChatGPT Plus', domain: 'chatgpt.com', color: '#3F3F46', category: 'AI' },
  { id: 'claude', name: 'Claude', domain: 'claude.ai', color: '#A4572F', category: 'AI' },
  { id: 'icloud', name: 'iCloud', domain: 'icloud.com', color: '#2563EB', category: 'Αποθήκευση' },
  { id: 'googleone', name: 'Google One', domain: 'one.google.com', color: '#4338CA', category: 'Αποθήκευση' },
  { id: 'cosmote', name: 'Cosmote', domain: 'cosmote.gr', color: '#3D7A3A', category: 'Κινητό' },
  { id: 'vodafone', name: 'Vodafone', domain: 'vodafone.gr', color: '#B91C1C', category: 'Κινητό' },
  { id: 'nova', name: 'Nova', domain: 'nova.gr', color: '#7C3AED', category: 'TV' },
];

export const findService = (id: string) => services.find((service) => service.id === id);