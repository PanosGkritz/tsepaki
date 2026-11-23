export type BillingCycle = 'monthly' | 'yearly';

export type PaymentMode = 'auto' | 'manual';

// Κοινή συνδρομή (Pro): με ποιους τη μοιράζεσαι και ποιος πληρώνει.
export type SharePerson = { name: string; amount?: number };

export type ShareSplit = 'equal' | 'custom';

export type ShareInfo = {
  people: SharePerson[];
  split: ShareSplit;
  // null: πληρώνεις εσύ και ζητάς από τους άλλους. Όνομα: πληρώνει αυτός και του δίνεις το μερίδιό σου.
  payer: string | null;
};

export type Subscription = {
  id: string;
  name: string;
  price: number;
  cycle: BillingCycle;
  nextChargeDate: string;
  color: string;
  category: string;
  paymentMode: PaymentMode;
  serviceId?: string;
  domain?: string;
  card?: string;
  isTrial?: boolean;
  share?: ShareInfo;
  // Το πακέτο του καταλόγου (π.χ. «Standard»), αν προστέθηκε από εκεί.
  plan?: string;
  createdAt?: string;
  reviewAfter?: string;
};

export type NewSubscription = Omit<Subscription, 'id' | 'createdAt' | 'reviewAfter'>;