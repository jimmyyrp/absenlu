import React from 'react';
import { Metadata } from 'next';
import {
  BookOpen, Users, ImageIcon, Briefcase, MessageSquare, Settings,
  Terminal, ShieldCheck, Trash2, Pencil, Plus, Heart, Phone,
  Link2, KeyRound, AlertTriangle, RefreshCw, HardDrive, ChevronRight
} from 'lucide-react';

/**
 * PanduanPage v1.0 - Help Center Blu Decor
 * Pusat panduan penggunaan situs publik dan Portal Admin untuk seluruh tim.
 */

const sections = [
  { id: 'pengunjung', label: 'Pengunjung', icon: Users },
  { id: 'masuk', label: 'Masuk Tim', icon: KeyRound },
  { id: 'karya', label: 'Kelola Karya', icon: ImageIcon },
  { id: 'katalog', label: 'Katalog Layanan', icon: Briefcase },
  { id: 'testimoni', label: 'Testimoni', icon: MessageSquare },
  { id: 'tim', label: 'Kelola Tim', icon: ShieldCheck },
  { id: 'pengaturan', label: 'Pengaturan', icon: Settings },
  { id: 'developer', label: 'Developer', icon: Terminal },
  { id: 'bantuan', label: 'Pemecahan Masalah', icon: AlertTriangle },
];

function SectionHeading({ icon: Icon, title, desc }: { icon: any, title: string, desc: string }) {
  return (
    <div className="flex items-start gap-4 pb-4 border-b border-slate-100">
      <div className="w-11 h-11 shrink-0 rounded-2xl bg-navy text-gold flex items-center justify-center shadow-lg">
        <Icon size={18} />
      </div>
      <div>
        <h2 className="text-base font-headline font-bold text-navy uppercase tracking-tight">{title}</h2>
        <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">{desc}</p>
      </div>
    </div>
  );
}

