import type { CatalogPrices, ServicePlan } from '../data/services';

export const CATALOG_PRICES_URL = 'https://panosgkritz.github.io/tsepaki/catalog/prices.json';

const FORMAT_VERSION = 1;
const MAX_PRICE = 1000;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isValidPrice = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value > 0 && value <= MAX_PRICE;

const toPlan = (value: unknown): ServicePlan | null => {
  if (!isRecord(value) || typeof value.name !== 'string' || !value.name.trim()) return null;

  const { monthly, yearly } = value;
  if (monthly !== undefined && !isValidPrice(monthly)) return null;
  if (yearly !== undefined && !isValidPrice(yearly)) return null;
  if (monthly === undefined && yearly === undefined) return null;

  return {
    name: value.name.trim(),
    monthly,
    yearly,
    ...(value.isDefault === true && { isDefault: true }),
  };
};

// Ένα λάθος οπουδήποτε στο αρχείο και το αγνοούμε ολόκληρο: κρατάμε τις τιμές που ήδη έχουμε.
export const parseCatalogPrices = (data: unknown): CatalogPrices | null => {
  if (!isRecord(data) || data.version !== FORMAT_VERSION) return null;

  const { asOf, services } = data;
  if (!isRecord(asOf) || typeof asOf.el !== 'string' || typeof asOf.en !== 'string') return null;
  if (!isRecord(services)) return null;

  const plans: Record<string, ServicePlan[]> = {};
  for (const [id, value] of Object.entries(services)) {
    if (!Array.isArray(value)) return null;
    const parsed = value.map(toPlan);
    if (parsed.some((plan) => plan === null)) return null;
    plans[id] = parsed.filter((plan) => plan !== null);
  }

  return { asOf: { el: asOf.el, en: asOf.en }, plans };
};
