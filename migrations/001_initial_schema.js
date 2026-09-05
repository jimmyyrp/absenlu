/**
 * Migration: 001_initial_schema
 * =============================
 * Membuat / memastikan struktur dan indeks MongoDB untuk seluruh koleksi
 * aplikasi. Di MongoDB "skema" berupa aturan dokumen — bentuk dokumen sudah
 * ditentukan oleh model Mongoose (src/lib/cms/models.ts) dan dibuat otomatis
 * saat insert. Di sini kita menyiapkan INDEKS agar query cepat & konsisten
 * (menggantikan berkas migrations/*.sql yang dahulu meniru Postgres/Supabase).
 *
 * Idempotent: createIndex aman dijalankan berulang (indeks yang sudah ada
 * tidak dibuat ulang). Koleksi yang tak pernah ditulis baru dibuat saat
 * indeks pertama dibuat.
 */

'use strict';

const C = require('../scripts/lib/collections');

const INDEXES = {
  [C.USERS]: [
    { keys: { id: 1 }, opts: { unique: true } },
    { keys: { username: 1 }, opts: { unique: true } },
    { keys: { username: 1, deleted_at: 1 }, opts: {} },
    { keys: { role: 1 }, opts: {} },
  ],
  [C.CATEGORIES]: [
    { keys: { id: 1 }, opts: { unique: true } },
    { keys: { name: 1 }, opts: {} },
    { keys: { deleted_at: 1 }, opts: {} },
  ],
  [C.SUB_CATEGORIES]: [
    { keys: { id: 1 }, opts: { unique: true } },
    { keys: { category_id: 1 }, opts: {} },
    { keys: { category_id: 1, deleted_at: 1 }, opts: {} },
    { keys: { name: 1 }, opts: {} },
  ],
  [C.THEMES]: [
    { keys: { id: 1 }, opts: { unique: true } },
    { keys: { name: 1 }, opts: {} },
    { keys: { deleted_at: 1 }, opts: {} },
  ],
  [C.TESTIMONIAL_TOKENS]: [
    { keys: { id: 1 }, opts: { unique: true } },
    { keys: { token: 1 }, opts: { unique: true } },
    { keys: { token: 1, deleted_at: 1 }, opts: {} },
  ],
  [C.SITE_SETTINGS]: [
    { keys: { id: 1 }, opts: { unique: true } },
    { keys: { key: 1 }, opts: { unique: true } },
  ],
  [C.POSTS]: [
    { keys: { id: 1 }, opts: { unique: true } },
    { keys: { id: -1 }, opts: {} },
    { keys: { deleted_at: 1 }, opts: {} },
    { keys: { theme_id: 1 }, opts: {} },
    { keys: { views: -1 }, opts: {} },
    { keys: { category_ids: 1 }, opts: {} },
    { keys: { sub_category_ids: 1 }, opts: {} },
    { keys: { theme_id: 1, deleted_at: 1 }, opts: {} },
  ],
  [C.EVENTS]: [
    { keys: { id: 1 }, opts: { unique: true } },
    { keys: { slug: 1 }, opts: { unique: true } },
    { keys: { is_active: 1, start_date: 1, end_date: 1 }, opts: {} },
    { keys: { priority: -1 }, opts: {} },
  ],
  [C.TESTIMONIALS]: [
    { keys: { id: 1 }, opts: { unique: true } },
    { keys: { token_used: 1 }, opts: {} },
    { keys: { deleted_at: 1 }, opts: {} },
  ],
  [C.MEDIA]: [
    { keys: { postId: 1 }, opts: {} },
    { keys: { created_at: 1 }, opts: {} },
  ],
  [C.OPS_STATES]: [
    { keys: { key: 1 }, opts: { unique: true } },
  ],
  [C.MIGRATIONS]: [
    { keys: { version: 1 }, opts: { unique: true } },
    { keys: { applied_at: 1 }, opts: {} },
  ],
};

module.exports = {
  version: '001',
  name: 'initial_schema',
  disableTransaction: true,
  async up(db) {
    let created = 0;
    let skipped = 0;

    for (const [collection, indexes] of Object.entries(INDEXES)) {
      for (const { keys, opts } of indexes) {
        try {
          await db.createIndex(collection, keys, opts);
          created++;
        } catch (e) {
          // E11000 / konflik (mis. duplikat pada data lama) = dorong saja.
          // Tampilkan sebagai peringatan agar tidak menggagalkan migrasi.
          const msg = String(e.message || '').split('\n')[0];
          console.warn(`  (index ${collection} ${Object.keys(keys).join('+')}) dilewati: ${msg}`);
          skipped++;
        }
      }
    }

    console.log(`  Indeks siap: ${created} dibuat, ${skipped} dilewati (duplikat/konflik).`);
  },
};