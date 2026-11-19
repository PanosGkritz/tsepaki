import type { StringKey, Translate } from '../i18n';

export const CATEGORIES = [
  'streaming',
  'music',
  'gaming',
  'ai',
  'storage',
  'mobile',
  'tv',
  'activities',
  'other',
] as const;

export type Category = (typeof CATEGORIES)[number];

const CATEGORY_LABEL_KEYS: Record<Category, StringKey> = {
  streaming: 'category.streaming',
  music: 'category.music',
  gaming: 'category.gaming',
  ai: 'category.ai',
  storage: 'category.storage',
  mobile: 'category.mobile',
  tv: 'category.tv',
  activities: 'category.activities',
  other: 'category.other',
};

export const isCategory = (value: string): value is Category =>
  (CATEGORIES as readonly string[]).includes(value);

export const getCategoryLabel = (category: string, t: Translate) =>
  isCategory(category) ? t(CATEGORY_LABEL_KEYS[category]) : category;