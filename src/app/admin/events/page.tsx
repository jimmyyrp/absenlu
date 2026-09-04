'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar, Loader2, Plus, Trash2, Edit2, Power, PowerOff, AlertTriangle
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MultiSelect } from "@/components/ui/multi-select";
import { useToast } from "@/hooks/use-toast";
import { cms } from '@/lib/cms-client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { cn } from '@/lib/utils';

type EventItem = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  icon: string;
  color: string;
  start_date: string;
  end_date: string;
  boost_category_ids: number[];
  boost_sub_category_ids: number[];
  priority: number;
  banner_text: string | null;
  banner_bg_color: string;
  banner_text_color: string;
  is_active: boolean;
  deleted_at: string | null;
  created_at: string;
};

const INITIAL_FORM = {
  name: '',
  slug: '',
  description: '',
  icon: '🎉',
  color: '#D4AF37',
  start_date: '',
  end_date: '',
  boost_category_ids: [] as number[],
  boost_sub_category_ids: [] as number[],
  priority: 1,
  banner_text: '',
  banner_bg_color: '#D4AF37',
  banner_text_color: '#1a1a2e',
  is_active: true,
};

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 200);
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

function getLocalDateStr(): string {
  return new Date().toLocaleDateString('sv-SE');
}

function getEventStatus(ev: EventItem) {
  const now = getLocalDateStr();
  if (!ev.is_active) return { label: 'Nonaktif', color: 'bg-slate-100 text-slate-400' };
  if (now < ev.start_date) return { label: 'Menunggu', color: 'bg-blue-50 text-blue-500' };
  if (now > ev.end_date) return { label: 'Selesai', color: 'bg-amber-50 text-amber-500' };
  return { label: 'Aktif', color: 'bg-green-50 text-green-600' };
}

