'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { ClipboardList, Trash2, Clock4, Camera, PenLine, ListChecks } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useOps, userFirst } from '@/lib/ops/store';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { PageHeader, SectionCard, StatusBadge, EmptyState, formatDateTime, Pagination } from '../ops-ui';
import { useToast } from '@/hooks/use-toast';
import { useSubmitLock } from '@/hooks/use-submit-lock';
import { OpsTabs } from '@/components/OpsTabs';

const ACTIVITY_STATUS = [
  { value: 'selesai', label: 'Selesai', color: 'bg-emerald-500' },
  { value: 'dikerjakan', label: 'Sedang Dikerjakan', color: 'bg-amber-500' },
  { value: 'terhambat', label: 'Terhambat', color: 'bg-red-500' },
  { value: 'pending', label: 'Pending', color: 'bg-slate-400' },
] as const;

type ActStatus = typeof ACTIVITY_STATUS[number]['value'];

const TAB_LIST = [
  { value: 'input', label: 'Input', icon: PenLine },
  { value: 'riwayat', label: 'Riwayat', icon: ListChecks },
] as const;

type TabValue = typeof TAB_LIST[number]['value'];
const VALID_TABS: TabValue[] = ['input', 'riwayat'];

export default function KegiatanPage() {
  const { state, currentUser, selectedDecor, decors, addActivity, deleteActivity, activities, addPhoto, tasks } = useOps();
  const isManager = currentUser.role === 'owner' || currentUser.role === 'admin';
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();

  const rawTab = searchParams.get('tab');
  const activeTab: TabValue = (rawTab && VALID_TABS.includes(rawTab as TabValue)) ? (rawTab as TabValue) : 'input';

  const setTab = useCallback((newTab: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', newTab);
    router.push(`/ops/kegiatan?${params.toString()}`, { scroll: false });
  }, [searchParams, router]);

  const [type, setType] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<ActStatus>('selesai');
  const [note, setNote] = useState('');
  const [taskId, setTaskId] = useState('');
  const [photo, setPhoto] = useState<string>('');
  const [page, setPage] = useState(1);
  const { locked, run } = useSubmitLock();
  const PAGE_SIZE = 8;

  const decorList = useMemo(() => decors.filter((d) => d.status !== 'dibatalkan'), [decors]);
  const decorId = selectedDecor?.id || '';

  useEffect(() => {
    setPage(1);
  }, [decorId]);

  const decorTasks = useMemo(
    () => (selectedDecor ? tasks.filter((t) => t.decorId === selectedDecor.id) : []),
    [tasks, selectedDecor],
  );

  const decorActivities = useMemo(() => {
    if (!decorId) return [];
    let list = activities.filter((a) => a.decorId === decorId);
    if (!isManager) list = list.filter((a) => a.userId === currentUser.id);
    return list.sort((a, b) => (a.at < b.at ? 1 : -1));
  }, [activities, decorId, isManager, currentUser.id]);

  const activityPageCount = Math.max(1, Math.ceil(decorActivities.length / PAGE_SIZE));
  const shownActivities = decorActivities.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhoto(String(reader.result || ''));
    reader.readAsDataURL(file);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!decorId || !description.trim()) return;
    await run(async () => {
      const act = addActivity({
        decorId,
        userId: state.currentUserId,
        taskId: taskId && taskId !== 'none' ? taskId : undefined,
        activityType: type || 'Lainnya',
        description: description.trim(),
        status,
        note: note.trim() || undefined,
      });
      if (photo) addPhoto({ decorId, userId: state.currentUserId, dataUrl: photo, caption: description.trim() });
      toast({ title: 'Kegiatan tercatat' });
      setDescription(''); setNote(''); setPhoto(''); setTaskId('');
      void act;
    });
  };

  return (
    <div>
      <PageHeader
        title="Kegiatan / Aktivitas"
        subtitle="Catat apa yang benar-benar Anda kerjakan hari ini"
      />

      <OpsTabs items={TAB_LIST} value={activeTab} onChange={setTab} className="mb-4" />

      {/* ═══ TAB: INPUT ═══ */}
      {activeTab === 'input' && (
        <div className="grid lg:grid-cols-2 gap-4">
          {/* Form */}
          <SectionCard title="Catat Kegiatan Baru">
            {!selectedDecor ? (
              <EmptyState
                icon={<PenLine size={20} />}
                title="Pilih decor terlebih dahulu"
                sub="Pilih decor dari menu Current Decor di bagian atas."
              />
            ) : (
              <form onSubmit={submit} className="space-y-4">
                <div>
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Decor</Label>
                  <Select value={decorId} onValueChange={() => {}} disabled>
                    <SelectTrigger className="mt-1">
                      <SelectValue>{selectedDecor?.name || 'Pilih decor'}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {decorList.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Jenis Kegiatan</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Pilih jenis" /></SelectTrigger>
                    <SelectContent>
                      {state.settings.activityTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Kegiatan</Label>
                  <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="cth. Pemasangan backdrop panggung utama" className="mt-1" rows={2} required />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status</Label>
                    <Select value={status} onValueChange={(v) => setStatus(v as ActStatus)}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ACTIVITY_STATUS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Terkait Tugas</Label>
                    <Select value={taskId} onValueChange={setTaskId}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="—" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Tidak ada</SelectItem>
                        {decorTasks.map((t) => <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Catatan</Label>
                  <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Detail tambahan..." className="mt-1" rows={2} />
                </div>

                <div>
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Foto</Label>
                  <input type="file" accept="image/*" onChange={handleFile} className="mt-1 block w-full text-[11px] text-slate-400 file:mr-3 file:rounded-lg file:border-0 file:bg-navy file:px-3 file:py-1.5 file:text-[10px] file:font-bold file:text-white" />
                  {photo && (
                    <img src={photo} alt="preview" className="mt-2 h-24 w-24 object-cover rounded-xl border border-slate-200" />
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-[10px] text-slate-400"><Clock4 size={11} /> Waktu otomatis: sekarang</span>
                  <Button type="submit" disabled={locked} className="bg-navy hover:bg-gold text-white"><Camera size={14} className="mr-1" /> {locked ? 'Menyimpan...' : 'Simpan Kegiatan'}</Button>
                </div>
              </form>
            )}
          </SectionCard>

          {/* Quick recent list on input tab */}
          <SectionCard
            title={decorId ? `Terakhir — ${selectedDecor?.name}` : 'Kegiatan Terakhir'}
            action={decorId && <span className="text-[10px] font-bold text-slate-400">{decorActivities.length} aktivitas</span>}
          >
            {decorActivities.length === 0 ? (
              <EmptyState icon={<ClipboardList size={20} />} title="Belum ada kegiatan" sub="Kegiatan yang baru dicatat akan muncul di sini." />
            ) : (
              <>
                <ul className="space-y-3">
                  {decorActivities.slice(0, 5).map((a) => {
                    const user = state.users.find((u) => u.id === a.userId);
                    const st = ACTIVITY_STATUS.find((s) => s.value === a.status);
                    return (
                      <li key={a.id} className="bg-slate-50 rounded-xl p-3.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="h-7 w-7 rounded-full bg-navy text-white text-[10px] font-bold flex items-center justify-center shrink-0">{userFirst(state, a.userId)}</span>
                            <div className="min-w-0">
                              <p className="text-[11px] font-bold text-navy">{user?.name || 'User'}</p>
                              <p className="text-[9px] text-slate-400 flex items-center gap-1"><Clock4 size={9} /> {formatDateTime(a.at)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="px-2 py-0.5 rounded-full bg-gold/15 text-gold text-[9px] font-bold uppercase tracking-widest">{a.activityType}</span>
                            <StatusBadge color={st?.color || 'bg-slate-400'} label={st?.label || a.status} />
                          </div>
                        </div>
                        <p className="text-sm text-slate-700 mt-2">{a.description}</p>
                        {a.note && <p className="text-[11px] text-slate-500 italic mt-1">"{a.note}"</p>}
                      </li>
                    );
                  })}
                </ul>
                {decorActivities.length > 5 && (
                  <Button
                    variant="outline"
                    className="w-full mt-3 text-[10px] uppercase tracking-widest font-bold"
                    onClick={() => setTab('riwayat')}
                  >
                    Lihat Semua Riwayat →
                  </Button>
                )}
              </>
            )}
          </SectionCard>
        </div>
      )}

      {/* ═══ TAB: RIWAYAT ═══ */}
      {activeTab === 'riwayat' && (
        <SectionCard
          title={decorId ? `Riwayat — ${selectedDecor?.name}` : 'Riwayat Kegiatan'}
          action={decorId && <span className="text-[10px] font-bold text-slate-400">{decorActivities.length} aktivitas</span>}
        >
          {decorActivities.length === 0 ? (
            <EmptyState icon={<ClipboardList size={20} />} title="Belum ada kegiatan untuk decor ini" sub="Catat kegiatan pertama Anda." />
          ) : (
            <>
              <ul className="space-y-3">
                {shownActivities.map((a) => {
                  const user = state.users.find((u) => u.id === a.userId);
                  const related = tasks.find((t) => t.id === a.taskId);
                  const st = ACTIVITY_STATUS.find((s) => s.value === a.status);
                  return (
                    <li key={a.id} className="bg-slate-50 rounded-xl p-3.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="h-7 w-7 rounded-full bg-navy text-white text-[10px] font-bold flex items-center justify-center shrink-0">{userFirst(state, a.userId)}</span>
                          <div className="min-w-0">
                            <p className="text-[11px] font-bold text-navy">{user?.name || 'User'}</p>
                            <p className="text-[9px] text-slate-400 flex items-center gap-1"><Clock4 size={9} /> {formatDateTime(a.at)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="px-2 py-0.5 rounded-full bg-gold/15 text-gold text-[9px] font-bold uppercase tracking-widest">{a.activityType}</span>
                          <StatusBadge color={st?.color || 'bg-slate-400'} label={st?.label || a.status} />
                          {(isManager || a.userId === currentUser.id) && (
                            <button onClick={() => { deleteActivity(a.id); }} className="text-slate-300 hover:text-red-500" aria-label="hapus"><Trash2 size={14} /></button>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-slate-700 mt-2">{a.description}</p>
                      {related && <p className="text-[10px] text-slate-400 mt-1">Tugas: <span className="font-semibold text-navy">{related.title}</span></p>}
                      {a.note && <p className="text-[11px] text-slate-500 italic mt-1">"{a.note}"</p>}
                    </li>
                  );
                })}
              </ul>
              <Pagination page={page} totalPages={activityPageCount} onPage={setPage} />
            </>
          )}
        </SectionCard>
      )}
    </div>
  );
}