function Step({ n, title, children }: { n: number, title: string, children?: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="shrink-0 w-5 h-5 rounded-full bg-gold/15 text-gold text-[9px] font-black flex items-center justify-center mt-0.5">{n}</span>
      <div>
        <p className="text-[11px] font-bold text-navy uppercase tracking-wide">{title}</p>
        {children && <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">{children}</p>}
      </div>
    </li>
  );
}

export const metadata: Metadata = {
  title: 'Panduan Penggunaan | BluDecor',
  description: 'Pusat panduan lengkap penggunaan situs web dan Portal Admin BluDecor.',
};

export default function PanduanPage() {
  return (
    <div className="space-y-8 animate-fade-up text-left pb-20 w-full max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="bg-navy rounded-[2rem] p-8 md:p-10 text-white relative overflow-hidden">
        <BookOpen size={140} className="absolute -right-6 -bottom-8 text-white/5 rotate-12" />
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-gold text-[8px] font-black uppercase tracking-[0.3em]">
          <BookOpen size={10} /> Pusat Bantuan Internal
        </span>
        <h1 className="text-xl md:text-2xl font-headline font-bold uppercase tracking-tighter mt-4">Panduan Penggunaan Sistem</h1>
        <p className="text-[11px] text-white/50 max-w-lg mt-2 leading-relaxed">
          Referensi lengkap operasional BluDecor — mulai dari penjelajahan situs publik,
          penerbitan karya, hingga alat diagnostik untuk pengembang.
        </p>
      </div>

      {/* Quick Nav */}
      <div className="flex flex-wrap gap-2 -mt-2">
        {sections.map(s => (
          <a key={s.id} href={`#${s.id}`} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white border border-slate-100 shadow-sm hover:border-gold/40 hover:text-gold transition-all text-[8px] font-black uppercase tracking-widest text-navy">
            <s.icon size={11} /> {s.label}
          </a>
        ))}
      </div>

      {/* Pengunjung */}
      <section id="pengunjung" className="bg-white rounded-[2rem] border border-slate-50 shadow-sm p-7 md:p-9 space-y-5 scroll-mt-24">
        <SectionHeading icon={Users} title="Situs Publik (Pengunjung)" desc="Pengalaman pelanggan menjelajah katalog" />
        <ul className="space-y-3.5 list-none">
          <Step n={1} title="Menjelajah Karya">Halaman utama menampilkan sorotan; halaman Portfolio memuat seluruh arsip dengan filter Kategori dan Tema serta pencarian instan.</Step>
          <Step n={2} title="Detail Karya">Klik kartu karya untuk melihat galeri visual, estimasi harga, tema desain, dan tag spesifikasi.</Step>
          <Step n={3} title="Favorit">Tekan ikon bookmark pada kartu untuk menyimpan karya. Daftar favorit tersimpan di perangkat (tanpa akun) dan dapat dibuka lewat menu Favorit.</Step>
          <Step n={4} title="Konsultasi">Setiap karya memiliki tombol Konsultasi Sekarang yang membuka WhatsApp dengan pesan otomatis berisi nama karya.</Step>
          <Step n={5} title="Testimoni">Klien yang menerima tautan ulasan dapat meninggalkan testimoni tanpa perlu membuat akun.</Step>
        </ul>
      </section>

      {/* Masuk */}
      <section id="masuk" className="bg-white rounded-[2rem] border border-slate-50 shadow-sm p-7 md:p-9 space-y-5 scroll-mt-24">
        <SectionHeading icon={KeyRound} title="Masuk ke Portal Admin" desc="Otentikasi tim pengelola" />
        <ul className="space-y-3.5 list-none">
          <Step n={1} title="Buka Formulir Login">Di situs publik, tekan menu (tiga garis di kanan atas) lalu pilih Masuk Admin.</Step>
          <Step n={2} title="Isi Kredensial">Masukkan ID Pengguna dan Kode Rahasia yang diberikan administrator.</Step>
          <Step n={3} title="Peran (Role)">Staff: kelola karya & testimoni. Admin: akses penuh termasuk tim & pengaturan. Developer: semua akses + portal diagnostik.</Step>
          <Step n={4} title="Keluar">Gunakan tombol Keluar Sistem pada menu untuk mengakhiri sesi dengan aman.</Step>
        </ul>
      </section>

      {/* Karya */}
      <section id="karya" className="bg-white rounded-[2rem] border border-slate-50 shadow-sm p-7 md:p-9 space-y-5 scroll-mt-24">
        <SectionHeading icon={ImageIcon} title="Kelola Karya Portofolio" desc="Tambah, ubah, dan hapus konten inti" />
        <div className="grid md:grid-cols-3 gap-3">
          <div className="rounded-2xl bg-slate-50/70 p-4 space-y-2"><Plus size={14} className="text-gold" /><p className="text-[10px] font-black uppercase text-navy tracking-widest">Menerbitkan</p><p className="text-[10px] text-slate-500 leading-relaxed">Portal Admin → Portofolio → TERBITKAN. Wajib: Judul dan minimal 1 gambar.</p></div>
          <div className="rounded-2xl bg-slate-50/70 p-4 space-y-2"><Pencil size={14} className="text-blue-400" /><p className="text-[10px] font-black uppercase text-navy tracking-widest">Mengubah</p><p className="text-[10px] text-slate-500 leading-relaxed">Ikon pensil pada tabel, atau tombol Edit cepat di halaman detail karya.</p></div>
          <div className="rounded-2xl bg-slate-50/70 p-4 space-y-2"><Trash2 size={14} className="text-red-400" /><p className="text-[10px] font-black uppercase text-navy tracking-widest">Menghapus</p><p className="text-[10px] text-slate-500 leading-relaxed">Soft-delete: disembunyikan dari publik, retensi sampah 7 hari sebelum dihapus permanen.</p></div>
        </div>
        <div className="space-y-2 pt-1">
          <p className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-400">Catatan Penting Formulir</p>
          <ul className="space-y-1.5 text-[11px] text-slate-500 leading-relaxed list-disc pl-4 marker:text-gold">
            <li>Harga ditulis angka saja tanpa titik/koma (cth: <b>3500000</b>) — sistem menampilkan format Rp otomatis.</li>
            <li>Gambar otomatis dikompresi menjadi WebP; gunakan alat crop untuk memilih rasio Potret / Segiempat / Lanskap.</li>
            <li>Kategori, Sub-Kategori (tag), dan Tema bersifat opsional namun sangat disarankan agar filter publik bekerja.</li>
            <li>Setiap penyimpanan membersihkan cache situs secara otomatis — perubahan langsung terlihat publik.</li>
            <li>Gambar lama yang dibuang dari galeri ikut dibersihkan dari penyimpanan otomatis (tanpa file yatim).</li>
          </ul>
        </div>
      </section>

      {/* Katalog */}
      <section id="katalog" className="bg-white rounded-[2rem] border border-slate-50 shadow-sm p-7 md:p-9 space-y-5 scroll-mt-24">
        <SectionHeading icon={Briefcase} title="Katalog Layanan" desc="Struktur kategori, sub-kategori & tema" />
        <ul className="space-y-3.5 list-none">
          <Step n={1} title="Kategori Induk">Wadah besar seperti dekorasi pernikahan atau event korporat. Menjadi tab utama filter publik.</Step>
          <Step n={2} title="Sub-Kategori">Tag spesifik (cth: Pelaminan, Photobooth) dengan estimasi harga mulai; wajib punya induk.</Step>
          <Step n={3} title="Proteksi Otomatis">Nama duplikat ditolak. Item yang masih dipakai karya TIDAK dapat dihapus (Data Shield).</Step>
        </ul>
      </section>

      {/* Testimoni */}
      <section id="testimoni" className="bg-white rounded-[2rem] border border-slate-50 shadow-sm p-7 md:p-9 space-y-5 scroll-mt-24">
        <SectionHeading icon={MessageSquare} title="Testimoni & Token Ulasan" desc="Mengumpulkan ulasan klien tanpa akun" />
        <ul className="space-y-3.5 list-none">
          <Step n={1} title="Buat Tautan">Portal → Testimoni → buat token baru, tentukan kuota berapa kali tautan boleh dipakai.</Step>
          <Step n={2} title="Bagikan">Tekan ikon salin, kirim tautan ke klien via WhatsApp. Tautan berbentuk situs/review/kode-unik.</Step>
          <Step n={3} title="Pantau">Ulasan masuk tampil langsung di tabel beserta sisa kuota tokennya.</Step>
          <Step n={4} title="Cabut Akses">Hapus token kapan saja untuk memblokir penyalahgunaan tautan.</Step>
        </ul>
      </section>

      {/* Tim */}
      <section id="tim" className="bg-white rounded-[2rem] border border-slate-50 shadow-sm p-7 md:p-9 space-y-5 scroll-mt-24">
        <SectionHeading icon={ShieldCheck} title="Kelola Tim" desc="Registrasi dan otorisasi personel" />
        <ul className="space-y-1.5 text-[11px] text-slate-500 leading-relaxed list-disc pl-4 marker:text-gold">
          <li>ID Pengguna: huruf, angka, titik, garis bawah/garis hubung, tanpa spasi — otomatis huruf kecil.</li>
          <li>Kode Rahasia minimal 6 karakter; segera ganti bila terindikasi bocor (hubungi developer).</li>
          <li>Sistem menolak menghapus akun Anda sendiri, dan hanya developer yang boleh menghapus akun developer.</li>
          <li>Hapus massal tersedia melalui seleksi ganda pada tabel.</li>
        </ul>
      </section>

      {/* Pengaturan */}
      <section id="pengaturan" className="bg-white rounded-[2rem] border border-slate-50 shadow-sm p-7 md:p-9 space-y-5 scroll-mt-24">
        <SectionHeading icon={Settings} title="Pengaturan Situs" desc="Identitas bisnis & kontak global" />
        <p className="text-[11px] text-slate-500 leading-relaxed">
          Mengelola nomor WhatsApp, Instagram, TikTok, alamat, dan pesan pembuka konsultasi yang dipakai
          di seluruh halaman publik. Simpan sekali, seluruh situs diperbarui otomatis.
        </p>
      </section>

      {/* Developer */}
      <section id="developer" className="bg-white rounded-[2rem] border border-slate-50 shadow-sm p-7 md:p-9 space-y-5 scroll-mt-24">
        <SectionHeading icon={Terminal} title="Portal Developer" desc="Diagnostik, pemeliharaan & integritas data" />
        <div className="grid md:grid-cols-2 gap-3">
          <div className="rounded-2xl bg-purple-50/60 p-4 space-y-2"><HardDrive size={14} className="text-purple-500" /><p className="text-[10px] font-black uppercase text-navy tracking-widest">Audit Penyimpanan</p><p className="text-[10px] text-slate-600 leading-relaxed">Memindai bucket media: total file, terpakai, yatim (tak dirujuk DB), dan siap hapus (melewati masa tenggang 7 hari).</p></div>
          <div className="rounded-2xl bg-purple-50/60 p-4 space-y-2"><RefreshCw size={14} className="text-purple-500" /><p className="text-[10px] font-black uppercase text-navy tracking-widest">Pembersihan Aman</p><p className="text-[10px] text-slate-600 leading-relaxed">Purge hanya menyentuh file yatim berumur lebih dari 7 hari — data aktif dan arsip sampah tetap utuh.</p></div>
          <div className="rounded-2xl bg-purple-50/60 p-4 space-y-2"><Trash2 size={14} className="text-purple-500" /><p className="text-[10px] font-black uppercase text-navy tracking-widest">Retensi Data</p><p className="text-[10px] text-slate-600 leading-relaxed">Baris lunak-hapus (lebih dari 7 hari) dibersihkan via RPC pemeliharaan beserta relasinya.</p></div>
          <div className="rounded-2xl bg-purple-50/60 p-4 space-y-2"><Link2 size={14} className="text-purple-500" /><p className="text-[10px] font-black uppercase text-navy tracking-widest">Cadangan JSON</p><p className="text-[10px] text-slate-600 leading-relaxed">Ekspor snapshot seluruh tabel konten untuk dokumentasi/migrasi.</p></div>
        </div>
      </section>

      {/* Troubleshooting */}
      <section id="bantuan" className="bg-white rounded-[2rem] border border-slate-50 shadow-sm p-7 md:p-9 space-y-5 scroll-mt-24">
        <SectionHeading icon={AlertTriangle} title="Pemecahan Masalah" desc="Gejala umum & solusinya" />
        <div className="space-y-3">
          {[
            { q: 'Gambar tidak muncul / galat "402 Payment Required"', a: 'Berarti situs masih menjalankan versi lama yang bergantung kuota optimizer Vercel. Solusi: pastikan deploy versi terbaru berjalan (push sudah otomatis memicu build). Versi baru menampilkan gambar langsung tanpa kuota.' },
            { q: 'Menu mobile / tombol Masuk tampak aneh', a: 'Cache browser lama. Lakukan refresh paksa Ctrl+F5 (atau Clear Site Data). Bila persisten, kemungkinan deploy belum selesai.' },
            { q: 'Perubahan tidak tampil di halaman publik', a: 'Sistem membersihkan cache otomatis setelah simpan. Coba refresh paksa; bila masih, tunggu ±1 menit lalu muat ulang.' },
            { q: 'File penyimpanan menumpuk (file yatim)', a: 'Jalankan Audit Penyimpanan dari Portal Developer, tinjau hasilnya, lalu eksekusi pembersihan aman. Masa tenggang 7 hari membuat proses ini bebas risiko.' },
            { q: 'Lupa kode rahasia tim', a: 'Hubungi developer/admin lain untuk mereset lewat basis data (tabel users). Jangan bagikan kode via grup umum.' },
            { q: 'Tombol Edit/Hapus tidak terlihat di halaman publik', a: 'Fitur manajemen cepat hanya muncul setelah login sebagai tim. Pastikan sudah Masuk Admin dari menu.' },
          ].map((f, i) => (
            <details key={i} className="group rounded-2xl border border-slate-100 bg-slate-50/50 open:bg-white transition-colors">
              <summary className="flex items-center gap-2 cursor-pointer select-none px-5 py-4 text-[11px] font-bold text-navy uppercase tracking-wide [&::-webkit-details-marker]:hidden">
                <ChevronRight size={12} className="text-gold group-open:rotate-90 transition-transform shrink-0" /> {f.q}
              </summary>
              <p className="px-5 pb-5 pl-11 text-[11px] text-slate-500 leading-relaxed">{f.a}</p>
            </details>
          ))}
        </div>
        <div className="flex items-start gap-3 rounded-2xl bg-gold/10 p-4">
          <Phone size={14} className="text-gold shrink-0 mt-0.5" />
          <p className="text-[10px] text-navy/70 leading-relaxed">
            Masih ada kendala? Hubungi developer sistem melalui kanal internal tim. Sertakan langkah reproduksi,
            halaman yang bermasalah, dan tangkapan layar bila memungkinkan.
          </p>
        </div>
      </section>
    </div>
  );
}
