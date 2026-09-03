'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { Plus, Trash2, ListChecks, LayoutList, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { useSearchParams, useRouter } from 'next/navigation';
import { useOps } from '@/lib/ops/store';
import { TASK_STATUS_LABEL, TASK_STATUS_COLOR, type Task, type TaskStatus } from '@/lib/ops/types';
import { decorScheduleLocked, decorScheduleLockReason } from '@/lib/ops/reports';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { PageHeader, SectionCard, StatusBadge, EmptyState, ProgressBar } from '../ops-ui';
import { useToast } from '@/hooks/use-toast';
import { useSubmitLock } from '@/hooks/use-submit-lock';

const STATUSES: TaskStatus[] = ['belum', 'dikerjakan', 'selesai', 'terhambat'];

const STATUS_TABS = [
  { value: 'all', label: 'Semua', icon: LayoutList },
  { value: 'belum', label: 'Belum', icon: ListChecks },
  { value: 'dikerjakan', label: 'Dikerjakan', icon: Clock },
  { value: 'selesai', label: 'Selesai', icon: CheckCircle },
  { value: 'terhambat', label: 'Terhambat', icon: AlertTriangle },
] as const;

type StatusTab = typeof STATUS_TABS[number]['value'];
const VALID_TABS: string[] = ['all', ...STATUSES];

