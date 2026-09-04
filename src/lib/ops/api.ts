import type { OpsState } from './types';

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
            window.localStorage.getItem('bludecor_ops_username')) ||
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