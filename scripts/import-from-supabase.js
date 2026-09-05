/**
 * Import Data Postgres (Supabase) → MongoDB
 * ==========================================
 * Migrasi seluruh data situs (users, categories, sub_categories, themes,
 * posts + relasi, testimonials, testimonial_tokens, events, site_settings)
 * dari database Postgres lama ke MongoDB Atlas — via terminal, TANPA membuka
 * web Atlas. Data user AKUN diambil dari database, bukan hardcoded.
 *
 * CARA PAKAI:
 *   1) Tambahkan sementara di .env:
 *      SUPABASE_DB_URL=postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres
 *   2) npm run db:import
 *      npm run db:import -- --only users,categories
 *      npm run db:import -- --skip post_images
 *
 * Idempotent: dokumen dengan `id` yang sudah ada TIDAK di-overwrite.
 * Jalankan npm run db:seed untuk bootstrap data referensi + akun admin bila DB kosong.
 */

const { Client } = require('pg');
const { loadEnv, connectMongo, model, counterModel } = require('./lib/mongo');

if (!process.env.SUPABASE_DB_URL) {
  loadEnv();
}
const SUPABASE_DB_URL = process.env.SUPABASE_DB_URL || '';

if (!SUPABASE_DB_URL) {
  console.error('✗ SUPABASE_DB_URL tidak ditemukan di .env');
  console.log('');
  console.log('  Tambahkan URL Postgres Supabase di .env:');
  console.log('  SUPABASE_DB_URL=postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres');
  console.log('  Sumber: Supabase Dashboard → Project Settings → Database → Connect → URI');
  console.log('  Alternatif DB baru: npm run db:seed');
  process.exit(1);
}

const args = process.argv.slice(2);
const valOf = (flag) => {
  const i = args.indexOf(flag);
  return i !== -1 && args[i + 1] ? args[i + 1] : null;
};
const tableFilter = valOf('--table') || valOf('--only');
const tableSkip = valOf('--skip');
const filterSet = tableFilter ? new Set(tableFilter.split(',').map((s) => s.trim()).filter(Boolean)) : null;
const skipSet = tableSkip ? new Set(tableSkip.split(',').map((s) => s.trim()).filter(Boolean)) : null;
const isWanted = (t) => (!filterSet || filterSet.has(t)) && (!skipSet || !skipSet.has(t));

const C = { reset: '\x1b[0m', green: '\x1b[32m', yellow: '\x1b[33m', red: '\x1b[31m', cyan: '\x1b[36m', dim: '\x1b[90m' };
const log = (m) => console.log(m);
const ok = (m) => console.log(`${C.green}✓${C.reset} ${m}`);
const warn = (m) => console.log(`${C.yellow}⚠${C.reset} ${m}`);
const err = (m) => console.log(`${C.red}✗${C.reset} ${m}`);
const info = (m) => console.log(`${C.cyan}→${C.reset} ${m}`);
const dim = (m) => console.log(`${C.dim}  ${m}${C.reset}`);

const TABLES = [
  'users', 'categories', 'sub_categories', 'themes', 'testimonial_tokens',
  'site_settings', 'posts', 'post_images', 'post_categories',
  'post_sub_categories', 'testimonials', 'events',
];

const MAIN_TABLES = [
  'users', 'categories', 'sub_categories', 'themes', 'testimonial_tokens',
  'site_settings', 'events', 'testimonials',
];

const COLLECTION_FOR = {
  users: 'cmsusers', categories: 'cmscategories', sub_categories: 'cmssubcategories',
  themes: 'cmsthemes', testimonial_tokens: 'cmstestimonialtokens',
  site_settings: 'cmssitesettings', posts: 'cmsposts', events: 'cmsevents',
  testimonials: 'cmstestimonials',
};

const NUMERIC_COLS = new Set(['id', 'category_id', 'sub_category_id', 'price', 'views', 'rating', 'usage_limit', 'usage_count', 'priority']);

function norm(v) {
  if (v === null || v === undefined) return undefined;
  if (v instanceof Date || typeof v === 'number' || typeof v === 'boolean') return v;
  if (Array.isArray(v)) return v.map(norm);
  if (typeof v === 'string') {
    const s = v.trim();
    if ((s.startsWith('[') && s.endsWith(']')) || (s.startsWith('{') && s.endsWith('}'))) {
      try { return norm(JSON.parse(s)); } catch { /* biarkan string */ }
    }
  }
  return v;
}

function toRow(values) {
  const out = {};
  for (const [k, v] of Object.entries(values)) {
    if (k === 'post_id') continue;
    let val = norm(v);
    if (NUMERIC_COLS.has(k) && val !== undefined) {
      const n = Number(val);
      if (Number.isFinite(n)) val = n;
    }
    out[k] = val;
  }
  return out;
}

async function readTable(client, table) {
  const res = await client.query(`SELECT * FROM ${table} ORDER BY id ASC`);
  return res.rows;
}

