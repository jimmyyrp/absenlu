
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Settings, RotateCcw, Database, MessageSquare, Loader2, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/lib/supabase';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle } from "@/components/ui/alert-dialog";

export default function SettingsAdmin() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saveConfirmOpen, setSaveConfirmOpen] = useState(false);
  const [config, setConfig] = useState({
    app_name: '',
    app_tagline: '',
    phone: '',
    instagram: '',
    tiktok: '',
    address: '',
    message: ''
  });

  const fetchSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('site_settings').select('*');
      if (error) throw error;
      if (data) {
        const mapped = data.reduce((acc: any, item) => {
          acc[item.key] = item.value;
          return acc;
        }, {});
        setConfig(prev => ({ ...prev, ...mapped }));
      }
    } catch (err: any) {
      console.error("Fetch settings error:", err);
      toast({ variant: "destructive", title: "Gagal Memuat", description: "Pengaturan tidak dapat disinkronkan." });
    }
  }, [toast]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const triggerSystemRevalidate = async () => {
    try {
      await fetch('/api/revalidate', { method: 'POST' });
    } catch (e) {
      console.error("Revalidation failed:", e);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const updates = Object.entries(config).map(([key, value]) => ({ key, value }));
      const { error } = await supabase.from('site_settings').upsert(updates, { onConflict: 'key' });
      if (error) throw error;
      
      await triggerSystemRevalidate();
      toast({ title: "Konfigurasi Disimpan", description: "Informasi bisnis diperbarui dan cache dibersihkan." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Gagal", description: "Masalah sinkronisasi data pusat." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 animate-fade-up pb-10">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-slate-100">
        <h1 className="text-xl font-headline font-bold text-navy tracking-tight uppercase">Pengaturan</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchSettings} className="rounded-xl h-10 px-6 text-[10px] font-bold uppercase border-slate-200"><RotateCcw size={14} className="mr-2" /> Refresh</Button>
          <Button onClick={() => setSaveConfirmOpen(true)} disabled={loading} className="bg-navy hover:bg-gold text-white rounded-xl h-10 px-8 text-[10px] font-bold uppercase shadow-lg border-none active:scale-95 transition-all">
            {loading ? <Loader2 className="animate-spin h-3 w-3 mr-2" /> : "Simpan Perubahan"}
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden">
            <CardHeader className="p-8 border-b border-slate-50">
              <CardTitle className="text-sm font-headline text-navy uppercase font-black tracking-widest">Identitas Aplikasi & Bisnis</CardTitle>
              <CardDescription className="text-[10px] uppercase tracking-widest">Pengaturan nama aplikasi dan identitas bisnis</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="space-y-4 p-4 rounded-2xl bg-gold/5 border border-gold/10">
                <div className="flex items-center gap-2">
                  <span className="text-[8px] font-black uppercase tracking-[0.3em] text-gold">PENGATURAN BRANDING</span>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Nama Aplikasi *</Label><Input value={config.app_name} onChange={(e) => setConfig({...config, app_name: e.target.value})} placeholder="BluDecor" className="h-12 rounded-2xl bg-white border-none px-5 text-sm font-bold" /></div>
                  <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Tagline</Label><Input value={config.app_tagline} onChange={(e) => setConfig({...config, app_tagline: e.target.value})} placeholder="Arsitek Event Premium" className="h-12 rounded-2xl bg-white border-none px-5 text-sm font-bold italic" /></div>
                </div>
                <p className="text-[8px] text-slate-400 font-medium italic px-1">Nama aplikasi akan ditampilkan di logo, judul halaman, dan berbagai tempat di situs.</p>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-400 ml-1">WhatsApp</Label><Input value={config.phone} onChange={(e) => setConfig({...config, phone: e.target.value})} className="h-12 rounded-2xl bg-slate-50 border-none px-5 text-sm font-bold" /></div>
                <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Instagram URL</Label><Input value={config.instagram} onChange={(e) => setConfig({...config, instagram: e.target.value})} className="h-12 rounded-2xl bg-slate-50 border-none px-5 text-sm font-bold" /></div>
                <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-400 ml-1">TikTok URL</Label><Input value={config.tiktok} onChange={(e) => setConfig({...config, tiktok: e.target.value})} className="h-12 rounded-2xl bg-slate-50 border-none px-5 text-sm font-bold" /></div>
                <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Workshop Address</Label><Input value={config.address} onChange={(e) => setConfig({...config, address: e.target.value})} className="h-12 rounded-2xl bg-slate-50 border-none px-5 text-sm font-bold" /></div>
              </div>
              <div className="space-y-2 pt-2">
                <div className="flex items-center gap-2 mb-1"><MessageSquare size={14} className="text-gold" /><Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Templat Pesan Konsultasi</Label></div>
                <Textarea value={config.message} onChange={(e) => setConfig({...config, message: e.target.value})} className="min-h-[100px] rounded-2xl bg-slate-50 border-none p-6 text-sm font-medium italic" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="border-none shadow-sm rounded-[2rem] bg-navy text-white p-8 space-y-5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gold/10 rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform duration-700" />
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-gold relative z-10 shadow-inner border border-white/5"><Database size={24} /></div>
            <div className="space-y-0 relative z-10"><p className="text-[10px] font-black uppercase text-white/40">Sistem Metadata</p><h4 className="text-lg font-bold">Sinkronisasi Real-time</h4></div>
          </Card>
        </div>
      </div>

      <AlertDialog open={saveConfirmOpen} onOpenChange={(open) => { if (!open && !loading) setSaveConfirmOpen(false); }}>
        <AlertDialogContent className="rounded-2xl sm:rounded-[2.5rem] border-none p-6 sm:p-10 bg-white shadow-4xl text-center w-[92vw] max-sm:max-w-sm">
          <div className="w-14 h-14 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4"><CheckCircle2 size={28} /></div>
          <AlertDialogTitle className="text-base font-headline text-navy uppercase font-bold">Simpan Perubahan?</AlertDialogTitle>
          <AlertDialogDescription className="text-[9px] sm:text-[10px] text-slate-400 uppercase tracking-widest italic mb-5">Konfigurasi situs akan diperbarui dan cache dibersihkan.</AlertDialogDescription>
          <div className="flex gap-2">
            <AlertDialogCancel disabled={loading} className="rounded-xl h-11 text-[10px] font-black bg-slate-50 border-none flex-1">BATAL</AlertDialogCancel>
            <AlertDialogAction disabled={loading} onClick={async (e) => { e.preventDefault(); await handleSave(); }} className="bg-navy text-white rounded-xl h-11 flex-1 text-[10px] font-black border-none shadow-lg active:scale-95 transition-all disabled:opacity-50">
              {loading ? <Loader2 className="animate-spin h-3 w-3 mx-auto" /> : "YA, SIMPAN"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
