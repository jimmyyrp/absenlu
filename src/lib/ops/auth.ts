export const OPS_AUTH_KEY = 'bludecor_ops_auth';
export const OPS_USERNAME_KEY = 'bludecor_ops_username';
export const OPS_NAME_KEY = 'bludecor_ops_name';
export const OPS_LASTLOGIN_KEY = 'bludecor_ops_lastlogin';
export const OPS_ROLE_KEY = 'bludecor_ops_role';
export const OPS_USERID_KEY = 'bludecor_ops_userid';

export type OpsRole = 'owner' | 'admin' | 'crew';

/**
 * Auth OPS dinamis — username & password diverifikasi ke MongoDB (cmsusers)
 * lewat POST /api/ops/login. Tidak ada lagi akun/password hardcoded.
 * localStorage hanya cache sesi; sumber kebenaran di database.
 */

export function roleLabel(role: OpsRole): string {
  return role === 'owner' ? 'Owner' : role === 'admin' ? 'Admin' : 'Crew';
}

export async function opsLogin(username: string, password: string): Promise<OpsRole | null> {
  try {
    const res = await fetch('/api/ops/login', {
      method: 'POST',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: username.trim().toLowerCase(), password }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || 'Login gagal.');
    }
    const json = await res.json();
    const { opsRole, user } = json as { opsRole: OpsRole; user: { id: number; username: string; full_name: string; role: string } };
    const now = new Date().toISOString();
    localStorage.setItem(OPS_AUTH_KEY, '1');
    localStorage.setItem(OPS_USERNAME_KEY, user.username);
    localStorage.setItem(OPS_NAME_KEY, user.full_name || user.username);
    localStorage.setItem(OPS_ROLE_KEY, opsRole);
    localStorage.setItem(OPS_USERID_KEY, `ops-${user.id}`);
    localStorage.setItem(OPS_LASTLOGIN_KEY, now);
    return opsRole;
  } catch {
    return null;
  }
}

export function opsLogout(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(OPS_AUTH_KEY);
  localStorage.removeItem(OPS_USERNAME_KEY);
  localStorage.removeItem(OPS_NAME_KEY);
  localStorage.removeItem(OPS_LASTLOGIN_KEY);
  localStorage.removeItem(OPS_ROLE_KEY);
  localStorage.removeItem(OPS_USERID_KEY);
}

export function opsAuthed(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(OPS_AUTH_KEY) === '1';
}

export function opsUsername(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(OPS_USERNAME_KEY);
}

export function opsName(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(OPS_NAME_KEY) || localStorage.getItem(OPS_USERNAME_KEY);
}

export function opsUserId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(OPS_USERID_KEY);
}

export function opsRole(): OpsRole | null {
  if (typeof window === 'undefined') return null;
  const r = localStorage.getItem(OPS_ROLE_KEY);
  return r === 'owner' || r === 'admin' || r === 'crew' ? r : null;
}

export function opsLastLogin(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(OPS_LASTLOGIN_KEY);
}

export function opsDevice(): string {
  if (typeof window === 'undefined') return 'Unknown';
  const ua = navigator.userAgent;
  if (/Android/i.test(ua)) return 'Android';
  if (/iPhone|iPad/i.test(ua)) return 'iOS';
  if (/Windows/i.test(ua)) return 'Windows / Desktop';
  if (/Mac/i.test(ua)) return 'macOS / Desktop';
  return 'Desktop / Browser';
}