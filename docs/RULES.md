
# Aturan Pengembangan (Rules) – Blu Decor Padang v15.0

## 1. Tata Letak & Grid
- **Desktop Grid**: Wajib menggunakan sistem **6 kolom** untuk seluruh daftar portofolio, layanan, dan kategori.
- **Tablet Grid**: Wajib menggunakan sistem **3 kolom**.
- **Mobile Grid**: Wajib menggunakan sistem **2 kolom**.

## 2. Sistem Jarak (Spacing)
- **Halaman Beranda (Hero)**: Wajib memulai kontainer utama dari `top: 0` (tanpa padding-top pada wrapper) agar Hero menyatu sempurna dengan header.
- **Halaman Katalog & Bantuan**: Gunakan **`pt-20`** untuk kontainer utama guna memberikan jarak arsitektural yang kompak di bawah header.
- **Section Spacing**: Padding vertikal antar seksi wajib minimal **`py-4`** dan maksimal **`py-8`**.
- **Safe Zone**: Halaman portofolio wajib menggunakan **`mt-12`** di bawah filter sticky agar kartu produk baris pertama tidak tertutup.

## 3. Tipografi Mikro
- **Labels & Tags**: Gunakan ukuran font **6px - 8px** untuk teks keterangan teknis di dalam gambar, status, dan ID konten.
- **Micro-Titles**: Gunakan font **Plus Jakarta Sans** dengan tracking tight untuk sub-heading halaman.

## 4. Komposisi Kartu Produk
- **Kategori**: Letakkan di kiri bawah gambar, gunakan pemisah ` • ` untuk multi-kategori, maksimal lebar 55% dengan `truncate`.
- **Views**: Letakkan di kanan bawah gambar.
- **Favorit (Bintang)**: Letakkan di kanan atas gambar dengan latar belakang backdrop-blur.

## 5. Navigasi & UI
- **Header Blending**: Wajib menggunakan `bg-gradient-to-b from-black/90 to-transparent` saat mode transparan untuk memastikan keterbacaan di atas Hero.
- **Mobile Close Button**: Tombol tutup (X) pada sidebar wajib memiliki latar belakang `bg-white/10` dengan `opacity-100` dan padding `p-2` agar terlihat jelas di atas Navy.
- **Footer**: Wajib ultra-kompak (satu baris horizontal) dengan kontras teks `text-navy/60` dan padding vertikal `py-4`.
