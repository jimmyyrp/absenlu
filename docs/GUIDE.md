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
- **Tim** — absensi, tugas, dan aktivitas freelancer
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

| Fitur | Akses |
|-------|-------|
| Dashboard | ✅ Lihat semua data, statistik keuangan |
| Absensi | ✅ Lihat & kelola semua, approve/koreksi, audit log |
| Decor | ✅ CRUD (Tambah, Edit, Hapus) |
| Tugas | ✅ CRUD, assign ke tim |
| Kegiatan | ✅ Lihat semua, hapus |
| Dokumentasi | ✅ Upload & hapus foto |
| Pengeluaran | ✅ CRUD |
| Laporan | ✅ Full akses |
| Analisa | ✅ Full akses |
| Pengaturan | ✅ Kelola user, sistem, template |

### 🛡️ Admin (Pengelola)
> Akses hampir sama dengan Owner, kecuali pengaturan sistem

| Fitur | Akses |
|-------|-------|
| Dashboard | ✅ Lihat semua data |
| Absensi | ✅ Lihat & kelola tim, approve/koreksi, audit |
| Decor | ✅ CRUD |
| Tugas | ✅ CRUD, assign ke tim |
| Kegiatan | ✅ Lihat semua, hapus |
| Dokumentasi | ✅ Upload & hapus foto |
| Pengeluaran | ✅ CRUD |
| Laporan | ✅ Full akses |
| Analisa | ✅ Full akses |
| Pengaturan | ⚠️ Terbatas (lihat data, ubah role) |

### 👷 Freelancer (Tim Lapangan)
> Akses terbatas — hanya untuk data yang ditugaskan

| Fitur | Akses |
|-------|-------|
| Dashboard | ✅ Lihat data sendiri & decor yang ditugaskan |
| Absensi | ✅ Absen sendiri (hanya hari ini) |
| Decor | 👁️ Lihat decor yang punya tugas untuk mereka |
| Tugas | ✅ Lihat & update status tugas yang ditugaskan |
| Kegiatan | ✅ Catat kegiatan sendiri |
| Dokumentasi | ✅ Upload foto sendiri |
| Pengeluaran | ❌ Tidak ada akses |
| Laporan | ❌ Tidak ada akses |
| Analisa | ❌ Tidak ada akses |
| Pengaturan | ❌ Tidak ada akses |

---

## 3. Dashboard (Beranda)

**URL:** `/ops`

Dashboard adalah halaman utama yang menampilkan ringkasan singkat.

### Yang Ditampilkan:

| Elemen | Keterangan |
|--------|------------|
| Greeting | Sapaan dengan nama Anda |
| Quick Access | Tombol cepat ke Absensi, Decor, dan Tugas |
| Keuangan (Owner) | Omzet, Pengeluaran, Profit bulan ini |
| Decor Aktif | Info decor yang sedang dipilih beserta progress |
| Jam Kerja | Total jam kerja Anda (freelancer) atau tim (owner/admin) |
| Aktivitas Terbaru | 5 aktivitas terakhir |

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

| Tab | Siapa yang Lihat | Fungsi |
|-----|-----------------|--------|
| **Status** | Semua | Absen masuk/keluar, lihat rekap harian |
| **Rekap** | Semua | Rekap jam kerja bulanan |
| **Koreksi** | Owner/Admin | Approve/tolak koreksi absensi |
| **Audit** | Owner/Admin | Log semua aktivitas absensi |

---

### 👷 Untuk Freelancer:

#### Absen Masuk (Hadir)
1. Buka halaman **Absensi**
2. Pastikan tab **Status** aktif
3. Klik tombol **🟢 Hadir** (hijau besar)
4. Waktu masuk otomatis tercatat sesuai jam server
5. Status berubah menjadi **"Sedang Bekerja"**

#### Absen Keluar (Selesai)
1. Setelah selesai bekerja, klik tombol **🔵 Selesai** (biru besar)
2. Waktu keluar otomatis tercatat
3. Durasi kerja otomatis dihitung