export default function EventsAdmin() {
  const { toast } = useToast();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [subCategories, setSubCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [form, setForm] = useState(INITIAL_FORM);

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [evRes, catRes, subRes] = await Promise.all([
        cms.from('events').select('*').filter('deleted_at', 'is', null).order('start_date', { ascending: false }),
        cms.from('categories').select('*').filter('deleted_at', 'is', null).order('name'),
        cms.from('sub_categories').select('*').filter('deleted_at', 'is', null).order('name'),
      ]);
      setEvents(evRes.data || []);
      setCategories(catRes.data || []);
      setSubCategories(subRes.data || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openCreate = () => {
    setEditingEvent(null);
    setForm(INITIAL_FORM);
    setIsFormOpen(true);
  };

  const openEdit = (ev: EventItem) => {
    setEditingEvent(ev);
    setForm({
      name: ev.name,
      slug: ev.slug,
      description: ev.description || '',
      icon: ev.icon || '🎉',
      color: ev.color || '#D4AF37',
      start_date: ev.start_date,
      end_date: ev.end_date,
      boost_category_ids: ev.boost_category_ids || [],
      boost_sub_category_ids: ev.boost_sub_category_ids || [],
      priority: ev.priority || 1,
      banner_text: ev.banner_text || '',
      banner_bg_color: ev.banner_bg_color || '#D4AF37',
      banner_text_color: ev.banner_text_color || '#1a1a2e',
      is_active: ev.is_active,
    });
    setIsFormOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.start_date || !form.end_date) {
      toast({ variant: "destructive", title: "Validasi Gagal", description: "Nama event, tanggal mulai, dan tanggal akhir wajib diisi." });
      return;
    }
    if (form.start_date > form.end_date) {
      toast({ variant: "destructive", title: "Validasi Gagal", description: "Tanggal mulai tidak boleh setelah tanggal akhir." });
      return;
    }

    setIsSubmitting(true);
    try {
      const slug = form.slug || slugify(form.name);
      const payload = {
        name: form.name.trim(),
        slug,
        description: form.description.trim() || null,
        icon: form.icon,
        color: form.color,
        start_date: form.start_date,
        end_date: form.end_date,
        boost_category_ids: form.boost_category_ids,
        boost_sub_category_ids: form.boost_sub_category_ids,
        priority: form.priority,
        banner_text: form.banner_text.trim() || null,
        banner_bg_color: form.banner_bg_color,
        banner_text_color: form.banner_text_color,
        is_active: form.is_active,
      };

      if (editingEvent) {
        const { error } = await cms.from('events').update(payload).eq('id', editingEvent.id);
        if (error) throw error;
        toast({ title: "Event Diperbarui", description: `"${payload.name}" berhasil diperbarui.` });
      } else {
        const { error } = await cms.from('events').insert([payload]);
        if (error) throw error;
        toast({ title: "Event Dibuat", description: `"${payload.name}" berhasil dibuat.` });
      }

      try { await fetch('/api/revalidate', { method: 'POST' }); } catch {}
      setIsFormOpen(false);
      await fetchData();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Gagal Menyimpan", description: err.message || "Terjadi gangguan." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (ev: EventItem) => {
    try {
      const { error } = await cms.from('events').update({ is_active: !ev.is_active }).eq('id', ev.id);
      if (error) throw error;
      setEvents(prev => prev.map(e => e.id === ev.id ? { ...e, is_active: !e.is_active } : e));
      toast({ title: ev.is_active ? "Event Dinonaktifkan" : "Event Diaktifkan", description: `"${ev.name}" telah diperbarui.` });
      try { await fetch('/api/revalidate', { method: 'POST' }); } catch {}
    } catch (err: any) {
      toast({ variant: "destructive", title: "Gagal", description: err.message });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsSubmitting(true);
    try {
      const { error } = await cms.from('events').update({ deleted_at: new Date().toISOString() }).eq('id', deleteId);
      if (error) throw error;
      setEvents(prev => prev.filter(e => e.id !== deleteId));
      toast({ title: "Event Dihapus", description: "Event telah dihapus permanen." });
      try { await fetch('/api/revalidate', { method: 'POST' }); } catch {}
    } catch (err: any) {
      toast({ variant: "destructive", title: "Gagal", description: err.message });
    } finally {
      setDeleteId(null);
      setDeleteConfirmOpen(false);
      setIsSubmitting(false);
    }
  };



  return (
    <div className="space-y-6 animate-fade-up text-left pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-xl font-headline font-bold text-navy uppercase tracking-tighter">Event & Promo</h1>
          <p className="text-[8px] text-slate-400 font-bold uppercase tracking-[0.2em]">
            Kelola event musiman & boost rekomendasi karya
          </p>
        </div>
        <Button onClick={openCreate} className="bg-navy hover:bg-gold text-white rounded-2xl h-12 px-8 text-[9px] font-black uppercase tracking-[0.2em] shadow-xl border-none transition-all active:scale-95 group">
          <Plus size={16} className="mr-3 group-hover:rotate-90 transition-transform" /> BUAT EVENT
        </Button>
      </div>

      {/* Info Banner */}
      <div className="bg-gold/5 border border-gold/20 rounded-2xl p-4 flex items-start gap-3">
        <Calendar size={16} className="text-gold mt-0.5 shrink-0" />
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-navy">Bagaimana Event Bekerja?</p>
          <p className="text-[9px] text-slate-500 leading-relaxed">
            Event aktif akan <span className="font-bold text-gold">menampilkan banner</span> di halaman utama dan <span className="font-bold text-gold">memicu boost rekomendasi</span> untuk karya pada kategori yang dipilih. Jika tidak ada event aktif, banner tidak ditampilkan dan rekomendasi berjalan normal.
          </p>
        </div>
      </div>

      {/* Events List */}
      {loading ? (
        <div className="py-20 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-gold" /></div>
      ) : events.length === 0 ? (
        <div className="py-20 text-center bg-slate-50/50 rounded-[2rem] border border-dashed border-slate-100">
          <Calendar size={32} className="text-slate-200 mx-auto mb-3" />
          <p className="text-[9px] text-slate-300 font-black uppercase tracking-[0.3em]">Belum Ada Event</p>
          <p className="text-[8px] text-slate-300 mt-1">Buat event pertama untuk boost rekomendasi karya.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((ev) => {
            const status = getEventStatus(ev);
            const isExpired = getLocalDateStr() > ev.end_date;
            return (
              <div key={ev.id} className={cn(
                "bg-white rounded-2xl border p-5 transition-all hover:shadow-md group",
                ev.is_active && !isExpired ? "border-gold/20" : "border-slate-100"
              )}>
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0" style={{ backgroundColor: `${ev.color}15` }}>
                    {ev.icon}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-navy uppercase tracking-wide">{ev.name}</h3>
                      <span className={cn("px-2 py-0.5 rounded-lg text-[7px] font-black uppercase tracking-widest", status.color)}>
                        {status.label}
                      </span>
                      {ev.priority > 1 && (
                        <span className="px-2 py-0.5 rounded-lg bg-purple-50 text-purple-500 text-[7px] font-black uppercase tracking-widest">
                          PRI {ev.priority}
                        </span>
                      )}
                    </div>
                    {ev.description && (
                      <p className="text-[10px] text-slate-400 line-clamp-1">{ev.description}</p>
                    )}
                    <div className="flex items-center gap-3 text-[8px] text-slate-300 font-bold uppercase tracking-wider">
                      <span>{formatDate(ev.start_date)} — {formatDate(ev.end_date)}</span>
                      {ev.boost_category_ids.length > 0 && (
                        <span className="text-gold">{ev.boost_category_ids.length} kategori boost</span>
                      )}
                    </div>
                    {ev.banner_text && (
                      <p className="text-[9px] text-slate-400 italic line-clamp-1 mt-1">Banner: &ldquo;{ev.banner_text}&rdquo;</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleToggleActive(ev)}
                      className={cn(
                        "w-9 h-9 rounded-xl flex items-center justify-center transition-all",
                        ev.is_active ? "bg-green-50 text-green-500 hover:bg-green-100" : "bg-slate-50 text-slate-300 hover:bg-slate-100"
                      )}
                      title={ev.is_active ? "Nonaktifkan" : "Aktifkan"}
                    >
                      {ev.is_active ? <Power size={14} /> : <PowerOff size={14} />}
                    </button>
                    <button
                      onClick={() => openEdit(ev)}
                      className="w-9 h-9 rounded-xl bg-slate-50 text-slate-300 hover:text-blue-500 hover:bg-blue-50 flex items-center justify-center transition-all"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => { setDeleteId(ev.id); setDeleteConfirmOpen(true); }}
                      className="w-9 h-9 rounded-xl bg-slate-50 text-slate-300 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={(open) => { if (!open && !isSubmitting) { setIsFormOpen(false); setEditingEvent(null); setForm(INITIAL_FORM); } }}>
        <DialogContent onOpenAutoFocus={(e) => e.preventDefault()} onCloseAutoFocus={(e) => e.preventDefault()} className="sm:max-w-[600px] border-none rounded-[2.5rem] p-0 overflow-hidden bg-white shadow-4xl flex flex-col max-h-[90vh]">
          <DialogHeader className="p-8 pb-4 shrink-0">
            <DialogTitle className="text-lg font-headline text-navy uppercase font-bold">
              {editingEvent ? 'Sunting Event' : 'Buat Event Baru'}
            </DialogTitle>
            <DialogDescription className="text-[9px] uppercase tracking-widest text-slate-400">
              Event aktif akan menampilkan banner & boost rekomendasi di halaman utama.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-8 space-y-5">
            {/* Name & Slug */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[9px] font-black uppercase text-slate-400 ml-1">Nama Event *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value, slug: editingEvent ? form.slug : slugify(e.target.value) })}
                  placeholder="Contoh: Ramadhan 2026"
                  className="h-11 rounded-xl bg-slate-50 border-none shadow-inner text-[11px] font-bold"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[9px] font-black uppercase text-slate-400 ml-1">Slug</Label>
                <Input
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })}
                  placeholder="ramadhan-2026"
                  className="h-11 rounded-xl bg-slate-50 border-none shadow-inner text-[11px] font-bold font-mono"
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label className="text-[9px] font-black uppercase text-slate-400 ml-1">Deskripsi</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Deskripsi singkat event..."
                className="min-h-[60px] rounded-xl bg-slate-50 border-none shadow-inner text-[11px]"
              />
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[9px] font-black uppercase text-slate-400 ml-1">Tanggal Mulai *</Label>
                <Input
                  type="date"
                  value={form.start_date}
                  onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                  className="h-11 rounded-xl bg-slate-50 border-none shadow-inner text-[11px] font-bold"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[9px] font-black uppercase text-slate-400 ml-1">Tanggal Akhir *</Label>
                <Input
                  type="date"
                  value={form.end_date}
                  onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                  className="h-11 rounded-xl bg-slate-50 border-none shadow-inner text-[11px] font-bold"
                />
              </div>
            </div>

            {/* Priority & Active */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[9px] font-black uppercase text-slate-400 ml-1">Prioritas (1-10)</Label>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: Math.max(1, Math.min(10, parseInt(e.target.value) || 1)) })}
                  className="h-11 rounded-xl bg-slate-50 border-none shadow-inner text-[11px] font-bold"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[9px] font-black uppercase text-slate-400 ml-1">Status</Label>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, is_active: !form.is_active })}
                  className={cn(
                    "h-11 rounded-xl border-none shadow-inner text-[10px] font-black uppercase tracking-widest w-full flex items-center justify-center gap-2 transition-all",
                    form.is_active ? "bg-green-50 text-green-600" : "bg-slate-100 text-slate-400"
                  )}
                >
                  {form.is_active ? <Power size={12} /> : <PowerOff size={12} />}
                  {form.is_active ? "AKTIF" : "NONAKTIF"}
                </button>
              </div>
            </div>

            {/* Boost Categories */}
            <div className="space-y-2">
              <Label className="text-[9px] font-black uppercase text-gold ml-1">Boost Kategori</Label>
              <MultiSelect
                options={categories.map(c => ({ label: c.name, value: c.id }))}
                selected={form.boost_category_ids}
                onChange={(vals) => setForm(prev => ({ ...prev, boost_category_ids: vals as number[] }))}
                placeholder="PILIH KATEGORI BOOST"
              />
              {form.boost_category_ids.length > 0 && (
                <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider px-1">{form.boost_category_ids.length} kategori dipilih</p>
              )}
            </div>

            {/* Boost Sub-Categories */}
            <div className="space-y-2">
              <Label className="text-[9px] font-black uppercase text-slate-400 ml-1">Boost Sub-Kategori</Label>
              <MultiSelect
                options={subCategories.map(sc => ({ label: sc.name, value: sc.id }))}
                selected={form.boost_sub_category_ids}
                onChange={(vals) => setForm(prev => ({ ...prev, boost_sub_category_ids: vals as number[] }))}
                placeholder="PILIH SUB-KATEGORI BOOST"
              />
              {form.boost_sub_category_ids.length > 0 && (
                <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider px-1">{form.boost_sub_category_ids.length} sub-kategori dipilih</p>
              )}
            </div>

            {/* Banner Settings */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <Label className="text-[9px] font-black uppercase text-gold ml-1">Pengaturan Banner</Label>
              <div className="space-y-1.5">
                <Label className="text-[8px] font-bold uppercase text-slate-300 ml-1">Teks Banner</Label>
                <Input
                  value={form.banner_text}
                  onChange={(e) => setForm({ ...form, banner_text: e.target.value })}
                  placeholder="Teks yang ditampilkan di banner..."
                  className="h-10 rounded-xl bg-slate-50 border-none shadow-inner text-[10px]"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[8px] font-bold uppercase text-slate-300 ml-1">Warna Background</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={form.banner_bg_color}
                      onChange={(e) => setForm({ ...form, banner_bg_color: e.target.value })}
                      className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer"
                    />
                    <Input
                      value={form.banner_bg_color}
                      onChange={(e) => setForm({ ...form, banner_bg_color: e.target.value })}
                      className="h-10 rounded-xl bg-slate-50 border-none shadow-inner text-[10px] font-mono flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[8px] font-bold uppercase text-slate-300 ml-1">Warna Teks</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={form.banner_text_color}
                      onChange={(e) => setForm({ ...form, banner_text_color: e.target.value })}
                      className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer"
                    />
                    <Input
                      value={form.banner_text_color}
                      onChange={(e) => setForm({ ...form, banner_text_color: e.target.value })}
                      className="h-10 rounded-xl bg-slate-50 border-none shadow-inner text-[10px] font-mono flex-1"
                    />
                  </div>
                </div>
              </div>
              {/* Banner Preview */}
              {form.banner_text && (
                <div
                  className="rounded-xl p-3 text-center text-[10px] font-bold uppercase tracking-widest"
                  style={{ backgroundColor: form.banner_bg_color, color: form.banner_text_color }}
                >
                  {form.banner_text}
                </div>
              )}
            </div>

            <div className="h-4" />
          </div>

          <DialogFooter className="dialog-footer-safe shrink-0 p-6 pt-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center sm:justify-end gap-3">
            <Button variant="ghost" onClick={() => setIsFormOpen(false)} disabled={isSubmitting} className="text-[10px] font-black uppercase text-slate-400 h-12 px-6 w-full sm:w-auto">Batal</Button>
            <Button
              onClick={handleSave}
              disabled={isSubmitting || !form.name.trim() || !form.start_date || !form.end_date}
              className="bg-navy hover:bg-gold text-white rounded-[1.5rem] h-12 px-10 text-[10px] font-black uppercase shadow-2xl transition-all w-full sm:w-auto"
            >
              {isSubmitting ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : editingEvent ? "Perbarui Event" : "Buat Event"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={(open) => { if (!open && !isSubmitting) { setDeleteConfirmOpen(false); setDeleteId(null); } }}>
        <AlertDialogContent className="rounded-[2.5rem] border-none p-10 bg-white shadow-4xl text-center w-[92vw] max-sm:max-w-sm">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-[1.8rem] flex items-center justify-center mx-auto mb-4"><AlertTriangle size={32} /></div>
          <AlertDialogTitle className="text-base font-headline text-navy uppercase font-bold">Hapus Event?</AlertDialogTitle>
          <AlertDialogDescription className="text-[10px] text-slate-400 uppercase tracking-widest italic mb-6">
            Event akan dihapus permanen. Banner dan boost rekomendasi tidak akan berlaku lagi.
          </AlertDialogDescription>
          <div className="flex gap-2">
            <AlertDialogCancel className="rounded-xl h-12 text-[10px] font-black bg-slate-50 border-none flex-1">BATAL</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isSubmitting}
              className="bg-red-500 text-white rounded-xl h-12 flex-1 text-[10px] font-black border-none shadow-lg active:scale-95 transition-all disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="animate-spin h-4 w-4 mx-auto" /> : "YA, HAPUS"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
