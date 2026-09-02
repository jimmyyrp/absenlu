# Skema Data Dinamis – Blu Decor Padang v15.0

## 1. Tabel Utama: `posts`
- `id`: SERIAL (PK)
- `title`: String
- `price`: Numeric
- `views`: Integer (v15.0)
- `created_at`: TIMESTAMPTZ

## 2. Tabel Relasi (Many-to-Many)
- `post_categories`: Menghubungkan karya dengan kategori utama.
- `post_sub_categories`: Menghubungkan karya dengan tag/spesialisasi.

## 3. Tabel Konten & Feedback
- `post_images`: Galeri visual (url_images, urutan).
- `testimonials`: Ulasan klien yang divalidasi dengan `testimonial_tokens`.
- `site_settings`: Konfigurasi identitas (WhatsApp, Instagram, Alamat).

## 4. Fungsi RPC Kritis
- `login_user(p_username, p_password)`: Otorisasi portal admin.
- `insert_user(p_username, p_password, p_full_name, p_role)`: Registrasi pengguna baru (password di-hash otomatis oleh trigger).
- `delete_users(p_ids)`: Hapus pengguna berdasarkan array ID.
- `get_posts_complete()`: Ambil data karya lengkap dengan seluruh relasi (Kategori, Sub, Gambar).
- `increment_post_views(target_id)`: Logika penghitung tayangan yang aman.
