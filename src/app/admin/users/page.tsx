"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Users, Plus, Trash2, Loader2, Search, ChevronLeft, ChevronRight, AlertTriangle, UserX, ShieldCheck, Terminal, Eye, EyeOff, Crown
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { cms } from '@/lib/cms-client';
import { cn } from '@/lib/utils';

/**
 * UsersAdmin v122.0 - ULTRA-RESPONSIVE FIX
 */

export default function UsersAdmin() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState('');
  const [currentUserName, setCurrentUserName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const [formData, setFormData] = useState({ username: '', password: '', full_name: '', role: 'staff' });
  const dialogCloseGuardRef = React.useRef(false);

  const closeDialog = useCallback(() => {
    if (submitting) return;
    dialogCloseGuardRef.current = true;
    setIsAdding(false);
    requestAnimationFrame(() => { dialogCloseGuardRef.current = false; });
  }, [submitting]);

  useEffect(() => {
    if (isAdding || dialogCloseGuardRef.current) return;
    const t = setTimeout(() => {
      setFormData({ username: '', password: '', full_name: '', role: 'staff' });
      setShowPassword(false);
    }, 350);
    return () => clearTimeout(t);
  }, [isAdding]);

  useEffect(() => {
    setCurrentUserRole(localStorage.getItem('blu_user_role') || '');
    setCurrentUserName((localStorage.getItem('blu_user_name') || '').toLowerCase());
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await cms.rpc('get_team_members');
      if (error) throw error;
      setUsers(data || []);
    } catch (err: any) {
      console.error("Fetch Users Error:", err);
      toast({ 
        variant: "destructive", 
        title: "Sinkronisasi Gagal", 
        description: "Terjadi anomali pada sistem otorisasi." 
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const syncSearchToURL = useCallback((value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set('q', value);
    } else {
      params.delete('q');
    }
    router.replace(`/admin/users?${params.toString()}`, { scroll: false });
  }, [router, searchParams]);

  const filteredUsers = useMemo(() => 
    users.filter(u => 
      u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      u.username?.toLowerCase().includes(searchTerm.toLowerCase())
    ),
  [users, searchTerm]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(start, start + itemsPerPage);
  }, [filteredUsers, currentPage, itemsPerPage]);

  const isFormValid = formData.username.trim() !== '' && formData.password.trim().length >= 6 && formData.full_name.trim() !== '';
  const usernameValid = formData.username.trim() !== '' && !/\s/.test(formData.username) && /^[a-zA-Z0-9._-]+$/.test(formData.username.trim());
  const fullNameValid = formData.full_name.trim() !== '';
  const passwordValid = formData.password.length >= 6;

  const assertDeletable = (targets: any[]): boolean => {
    if (targets.some(u => (u.username || '').toLowerCase() === currentUserName)) {
      toast({ variant: "destructive", title: "Ditolak", description: "Anda tidak dapat menghapus akun yang sedang digunakan." });
      return false;
    }
    if (
      targets.some(u => u.role === 'developer' || u.role === 'owner') &&
      !(currentUserRole === 'developer' || currentUserRole === 'owner')
    ) {
      toast({ variant: "destructive", title: "Ditolak", description: "Hanya owner/developer yang dapat menghapus akun owner/developer." });
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!isFormValid) return;
    setSubmitting(true);
    try {
      const { error } = await cms.rpc('insert_user', {
        p_username: formData.username.trim().toLowerCase(),
        p_password: formData.password,
        p_full_name: formData.full_name.trim(),
        p_role: formData.role
      });
      
      if (error) throw error;
      
      toast({ title: "Registrasi Berhasil", description: "Anggota tim telah diaktifkan." });
      await fetchData();
      setIsAdding(false);
      setFormData({ username: '', password: '', full_name: '', role: 'staff' });
    } catch (err: any) {
      toast({ 
        variant: "destructive", 
        title: "Gagal", 
        description: err.code === '23505' ? "Username sudah terpakai." : "Gagal menyimpan data." 
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleBulkDelete = async () => {
    const targets = users.filter(u => selectedIds.includes(u.id));
    if (!assertDeletable(targets)) return;
    setSubmitting(true);
    try {
      const { error } = await cms.rpc('delete_users', { p_ids: selectedIds });
      if (error) throw error;
      
      setUsers(prev => prev.filter(u => !selectedIds.includes(u.id)));
      setSelectedIds([]);
      toast({ title: "Pembersihan Selesai", description: "Tim pilihan telah dihapus." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Gagal", description: "Gagal menghapus data tim." });
    } finally {
      setBulkDeleteConfirm(false);
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-up text-left pb-10 w-full max-w-full overflow-x-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2 border-b border-slate-100">
        <h1 className="text-xl font-headline font-bold text-navy uppercase tracking-tighter">Kelola Tim</h1>
        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && <Button onClick={() => setBulkDeleteConfirm(true)} variant="destructive" className="h-11 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg">HAPUS ({selectedIds.length})</Button>}
          <Button onClick={() => { setFormData({ username: '', password: '', full_name: '', role: 'staff' }); setIsAdding(true); }} className="bg-navy hover:bg-gold text-white rounded-xl h-11 px-8 text-[10px] font-black uppercase tracking-widest shadow-md border-none w-full md:w-auto">
            <Plus size={16} className="mr-2" /> Registrasi Anggota
          </Button>
        </div>
      </div>

      <div className="relative w-full max-w-full lg:max-w-xs">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
        <Input placeholder="CARI STAF / ID..." value={searchTerm} onChange={(e) => syncSearchToURL(e.target.value)} className="h-11 rounded-xl bg-white border-none shadow-sm pl-11 text-[10px] font-bold uppercase tracking-widest" />
      </div>

      {loading ? (
        <div className="py-24 flex flex-col items-center gap-4">
           <Loader2 className="h-6 w-6 animate-spin text-gold" />
           <p className="text-[10px] font-bold text-slate-200 uppercase tracking-[0.4em]">Sinkronisasi Tim...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-50 overflow-hidden py-32 flex flex-col items-center justify-center space-y-6 text-center">
           <div className="w-20 h-20 bg-slate-50 rounded-[2.5rem] flex items-center justify-center text-slate-200 shadow-inner"><UserX size={40} /></div>
           <h2 className="text-sm font-headline font-bold text-navy uppercase tracking-widest">Daftar Tim Kosong</h2>
           <Button onClick={fetchData} variant="outline" className="rounded-xl h-12 px-8 border-slate-100 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all">REFRESH DATA</Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {paginatedUsers.map((u) => (
              <div key={u.id} className="bg-white p-4 rounded-[2rem] border border-slate-50 shadow-sm flex flex-col gap-4 animate-fade-up">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-navy/5 rounded-xl flex items-center justify-center text-navy font-black text-[12px] border border-navy/5 shrink-0">{u.full_name?.charAt(0)}</div>
                      <div className="space-y-0.5 min-w-0">
                        <p className="font-bold text-navy text-[11px] uppercase tracking-wider truncate">{u.full_name}</p>
                        <p className="font-mono text-[9px] text-slate-400">@{u.username}</p>
                      </div>
                   </div>
                   <Button onClick={() => setDeleteConfirmId(u.id)} variant="ghost" size="icon" className="h-9 w-9 text-slate-300 hover:text-red-500 rounded-xl bg-slate-50 shrink-0"><Trash2 size={16} /></Button>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                  <span className={cn("px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-[0.2em] border flex items-center gap-1.5", 
                    u.role === 'owner' ? "bg-red-50 text-red-600 border-red-100" : 
                    u.role === 'developer' ? "bg-purple-50 text-purple-600 border-purple-100" : 
                    u.role === 'admin' ? "bg-gold/10 text-gold border-gold/10" : 
                    "bg-blue-50 text-blue-600 border-blue-100"
                  )}>
                    {u.role === 'owner' && <Crown size={10} />}
                    {u.role === 'developer' && <Terminal size={10} />}
                    {u.role === 'admin' && <ShieldCheck size={10} />}
                    {u.role.toUpperCase()}
                  </span>
                  <span className="text-[8px] text-slate-300 font-bold uppercase">{new Date(u.created_at).toLocaleDateString('id-ID')}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden md:block bg-white rounded-[2rem] shadow-sm border border-slate-50 overflow-x-auto no-scrollbar">
            <Table className="min-w-[800px]">
              <TableHeader className="bg-slate-50/50">
                <TableRow className="border-none h-12">
                  <TableHead className="w-12 pl-8"><Checkbox checked={selectedIds.length === paginatedUsers.length && paginatedUsers.length > 0} onCheckedChange={() => setSelectedIds(selectedIds.length === paginatedUsers.length ? [] : paginatedUsers.map(u => u.id))} /></TableHead>
                  <TableHead className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-400">Nama Personel</TableHead>
                  <TableHead className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-400">ID Akses</TableHead>
                  <TableHead className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-400 text-center">Otoritas</TableHead>
                  <TableHead className="w-32 text-right pr-8">Opsi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedUsers.map((u) => (
                  <TableRow key={u.id} className="border-slate-50 hover:bg-slate-50/30 transition-colors">
                    <TableCell className="pl-8"><Checkbox checked={selectedIds.includes(u.id)} onCheckedChange={() => setSelectedIds(prev => prev.includes(u.id) ? prev.filter(i => i !== u.id) : [...prev, u.id])} /></TableCell>
                    <TableCell className="py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-navy/5 rounded-xl flex items-center justify-center text-navy font-black text-[11px] uppercase border border-navy/5">{u.full_name?.charAt(0)}</div>
                        <p className="font-bold text-navy text-[11px] uppercase tracking-wider whitespace-nowrap">{u.full_name}</p>
                      </div>
                    </TableCell>
                    <TableCell className="py-3 font-mono text-[10px] text-slate-400">@{u.username}</TableCell>
                    <TableCell className="py-3 text-center">
                      <span className={cn("px-3 py-1 rounded-md text-[8px] font-black uppercase tracking-[0.2em] border flex items-center justify-center gap-1.5 mx-auto w-fit whitespace-nowrap", 
                        u.role === 'owner' ? "bg-red-50 text-red-600 border-red-50" : 
                        u.role === 'developer' ? "bg-purple-50 text-purple-600 border-purple-50" : 
                        u.role === 'admin' ? "bg-gold/10 text-gold border-gold/10" : 
                        "bg-blue-50 text-blue-600 border-blue-50"
                      )}>
                        {u.role === 'owner' && <Crown size={10} />}
                        {u.role === 'developer' && <Terminal size={10} />}
                        {u.role === 'admin' && <ShieldCheck size={10} />}
                        {u.role.toUpperCase()}
                      </span>
                    </TableCell>
                    <TableCell className="py-3 pr-8 text-right">
                       <Button onClick={() => setDeleteConfirmId(u.id)} variant="ghost" size="icon" className="h-9 w-9 text-slate-300 hover:text-red-500 rounded-xl bg-slate-50 hover:bg-red-50 transition-all"><Trash2 size={16} /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between pt-6 px-4">
             <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">HALAMAN {currentPage} DARI {totalPages || 1}</p>
             <div className="flex items-center gap-1.5">
                <Button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)} variant="outline" className="h-10 w-10 p-0 rounded-xl border-slate-100 bg-white"><ChevronLeft size={18} /></Button>
                <Button disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(p => p + 1)} variant="outline" className="h-10 w-10 p-0 rounded-xl border-slate-100 bg-white"><ChevronRight size={18} /></Button>
             </div>
          </div>
        </>
      )}

      {/* Dialog Accessibility Fix v124.0 - RESPONSIVE */}
      <Dialog open={isAdding} onOpenChange={(open) => { if (!open) closeDialog(); }}>
        <DialogContent onOpenAutoFocus={(e) => e.preventDefault()} onCloseAutoFocus={(e) => e.preventDefault()} className="sm:max-w-[400px] p-0 overflow-hidden bg-white shadow-5xl border-none rounded-t-2xl sm:rounded-[3rem] flex flex-col max-h-[88vh] sm:max-h-[90vh]">
          <DialogHeader className="bg-navy p-5 sm:p-8 text-white relative shrink-0">
             <DialogTitle className="text-base sm:text-lg font-headline font-bold uppercase tracking-widest relative z-10">Staf Baru</DialogTitle>
             <DialogDescription className="text-[9px] sm:text-[10px] uppercase tracking-widest text-white/40 relative z-10 font-medium">Panel pendaftaran otorisasi tim.</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-5 sm:px-8 md:px-10 pt-5 space-y-4 no-scrollbar">
            <div className="space-y-1.5">
              <Label className="text-[9px] sm:text-[10px] font-black uppercase text-slate-400 ml-1">Nama Lengkap *</Label>
              <Input value={formData.full_name} onChange={(e) => setFormData({...formData, full_name: e.target.value})} autoComplete="name" className="h-10 sm:h-12 rounded-xl sm:rounded-2xl bg-slate-50 border-none px-3 sm:px-5 shadow-inner text-[13px] sm:text-[14px] font-bold text-navy" placeholder="E.G. AHMAD ARSITEK" />
              {!fullNameValid && <p className="text-[9px] font-bold uppercase tracking-wider text-red-500 ml-1">Nama lengkap wajib diisi.</p>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1.5">
                <Label className="text-[9px] sm:text-[10px] font-black uppercase text-slate-400 ml-1">ID Pengguna *</Label>
                <Input value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} autoComplete="username" className={cn("h-10 sm:h-12 rounded-xl sm:rounded-2xl bg-slate-50 border-none px-3 sm:px-5 shadow-inner text-[13px] sm:text-[14px] font-bold text-navy", formData.username !== '' && !usernameValid && "ring-1 ring-red-300")} placeholder="USERNAME" />
                {formData.username !== '' && !usernameValid ? (
                  <p className="text-[9px] font-bold uppercase tracking-wider text-red-500 ml-1">Hanya huruf, angka, titik, garis bawah.</p>
                ) : (
                  <p className="text-[9px] text-slate-300 ml-1 lowercase tracking-wide">Otomatis menjadi huruf kecil.</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-[9px] sm:text-[10px] font-black uppercase text-slate-400 ml-1">Kode Rahasia *</Label>
                <div className="relative">
                  <Input type={showPassword ? 'text' : 'password'} value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} autoComplete="new-password" className="h-10 sm:h-12 rounded-xl sm:rounded-2xl bg-slate-50 border-none px-3 sm:px-5 pr-10 sm:pr-12 shadow-inner text-[13px] sm:text-[14px] font-bold" placeholder="••••••" />
                  <button type="button" aria-label={showPassword ? 'Sembunyikan sandi' : 'Tampilkan sandi'} onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-gold p-1 transition-colors">
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                {!passwordValid && <p className="text-[9px] font-bold uppercase tracking-wider text-red-500 ml-1">Minimal 6 karakter.</p>}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[9px] sm:text-[10px] font-black uppercase text-slate-400 ml-1">Otoritas Sistem</Label>
              <Select value={formData.role} onValueChange={(val) => setFormData({...formData, role: val})}>
                <SelectTrigger className="h-10 sm:h-12 rounded-xl sm:rounded-2xl bg-slate-50 border-none px-3 sm:px-5 text-[10px] font-bold uppercase shadow-inner ring-0 focus:ring-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-none shadow-5xl p-1.5 bg-white z-[1100] max-h-[40vh]">
                  <SelectItem value="staff" className="text-[10px] font-bold uppercase py-2.5 rounded-lg hover:bg-slate-50">CONTENT STAFF</SelectItem>
                  <SelectItem value="admin" className="text-[10px] font-bold uppercase py-2.5 rounded-lg hover:bg-slate-50 text-gold">SUPER ADMIN</SelectItem>
                  {(currentUserRole === 'developer' || currentUserRole === 'owner') && (
                    <SelectItem value="owner" className="text-[10px] font-bold uppercase py-2.5 rounded-lg hover:bg-slate-50 text-red-600">OWNER</SelectItem>
                  )}
                  {(currentUserRole === 'developer' || currentUserRole === 'owner') && (
                    <SelectItem value="developer" className="text-[10px] font-bold uppercase py-2.5 rounded-lg hover:bg-slate-50 text-purple-600">SYSTEM DEVELOPER</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="dialog-footer-safe shrink-0 pt-3 px-5 sm:px-8 md:px-10 bg-white border-t border-slate-50 flex flex-col sm:flex-row gap-2 sm:gap-3">
             {!isFormValid && (
               <p className="text-[8px] font-black uppercase tracking-widest text-red-400 sm:mr-auto self-center text-center sm:text-left w-full sm:w-auto">
                 Lengkapi kolom bertanda * untuk mengaktifkan tombol.
               </p>
             )}
             <Button variant="ghost" onClick={closeDialog} disabled={submitting} className="text-[10px] font-black uppercase text-slate-400 h-10 sm:h-12 px-4 flex-1 sm:flex-none">Batal</Button>
             <Button disabled={!isFormValid || submitting} onClick={handleSave} className={cn("bg-navy hover:bg-gold text-white rounded-xl sm:rounded-[1.8rem] h-10 sm:h-12 px-6 sm:px-8 text-[10px] font-black uppercase shadow-2xl border-none transition-all flex-1 sm:flex-[1.5] active:scale-95 group", !isFormValid && !submitting && "opacity-40 cursor-not-allowed grayscale")}>
               {submitting ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : "AKTIFKAN AKSES"}
             </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => { if (!open && !submitting) setDeleteConfirmId(null); }}>
        <AlertDialogContent className="rounded-2xl sm:rounded-[3rem] border-none p-6 sm:p-10 bg-white shadow-5xl text-center w-[92vw] max-sm:max-w-sm">
          <div className="w-14 h-14 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner"><AlertTriangle size={28} /></div>
          <AlertDialogTitle className="text-base sm:text-lg font-headline text-navy uppercase font-bold tracking-tighter">Hapus Personel?</AlertDialogTitle>
          <AlertDialogDescription className="text-slate-400 text-[9px] sm:text-[10px] font-light italic uppercase tracking-wider mb-6 leading-relaxed">Seluruh izin akses personel ini akan dicabut secara permanen.</AlertDialogDescription>
          <div className="flex gap-2">
            <AlertDialogCancel disabled={submitting} className="rounded-xl h-11 text-[10px] font-black bg-slate-100 text-navy border-none flex-1">BATAL</AlertDialogCancel>
             <AlertDialogAction disabled={submitting} onClick={async (e) => {
                e.preventDefault();
                const target = users.find(u => u.id === deleteConfirmId);
                if (target && !assertDeletable([target])) { setDeleteConfirmId(null); return; }
                setSubmitting(true);
               try {
                  const { error } = await cms.rpc('delete_users', { p_ids: [deleteConfirmId] });
                  if (error) throw error;
                  setUsers(prev => prev.filter(u => u.id !== deleteConfirmId));
                  toast({ title: "Terhapus", description: "Personel telah dikeluarkan." });
               } catch (e) {
                  toast({ variant: "destructive", title: "Error", description: "Gagal menghapus data." });
               } finally {
                  setDeleteConfirmId(null);
                  setSubmitting(false);
               }
            }} className="bg-red-500 text-white rounded-xl h-11 flex-1 text-[10px] font-black border-none shadow-lg disabled:opacity-50">
              {submitting ? <Loader2 className="animate-spin h-3 w-3 mx-auto" /> : "HAPUS AKSES"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={bulkDeleteConfirm} onOpenChange={(open) => { if (!open && !submitting) setBulkDeleteConfirm(false); }}>
        <AlertDialogContent className="rounded-2xl sm:rounded-[3rem] border-none p-6 sm:p-10 bg-white shadow-5xl text-center w-[92vw] max-sm:max-w-sm">
          <div className="w-14 h-14 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner"><AlertTriangle size={28} /></div>
          <AlertDialogTitle className="text-base sm:text-lg font-headline text-navy uppercase font-bold tracking-tighter">Hapus Masal?</AlertDialogTitle>
          <AlertDialogDescription className="text-slate-400 text-[9px] sm:text-[10px] font-light italic uppercase tracking-wider mb-6 leading-relaxed">Seluruh izin akses {selectedIds.length} personel ini akan dicabut secara permanen.</AlertDialogDescription>
          <div className="flex gap-2">
            <AlertDialogCancel disabled={submitting} className="rounded-xl h-11 text-[10px] font-black bg-slate-100 text-navy border-none flex-1">BATAL</AlertDialogCancel>
            <AlertDialogAction disabled={submitting} onClick={async (e) => { e.preventDefault(); await handleBulkDelete(); }} className="bg-red-500 text-white rounded-xl h-11 flex-1 text-[10px] font-black border-none shadow-lg disabled:opacity-50">
              {submitting ? <Loader2 className="animate-spin h-3 w-3 mx-auto" /> : "HAPUS AKSES"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
