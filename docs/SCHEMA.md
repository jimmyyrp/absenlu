# Skema Data – Blu Decor Padang v16.5 (MongoDB)

Semua data tersimpan di **MongoDB Atlas** (database `bludecor`). "Tabel"
Supabase/Postgres lama dipetakan ke koleksi di bawah ini; skema dokumen
ditentukan oleh model Mongoose di `src/lib/cms/models.ts` dan
`src/lib/ops/ops-state-model.ts`. Struktur/indeks dibuat lewat migrasi
(`npm run db:migrate`), bukan SQL.

## 1. `cmsusers` — Akun (Admin & OPS)
- `id` (Number, unik), `username` (unik, lowercase), `password` (bcrypt),
  `full_name`, `role` (`owner` | `developer` | `admin` | `staff`),
  `created_at`, `deleted_at`.
- Satu-satunya sumber otentikasi: portal `/admin` (RPC `login_user`) dan
  `/login` OPS (`POST /api/ops/login`). Kelola di `/admin/users`.

## 2. `cmscategories` / `cmssubcategories` / `cmsthemes` — Katalog
- `cmscategories`: `id`, `name`.
- `cmssubcategories`: `id`, `name`, `category_id` (Number), `price`.
- `cmsthemes`: `id`, `name`.
- Data awal dibuat migrasi 002 dari `src/lib/cms/seed-data.json`.

## 3. `cmsposts` — Karya (relasi Many-to-Many inline)
- `id`, `title`, `price`, `views`, `theme_id`, `category_ids: [Number]`,
  `sub_category_ids: [Number]`, `images: [{ url_images, urutan }]`,
  `created_at`, `deleted_at`.
- Relasi kategori/sub/theme tidak berupa tabel join (seperti `post_categories`
  lama di Postgres) — disimpan langsung sebagai array id di dokumen.

## 4. `cmsevents` — Event abadi
- `id`, `name`, `slug`, `description`, `icon`, `color`, `start_date`,
  `end_date`, `boost_category_ids`, `boost_sub_category_ids`, `priority`,
  `banner_*`, `is_active`.

## 5. `cmstestimonials` + `cmstestimonialtokens` — Testimoni
- `cmstestimonials`: `id`, `name`, `role`, `text`, `rating`, `token_used`.
- `cmstestimonialtokens`: `id`, `token` (unik), `usage_limit`, `usage_count`.
  Submisi memakai token dengan kuota (transaksional).

## 6. `cmsmedia` — Media
- `id`, `postId`, data gambar (Data URL) & metadata. Dipakai route
  `/api/media/[id]` dan upload via `/api/cms/upload`.

## 7. `cmssitesettings` — Pengaturan identitas
- `id`, `key` (unik), `value`, `updated_at`. Contoh key: WhatsApp, Instagram,
  Alamat, nama aplikasi.

## 8. `opsstates` — Modul OPS (satu dokumen embedded)
- Satu dokumen dengan `key: "main"` dan `data` (Mixed) berisi seluruh state
  OPS: `users`, `decors`, `tasks`, `attendance`, `activities`, `photos`,
  `expenses`, `corrections`, `audit`, `settings`, `currentUserId`,
  `selectedDecorId`, `monthlyReportMonth`.
- `users` di sini adalah **turunan dinamis** dari `cmsusers` — dibuat otomatis
  saat seseorang login OPS (provisioning), bukan seed statis.
- Dibaca/tulis via `/api/ops/state`; cache offline di localStorage.

## 9. `migrations` — Riwayat migrasi
- `version` (unik), `name`, `applied_at`, `execution_ms`. Dikelola
  `scripts/migrate.js`.

## 10. `cmscounters` — Auto-increment
- Dokumen `{ _id: namaKoleksi, lastId }`; dinaikkan oleh `nextId()`/`setCounter()`.

## RPC (Route `/api/cms`)
Setara fungsi Postgres lama, tetap diekspos lewat `handleCmsOp`:
- `login_user(p_username, p_password)` — bcrypt vs `cmsusers`.
- `insert_user(...)`, `delete_users(p_ids)` — kelola akun.
- `get_posts_complete()`, `get_post_detail(target_id)` — karya + join inline.
- `increment_post_views(target_id)`.
- `submit_testimonial_with_token(...)`, `get_active_events()`, `get_team_members()`.