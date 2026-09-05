"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Plus, Edit2, Trash2, Loader2, AlertTriangle, Search, ChevronLeft, ChevronRight, Filter
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { cms } from '@/lib/cms-client';
import { cn } from '@/lib/utils';
import { formatPrice } from '@/lib/formatters';

/**
 * ServicesAdmin v121.0 - LAYOUT GUARD
 */

export default function ServicesAdmin() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'categories');
  const [items, setItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [deleteArmed, setDeleteArmed] = useState(false);
  const [bulkDeleteArmed, setBulkDeleteArmed] = useState(false);

  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  
  const [formData, setFormData] = useState({ name: '', category_id: '', price: '0' });
  const dialogCloseGuardRef = React.useRef(false);

  const closeDialog = useCallback(() => {
    if (isSubmitting) return;
    dialogCloseGuardRef.current = true;
    setIsAdding(false);
    requestAnimationFrame(() => { dialogCloseGuardRef.current = false; });
  }, [isSubmitting]);

  useEffect(() => {
    if (isAdding || dialogCloseGuardRef.current) return;
    const t = setTimeout(() => {
      setEditingItem(null);
      setFormData({ name: '', category_id: '', price: '0' });
    }, 350);
    return () => clearTimeout(t);
  }, [isAdding]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: cats } = await cms.from('categories').select('*').filter('deleted_at', 'is', null).order('name');
      setCategories(cats || []);

      const table = activeTab === 'categories' ? 'categories' : 'sub_categories';
      const select = activeTab === 'categories' ? '*' : '*, categories(name)';
      const { data, error } = await cms.from(table).select(select).filter('deleted_at', 'is', null).order('name');
      if (error) throw error;
      setItems(data || []);
    } catch (err) {
      console.error('Fetch katalog error:', err);
      toast({ variant: "destructive", title: "Error", description: "Sinkronisasi gagal." });
    } finally {
      setLoading(false);
    }
  }, [activeTab, toast]);

  useEffect(() => { fetchData(); setSelectedIds([]); setCurrentPage(1); }, [fetchData]);

  const syncSearchToURL = useCallback((value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set('q', value);
    } else {
      params.delete('q');
    }
    router.replace(`/admin/services?${params.toString()}`, { scroll: false });
  }, [router, searchParams]);

  const syncTabToURL = useCallback((tab: string) => {
    setActiveTab(tab);
    setSelectedIds([]);
    setCurrentPage(1);
    const params = new URLSearchParams(searchParams.toString());
    if (tab !== 'categories') {
      params.set('tab', tab);
    } else {
      params.delete('tab');
    }
    router.replace(`/admin/services?${params.toString()}`, { scroll: false });
  }, [router, searchParams]);

  const filteredItems = useMemo(() => 
    items.filter(i => i.name?.toLowerCase().includes(searchTerm.toLowerCase())),
  [items, searchTerm]);

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredItems.slice(start, start + itemsPerPage);
  }, [filteredItems, currentPage, itemsPerPage]);

  const isFormValid = activeTab === 'categories' ? formData.name.trim() !== '' : formData.name.trim() !== '' && formData.category_id !== '';

  const handleSave = async () => {
    if (!isFormValid) return;
    const cleanName = formData.name.trim();
    const duplicate = items.some(i => i.id !== editingItem?.id && i.name?.trim().toLowerCase() === cleanName.toLowerCase());
    if (duplicate) {
      toast({ variant: "destructive", title: "Nama Duplikat", description: `"${cleanName}" sudah ada di katalog ini.` });
      return;
    }
    setIsSubmitting(true);
    try {
      const table = activeTab === 'categories' ? 'categories' : 'sub_categories';
      const payload: any = { name: cleanName };
      if (activeTab === 'sub_categories') {
        payload.category_id = parseInt(formData.category_id);
        payload.price = Math.max(0, parseFloat(formData.price || '0') || 0);
      }

      if (editingItem) {
        const { error } = await cms.from(table).update(payload).eq('id', editingItem.id);
        if (error) throw error;
        toast({ title: "Berhasil", description: "Basis data telah diperbarui." });
      } else {
        const { error } = await cms.from(table).insert([payload]);
        if (error) throw error;
        toast({ title: "Berhasil", description: "Item baru telah ditambahkan." });
      }
      await fetchData();
      setIsAdding(false);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const checkUsage = async (ids: number[]) => {
    const table = activeTab === 'categories' ? 'post_categories' : 'post_sub_categories';
    const column = activeTab === 'categories' ? 'category_id' : 'sub_category_id';
    const { data, error } = await cms.from(table).select(column).in(column, ids);
    if (error) {
      toast({ variant: "destructive", title: "Gagal Memverifikasi", description: "Tidak dapat memeriksa penggunaan data. Periksa koneksi." });
      return true;
    }
    return !!data && data.length > 0;
  };

  const handleDeleteTrigger = async (id: number) => {
    const inUse = await checkUsage([id]);
    if (inUse) {
      toast({ 
        variant: "destructive", 
        title: "Proteksi Data Shield", 
        description: "Gagal! Item ini masih digunakan oleh karya portofolio." 
      });
      return;
    }
    setDeleteId(id);
  };

  const handleBulkDelete = async () => {
    setIsSubmitting(true);
    try {
      const inUse = await checkUsage(selectedIds);
      if (inUse) {
        toast({ 
          variant: "destructive", 
          title: "Proteksi Data Shield", 
          description: "Gagal! Beberapa item masih digunakan oleh karya portofolio." 
        });
        return;
      }

      const table = activeTab === 'categories' ? 'categories' : 'sub_categories';
      const { error } = await cms.from(table).delete().in('id', selectedIds);
      if (error) throw error;
      toast({ title: "Berhasil", description: "Katalog pilihan telah dibersihkan." });
      await fetchData();
      setSelectedIds([]);
    } finally {
      setBulkDeleteConfirm(false);
      setIsSubmitting(false);
    }
  };



  return (
    <div className="space-y-4 animate-fade-up text-left pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-100">
        <h1 className="text-base font-headline font-bold text-navy uppercase tracking-tighter">Katalog Layanan</h1>
        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && <Button onClick={() => setBulkDeleteConfirm(true)} variant="destructive" className="h-9 px-4 rounded-xl text-[8px] font-black uppercase tracking-widest shadow-lg">HAPUS ({selectedIds.length})</Button>}
          <Button onClick={() => { setEditingItem(null); setFormData({ name: '', category_id: '', price: '0' }); setIsAdding(true); }} className="bg-navy hover:bg-gold text-white rounded-xl h-9 px-6 text-[8px] font-black uppercase tracking-widest shadow-md border-none">
            <Plus size={14} className="mr-2" /> Tambah {activeTab === 'categories' ? 'Kategori' : 'Sub'}
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-2 items-center">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-300" />
          <Input placeholder="CARI KATALOG..." value={searchTerm} onChange={(e) => syncSearchToURL(e.target.value)} className="h-9 rounded-xl bg-white border-none shadow-sm pl-9 text-[8px] font-bold uppercase tracking-widest" />
        </div>
        <Tabs value={activeTab} onValueChange={syncTabToURL} className="w-full md:w-auto">
          <TabsList className="bg-white p-1 rounded-xl shadow-sm border border-slate-50 h-9">
            <TabsTrigger value="categories" className="rounded-lg px-4 h-full text-[7px] font-black uppercase tracking-widest">KATEGORI</TabsTrigger>
            <TabsTrigger value="sub_categories" className="rounded-lg px-4 h-full text-[7px] font-black uppercase tracking-widest">SUB-KATEGORI</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-gold" /></div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-2 md:hidden">
            {paginatedItems.map((item) => (
              <div key={item.id} className="bg-white p-3 rounded-2xl border border-slate-50 flex items-center justify-between shadow-sm">
                <div className="space-y-0.5 flex-1 min-w-0">
                   <span className="text-[6px] text-slate-300 font-mono">#{item.id}</span>
                   <h4 className="text-[9px] font-bold text-navy uppercase truncate">{item.name}</h4>
                   {activeTab === 'sub_categories' && (
                     <div className="flex items-center gap-2">
                       <p className="text-[6px] text-gold font-black uppercase whitespace-nowrap">{item.categories?.name}</p>
                       <span className="text-slate-200">•</span>
                       <p className="text-[6px] text-slate-400 font-black whitespace-nowrap">{formatPrice(item.price || 0)}</p>
                     </div>
                   )}
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button onClick={() => { setEditingItem(item); setFormData({ name: item.name, category_id: item.category_id?.toString() || '', price: (item.price || 0).toString() }); setIsAdding(true); }} variant="ghost" size="icon" className="h-8 w-8 text-slate-300 rounded-lg bg-slate-50/50"><Edit2 size={13} /></Button>
                  <Button onClick={() => handleDeleteTrigger(item.id)} variant="ghost" size="icon" className="h-8 w-8 text-slate-300 rounded-lg bg-slate-50/50"><Trash2 size={13} /></Button>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden md:block bg-white rounded-[1.5rem] shadow-sm border border-slate-50 overflow-x-auto no-scrollbar">
            <Table className="min-w-[700px]">
              <TableHeader className="bg-slate-50/50">
                <TableRow className="border-none h-9">
                  <TableHead className="w-12 pl-6"><Checkbox checked={selectedIds.length === paginatedItems.length && paginatedItems.length > 0} onCheckedChange={() => setSelectedIds(selectedIds.length === paginatedItems.length ? [] : paginatedItems.map(i => i.id))} /></TableHead>
                  <TableHead className="font-black text-slate-400 uppercase text-[7px] tracking-[0.3em]">Indeks</TableHead>
                  <TableHead className="font-black text-slate-400 uppercase text-[7px] tracking-[0.3em]">Identitas Katalog</TableHead>
                  {activeTab === 'sub_categories' && <TableHead className="font-black text-slate-400 uppercase text-[7px] tracking-[0.3em]">Kategori Induk</TableHead>}
                  {activeTab === 'sub_categories' && <TableHead className="font-black text-slate-400 uppercase text-[7px] tracking-[0.3em]">Estimasi Mulai</TableHead>}
                  <TableHead className="w-32 text-right pr-6">Opsi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedItems.map((item) => (
                  <TableRow key={item.id} className="border-slate-50 hover:bg-slate-50/30 transition-colors">
                    <TableCell className="pl-6"><Checkbox checked={selectedIds.includes(item.id)} onCheckedChange={() => setSelectedIds(prev => prev.includes(item.id) ? prev.filter(j => j !== item.id) : [...prev, item.id])} /></TableCell>
                    <TableCell className="py-2 font-mono text-[7px] text-slate-300">#{item.id}</TableCell>
                    <TableCell className="py-2 font-bold text-navy text-[9px] uppercase tracking-widest whitespace-nowrap">{item.name}</TableCell>
                    {activeTab === 'sub_categories' && (
                      <TableCell className="py-2">
                        <span className="px-2 py-0.5 rounded-md bg-navy/5 text-navy text-[7px] font-black uppercase border border-navy/5 whitespace-nowrap">{item.categories?.name}</span>
                      </TableCell>
                    )}
                    {activeTab === 'sub_categories' && <TableCell className="py-2 font-black text-[8px] text-gold whitespace-nowrap">{formatPrice(item.price || 0)}</TableCell>}
                    <TableCell className="py-2 pr-6 text-right">
                       <div className="flex justify-end gap-1">
                          <Button onClick={() => { setEditingItem(item); setFormData({ name: item.name, category_id: item.category_id?.toString() || '', price: (item.price || 0).toString() }); setIsAdding(true); }} variant="ghost" size="icon" className="h-7 w-7 text-slate-300 hover:text-blue-500 rounded-lg"><Edit2 size={12} /></Button>
                          <Button onClick={() => handleDeleteTrigger(item.id)} variant="ghost" size="icon" className="h-7 w-7 text-slate-300 hover:text-red-500 rounded-lg"><Trash2 size={12} /></Button>
                       </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between pt-4">
             <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">Halaman {currentPage} dari {totalPages || 1}</p>
             <div className="flex items-center gap-1">
                <Button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)} variant="outline" className="h-8 w-8 p-0 rounded-lg border-slate-100 bg-white"><ChevronLeft size={14} /></Button>
                <Button disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(prev => prev + 1)} variant="outline" className="h-8 w-8 p-0 rounded-lg border-slate-100 bg-white"><ChevronRight size={14} /></Button>
             </div>
          </div>
        </>
      )}

      <Dialog open={isAdding} onOpenChange={(open) => { if (!open) closeDialog(); }}>
        <DialogContent onOpenAutoFocus={(e) => e.preventDefault()} onCloseAutoFocus={(e) => e.preventDefault()} className="sm:max-w-[400px] border-none rounded-t-2xl sm:rounded-[2.5rem] p-0 overflow-hidden bg-white shadow-4xl text-left flex flex-col max-h-[88vh] sm:max-h-[90vh]">
          <DialogHeader className="bg-navy p-5 sm:p-6 text-white relative shrink-0">
            <div className="space-y-1 pr-8">
              <DialogTitle className="text-sm font-headline uppercase font-bold tracking-widest">{editingItem ? 'Ubah Katalog' : 'Katalog Baru'}</DialogTitle>
              <DialogDescription className="text-[7px] uppercase tracking-widest text-white/40">Pengaturan struktur kategori operasional.</DialogDescription>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-5 sm:px-8 pt-5 space-y-4 no-scrollbar">
            {activeTab === 'sub_categories' && (
              <div className="space-y-1.5">
                <Label className="text-[9px] font-black uppercase text-slate-400 ml-1">Kategori Induk *</Label>
                <Select value={formData.category_id} onValueChange={(val) => setFormData({...formData, category_id: val})}>
                  <SelectTrigger className={cn("h-10 rounded-xl bg-slate-50 border-none px-3 text-[10px] font-bold uppercase shadow-inner ring-0 focus:ring-0", formData.category_id === '' && "ring-1 ring-red-200")}>
                    <SelectValue placeholder="Pilih Induk..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-none shadow-5xl bg-white p-1.5 z-[1100] max-h-[40vh]">
                    {categories.length === 0 && <p className="text-[9px] font-bold uppercase text-slate-300 text-center py-3">Belum ada kategori induk</p>}
                    {categories.map(c => <SelectItem key={c.id} value={c.id.toString()} className="text-[10px] font-bold uppercase py-2.5 rounded-lg hover:bg-slate-50">{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                {formData.category_id === '' && <p className="text-[9px] font-bold uppercase tracking-wider text-red-500 ml-1">Kategori induk wajib dipilih.</p>}
              </div>
            )}
            <div className="space-y-1.5">
              <Label className="text-[9px] font-black uppercase text-slate-400 ml-1">Nama Katalog *</Label>
              <Input value={formData.name} maxLength={80} onChange={(e) => setFormData({...formData, name: e.target.value})} className={cn("h-10 rounded-xl bg-slate-50 border-none px-3 shadow-inner text-[13px] font-bold text-navy", formData.name !== '' && formData.name.trim() === '' && "ring-1 ring-red-300")} />
              {formData.name.trim() === '' && <p className="text-[9px] font-bold uppercase tracking-wider text-red-500 ml-1">Nama katalog wajib diisi.</p>}
            </div>
            {activeTab === 'sub_categories' && (
              <div className="space-y-1.5">
                <Label className="text-[9px] font-black uppercase text-gold ml-1">Estimasi Mulai (IDR)</Label>
                <Input inputMode="numeric" value={formData.price} onChange={(e) => { const clean = e.target.value.replace(/[^0-9]/g, '').slice(0, 12); setFormData({...formData, price: clean === '' ? '0' : String(parseInt(clean, 10)) }); }} className="h-10 rounded-xl bg-slate-50 border-none px-3 shadow-inner text-[13px] font-bold text-gold" />
              </div>
            )}
          </div>
          <div className="dialog-footer-safe shrink-0 pt-3 px-5 sm:px-8 bg-white border-t border-slate-50 flex gap-2 items-center">
             {!isFormValid && (
               <p className="text-[7px] font-black uppercase tracking-widest text-red-400 mr-auto w-full sm:w-auto text-center sm:text-left">Lengkapi kolom * untuk mengaktifkan simpan.</p>
             )}
             <Button variant="ghost" onClick={closeDialog} disabled={isSubmitting} className="text-[9px] font-black uppercase text-slate-400 h-10 px-4 flex-1 sm:flex-none">Batal</Button>
             <Button disabled={!isFormValid || isSubmitting} onClick={handleSave} className={cn("bg-navy hover:bg-gold text-white rounded-xl h-10 px-6 text-[9px] font-black uppercase shadow-2xl border-none transition-all flex-1 sm:flex-[1.5]", !isFormValid && !isSubmitting && "opacity-40 cursor-not-allowed grayscale")}>
               {isSubmitting ? <Loader2 className="animate-spin h-3 w-3 mr-2" /> : "SIMPAN"}
             </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => { if (!open && !isSubmitting) { setDeleteId(null); setDeleteArmed(false); } }}>
        <AlertDialogContent className="rounded-2xl sm:rounded-[2.5rem] border-none p-6 sm:p-10 bg-white shadow-4xl text-center w-[92vw] max-w-sm">
           <div className="w-14 h-14 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4"><AlertTriangle size={28} /></div>
           <AlertDialogTitle className="text-base font-headline text-navy uppercase font-bold">Hapus Katalog?</AlertDialogTitle>
           <AlertDialogDescription className="text-slate-400 text-[9px] font-light italic text-center uppercase tracking-wider mb-5">Tindakan ini permanen pada server.</AlertDialogDescription>
           <div className="flex gap-2">
             <AlertDialogCancel disabled={isSubmitting} className="rounded-xl h-11 text-[9px] font-black bg-slate-50 border-none flex-1">BATAL</AlertDialogCancel>
             {!deleteArmed ? (
               <button type="button" disabled={isSubmitting} onClick={() => setDeleteArmed(true)} className="rounded-xl h-11 flex-1 text-[9px] font-black border border-slate-200 bg-white text-navy shadow-sm active:scale-95 transition-all disabled:opacity-50">YA, LANJUTKAN</button>
             ) : (
              <AlertDialogAction disabled={isSubmitting} onClick={async (e) => {
                 e.preventDefault();
                 setIsSubmitting(true);
                 try {
                   const table = activeTab === 'categories' ? 'categories' : 'sub_categories';
                   const { error } = await cms.from(table).delete().eq('id', deleteId);
                   if (error) throw error;
                   toast({ title: "Terhapus", description: "Item telah dibersihkan dari arsip." });
                   await fetchData();
                 } catch (err: any) {
                   toast({ variant: "destructive", title: "Gagal", description: err.message || "Gagal menghapus data." });
                 } finally {
                   setDeleteId(null);
                   setIsSubmitting(false);
                 }
              }} className="bg-red-500 text-white rounded-xl h-11 flex-1 text-[9px] font-black border-none shadow-lg disabled:opacity-50">
                {isSubmitting ? <Loader2 className="animate-spin h-3 w-3 mx-auto" /> : "HAPUS"}
              </AlertDialogAction>
             )}
           </div>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={bulkDeleteConfirm} onOpenChange={(open) => { if (!open && !isSubmitting) { setBulkDeleteConfirm(false); setBulkDeleteArmed(false); } }}>
        <AlertDialogContent className="rounded-2xl sm:rounded-[2.5rem] border-none p-6 sm:p-10 bg-white shadow-4xl text-center w-[92vw] max-w-sm">
           <div className="w-14 h-14 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4"><AlertTriangle size={28} /></div>
           <AlertDialogTitle className="text-base font-headline text-navy uppercase font-bold">Hapus Masal?</AlertDialogTitle>
           <AlertDialogDescription className="text-slate-400 text-[9px] font-light italic uppercase tracking-wider mb-5">Menghapus {selectedIds.length} katalog pilihan secara permanen.</AlertDialogDescription>
           <div className="flex gap-2">
             <AlertDialogCancel disabled={isSubmitting} className="rounded-xl h-11 text-[9px] font-black bg-slate-50 border-none flex-1">BATAL</AlertDialogCancel>
             {!bulkDeleteArmed ? (
               <button type="button" disabled={isSubmitting} onClick={() => setBulkDeleteArmed(true)} className="rounded-xl h-11 flex-1 text-[9px] font-black border border-slate-200 bg-white text-navy shadow-sm active:scale-95 transition-all disabled:opacity-50">YA, LANJUTKAN</button>
             ) : (
             <AlertDialogAction disabled={isSubmitting} onClick={async (e) => {
               e.preventDefault();
               await handleBulkDelete();
             }} className="bg-red-500 text-white rounded-xl h-11 flex-1 text-[9px] font-black border-none shadow-lg disabled:opacity-50">
               {isSubmitting ? <Loader2 className="animate-spin h-3 w-3 mx-auto" /> : "KONFIRMASI"}
             </AlertDialogAction>
             )}
           </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
