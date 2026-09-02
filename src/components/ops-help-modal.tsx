'use client';

import React, { useMemo, useState } from 'react';
import {
  Search, ChevronDown, HelpCircle, BookOpen,
  CalendarRange, ListChecks, Clock4, Wallet,
  Image, ClipboardList, TrendingUp, Settings, FileText,
  AlertTriangle, CheckCircle2, Lightbulb,
  Shield, Zap, X,
} from 'lucide-react';
import { useOps } from '@/lib/ops/store';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

/* ─── Types ──────────────────────────────────────────────────────────────── */
interface HelpArticle {
  id: string;
  title: string;
  icon: React.ReactNode;
  color: string;
  roles: ('owner' | 'admin' | 'freelancer')[];
  sections: HelpSection[];
}

interface HelpSection {
  title: string;
  content?: string;
  steps?: string[];
  tips?: string[];
  warnings?: string[];
  roleNotes?: { role: string; note: string }[];
}

/* ─── Tab definitions ─────────────────────────────────────────────────── */
const HELP_TABS = [
  { value: 'all', label: 'Semua', icon: BookOpen },
  { value: 'mulai', label: 'Memulai', icon: Zap },
  { value: 'decor', label: 'Decor', icon: CalendarRange },
  { value: 'tugas', label: 'Tugas', icon: ListChecks },
  { value: 'absensi', label: 'Absensi', icon: Clock4 },
  { value: 'kegiatan', label: 'Kegiatan', icon: ClipboardList },
  { value: 'dokumentasi', label: 'Dokumentasi', icon: Image },
  { value: 'keuangan', label: 'Keuangan', icon: Wallet },
  { value: 'laporan', label: 'Laporan', icon: FileText },
  { value: 'analisa', label: 'Analisa', icon: TrendingUp },
  { value: 'pengaturan', label: 'Pengaturan', icon: Settings },
] as const;

type HelpTab = typeof HELP_TABS[number]['value'];

