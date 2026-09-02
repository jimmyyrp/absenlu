'use client';

/**
 * Secure Auth Helper - Blu Decor Padang
 * Uses HMAC-like signature to prevent localStorage tampering.
 * NOTE: This is client-side protection (not server-side JWT).
 * It prevents casual tampering, not determined attackers.
 */

const AUTH_KEY = 'blu_admin_auth';
const ROLE_KEY = 'blu_user_role';
const NAME_KEY = 'blu_user_name';
const SIG_KEY = 'blu_auth_sig';

/** Simple hash function for signature (not cryptographically secure, but prevents casual tampering) */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

/** Set auth with integrity signature */
export function setAuth(role: string, name: string): void {
  const sig = simpleHash(`${role}:${name}:blu_decor_2024`);
  localStorage.setItem(AUTH_KEY, 'true');
  localStorage.setItem(ROLE_KEY, role);
  localStorage.setItem(NAME_KEY, name);
  localStorage.setItem(SIG_KEY, sig);
}

/** Check if auth is valid (not tampered) */
export function isAuthValid(): boolean {
  const auth = localStorage.getItem(AUTH_KEY);
  const role = localStorage.getItem(ROLE_KEY);
  const name = localStorage.getItem(NAME_KEY);
  const sig = localStorage.getItem(SIG_KEY);

  if (auth !== 'true' || !role || !name || !sig) return false;

  // Verify signature
  const expectedSig = simpleHash(`${role}:${name}:blu_decor_2024`);
  return sig === expectedSig;
}

/** Get user role (returns null if invalid) */
export function getAuthRole(): string | null {
  if (!isAuthValid()) return null;
  return localStorage.getItem(ROLE_KEY);
}

/** Get user name (returns null if invalid) */
export function getAuthName(): string | null {
  if (!isAuthValid()) return null;
  return localStorage.getItem(NAME_KEY);
}

/** Clear all auth data */
export function clearAuth(): void {
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(ROLE_KEY);
  localStorage.removeItem(NAME_KEY);
  localStorage.removeItem(SIG_KEY);
}
