export const OPS_AUTH_KEY = 'bludecor_ops_auth';
export const OPS_USERNAME_KEY = 'bludecor_ops_username';
export const OPS_LASTLOGIN_KEY = 'bludecor_ops_lastlogin';
export const OPS_ROLE_KEY = 'bludecor_ops_role';
export const OPS_USERID_KEY = 'bludecor_ops_userid';

export type OpsRole = 'owner' | 'admin' | 'freelancer';

// Password per role. Change freely.
export const OPS_ROLE_PASSWORDS: Record<OpsRole, string> = {
  owner: 'owner123',
  admin: 'admin2026',
  freelancer: 'freelancer2026',
};

const OPS_ACCOUNTS: Record<string, { id: string; role: OpsRole }> = {
  owner: { id: 'u1', role: 'owner' },
  admin: { id: 'u2', role: 'admin' },
  jimmy: { id: 'u3', role: 'freelancer' },
  rian: { id: 'u4', role: 'freelancer' },
  fikri: { id: 'u5', role: 'freelancer' },
  doni: { id: 'u6', role: 'freelancer' },
  andre: { id: 'u7', role: 'freelancer' },
  bimo: { id: 'u8', role: 'freelancer' },
  cahya: { id: 'u9', role: 'freelancer' },
  dewi: { id: 'u10', role: 'freelancer' },
  ega: { id: 'u11', role: 'freelancer' },
  farhan: { id: 'u12', role: 'freelancer' },
  gilang: { id: 'u13', role: 'freelancer' },
  hendra: { id: 'u14', role: 'freelancer' },
  iqbal: { id: 'u15', role: 'freelancer' },
  jefri: { id: 'u16', role: 'freelancer' },
  kevin: { id: 'u17', role: 'freelancer' },
  lukman: { id: 'u18', role: 'freelancer' },
  mega: { id: 'u19', role: 'freelancer' },
};

export function roleLabel(role: OpsRole): string {
  return role === 'owner' ? 'Owner' : role === 'admin' ? 'Admin' : 'Freelancer';
}

export function roleForPassword(password: string): OpsRole | null {
  const entries = Object.entries(OPS_ROLE_PASSWORDS) as [OpsRole, string][];
  return entries.find(([, pw]) => pw === password)?.[0] ?? null;
}

export function opsAuthed(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(OPS_AUTH_KEY) === '1';
}

export function opsLogin(username: string, password: string): OpsRole | null {
  const account = OPS_ACCOUNTS[username.trim().toLowerCase()];
  const role = roleForPassword(password);
  if (!account || !role || account.role !== role) return null;
  localStorage.setItem(OPS_AUTH_KEY, '1');
  localStorage.setItem(OPS_USERNAME_KEY, username.trim().toLowerCase());
  localStorage.setItem(OPS_LASTLOGIN_KEY, new Date().toISOString());
  localStorage.setItem(OPS_ROLE_KEY, role);
  localStorage.setItem(OPS_USERID_KEY, account.id);
  return role;
}

export function opsLogout(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(OPS_AUTH_KEY);
  localStorage.removeItem(OPS_USERNAME_KEY);
  localStorage.removeItem(OPS_LASTLOGIN_KEY);
  localStorage.removeItem(OPS_ROLE_KEY);
  localStorage.removeItem(OPS_USERID_KEY);
}

export function opsUserId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(OPS_USERID_KEY);
}

export function opsRole(): OpsRole | null {
  if (typeof window === 'undefined') return null;
  const r = localStorage.getItem(OPS_ROLE_KEY);
  return r === 'owner' || r === 'admin' || r === 'freelancer' ? r : null;
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