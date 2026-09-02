
'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Star, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import Link from 'next/link';

/**
 * Halaman Ulasan Klien v78.0 - PRODUCTION RPC SYNC
 * Menggunakan RPC submit_testimonial_with_token untuk validasi ketat di sisi database.
 */

const LIMITS = {
  NAME: 40,
  TEXT: 400
};

const PageWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4 selection:bg-gold/10 relative font-body overflow-x-hidden">
    <div className="w-full max-w-[640px] relative z-10 animate-fade-up">
      {children}
    </div>
    <div className="mt-6 text-center opacity-20">
      <p className="text-[7px] text-navy uppercase tracking-[0.6em] font-black">Secure Feedback System v16.4</p>
    </div>
  </div>
);

export default function ReviewPage() {
  const params = useParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [tokenData, setTokenData] = useState<any>(null);
  const [success, setSuccess] = useState(false);
  const [validationError, setValidationError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    role: 'Klien BluDecor',
    text: '',
    rating: 5
  });

  useEffect(() => {
    async function validateToken() {
      if (!params.token) {
        setLoading(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .from('testimonial_tokens')
          .select('*')
          .eq('token', params.token as string)
          .single();

        if (error || !data || (data.usage_count >= data.usage_limit)) {
          setTokenData(null);
        } else {
          setTokenData(data);
        }
      } catch (e) {
        setTokenData(null);
      } finally {
        setLoading(false);
      }
    }
    validateToken();
  }, [params.token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.text.trim()) {
      setValidationError('Identitas dan pengalaman Anda wajib diisi terlebih dahulu.');
      return;
    }
    setValidationError('');
    setSubmitting(true);
    try {
      // Menggunakan RPC untuk keamanan dan otomatisasi update kuota token
      const { data, error: rpcError } = await supabase.rpc('submit_testimonial_with_token', {
        p_name: formData.name.trim().slice(0, LIMITS.NAME),
        p_role: formData.role,
        p_text: formData.text.trim().slice(0, LIMITS.TEXT),
        p_rating: Math.min(5, Math.max(1, Math.round(formData.rating))),
        p_token: params.token as string
      });
      
      if (rpcError) throw rpcError;
      
      setSuccess(true);
      toast({ title: "Terima Kasih", description: "Ulasan Anda sangat berarti bagi kami." });
    } catch (err: any) {
      console.error("Testimonial Submission Error:", err);
      toast({ 
        variant: "destructive", 
        title: "Gagal Mengirim", 
        description: err.message || "Terjadi gangguan pada protokol keamanan." 
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <PageWrapper>
      <div className="flex flex-col items-center gap-4 py-20 bg-white rounded-[2.5rem] shadow-sm p-10">
        <Loader2 className="h-10 w-10 animate-spin text-gold" />
        <p className="text-[9px] font-black uppercase tracking-[0.4em] text-navy">Sinkronisasi Akses...</p>
      </div>
    </PageWrapper>
  );

  if (!tokenData && !success) {
    return (
      <PageWrapper>
        <Card className="border-none rounded-[3rem] shadow-4xl text-center p-12 space-y-8 bg-white">
          <div className="w-20 h-20 bg-red-50 text-red-500 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-inner"><AlertCircle size={40} /></div>
          <div className="space-y-3">
            <h1 className="text-xl font-headline text-navy uppercase font-black tracking-tighter leading-none">Sesi Berakhir</h1>
            <p className="text-slate-400 text-[10px] font-medium italic uppercase tracking-widest leading-relaxed">Tautan kadaluwarsa atau kuota ulasan telah penuh.</p>
          </div>
          <Button asChild className="bg-navy hover:bg-gold text-white rounded-full w-full h-12 text-[10px] font-black uppercase tracking-[0.3em] border-none shadow-xl transition-all active:scale-95">
            <Link href="/">Kembali Ke Beranda</Link>
          </Button>
        </Card>
      </PageWrapper>
    );
  }

  if (success) {
    return (
      <PageWrapper>
        <Card className="border-none rounded-[3rem] shadow-4xl text-center p-12 space-y-8 bg-white">
          <div className="w-24 h-24 bg-green-50 text-green-600 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-inner"><CheckCircle2 size={48} /></div>
          <div className="space-y-3">
            <h1 className="text-xl font-headline text-navy uppercase font-black tracking-tighter leading-none">Ulasan Terkirim</h1>
            <p className="text-slate-400 text-[10px] font-medium italic uppercase tracking-[0.2em] leading-relaxed">Terima kasih telah mempercayakan momen Anda bersama BluDecor.</p>
          </div>
          <Button asChild className="bg-navy hover:bg-gold text-white rounded-full w-full h-12 text-[10px] font-black uppercase tracking-[0.3em] border-none shadow-2xl active:scale-95 transition-all">
            <Link href="/">Tutup Halaman</Link>
          </Button>
        </Card>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <Card className="border-none rounded-[3rem] shadow-5xl overflow-hidden bg-white">
        <div className="bg-navy py-6 md:py-8 px-8 text-center text-white relative">
          <h1 className="text-sm md:text-base font-headline font-bold uppercase tracking-[0.5em] leading-none">Kesan & Pesan</h1>
          <p className="text-white/30 text-[7px] uppercase tracking-[0.4em] font-black mt-2">BluDecor</p>
        </div>

        <CardContent className="p-6 md:p-10">
          <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              <div className="space-y-2 text-left">
                <div className="flex justify-between items-center ml-1">
                  <Label className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-300">Identitas Anda</Label>
                  <span className={cn("text-[7px] font-bold tracking-widest", formData.name.length >= LIMITS.NAME ? "text-red-400" : "text-slate-200")}>
                    {formData.name.length} / {LIMITS.NAME}
                  </span>
                </div>
                <Input 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})} 
                  placeholder="NAMA LENGKAP KLIEN" 
                  maxLength={LIMITS.NAME}
                  className="h-12 rounded-2xl bg-slate-50 border-none px-6 shadow-inner text-xs font-bold text-navy ring-0 focus-visible:ring-gold/20" 
                  required
                />
              </div>

              <div className="space-y-3 text-center md:text-right">
                <Label className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-300 mr-1 block md:inline-block">Rating Pelayanan</Label>
                <div className="flex gap-1.5 justify-center md:justify-end">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button key={s} type="button" onClick={() => setFormData({...formData, rating: s})} className="transition-all hover:scale-110 active:scale-90 outline-none">
                      <Star size={32} className={cn("transition-all duration-300", s <= formData.rating ? "fill-gold text-gold scale-110 drop-shadow-md" : "text-slate-100")} />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2 text-left">
              <div className="flex justify-between items-center ml-1">
                <Label className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-300">Pengalaman Anda</Label>
                <span className={cn("text-[7px] font-bold tracking-widest", formData.text.length >= LIMITS.TEXT ? "text-red-400" : "text-slate-200")}>
                  {formData.text.length} / {LIMITS.TEXT}
                </span>
              </div>
              <Textarea 
                value={formData.text} 
                onChange={(e) => setFormData({...formData, text: e.target.value})} 
                placeholder="Ceritakan kepuasan Anda bersama tim kami..." 
                maxLength={LIMITS.TEXT}
                className="min-h-[120px] md:min-h-[160px] rounded-[1.8rem] bg-slate-50 border-none p-6 no-scrollbar shadow-inner text-xs italic text-navy font-medium leading-relaxed ring-0 focus-visible:ring-gold/20" 
                required
              />
              <p className="text-[7px] text-slate-300 italic px-2">Cerita Anda membantu kami menjaga kualitas arsitektural dekorasi.</p>
            </div>

            {validationError && (
              <p className="text-[9px] font-black uppercase tracking-widest text-red-500 text-center bg-red-50 rounded-xl py-2.5 px-4" role="alert">
                {validationError}
              </p>
            )}

            <Button disabled={submitting || !formData.name || !formData.text} type="submit" className="w-full bg-navy hover:bg-gold text-white rounded-2xl h-14 text-[11px] font-black uppercase tracking-[0.4em] shadow-2xl border-none transition-all active:scale-95 group">
              {submitting ? <Loader2 className="animate-spin h-5 w-5" /> : (
                <span className="flex items-center justify-center gap-3">
                  KIRIM ULASAN <CheckCircle2 size={18} className="group-hover:rotate-12 transition-transform" />
                </span>
              )}
            </Button>
            {!formData.name.trim() || !formData.text.trim() ? (
              <p className="text-[8px] font-black uppercase tracking-widest text-slate-300 text-center -mt-3">Lengkapi identitas & pengalaman untuk mengaktifkan tombol.</p>
            ) : null}
          </form>
        </CardContent>
      </Card>
    </PageWrapper>
  );
}