#### Tidak Bekerja Hari Ini
1. Jika hari ini tidak bekerja, klik **"Tidak Bekerja Hari Ini"**
2. Konfirmasi pada dialog yang muncul
3. Status berubah menjadi **"Tidak Bekerja"**

#### Mengubah Status
- Jika salah absen "Tidak Bekerja", klik **"Ubah ke Hadir"** untuk memperbaiki

**⚠️ Penting:**
- Absensi hanya bisa dilakukan untuk **hari ini**
- Freelancer **tidak bisa** melihat atau mengedit data orang lain
- Jika ada kesalahan waktu, ajukan **Koreksi** ke admin

---

### 🛡️ Untuk Owner/Admin:

#### Melihat Status Tim
1. Buka tab **Status**
2. Di kolom kanan, lihat **Rekap Tim** — semua freelancer dan status mereka
3. Summary di atas menunjukkan: Sedang Bekerja, Selesai, Tidak Bekerja, Tidak Mengisi, Perlu Ditinjau

#### Menghapus Session Absensi
1. Di rekap tim, klik **✕** (ikon X) di samping nama freelancer
2. Session akan dihapus

#### Flags / Perlu Ditinjau
Sistem otomatis mendeteksi anomali:
- Freelancer yang melakukan **≥3 koreksi** dalam sebulan
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
2. Lihat total jam kerja semua freelancer bulan ini

---

## 5. Decor / Proyek

**URL:** `/ops/decor`

Pusat data sistem — setiap event dekorasi tercatat sebagai "Decor".

### Status Decor:

| Status | Keterangan |
|--------|------------|
| **Draf** | Baru dibuat, belum ada persiapan |
| **Persiapan** | Sedang dipersiapkan |
| **Siap** | Sudah siap untuk dikerjakan |
| **Sedang Berjalan** | Sedang dikerjakan di lokasi |
| **Selesai** | Pengerjaan selesai |
| **Dibatalkan** | Project dibatalkan |

---

### 🛡️ Untuk Owner/Admin (Kelola Decor):

#### Membuat Decor Baru
1. Klik tombol **"+ Tambah Decor"** ( pojok kanan atas)
2. Isi formulir:
   - **Nama Decor** *(wajib)* — contoh: "Pernikahan Rina & Aldi"
   - **Klien** — nama klien
   - **Kategori** — pilih dari dropdown (Pernikahan, Ulang Tahun, dll)
   - **Tanggal Event** — tanggal pelaksanaan
   - **Status** — pilih status awal (biasanya "Draf")
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

### 👷 Untuk Freelancer:
- Hanya melihat decor yang **punya tugas** untuk mereka
- Klik **"Pilih"** untuk melihat detail tugas

---

## 6. Daftar Tugas (Todo)

**URL:** `/ops/todo`

Kelola daftar tugas untuk setiap decor yang aktif.

### Status Tugas:

| Status | Keterangan |
|--------|------------|
| **Belum** | Belum dikerjakan |
| **Dikerjakan** | Sedang dikerjakan |
| **Selesai** | Sudah selesai |
| **Terhambat** | Terkendala sesuatu |

---

### 🛡️ Untuk Owner/Admin:

#### Menambah Tugas Baru
1. Pastikan ada **Decor Aktif** dipilih
2. Di panel kanan, isi **Nama Kegiatan** — contoh: "Pasang pencahayaan"
3. Pilih **Status** awal (_biasanya "Belum"_)
4. **Assign ke** — pilih anggota tim yang mengerjakan
5. Klik **"+ Tambah"**

#### Menambah dari Template
1. Di bagian **Template Kegiatan**, klik salah satu tombol template
2. Tugas otomatis ditambahkan ke decor aktif
3. Edit status atau assignee setelah ditambahkan

#### Mengubah Status Tugas
1. Di daftar tugas, klik dropdown **Status** pada tugas yang dipilih
2. Pilih status baru