async function importDocs(col, rows) {
  if (!rows.length) return 0;
  const m = model(col);
  let inserted = 0;
  const docs = rows.map(toRow);
  for (let i = 0; i < docs.length; i += 200) {
    const chunk = docs.slice(i, i + 200);
    try {
      await m.insertMany(chunk, { ordered: false });
      inserted += chunk.length;
    } catch (e) {
      const dup = String(e.message).split('\n').filter((l) => l.includes('E11000')).length;
      inserted += chunk.length - dup;
    }
  }
  return inserted;
}

async function syncCounters(wanted) {
  const Counter = counterModel();
  for (const [table, col] of Object.entries(COLLECTION_FOR)) {
    if (!wanted.has(table)) continue;
    const max = await model(col).findOne({}).select({ id: 1 }).sort({ id: -1 }).lean().then((d) => (d ? d.id : 0));
    if (max > 0) {
      await Counter.updateOne({ _id: table }, { $max: { lastId: max } }, { upsert: true });
      dim(`  counter '${table}' → ${max}`);
    }
  }
}

async function main() {
  const wanted = new Set(TABLES.filter(isWanted));

  const pg = new Client({ connectionString: SUPABASE_DB_URL, connectionTimeoutMillis: 15000 });
  info('Menghubungi Postgres (Supabase)...');
  try {
    await pg.connect();
  } catch (e) {
    err(`Gagal terhubung ke Supabase (${e.message.split('\n')[0]}).`);
    log('  Kemungkinan project Supabase paused — buka dashboard lalu unpause, atau periksa SUPABASE_DB_URL.');
    process.exit(1);
  }
  ok('Terhubung ke Postgres.');

  info('Menghubungi MongoDB Atlas...');
  await connectMongo();
  ok('Terhubung ke MongoDB (db: bludecor).');

  log(`\nTabel yang diproses: ${[...wanted].join(', ')}`);
  let total = 0;

  // 1) Tabel utama
  for (const table of ['users', 'categories', 'sub_categories', 'themes', 'testimonial_tokens', 'site_settings', 'events']) {
    if (!wanted.has(table)) continue;
    const rows = await readTable(pg, table);
    const inserted = await importDocs(COLLECTION_FOR[table], rows);
    if (inserted) ok(`  ${table}: ${inserted}/${rows.length} diimpor`);
    else dim(`  ${table}: 0 baru (${rows.length} sudah ada)`);
    total += inserted;
  }

  // 2) Posts + relasi (embedded)
  if (wanted.has('posts')) {
    const posts = await readTable(pg, 'posts');
    const imgRows = wanted.has('post_images') ? await readTable(pg, 'post_images') : [];
    const catRows = wanted.has('post_categories') ? await readTable(pg, 'post_categories') : [];
    const subRows = wanted.has('post_sub_categories') ? await readTable(pg, 'post_sub_categories') : [];

    const inserted = await importDocs('cmsposts', posts);
    if (inserted) ok(`  posts: ${inserted}/${posts.length} diimpor`);
    else dim(`  posts: 0 baru (${posts.length} sudah ada)`);
    total += inserted;

    if (imgRows.length) {
      const map = {};
      for (const r of imgRows) (map[r.post_id] ||= []).push({ url_images: r.url_images, urutan: r.urutan ?? 0 });
      for (const [pid, images] of Object.entries(map)) {
        images.sort((a, b) => a.urutan - b.urutan);
        await model('cmsposts').updateOne({ id: Number(pid) }, { $set: { images } });
      }
      ok(`  post_images: ${imgRows.length} baris → embedded di ${Object.keys(map).length} post`);
    }

    for (const [rel, col, field] of [
      ['post_categories', 'category_id', 'category_ids'],
      ['post_sub_categories', 'sub_category_id', 'sub_category_ids'],
    ]) {
      const rows = rel === 'post_categories' ? catRows : subRows;
      if (!rows.length) continue;
      const map = {};
      for (const r of rows) (map[r.post_id] ||= []).push(r[col]);
      for (const [pid, ids] of Object.entries(map)) {
        await model('cmsposts').updateOne({ id: Number(pid) }, { $set: { [field]: ids } });
      }
      ok(`  ${rel}: ${rows.length} baris → embedded (${Object.keys(map).length} post)`);
    }
  }

  // 3) Testimonials
  if (wanted.has('testimonials')) {
    const rows = await readTable(pg, 'testimonials');
    const inserted = await importDocs('cmstestimonials', rows);
    if (inserted) ok(`  testimonials: ${inserted}/${rows.length} diimpor`);
    else dim(`  testimonials: 0 baru (${rows.length} sudah ada)`);
    total += inserted;
  }

  // 4) Sinkronkan counter id
  await syncCounters(wanted);

  log('');
  ok(`Selesai. Total dokumen baru: ${total}.`);
  log('');
  log('  Akun masuk diambil DINAMIS dari MongoDB (bukan hardcoded).');
  log('  - Akun dari Supabase sudah ikut terimpor di atas.');
  log('  - Bila DB masih tanpa user: atur env SEED_ADMIN_PASSWORD lalu `npm run db:seed`.');

  process.exit(0);
}

main().catch((e) => {
  err(`Fatal: ${e.message.split('\n')[0]}`);
  process.exit(1);
});