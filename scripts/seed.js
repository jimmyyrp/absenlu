/**
 * Seed Database (MongoDB) — data referensi + bootstrap akun admin.
 * ===============================================================
 * - Mengisi data referensi (kategori, sub-kategori, theme, pengaturan) hanya
 *   bila collection bersangkutan masih kosong. Idempotent.
 * - Membuat akun admin/owner dari env (SEED_ADMIN_*) ATAU prompt interaktif.
 *   TIDAK ada kredensial hardcoded di dalam kode.
 *
 * CARA PAKAI:
 *   npm run db:seed                          (minta password via prompt)
 *   SEED_ADMIN_USERNAME=owner SEED_ADMIN_PASSWORD=... npm run db:seed
 *   SEED_ADMIN_USERNAME=owner SEED_ADMIN_PASSWORD=... SEED_ADMIN_NAME="... " npm run db:seed
 */
const readline = require('readline');
const bcrypt = require('bcryptjs');
const { connectMongo, model, nextId, setCounter } = require('./lib/mongo');
const seedData = require('../../src/lib/cms/seed-data.json');

const C = { reset: '\x1b[0m', green: '\x1b[32m', yellow: '\x1b[33m', red: '\x1b[31m', cyan: '\x1b[36m', dim: '\x1b[90m' };
const ok = (m) => console.log(`${C.green}✓${C.reset} ${m}`);
const warn = (m) => console.log(`${C.yellow}⚠${C.reset} ${m}`);
const info = (m) => console.log(`${C.cyan}→${C.reset} ${m}`);
const dim = (m) => console.log(`${C.dim}  ${m}${C.reset}`);

function ask(question, hidden = false) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, (answer) => {
      rl.close();
      resolve((answer || '').trim());
    });
  });
}

async function seedReference() {
  const catCount = await model('cmscategories').countDocuments();
  if (catCount === 0) {
    const byName = {};
    for (const c of seedData.categories) {
      const id = await nextId('categories');
      byName[c.name] = id;
      await model('cmscategories').create({ id, name: c.name });
    }
    for (const sc of seedData.sub_categories) {
      const categoryId = byName[sc.category];
      if (!categoryId) continue;
      await model('cmssubcategories').create({ id: await nextId('sub_categories'), name: sc.name, category_id: categoryId, price: sc.price });
    }
    await setCounter('categories', seedData.categories.length);
    await setCounter('sub_categories', seedData.sub_categories.length);
    ok(`Kategori: ${seedData.categories.length}, Sub-kategori: ${seedData.sub_categories.length}`);
  } else {
    dim('Kategori sudah ada — dilewati.');
  }

  if ((await model('cmssubcategories').countDocuments()) === 0 && catCount > 0) {
    const cats = await model('cmscategories').find({}).lean();
    const byName = {};
    for (const c of cats) byName[c.name] = c.id;
    for (const sc of seedData.sub_categories) {
      const categoryId = byName[sc.category];
      if (!categoryId) continue;
      await model('cmssubcategories').create({ id: await nextId('sub_categories'), name: sc.name, category_id: categoryId, price: sc.price });
    }
    await setCounter('sub_categories', seedData.sub_categories.length);
    ok(`Sub-kategori: ${seedData.sub_categories.length}`);
  }

  if ((await model('cmsthemes').countDocuments()) === 0) {
    for (const t of seedData.themes) {
      await model('cmsthemes').create({ id: await nextId('themes'), name: t.name });
    }
    await setCounter('themes', seedData.themes.length);
    ok(`Theme: ${seedData.themes.length}`);
  }

  if ((await model('cmssitesettings').countDocuments()) === 0) {
    for (const s of seedData.site_settings) {
      await model('cmssitesettings').create({ id: await nextId('site_settings'), key: s.key, value: s.value });
    }
    await setCounter('site_settings', seedData.site_settings.length);
    ok(`Pengaturan situs: ${seedData.site_settings.length}`);
  }
}

async function seedAdmin() {
  const existing = await model('cmsusers').countDocuments();
  if (existing > 0) {
    dim(`User sudah ada (${existing}) — akun admin tidak dibuat ulang.`);
    return;
  }

  let username = (process.env.SEED_ADMIN_USERNAME || '').trim().toLowerCase();
  let password = (process.env.SEED_ADMIN_PASSWORD || '').trim();
  let fullName = (process.env.SEED_ADMIN_NAME || '').trim();
  let role = (process.env.SEED_ADMIN_ROLE || 'owner').trim();

  if (!username) username = 'admin';
  if (!fullName) fullName = 'Administrator';
  if (!['owner', 'developer', 'admin', 'staff'].includes(role)) role = 'owner';

  if (!password) {
    warn('SEED_ADMIN_PASSWORD kosong — password diminta lewat input (tidak terlihat).');
    password = await ask('Password akun awal: ', true);
    if (!password || password.length < 6) {
      console.error('✗ Password minimal 6 karakter. Pembuatan akun dibatalkan.');
      process.exit(1);
    }
    if (username === 'admin') {
      const uname = await ask('Username (default admin): ');
      if (uname) username = uname.trim().toLowerCase();
    }
  }

  await model('cmsusers').create({
    id: await nextId('users'),
    username,
    password: bcrypt.hashSync(password, 10),
    full_name: fullName,
    role,
  });
  await setCounter('users', 1);
  ok(`Akun dibuat: ${username} (${role}) — ${fullName}`);
}

async function main() {
  info('Menghubungi MongoDB Atlas...');
  await connectMongo();
  ok('Terhubung ke MongoDB (db: bludecor).');

  await seedReference();
  await seedAdmin();

  console.log('');
  ok('Seed selesai.');
  console.log('');
  console.log('  Semua data situs disimpan di MongoDB dan dibaca dinamis oleh aplikasi.');
  console.log('  Kelola user lanjutan di halaman /admin/users.');

  process.exit(0);
}

main().catch((e) => {
  console.error(`✗ Fatal: ${e.message.split('\n')[0]}`);
  process.exit(1);
});