#### Mengubah Assignee
1. Klik dropdown **Assignee** pada tugas
2. Pilih anggota tim baru

#### Menandai Selesai (Quick Toggle)
1. Klik **☐ (checkbox)** di samping judul tugas
2. Status otomatis berubah menjadi "Selesai"

#### Menghapus Tugas
1. Klik ikon **🗑️** di samping tugas

#### Filter Berdasarkan Status
- Klik tab **Semua, Belum, Dikerjakan, Selesai, Terhambat** untuk filter

---

### 👷 Untuk Freelancer:
- Hanya melihat tugas yang **ditugaskan untuk mereka**
- Klik **☐** untuk menandai selesai
- melihat status badge (tidak bisa mengubah)

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

| Status | Keterangan |
|--------|------------|
| **Selesai** | Kegiatan sudah selesai |
| **Sedang Dikerjakan** | Masih dalam proses |
| **Terhambat** | Ada kendala |
| **Pending** | Ditunda |

---

### Semua Role (Freelancer, Admin, Owner):

#### Mencatat Kegiatan Baru
1. Buka halaman **Kegiatan**
2. Decor sudah otomatis dipilih (sesuai Decor Aktif)
3. Pilih **Jenis Kegiatan** — contoh: "Pemasangan"
4. Isi **Kegiatan** — jelaskan apa yang dikerjakan
5. Pilih **Status** kegiatan
6. *(Opsional)* Hubungkan dengan **Tugas** yang relevan
7. *(Opsional)* Tambahkan **Catatan** detail
8. *(Opsional)* Upload **Foto** proses pengerjaan
9. Klik **"Simpan Kegiatan"**

#### Melihat Riwayat
- Di panel kanan, lihat semua kegiatan yang sudah dicatat untuk decor aktif
- Gunakan **pagination** untuk navigasi

#### Menghapus Kegiatan
- Owner/Admin bisa menghapus kegiatan siapa saja
- Freelancer hanya bisa menghapus kegiatan sendiri
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
- Freelancer hanya bisa menghapus foto sendiri

---

## 9. Pengeluaran

**URL:** `/ops/pengeluaran`

Kelola biaya operasional, material, dan tenaga kerja.

> **⚠️ Hanya Owner & Admin yang bisa mengakses halaman ini.**

### Kategori Pengeluaran:

| Grup | Contoh Kategori |
|------|-----------------|
| **Transportasi & Logistik** | BBM, Parkir, Tol, Sewa Kendaraan, Kurir |
| **Material Decor** | Bunga, Kain, Backdrop, Kayu, Akrilik, Balon, Lighting |
| **Tenaga Kerja** | Freelancer, Harian, Helper, Driver, Crew, Lembur |
| **Operasional Kantor** | Listrik, Internet, Sewa, ATK, Maintenance |
| **Lainnya** | Konsumsi, Dokumentasi, Administrasi, Marketing |

---

### 🛡️ Untuk Owner/Admin:

#### Menambah Pengeluaran
1. Klik tombol **"+ Tambah"** (pojok kanan atas)
2. Isi formulir:
   - **Keterangan** *(wajib)* — contoh: "BBM kendaraan"
   - **Kategori** — pilih dari dropdown
   - **Nominal** *(wajib)* — jumlah dalam Rupiah
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

| Elemen | Keterangan |
|--------|------------|
| **Stat Cards** | Total Decor, Omzet, Pengeluaran, Profit |
| **Breakdown Pengeluaran** | Pie chart per grup kategori |
| **Pengeluaran per Kategori** | Bar chart detail per kategori |
| **Jam Kerja Freelancer** | Tabel jam kerja dan jumlah aktivitas |
| **Rekap Profit per Decor** | Tabel omzet, pengeluaran, profit, margin per decor |
| **Omzet vs Pengeluaran** | Bar chart per decor |

---

### 🛡️ Untuk Owner/Admin:

