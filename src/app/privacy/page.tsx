
"use client";

import React from 'react';
import { 
  ShieldCheck, ArrowLeft, Database, UserCheck, 
  Lock, Eye, RefreshCw, Cookie, Shield, EyeOff 
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function PrivacyPage() {
  return (
    <div className="pt-20 pb-16 bg-white text-left selection:bg-gold/10 overflow-x-hidden">
      <div className="container mx-auto px-6 max-w-5xl">
        {/* Compact Header Section */}
        <div className="space-y-4 text-center border-b border-slate-50 pb-10 mb-12">
          <div className="w-12 h-12 bg-gold/5 rounded-2xl flex items-center justify-center text-gold mx-auto border border-gold/10 shadow-inner">
            <ShieldCheck size={24} />
          </div>
          <div className="space-y-1">
            <span className="text-gold font-black tracking-[0.5em] uppercase text-[8px] block">PROTEKSI DATA ARSITEKTURAL</span>
            <h1 className="text-3xl md:text-4xl font-headline text-navy tracking-tighter uppercase font-bold">Kebijakan Privasi</h1>
            <p className="text-slate-400 font-light italic text-[9px] uppercase tracking-widest">Update Teknis: 15.0 • Rev: 04/24</p>
          </div>
        </div>

        {/* Informative Grid */}
        <div className="grid md:grid-cols-2 gap-x-12 gap-y-10">
          <section className="space-y-4">
            <div className="flex items-center gap-3 text-navy border-b border-slate-50 pb-2">
              <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-gold shadow-inner"><Database size={16} /></div>
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em]">1. Klasifikasi Data Koleksi</h2>
            </div>
            <div className="space-y-3 text-slate-500 font-medium leading-relaxed text-[11px] italic">
              <p>Kami hanya mengumpulkan parameter data yang esensial untuk koordinasi event Anda: Nama Lengkap, Nomor Kontak (WhatsApp), Alamat Lokasi Acara, dan Preferensi Desain. Data ini diproses secara internal untuk kepentingan kalkulasi Quotation dan logistik teknis.</p>
              <p>Data navigasi anonim (Cookies) digunakan semata-mata untuk sistem rekomendasi portofolio di beranda sesuai minat Anda.</p>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3 text-navy border-b border-slate-50 pb-2">
              <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-gold shadow-inner"><Lock size={16} /></div>
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em]">2. Protokol Keamanan & Enkripsi</h2>
            </div>
            <div className="space-y-3 text-slate-500 font-medium leading-relaxed text-[11px] italic">
              <p>Seluruh transmisi data di platform BluDecor dilindungi oleh enkripsi SSL (Secure Sockets Layer) dan disimpan dalam database terenkripsi pada backend kami untuk menjamin kerahasiaan identitas klien.</p>
              <p>BluDecor tidak pernah membagi, menyewakan, atau menjual basis data klien kepada pihak ketiga untuk kampanye pemasaran manapun di luar ekosistem layanan kami.</p>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3 text-navy border-b border-slate-50 pb-2">
              <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-gold shadow-inner"><UserCheck size={16} /></div>
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em]">3. Hak Kedaulatan Klien</h2>
            </div>
            <div className="space-y-3 text-slate-500 font-medium leading-relaxed text-[11px] italic">
              <p>Klien memiliki hak penuh untuk meminta salinan data reservasi yang kami simpan, melakukan koreksi identitas, atau meminta penghapusan permanen dari sistem reservasi kami setelah seluruh kewajiban acara selesai.</p>
              <p>Permintaan penghapusan data dapat diajukan secara formal melalui layanan bantuan resmi WhatsApp BluDecor dengan proses verifikasi identitas yang ketat.</p>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3 text-navy border-b border-slate-50 pb-2">
              <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-gold shadow-inner"><Cookie size={16} /></div>
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em]">4. Kebijakan Cookies & Analitik</h2>
            </div>
            <div className="space-y-3 text-slate-500 font-medium leading-relaxed text-[11px] italic">
              <p>Kami menggunakan Cookies pihak pertama untuk menyimpan 'Minat Pengguna' yang memungkinkan situs menampilkan karya favorit Anda di baris teratas. Data ini disimpan secara lokal di browser Anda dan tidak dilacak lintas-situs.</p>
              <p>Kami tidak menggunakan Cookies untuk kepentingan iklan target luar (Re-marketing) dari pihak ketiga guna menjaga kenyamanan navigasi klien.</p>
            </div>
          </section>

          <section className="space-y-4 md:col-span-2 bg-slate-50 p-6 rounded-[1.5rem] border border-slate-100 flex items-start gap-5">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-navy shadow-sm shrink-0"><RefreshCw size={20} /></div>
            <div className="space-y-2">
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-navy">Pembaruan & Transparansi Protokol</h2>
              <p className="text-slate-500 font-medium leading-relaxed text-[11px] italic">
                BluDecor berhak memperbarui kebijakan privasi ini secara berkala untuk menyesuaikan dengan regulasi perlindungan data terbaru di Indonesia. Setiap perubahan signifikan akan diinformasikan melalui notifikasi banner di situs kami. Dengan terus menggunakan layanan kami, Anda dianggap menyetujui protokol perlindungan data yang berlaku dalam kerangka kerja teknis BluDecor.
              </p>
            </div>
          </section>
        </div>

        {/* Footer Navigation */}
        <div className="pt-16 text-center">
          <Button asChild variant="ghost" className="rounded-full px-10 h-12 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-navy group transition-all">
            <Link href="/" className="flex items-center gap-3">
              <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> KEMBALI KE BERANDA
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
