'use client';

import React, { useMemo, useState, useCallback } from 'react';
import {
  Plus, Pencil, Trash2, CalendarRange, MapPin, Search,
  LayoutGrid, FileEdit, Clock, CheckCircle2, Play, CheckCircle, XCircle, ListChecks,
} from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useOps } from '@/lib/ops/store';
import {
  DECOR_STATUSES, DECOR_STATUS_COLOR, DECOR_STATUS_LABEL, DECOR_CATEGORIES,
  type DecorProject, type DecorStatus,
} from '@/lib/ops/types';
import { cn } from '@/lib/utils';
import { decorScheduleLabel } from '@/lib/ops/reports';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { PageHeader, StatusBadge, EmptyState, Pagination, ConfirmDialog } from '../ops-ui';
import { useToast } from '@/hooks/use-toast';
import { useSubmitLock } from '@/hooks/use-submit-lock';

/* ─── Tab definitions ─────────────────────────────────────────────────── */
const TAB_ICONS: Record<string, React.ReactNode> = {
  all:        <LayoutGrid size={14} />,
  draft:      <FileEdit size={14} />,
  persiapan:  <Clock size={14} />,
  ready:      <CheckCircle2 size={14} />,
  ongoing:    <Play size={14} />,
  selesai:    <CheckCircle size={14} />,
  dibatalkan: <XCircle size={14} />,
};

const TAB_LIST = [
  { value: 'all', label: 'Semua' },
  ...DECOR_STATUSES.filter((s) => s.value !== 'selesai' && s.value !== 'dibatalkan').map((s) => ({ value: s.value, label: s.label })),
];

/* ─── Decor Form (unchanged) ──────────────────────────────────────────── */
function DecorForm({
  initial, onSubmit, onClose,
}: {
  initial?: DecorProject;
  onSubmit: (data: Partial<DecorProject>) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(initial?.name || '');
  const [client, setClient] = useState(initial?.client || '');
  const [category, setCategory] = useState<string>(initial?.category || initial?.eventType || 'Pernikahan');
  const [date, setDate] = useState(initial?.date || '');
  const [location, setLocation] = useState(initial?.location || '');
  const [status, setStatus] = useState<DecorStatus>(initial?.status || 'draft');
  const [revenue, setRevenue] = useState(initial?.revenue ? String(initial.revenue) : '');
  const [note, setNote] = useState(initial?.note || '');
  const [workStart, setWorkStart] = useState(initial?.workStart || '');
  const [workEnd, setWorkEnd] = useState(initial?.workEnd || '');
  const { locked, run } = useSubmitLock();

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await run(() => onSubmit({
      name: name.trim(), client: client.trim() || undefined, category, eventType: category,
      date: date || undefined, location: location.trim() || undefined, status,
      revenue: revenue ? Number(revenue.replace(/[^0-9]/g, '')) : undefined, note: note.trim() || undefined,
      workStart: workStart || undefined, workEnd: workEnd || undefined,
    }));
  };

  return (
    <form onSubmit={handle} className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nama Decor *</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="cth. Pernikahan Rina &amp; Aldi" required className="mt-1" />
        </div>
        <div>
          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Klien</Label>
          <Input value={client} onChange={(e) => setClient(e.target.value)} placeholder="Nama klien" className="mt-1" />
        </div>
        <div>
          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Kategori Decor</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              {DECOR_CATEGORIES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tanggal Event</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1" />
        </div>
        <div>
          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as DecorStatus)}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              {DECOR_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Jadwal Mulai</Label>
          <Input type="time" value={workStart} onChange={(e) => setWorkStart(e.target.value)} className="mt-1" />
        </div>
        <div>
          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Jadwal Selesai</Label>
          <Input type="time" value={workEnd} onChange={(e) => setWorkEnd(e.target.value)} className="mt-1" />
        </div>
        <div>
          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Lokasi</Label>
          <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="cth. Hotel Pangeran" className="mt-1" />
        </div>
        <div>
          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nilai Proyek / Omzet (Rp)</Label>
          <Input value={revenue} onChange={(e) => setRevenue(e.target.value)} placeholder="cth. 8500000" inputMode="numeric" className="mt-1" />
        </div>
      </div>
      <div>
        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Catatan</Label>
        <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Tema, permintaan khusus, dll." className="mt-1" rows={3} />
      </div>
      <DialogFooter className="gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onClose}>Batal</Button>
        <Button type="submit" disabled={locked} className="bg-navy hover:bg-gold text-white">{locked ? 'Menyimpan...' : initial ? 'Simpan Perubahan' : 'Buat Decor'}</Button>
      </DialogFooter>
    </form>
  );
}

