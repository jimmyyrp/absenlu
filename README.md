# Blu Decor Padang – Arsitek Event Premium (v16.5)

Platform profesional untuk jasa dekorasi dan party planner premium di Kota Padang, Sumatera Barat. Seluruh data disimpan di **MongoDB Atlas** (bukan Supabase/Postgres) — skema, indeks, data referensi, akun admin/OPS, dan modul OPS dibangun melalui sistem **migrasi MongoDB** (pengganti `migrations/*.sql` lama).

## 🚀 Fitur Utama (Enterprise Ready)

- **MongoDB Tunggal**: CMS (admin), auth admin, auth OPS, media, testimoni, berita — satu database, satu sumber truth.
- **Akun 100% Dinamis**: Tidak ada username/password hardcoded di kode. Semua kredensial disimpan di collection `cmsusers` (hash bcrypt) dan dikelola di `/admin/users`.
- **Migration System**: Struktur & data referensi dibuat lewat `npm run db:migrate` (runner mencatat versi di collection `migrations`, idempotent).
- **Retention Policy System**: Soft-delete 7 hari; pembersihan permanen via `npm run maintenance`.
- **Triple-Matrix Admin Filter**: Manajemen karya berdasarkan Kategori, Tag, dan Tema.
- **Bcrypt Security**: Enkripsi password (CMS & OPS) di sisi server.

## 🗄️ Struktur Database

Data hidup di **MongoDB Atlas**, database `bludecor`, dengan koleksi:

| Collection                                       | Isi                                                  |
| ------------------------------------------------ | ---------------------------------------------------- |
| `cmsusers`                                       | Akun admin & OPS (SINGLE SOURCE of truth untuk auth) |
| `cmscategories`, `cmssubcategories`, `cmsthemes` | Katalog karya                                        |
| `cmsposts`, `cmsevents`, `cmstestimonials`       | Konten situs                                         |
| `cmsmedia`, `cmssitesettings`                    | Media & pengaturan                                   |
| `opsstates`                                      | Satu dokumen embedded untuk seluruh data modul OPS   |
| `migrations`                                     | Riwayat migrasi yang sudah diterapkan                |

> Detail koleksi & field: lihat [`docs/SCHEMA.md`](docs/SCHEMA.md).

## 🐘 → 🍃 Migrasi dari Supabase

Sudah bukan Supabase. Skrip `npm run db:import` (scripts/import-from-supabase.js) tersedia **sekali jalan** untuk memindahkan data lama dari Postgres/Supabase jika masih diperlukan.

## 🛠️ Setup Awal Database

```bash
# 1. Salin env lalu isi MONGODB_* (lihat .env.example)
cp .env.example .env.local

# 2. Terapkan migrasi (indeks + data referensi + akun admin dari SEED_ADMIN_*)
npm run db:migrate

# 3. (Alternatif) Migrasi + prompt akun admin bila SEED_ADMIN_PASSWORD kosong
npm run db:seed
```

Migrasi bersifat **idempotent** — aman dijalankan ulang. Setiap perubahan struktur baru ditambahkan sebagai file baru di folder `migrations/` dengan format `NNN_nama.js` (lihat `scripts/migrate.js`).

## ✍️ Akun & Peran

- Login **Admin** (`/admin`) dan **OPS** (`/login`) memakai akun yang sama dari `cmsusers`.
- Peran CMS `owner` / `developer` / `admin` / `staff` dipetakan ke peran OPS:
  - `owner` → **Owner**
  - `developer` / `admin` → **Admin**
  - `staff` → **Kru (crew)**
- Tambah/ubah user: halaman `/admin/users`. Akun pertama dibuat otomatis dari `SEED_ADMIN_*` (migrasi 003) atau prompt `npm run db:seed`.

## 💻 Perintah Terminal (CLI)

```bash
npm run dev          # dev server (port 9002)
npm run build        # produksi build
npm run db:migrate   # terapkan migrasi MongoDB baru
npm run db:seed      # migrasi + buat akun admin pertama (interaktif)
npm run maintenance  # hapus permanen soft-delete > 7 hari (argumen: -- 14)
npm run db:import    # impor sekali jalan dari Supabase (legacy)
```

## 🧹 Pembersihan Data Server (Hard Delete)

```bash
# Lokal: hapus permanen data soft-delete yang sudah lewat retensi 7 hari
npm run maintenance

# Ubah retensi: 14 hari
npm run maintenance -- 14

# Di server produksi: jalankan skrip di lingkungan dengan koneksi MongoDB
# (tidak ada lagi endpoint HTTP /api/maintenance — cukup CLI)
```

---

_Mewujudkan Momen Penuh Keanggunan bersama Blu Decor Padang._
_Designed by Ran Dev (WA: 081276484493) - v16.5 Production Ready_
