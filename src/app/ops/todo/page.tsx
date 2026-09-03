'use client';

import React, { useMemo, useState } from 'react';
import { Plus, Trash2, ListChecks, AlertTriangle } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { useOps } from '@/lib/ops/store';
import { type Task } from '@/lib/ops/types';
import { decorScheduleLocked, decorScheduleLockReason } from '@/lib/ops/reports';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader, SectionCard, EmptyState } from '../ops-ui';
import { useToast } from '@/hooks/use-toast';
import { useSubmitLock } from '@/hooks/use-submit-lock';

export default function TodoPage() {
  const { state, currentUser, selectedDecor, tasks, addTask, deleteTask } = useOps();
  const { toast } = useToast();
  const isManager = currentUser.role === 'owner' || currentUser.role === 'admin';
  const scheduleLocked = decorScheduleLocked(selectedDecor);
  const scheduleLockReason = decorScheduleLockReason(selectedDecor);

  const [addOpen, setAddOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<Task | null>(null);
  const { locked, run } = useSubmitLock();

  const decorTasks = useMemo(() => {
    if (!selectedDecor) return [];
    const list = tasks.filter((t) => t.decorId === selectedDecor.id);
    return list.sort((a, b) => a.order - b.order);
  }, [tasks, selectedDecor]);

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
      toast({ title: 'Langkah ditambahkan' });
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
          <SectionCard
            title={`Alur Tugas — ${selectedDecor.name}`}
            action={
              <div className="flex items-center gap-3">
                <span className="hidden sm:flex items-center gap-2 text-[10px] font-bold text-slate-400">
                  {decorTasks.length} langkah
                </span>
                {isManager && !scheduleLocked && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setAddOpen(true)}
                    className="h-11 gap-2 bg-navy hover:bg-gold text-white text-xs font-black uppercase tracking-widest px-4"
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
                  <p className="text-[11px] font-bold text-red-600">Alur terkunci</p>
                  <p className="text-[10px] text-red-400 mt-0.5">{scheduleLockReason} Alur tidak dapat diubah di luar jadwal kerja decor.</p>
                </div>
              </div>
            )}

            {decorTasks.length === 0 ? (
              <EmptyState icon={<ListChecks size={20} />} title="Belum ada langkah kerja" sub={isManager ? 'Tambahkan langkah kerja untuk decor ini.' : 'Belum ada langkah untuk decor ini.'} />
            ) : (
              <ol className="relative">
                {decorTasks.map((t: Task, idx) => (
                  <li key={t.id} className="relative flex items-start gap-3 pb-5 last:pb-0">
                    {idx < decorTasks.length - 1 && (
                      <span className="absolute left-[17px] top-9 bottom-0 w-px bg-slate-200" />
                    )}
                    <span className="relative z-10 mt-0.5 shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-[11px] font-black border-2 bg-white border-slate-300 text-slate-400">
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0 pt-1">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <p className="text-sm font-semibold leading-snug text-navy">{t.title}</p>
                        {isManager && !scheduleLocked && (
                          <button
                            onClick={() => setConfirmDelete(t)}
                            className="flex h-11 w-11 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 shrink-0"
                            aria-label="hapus langkah"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </SectionCard>
        </div>
      )}

      {/* Modal: Tambah Langkah Kerja */}
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
                    className="min-h-11 px-4 py-2 rounded-lg bg-slate-100 hover:bg-gold/15 text-slate-600 hover:text-navy text-xs font-semibold transition-colors"
                  >
                    + {tpl}
                  </button>
                ))}
              </div>
            </div>
          </form>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setAddOpen(false)} className="h-11 px-5 text-sm">Batal</Button>
            <Button
              type="submit"
              form="add-task-form"
              disabled={locked}
              className="h-11 px-5 bg-navy hover:bg-gold text-white text-sm"
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
