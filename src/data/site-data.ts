
import { 
  Search, CheckCircle2, LayoutDashboard, Settings, ImageIcon, Briefcase, MessageSquare, PenTool, Award, Gem, Clock, Sparkles, Calendar
} from 'lucide-react';

export const siteConfig = {
  name: "BluDecor",
  tagline: "Arsitek Event Premium",
  phone: "081266465639",
  whatsapp: "https://wa.me/6281266465639",
  address: "Kota Padang, Sumatera Barat",
  instagram: "https://instagram.com/bludecor.id",
  tiktok: "https://www.tiktok.com/@bludecor.id"
};

export const heroData = {
  title: "Mewujudkan Momen Arsitektural",
  subtitle: "Desain dekorasi premium yang memadukan estetika bersih dengan presisi teknis untuk hari istimewa Anda di Kota Padang.",
  bgImage: "/hero.webp"
};

export const workflowSteps = [
  { icon: Search, title: "Analisis Visi", desc: "Mempelajari keinginan dan karakteristik ruang Anda secara mendalam." },
  { icon: PenTool, title: "Blueprint Teknis", desc: "Perancangan sketsa dan struktur dekorasi dengan perhitungan presisi." },
  { icon: CheckCircle2, title: "Eksekusi Halus", desc: "Implementasi dekorasi dengan standar kualitas tinggi, rapi, dan bersih." },
  { icon: Award, title: "Finalisasi Sempurna", desc: "Pemeriksaan detail akhir untuk memastikan kemewahan visual yang utuh." }
];

export const valueProps = [
  { icon: Gem, title: "Material Premium", desc: "Menggunakan aset dekorasi kualitas tertinggi untuk kemewahan visual maksimal." },
  { icon: Clock, title: "Pengerjaan Tepat Waktu", desc: "Kedisiplinan tinggi dalam jadwal instalasi demi kenyamanan acara Anda." },
  { icon: PenTool, title: "Desain Kustom", desc: "Perancangan unik yang menyesuaikan karakteristik arsitektural ruang Anda." },
  { icon: Sparkles, title: "Lokasi Bersih", desc: "Menjamin area acara tetap rapi dan bersih sebelum maupun sesudah eksekusi." }
];

export const miniFaqs = [
  { q: "Apakah ada biaya survei lokasi?", a: "Untuk area Kota Padang, tim arsitek kami menyediakan layanan survei lokasi secara gratis tanpa biaya tambahan." },
  { q: "Bagaimana sistem pembayarannya?", a: "Down Payment (DP) sebesar 50% untuk penguncian jadwal, dan pelunasan dilakukan paling lambat H-7 sebelum hari H." },
  { q: "Kapan sebaiknya melakukan pemesanan?", a: "Sangat disarankan melakukan pemesanan 1-2 bulan sebelumnya agar tim kami memiliki waktu riset dan fabrikasi maksimal." }
];

export const navLinks = [
  { label: 'Beranda', href: '/' },
  { label: 'Layanan', href: '/layanan' },
  { label: 'Portofolio', href: '/portfolio' },
  { label: 'Bantuan', href: '/bantuan' },
];

export const adminNavLinks = [
  { label: 'Dasbor', href: '/admin', icon: LayoutDashboard },
  { label: 'Portofolio', href: '/admin/portfolio', icon: ImageIcon },
  { label: 'Layanan', href: '/admin/services', icon: Briefcase },
  { label: 'Event', href: '/admin/events', icon: Calendar },
  { label: 'Testimoni', href: '/admin/testimonials', icon: MessageSquare },
  { label: 'Pengaturan', href: '/admin/settings', icon: Settings },
];

export const faqs = [
  { q: "Bagaimana proses reservasi?", a: "Proses dimulai dari konsultasi visi, analisis lokasi, hingga finalisasi desain dengan standar arsitektural yang presisi." },
  { q: "Apakah melayani luar kota?", a: "Ya, kami melayani seluruh area Sumatera Barat dengan standar logistik yang terjamin keamanannya." },
  { q: "Berapa lama waktu persiapan?", a: "Sangat disarankan untuk melakukan pemesanan minimal 30-60 hari sebelum acara untuk hasil teknis yang maksimal." }
];
