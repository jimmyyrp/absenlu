# Arsitektur Teknis – Blu Decor Padang v16.5

## 1. Stack Teknologi
- **Frontend**: Next.js 15 (React 19) App Router.
- **Backend / Database**: MongoDB (Mongoose) — satu-satunya sumber data.
  Supabase/Postgres **tidak lagi dipakai**.
- **Styling**: Tailwind CSS dengan sistem grid adaptif 2-3-6.

## 2. Aliran Data
- Seluruh data situs (karya, kategori, testimoni, media, pengaturan, user)
  dibaca/ditulis lewat **API route Next.js** yang memakai Mongoose model
  (`src/lib/cms/models.ts`) dan koneksi `src/lib/mongodb.ts`.
- Portal admin (`/admin`) memanggil `/api/cms` (RPC + tabel) — pengganti
  Supabase REST/RPC.
- Portal OPS (`/ops`) membaca/menulis **satu dokumen embedded** `opsstates`
  (key `main`) lewat `/api/ops/state`. `localStorage` **hanya cache offline**.
- Auth OPS login diverifikasi ke `cmsusers` di MongoDB lewat `POST /api/ops/login`
  (bcrypt) — tidak ada password hardcoded per-peran.

## 3. Logika Pintar (Smart Logic)
### A. Relational Filter Logic
Dropdown "TAG" (Sub-Kategori) di halaman Portofolio dihitung secara dinamis di sisi klien berdasarkan karya yang tersedia pada "KATEGORI" yang sedang dipilih. Ini memastikan pengalaman pengguna yang bebas dari hasil "Data Tidak Ditemukan".

### B. Interest & View Counter
1. **Interests**: Menyimpan 10 kategori terakhir yang dilihat di `localStorage` untuk sistem rekomendasi Beranda.
2. **Views**: `increment_post_views` dipicu hanya sekali per sesi (sessionStorage) untuk validitas data analitik.

### C. Gradient-Blend Navigation
Sistem header menggunakan deteksi `scrolled` untuk beralih antara gradient-blend transparan (untuk integrasi hero) dan solid white (untuk keterbacaan konten galeri).

## 4. Migrasi Database (pengganti migrations/*.sql)
- Semua struktur/index + data referensi dikelola lewat **migrasi MongoDB**
  (`scripts/migrate.js`, folder `migrations/NNN_nama.js`).
- Runner mencatat versi diterapkan di collection `migrations` (idempotent).
- Skema Mongoose adalah **sumber shape dokumen**; migrasi membuat indeks dan
  seed **data referensi** (kategori/theme/pengaturan) + **akun admin pertama**
  dari env `SEED_ADMIN_*`. Tidak ada user/password hardcoded.

## 5. Keamanan & Izin
- **Auth CMS/Admin**: `login_user` (bcrypt) terhadap `cmsusers`, token sesi
  disimpan di localStorage; halaman admin hanya merender konten setelah login sah.
- **Auth OPS**: `POST /api/ops/login` — verifikasi username+password ke
  `cmsusers`, pemetaan peran CMS → peran OPS (owner→owner,
  developer/admin→admin, staff→crew). Akun OPS anggota tim dibuat otomatis
  dari akun CMS yang login (provisioning di `src/lib/ops/store.tsx`).
- **RBAC OPS**: peran mengontrol rute (owner/admin/crew) di
  `src/app/ops/` + `OWNER_ROUTES`/`MANAGER_ROUTES`/`CREW_ROUTES`.
- Tidak ada RLS / SQL supabase. Perlindungan data: CSP di `vercel.json`,
  soft-delete + retensi (lihat `scripts/cleanup.js`).