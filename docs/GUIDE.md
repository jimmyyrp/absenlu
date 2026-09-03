# 📖 Panduan Lengkap Sistem Manajemen BLUDECOR

> **Panduan ini menjelaskan semua fitur sistem berdasarkan role masing-masing.**
> Dibuat agar mudah dipahami oleh semua pengguna, dari pemula hingga tim inti.

---

## 📌 Daftar Isi

1. [Apa Itu BLUDECOR?](#1-apa-itu-bludecor)
2. [Pengertian Role & Hak Akses](#2-pengertian-role--hak-akses)
3. [Dashboard (Beranda)](#3-dashboard-beranda)
4. [Absensi](#4-absensi)
5. [Decor / Proyek](#5-decor--proyek)
6. [Daftar Tugas (Todo)](#6-daftar-tugas-todo)
7. [Kegiatan / Aktivitas](#7-kegiatan--aktivitas)
8. [Dokumentasi (Foto)](#8-dokumentasi-foto)
9. [Pengeluaran](#9-pengeluaran)
10. [Laporan Bulanan](#10-laporan-bulanan)
11. [Analisa / Analytics](#11-analisa--analytics)
12. [Pengaturan](#12-pengaturan)
13. [Tips & FAQ](#13-tips--faq)

---

## 1. Apa Itu BLUDECOR?

BLUDECOR adalah sistem manajemen internal untuk bisnis dekorasi event. Sistem ini membantu Anda mengelola:

- **Project/Decor** — data setiap event dekorasi yang dikerjakan
- **Tim** — absensi, tugas, dan aktivitas crew
- **Keuangan** — omzet, pengeluaran, dan profit per project
- **Dokumentasi** — foto proses pengerjaan
- **Laporan & Analisa** — performa bisnis dan tim

**Catatan Penting:**

- Data tersimpan di browser (localStorage), bukan server cloud
- Gunakan browser yang sama untuk mengakses data yang sama
- Disarankan menggunakan Chrome atau Firefox versi terbaru

---

## 2. Pengertian Role & Hak Akses

### 🔑 Owner (Pemilik)

> Akses penuh ke semua fitur dan data

| Fitur       | Akses                                               |
| ----------- | --------------------------------------------------- |
| Dashboard   | ✅ Lihat semua data, statistik keuangan             |
| Absensi     | ✅ Lihat & kelola semua, approve/koreksi, audit log |
| Decor       | ✅ CRUD (Tambah, Edit, Hapus)                       |
| Tugas       | ✅ CRUD langkah kerja per decor                     |
| Kegiatan    | ✅ Lihat semua, hapus                               |
| Dokumentasi | ✅ Upload & hapus foto                              |
| Pengeluaran | ✅ CRUD                                             |
| Laporan     | ✅ Full akses                                       |
| Analisa     | ✅ Full akses                                       |
| Pengaturan  | ✅ Kelola user, sistem, template                    |

### 🛡️ Admin (Pengelola)

> Akses hampir sama dengan Owner, kecuali pengaturan sistem

| Fitur       | Akses                                         |
| ----------- | --------------------------------------------- |
| Dashboard   | ✅ Lihat semua data                           |
| Absensi     | ✅ Lihat & kelola tim, approve/koreksi, audit |
| Decor       | ✅ CRUD                                       |
| Tugas       | ✅ CRUD langkah kerja per decor               |
| Kegiatan    | ✅ Lihat semua, hapus                         |
| Dokumentasi | ✅ Upload & hapus foto                        |
| Pengeluaran | ✅ CRUD                                       |
| Laporan     | ✅ Full akses                                 |
| Analisa     | ✅ Full akses                                 |
| Pengaturan  | ⚠️ Terbatas (lihat data, ubah role)           |

### 👷 Crew (Tim Lapangan)

> Akses terbatas — bekerja berdasarkan decor yang dipilih dan dicatat melalui absensi

| Fitur       | Akses                               |
| ----------- | ----------------------------------- |
| Dashboard   | ✅ Lihat data sendiri & decor aktif |
| Absensi     | ✅ Absen sendiri (hanya hari ini)   |
| Decor       | 👁️ Lihat dan pilih decor aktif      |
| Tugas       | ✅ Lihat langkah kerja decor        |
| Kegiatan    | ✅ Catat kegiatan sendiri           |
| Dokumentasi | ✅ Upload foto sendiri              |
| Pengeluaran | ❌ Tidak ada akses                  |
| Laporan     | ❌ Tidak ada akses                  |
| Analisa     | ❌ Tidak ada akses                  |
| Pengaturan  | ❌ Tidak ada akses                  |

---

## 3. Dashboard (Beranda)

**URL:** `/ops`

Dashboard adalah halaman utama yang menampilkan ringkasan singkat.

### Yang Ditampilkan:

| Elemen            | Keterangan                                         |
| ----------------- | -------------------------------------------------- |
| Greeting          | Sapaan dengan nama Anda                            |
| Quick Access      | Tombol cepat ke Absensi, Decor, dan Tugas          |
| Keuangan (Owner)  | Omzet, Pengeluaran, Profit bulan ini               |
| Decor Aktif       | Info decor yang sedang dipilih beserta progress    |
| Jam Kerja         | Total jam kerja Anda (crew) atau tim (owner/admin) |
| Aktivitas Terbaru | 5 aktivitas terakhir                               |

### Langkah Penggunaan:

1. Buka halaman Dashboard setelah login
2. Periksa **Quick Access** untuk akses cepat ke fitur utama
3. Jika Owner, cek **Keuangan Bulan Ini** untuk gambaran singkat
4. Klik **"Lihat Semua"** di bagian Decor atau Aktivitas untuk detail lengkap

---

## 4. Absensi

**URL:** `/ops/absensi`

Fitur pencatatan kehadiran harian. Self-report — tidak wajib, tapi setiap data harus jujur & bisa dipertanggungjawabkan.

### Tab yang Tersedia:

| Tab         | Siapa yang Lihat | Fungsi                                 |
| ----------- | ---------------- | -------------------------------------- |
| **Status**  | Semua            | Absen masuk/keluar, lihat rekap harian |
| **Rekap**   | Semua            | Rekap jam kerja bulanan                |
| **Koreksi** | Owner/Admin      | Approve/tolak koreksi absensi          |
| **Audit**   | Owner/Admin      | Log semua aktivitas absensi            |

---

### 👷 Untuk Crew:

#### Absen Masuk (Hadir)

1. **Pilih Decor / Kegiatan dulu** (menu **Decor** atau Current Decor di atas)
2. Buka halaman **Absensi**
3. Pastikan tab **Status** aktif
4. Klik tombol **"Absen Masuk — [nama decor]"** (hijau besar)
5. Centang pernyataan bahwa absensi sesuai kondisi kerja, lalu klik **"Konfirmasi absen"**
6. Waktu masuk otomatis tercatat sesuai jam server
7. Status berubah menjadi **"Sedang Bekerja"**

#### Absen Keluar (Selesai)

1. Setelah selesai bekerja, klik tombol **"Selesai — [nama decor]"** (biru besar)
2. Waktu keluar otomatis tercatat
3. Durasi kerja otomatis dihitung

#### Tidak Bekerja Hari Ini

1. Jika hari ini tidak bekerja, klik **"Tidak Bekerja Hari Ini"**
2. Konfirmasi pada dialog yang muncul
3. Status berubah menjadi **"Tidak Bekerja"**

**⚠️ Penting:**

- Absensi hanya bisa dilakukan untuk **hari ini**
- Crew **wajib memilih decor/kegiatan dulu** sebelum absen — absensi selalu terkait satu decor
- Semua crew yang hadir di decor yang sama dapat mengerjakan langkah kerja yang sama; tidak ada lagi pembagian tugas manual melalui **Assign ke**
- Status langkah kerja dikelola sebagai alur bersama, sedangkan status kehadiran dicatat melalui **Absen Masuk** dan **Selesai**
- Crew **tidak bisa** melihat atau mengedit data orang lain
- Sistem **terkunci** di luar jadwal kerja decor (mis. jadwal decor sudah lewat)

---

---

### 🛡️ Untuk Owner/Admin:

#### Melihat Status Tim

1. Buka tab **Status**
2. Di kolom kanan, lihat **Rekap Tim** — semua crew dan status mereka
3. Summary di atas menunjukkan: Sedang Bekerja, Selesai, Tidak Bekerja, Tidak Mengisi, Perlu Ditinjau

#### Menghapus Session Absensi

1. Di rekap tim, klik **✕** (ikon X) di samping nama crew
2. Session akan dihapus

#### Flags / Perlu Ditinjau

Sistem otomatis mendeteksi anomali:

- Crew yang melakukan **≥3 koreksi** dalam sebulan
- Absen masuk di **luar jam normal** (sebelum jam 5 atau setelah jam 21)
- Durasi kerja **terlalu pendek** (< 30 menit)

#### Approve/Koreksi Absensi

1. Buka tab **Koreksi**
2. Lihat daftar koreksi yang pending
3. Klik **✅ Setujui** untuk menyetujui, atau **❌ Tolak** untuk menolak

#### Audit Log

1. Buka tab **Audit**
2. Lihat semua riwayat aktivitas absensi (masuk, pulang, koreksi, hapus)
3. Gunakan pagination untuk navigasi

#### Rekap Jam Kerja

1. Buka tab **Rekap**
2. Lihat total jam kerja semua crew bulan ini

---

## 5. Decor / Proyek

**URL:** `/ops/decor`

Pusat data sistem — setiap event dekorasi tercatat sebagai "Decor".

### Status Decor:

| Status              | Keterangan                       |
| ------------------- | -------------------------------- |
| **Draf**            | Baru dibuat, belum ada persiapan |
| **Persiapan**       | Sedang dipersiapkan              |
| **Siap**            | Sudah siap untuk dikerjakan      |
| **Sedang Berjalan** | Sedang dikerjakan di lokasi      |
| **Selesai**         | Pengerjaan selesai               |
| **Dibatalkan**      | Project dibatalkan               |

---

### 🛡️ Untuk Owner/Admin (Kelola Decor):

#### Membuat Decor Baru

1. Klik tombol **"+ Tambah Decor"** ( pojok kanan atas)
2. Isi formulir:
   - **Nama Decor** _(wajib)_ — contoh: "Pernikahan Rina & Aldi"
   - **Klien** — nama klien
   - **Kategori** — pilih dari dropdown (Pernikahan, Ulang Tahun, dll)
   - **Tanggal Event** — tanggal pelaksanaan
   - **Status** — pilih status awal (biasanya "Draf")
   - **Jadwal Mulai / Jadwal Selesai** — jam kerja decor (opsional)
   - **Lokasi** — tempat event
   - **Nilai Proyek/Omzet** — nominal dalam Rupiah
   - **Catatan** — tema, permintaan khusus, dll
3. Klik **"Buat Decor"**

#### Mengedit Decor

1. Klik ikon **✏️ (Pencil)** pada card decor
2. Ubah data yang diperlukan
3. Klik **"Simpan Perubahan"**

#### Menghapus Decor

1. Klik ikon **🗑️ (Trash)** pada card decor
2. Konfirmasi hapus

#### Memilih Decor (Sebagai Active)

1. Klik tombol **"Pilih"** pada card decor
2. Decor akan menjadi **Decor Aktif** yang terlihat di Dashboard
3. Semua fitur (Tugas, Kegiatan, Dokumentasi) akan terkait dengan decor ini

#### Filter & Pencarian

1. Gunakan **tab status** di atas untuk filter berdasarkan status
2. Gunakan **kolom pencarian** untuk mencari berdasarkan nama, klien, atau lokasi
3. Gunakan **pagination** di bawah untuk navigasi

---

### 👷 Untuk Crew:

- Melihat **semua decor aktif** (bukan hanya yang ditugaskan)
- Klik **"Pilih"** untuk menjadikan decor sebagai decor aktif
- Sistem **terkunci** jika jadwal kerja decor sudah lewat (absensi, tugas, dokumentasi tidak bisa diisi)

---

## 6. Daftar Tugas (Todo)

**URL:** `/ops/todo`

Kelola urutan langkah kerja untuk setiap decor yang aktif. Daftar ini adalah checklist bersama untuk tim, bukan pembagian tugas per orang.

### Konsep Langkah Kerja:

| Elemen          | Keterangan                                                             |
| --------------- | ---------------------------------------------------------------------- |
| **Decor Aktif** | Semua langkah yang dibuat masuk ke decor yang sedang dipilih           |
| **Urutan**      | Langkah ditampilkan sesuai urutan penambahan, dari nomor pertama       |
| **Absensi**     | Menunjukkan siapa yang benar-benar hadir dan bekerja di decor tersebut |
| **Template**    | Tombol cepat untuk menambahkan langkah yang sering dipakai             |

---

### 🛡️ Untuk Owner/Admin:

#### Menambah Tugas Baru

1. Pastikan ada **Decor Aktif** dipilih
2. Di panel **Alur Tugas**, klik **"Tambah"**
3. Isi **Nama Kegiatan** — contoh: "Pasang pencahayaan"
4. Klik **"Tambah"**. Langkah otomatis ditambahkan sebagai langkah berikutnya.

#### Menambah dari Template

1. Di bagian **Template Kegiatan**, klik salah satu tombol template
2. Tugas otomatis ditambahkan ke decor aktif
3. Langkah otomatis masuk ke decor aktif dan dapat dilihat oleh tim yang bekerja di decor tersebut.

#### Menghapus Langkah

1. Klik ikon **🗑️** di samping langkah
2. Baca nama langkah dan decor pada dialog konfirmasi
3. Klik **"Ya, Hapus"** hanya jika langkah benar-benar tidak diperlukan

---

### 👷 Untuk Crew:

- Pilih decor aktif untuk melihat seluruh langkah kerja decor tersebut
- Gunakan daftar ini sebagai urutan pekerjaan bersama tim
- Catat kehadiran pada halaman **Absensi** agar siapa yang bekerja pada decor dapat diketahui
- Crew tidak menghapus atau mengubah struktur langkah; perubahan struktur dilakukan Owner/Admin

### Aturan Penting Tugas:

- Pastikan decor yang dipilih benar sebelum menambah langkah
- Buat satu langkah untuk satu pekerjaan yang jelas dan dapat diperiksa
- Gunakan kata kerja di awal, misalnya **Muat barang**, **Pasang backdrop**, atau **Bongkar properti**
- Jangan memasukkan nama orang pada judul langkah karena penanggung jawab ditentukan dari absensi
- Di luar jadwal kerja decor, penambahan dan penghapusan langkah dikunci oleh sistem

---

## 7. Kegiatan / Aktivitas

**URL:** `/ops/kegiatan`

Catat apa yang benar-benar Anda kerjakan hari ini.

### Jenis Kegiatan (bisa dikustom di Pengaturan):

- Muat Barang
- Pemasangan
- Penyelesaian
- Bongkar
- Dokumentasi
- Lainnya

### Status Kegiatan:

| Status                | Keterangan             |
| --------------------- | ---------------------- |
| **Selesai**           | Kegiatan sudah selesai |
| **Sedang Dikerjakan** | Masih dalam proses     |
| **Terhambat**         | Ada kendala            |
| **Pending**           | Ditunda                |

---

### Semua Role (Crew, Admin, Owner):

#### Mencatat Kegiatan Baru

1. Buka halaman **Kegiatan**
2. Decor sudah otomatis dipilih (sesuai Decor Aktif)
3. Pilih **Jenis Kegiatan** — contoh: "Pemasangan"
4. Isi **Kegiatan** — jelaskan apa yang dikerjakan
5. Pilih **Status** kegiatan
6. _(Opsional)_ Hubungkan dengan **Tugas** yang relevan
7. _(Opsional)_ Tambahkan **Catatan** detail
8. _(Opsional)_ Upload **Foto** proses pengerjaan
9. Klik **"Simpan Kegiatan"**

#### Melihat Riwayat

- Di panel kanan, lihat semua kegiatan yang sudah dicatat untuk decor aktif
- Gunakan **pagination** untuk navigasi

#### Menghapus Kegiatan

- Owner/Admin bisa menghapus kegiatan siapa saja
- Crew hanya bisa menghapus kegiatan sendiri
- Klik ikon **🗑️** di samping kegiatan

---

## 8. Dokumentasi (Foto)

**URL:** `/ops/dokumentasi`

Upload dan kelola foto dokumentasi per decor.

### Semua Role:

#### Upload Foto

1. Buka halaman **Dokumentasi**
2. Pastikan **Decor Aktif** sudah dipilih
3. Klik tombol **"+ Tambah Foto"**
4. Pilih file foto dari komputer Anda
5. Isi **Keterangan** — contoh: "Backdrop pelaminan"
6. Klik **"Simpan"**

#### Melihat Foto

- Semua foto untuk decor aktif ditampilkan dalam grid
- Setiap foto menampilkan: caption, nama uploader, dan waktu

#### Menghapus Foto

- Hover (arahkan mouse) ke foto yang ingin dihapus
- Klik ikon **🗑️** yang muncul di pojok kanan atas foto
- Owner/Admin bisa menghapus foto siapa saja
- Crew hanya bisa menghapus foto sendiri

---

## 9. Pengeluaran

**URL:** `/ops/pengeluaran`

Kelola biaya operasional, material, dan tenaga kerja.

> **⚠️ Hanya Owner & Admin yang bisa mengakses halaman ini.**

### Kategori Pengeluaran:

| Grup                        | Contoh Kategori                                       |
| --------------------------- | ----------------------------------------------------- |
| **Transportasi & Logistik** | BBM, Parkir, Tol, Sewa Kendaraan, Kurir               |
| **Material Decor**          | Bunga, Kain, Backdrop, Kayu, Akrilik, Balon, Lighting |
| **Tenaga Kerja**            | Harian, Helper, Driver, Crew, Lembur                  |
| **Operasional Kantor**      | Listrik, Internet, Sewa, ATK, Maintenance             |
| **Lainnya**                 | Konsumsi, Dokumentasi, Administrasi, Marketing        |

---

### 🛡️ Untuk Owner/Admin:

#### Menambah Pengeluaran

1. Klik tombol **"+ Tambah"** (pojok kanan atas)
2. Isi formulir:
   - **Keterangan** _(wajib)_ — contoh: "BBM kendaraan"
   - **Kategori** — pilih dari dropdown
   - **Nominal** _(wajib)_ — jumlah dalam Rupiah
   - **Decor** — kaitkan dengan project tertentu (opsional)
   - **Tanggal** — tanggal pengeluaran
3. Klik **"Tambah"**

#### Mengedit Pengeluaran

1. Klik ikon **✏️** pada baris pengeluaran
2. Ubah data yang diperlukan
3. Klik **"Simpan"**

#### Menghapus Pengeluaran

1. Klik ikon **🗑️** pada baris pengeluaran

#### Filter & Pencarian

1. **Filter bulan** — pilih bulan di dropdown pojok kanan atas
2. **Filter kategori** — klik tab kategori di atas daftar
3. **Pencarian** — ketik kata kunci di kolom pencarian

#### Melihat Ringkasan

- **Stat cards** di atas menunjukkan: Total Pengeluaran, Transaksi, Kategori Terbesar, Terkait Decor
- **Pie chart** di panel kiri menunjukkan proporsi per grup

---

## 10. Laporan Bulanan

**URL:** `/ops/laporan`

Ringkasan keuangan & performa project per bulan.

> **⚠️ Hanya Owner & Admin yang bisa mengakses halaman ini.**

### Yang Ditampilkan:

| Elemen                       | Keterangan                                         |
| ---------------------------- | -------------------------------------------------- |
| **Stat Cards**               | Total Decor, Omzet, Pengeluaran, Profit            |
| **Breakdown Pengeluaran**    | Pie chart per grup kategori                        |
| **Pengeluaran per Kategori** | Bar chart detail per kategori                      |
| **Jam Kerja Crew**           | Tabel jam kerja dan jumlah aktivitas               |
| **Rekap Profit per Decor**   | Tabel omzet, pengeluaran, profit, margin per decor |
| **Omzet vs Pengeluaran**     | Bar chart per decor                                |

---

### 🛡️ Untuk Owner/Admin:

#### Mengganti Bulan

1. Klik tombol **◀** untuk bulan sebelumnya
2. Klik tombol **▶** untuk bulan berikutnya
3. Label bulan ditampilkan di tengah

#### Membaca Tabel Profit per Decor

| Kolom       | Keterangan                   |
| ----------- | ---------------------------- |
| Decor       | Nama project dan kategori    |
| Status      | Status terkini decor         |
| Omzet       | Total nilai project          |
| Pengeluaran | Total biaya yang tercatat    |
| Profit      | Omzet dikurangi pengeluaran  |
| Margin      | Persentase profit dari omzet |

**💡 Tips:**

- Profit positif = hijau, profit negatif = merah
- Margin tinggi = project efisien
- Gunakan data ini untuk evaluasi performa bisnis

---

## 11. Analisa / Analytics

**URL:** `/ops/analisa`

Performa bulanan, keuangan, dan aktivitas tim dalam 6 bulan terakhir.

> **⚠️ Hanya Owner & Admin yang bisa mengakses halaman ini.**

### Yang Ditampilkan:

| Elemen                   | Keterangan                                                     |
| ------------------------ | -------------------------------------------------------------- |
| **Insight Otomatis**     | Ringkasan otomatis perubahan dari bulan ke bulan               |
| **Performa Bulanan**     | Tabel perbandingan 6 bulan (Decor, Omzet, Pengeluaran, Profit) |
| **Stat Cards**           | Decor bulan ini, Profit, Jam Kerja, Crew Aktif                 |
| **Omzet vs Pengeluaran** | Bar chart 6 bulan                                              |
| **Profit**               | Line chart tren profit 6 bulan                                 |

---

### 🛡️ Untuk Owner/Admin:

#### Membaca Insight Otomatis

- Sistem otomatis menganalisis perubahan dari bulan sebelumnya
- Contoh: "Omzet meningkat 15% dibanding bulan sebelumnya"
- Perhatikan insight yang menunjukkan penurunan (merah)

#### Membaca Chart

- **Bar Chart (kiri):** Perbandingan Omzet (gelap) vs Pengeluaran (emas)
- **Line Chart (kanan):** Tren Profit — naik = bagus, turun = perlu evaluasi

#### Stat Cards

- **Decor:** Jumlah project bulan ini + persentase perubahan
- **Profit:** Total profit + nominal lengkap
- **Jam Kerja:** Total jam kerja semua crew
- **Crew Aktif:** Berapa orang yang aktif bulan ini dari total anggota

---

## 12. Pengaturan

**URL:** `/ops/pengaturan`

Kelola user, kategori pekerjaan, dan konfigurasi sistem.

> **⚠️ Hanya Owner yang bisa mengubah pengaturan.**
> Admin bisa melihat data dan mengubah role user.

### Tab yang Tersedia:

| Tab                | Fungsi                                  |
| ------------------ | --------------------------------------- |
| **Tim & Akses**    | Kelola anggota tim dan hak akses        |
| **Jenis Kegiatan** | Kelola daftar jenis kegiatan            |
| **Template Tugas** | Kelola template tugas default           |
| **Sistem**         | Konfigurasi nama aplikasi dan opsi lain |

---

### 🔑 Tab: Tim & Akses

#### Menambah Anggota Tim

1. Klik **"+ Tambah User"**
2. Isi formulir:
   - **Nama Lengkap** _(wajib)_
   - **Username** _(wajib)_ — untuk login
   - **Role** — Owner, Admin, atau Crew
   - **No. HP** _(opsional)_
3. Klik **"Tambah User"**

#### Mengedit Anggota

1. Klik ikon **✏️** pada baris anggota
2. Ubah data yang diperlukan
3. Klik **"Simpan"**

#### Mengubah Role

1. Di daftar anggota, klik dropdown **Role** pada nama yang dipilih
2. Pilih role baru (Owner / Admin / Crew)

#### Mengaktifkan/Menonaktifkan Anggota

1. Gunakan **saklar (toggle)** di samping nama anggota
2. OFF = nonaktif (tidak bisa login)

#### Menghapus Anggota

1. Klik ikon **🗑️** pada anggota
2. Konfirmasi hapus
3. **⚠️ Tidak bisa menghapus diri sendiri**

---

### 🏷️ Tab: Jenis Kegiatan

#### Menambah Jenis

1. Ketik nama jenis di kolom input — contoh: "Pemasangan"
2. Klik **"+ Tambah"** atau tekan **Enter**

#### Menghapus Jenis

1. Klik ikon **🗑️** di samping jenis
2. Konfirmasi hapus

**💡 Jenis ini digunakan di form pencatatan kegiatan.**

---

### 📋 Tab: Template Tugas

#### Menambah Template

1. Ketik nama template — contoh: "Pasang backdrop"
2. Klik **"+ Tambah"** atau tekan **Enter**

#### Menghapus Template

1. Klik ikon **🗑️** di samping template
2. Konfirmasi hapus

**💡 Template ini muncul sebagai tombol cepat di halaman Tugas.**

---

### ⚙️ Tab: Sistem

#### Mengubah Nama Aplikasi

1. Ketik nama baru di kolom **Nama Aplikasi**
2. Klik **"Simpan"**

#### Absensi Wajib

- **Aktif:** User wajib absen sebelum bekerja
- **Nonaktif (Default):** Absensi bersifat opsional
- **💡 Direkomendasikan NONAKTIF** agar model kerja tetap fleksibel

---

## 13. Tips & FAQ

### 💡 Tips Penggunaan

1. **Pilih Decor Terlebih Dahulu**
   - Sebelum mengerjakan tugas, kegiatan, atau dokumentasi, **pilih decor** yang sedang dikerjakan
   - Klik "Pilih" di halaman Decor, atau gunakan shortcut di Dashboard

2. **Isi Absensi Setiap Hari**
   - Meskipun opsional, absensi membantu melacak jam kerja
   - Isi dengan jujur — data bisa diaudit oleh owner

3. **Catat Kegiatan secara Berkala**
   - Jangan menunggu selesai — catat saat sedang dikerjakan
   - Upload foto sebagai bukti

4. **Gunakan Template Tugas**
   - Buat template untuk activity yang sering dilakukan
   - Hemat waktu saat membuat tugas baru

5. **Review Laporan Bulanan**
   - Cek laporan setiap akhir bulan
   - Perhatikan profit margin per decor

---

### ❓ FAQ

**Q: Data saya hilang setelah ganti browser?**
A: Data tersimpan di browser (localStorage). Gunakan browser yang sama, atau export data sebelum ganti.

**Q: Saya salah absen, bagaimana cara memperbaiki?**
A: Crew bisa ajukan **Koreksi** ke admin. Admin/Owner bisa langsung mengedit atau menghapus session di tab Status.

**Q: Saya tidak bisa menghapus pengeluaran?**
A: Pastikan Anda login sebagai **Owner** atau **Admin**.

**Q: Decor yang saya pilih tidak muncul di Tugas?**
A: Pastikan decor sudah dipilih sebagai **Decor Aktif**, statusnya bukan Selesai/Dibatalkan, dan Anda berada di halaman **Tugas**. Semua langkah kerja tersimpan per decor, bukan per orang.

**Q: Bagaimana cara melihat profit per project?**
A: Buka halaman **Laporan**, lihat tabel **Rekap Profit per Decor**.

**Q: Siapa yang bisa melihat audit log?**
A: Hanya **Owner** dan **Admin**.

**Q: Apakah crew bisa melihat data keuangan?**
A: **Tidak.** Crew hanya melihat data operasional yang relevan dengan decor dan aktivitas kerja mereka.

**Q: Mengapa tidak ada kolom "Assign ke" pada langkah kerja?**
A: Karena satu langkah dapat dikerjakan bersama. Orang yang benar-benar bekerja dicatat melalui **Absensi** dengan memilih decor lalu menekan **Absen Masuk**.

**Q: Mengapa saya tidak bisa menambah atau menghapus langkah?**
A: Hanya Owner/Admin yang dapat mengubah struktur langkah. Selain itu, perubahan dikunci jika decor berada di luar jadwal kerja.

**Q: Apakah membuat langkah otomatis membuat saya dianggap bekerja?**
A: Tidak. Membuat atau melihat langkah tidak mencatat kehadiran. Kehadiran hanya tercatat setelah Anda melakukan **Absen Masuk** dan mengonfirmasi pernyataan kejujuran.

**Q: Bagaimana cara menambahkan anggota tim baru?**
A: Buka **Pengaturan → Tim & Akses → + Tambah User** (hanya Owner yang bisa).

---

## 📞 Bantuan

Jika mengalami kendala:

1. Periksa apakah Anda login dengan role yang benar
2. Pastikan browser mendukung localStorage
3. Hubungi admin/owner tim Anda

---

## 14. Alur Kerja Lengkap yang Disarankan

Gunakan urutan berikut untuk setiap project agar data operasional rapi dan mudah diaudit.

### Sebelum Hari Pengerjaan

1. Owner/Admin membuat **Decor** dan mengisi nama, klien, lokasi, tanggal event, serta jadwal kerja.
2. Owner/Admin memilih decor tersebut sebagai **Decor Aktif**.
3. Owner/Admin membuka **Tugas** dan membuat langkah kerja dalam urutan yang masuk akal.
4. Gunakan template untuk langkah rutin, lalu tambahkan langkah khusus project bila diperlukan.
5. Pastikan nama langkah singkat, jelas, dan tidak mencantumkan nama pekerja.

### Saat Tim Mulai Bekerja

1. Setiap crew memilih decor yang benar dari menu **Current Decor**.
2. Crew membuka **Absensi**, memeriksa jadwal, lalu menekan **Absen Masuk**.
3. Crew membaca dan mencentang pernyataan kejujuran pada dialog konfirmasi.
4. Tim menggunakan halaman **Tugas** sebagai checklist bersama.
5. Crew mencatat perkembangan nyata di **Kegiatan** dan melampirkan foto di **Dokumentasi** bila diperlukan.

### Saat Pekerjaan Selesai

1. Crew memastikan pekerjaan pada decor sudah selesai.
2. Crew membuka **Absensi** dan menekan tombol **Selesai** pada decor yang sama.
3. Sistem mencatat waktu keluar dan menghitung durasi kerja.
4. Owner/Admin memeriksa rekap tim, kegiatan, dokumentasi, pengeluaran, dan laporan.

### Jika Terjadi Kendala

- Salah memilih decor: jangan lanjut mencatat; kembali ke menu Decor dan pilih project yang benar.
- Tidak dapat absen: periksa tanggal, jadwal kerja, dan apakah sesi pada decor tersebut sudah tercatat.
- Salah waktu absensi: ajukan koreksi dengan alasan yang jelas melalui tab **Koreksi**.
- Data operasional tidak sesuai: laporkan kepada Owner/Admin sebelum data dipakai untuk laporan.
- Tombol ikon tidak jelas: arahkan kursor untuk melihat tooltip, atau gunakan label tombol yang tersedia. Pada ponsel, area tombol aksi dibuat lebih besar agar mudah disentuh.

---

> **Catatan:** Panduan ini berlaku untuk sistem BLUDECOR versi terbaru.
> Terakhir diperbarui: September 2026
