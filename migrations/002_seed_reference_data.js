/**
 * Migration: 002_seed_reference_data
 * ==================================
 * Mengisi data referensi SITUS (bukan user) hanya bila koleksi masih kosong:
 *   - cmscategories      (kategori layanan)
 *   - cmssubcategories   (sub-kategori + harga dasar)
 *   - cmsthemes          (tema dekorasi)
 *   - cmssitesettings    (pengaturan identitas/WhatsApp/Instagram)
 *
 * Sumber data tunggal: src/lib/cms/seed-data.json (bukan hardcoded di sini).
 * Idempotent — data yang sudah ada tidak di-double atau di-overwrite.
 *
 * Catatan: TIDAK ada user/password hardcoded. Bootstrap akun admin ada di
 * migrasi 003 (dari env SEED_ADMIN_*, bukan dari kode).
 */

'use strict';

const C = require('../scripts/lib/collections');
const CK = C.COUNTER_KEYS;
const seedData = require('../src/lib/cms/seed-data.json');

async function seedReference(db, ctx) {
  const categories = db.collection(C.CATEGORIES);
  const subCategories = db.collection(C.SUB_CATEGORIES);
  const themes = db.collection(C.THEMES);
  const siteSettings = db.collection(C.SITE_SETTINGS);

  // 1) Kategori (hanya bila kosong)
  if ((await categories.countDocuments({})) === 0) {
    const byName = {};
    for (const c of seedData.categories) {
      const id = await ctx.nextId(CK.CATEGORIES);
      byName[c.name] = id;
      await categories.insertOne({ id, name: c.name, deleted_at: null, created_at: new Date() });
    }
    await ctx.setCounter(CK.CATEGORIES, seedData.categories.length);
    console.log(`  Kategori: ${seedData.categories.length} dibuat.`);
  } else {
    console.log('  Kategori sudah ada — dilewati.');
  }

  // 2) Sub-kategori (hanya bila kosong)
  if ((await subCategories.countDocuments({})) === 0) {
    const cats = await categories.find({ deleted_at: null }).toArray();
    const byName = {};
    for (const c of cats) byName[c.name] = c.id;

    for (const sc of seedData.sub_categories) {
      const categoryId = byName[sc.category];
      if (!categoryId) continue;
      await subCategories.insertOne({
        id: await ctx.nextId(CK.SUB_CATEGORIES),
        name: sc.name,
        category_id: categoryId,
        price: sc.price,
        deleted_at: null,
        created_at: new Date(),
      });
    }
    await ctx.setCounter(CK.SUB_CATEGORIES, seedData.sub_categories.length);
    console.log(`  Sub-kategori: ${seedData.sub_categories.length} dibuat.`);
  } else {
    console.log('  Sub-kategori sudah ada — dilewati.');
  }

  // 3) Thema
  if ((await themes.countDocuments({})) === 0) {
    for (const t of seedData.themes) {
      await themes.insertOne({ id: await ctx.nextId(CK.THEMES), name: t.name, deleted_at: null, created_at: new Date() });
    }
    await ctx.setCounter(CK.THEMES, seedData.themes.length);
    console.log(`  Theme: ${seedData.themes.length} dibuat.`);
  } else {
    console.log('  Theme sudah ada — dilewati.');
  }

  // 4) Pengaturan situs
  if ((await siteSettings.countDocuments({})) === 0) {
    for (const s of seedData.site_settings) {
      await siteSettings.insertOne({ id: await ctx.nextId(CK.SITE_SETTINGS), key: s.key, value: s.value, updated_at: new Date() });
    }
    await ctx.setCounter(CK.SITE_SETTINGS, seedData.site_settings.length);
    console.log(`  Pengaturan situs: ${seedData.site_settings.length} dibuat.`);
  } else {
    console.log('  Pengaturan situs sudah ada — dilewati.');
  }
}

module.exports = {
  version: '002',
  name: 'seed_reference_data',
  async up(db, ctx) {
    await seedReference(db, ctx);
  },
};