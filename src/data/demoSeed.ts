import type { SQLiteDatabase } from 'expo-sqlite';
import { addMonths, toIsoDate } from '../lib/dates';
import { getShareBreakdown } from '../lib/share';
import type { ShareInfo } from '../types/subscription';

// Παραδείγματα για εγγραφές οθόνης (reels, screenshots του store). Μπαίνουν μόνο στις
// βάσεις «tsepaki-demo*.db» και όλες οι ημερομηνίες είναι σε σχέση με σήμερα, ώστε η
// εγγραφή να δείχνει πάντα «γεμάτη» εφαρμογή: επόμενες χρεώσεις, ιστορικό, Pro.

type DemoSubscription = {
  id: string;
  name: string;
  price: number;
  cycle: 'monthly' | 'yearly';
  daysToNext: number;
  color: string;
  category: string;
  serviceId?: string;
  plan?: string;
  paymentMode?: 'auto' | 'manual';
  isTrial?: boolean;
  share?: ShareInfo;
  // Πόσους μήνες πριν από σήμερα προστέθηκε.
  monthsAgo: number;
  cancelledMonthsAgo?: number;
};

const DEMO_SHARE: ShareInfo = {
  people: [{ name: 'Γιώργος' }, { name: 'Μαρία' }],
  split: 'equal',
  payer: null,
};

const DEMO: DemoSubscription[] = [
  { id: 'demo-netflix', name: 'Netflix', price: 12.49, cycle: 'monthly', daysToNext: 2, color: '#E50914', category: 'streaming', serviceId: 'netflix', plan: 'Standard', monthsAgo: 10 },
  { id: 'demo-telekom', name: 'Telekom', price: 15, cycle: 'monthly', daysToNext: 1, color: '#E20074', category: 'mobile', serviceId: 'telekom', monthsAgo: 5 },
  { id: 'demo-claude', name: 'Claude', price: 20, cycle: 'monthly', daysToNext: 4, color: '#D97757', category: 'ai', serviceId: 'claude', isTrial: true, monthsAgo: 0 },
  { id: 'demo-spotify', name: 'Spotify', price: 8.99, cycle: 'monthly', daysToNext: 5, color: '#1DB954', category: 'music', serviceId: 'spotify', plan: 'Individual', monthsAgo: 10 },
  { id: 'demo-youtube', name: 'YouTube Premium', price: 10.99, cycle: 'monthly', daysToNext: 9, color: '#FF0000', category: 'streaming', serviceId: 'youtube', plan: 'Premium', monthsAgo: 6 },
  { id: 'demo-disney', name: 'Disney+', price: 10.99, cycle: 'monthly', daysToNext: 12, color: '#113CCF', category: 'streaming', serviceId: 'disney', plan: 'Standard', share: DEMO_SHARE, monthsAgo: 8 },
  { id: 'demo-xbox', name: 'Xbox Game Pass', price: 12.99, cycle: 'monthly', daysToNext: 16, color: '#107C10', category: 'gaming', serviceId: 'xbox', plan: 'Premium', monthsAgo: 7 },
  { id: 'demo-icloud', name: 'iCloud+', price: 0.99, cycle: 'monthly', daysToNext: 20, color: '#3693F3', category: 'storage', serviceId: 'icloud', plan: '50 GB', monthsAgo: 10 },
  { id: 'demo-gym', name: 'Γυμναστήριο', price: 35, cycle: 'monthly', daysToNext: -1, color: '#E8590C', category: 'activities', serviceId: 'gym', paymentMode: 'manual', monthsAgo: 3 },
  { id: 'demo-hbo', name: 'HBO Max', price: 9.99, cycle: 'monthly', daysToNext: 6, color: '#5822B4', category: 'streaming', serviceId: 'hbomax', monthsAgo: 10, cancelledMonthsAgo: 4 },
];

const daysFromToday = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return toIsoDate(date);
};

export const seedDemoData = async (db: SQLiteDatabase) => {
  const todayIso = toIsoDate(new Date());

  for (const item of DEMO) {
    const createdOn = addMonths(todayIso, -item.monthsAgo);
    const cancelledOn =
      item.cancelledMonthsAgo !== undefined ? addMonths(todayIso, -item.cancelledMonthsAgo) : null;
    // Για τις ακυρωμένες, η «επόμενη χρέωση» είναι αυτή που θα γινόταν μετά την ακύρωση.
    const nextCharge = cancelledOn
      ? addMonths(daysFromToday(item.daysToNext), -item.cancelledMonthsAgo!)
      : daysFromToday(item.daysToNext);
    const share = item.share ? JSON.stringify(item.share) : null;

    await db.runAsync(
      `INSERT INTO subscriptions
         (id, name, price_cents, cycle, next_charge_date, color, category, created_at, service_id,
          payment_mode, is_trial, share, plan, cancelled_at, review_after)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      item.id,
      item.name,
      Math.round(item.price * 100),
      item.cycle,
      nextCharge,
      item.color,
      item.category,
      `${createdOn} 10:00:00`,
      item.serviceId ?? null,
      item.paymentMode ?? 'auto',
      item.isTrial ? 1 : 0,
      share,
      item.plan ?? null,
      cancelledOn ? `${cancelledOn} 10:00:00` : null,
      // Μόνο το Xbox ρωτάει «Το χρησιμοποιείς ακόμα;» (το Netflix έχει ήδη την κάρτα αύξησης).
      item.id === 'demo-xbox' ? null : addMonths(todayIso, 2),
    );

    if (item.isTrial) continue;

    // Οι προηγούμενες χρεώσεις, μήνα-μήνα πίσω ως την ημέρα που προστέθηκε.
    const amount = item.share ? getShareBreakdown(item.price, item.share).mine : item.price;
    for (let step = 1; ; step += 1) {
      const chargeDate = addMonths(nextCharge, -step);
      if (chargeDate < createdOn) break;
      if (chargeDate > todayIso) continue;
      // Η παλιά τιμή του Spotify πριν την αύξηση, για το ιστορικό τιμής.
      const paid = item.id === 'demo-spotify' && step > 4 ? 7.99 : amount;
      await db.runAsync(
        `INSERT OR IGNORE INTO charges (subscription_id, amount_cents, charge_date, status)
         VALUES (?, ?, ?, 'paid')`,
        item.id,
        Math.round(paid * 100),
        chargeDate,
      );
    }
  }

  // Ιστορικό τιμής: το Spotify ανέβηκε πριν από λίγους μήνες.
  await db.runAsync(
    `INSERT INTO price_changes (subscription_id, changed_on, old_cents, new_cents, source, status)
     VALUES ('demo-spotify', ?, 799, 899, 'manual', 'applied')`,
    addMonths(todayIso, -4),
  );

  // Αύξηση από τον κατάλογο που περιμένει απάντηση: η κάρτα «Το Netflix ακρίβυνε».
  await db.runAsync(
    `INSERT INTO price_changes (subscription_id, changed_on, old_cents, new_cents, source, status)
     VALUES ('demo-netflix', ?, 1249, 1399, 'catalog', 'pending')`,
    todayIso,
  );

  // Κοινή συνδρομή: ο Γιώργος έδωσε ήδη το μερίδιό του για την τελευταία χρέωση.
  const lastDisney = addMonths(daysFromToday(12), -1);
  await db.runAsync(
    `INSERT INTO share_payments (subscription_id, charge_date, person) VALUES ('demo-disney', ?, 'Γιώργος')`,
    lastDisney,
  );
};
