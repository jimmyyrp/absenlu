import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Storage Asset Sweep Utility - Blu Decor Padang
 * Audit dan pembersihan AMAN file yatim (orphan) di Supabase Storage.
 *
 * Aturan keselamatan:
 * - File dianggap yatim HANYA jika tidak dirujuk oleh post_images.url_images mana pun
 *   (termasuk baris milik post yang masih soft-deleted / menunggu purge RPC).
 * - Purge hanya menyentuh file yatim yang berumur >= ORPHAN_GRACE_DAYS hari.
 * - Tidak pernah menghapus folder, hanya file langsung di dalam MEDIA_FOLDER.
 * - Semua fungsi tidak pernah melempar exception ke alur simpan konten.
 */

export const MEDIA_BUCKET = 'blu_media';
export const MEDIA_FOLDER = 'portfolio';
export const ORPHAN_GRACE_DAYS = 7;

export type MediaFile = {
  name: string;
  path: string;
  size: number;
  updatedAt: string | null;
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

/** Ekstrak path storage ("portfolio/1_0.webp") dari URL publik Supabase. */
export function extractPathFromPublicUrl(publicUrl: string): string | null {
  if (!publicUrl) return null;
  const marker = `/storage/v1/object/public/${MEDIA_BUCKET}/`;
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return null;
  let raw = publicUrl.substring(idx + marker.length).split('?')[0].split('#')[0];
  try {
    raw = decodeURIComponent(raw);
  } catch {
    /* biarkan apa adanya */
  }
  return raw || null;
}

function isFinitePositive(n: unknown): n is number {
  return typeof n === 'number' && Number.isFinite(n) && n > 0;
}

/** List semua file langsung di dalam MEDIA_FOLDER (tanpa subfolder), dengan paginasi. */
export async function listMediaFiles(client: SupabaseClient): Promise<MediaFile[]> {
  const out: MediaFile[] = [];
  const pageSize = 1000;
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await client.storage
      .from(MEDIA_BUCKET)
      .list(MEDIA_FOLDER, {
        limit: pageSize,
        offset,
        sortBy: { column: 'name', order: 'asc' },
      });
    if (error) throw new Error(`Gagal membaca bucket "${MEDIA_BUCKET}": ${error.message}`);
    const rows = data || [];
    for (const f of rows) {
      // Entri subfolder memiliki metadata null -> lewati agar tidak pernah tersentuh.
      if (!f.name || !isFinitePositive((f as any).metadata?.size)) continue;
      out.push({
        name: f.name,
        path: `${MEDIA_FOLDER}/${f.name}`,
        size: (f as any).metadata.size,
        updatedAt: f.updated_at || f.created_at || null,
      });
    }
    if (rows.length < pageSize) break;
  }
  return out;
}

/** Kumpulan path yang DIRUJUK database + hitungan referensi rusak (URL tak valid). */
export async function fetchReferencedMediaPaths(
  client: SupabaseClient
): Promise<{ paths: Set<string>; broken: number }> {
  const paths = new Set<string>();
  let broken = 0;
  const pageSize = 1000;
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await client
      .from('post_images')
      .select('url_images')
      .order('id')
      .range(from, from + pageSize - 1);
    if (error) throw new Error(`Gagal membaca tabel post_images: ${error.message}`);
    for (const row of data || []) {
      const p = extractPathFromPublicUrl(row.url_images || '');
      if (p) paths.add(p);
      else broken++;
    }
    if (!data || data.length < pageSize) break;
  }
  return { paths, broken };
}

function classify(files: MediaFile[], referenced: Set<string>, graceCutoffMs: number) {
  const report: StorageAuditReport = {
    totalFiles: 0,
    totalBytes: 0,
    referencedCount: 0,
    referencedBytes: 0,
    orphanCount: 0,
    orphanBytes: 0,
    purgeableCount: 0,
    purgeableBytes: 0,
    waitingCount: 0,
    waitingBytes: 0,
    brokenReferences: 0,
    oldestOrphanAt: null,
    sampleOrphans: [],
  };
  report.totalFiles = files.length;
  for (const f of files) {
    report.totalBytes += f.size;
    if (referenced.has(f.path)) {
      report.referencedCount++;
      report.referencedBytes += f.size;
      continue;
    }
    report.orphanCount++;
    report.orphanBytes += f.size;
    const ts = f.updatedAt ? Date.parse(f.updatedAt) : NaN;
    if (Number.isNaN(ts) || ts >= graceCutoffMs) {
      report.waitingCount++;
      report.waitingBytes += f.size;
    } else {
      report.purgeableCount++;
      report.purgeableBytes += f.size;
      if (report.oldestOrphanAt === null || (f.updatedAt && f.updatedAt < report.oldestOrphanAt)) {
        report.oldestOrphanAt = f.updatedAt;
      }
    }
    if (report.sampleOrphans.length < 12) report.sampleOrphans.push(f);
  }
  return report;
}