#### Mengganti Bulan
1. Klik tombol **◀** untuk bulan sebelumnya
2. Klik tombol **▶** untuk bulan berikutnya
3. Label bulan ditampilkan di tengah

#### Membaca Tabel Profit per Decor
| Kolom | Keterangan |
|-------|------------|
| Decor | Nama project dan kategori |
| Status | Status terkini decor |
| Omzet | Total nilai project |
| Pengeluaran | Total biaya yang tercatat |
| Profit | Omzet dikurangi pengeluaran |
| Margin | Persentase profit dari omzet |

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

| Elemen | Keterangan |
|--------|------------|
| **Insight Otomatis** | Ringkasan otomatis perubahan dari bulan ke bulan |
| **Performa Bulanan** | Tabel perbandingan 6 bulan (Decor, Omzet, Pengeluaran, Profit) |
| **Stat Cards** | Decor bulan ini, Profit, Jam Kerja, Freelancer Aktif |
| **Omzet vs Pengeluaran** | Bar chart 6 bulan |
| **Profit** | Line chart tren profit 6 bulan |

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
- **Jam Kerja:** Total jam kerja semua freelancer
- **Freelancer Aktif:** Berapa orang yang aktif bulan ini dari total anggota

---

## 12. Pengaturan

**URL:** `/ops/pengaturan`

Kelola user, kategori pekerjaan, dan konfigurasi sistem.

> **⚠️ Hanya Owner yang bisa mengubah pengaturan.**
> Admin bisa melihat data dan mengubah role user.

### Tab yang Tersedia:

| Tab | Fungsi |
|-----|--------|
| **Tim & Akses** | Kelola anggota tim dan hak akses |
| **Jenis Kegiatan** | Kelola daftar jenis kegiatan |
| **Template Tugas** | Kelola template tugas default |
| **Sistem** | Konfigurasi nama aplikasi dan opsi lain |

---

### 🔑 Tab: Tim & Akses

#### Menambah Anggota Tim
1. Klik **"+ Tambah User"**
2. Isi formulir:
   - **Nama Lengkap** *(wajib)*
   - **Username** *(wajib)* — untuk login
   - **Role** — Owner, Admin, atau Freelancer
   - **No. HP** *(opsional)*
3. Klik **"Tambah User"**

#### Mengedit Anggota
1. Klik ikon **✏️** pada baris anggota
2. Ubah data yang diperlukan
3. Klik **"Simpan"**

#### Mengubah Role
1. Di daftar anggota, klik dropdown **Role** pada nama yang dipilih
2. Pilih role baru (Owner / Admin / Freelancer)

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
A: Freelancer bisa ajukan **Koreksi** ke admin. Admin/Owner bisa langsung mengedit atau menghapus session di tab Status.

**Q: Saya tidak bisa menghapus pengeluaran?**
A: Pastikan Anda login sebagai **Owner** atau **Admin**.

**Q: Decor yang saya pilih tidak muncul di Tugas?**
A: Pastikan decor sudah dipilih sebagai **Decor Aktif**. Freelancer hanya melihat decor yang punya tugas untuk mereka.

**Q: Bagaimana cara melihat profit per project?**
A: Buka halaman **Laporan**, lihat tabel **Rekap Profit per Decor**.

**Q: Siapa yang bisa melihat audit log?**
A: Hanya **Owner** dan **Admin**.

**Q: Apakah freelancer bisa melihat data keuangan?**
A: **Tidak.** Freelancer hanya melihat data yang relevan dengan tugas mereka.

**Q: Bagaimana cara menambahkan anggota tim baru?**
A: Buka **Pengaturan → Tim & Akses → + Tambah User** (hanya Owner yang bisa).

---

## 📞 Bantuan

Jika mengalami kendala:
1. Periksa apakah Anda login dengan role yang benar
2. Pastikan browser mendukung localStorage
3. Hubungi admin/owner tim Anda

---

> **Catatan:** Panduan ini berlaku untuk sistem BLUDECOR versi terbaru.
> Terakhir diperbarui: September 2026
