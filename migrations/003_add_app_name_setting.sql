-- Migration: 003_add_app_name_setting
-- Description: Add app_name to site_settings for dynamic branding
-- Created: 2026-08-30

-- Add app_name setting (default: BluDecor Padang)
INSERT INTO site_settings (key, value) VALUES
('app_name', 'BluDecor'),
('app_tagline', 'Arsitek Event Premium')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