/** Audit baca-saja: tidak pernah mengubah apa pun. */
export async function auditStorage(client: SupabaseClient): Promise<StorageAuditReport> {
  const graceCutoff = Date.now() - ORPHAN_GRACE_DAYS * 24 * 60 * 60 * 1000;
  const [files, refs] = await Promise.all([
    listMediaFiles(client),
    fetchReferencedMediaPaths(client),
  ]);
  const report = classify(files, refs.paths, graceCutoff);
  report.brokenReferences = refs.broken;
  return report;
}

/** Hapus file yatim yang sudah melewati masa tunggu. Hanya dipanggil dengan konfirmasi eksplisit. */
export async function purgeOrphanFiles(
  client: SupabaseClient
): Promise<{ removed: string[]; failed: string[]; report: StorageAuditReport }> {
  const graceCutoff = Date.now() - ORPHAN_GRACE_DAYS * 24 * 60 * 60 * 1000;
  const [files, refs] = await Promise.all([
    listMediaFiles(client),
    fetchReferencedMediaPaths(client),
  ]);
  const report = classify(files, refs.paths, graceCutoff);
  report.brokenReferences = refs.broken;

  const targets = files.filter(f => {
    if (refs.paths.has(f.path)) return false;
    const ts = f.updatedAt ? Date.parse(f.updatedAt) : NaN;
    // Tanpa timestamp yang bisa dibaca -> anggap belum aman dihapus.
    return Number.isNaN(ts) ? false : ts < graceCutoff;
  });

  const removed: string[] = [];
  const failed: string[] = [];
  for (let i = 0; i < targets.length; i += 50) {
    const chunk = targets.slice(i, i + 50).map(f => f.path);
    const { error } = await client.storage.from(MEDIA_BUCKET).remove(chunk);
    if (error) failed.push(...chunk);
    else removed.push(...chunk);
  }
  return { removed, failed, report };
}

const POST_IMAGE_NAME_RE = /^[a-zA-Z0-9]+_(?:\d+_)?\d+\.webp$/i;

/**
 * Bersihkan file galeri basi milik SATU post tertentu setelah edit berhasil
 * (misal galeri dipangkas dari 5 menjadi 3 gambar -> _3.webp dan _4.webp basi).
 * Dipanggil non-blocking setelah insert DB sukses; gagal bersih-bersih TIDAK
 * boleh menggagalkan penyimpanan konten.
 */
export async function deleteStaleGalleryFiles(
  client: SupabaseClient,
  postId: number | string,
  keepUrls: string[]
): Promise<number> {
  try {
    const keep = new Set(
      keepUrls.map(u => extractPathFromPublicUrl(u)).filter((p): p is string => !!p)
    );
    const prefix = `${postId}_`;
    const stale: string[] = [];
    const pageSize = 200;
    for (let offset = 0; ; offset += pageSize) {
      const { data, error } = await client.storage
        .from(MEDIA_BUCKET)
        .list(MEDIA_FOLDER, { limit: pageSize, offset, search: prefix });
      if (error) break;
      const rows = data || [];
      for (const f of rows) {
        if (!f.name || !isFinitePositive((f as any).metadata?.size)) continue;
        if (!f.name.startsWith(prefix)) continue;
        if (!POST_IMAGE_NAME_RE.test(f.name)) continue;
        const path = `${MEDIA_FOLDER}/${f.name}`;
        if (!keep.has(path)) stale.push(path);
      }
      if (rows.length < pageSize) break;
    }
    let removed = 0;
    for (let i = 0; i < stale.length; i += 50) {
      const { error } = await client.storage
        .from(MEDIA_BUCKET)
        .remove(stale.slice(i, i + 50));
      if (!error) removed += Math.min(50, stale.length - i);
    }
    return removed;
  } catch {
    return 0;
  }
}
