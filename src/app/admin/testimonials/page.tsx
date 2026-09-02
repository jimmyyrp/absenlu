'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Star, Copy, Loader2, Trash2, Plus, AlertTriangle, Check
} from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/lib/supabase';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Progress } from "@/components/ui/progress";
import { cn } from '@/lib/utils';

/**
 * TestimonialsAdmin v114.1 - ACCESSIBILITY FIX
 */

export default function TestimonialsAdmin() {
  const { toast } = useToast();
  const [reviews, setReviews] = useState<any[]>([]);
  const [tokens, setTokens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [isAddingToken, setIsAddingToken] = useState(false);
  const [usageLimit, setUsageLimit] = useState(1);
  const [deleteReviewId, setDeleteReviewId] = useState<number | null>(null);
  const [deleteTokenId, setDeleteTokenId] = useState<number | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [revs, toks] = await Promise.all([
        supabase.from('testimonials').select('*').order('id', { ascending: false }),
        supabase.from('testimonial_tokens').select('*').order('id', { ascending: false })
      ]);
      setReviews(revs.data || []);
      setTokens(toks.data || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const generateToken = async () => {
    setIsSubmitting(true);
    try {
      // Token kriptografis (bukan Math.random) agar sulit ditebak & unik
      const bytes = new Uint8Array(8);
      crypto.getRandomValues(bytes);
      const token = Array.from(bytes, b => b.toString(36).padStart(2, '0')).join('').slice(0, 12);

      const { error } = await supabase.from('testimonial_tokens').insert([{ 
        token, usage_limit: Math.max(1, usageLimit), usage_count: 0 
      }]);
      
      if (error) throw error;

      toast({ title: "Tautan Aktif", description: "Akses ulasan berhasil diaktifkan." });
      setIsAddingToken(false);
      setUsageLimit(1);
      await fetchData();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Gagal", description: err.message || "Token gagal dibuat." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyLink = (token: string) => {
    const url = `${window.location.origin}/review/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    toast({ title: "Disalin", description: "Tautan siap dibagikan." });
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const handleDeleteReview = async () => {
    if (!deleteReviewId) return;
    setIsSubmitting(true);
    try {
      const { data: review } = await supabase.from('testimonials').select('id').eq('id', deleteReviewId).single();
      if (!review) throw new Error("Ulasan tidak ditemukan.");

      const { error: deleteError } = await supabase.from('testimonials').delete().eq('id', deleteReviewId);
      if (deleteError) throw deleteError;

      const { data: tokenRow } = await supabase
        .from('testimonial_tokens')
        .select('id, usage_count')
        .order('id', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (tokenRow && tokenRow.usage_count > 0) {
        await supabase
          .from('testimonial_tokens')
          .update({ usage_count: tokenRow.usage_count - 1 })
          .eq('id', tokenRow.id);
      }

      toast({ title: "Terhapus", description: "Ulasan dibersihkan & kuota dikembalikan." });
      await fetchData();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Gagal", description: err.message || "Ulasan gagal dihapus." });
    } finally {
      setDeleteReviewId(null);
      setIsSubmitting(false);
    }
  };

  const handleDeleteToken = async () => {
    if (!deleteTokenId) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('testimonial_tokens').delete().eq('id', deleteTokenId);
      if (error) throw error;
      toast({ title: "Terhapus", description: "Akses dicabut." });
      setTokens(prev => prev.filter(t => t.id !== deleteTokenId));
    } catch (err: any) {
      toast({ variant: "destructive", title: "Gagal", description: err.message || "Akses gagal dicabut." });
    } finally {
      setDeleteTokenId(null);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-up text-left pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
           <h1 className="text-xl font-headline font-bold text-navy uppercase tracking-tighter">Testimoni Klien</h1>
           <p className="text-[8px] text-slate-400 font-bold uppercase tracking-[0.2em]">Manajemen Feedback & Token Akses</p>
        </div>
        <Button onClick={() => setIsAddingToken(true)} className="bg-navy hover:bg-gold text-white rounded-2xl h-12 px-8 text-[9px] font-black uppercase tracking-[0.2em] shadow-xl border-none transition-all active:scale-95 group">
          <Plus size={16} className="mr-3 group-hover:rotate-90 transition-transform" /> BUAT AKSES
        </Button>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-gold" /></div>
      ) : (
        <div className="grid lg:grid-cols-5 gap-8 items-start">
          {/* Active Tokens - Matching Screenshot */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-[8px] font-black uppercase tracking-[0.4em] text-slate-300 ml-1">Tautan Aktif</h2>
            <Card className="border-none rounded-[2rem] bg-white shadow-sm overflow-hidden p-6">
              <div className="grid grid-cols-12 gap-2 mb-4">
                 <div className="col-span-5"><span className="px-2 py-1 rounded bg-[#FDF6E3] text-[#C5A358] text-[7px] font-black uppercase tracking-widest">TOKEN</span></div>
                 <div className="col-span-5"><span className="px-2 py-1 rounded bg-[#FDF6E3] text-[#C5A358] text-[7px] font-black uppercase tracking-widest">KUOTA</span></div>
              </div>
              <div className="space-y-3">
                {tokens.length === 0 ? (
                  <p className="py-10 text-center text-[7px] text-slate-200 uppercase font-black tracking-[0.5em]">Belum Ada Akses</p>
                ) : (
                  tokens.map((t) => (
                    <div key={t.id} className="grid grid-cols-12 items-center gap-2 group border-b border-slate-50 pb-3 last:border-none">
                      <div className="col-span-5 flex flex-col gap-0.5">
                        <span className="text-[8px] font-black text-slate-300 font-mono tracking-tighter truncate">@{t.token}</span>
                      </div>
                      <div className="col-span-5 flex flex-col gap-1 pr-4">
                         <div className="flex items-center justify-between">
                            <span className="text-[9px] font-black text-navy uppercase">{t.usage_count} / {t.usage_limit}</span>
                            {t.usage_count < t.usage_limit && (
                              <button onClick={() => copyLink(t.token)} className="text-gold hover:text-navy transition-colors">
                                {copiedToken === t.token ? <Check size={10} /> : <Copy size={10} />}
                              </button>
                            )}
                         </div>
                         <Progress value={(t.usage_count / (t.usage_limit || 1)) * 100} className="h-1 bg-slate-100" />
                      </div>
                      <div className="col-span-2 text-right">
                        <button onClick={() => setDeleteTokenId(t.id)} className="w-8 h-8 rounded-xl bg-slate-50 text-slate-200 hover:text-red-500 transition-all flex items-center justify-center">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>

          {/* Testimonial Cards */}
          <div className="lg:col-span-3 space-y-4">
            <h2 className="text-[8px] font-black uppercase tracking-[0.4em] text-slate-300 ml-1">Ulasan Terkini</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {reviews.length === 0 ? (
                <div className="col-span-full py-20 text-center bg-slate-50/50 rounded-[2rem] border border-dashed border-slate-100">
                  <p className="text-[8px] text-slate-300 font-black uppercase tracking-widest">Belum Ada Ulasan Masuk</p>
                </div>
              ) : (
                reviews.map((rev) => (
                  <Card key={rev.id} className="border-none shadow-sm rounded-[1.8rem] bg-white p-5 group relative overflow-hidden transition-all hover:shadow-md">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex gap-0.5">
                        {[...Array(rev.rating)].map((_, i) => <Star key={i} size={10} className="fill-gold text-gold" />)}
                      </div>
                      <button onClick={() => setDeleteReviewId(rev.id)} className="w-7 h-7 rounded-lg bg-red-50 text-red-500 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                        <Trash2 size={12} />
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-500 italic leading-relaxed mb-4 line-clamp-3">"{rev.text}"</p>
                    <div className="pt-3 border-t border-slate-50 flex items-center justify-between">
                      <p className="text-[9px] font-black text-navy uppercase tracking-widest truncate max-w-[70%]">{rev.name}</p>
                      <span className="text-[7px] text-slate-200 font-mono tracking-tighter">#{rev.id}</span>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Dialog Accessibility Fix v116.0 - RESPONSIVE */}
      <Dialog open={isAddingToken} onOpenChange={(open) => { if (!open && !isSubmitting) { setIsAddingToken(false); setUsageLimit(1); } }}>
        <DialogContent onOpenAutoFocus={(e) => e.preventDefault()} onCloseAutoFocus={(e) => e.preventDefault()} className="sm:max-w-[360px] border-none rounded-t-2xl sm:rounded-[2.5rem] p-0 overflow-hidden bg-white shadow-4xl text-left flex flex-col max-h-[88vh] sm:max-h-[90vh]">
          <DialogHeader className="bg-navy p-5 sm:p-6 text-white shrink-0">
              <DialogTitle className="text-sm font-headline font-bold uppercase tracking-widest">Akses Ulasan</DialogTitle>
              <DialogDescription className="text-[7px] uppercase tracking-widest text-white/40">Tautan khusus untuk pemberian ulasan klien BluDecor.</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-5 sm:px-8 pt-5 space-y-4 no-scrollbar">
            <div className="space-y-1.5">
              <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Maksimal Penggunaan</Label>
              <Input type="number" min={1} max={100} value={usageLimit} onChange={(e) => setUsageLimit(Math.max(1, parseInt(e.target.value) || 1))} className="h-10 sm:h-12 rounded-xl sm:rounded-2xl bg-slate-50 border-none px-3 sm:px-5 shadow-inner text-[13px] sm:text-sm font-bold text-navy" />
              <p className="text-[8px] text-slate-300 italic px-1">Tautan otomatis nonaktif setelah kuota terpenuhi.</p>
            </div>
          </div>
          <div className="dialog-footer-safe shrink-0 pt-3 px-5 sm:px-8 bg-white border-t border-slate-50 flex gap-2">
             <Button variant="ghost" onClick={() => setIsAddingToken(false)} disabled={isSubmitting} className="text-[9px] font-black uppercase text-slate-400 h-10 sm:h-12 px-4 flex-1">Batal</Button>
             <Button onClick={generateToken} disabled={isSubmitting} className="bg-navy hover:bg-gold text-white rounded-xl sm:rounded-2xl h-10 sm:h-12 px-6 sm:px-8 text-[9px] font-black uppercase shadow-2xl border-none transition-all flex-[1.5] active:scale-95">
               {isSubmitting ? <Loader2 className="animate-spin h-3 w-3" /> : "AKTIFKAN"}
             </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Review */}
      <AlertDialog open={!!deleteReviewId} onOpenChange={(open) => { if (!open && !isSubmitting) setDeleteReviewId(null); }}>
        <AlertDialogContent className="rounded-2xl sm:rounded-[2.5rem] border-none p-6 sm:p-10 bg-white shadow-4xl text-center w-[92vw] max-sm:max-w-sm">
           <div className="w-14 h-14 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4"><AlertTriangle size={28} /></div>
           <AlertDialogTitle className="text-base font-headline text-navy uppercase font-bold tracking-tight">Hapus Ulasan?</AlertDialogTitle>
           <AlertDialogDescription className="text-slate-400 text-[9px] font-light italic text-center uppercase tracking-widest mb-6">Data akan hilang permanen & kuota token kembali.</AlertDialogDescription>
           <div className="flex gap-2">
             <AlertDialogCancel disabled={isSubmitting} className="rounded-xl h-11 text-[9px] font-black bg-slate-50 border-none flex-1">BATAL</AlertDialogCancel>
             <AlertDialogAction disabled={isSubmitting} onClick={async (e) => { e.preventDefault(); await handleDeleteReview(); }} className="bg-red-500 text-white rounded-xl h-11 flex-1 text-[9px] font-black border-none shadow-lg active:scale-95 transition-all disabled:opacity-50">
               {isSubmitting ? <Loader2 className="animate-spin h-3 w-3" /> : "HAPUS"}
             </AlertDialogAction>
           </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Token */}
      <AlertDialog open={!!deleteTokenId} onOpenChange={(open) => { if (!open && !isSubmitting) setDeleteTokenId(null); }}>
        <AlertDialogContent className="rounded-2xl sm:rounded-[2.5rem] border-none p-6 sm:p-10 bg-white shadow-4xl text-center w-[92vw] max-w-sm">
           <div className="w-14 h-14 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4"><AlertTriangle size={28} /></div>
           <AlertDialogTitle className="text-base font-headline text-navy uppercase font-bold tracking-tight">Cabut Akses?</AlertDialogTitle>
           <AlertDialogDescription className="text-slate-400 text-[9px] font-light italic text-center uppercase tracking-widest mb-6">Klien tidak akan bisa lagi menggunakan tautan ini.</AlertDialogDescription>
           <div className="flex gap-2">
             <AlertDialogCancel disabled={isSubmitting} className="rounded-xl h-11 text-[9px] font-black bg-slate-50 border-none flex-1">BATAL</AlertDialogCancel>
             <AlertDialogAction disabled={isSubmitting} onClick={async (e) => { e.preventDefault(); await handleDeleteToken(); }} className="bg-red-500 text-white rounded-xl h-11 flex-1 text-[9px] font-black border-none shadow-lg active:scale-95 transition-all disabled:opacity-50">
               {isSubmitting ? <Loader2 className="animate-spin h-3 w-3" /> : "CABUT"}
             </AlertDialogAction>
           </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}