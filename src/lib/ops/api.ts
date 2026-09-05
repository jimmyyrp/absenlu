import type { OpsState } from './types';
import type { UserRole as OpsUserRole } from './types';
import { OPS_USERNAME_KEY } from './auth';

/**
 * Client helper to read/write the OPS state through the MongoDB-backed API.
 * Keeps localStorage as an offline cache only — MongoDB (server) is the
 * source of truth.
 */

export const OPS_STATE_ENDPOINT = '/api/ops/state';
export const OPS_HEALTH_ENDPOINT = '/api/ops/health';

export interface OpsHealth {
  configured: boolean;
  connected: boolean;
  hasData: boolean;
  updatedAt: string | null;
  docStats: {
    users: number;
    decors: number;
    tasks: number;
    attendance: number;
    activities: number;
    photos: number;
    expenses: number;
    corrections: number;
    audit: number;
  };
}

/** Returns the OpsState persisted in MongoDB, or null when none exists yet. */
export async function fetchOpsState(): Promise<OpsState | null> {
  try {
    const res = await fetch(OPS_STATE_ENDPOINT, {
      method: 'GET',
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return (json.state as OpsState) ?? null;
  } catch {
    return null;
  }
}

/** Persists the full OpsState to MongoDB. Returns true on success. */
export async function saveOpsState(state: OpsState): Promise<boolean> {
  try {
    const res = await fetch(OPS_STATE_ENDPOINT, {
      method: 'POST',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        state,
        updatedBy:
          (typeof window !== 'undefined' &&
            window.localStorage.getItem(OPS_USERNAME_KEY)) ||
          'ops',
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Live health of the MongoDB backend (for the Pengaturan page). */
export async function fetchOpsHealth(): Promise<OpsHealth | null> {
  try {
    const res = await fetch(OPS_HEALTH_ENDPOINT, {
      method: 'GET',
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    return (await res.json()) as OpsHealth;
  } catch {
    return null;
  }
}

/**
 * Akun OPS terkait erat dengan akun CMS (`cmsusers`): menciptakan/mengubah/
 * menghapus anggota Tim di opsstates juga menciptakan/mengubah/menghapus akun
 * `cmsusers` agar anggota tersebut bisa login (/login & /admin). Panggilan
 * harus menggunakan username owner yang sedang login (diverifikasi server).
 */
export interface OpsAccountResult {
  ok: boolean;
  error?: string;
}

export interface OpsAccountInput {
  username: string;
  name: string;
  role: OpsUserRole;
  password?: string;
  active?: boolean;
}

async function opsAccountRequest(body: unknown): Promise<OpsAccountResult> {
  try {
    const res = await fetch('/api/ops/users', {
      method: 'POST',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: json.error || 'Gagal memproses akun.' };
    return { ok: true };
  } catch {
    return { ok: false, error: 'Tidak terhubung ke server.' };
  }
}

export function actorUsername(): string {
  if (typeof window === 'undefined') return '';
  return window.localStorage.getItem(OPS_USERNAME_KEY) || '';
}

export async function createOpsAccount(input: OpsAccountInput): Promise<OpsAccountResult> {
  return opsAccountRequest({
    action: 'create',
    actor: actorUsername(),
    user: {
      username: input.username,
      name: input.name,
      role: input.role,
      password: input.password,
    },
  });
}

export async function updateOpsAccount(input: OpsAccountInput): Promise<OpsAccountResult> {
  return opsAccountRequest({
    action: 'update',
    actor: actorUsername(),
    user: {
      username: input.username,
      name: input.name,
      role: input.role,
      password: input.password,
      active: input.active,
    },
  });
}

export async function deleteOpsAccount(username: string): Promise<OpsAccountResult> {
  return opsAccountRequest({ action: 'delete', actor: actorUsername(), username });
}