/* ─── Help Articles Data ───────────────────────────────────────────────── */
const ARTICLES: HelpArticle[] = [
  {
    id: 'memulai',
    title: 'Memulai & Login',
    icon: <Zap size={16} />,
    color: 'bg-gradient-to-br from-amber-500 to-orange-600',
    roles: ['owner', 'admin', 'freelancer'],
    sections: [
      {
        title: 'Cara Login ke Sistem',
        content: 'BLUDECOR diakses melalui browser. Pastikan Anda memiliki akun yang sudah dibuat oleh Owner.',
        steps: [
          'Buka halaman login di browser Anda',
          'Masukkan Username yang sudah didaftarkan',
          'Klik tombol "Masuk" atau tekan Enter',
          'Anda akan diarahkan ke Dashboard',
        ],
        tips: [
          'Gunakan Chrome atau Firefox untuk pengalaman terbaik',
          'Data tersimpan di browser (localStorage), jadi gunakan browser yang sama untuk data yang sama',
          'Jika data hilang, kemungkinan Anda menggunakan browser/device yang berbeda',
        ],
      },
      {
        title: 'Memahami Dashboard',
        content: 'Dashboard adalah halaman utama yang menampilkan ringkasan semua aktivitas Anda.',
        steps: [
          'Lihat sapaan di bagian atas — itu nama Anda',
          'Quick Access: Absensi, Decor, dan Tugas — klik untuk akses cepat',
          'Jika Anda Owner, lihat card "Keuangan Bulan Ini" untuk omzet, pengeluaran, dan profit',
          'Di bawah itu, lihat "Decor Aktif" untuk progress project yang sedang dikerjakan',
          'Scroll ke bawah untuk melihat "Jam Kerja" dan "Aktivitas Terbaru"',
        ],
        roleNotes: [
          { role: 'Owner/Admin', note: 'Lihat semua data tim, termasuk jam kerja dan aktivitas semua freelancer' },
          { role: 'Freelancer', note: 'Hanya melihat data diri sendiri dan decor yang ditugaskan' },
        ],
      },
      {
        title: 'Memilih Decor (Project Aktif)',
        content: 'Sebelum mengerjakan tugas, kegiatan, atau dokumentasi, Anda harus memilih decor yang sedang dikerjakan.',
        steps: [
          'Di header (bagian atas), cari dropdown "Pilih decor"',
          'Klik dropdown dan pilih decor yang ingin Anda kerjakan',
          'Decor yang dipilih akan menjadi context untuk semua halaman',
          'Anda bisa mengganti decor kapan saja',
        ],
        tips: [
          'Jika tidak ada decor yang muncul, berarti belum ada decor aktif',
          'Freelancer hanya melihat decor yang punya tugas untuk mereka',
          'Pilih decor yang benar agar data tercatat dengan tepat',
        ],
      },
    ],
  },
  {
    id: 'decor',
    title: 'Decor / Proyek',
    icon: <CalendarRange size={16} />,
    color: 'bg-gradient-to-br from-indigo-500 to-blue-700',
    roles: ['owner', 'admin', 'freelancer'],
    sections: [
      {
        title: 'Apa Itu Decor?',
        content: 'Decor adalah pusat data sistem — setiap event dekorasi tercatat sebagai "Decor" atau "Proyek". Semua tugas, kegiatan, dokumentasi, dan pengeluaran terkait dengan decor tertentu.',
      },
      {
        title: 'Status Decor',
        content: 'Setiap decor memiliki status yang menunjukkan progression pengerjaan:',
        tips: [
          'Draf → Baru dibuat, belum ada persiapan',
          'Persiapan → Sedang dipersiapkan (material, logistik)',
          'Siap → Sudah siap untuk dikerjakan di lokasi',
          'Sedang Berjalan → Sedang dikerjakan di lokasi event',
          'Selesai → Pengerjaan selesai',
          'Dibatalkan → Project dibatalkan',
        ],
      },
      {
        title: 'Cara Membuat Decor Baru',
        content: 'Hanya Owner dan Admin yang bisa membuat decor baru.',
        steps: [
          'Buka halaman Decor dari sidebar atau quick access',
          'Klik tombol "+ Tambah Decor" di pojok kanan atas',
          'Isi Nama Decor (wajib) — contoh: "Pernikahan Rina & Aldi"',
          'Isi Klien — nama klien yang memesan',
          'Pilih Kategori — contoh: Pernikahan, Ulang Tahun, Acara Perusahaan',
          'Isi Tanggal Event — tanggal pelaksanaan',
          'Pilih Status — biasanya mulai dari "Draf"',
          'Isi Lokasi — tempat event berlangsung',
          'Isi Nilai Proyek/Omzet — nominal dalam Rupiah (tanpa simbol Rp)',
          'Isi Catatan (opsional) — tema, permintaan khusus, dll',
          'Klik "Buat Decor" untuk menyimpan',
        ],
        warnings: [
          'Nama Decor wajib diisi, field lain opsional',
          'Nilai Proyek hanya angka, tanpa simbol Rp atau titik',
        ],
      },
      {
        title: 'Cara Mengedit & Menghapus Decor',
        steps: [
          'Klik ikon ✏️ pada card decor untuk mengedit',
          'Klik ikon 🗑️ pada card decor untuk menghapus',
          'Klik tombol "Pilih" untuk menjadikan decor sebagai active',
        ],
        warnings: [
          'Hapus decor akan menghapus semua tugas, kegiatan, dan dokumentasi terkait',
          'Pertimbangkan untuk mengubah status ke "Dibatalkan" alih-alih menghapus',
        ],
      },
      {
        title: 'Filter & Pencarian',
        steps: [
          'Gunakan tab status di atas untuk filter berdasarkan status',
          'Gunakan kolom pencarian untuk mencari berdasarkan nama, klien, atau lokasi',
          'Gunakan pagination di bawah jika ada banyak decor',
        ],
      },
    ],
  },
  {
    id: 'tugas',
    title: 'Daftar Tugas',
    icon: <ListChecks size={16} />,
    color: 'bg-gradient-to-br from-amber-500 to-yellow-600',
    roles: ['owner', 'admin', 'freelancer'],
    sections: [
      {
        title: 'Apa Itu Halaman Tugas?',
        content: 'Halaman Tugas berisi daftar pekerjaan yang harus dikerjakan untuk decor aktif.',
      },
      {
        title: 'Status Tugas',
        tips: [
          'Belum → Belum dikerjakan',
          'Dikerjakan → Sedang dalam proses pengerjaan',
          'Selesai → Sudah selesai dikerjakan',
          'Terhambat → Ada kendala yang menghalangi pengerjaan',
        ],
      },
      {
        title: 'Menambah Tugas (Owner/Admin)',
        steps: [
          'Pastikan ada Decor Aktif yang dipilih di header',
          'Di panel kanan, isi "Nama Kegiatan"',
          'Pilih Status awal (biasanya "Belum")',
          'Pilih "Assign ke" — anggota tim yang akan mengerjakan',
          'Klik "+ Tambah"',
        ],
      },
      {
        title: 'Menambah dari Template (Owner/Admin)',
        steps: [
          'Di bagian "Template Kegiatan", klik salah satu tombol template',
          'Tugas otomatis ditambahkan ke decor aktif',
          'Edit status atau assignee setelah ditambahkan jika perlu',
        ],
      },
      {
        title: 'Mengubah Status & Assignee',
        steps: [
          'Klik dropdown Status pada tugas untuk mengubah status',
          'Klik dropdown Assignee untuk mengubah penanggung jawab',
          'Klik ☐ (checkbox) untuk quick toggle selesai/belum',
        ],
        roleNotes: [
          { role: 'Owner/Admin', note: 'Bisa menambah, menghapus, mengubah status dan assignee' },
          { role: 'Freelancer', note: 'Hanya melihat tugas yang ditugaskan, bisa menandai selesai' },
        ],
      },
    ],
  },
  {
    id: 'absensi',
    title: 'Absensi',
    icon: <Clock4 size={16} />,
    color: 'bg-gradient-to-br from-emerald-500 to-green-600',
    roles: ['owner', 'admin', 'freelancer'],
    sections: [
      {
        title: 'Apa Itu Absensi?',
        content: 'Pencatatan kehadiran harian. Self-report — tidak wajib, tapi setiap data harus jujur & bisa dipertanggungjawabkan.',
      },
      {
        title: 'Cara Absen Masuk (Freelancer)',
        steps: [
          'Buka halaman Absensi',
          'Pastikan tab "Status" aktif',
          'Klik tombol "Hadir" (hijau besar)',
          'Waktu masuk otomatis tercatat sesuai jam server',
        ],
        warnings: [
          'Absensi hanya bisa dilakukan untuk hari ini',
          'Anda tidak bisa mengedit waktu absen secara manual',
        ],
      },
      {
        title: 'Cara Absen Keluar & Tidak Bekerja',
        steps: [
          'Klik "Selesai" (biru) untuk absen keluar',
          'Klik "Tidak Bekerja Hari Ini" jika tidak bekerja',
          'Klik "Ubah ke Hadir" jika salah absen',
        ],
      },
      {
        title: 'Fitur Owner/Admin',
        tips: [
          'Tab Rekap → Lihat total jam kerja semua freelancer',
          'Tab Koreksi → Approve/tolak koreksi absensi',
          'Tab Audit → Log semua aktivitas absensi',
          'Flags → Sistem mendeteksi anomali (3+ koreksi, jam aneh, durasi pendek)',
        ],
      },
    ],
  },
  {
    id: 'kegiatan',
    title: 'Kegiatan / Aktivitas',
    icon: <ClipboardList size={16} />,
    color: 'bg-gradient-to-br from-purple-500 to-violet-600',
    roles: ['owner', 'admin', 'freelancer'],
    sections: [
      {
        title: 'Cara Mencatat Kegiatan',
        steps: [
          'Buka halaman Kegiatan',
          'Decor otomatis dipilih (sesuai Decor Aktif)',
          'Pilih Jenis Kegiatan — contoh: "Pemasangan"',
          'Isi Kegiatan — jelaskan apa yang dikerjakan',
          'Pilih Status: Selesai, Sedang Dikerjakan, Terhambat, atau Pending',
          '(Opsional) Hubungkan dengan Tugas yang relevan',
          '(Opsional) Upload Foto proses pengerjaan',
          'Klik "Simpan Kegiatan"',
        ],
      },
      {
        title: 'Tips',
        tips: [
          'Waktu pencatatan otomatis (server time)',
          'Upload foto sebagai bukti pengerjaan',
          'Catat secara berkala, jangan menunggu selesai',
        ],
      },
    ],
  },
  {
    id: 'dokumentasi',
    title: 'Dokumentasi (Foto)',
    icon: <Image size={16} />,
    color: 'bg-gradient-to-br from-pink-500 to-rose-600',
    roles: ['owner', 'admin', 'freelancer'],
    sections: [
      {
        title: 'Cara Upload Foto',
        steps: [
          'Buka halaman Dokumentasi',
          'Pastikan Decor Aktif sudah dipilih',
          'Klik "+ Tambah Foto"',
          'Pilih file foto dari komputer',
          'Isi Keterangan — contoh: "Backdrop pelaminan"',
          'Klik "Simpan"',
        ],
      },
      {
        title: 'Menghapus Foto',
        steps: [
          'Arahkan mouse ke foto',
          'Klik ikon 🗑️ yang muncul di pojok kanan atas',
        ],
        roleNotes: [
          { role: 'Owner/Admin', note: 'Bisa menghapus foto siapa saja' },
          { role: 'Freelancer', note: 'Hanya bisa menghapus foto sendiri' },
        ],
      },
    ],
  },
  {
    id: 'keuangan',
    title: 'Pengeluaran',
    icon: <Wallet size={16} />,
    color: 'bg-gradient-to-br from-yellow-500 to-amber-600',
    roles: ['owner', 'admin'],
    sections: [
      {
        title: 'Cara Menambah Pengeluaran',
        steps: [
          'Klik tombol "+ Tambah"',
          'Isi Keterangan (wajib) — contoh: "BBM kendaraan"',
          'Pilih Kategori — dari dropdown',
          'Isi Nominal (wajib) — jumlah dalam Rupiah',
          'Pilih Decor — kaitkan dengan project (opsional)',
          'Isi Tanggal — tanggal pengeluaran',
          'Klik "Tambah"',
        ],
        warnings: [
          'Hanya Owner dan Admin yang bisa mengakses',
          'Nominal hanya angka, tanpa simbol Rp',
        ],
      },
      {
        title: 'Kategori Pengeluaran',
        tips: [
          'Transportasi & Logistik → BBM, Parkir, Tol, Sewa Kendaraan',
          'Material Decor → Bunga, Kain, Backdrop, Kayu, Lighting',
          'Tenaga Kerja → Freelancer, Harian, Helper, Driver, Crew',
          'Operasional Kantor → Listrik, Internet, Sewa, ATK',
          'Lainnya → Konsumsi, Dokumentasi, Administrasi',
        ],
      },
      {
        title: 'Filter & Ringkasan',
        tips: [
          'Filter bulan di dropdown pojok kanan atas',
          'Filter kategori dengan tab di atas daftar',
          'Pie chart menunjukkan proporsi per grup',
          'Stat cards: Total, Transaksi, Kategori Terbesar, Terikat Decor',
        ],
      },
    ],
  },
  {
    id: 'laporan',
    title: 'Laporan Bulanan',
    icon: <FileText size={16} />,
    color: 'bg-gradient-to-br from-teal-500 to-cyan-600',
    roles: ['owner', 'admin'],
    sections: [
      {
        title: 'Cara Membaca Laporan',
        tips: [
          'Stat Cards → Total Decor, Omzet, Pengeluaran, Profit',
          'Tabel Profit per Decor → Omzet, Pengeluaran, Profit, Margin per project',
          'Chart → Omzet vs Pengeluaran per decor',
          'Jam Kerja → Total jam kerja semua freelancer',
        ],
        warnings: [
          'Hanya Owner dan Admin yang bisa mengakses',
        ],
      },
      {
        title: 'Tips',
        tips: [
          'Profit positif (hijau) = project menguntungkan',
          'Profit negatif (merah) = project rugi',
          'Margin tinggi (>30%) = project efisien',
          'Ganti bulan dengan tombol ◀ ▶',
        ],
      },
    ],
  },
  {
    id: 'analisa',
    title: 'Analisa / Analytics',
    icon: <TrendingUp size={16} />,
    color: 'bg-gradient-to-br from-orange-500 to-red-600',
    roles: ['owner', 'admin'],
    sections: [
      {
        title: 'Fitur Analisa',
        tips: [
          'Insight Otomatis → Ringkasan perubahan dari bulan ke bulan',
          'Stat Cards → Decor, Profit, Jam Kerja, Freelancer Aktif',
          'Chart 6 Bulan → Omzet vs Pengeluaran, Tren Profit',
          'Tabel Performa → Perbandingan 6 bulan',
        ],
        warnings: [
          'Hanya Owner dan Admin yang bisa mengakses',
        ],
      },
      {
        title: 'Tips Membaca',
        tips: [
          'Perhatikan tren naik/turun, bukan hanya angka absolute',
          'Profit konsisten naik = bisnis sehat',
          'Omzet naik tapi profit turun = pengeluaran perlu dikontrol',
        ],
      },
    ],
  },
  {
    id: 'pengaturan',
    title: 'Pengaturan',
    icon: <Settings size={16} />,
    color: 'bg-gradient-to-br from-slate-500 to-gray-700',
    roles: ['owner', 'admin'],
    sections: [
      {
        title: 'Tab: Tim & Akses',
        steps: [
          'Menambah User: Klik "+ Tambah User" → Isi data → Klik "Tambah User"',
          'Mengubah Role: Klik dropdown Role pada nama anggota',
          'Mengaktifkan/Menonaktifkan: Gunakan saklar (toggle)',
          'Menghapus: Klik ikon 🗑️ (tidak bisa hapus diri sendiri)',
        ],
        warnings: [
          'Hanya Owner yang bisa mengubah pengaturan sistem',
        ],
      },
      {
        title: 'Tab: Jenis Kegiatan & Template',
        steps: [
          'Menambah: Ketik nama → Klik "+ Tambah" atau Enter',
          'Menghapus: Klik ikon 🗑️ → Konfirmasi',
        ],
      },
      {
        title: 'Tab: Sistem',
        tips: [
          'Nama Aplikasi → Ganti nama sistem',
          'Absensi Wajib → Direkomendasikan NONAKTIF',
        ],
      },
    ],
  },
];

