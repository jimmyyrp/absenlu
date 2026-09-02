-- Migration: 000_bootstrap
-- Description: Create schema_migrations tracking table
-- Created: 2026-08-25

CREATE TABLE IF NOT EXISTS schema_migrations (
    id SERIAL PRIMARY KEY,
    version VARCHAR(20) NOT NULL UNIQUE,
    name TEXT NOT NULL,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    execution_ms INT DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_schema_migrations_version ON schema_migrations(version);
