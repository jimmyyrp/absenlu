# Arsitektur Teknis – Blu Decor Padang v15.0

## 1. Stack Teknologi
- **Frontend**: Next.js 15 (React 19) App Router.
- **Backend**: Supabase (PostgreSQL) v3.0 modular.
- **Styling**: Tailwind CSS dengan sistem grid adaptif 2-3-6.

## 2. Logika Pintar (Smart Logic)
### A. Relational Filter Logic
Dropdown "TAG" (Sub-Kategori) di halaman Portofolio dihitung secara dinamis di sisi klien berdasarkan karya yang tersedia pada "KATEGORI" yang sedang dipilih. Ini memastikan pengalaman pengguna yang bebas dari hasil "Data Tidak Ditemukan".

### B. Interest & View Counter
1. **Interests**: Menyimpan 10 kategori terakhir yang dilihat di `localStorage` untuk sistem rekomendasi Beranda.
2. **Views**: Fungsi RPC `increment_post_views` dipicu hanya sekali per sesi (sessionStorage) untuk validitas data analitik.

### C. Gradient-Blend Navigation
Sistem header menggunakan deteksi `scrolled` untuk beralih antara gradient-blend transparan (untuk integrasi hero) dan solid white (untuk keterbacaan konten galeri).

## 3. Keamanan & Izin
- **RLS**: Izin `SELECT` publik eksplisit untuk peran `anon`.
- **Otorisasi**: Fungsi RPC `login_user` dengan enkripsi `pgcrypto`.
