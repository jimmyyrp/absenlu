/**
 * Blu Decor Database Migration Runner
 * 
 * Usage:
 *   node scripts/migrate.js              Apply all pending migrations
 *   node scripts/migrate.js --status     Show migration status
 *   node scripts/migrate.js --rollback   Rollback last applied migration
 *   node scripts/migrate.js --fresh      Drop all tables and reapply from scratch
 *   node scripts/migrate.js --force      Re-apply already-applied migrations
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

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

const DB_URL = process.env.SUPABASE_DB_URL;
if (!DB_URL) {
  console.error('ERROR: SUPABASE_DB_URL not found in .env');
  process.exit(1);
}

const MIGRATIONS_DIR = path.join(__dirname, '..', 'migrations');

// Colors
const C = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

function log(msg) { console.log(msg); }
function success(msg) { log(`${C.green}✓${C.reset} ${msg}`); }
function warn(msg) { log(`${C.yellow}⚠${C.reset} ${msg}`); }
function error(msg) { log(`${C.red}✗${C.reset} ${msg}`); }
function info(msg) { log(`${C.cyan}→${C.reset} ${msg}`); }
function dim(msg) { log(`${C.dim}  ${msg}${C.reset}`); }

function getMigrationFiles() {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    fs.mkdirSync(MIGRATIONS_DIR, { recursive: true });
    return [];
  }
  return fs.readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort()
    .map(f => ({
      filename: f,
      version: f.split('_')[0],
      name: f.replace('.sql', ''),
      path: path.join(MIGRATIONS_DIR, f),
    }));
}

async function ensureMigrationsTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      version VARCHAR(20) NOT NULL UNIQUE,
      name TEXT NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      execution_ms INT DEFAULT 0
    );
  `);
}

async function getAppliedMigrations(client) {
  const result = await client.query(
    'SELECT version, name, applied_at, execution_ms FROM schema_migrations ORDER BY version ASC'
  );
  return result.rows;
}

async function applyMigration(client, migration) {
  const sql = fs.readFileSync(migration.path, 'utf-8');
  
  log(`\n${C.bold}Applying:${C.reset} ${C.cyan}${migration.filename}${C.reset}`);
  dim(migration.name.replace(/^\d+_/, '').replace(/_/g, ' '));

  const start = Date.now();
  
  try {
    await client.query('BEGIN');
    await client.query(sql);
    const elapsed = Date.now() - start;
    
    await client.query(
      'INSERT INTO schema_migrations (version, name, execution_ms) VALUES ($1, $2, $3)',
      [migration.version, migration.name, elapsed]
    );
    
    await client.query('COMMIT');
    success(`Applied in ${elapsed}ms`);
    return { success: true, elapsed };
  } catch (err) {
    await client.query('ROLLBACK');
    error(`Failed: ${err.message}`);
    return { success: false, error: err };
  }
}

async function rollbackMigration(client, migration) {
  log(`\n${C.bold}Rolling back:${C.reset} ${C.red}${migration.filename}${C.reset}`);
  
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM schema_migrations WHERE version = $1', [migration.version]);
    await client.query('COMMIT');
    success('Rollback recorded');
    return true;
  } catch (err) {
    await client.query('ROLLBACK');
    error(`Rollback failed: ${err.message}`);
    return false;
  }
}

async function freshReset(client) {
  log(`\n${C.bold}${C.red}FRESH RESET${C.reset} — Dropping all tables...`);
  
  const dropOrder = [
    'testimonials', 'testimonial_tokens', 'post_images',
    'post_sub_categories', 'post_categories', 'posts',
    'themes', 'sub_categories', 'categories', 'users',
    'events', 'site_settings', 'schema_migrations'
  ];
  
  for (const table of dropOrder) {
    await client.query(`DROP TABLE IF EXISTS ${table} CASCADE`);
    dim(`Dropped ${table}`);
  }
  
  // Drop functions
  const funcs = [
    'update_updated_at_column()', 'hash_password_trigger()',
    'handle_testimonial_delete()', 'update_token_usage()',
    'cleanup_deleted_records()', 'insert_user(TEXT, TEXT, TEXT, TEXT)',
    'delete_users(INT[])', 'get_team_members()',
    'login_user(TEXT, TEXT)', 'increment_post_views(INT)',
    'get_posts_complete()', 'get_post_detail(INT)',
    'submit_testimonial_with_token(TEXT, TEXT, TEXT, INT, TEXT)',
    'get_active_events()'
  ];
  for (const fn of funcs) {
    await client.query(`DROP FUNCTION IF EXISTS ${fn} CASCADE`);
  }
  
  // Drop triggers
  const triggers = [
    { name: 'trigger_testimonial_delete', table: 'testimonials' },
    { name: 'trigger_testimonial_usage', table: 'testimonials' },
    { name: 'trigger_hash_password', table: 'users' },
    { name: 'update_posts_updated_at', table: 'posts' },
    { name: 'update_site_settings_updated_at', table: 'site_settings' },
  ];
  for (const t of triggers) {
    await client.query(`DROP TRIGGER IF EXISTS ${t.name} ON ${t.table} CASCADE`);
  }
  
  success('All tables and functions dropped');
}

// ─── MAIN ──────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const isStatus = args.includes('--status');
  const isRollback = args.includes('--rollback');
  const isFresh = args.includes('--fresh');
  const isForce = args.includes('--force');

  const client = new Client({ connectionString: DB_URL });

  try {
    await client.connect();
    await ensureMigrationsTable(client);
    
    const migrations = getMigrationFiles();
    const applied = await getAppliedMigrations(client);
    const appliedVersions = new Set(applied.map(m => m.version));

    // ── STATUS ──
    if (isStatus) {
      log(`\n${C.bold}Migration Status${C.reset}`);
      log(`${C.dim}${'─'.repeat(60)}${C.reset}`);
      
      if (migrations.length === 0) {
        warn('No migration files found in migrations/');
        return;
      }
      
      for (const m of migrations) {
        const isApplied = appliedVersions.has(m.version);
        const status = isApplied ? `${C.green}✓ APPLIED${C.reset}` : `${C.yellow}○ PENDING${C.reset}`;
        const ap = applied.find(a => a.version === m.version);
        const time = ap ? `${C.dim}${ap.applied_at.toISOString()} (${ap.execution_ms}ms)${C.reset}` : '';
        log(`  ${status}  ${m.filename}  ${time}`);
      }
      
      const pending = migrations.filter(m => !appliedVersions.has(m.version)).length;
      log(`\n${C.bold}Total:${C.reset} ${migrations.length} migrations, ${C.green}${applied.length} applied${C.reset}, ${C.yellow}${pending} pending${C.reset}\n`);
      return;
    }

    // ── FRESH ──
    if (isFresh) {
      await freshReset(client);
      // Re-run all from scratch
      log(`\n${C.bold}Re-applying all migrations...${C.reset}`);
      let successCount = 0;
      for (const m of migrations) {
        const result = await applyMigration(client, m);
        if (result.success) successCount++;
        else break;
      }
      log(`\n${C.bold}${C.green}Fresh migration complete: ${successCount}/${migrations.length} applied${C.reset}\n`);
      return;
    }

    // ── ROLLBACK ──
    if (isRollback) {
      if (applied.length === 0) {
        warn('No migrations to rollback');
        return;
      }
      const lastApplied = applied[applied.length - 1];
      const migrationFile = migrations.find(m => m.version === lastApplied.version);
      if (!migrationFile) {
        warn(`Migration file ${lastApplied.version} not found on disk — marking as rolled back only`);
        await rollbackMigration(client, lastApplied);
        return;
      }
      await rollbackMigration(client, migrationFile);
      log(`\n${C.bold}Note:${C.reset} Rollback only removes the tracking record.\n  The schema changes from ${migrationFile.filename} are NOT automatically reversed.\n  Manual cleanup may be needed.\n`);
      return;
    }

    // ── APPLY (default) ──
    const pending = migrations.filter(m => !appliedVersions.has(m.version) || isForce);
    
    if (pending.length === 0) {
      success('All migrations are up to date!');
      return;
    }

    log(`\n${C.bold}Blu Decor — Database Migration${C.reset}`);
    log(`${C.dim}${'─'.repeat(40)}${C.reset}`);
    info(`Found ${pending.length} migration(s) to apply\n`);

    let successCount = 0;
    for (const m of pending) {
      const result = await applyMigration(client, m);
      if (result.success) successCount++;
      else {
        error('Migration halted. Fix the error and re-run.');
        break;
      }
    }

    log(`\n${C.dim}${'─'.repeat(40)}${C.reset}`);
    if (successCount === pending.length) {
      success(`${C.bold}All ${successCount} migration(s) applied successfully!${C.reset}\n`);
    } else {
      warn(`${successCount}/${pending.length} migrations applied\n`);
    }

  } catch (err) {
    if (err.message && (err.message.includes('ENOTFOUND') || err.message.includes('ECONNREFUSED') || err.message.includes('timeout'))) {
      error(`Direct DB connection failed: ${err.message}`);
      log(`\n${C.bold}Database tidak bisa diakses langsung.${C.reset}`);
      dim('Kemungkinan project Supabase paused atau jaringan tidak stabil.');
      log('');
      dim('Solusi 1: Buka Supabase Dashboard → unpause project');
      dim('Solusi 2: Pakai API mode:');
      log(`  ${C.cyan}npm run db:migrate:api${C.reset}`);
      log('');
    } else {
      error(`Fatal: ${err.message}`);
    }
    process.exit(1);
  } finally {
    await client.end().catch(() => {});
  }
}

main();