/* ─── Decor Card ───────────────────────────────────────────────────────── */
function DecorCard({
  d, taskCount, onSelect, onEdit, onDelete, showRevenue = true,
}: {
  d: DecorProject;
  taskCount: number;
  onSelect: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  showRevenue?: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex flex-col hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-sm font-headline font-bold text-navy leading-tight">{d.name}</h3>
          <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
            <MapPin size={10} /> {d.location || 'Lokasi belum diisi'}
          </p>
          {d.date && (
            <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
              <CalendarRange size={10} /> {new Date(d.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
              <span className="text-slate-300">·</span>
              <Clock size={10} /> {decorScheduleLabel(d)}
            </p>
          )}
        </div>
        <StatusBadge color={DECOR_STATUS_COLOR[d.status]} label={DECOR_STATUS_LABEL[d.status]} />
      </div>

      <div className="mt-3 flex items-center gap-1 text-[10px] text-slate-400">
        <span className="font-bold text-navy">{d.category}</span> · {d.client || 'Tanpa klien'}
      </div>

      {taskCount > 0 && (
        <p className="text-[11px] text-slate-500 font-semibold mt-2 flex items-center gap-1">
          <ListChecks size={11} className="text-slate-400" />
          {taskCount} langkah kerja
        </p>
      )}

      {showRevenue && d.revenue ? (
        <p className="text-[11px] text-slate-500 font-semibold mt-2">Rp {d.revenue.toLocaleString('id-ID')}</p>
      ) : null}

      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-50">
        {d.status !== 'selesai' && d.status !== 'dibatalkan' ? (
          <Button size="sm" variant="outline" onClick={onSelect} className="flex-1 text-[10px] uppercase tracking-widest">
            Pilih
          </Button>
        ) : (
          <span className="flex-1 text-center text-[10px] font-bold uppercase tracking-widest text-slate-300">
            {d.status === 'selesai' ? '✓ Selesai' : '✗ Dibatalkan'}
          </span>
        )}
        {onEdit && <Button size="icon" variant="ghost" className="text-slate-400 h-9 w-9" onClick={onEdit} aria-label="Edit">
          <Pencil size={15} />
        </Button>}
        {onDelete && <Button
          size="icon" variant="ghost" className="text-red-400 hover:text-red-500 h-9 w-9"
          onClick={onDelete}
          aria-label="Hapus"
        >
          <Trash2 size={15} />
        </Button>}
      </div>
    </div>
  );
}

/* ─── Main Page ────────────────────────────────────────────────────────── */
export default function DecorPage() {
  const { currentUser, decors, addDecor, updateDecor, deleteDecor, selectDecor, tasks } = useOps();
  const isManager = currentUser.role === 'owner' || currentUser.role === 'admin';

  // Semua user hanya melihat decor aktif (nonaktifkan: selesai & dibatalkan disembunyikan)
  const visibleDecors = useMemo(
    () => decors.filter((d) => d.status !== 'selesai' && d.status !== 'dibatalkan'),
    [decors],
  );
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<DecorProject | undefined>(undefined);
  const [confirmDelete, setConfirmDelete] = useState<DecorProject | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 9;

  /* ── URL-driven tab ──────────────────────────────────────────────────── */
  const tab = searchParams.get('tab') || 'all';
  const isValidTab = TAB_LIST.some((t) => t.value === tab);
  const activeTab = isValidTab ? tab : 'all';

  const setTab = useCallback((newTab: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', newTab);
    router.push(`/ops/decor?${params.toString()}`, { scroll: false });
  }, [searchParams, router]);

  /* ── Counts per status ──────────────────────────────────────────────── */
  const counts = useMemo(() => {
    const map: Record<string, number> = { all: visibleDecors.length };
    for (const s of DECOR_STATUSES) {
      map[s.value] = visibleDecors.filter((d) => d.status === s.value).length;
    }
    return map;
  }, [visibleDecors]);

  /* ── Filtered & paginated ────────────────────────────────────────────── */
  const filtered = useMemo(
    () => visibleDecors
      .filter((d) => activeTab === 'all' || d.status === activeTab)
      .filter((d) => {
        if (!search.trim()) return true;
        const q = search.trim().toLowerCase();
        return d.name.toLowerCase().includes(q) || (d.client || '').toLowerCase().includes(q) || (d.location || '').toLowerCase().includes(q);
      })
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
    [decors, search, activeTab],
  );

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const shown = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const taskCount = useCallback((decorId: string) => tasks.filter((t) => t.decorId === decorId).length, [tasks]);

  /* ── CRUD helpers ────────────────────────────────────────────────────── */
  const openCreate = () => { setEditing(undefined); setModalOpen(true); };
  const openEdit = (d: DecorProject) => { setEditing(d); setModalOpen(true); };

  const submit = (data: Partial<DecorProject>) => {
    if (editing) {
      updateDecor(editing.id, data);
      toast({ title: 'Decor diperbarui' });
    } else {
      const d = addDecor(data);
      selectDecor(d.id);
      toast({ title: 'Decor dibuat' });
    }
    setModalOpen(false);
  };

  const handleDelete = (d: DecorProject) => {
    setConfirmDelete(d);
  };

  return (
    <div>
      <PageHeader
        title="Daftar Decor / Proyek"
        subtitle="Kelola semua pekerjaan dekorasi yang sedang berjalan"
        action={isManager ? (
          <Button onClick={openCreate} className="bg-navy hover:bg-gold text-white">
            <Plus size={15} /> Tambah Decor
          </Button>
        ) : undefined}
      />

      {/* ── Tab bar (URL-driven) ─────────────────────────────────────────── */}
      <div className="flex gap-1.5 mb-4 overflow-x-auto no-scrollbar pb-1">
        {TAB_LIST.map((t) => {
          const isActive = t.value === activeTab;
          const count = counts[t.value] ?? 0;
          return (
            <button
              key={t.value}
              onClick={() => { setTab(t.value); setPage(1); }}
              className={cn(
                "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border shrink-0 select-none",
                isActive
                  ? "bg-navy text-white border-navy shadow-sm"
                  : "bg-white text-slate-400 border-slate-200 hover:border-slate-300 hover:text-slate-500",
              )}
            >
              {TAB_ICONS[t.value]}
              {t.label}
              <span
                className={cn(
                  "ml-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[9px] font-bold leading-none px-1",
                  isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-400",
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Search ────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Cari nama decor, klien, atau lokasi..."
            className="h-9 w-full rounded-lg border border-slate-200 pl-8 pr-3 text-[11px] bg-white focus:outline-none focus:ring-2 focus:ring-gold/30 transition-shadow"
          />
        </div>
        <p className="text-[10px] text-slate-400 whitespace-nowrap">
          {filtered.length} decor ditemukan
        </p>
      </div>

      {/* ── Grid ──────────────────────────────────────────────────────────── */}
      {decors.length === 0 ? (
        <EmptyState icon={<CalendarRange size={20} />} title="Belum ada decor" sub="Buat decor pertama Anda." />
      ) : visibleDecors.length === 0 ? (
        <EmptyState icon={<CalendarRange size={20} />} title="Tidak ada decor aktif" sub="Decor yang sudah selesai atau dibatalkan disembunyikan dari daftar." />
      ) : shown.length === 0 ? (
        <EmptyState icon={<CalendarRange size={20} />} title="Tidak ditemukan" sub="Coba ubah kata kunci atau pilih tab lain." />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {shown.map((d) => (
              <DecorCard
              key={d.id}
              d={d}
              taskCount={taskCount(d.id)}
              onSelect={() => { selectDecor(d.id); toast({ title: `Decor "${d.name}" dipilih` }); }}
                onEdit={isManager ? () => openEdit(d) : undefined}
                onDelete={isManager ? () => handleDelete(d) : undefined}
                showRevenue={isManager}
            />
          ))}
        </div>
      )}

      {/* ── Pagination ────────────────────────────────────────────────────── */}
      {shown.length > 0 && (
        <Pagination page={page} totalPages={pageCount} onPage={setPage} className="mt-4" />
      )}

      {/* ── Create / Edit dialog ──────────────────────────────────────────── */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="rounded-2xl max-h-[90vh] overflow-y-auto overflow-x-hidden">
          <DialogHeader>
            <DialogTitle className="text-lg text-navy flex items-center gap-2">
              {editing ? <><Pencil size={16} /> Ubah Decor</> : <><Plus size={16} /> Tambah Decor</>}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              {editing ? 'Perbarui informasi project dekor.' : 'Buat project dekor baru untuk mulai dikelola.'}
            </DialogDescription>
          </DialogHeader>
          <DecorForm initial={editing} onSubmit={submit} onClose={() => setModalOpen(false)} />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!confirmDelete}
        onOpenChange={(open) => !open && setConfirmDelete(null)}
        title="Hapus decor ini?"
        description={
          confirmDelete
            ? <>
                Decor <span className="font-semibold text-navy">{confirmDelete.name}</span> beserta seluruh{' '}
                <span className="font-semibold text-navy">tugas & data terkait</span> akan dihapus permanen.
                Tindakan ini tidak dapat dibatalkan.
              </>
            : ''
        }
        confirmText="Ya, Hapus"
        onConfirm={() => {
          if (confirmDelete) {
            deleteDecor(confirmDelete.id);
            setConfirmDelete(null);
            toast({ title: 'Decor dihapus' });
          }
        }}
      />
    </div>
  );
}
