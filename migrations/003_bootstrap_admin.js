/**
 * Migration: 003_bootstrap_admin
 * ==============================
 * Membuat akun login ADMIN PERTAMA hanya bila:
 *   - collection cmsusers masih kosong, DAN
 *   - env SEED_ADMIN_PASSWORD tersedia (di .env / environment Vercel).
 *
 * TIDAK ada username/password hardcoded di kode. Bila env password belum
 * diatur, migrasi ini dilewati tanpa membuat apa pun (jalankan
 * `npm run db:seed` untuk membuat akun interaktif via prompt).
 *
 * Akun ini dipakai baik oleh portal admin (/admin) maupun OPS (/login) —
 * sama-sama dibaca dinamis dari MongoDB.
 */

'use strict';

const bcrypt = require('bcryptjs');
const C = require('../scripts/lib/collections');
const CK = C.COUNTER_KEYS;

const VALID_ROLES = ['owner', 'developer', 'admin', 'staff'];

module.exports = {
  version: '003',
  name: 'bootstrap_admin',
  async up(db, ctx) {
    const users = db.collection(C.USERS);

    const existing = await users.countDocuments({});
    if (existing > 0) {
      console.log(`  User sudah ada (${existing}) — akun awal tidak dibuat.`);
      return;
    }

    const password = String(process.env.SEED_ADMIN_PASSWORD || '').trim();
    if (!password) {
      console.log('  cmsusers kosong & SEED_ADMIN_PASSWORD belum diatur — dilewati.');
      console.log('  Atur SEED_ADMIN_PASSWORD lalu `npm run db:migrate` (atau `npm run db:seed`).');
      return;
    }
    if (password.length < 6) {
      console.log('  SEED_ADMIN_PASSWORD terlalu pendek (<6) — dilewati. Gunakan password minimal 6 karakter.');
      return;
    }

    const username = String(process.env.SEED_ADMIN_USERNAME || 'owner').trim().toLowerCase() || 'owner';
    const fullName = String(process.env.SEED_ADMIN_NAME || 'Owner').trim();
    const requestedRole = String(process.env.SEED_ADMIN_ROLE || 'owner').trim().toLowerCase();
    const role = VALID_ROLES.includes(requestedRole) ? requestedRole : 'owner';

    const id = await ctx.nextId(CK.USERS);
    await users.insertOne({
      id,
      username,
      password: bcrypt.hashSync(password, 10),
      full_name: fullName,
      role,
      deleted_at: null,
      created_at: new Date(),
    });
    await ctx.setCounter(CK.USERS, 1);

    console.log(`  Akun admin dibuat: ${username} (${role}) — ${fullName}.`);
  },
};