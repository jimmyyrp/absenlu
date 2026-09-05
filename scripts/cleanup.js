/**
 * Pembersihan Data (Maintenance) — MongoDB.
 * =========================================
 * Menghapus permanen dokumen yang ditandai "soft-delete" (deleted_at) lebih
 * dari N hari — mengikuti retensi: data masih bisa dipulihkan dalam window,
 * lalu dibersihkan agar DB tidak membengkak.
 *
 * Menangani koleksi yang memakai soft delete (deleted_at != null):
 *   cmsusers (hard-delete menyeluruh hanya bila akun sudah diganti; default
 *             soft-delete 7 hari dihapus permanen di sini).
 *
 * CARA PAKAI:
 *   npm run maintenance              (hapus soft-delete > 7 hari)
 *   npm run maintenance -- 14        (hapus soft-delete > 14 hari)
 */
'use strict';

const C = require('./lib/collections');
const { loadEnv, connectMongo } = require('./lib/mongo');

const DAYS = Number(process.argv[2] || process.env.CLEANUP_DAYS || 7);

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

async function main() {
  loadEnv();
  const mongoose = await connectMongo();
  const db = mongoose.connection.db;

  const cutoff = daysAgo(DAYS);
  let total = 0;

  for (const collection of [C.USERS, C.CATEGORIES, C.SUB_CATEGORIES, C.THEMES, C.TESTIMONIAL_TOKENS, C.POSTS, C.TESTIMONIALS]) {
    const col = db.collection(collection);
    const filter = { deleted_at: { $ne: null, $lt: cutoff } };
    const { deletedCount } = await col.deleteMany(filter);
    if (deletedCount > 0) {
      console.log(`  ${collection}: ${deletedCount} dokumen soft-delete dihapus permanen.`);
      total += deletedCount;
    }
  }

  console.log(total ? `Pembersihan selesai: ${total} dokumen dihapus (retensi ${DAYS} hari).` : `Tidak ada data kedaluwarsa (retensi ${DAYS} hari).`);
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(`✗ Gagal: ${e.message.split('\n')[0]}`);
  process.exit(1);
});