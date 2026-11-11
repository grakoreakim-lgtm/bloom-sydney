// Shared B2B tier catalogue — used by /business/ landing, proposal page and admin views.
// Prices are AUD per visit, GST inclusive. Edit here and every page updates.

export const TRIAL_DISCOUNT_PCT = 50;           // first service discount
export const INVOICE_DAYS_DUE    = 14;

export const FREQUENCIES = {
  weekly:      { label: 'Weekly',      visitsPerMonth: 52 / 12 },
  fortnightly: { label: 'Fortnightly', visitsPerMonth: 26 / 12 },
};

export const TIERS = [
  {
    id: 'essential',
    name: 'Essential',
    tagline: 'Reception desk',
    bestFor: 'Clinics, dental & beauty practices, small offices',
    price: { weekly: 89, fortnightly: 99 },
    includes: [
      '1 reception-desk arrangement (approx. 40 cm)',
      'Vessel supplied & maintained',
      'Water refresh + spent-stem removal each visit',
    ],
  },
  {
    id: 'signature',
    name: 'Signature',
    tagline: 'Lobby + desk',
    bestFor: 'Boutique hotels, medical centres, law & real-estate offices',
    price: { weekly: 189, fortnightly: 209 },
    featured: true,
    includes: [
      '1 lobby statement piece (approx. 70 cm)',
      '1 reception-desk arrangement',
      'Seasonal theme change every visit',
      'Photo report emailed after each visit',
    ],
  },
  {
    id: 'grand',
    name: 'Grand',
    tagline: 'Full front-of-house',
    bestFor: 'Hotel lobbies, hospitals, corporate HQs',
    price: { weekly: 349, fortnightly: 389 },
    fromPrice: true,
    includes: [
      '1 large statement piece (1 m+)',
      'Up to 3 satellite arrangements (desk, lifts, bathrooms)',
      'Priority stems & dedicated florist',
      'Event-week upgrades on request',
    ],
  },
];

export const ADDONS = [
  { id: 'lowpollen', name: 'Low-pollen / scent-free stems', note: 'Recommended for hospitals, aged care and clinics', price: 0 },
  { id: 'wine',      name: 'VIP-room wine & flower gift',   note: 'Hunter Valley pairing, per room',               price: 65 },
  { id: 'seasonal',  name: 'Seasonal installation',         note: 'Christmas, Lunar New Year, Mother’s Day',      price: null },
];

export function tierById(id) { return TIERS.find(t => t.id === id) || null; }

export function priceFor(tierId, freq) {
  const t = tierById(tierId);
  return t ? (t.price[freq] ?? null) : null;
}

export function trialPrice(pricePerVisit, pct = TRIAL_DISCOUNT_PCT) {
  return Math.round(pricePerVisit * (100 - pct)) / 100;
}

export function monthlyEstimate(pricePerVisit, freq) {
  const f = FREQUENCIES[freq];
  return f ? Math.round(pricePerVisit * f.visitsPerMonth) : null;
}

export const fmtAUD = n =>
  (n == null || isNaN(n)) ? '—' : '$' + Number(n).toLocaleString('en-AU', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 });
