-- Migration: 002_seed_data
-- Description: Insert default users, settings, and categories
-- Created: 2026-08-25

-- Default users (passwords auto-hashed by trigger)
INSERT INTO users (username, password, full_name, role) VALUES
('dev', 'dev123', 'System Developer', 'developer'),
('admin', 'blu123', 'Administrator Utama', 'admin'),
('staff', 'staff123', 'Content Staff', 'staff')
ON CONFLICT (username) DO NOTHING;

-- Site settings
INSERT INTO site_settings (key, value) VALUES
('phone', '081266465639'),
('whatsapp', 'https://wa.me/628126645639'),
('instagram', 'https://instagram.com/bludecor.id'),
('tiktok', 'https://www.tiktok.com/@bludecor.id'),
('address', 'Kota Padang, Sumatera Barat'),
('message', 'Halo BluDecor, saya ingin konsultasi mengenai rencana event saya...')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Default categories
INSERT INTO categories (name) VALUES
('Lamaran'),
('Ulang Tahun'),
('Aqiqah'),
('Grand Opening')
ON CONFLICT (name) DO NOTHING;

-- Sequence sync
SELECT setval(pg_get_serial_sequence('users', 'id'), COALESCE(MAX(id), 1)) FROM users;
SELECT setval(pg_get_serial_sequence('categories', 'id'), COALESCE(MAX(id), 1)) FROM categories;
SELECT setval(pg_get_serial_sequence('sub_categories', 'id'), COALESCE(MAX(id), 1)) FROM sub_categories;
SELECT setval(pg_get_serial_sequence('themes', 'id'), COALESCE(MAX(id), 1)) FROM themes;
SELECT setval(pg_get_serial_sequence('posts', 'id'), COALESCE(MAX(id), 1)) FROM posts;
SELECT setval(pg_get_serial_sequence('post_images', 'id'), COALESCE(MAX(id), 1)) FROM post_images;
SELECT setval(pg_get_serial_sequence('testimonials', 'id'), COALESCE(MAX(id), 1)) FROM testimonials;
SELECT setval(pg_get_serial_sequence('testimonial_tokens', 'id'), COALESCE(MAX(id), 1)) FROM testimonial_tokens;
SELECT setval(pg_get_serial_sequence('site_settings', 'id'), COALESCE(MAX(id), 1)) FROM site_settings;
