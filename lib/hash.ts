/**
 * FNV-1a hash implementation for deterministic wish selection
 * Based on the FNV-1a 32-bit hash algorithm
 */
export function fnv1aHash(input: string): number {
  const FNV_PRIME = 16777619;
  const FNV_OFFSET_BASIS = 2166136261;
  
  let hash = FNV_OFFSET_BASIS;
  
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash *= FNV_PRIME;
    hash &= 0xffffffff; // Keep it 32-bit
  }
  
  return Math.abs(hash);
}

/**
 * Get deterministic wish index based on FID and date
 * @param fid - User's Farcaster ID
 * @param date - Date string in YYYY-MM-DD format (defaults to today)
 * @returns Index into the wishes array
 */
export function getWishIndex(fid: number, date?: string): number {
  const targetDate = date || new Date().toISOString().split('T')[0];
  const input = `${fid}-${targetDate}`;
  const hash = fnv1aHash(input);
  
  // Import wishes dynamically to avoid circular dependency
  const { wishes } = require('./wishes');
  return hash % wishes.length;
}

/**
 * Get today's wish for a user
 * @param fid - User's Farcaster ID
 * @returns Today's wish for the user
 */
export function getTodaysWish(fid: number): string {
  const { wishes } = require('./wishes');
  const index = getWishIndex(fid);
  return wishes[index];
}

/**
 * Get wish for a specific date
 * @param fid - User's Farcaster ID
 * @param date - Date string in YYYY-MM-DD format
 * @returns Wish for the specified date
 */
export function getWishForDate(fid: number, date: string): string {
  const { wishes } = require('./wishes');
  const index = getWishIndex(fid, date);
  return wishes[index];
}