export default function TodoPage() {
  const { state, currentUser, selectedDecor, tasks, addTask, updateTask, deleteTask } = useOps();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  const isManager = currentUser.role === 'owner' || currentUser.role === 'admin';
  const scheduleLocked = decorScheduleLocked(selectedDecor);
  const scheduleLockReason = decorScheduleLockReason(selectedDecor);

  const rawTab = searchParams.get('tab');
  const statusTab: StatusTab = (rawTab && VALID_TABS.includes(rawTab)) ? (rawTab as StatusTab) : 'all';

  const setStatusTab = useCallback((newTab: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', newTab);
    router.push(`/ops/todo?${params.toString()}`, { scroll: false });
  }, [searchParams, router]);

  const [addOpen, setAddOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<Task | null>(null);
  const { locked, run } = useSubmitLock();

  const decorTasks = useMemo(() => {
    if (!selectedDecor) return [];
    let list = tasks.filter((t) => t.decorId === selectedDecor.id);
    return list.sort((a, b) => a.order - b.order);
  }, [tasks, selectedDecor, isManager, currentUser.id],);

  const filteredTasks = useMemo(
    () => statusTab === 'all' ? decorTasks : decorTasks.filter((t) => t.status === statusTab),
    [decorTasks, statusTab],
  );

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: decorTasks.length };
    for (const s of STATUSES) {
      counts[s] = decorTasks.filter((t) => t.status === s).length;
    }
    return counts;
  }, [decorTasks]);

  const done = decorTasks.filter((t) => t.status === 'selesai').length;
  const progress = decorTasks.length ? Math.round((done / decorTasks.length) * 100) : 0;

  const addFromTemplate = (title: string, close = false) => {
    if (!selectedDecor) return;
    addTask({ decorId: selectedDecor.id, title, status: 'belum' });
    if (close) setAddOpen(false);
  };

  const submitNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDecor || !newTitle.trim()) return;
    await run(() => {
      addTask({ decorId: selectedDecor.id, title: newTitle.trim(), status: 'belum' });
      setNewTitle('');
      setAddOpen(false);
      toast({ title: 'Tugas ditambahkan' });
    });
  };

  return (
    <div>
      <PageHeader
        title="Daftar Tugas"
        subtitle={selectedDecor ? `Alur pekerjaan untuk: ${selectedDecor.name}` : 'Pilih decor terlebih dahulu'}
      />

      {!selectedDecor ? (
        <EmptyState icon={<ListChecks size={20} />} title="Belum ada decor yang dipilih" sub="Pilih decor dari menu Current Decor di bagian atas." />
      ) : (
        <div className="space-y-4">
          {/* Daftar tugas */}
          <SectionCard
            title={`Alur Tugas — ${selectedDecor.name}`}
            action={
              <div className="flex items-center gap-3">
                <span className="hidden sm:flex items-center gap-2 text-[10px] font-bold text-slate-400">
                  <ProgressBar value={progress} className="w-16" />
                  {done}/{decorTasks.length}
                </span>
                {isManager && !scheduleLocked && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setAddOpen(true)}
                    className="h-8 gap-1.5 bg-navy hover:bg-gold text-white text-[10px] font-black uppercase tracking-widest px-3"
                  >
                    <Plus size={13} /> Tambah
                  </Button>
                )}
              </div>
            }
          >
            {scheduleLocked && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 mb-4 flex items-start gap-2">
                <AlertTriangle size={16} className="text-red-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[11px] font-bold text-red-600">Tugas terkunci</p>
                  <p className="text-[10px] text-red-400 mt-0.5">{scheduleLockReason} Sistem tidak dapat diubah di luar jadwal kerja decor.</p>
                </div>
              </div>
            )}
            {/* Status tabs */}
            <div className="flex gap-1.5 mb-4 overflow-x-auto no-scrollbar pb-1">
              {STATUS_TABS.map((st) => {
                const isActive = st.value === statusTab;
                const count = statusCounts[st.value] ?? 0;
                return (
                  <button
                    key={st.value}
                    onClick={() => setStatusTab(st.value)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border shrink-0 select-none",
                      isActive ? "bg-navy text-white border-navy shadow-sm" : "bg-white text-slate-400 border-slate-200 hover:border-slate-300",
                    )}
                  >
                    <st.icon size={12} />
                    {st.label}
                    <span className={cn(
                      "ml-0.5 min-w-[16px] h-[16px] flex items-center justify-center rounded-full text-[8px] font-bold leading-none px-1",
                      isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-400",
                    )}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {decorTasks.length === 0 ? (
              <EmptyState icon={<ListChecks size={20} />} title="Belum ada tugas" sub={isManager ? 'Tambahkan dari template atau buat tugas baru.' : 'Belum ada tugas untuk decor ini.'} />
            ) : (
              <ol className="relative">
                {filteredTasks.map((t: Task, idx) => {
                  const isDone = t.status === 'selesai';
                  return (
                    <li key={t.id} className="relative flex items-start gap-3 pb-5 last:pb-0">
                      {/* Connector line */}
                      {idx < filteredTasks.length - 1 && (
                        <span className="absolute left-[17px] top-9 bottom-0 w-px bg-slate-200" />
                      )}
                      {/* Step number */}
                      <span className={cn(
                        "relative z-10 mt-0.5 shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-[11px] font-black border-2",
                        isDone
                          ? "bg-emerald-500 border-emerald-500 text-white"
                          : t.status === 'dikerjakan'
                            ? "bg-amber-500 border-amber-500 text-white"
                            : t.status === 'terhambat'
                              ? "bg-red-500 border-red-500 text-white"
                              : "bg-white border-slate-300 text-slate-400",
                      )}>
                        {idx + 1}
                      </span>
                      <div className="flex-1 min-w-0 pt-1">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <p className={cn("text-sm font-semibold leading-snug", isDone ? "text-slate-400" : "text-navy")}>{t.title}</p>
                          <div className="flex items-center gap-2">
                            <Select value={t.status} disabled={scheduleLocked} onValueChange={(v) => updateTask(t.id, { status: v as TaskStatus })}>
                              <SelectTrigger className="h-7 text-[11px] min-w-0">
                                <SelectValue>{TASK_STATUS_LABEL[t.status]}</SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                {STATUSES.map((s) => <SelectItem key={s} value={s}>{TASK_STATUS_LABEL[s]}</SelectItem>)}
                              </SelectContent>
                            </Select>
                            {isManager && (
                              <button onClick={() => setConfirmDelete(t)} className="text-slate-300 hover:text-red-500 shrink-0" aria-label="hapus">
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </SectionCard>
        </div>
      )}

      {/* Modal: Tambah Tugas Baru */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-navy">Tambah Langkah Kerja</DialogTitle>
            <DialogDescription className="text-sm text-slate-500">
              Tambahkan langkah pekerjaan untuk decor: {selectedDecor?.name}
            </DialogDescription>
          </DialogHeader>

          <form id="add-task-form" onSubmit={submitNew} className="space-y-4">
            <div>
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nama Kegiatan</Label>
              <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="cth. Pasang pencahayaan" className="mt-1" required />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Atau pilih template</p>
              <div className="flex flex-wrap gap-2">
                {state.settings.taskTemplate.map((tpl) => (
                  <button
                    key={tpl}
                    type="button"
                    onClick={() => addFromTemplate(tpl, true)}
                    className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-gold/15 text-slate-600 hover:text-navy text-[11px] font-semibold transition-colors"
                  >
                    + {tpl}
                  </button>
                ))}
              </div>
            </div>
          </form>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>Batal</Button>
            <Button
              type="submit"
              form="add-task-form"
              disabled={locked}
              className="bg-navy hover:bg-gold text-white"
            >
              <Plus size={15} /> {locked ? 'Menambahkan...' : 'Tambah'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm delete dialog */}
      <AlertDialog open={!!confirmDelete} onOpenChange={(open) => !open && setConfirmDelete(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-navy">Hapus langkah ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Langkah <span className="font-semibold text-navy">"{confirmDelete?.title}"</span> akan dihapus secara permanen dari decor <span className="font-semibold text-navy">{selectedDecor?.name}</span>. Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setConfirmDelete(null)}
              className="text-[10px] font-black uppercase tracking-widest"
            >
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white text-[10px] font-black uppercase tracking-widest"
              onClick={() => {
                if (confirmDelete) {
                  deleteTask(confirmDelete.id);
                  setConfirmDelete(null);
                }
              }}
            >
              Ya, Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
