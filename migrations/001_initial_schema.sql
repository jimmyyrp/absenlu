-- Migration: 001_initial_schema
-- Description: Create all tables, indexes, triggers, functions, RPC, and RLS
-- Created: 2026-08-25
-- Based on: docs/setup.sql v17.0

-- Extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================================
-- TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password TEXT NOT NULL,
    full_name VARCHAR(150),
    role VARCHAR(20) CHECK (role IN ('developer', 'admin', 'staff')) DEFAULT 'staff',
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL UNIQUE,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sub_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    category_id INT REFERENCES categories(id) ON DELETE CASCADE,
    price NUMERIC(15,2) DEFAULT 0 CHECK (price >= 0),
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(name, category_id)
);

CREATE TABLE IF NOT EXISTS themes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL UNIQUE,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS testimonial_tokens (
    id SERIAL PRIMARY KEY,
    token TEXT NOT NULL UNIQUE,
    usage_limit INT DEFAULT 1,
    usage_count INT DEFAULT 0,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS site_settings (
    id SERIAL PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS posts (
    id SERIAL PRIMARY KEY,
    theme_id INT REFERENCES themes(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    price NUMERIC(15,2) DEFAULT 0 CHECK (price >= 0),
    views INT DEFAULT 0 CHECK (views >= 0),
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS post_categories (
    post_id INT REFERENCES posts(id) ON DELETE CASCADE,
    category_id INT REFERENCES categories(id) ON DELETE CASCADE,
    PRIMARY KEY (post_id, category_id)
);

CREATE TABLE IF NOT EXISTS post_sub_categories (
    post_id INT REFERENCES posts(id) ON DELETE CASCADE,
    sub_category_id INT REFERENCES sub_categories(id) ON DELETE CASCADE,
    PRIMARY KEY (post_id, sub_category_id)
);

CREATE TABLE IF NOT EXISTS post_images (
    id SERIAL PRIMARY KEY,
    post_id INT REFERENCES posts(id) ON DELETE CASCADE,
    url_images TEXT NOT NULL,
    urutan INT DEFAULT 0,
    deleted_at TIMESTAMPTZ DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS testimonials (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(100) DEFAULT 'Klien Blu Decor',
    text TEXT NOT NULL,
    rating INT CHECK(rating BETWEEN 1 AND 5),
    token_used TEXT REFERENCES testimonial_tokens(token) ON DELETE SET NULL,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Events table for seasonal/event-based content recommendations
CREATE TABLE IF NOT EXISTS events (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(200) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(50) DEFAULT '🎉',
    color VARCHAR(20) DEFAULT '#D4AF37',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    boost_category_ids INT[] DEFAULT '{}',
    boost_sub_category_ids INT[] DEFAULT '{}',
    priority INT DEFAULT 1 CHECK (priority BETWEEN 1 AND 10),
    banner_text TEXT,
    banner_bg_color VARCHAR(20) DEFAULT '#D4AF37',
    banner_text_color VARCHAR(20) DEFAULT '#1a1a2e',
    is_active BOOLEAN DEFAULT true,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_users_active ON users(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_sub_categories_category ON sub_categories(category_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_themes_name ON themes(name) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_posts_active ON posts(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_posts_theme ON posts(theme_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_posts_views ON posts(views DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_post_images_post ON post_images(post_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_testimonial_tokens_lookup ON testimonial_tokens(token) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_testimonials_active ON testimonials(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_events_active ON events(is_active, start_date, end_date) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_events_dates ON events(start_date, end_date) WHERE deleted_at IS NULL AND is_active = true;

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_posts_updated_at ON posts;
CREATE TRIGGER update_posts_updated_at
    BEFORE UPDATE ON posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_site_settings_updated_at ON site_settings;
CREATE TRIGGER update_site_settings_updated_at
    BEFORE UPDATE ON site_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-hash passwords with BCrypt
CREATE OR REPLACE FUNCTION hash_password_trigger()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') OR (TG_OP = 'UPDATE' AND NEW.password <> OLD.password) THEN
        IF NEW.password NOT LIKE '$2%' THEN
            NEW.password = crypt(NEW.password, gen_salt('bf'));
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_hash_password ON users;
CREATE TRIGGER trigger_hash_password
    BEFORE INSERT OR UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION hash_password_trigger();

-- Testimonial token usage tracking
CREATE OR REPLACE FUNCTION update_token_usage()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.token_used IS NOT NULL THEN
        UPDATE testimonial_tokens
        SET usage_count = usage_count + 1
        WHERE token = NEW.token_used;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_testimonial_usage ON testimonials;
CREATE TRIGGER trigger_testimonial_usage
    AFTER INSERT ON testimonials
    FOR EACH ROW EXECUTE FUNCTION update_token_usage();

-- Testimonial delete -> restore token quota
CREATE OR REPLACE FUNCTION handle_testimonial_delete()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'DELETE' AND OLD.token_used IS NOT NULL) OR
       (TG_OP = 'UPDATE' AND NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL AND OLD.token_used IS NOT NULL) THEN
        UPDATE testimonial_tokens
        SET usage_count = GREATEST(0, usage_count - 1)
        WHERE token = OLD.token_used;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_testimonial_delete ON testimonials;
CREATE TRIGGER trigger_testimonial_delete
    AFTER DELETE OR UPDATE OF deleted_at ON testimonials
    FOR EACH ROW EXECUTE FUNCTION handle_testimonial_delete();

-- ============================================================================
-- RPC FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION insert_user(
    p_username TEXT,
    p_password TEXT,
    p_full_name TEXT,
    p_role TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
    INSERT INTO users (username, password, full_name, role)
    VALUES (
        LOWER(TRIM(p_username)),
        p_password,
        TRIM(p_full_name),
        COALESCE(p_role, 'staff')
    );
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION delete_users(p_ids INT[])
RETURNS VOID AS $$
BEGIN
    DELETE FROM users WHERE id = ANY(p_ids);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_team_members()
RETURNS TABLE (
    id INT,
    username VARCHAR,
    full_name VARCHAR,
    role VARCHAR,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT u.id, u.username, u.full_name, u.role, u.created_at
    FROM users u
    WHERE u.deleted_at IS NULL
    ORDER BY u.id ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION login_user(p_username TEXT, p_password TEXT)
RETURNS TABLE (id INT, username VARCHAR, full_name VARCHAR, role VARCHAR) AS $$
BEGIN
    RETURN QUERY
    SELECT u.id, u.username, u.full_name, u.role
    FROM users u
    WHERE LOWER(u.username) = LOWER(TRIM(p_username))
    AND u.password = crypt(p_password, u.password)
    AND u.deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_post_views(target_id INT)
RETURNS VOID AS $$
BEGIN
    UPDATE posts
    SET views = views + 1
    WHERE id = target_id AND deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_posts_complete()
RETURNS TABLE (
    id INT, title VARCHAR, price NUMERIC, views INT, theme_id INT, theme_name VARCHAR,
    categories JSON, sub_categories JSON, images JSON,
    created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id, p.title, p.price, p.views, p.theme_id,
        t.name AS theme_name,
        COALESCE((
            SELECT json_agg(json_build_object('id', c.id, 'name', c.name))
            FROM post_categories pc
            JOIN categories c ON c.id = pc.category_id
            WHERE pc.post_id = p.id AND c.deleted_at IS NULL
        ), '[]'::json) AS categories,
        COALESCE((
            SELECT json_agg(json_build_object('id', sc.id, 'name', sc.name, 'price', sc.price))
            FROM post_sub_categories psc
            JOIN sub_categories sc ON sc.id = psc.sub_category_id
            WHERE psc.post_id = p.id AND sc.deleted_at IS NULL
        ), '[]'::json) AS sub_categories,
        COALESCE((
            SELECT json_agg(json_build_object('id', pi.id, 'url_images', pi.url_images, 'urutan', pi.urutan) ORDER BY pi.urutan ASC)
            FROM post_images pi
            WHERE pi.post_id = p.id AND pi.deleted_at IS NULL
        ), '[]'::json) AS images,
        p.created_at, p.updated_at
    FROM posts p
    LEFT JOIN themes t ON t.id = p.theme_id AND t.deleted_at IS NULL
    WHERE p.deleted_at IS NULL
    ORDER BY p.id DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_post_detail(target_post_id INT)
RETURNS TABLE (
    id INT, title VARCHAR, price NUMERIC, views INT, theme_id INT, theme_name VARCHAR,
    categories JSON, sub_categories JSON, images JSON,
    created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id, p.title, p.price, p.views, p.theme_id,
        t.name AS theme_name,
        COALESCE((
            SELECT json_agg(json_build_object('id', c.id, 'name', c.name))
            FROM post_categories pc
            JOIN categories c ON c.id = pc.category_id
            WHERE pc.post_id = p.id AND c.deleted_at IS NULL
        ), '[]'::json) AS categories,
        COALESCE((
            SELECT json_agg(json_build_object('id', sc.id, 'name', sc.name, 'price', sc.price))
            FROM post_sub_categories psc
            JOIN sub_categories sc ON sc.id = psc.sub_category_id
            WHERE psc.post_id = p.id AND sc.deleted_at IS NULL
        ), '[]'::json) AS sub_categories,
        COALESCE((
            SELECT json_agg(json_build_object('id', pi.id, 'url_images', pi.url_images, 'urutan', pi.urutan) ORDER BY pi.urutan ASC)
            FROM post_images pi
            WHERE pi.post_id = p.id AND pi.deleted_at IS NULL
        ), '[]'::json) AS images,
        p.created_at, p.updated_at
    FROM posts p
    LEFT JOIN themes t ON t.id = p.theme_id AND t.deleted_at IS NULL
    WHERE p.id = target_post_id AND p.deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION submit_testimonial_with_token(
    p_name TEXT,
    p_role TEXT,
    p_text TEXT,
    p_rating INT,
    p_token TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_limit INT;
    v_count INT;
BEGIN
    SELECT usage_limit, usage_count INTO v_limit, v_count
    FROM testimonial_tokens
    WHERE token = p_token AND deleted_at IS NULL
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Token testimoni tidak ditemukan atau tidak valid.';
    END IF;

    IF v_count >= v_limit THEN
        RAISE EXCEPTION 'Batas kuota penggunaan token ini telah habis.';
    END IF;

    INSERT INTO testimonials (name, role, text, rating, token_used)
    VALUES (p_name, COALESCE(p_role, 'Klien Blu Decor'), p_text, p_rating, p_token);

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION cleanup_deleted_records()
RETURNS VOID AS $$
BEGIN
    DELETE FROM events WHERE deleted_at < NOW() - INTERVAL '7 days';
    DELETE FROM posts WHERE deleted_at < NOW() - INTERVAL '7 days';
    DELETE FROM post_images WHERE deleted_at < NOW() - INTERVAL '7 days';
    DELETE FROM categories WHERE deleted_at < NOW() - INTERVAL '7 days';
    DELETE FROM sub_categories WHERE deleted_at < NOW() - INTERVAL '7 days';
    DELETE FROM themes WHERE deleted_at < NOW() - INTERVAL '7 days';
    DELETE FROM testimonials WHERE deleted_at < NOW() - INTERVAL '7 days';
    DELETE FROM testimonial_tokens WHERE deleted_at < NOW() - INTERVAL '7 days';
    DELETE FROM users WHERE deleted_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get currently active events
CREATE OR REPLACE FUNCTION get_active_events()
RETURNS TABLE (
    id INT,
    name VARCHAR,
    slug VARCHAR,
    description TEXT,
    icon VARCHAR,
    color VARCHAR,
    start_date DATE,
    end_date DATE,
    boost_category_ids INT[],
    boost_sub_category_ids INT[],
    priority INT,
    banner_text TEXT,
    banner_bg_color VARCHAR,
    banner_text_color VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        e.id, e.name, e.slug, e.description, e.icon, e.color,
        e.start_date, e.end_date,
        e.boost_category_ids, e.boost_sub_category_ids,
        e.priority, e.banner_text, e.banner_bg_color, e.banner_text_color
    FROM events e
    WHERE e.is_active = true
      AND e.deleted_at IS NULL
      AND CURRENT_DATE BETWEEN e.start_date AND e.end_date
    ORDER BY e.priority DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE sub_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_sub_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonial_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts on re-run
DROP POLICY IF EXISTS "Strict Secure Users" ON users;
DROP POLICY IF EXISTS "Public All Categories" ON categories;
DROP POLICY IF EXISTS "Public All Sub Categories" ON sub_categories;
DROP POLICY IF EXISTS "Public All Themes" ON themes;
DROP POLICY IF EXISTS "Public All Posts" ON posts;
DROP POLICY IF EXISTS "Public All Post Categories" ON post_categories;
DROP POLICY IF EXISTS "Public All Post Sub Categories" ON post_sub_categories;
DROP POLICY IF EXISTS "Public All Post Images" ON post_images;
DROP POLICY IF EXISTS "Public All Testimonials" ON testimonials;
DROP POLICY IF EXISTS "Public All Testimonial Tokens" ON testimonial_tokens;
DROP POLICY IF EXISTS "Public All Site Settings" ON site_settings;
DROP POLICY IF EXISTS "Public All Events" ON events;

-- Users: Restricted access (managed via RPC functions only)
CREATE POLICY "Strict Secure Users" ON users FOR ALL USING (false);

-- All other tables: Public read/write
CREATE POLICY "Public All Categories" ON categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public All Sub Categories" ON sub_categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public All Themes" ON themes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public All Posts" ON posts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public All Post Categories" ON post_categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public All Post Sub Categories" ON post_sub_categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public All Post Images" ON post_images FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public All Testimonials" ON testimonials FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public All Testimonial Tokens" ON testimonial_tokens FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public All Site Settings" ON site_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public All Events" ON events FOR ALL USING (true) WITH CHECK (true);

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;
