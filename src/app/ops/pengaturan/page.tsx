'use client';

import React, { useState, useCallback } from 'react';
import { Plus, Trash2, Users, ClipboardList, Tags, Settings as SettingsIcon, Pencil } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useOps, userFirst } from '@/lib/ops/store';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { PageHeader, SectionCard } from '../ops-ui';
import { useToast } from '@/hooks/use-toast';
import type { UserRole } from '@/lib/ops/types';
import type { OpsUser } from '@/lib/ops/types';

const ROLE_LABEL: Record<UserRole, string> = { owner: 'Owner', admin: 'Admin', freelancer: 'Freelancer' };

const TAB_LIST = [
  { value: 'tim', label: 'Tim & Akses', icon: Users },
  { value: 'jenis', label: 'Jenis Kegiatan', icon: Tags },
  { value: 'template', label: 'Template Tugas', icon: ClipboardList },
  { value: 'sistem', label: 'Sistem', icon: SettingsIcon },
] as const;

type TabValue = typeof TAB_LIST[number]['value'];
const VALID_TABS: TabValue[] = ['tim', 'jenis', 'template', 'sistem'];

export default function PengaturanPage() {
  const { state, currentUser, addUser, updateUser, deleteUser, updateSettings } = useOps();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();

  const rawTab = searchParams.get('tab');
  const tab: TabValue = (rawTab && VALID_TABS.includes(rawTab as TabValue)) ? (rawTab as TabValue) : 'tim';

  const setTab = useCallback((newTab: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', newTab);
    router.push(`/ops/pengaturan?${params.toString()}`, { scroll: false });
  }, [searchParams, router]);

  // user form
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<OpsUser | undefined>(undefined);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState<UserRole>('freelancer');
  const [phone, setPhone] = useState('');

  // jenis kegiatan
  const [newType, setNewType] = useState('');
  // template
  const [newTpl, setNewTpl] = useState('');

  const openCreate = () => { setEditing(undefined); setName(''); setUsername(''); setRole('freelancer'); setPhone(''); setOpen(true); };
  const openEdit = (u: OpsUser) => { setEditing(u); setName(u.name); setUsername(u.username); setRole(u.role); setPhone(u.phone || ''); setOpen(true); };

  const submitUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !username.trim()) return;
    if (editing) {
      updateUser(editing.id, { name: name.trim(), username: username.trim(), role, phone: phone.trim() || undefined });
      toast({ title: 'Anggota diperbarui' });
    } else {
      addUser({ name: name.trim(), username: username.trim(), role, phone: phone.trim() || undefined, active: true });
      toast({ title: 'Anggota ditambahkan' });
    }
    setOpen(false);
  };

  const addType = () => {
    const t = newType.trim();
    if (!t) return;
    if (state.settings.activityTypes.includes(t)) { toast({ title: 'Jenis sudah ada' }); return; }
    updateSettings({ activityTypes: [...state.settings.activityTypes, t] });
    setNewType('');
    toast({ title: 'Jenis kegiatan ditambahkan' });
  };

  const addTpl = () => {
    const t = newTpl.trim();
    if (!t) return;
    updateSettings({ taskTemplate: [...state.settings.taskTemplate, t] });
    setNewTpl('');
    toast({ title: 'Template ditambahkan' });
  };

  return (
    <div>
      <PageHeader title="Pengaturan" subtitle="Kelola user, kategori pekerjaan, dan konfigurasi sistem" />

      {/* Permission note */}
      {currentUser.role !== 'owner' && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-700 font-semibold">
          Mode demo: saat ini bertindak sebagai {currentUser.name} ({ROLE_LABEL[currentUser.role]}). Hanya Owner yang dapat mengubah pengaturan.
        </div>
      )}

      <div className="flex gap-1.5 mb-4 overflow-x-auto no-scrollbar pb-1">
        {TAB_LIST.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={cn(
              "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border shrink-0 select-none",
              tab === t.value ? "bg-navy text-white border-navy shadow-sm" : "bg-white text-slate-400 border-slate-200 hover:border-slate-300 hover:text-slate-500",
            )}
          >
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'tim' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-[12px] font-black uppercase tracking-widest text-navy">Anggota Tim ({state.users.length})</p>
            <Button onClick={openCreate} className="bg-navy hover:bg-gold text-white"><Plus size={15} /> Tambah User</Button>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm divide-y divide-slate-50">
            {state.users.map((u) => (
              <div key={u.id} className="flex items-center justify-between p-4 gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="h-10 w-10 rounded-full bg-navy text-white text-[13px] font-bold flex items-center justify-center shrink-0">{userFirst(state, u.id)}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-navy truncate">
                      {u.name}
                      {u.id === state.currentUserId && <span className="ml-2 text-[8px] uppercase tracking-widest text-gold font-black">(Anda)</span>}
                    </p>
                    <p className="text-[10px] text-slate-400">@{u.username}{u.phone ? ` · ${u.phone}` : ''}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Select value={u.role} onValueChange={(v) => { updateUser(u.id, { role: v as UserRole }); toast({ title: 'Role diperbarui' }); }}>
                    <SelectTrigger className={cn("h-8 w-[110px] text-[10px]",
                      u.role === 'owner' ? "text-gold font-bold" : u.role === 'admin' ? "text-sky-600" : "text-slate-500")}>
                      <SelectValue>{ROLE_LABEL[u.role]}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {(['owner', 'admin', 'freelancer'] as UserRole[]).map((r) => <SelectItem key={r} value={r}>{ROLE_LABEL[r]}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Switch
                    checked={u.active}
                    onCheckedChange={(v) => { updateUser(u.id, { active: v }); toast({ title: v ? 'Anggota diaktifkan' : 'Anggota dinonaktifkan' }); }}
                  />
                  <Button variant="ghost" size="icon" className="text-slate-400 h-8 w-8" onClick={() => openEdit(u)} aria-label="edit"><Pencil size={14} /></Button>
                  <Button
                    variant="ghost" size="icon" className="text-red-400 hover:text-red-500 h-8 w-8"
                    onClick={() => { if (u.id === state.currentUserId) { toast({ title: 'Tidak bisa menghapus diri sendiri' }); return; } if (confirm(`Hapus user "${u.name}"?`)) { deleteUser(u.id); toast({ title: 'User dihapus' }); } }}
                    aria-label="hapus"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-slate-400 mt-3">Saklar = aktif/tidak aktif. Owner memiliki akses penuh ke semua data & pengaturan.</p>
        </div>
      )}

      {tab === 'jenis' && (
        <div className="grid lg:grid-cols-2 gap-4">
          <SectionCard title="Daftar Jenis Kegiatan">
            <ul className="divide-y divide-slate-50">
              {state.settings.activityTypes.map((t) => (
                <li key={t} className="flex items-center justify-between py-2.5">
                  <span className="text-sm text-navy font-medium">{t}</span>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-500"
                    onClick={() => { if (confirm(`Hapus jenis "${t}"?`)) { updateSettings({ activityTypes: state.settings.activityTypes.filter((x) => x !== t) }); toast({ title: 'Dihapus' }); } }}>
                    <Trash2 size={14} />
                  </Button>
                </li>
              ))}
            </ul>
          </SectionCard>
          <SectionCard title="Tambah Jenis Kegiatan">
            <div className="flex gap-2">
              <Input value={newType} onChange={(e) => setNewType(e.target.value)} placeholder="cth. Pemasangan" onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addType(); } }} />
              <Button onClick={addType} className="bg-navy hover:bg-gold text-white shrink-0"><Plus size={15} /> Tambah</Button>
            </div>
            <p className="text-[10px] text-slate-400 mt-3">Jenis kegiatan dipakai di form pencatatan kegiatan (Muat Barang, Pemasangan, Penyelesaian, Bongkar, Dokumentasi, dll).</p>
          </SectionCard>
        </div>
      )}

      {tab === 'template' && (
        <div className="grid lg:grid-cols-2 gap-4">
          <SectionCard title="Template Tugas Per Proyek">
            <ul className="divide-y divide-slate-50">
              {state.settings.taskTemplate.map((t) => (
                <li key={t} className="flex items-center justify-between py-2.5">
                  <span className="text-sm text-navy font-medium">{t}</span>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-500"
                    onClick={() => { if (confirm(`Hapus template "${t}"?`)) { updateSettings({ taskTemplate: state.settings.taskTemplate.filter((x) => x !== t) }); toast({ title: 'Dihapus' }); } }}>
                    <Trash2 size={14} />
                  </Button>
                </li>
              ))}
            </ul>
          </SectionCard>
          <SectionCard title="Tambah Template Tugas">
            <div className="flex gap-2">
              <Input value={newTpl} onChange={(e) => setNewTpl(e.target.value)} placeholder="cth. Pasang backdrop" onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTpl(); } }} />
              <Button onClick={addTpl} className="bg-navy hover:bg-gold text-white shrink-0"><Plus size={15} /> Tambah</Button>
            </div>
            <p className="text-[10px] text-slate-400 mt-3">Template ini muncul sebagai tombol cepat di halaman Tugas (Muat barang, Pemasangan backdrop, Pencahayaan, Bongkar, Dokumentasi, dll).</p>
          </SectionCard>
        </div>
      )}

      {tab === 'sistem' && (
        <SectionCard title="Konfigurasi Sistem">
          <div className="space-y-5 max-w-lg">
            <div>
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nama Aplikasi</Label>
              <div className="flex gap-2 mt-1.5">
                <Input value={state.settings.appName} onChange={(e) => updateSettings({ appName: e.target.value })} />
                <Button variant="outline" onClick={() => toast({ title: 'Tersimpan otomatis' })}>Simpan</Button>
              </div>
            </div>
            <div className="flex items-center justify-between py-3 border-t border-slate-50">
              <div>
                <p className="text-sm font-semibold text-navy">Absensi Wajib</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Jika aktif, user wajib absen sebelum bekerja. Direkomendasikan NONAKTIF agar model kerja tetap fleksibel.</p>
              </div>
              <Switch checked={state.settings.attendanceRequired} onCheckedChange={(v) => { updateSettings({ attendanceRequired: v }); toast({ title: 'Pengaturan absensi diperbarui' }); }} />
            </div>
            <div className="py-3 border-t border-slate-50">
              <p className="text-sm font-semibold text-navy">Tentang Sistem</p>
              <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                Pusat data sistem ini adalah <span className="font-bold text-navy">Decor / Proyek</span>, bukan absensi.
                Absensi bersifat opsional; yang utama adalah kegiatan &amp; tugas yang benar-benar dikerjakan.
                Data tersimpan di localStorage browser (statis, tanpa database).
              </p>
            </div>
          </div>
        </SectionCard>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg text-navy flex items-center gap-2">
              {editing ? <><Pencil size={16} /> Edit User</> : <><Plus size={16} /> Tambah User</>}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400">Kelola akun anggota tim BluDecor.</DialogDescription>
          </DialogHeader>
          <form onSubmit={submitUser} className="space-y-4">
            <div>
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nama Lengkap *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required className="mt-1" placeholder="cth. Jimmy" />
            </div>
            <div>
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Username *</Label>
              <Input value={username} onChange={(e) => setUsername(e.target.value)} required className="mt-1" placeholder="cth. jimmy" />
            </div>
            <div>
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Role</Label>
              <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(['owner', 'admin', 'freelancer'] as UserRole[]).map((r) => <SelectItem key={r} value={r}>{ROLE_LABEL[r]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">No. HP</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1" placeholder="08xxx" />
            </div>
            <DialogFooter className="gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
              <Button type="submit" className="bg-navy hover:bg-gold text-white">{editing ? 'Simpan' : 'Tambah User'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
