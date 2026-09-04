import { cms } from '@/lib/cms-client';

/**
 * Storage Sweep Utility (MongoDB Media) — Blu Decor Padang
 * Audit & pembersihan AMAN file yatim di MongoDB (pengganti Supabase Storage).
 *
 * Aturan keselamatan:
 * - Media dianggap yatim HANYA jika URL-nya (`/api/media/<id>`) tidak dirujuk
 *   oleh `post_images` (images embedded) mana pun.
 * - Purge hanya menyentuh media yatim berumur >= ORPHAN_GRACE_DAYS hari.
 * - Operasi audit baca-saja; purge hanya via konfirmasi eksplisit.
 */

export const MEDIA_BUCKET = 'blu_media';
export const MEDIA_FOLDER = 'portfolio';
export const ORPHAN_GRACE_DAYS = 7;

export type MediaFile = {
  path: string;
  size: number;
  updatedAt?: string | null;
};

export type StorageAuditReport = {
  totalFiles: number;
  totalBytes: number;
  referencedCount: number;
  referencedBytes: number;
  orphanCount: number;
  orphanBytes: number;
  purgeableCount: number;
  purgeableBytes: number;
  waitingCount: number;
  waitingBytes: number;
  brokenReferences: number;
  oldestOrphanAt: string | null;
  sampleOrphans: MediaFile[];
};

const EMPTY_REPORT: StorageAuditReport = {
  totalFiles: 0, totalBytes: 0, referencedCount: 0, referencedBytes: 0,
  orphanCount: 0, orphanBytes: 0, purgeableCount: 0, purgeableBytes: 0,
  waitingCount: 0, waitingBytes: 0, brokenReferences: 0, oldestOrphanAt: null, sampleOrphans: [],
};

/** Ekstrak path media MongoDB ("/api/media/<id>") dari URL gambar. */
export function extractPathFromPublicUrl(publicUrl: string): string | null {
  if (!publicUrl) return null;
  const marker = '/api/media/';
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return null;
  const id = publicUrl.substring(idx + marker.length).split('?')[0].split('#')[0];
  return id ? `${marker}${id}` : null;
}

/** Audit baca-saja media kuburan: tidak pernah mengubah apa pun. */
export async function auditStorage(): Promise<StorageAuditReport> {
  const { data } = await cms.rpc('audit_media');
  if (!data) return EMPTY_REPORT;
  return data as StorageAuditReport;
}

/** Hapus media yatim yang sudah melewati masa tenggang. Hanya dengan konfirmasi eksplisit. */
export async function purgeOrphanFiles(): Promise<{ removed: string[]; failed: string[]; report: StorageAuditReport }> {
  const { data } = await cms.rpc('purge_orphan_media');
  if (!data) return { removed: [], failed: [], report: EMPTY_REPORT };
  return data as { removed: string[]; failed: string[]; report: StorageAuditReport };
}

/**
 * Bersihkan media galeri basi milik SATU post setelah edit berhasil.
 * Dipanggil non-blocking setelah insert DB sukses; kegagalan TIDAK
 * boleh menggagalkan penyimpanan konten.
 */
export async function deleteStaleGalleryFiles(_client: unknown, postId: number | string, keepUrls: string[]): Promise<number> {
  try {
    const { data } = await cms.rpc('cleanup_stale_media', { post_id: Number(postId), keep_urls: keepUrls });
    return Number(data) || 0;
  } catch {
    return 0;
  }
}