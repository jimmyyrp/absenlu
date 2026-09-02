-- SEED DATA BLU DECOR PADANG v3.0

-- Categories
INSERT INTO categories (name) VALUES 
('Pernikahan'), ('Lamaran'), ('Aqiqah'), ('Ulang Tahun'), ('Corporate Event');

-- Sub Categories
INSERT INTO sub_categories (name) VALUES 
('Akad Nikah'), ('Resepsi'), ('Outdoor'), ('Indoor'), ('Rustic'), ('Modern'), ('Minimalist');

-- Themes
INSERT INTO themes (name) VALUES 
('The White Bloom'), ('Gold Elegance'), ('Garden Vibe'), ('Modern Blue'), ('Classic Javanese');

-- Posts
WITH inserted_posts AS (
    INSERT INTO posts (title, price, theme_id) VALUES 
    ('Akad Nikah Modern Putih', 3500000, 1),
    ('Lamaran Intimate Garden', 1500000, 3),
    ('Aqiqah Baby Blue Edition', 2000000, 4)
    RETURNING id, title
)
INSERT INTO post_images (post_id, url_images, urutan)
SELECT id, 'https://picsum.photos/seed/blu'||id||'/800/1000', 0 FROM inserted_posts;

-- Link Many-to-Many
INSERT INTO post_categories (post_id, category_id)
SELECT p.id, c.id FROM posts p, categories c WHERE p.title = 'Akad Nikah Modern Putih' AND c.name = 'Pernikahan';

INSERT INTO post_categories (post_id, category_id)
SELECT p.id, c.id FROM posts p, categories c WHERE p.title = 'Lamaran Intimate Garden' AND c.name = 'Lamaran';

INSERT INTO post_categories (post_id, category_id)
SELECT p.id, c.id FROM posts p, categories c WHERE p.title = 'Aqiqah Baby Blue Edition' AND c.name = 'Aqiqah';
