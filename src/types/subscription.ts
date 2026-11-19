export type BillingCycle = 'monthly' | 'yearly';

export type PaymentMode = 'auto' | 'manual';

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
};

export type NewSubscription = Omit<Subscription, 'id'>;