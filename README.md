# Blu Decor Padang – Arsitek Event Premium (v16.4 Production)

Platform profesional untuk jasa dekorasi dan party planner premium di Kota Padang, Sumatera Barat. v16.4 menghadirkan sistem keamanan tingkat tinggi dan manajemen data arsitektural yang presisi.

## 🚀 Fitur Utama (Enterprise Ready)

- **Retention Policy System**: Sistem _Soft-Delete_ 7 hari untuk perlindungan data.
- **Atomic Two-Way Sync**: Pembersihan otomatis aset fisik di storage saat data dibersihkan secara permanen.
- **Triple-Matrix Admin Filter**: Manajemen karya berdasarkan Kategori, Tag, dan Tema.
- **Bcrypt Security**: Enkripsi password tim otomatis di sisi server.

## 🛠️ Langkah Deployment (GitHub & Vercel)

### 1. Persiapan Repository

- Unggah seluruh kode ini ke repository **GitHub** Anda.

### 2. Konfigurasi Supabase (Wajib)

Masuk ke **Supabase SQL Editor** dan jalankan isi dari file `docs/setup.sql`. Skrip ini akan membangun:

- Tabel dengan dukungan Soft-Delete & Retensi 7 Hari.
- Trigger enkripsi Bcrypt.
- Fungsi RPC untuk sinkronisasi data.

### 3. Deploy ke Vercel

- Hubungkan GitHub Anda di dashboard Vercel.
- Tambahkan **Environment Variables**:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Klik **Deploy**.

## 💻 Perintah Terminal (CLI)

Untuk manajemen file dan data melalui terminal, gunakan perintah berikut:

### Pembersihan Lokal

```bash
# Menghapus file cache build dan folder node_modules (Refresh Total)
npm run clean

# Menghapus satu file spesifik
rm path/ke/nama_file.ts

# Menghapus satu folder
rm -rf path/ke/nama_folder
```

### Pembersihan Data Server (Hard Delete)

Untuk menghapus secara permanen data yang sudah masuk masa retensi > 7 hari:

```bash
# Jalankan via terminal lokal (saat aplikasi running)
npm run maintenance

# Jalankan via curl (Server Produksi)
curl -X POST https://nama-aplikasi-anda.vercel.app/api/maintenance
```

---

_Mewujudkan Momen Penuh Keanggunan bersama Blu Decor Padang._
_Designed by Ran Dev (WA: 081276484493) - v16.4 Production Ready_