/* ─── FAQ Data ────────────────────────────────────────────────────────────── */
const FAQ_DATA = [
  { q: 'Data saya hilang setelah ganti browser?', a: 'Data tersimpan di browser (localStorage). Gunakan browser yang sama, atau hubungi admin.' },
  { q: 'Saya salah absen, bagaimana cara memperbaiki?', a: 'Freelancer ajukan Koreksi ke admin. Admin/Owner bisa langsung edit atau hapus session.' },
  { q: 'Saya tidak bisa menghapus pengeluaran?', a: 'Pastikan Anda login sebagai Owner atau Admin.' },
  { q: 'Decor tidak muncul di Tugas?', a: 'Pastikan decor sudah dipilih sebagai Decor Aktif di header.' },
  { q: 'Bagaimana cara melihat profit per project?', a: 'Buka halaman Laporan, lihat tabel "Rekap Profit per Decor".' },
  { q: 'Siapa yang bisa melihat audit log?', a: 'Hanya Owner dan Admin.' },
  { q: 'Apakah freelancer bisa melihat data keuangan?', a: 'Tidak. Freelancer hanya melihat data yang relevan dengan tugas mereka.' },
  { q: 'Bagaimana cara menambah anggota tim?', a: 'Buka Pengaturan → Tim & Akses → + Tambah User (hanya Owner).' },
];

