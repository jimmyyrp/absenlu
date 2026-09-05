/**
 * MongoDB Migration Runner — pengganti total sistem migrasi SQL (Supabase).
 * ==========================================================================
 * Sebelumnya proyek ini memakai migrations/*.sql (Postgres) + fungsi RPC
 * exec_sql. Karena seluruh data kini disimpan di MongoDB, migrasi ditulis
 * ulang sebagai skrip JavaScript murni yang dijalankan dari terminal.
 *
 * SETIAP file di folder ../migrations (mis. 001_initial_schema.js) harus
 * mengekspor:
 *
 *   module.exports = {
 *     version: '001',
 *     name: 'initial_schema',
 *     up: async (db, ctx) => { ... },     // db = mongodb Db, ctx = helpers
 *   };
 *
 * Runner membuat collection `migrations` untuk mencatat versi yang sudah
 * diterapkan (idempotent). Jalankan:
 *
 *   npm run db:migrate
 *
 * Data referensi (kategori/sub/thema/pengaturan) di-seed dari
 * ../src/lib/cms/seed-data.json (satu-satunya sumber). TIDAK ada user /
 * password hardcoded — akun admin hanya dibuat dari env SEED_ADMIN_*.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { loadEnv, connectMongo, counterModel } = require('./lib/mongo');

const MIGRATIONS_DIR = path.join(__dirname, '..', 'migrations');

const C = { reset: '\x1b[0m', green: '\x1b[32m', yellow: '\x1b[33m', red: '\x1b[31m', cyan: '\x1b[36m', dim: '\x1b[90m' };
const ok = (m) => console.log(`${C.green}✓${C.reset} ${m}`);
const warn = (m) => console.log(`${C.yellow}⚠${C.reset} ${m}`);
const info = (m) => console.log(`${C.cyan}→${C.reset} ${m}`);
const dim = (m) => console.log(`${C.dim}  ${m}${C.reset}`);
const err = (m) => console.log(`${C.red}✗${C.reset} ${m}`);

async function nextId(counter, name) {
  const doc = await counter.findByIdAndUpdate(
    name,
    { $inc: { lastId: 1 } },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
  ).lean();
  return doc?.lastId ?? 1;
}

async function setCounter(counter, name, value) {
  await counter.updateOne({ _id: name }, { $max: { lastId: value } }, { upsert: true });
}

async function runMigrations({ silent = false } = {}) {
  const log = silent ? () => {} : info;
  const okLog = silent ? () => {} : ok;

  loadEnv();
  const mongoose = await connectMongo();
  const db = mongoose.connection.db;

  const migrationCol = db.collection('migrations');
  const applied = await migrationCol.find({}).toArray();
  const appliedSet = new Set(applied.map((d) => d.version));

  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.js'))
    .sort();

  if (!files.length) {
    warn('Tidak ada file migrasi (.js) di folder migrations/.');
    return { applied: 0 };
  }

  let ran = 0;
  for (const file of files) {
    const mod = require(path.join(MIGRATIONS_DIR, file));
    const version = String(mod.version || file.replace(/\.js$/, ''));
    const name = mod.name || file;

    if (appliedSet.has(version)) {
      dim(`  ${version}_${name} — sudah diterapkan, dilewati.`);
      continue;
    }
    if (typeof mod.up !== 'function') {
      warn(`  ${version}_${name} — tidak memiliki fungsi up(), dilewati.`);
      continue;
    }

    log(`  Menjalankan ${version}_${name} ...`);
    const started = Date.now();

    const ctx = {
      db,
      mongoose,
      migrationCol,
      nextId: (name2) => nextId(counterModel(), name2),
      setCounter: (name2, value) => setCounter(counterModel(), name2, value),
    };

    // Migrasi DDL (createIndex/createCollection) tidak bisa berjalan di dalam
    // transaksi — tandai disableTransaction: true pada file yang hanya DDL.
    if (mod.disableTransaction) {
      await mod.up(db, ctx);
    } else {
      let session = null;
      try {
        session = await mongoose.startSession();
        await session.withTransaction(async () => {
          await mod.up(db, ctx);
        });
        await session.endSession();
      } catch (e) {
        // Standalone (tanpa replica set) tidak mendukung transaksi — coba tanpa session.
        if (session) { try { await session.endSession(); } catch {} }
        if (String(e.message || '').toLowerCase().includes('transaction')) {
          dim('  transaksi tidak didukung (standalone), lanjut tanpa transaksi.');
          await mod.up(db, ctx);
        } else {
          throw e;
        }
      }
    }

    const ms = Date.now() - started;
    await migrationCol.insertOne({ version, name, applied_at: new Date(), execution_ms: ms });
    okLog(`  ${version}_${name} selesai dalam ${ms} ms`);
    ran++;
  }

  if (ran === 0) okLog('Tidak ada migrasi baru. Database sudah mutakhir.');
  else okLog(`Seluruh migrasi selesai: ${ran} diterapkan.`);
  return { applied: ran };
}

if (require.main === module) {
  runMigrations()
    .then(({ applied }) => {
      console.log('');
      ok(applied ? 'Migrasi selesai — database siap dipakai.' : 'Database sudah mutakhir (tidak ada migrasi baru).');
      process.exit(0);
    })
    .catch((e) => {
      err(`Migrasi gagal: ${e.message.split('\n')[0]}`);
      process.exit(1);
    });
}

module.exports = { runMigrations };