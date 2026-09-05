/**
 * Seed Database (MongoDB) — jalur lengkap setup awal.
 * ====================================================
 * Menjalankan seluruh migrasi (scripts/migrate.js) lalu, bila collection
 * cmsusers masih kosong, membuat akun admin:
 *   - dari env SEED_ADMIN_* (bila SEED_ADMIN_PASSWORD diatur), ATAU
 *   - lewat prompt interaktif (password tidak terlihat di terminal).
 *
 * TIDAK ada kredensial hardcoded di kode — akun selalu dinamis dari MongoDB.
 * Reference data + indeks ditangani migrasi (satu-satunya sumber: migrasi).
 *
 * CARA PAKAI:
 *   npm run db:migrate                      (hanya migrasi)
 *   npm run db:seed                         (migrasi + akun admin interaktif)
 *   SEED_ADMIN_USERNAME=owner SEED_ADMIN_PASSWORD=... npm run db:seed
 */
const readline = require('readline');
const bcrypt = require('bcryptjs');
const { runMigrations } = require('./migrate');
const { connectMongo, model, nextId, setCounter } = require('./lib/mongo');

const C = { reset: '\x1b[0m', green: '\x1b[32m', yellow: '\x1b[33m', red: '\x1b[31m', cyan: '\x1b[36m', dim: '\x1b[90m' };
const ok = (m) => console.log(`${C.green}✓${C.reset} ${m}`);
const warn = (m) => console.log(`${C.yellow}⚠${C.reset} ${m}`);
const info = (m) => console.log(`${C.cyan}→${C.reset} ${m}`);
const dim = (m) => console.log(`${C.dim}  ${m}${C.reset}`);
const err = (m) => console.log(`${C.red}✗${C.reset} ${m}`);

const VALID_ROLES = ['owner', 'developer', 'admin', 'staff'];

function ask(question, hidden = false) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const original = rl._writeToOutput;
    if (hidden) {
      // Menyembunyikan echo karakter saat mengetik password.
      rl._writeToOutput = (str) => {
        if (str === question) rl.output.write(question);
      };
    }
    rl.question(question, (answer) => {
      if (hidden) {
        rl._writeToOutput = original;
        rl.output.write('\n');
      }
      rl.close();
      resolve((answer || '').trim());
    });
  });
}

async function ensureAdmin() {
  const count = await model('cmsusers').countDocuments();
  if (count > 0) {
    dim(`User sudah ada (${count}) — akun admin tidak dibuat ulang.`);
    return;
  }

  let username = (process.env.SEED_ADMIN_USERNAME || '').trim().toLowerCase();
  const envPassword = (process.env.SEED_ADMIN_PASSWORD || '').trim();
  let fullName = (process.env.SEED_ADMIN_NAME || '').trim();
  let role = (process.env.SEED_ADMIN_ROLE || 'owner').trim();
  if (!VALID_ROLES.includes(role)) role = 'owner';

  if (!username) username = 'admin';
  if (!fullName) fullName = 'Administrator';

  let password = envPassword;
  if (!password) {
    warn('SEED_ADMIN_PASSWORD kosong — password diminta lewat prompt (tidak terlihat).');
    password = await ask('Password akun awal (min. 6 karakter): ', true);
    if (!password || password.length < 6) {
      err('Password minimal 6 karakter. Pembuatan akun dibatalkan.');
      process.exit(1);
    }
  }
  if (!envPassword && !(process.env.SEED_ADMIN_USERNAME || '').trim()) {
    const uname = await ask(`Username (default ${username}): `);
    if (uname) username = uname.trim().toLowerCase();
  }

  await model('cmsusers').create({
    id: await nextId('users'),
    username,
    password: bcrypt.hashSync(password, 10),
    full_name: fullName,
    role,
    deleted_at: null,
    created_at: new Date(),
  });
  await setCounter('users', 1);
  ok(`Akun admin dibuat: ${username} (${role}) — ${fullName}`);
}

async function main() {
  info('Menjalankan migrasi MongoDB...');
  const { applied } = await runMigrations();

  info('Menghubungi MongoDB Atlas untuk akun admin...');
  await connectMongo();
  ok('Terhubung ke MongoDB.');

  await ensureAdmin();

  console.log('');
  ok(`Seed selesai (${applied} migrasi diterapkan).`);
  console.log('');
  console.log('  Semua data situs disimpan di MongoDB dan dibaca dinamis oleh aplikasi.');
  console.log('  Kelola user lanjutan di halaman /admin/users.');

  process.exit(0);
}

main().catch((e) => {
  err(`Fatal: ${e.message.split('\n')[0]}`);
  process.exit(1);
});