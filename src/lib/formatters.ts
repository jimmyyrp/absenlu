/**
 * Shared Formatter Utilities - Blu Decor Padang
 * Extracted from duplicated code across pages for easy maintenance.
 */

/** Format views to compact notation (e.g. 1200 → 1.2K) */
export const formatViews = (num: number): string => {
  return new Intl.NumberFormat('id-ID', {
    notation: 'compact',
    compactDisplay: 'short'
  }).format(num || 0);
};

/** Format price to IDR currency (e.g. 1500000 → Rp 1.500.000) */
export const formatPrice = (price: number): string => {
  if (!price || !Number.isFinite(price) || price <= 0) return "Desain Kustom";
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(price);
};

/** Deterministic seeded random for daily shuffle consistency */
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

/** Shuffle array deterministically based on current date seed */
export function dailyShuffle<T>(array: T[]): T[] {
  const today = new Date();
  const daySeed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom(daySeed + i) * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
