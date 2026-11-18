export type BillingCycle = 'monthly' | 'yearly';

export type Subscription = {
  id: string;
  name: string;
  price: number;
  cycle: BillingCycle;
  nextChargeDate: string;
  color: string;
  category: string;
  serviceId?: string;
  domain?: string;
};

export type NewSubscription = Omit<Subscription, 'id'>;