/* ─── Role Colors ─────────────────────────────────────────────────────────── */
const ROLE_COLORS: Record<string, string> = {
  owner: 'bg-gold/15 text-gold',
  admin: 'bg-sky-100 text-sky-700',
  freelancer: 'bg-emerald-100 text-emerald-700',
};

/* ─── Accordion Component ─────────────────────────────────────────────────── */
function AccordionItem({ title, children, defaultOpen = false }: {
  title: string; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-slate-100 rounded-xl overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-50 transition-colors">
        <span className="text-sm font-bold text-navy">{title}</span>
        <ChevronDown size={16} className={cn("text-slate-400 transition-transform shrink-0", open && "rotate-180")} />
      </button>
      {open && <div className="px-4 pb-4 pt-1 border-t border-slate-50">{children}</div>}
    </div>
  );
}

/* ─── Article Card ────────────────────────────────────────────────────────── */
function ArticleCard({ article }: { article: HelpArticle }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center gap-3 p-4 text-left hover:bg-slate-50/50 transition-colors">
        <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center text-white shrink-0", article.color)}>
          {article.icon}
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-headline font-bold text-navy">{article.title}</h4>
          <div className="flex flex-wrap gap-1 mt-1">
            {article.roles.map((r) => (
              <span key={r} className={cn("px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-widest", ROLE_COLORS[r])}>{r}</span>
            ))}
          </div>
        </div>
        <ChevronDown size={16} className={cn("text-slate-300 transition-transform shrink-0", expanded && "rotate-180 text-gold")} />
      </button>
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-slate-100 pt-3">
          {article.sections.map((section, idx) => (
            <div key={idx} className="space-y-2">
              <h5 className="text-xs font-bold text-navy flex items-center gap-2">
                <span className="h-4 w-4 rounded-full bg-navy text-white text-[8px] font-bold flex items-center justify-center shrink-0">{idx + 1}</span>
                {section.title}
              </h5>
              {section.content && <p className="text-[11px] text-slate-600 leading-relaxed pl-6">{section.content}</p>}
              {section.steps && section.steps.length > 0 && (
                <ol className="space-y-1.5 pl-6">
                  {section.steps.map((step, si) => (
                    <li key={si} className="flex items-start gap-2">
                      <span className="h-4 w-4 rounded-full bg-gold/15 text-gold text-[8px] font-bold flex items-center justify-center shrink-0 mt-0.5">{si + 1}</span>
                      <span className="text-[11px] text-slate-600 leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ol>
              )}
              {section.tips && section.tips.length > 0 && (
                <div className="pl-6 space-y-1">
                  {section.tips.map((tip, ti) => (
                    <div key={ti} className="flex items-start gap-1.5">
                      <CheckCircle2 size={12} className="text-emerald-500 shrink-0 mt-0.5" />
                      <span className="text-[10px] text-slate-600">{tip}</span>
                    </div>
                  ))}
                </div>
              )}
              {section.warnings && section.warnings.length > 0 && (
                <div className="pl-6 space-y-1">
                  {section.warnings.map((w, wi) => (
                    <div key={wi} className="flex items-start gap-1.5 rounded-lg bg-amber-50 border border-amber-200 px-2.5 py-1.5">
                      <AlertTriangle size={12} className="text-amber-500 shrink-0 mt-0.5" />
                      <span className="text-[10px] text-amber-700 font-medium">{w}</span>
                    </div>
                  ))}
                </div>
              )}
              {section.roleNotes && section.roleNotes.length > 0 && (
                <div className="pl-6 space-y-1">
                  {section.roleNotes.map((rn, ri) => (
                    <div key={ri} className="flex items-start gap-1.5">
                      <Shield size={12} className="text-navy shrink-0 mt-0.5" />
                      <span className="text-[10px] text-slate-600">
                        <span className="font-bold text-navy">{rn.role}:</span> {rn.note}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Main Modal Component ────────────────────────────────────────────────── */
export function OpsHelpModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { currentUser } = useOps();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<HelpTab>('all');

  const isManager = currentUser.role === 'owner' || currentUser.role === 'admin';

  const filteredArticles = useMemo(() => {
    let articles = ARTICLES.filter((a) => a.roles.includes(currentUser.role));
    if (activeTab !== 'all') {
      const tabMap: Record<string, string> = {
        mulai: 'memulai', decor: 'decor', tugas: 'tugas', absensi: 'absensi',
        kegiatan: 'kegiatan', dokumentasi: 'dokumentasi', keuangan: 'keuangan',
        laporan: 'laporan', analisa: 'analisa', pengaturan: 'pengaturan',
      };
      articles = articles.filter((a) => a.id === tabMap[activeTab]);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      articles = articles.filter((a) => {
        const titleMatch = a.title.toLowerCase().includes(q);
        const sectionMatch = a.sections.some((s) =>
          s.title.toLowerCase().includes(q) ||
          (s.content && s.content.toLowerCase().includes(q)) ||
          (s.steps && s.steps.some((st) => st.toLowerCase().includes(q))) ||
          (s.tips && s.tips.some((t) => t.toLowerCase().includes(q)))
        );
        return titleMatch || sectionMatch;
      });
    }
    return articles;
  }, [currentUser.role, activeTab, search]);

  const visibleTabs = useMemo(() => {
    if (isManager) return HELP_TABS;
    return HELP_TABS.filter((t) => !['keuangan', 'laporan', 'analisa', 'pengaturan'].includes(t.value));
  }, [isManager]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-8 md:pt-16">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => onOpenChange(false)} />

      {/* Modal */}
      <div className="relative w-full max-w-3xl mx-4 max-h-[85vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="shrink-0 bg-gradient-to-r from-[#0B2447] to-[#19376D] p-5 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <HelpCircle size={18} className="text-gold" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gold">Pusat Bantuan</span>
            </div>
            <button onClick={() => onOpenChange(false)} className="h-8 w-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
              <X size={16} />
            </button>
          </div>
          <h3 className="text-lg font-headline font-bold mb-2">Panduan Pengguna BLUDECOR</h3>
          <p className="text-xs text-slate-300 mb-4">Pelajari cara menggunakan setiap fitur sistem.</p>
          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari panduan... (contoh: absen, decor, pengeluaran)"
              className="w-full h-10 pl-9 pr-4 rounded-xl bg-white/10 border-white/20 text-white placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="shrink-0 flex gap-1 px-4 pt-3 pb-2 overflow-x-auto no-scrollbar border-b border-slate-100">
          {visibleTabs.map((t) => (
            <button
              key={t.value}
              onClick={() => setActiveTab(t.value as HelpTab)}
              className={cn(
                "flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border shrink-0 select-none",
                activeTab === t.value
                  ? "bg-navy text-white border-navy shadow-sm"
                  : "bg-white text-slate-400 border-slate-200 hover:border-slate-300"
              )}
            >
              <t.icon size={12} /> {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredArticles.length === 0 ? (
            <div className="text-center py-10">
              <Search size={24} className="mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-bold text-slate-500">Tidak ada panduan ditemukan</p>
              <p className="text-xs text-slate-400 mt-1">Coba kata kunci lain</p>
            </div>
          ) : (
            filteredArticles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))
          )}

          {/* FAQ */}
          <div className="mt-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-navy mb-3 flex items-center gap-2">
              <HelpCircle size={13} className="text-gold" /> Pertanyaan Umum
            </h4>
            <div className="space-y-2">
              {FAQ_DATA.map((faq, idx) => (
                <AccordionItem key={idx} title={faq.q} defaultOpen={idx === 0}>
                  <p className="text-[11px] text-slate-600 leading-relaxed">{faq.a}</p>
                </AccordionItem>
              ))}
            </div>
          </div>

          {/* Role Table */}
          <div className="mt-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-navy mb-3 flex items-center gap-2">
              <Shield size={13} /> Hak Akses per Role
            </h4>
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[8px] uppercase tracking-widest text-slate-400 border-b border-slate-100">
                    <th className="py-2 pr-2">Fitur</th>
                    <th className="py-2 pr-2 text-center">Owner</th>
                    <th className="py-2 pr-2 text-center">Admin</th>
                    <th className="py-2 text-center">Freelancer</th>
                  </tr>
                </thead>
                <tbody className="text-[10px]">
                  {[
                    { f: 'Dashboard', o: '✅ Full', a: '✅ Full', fl: '✅ Sendiri' },
                    { f: 'Decor', o: '✅ CRUD', a: '✅ CRUD', fl: '👁️ Lihat' },
                    { f: 'Tugas', o: '✅ CRUD', a: '✅ CRUD', fl: '✅ Status' },
                    { f: 'Absensi', o: '✅ Tim', a: '✅ Tim', fl: '✅ Sendiri' },
                    { f: 'Kegiatan', o: '✅ Semua', a: '✅ Semua', fl: '✅ Sendiri' },
                    { f: 'Dokumentasi', o: '✅ Upload', a: '✅ Upload', fl: '✅ Sendiri' },
                    { f: 'Pengeluaran', o: '✅ CRUD', a: '✅ CRUD', fl: '❌' },
                    { f: 'Laporan', o: '✅ Full', a: '✅ Full', fl: '❌' },
                    { f: 'Analisa', o: '✅ Full', a: '✅ Full', fl: '❌' },
                    { f: 'Pengaturan', o: '✅ Full', a: '⚠️ Batas', fl: '❌' },
                  ].map((r, i) => (
                    <tr key={i} className="border-b border-slate-50">
                      <td className="py-2 pr-2 font-semibold text-navy">{r.f}</td>
                      <td className="py-2 pr-2 text-center text-slate-600">{r.o}</td>
                      <td className="py-2 pr-2 text-center text-slate-600">{r.a}</td>
                      <td className="py-2 text-center text-slate-600">{r.fl}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Contact */}
          <div className="mt-4 rounded-xl bg-gradient-to-r from-gold/10 to-amber-50 border border-gold/20 p-4 flex items-start gap-3">
            <Lightbulb size={18} className="text-gold shrink-0 mt-0.5" />
            <div>
              <h5 className="text-xs font-bold text-navy">Butuh Bantuan Lebih Lanjut?</h5>
              <p className="text-[11px] text-slate-500 mt-0.5">Hubungi Owner atau Admin tim Anda untuk bantuan teknis atau pembuatan akun baru.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
