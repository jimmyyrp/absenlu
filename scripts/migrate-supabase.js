/**
 * Blu Decor Database Migration Runner (Supabase REST API mode)
 *
 * Uses the Supabase JS client to execute SQL via an RPC function.
 * Requires a one-time setup: run `migrations/999_exec_sql_setup.sql` in Supabase Dashboard SQL Editor.
 *
 * Usage:
 *   node scripts/migrate-supabase.js              Apply all pending migrations
 *   node scripts/migrate-supabase.js --status     Show migration status
 *   node scripts/migrate-supabase.js --fresh      Drop all and reapply
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load env from .env file
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) return;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  });
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('ERROR: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not found in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
const MIGRATIONS_DIR = path.join(__dirname, '..', 'migrations');

const C = {
  reset: '\x1b[0m', bold: '\x1b[1m', dim: '\x1b[2m',
  red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m', cyan: '\x1b[36m',
};

function log(msg) { console.log(msg); }
function success(msg) { log(`${C.green}✓${C.reset} ${msg}`); }
function warn(msg) { log(`${C.yellow}⚠${C.reset} ${msg}`); }
function error(msg) { log(`${C.red}✗${C.reset} ${msg}`); }
function info(msg) { log(`${C.cyan}→${C.reset} ${msg}`); }
function dim(msg) { log(`${C.dim}  ${msg}${C.reset}`); }

async function execSQL(sql) {
  const { data, error: rpcErr } = await supabase.rpc('exec_sql', { query: sql });
  if (rpcErr) throw new Error(rpcErr.message);
  return data;
}

async function execSQLRaw(sql) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
    },
    body: JSON.stringify({ query: sql }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.message || body.error || `HTTP ${res.status}`);
  return body;
}

function getMigrationFiles() {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    fs.mkdirSync(MIGRATIONS_DIR, { recursive: true });
    return [];
  }
  return fs.readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql') && !f.startsWith('999'))
    .sort()
    .map(f => ({
      filename: f,
      version: f.split('_')[0],
      name: f.replace('.sql', ''),
      path: path.join(MIGRATIONS_DIR, f),
    }));
}

async function main() {
  const args = process.argv.slice(2);
  const isStatus = args.includes('--status');
  const isFresh = args.includes('--fresh');

  log(`\n${C.bold}Blu Decor — Database Migration (Supabase API)${C.reset}`);
  log(`${C.dim}${'─'.repeat(50)}${C.reset}\n`);

  const migrations = getMigrationFiles();
  if (migrations.length === 0) {
    warn('No migration files found in migrations/');
    return;
  }

  // Test exec_sql function exists
  info('Testing exec_sql RPC function...');
  try {
    await execSQL('SELECT 1 as test');
    success('exec_sql function found\n');
  } catch (e) {
    error('exec_sql function NOT found!');
    log(`\n${C.bold}Setup required:${C.reset}`);
    log('1. Buka Supabase Dashboard → SQL Editor');
    log('2. Paste isi file: migrations/999_exec_sql_setup.sql');
    log('3. Klik "Run"');
    log('4. Jalankan ulang: npm run db:migrate:api\n');
    process.exit(1);
  }

  // Get applied migrations
  let applied = [];
  try {
    const rows = await execSQL(
      'SELECT version, name, applied_at::text, execution_ms FROM schema_migrations ORDER BY version ASC'
    );
    applied = rows || [];
  } catch (e) {
    warn(`Could not read migration status: ${e.message}`);
  }

  const appliedVersions = new Set(applied.map(m => m.version));

  // ── STATUS ──
  if (isStatus) {
    for (const m of migrations) {
      const isApplied = appliedVersions.has(m.version);
      const status = isApplied ? `${C.green}✓ APPLIED${C.reset}` : `${C.yellow}○ PENDING${C.reset}`;
      const ap = applied.find(a => a.version === m.version);
      const time = ap ? `${C.dim}${ap.applied_at} (${ap.execution_ms}ms)${C.reset}` : '';
      log(`  ${status}  ${m.filename}  ${time}`);
    }
    const pending = migrations.filter(m => !appliedVersions.has(m.version)).length;
    log(`\n${C.bold}Total:${C.reset} ${migrations.length} migrations, ${C.green}${applied.length} applied${C.reset}, ${C.yellow}${pending} pending${C.reset}\n`);
    return;
  }

  // ── FRESH ──
  if (isFresh) {
    log(`\n${C.bold}${C.red}FRESH RESET${C.reset} — Dropping all tables...\n`);
    const dropSQL = `
      DROP TABLE IF EXISTS testimonials CASCADE;
      DROP TABLE IF EXISTS testimonial_tokens CASCADE;
      DROP TABLE IF EXISTS post_images CASCADE;
      DROP TABLE IF EXISTS post_sub_categories CASCADE;
      DROP TABLE IF EXISTS post_categories CASCADE;
      DROP TABLE IF EXISTS posts CASCADE;
      DROP TABLE IF EXISTS themes CASCADE;
      DROP TABLE IF EXISTS sub_categories CASCADE;
      DROP TABLE IF EXISTS categories CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
      DROP TABLE IF EXISTS events CASCADE;
      DROP TABLE IF EXISTS site_settings CASCADE;
      DROP TABLE IF EXISTS schema_migrations CASCADE;
      DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
      DROP FUNCTION IF EXISTS hash_password_trigger() CASCADE;
      DROP FUNCTION IF EXISTS handle_testimonial_delete() CASCADE;
      DROP FUNCTION IF EXISTS update_token_usage() CASCADE;
      DROP FUNCTION IF EXISTS cleanup_deleted_records() CASCADE;
      DROP FUNCTION IF EXISTS insert_user(TEXT, TEXT, TEXT, TEXT) CASCADE;
      DROP FUNCTION IF EXISTS delete_users(INT[]) CASCADE;
      DROP FUNCTION IF EXISTS get_team_members() CASCADE;
      DROP FUNCTION IF EXISTS login_user(TEXT, TEXT) CASCADE;
      DROP FUNCTION IF EXISTS increment_post_views(INT) CASCADE;
      DROP FUNCTION IF EXISTS get_posts_complete() CASCADE;
      DROP FUNCTION IF EXISTS get_post_detail(INT) CASCADE;
      DROP FUNCTION IF EXISTS submit_testimonial_with_token(TEXT, TEXT, TEXT, INT, TEXT) CASCADE;
      DROP FUNCTION IF EXISTS get_active_events() CASCADE;
      DROP FUNCTION IF EXISTS exec_sql(TEXT) CASCADE;
    `;
    try {
      await execSQL(dropSQL);
      success('All tables dropped');
    } catch (e) {
      warn(`Some drops may have failed (OK): ${e.message}`);
    }
  }

  // ── APPLY ──
  const pending = migrations.filter(m => !appliedVersions.has(m.version));
  if (pending.length === 0) {
    success('All migrations are up to date!');
    return;
  }

  info(`Found ${pending.length} migration(s) to apply\n`);

  let successCount = 0;
  for (const m of pending) {
    const sql = fs.readFileSync(m.path, 'utf-8');
    log(`${C.bold}Applying:${C.reset} ${C.cyan}${m.filename}${C.reset}`);
    dim(m.name.replace(/^\d+_/, '').replace(/_/g, ' '));

    try {
      const start = Date.now();
      await execSQL(sql);
      const elapsed = Date.now() - start;

      // Record migration
      await execSQL(
        `INSERT INTO schema_migrations (version, name, execution_ms) VALUES ('${m.version}', '${m.name}', ${elapsed})`
      );

      success(`Applied in ${elapsed}ms`);
      successCount++;
    } catch (err) {
      error(`Failed: ${err.message}`);
      break;
    }
  }

  log(`\n${C.dim}${'─'.repeat(50)}${C.reset}`);
  if (successCount === pending.length) {
    success(`${C.bold}All ${successCount} migration(s) applied successfully!${C.reset}\n`);
  } else {
    warn(`${successCount}/${pending.length} migrations applied\n`);
  }
}

main().catch(err => {
  error(`Fatal: ${err.message}`);
  process.exit(1);
});
