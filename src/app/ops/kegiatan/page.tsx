'use client';

import React, { useMemo } from 'react';
import { ClipboardList, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { useOps } from '@/lib/ops/store';
import { cn } from '@/lib/utils';
import { PageHeader, SectionCard, EmptyState } from '../ops-ui';
import { TASK_STATUS_LABEL, type TaskStatus } from '@/lib/ops/types';

const STATUS_META: Record<TaskStatus, { color: string; text: string; icon: React.ReactNode }> = {
  belum: { color: 'border-slate-300 text-slate-400', text: 'text-slate-400', icon: <ClipboardList size={13} /> },
  dikerjakan: { color: 'border-amber-500 text-amber-500', text: 'text-amber-600', icon: <Clock size={13} /> },
  selesai: { color: 'border-emerald-500 text-emerald-500', text: 'text-emerald-600', icon: <CheckCircle size={13} /> },
  terhambat: { color: 'border-red-500 text-red-500', text: 'text-red-600', icon: <AlertTriangle size={13} /> },
};

export default function KegiatanPage() {
  const { selectedDecor, tasks, state } = useOps();

  const flowTasks = useMemo(() => {
    if (!selectedDecor) return [];
    return tasks
      .filter((t) => t.decorId === selectedDecor.id)
      .sort((a, b) => a.order - b.order);
  }, [tasks, selectedDecor]);

  const doneCount = flowTasks.filter((t) => t.status === 'selesai').length;
  const progress = flowTasks.length ? Math.round((doneCount / flowTasks.length) * 100) : 0;

  return (
    <div>
      <PageHeader
        title="Alur Kegiatan"
        subtitle={selectedDecor ? `Urutan pekerjaan untuk: ${selectedDecor.name}` : 'Pilih decor untuk melihat alur pekerjaan'}
      />

      {!selectedDecor ? (
        <EmptyState icon={<ClipboardList size={20} />} title="Pilih decor terlebih dahulu" sub="Pilih decor dari menu Current Decor di bagian atas." />
      ) : (
        <SectionCard
          title={`Alur Pekerjaan — ${selectedDecor.name}`}
          action={
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {doneCount}/{flowTasks.length} · {progress}%
            </span>
          }
        >
          {flowTasks.length === 0 ? (
            <EmptyState icon={<ClipboardList size={20} />} title="Belum ada alur pekerjaan" sub="Manager dapat menambahkan langkah kerja dari halaman Tugas." />
          ) : (
            <ol className="relative">
              {flowTasks.map((t, idx) => {
                const meta = STATUS_META[t.status];
                return (
                  <li key={t.id} className="relative flex items-start gap-4 pb-6 last:pb-0">
                    {/* Connector line */}
                    {idx < flowTasks.length - 1 && (
                      <span className="absolute left-[19px] top-10 bottom-0 w-px bg-slate-200" />
                    )}
                    {/* Step number */}
                    <span className={cn(
                      "relative z-10 mt-0.5 shrink-0 h-9 w-9 rounded-full flex items-center justify-center text-[12px] font-black border-2 bg-white",
                      t.status === 'selesai'
                        ? "border-emerald-500 bg-emerald-500 text-white"
                        : t.status === 'dikerjakan'
                          ? "border-amber-500 bg-amber-500 text-white"
                          : t.status === 'terhambat'
                            ? "border-red-500 bg-red-500 text-white"
                            : "border-slate-300 text-slate-400",
                    )}>
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0 pt-1.5">
                      <div className="flex items-start justify-between gap-3">
                        <p className={cn(
                          "text-sm font-semibold leading-snug",
                          t.status === 'selesai' ? "text-slate-400 line-through" : "text-navy",
                        )}>
                          {t.title}
                        </p>
                        <span className={cn(
                          "shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest",
                          meta.text,
                          "border",
                          meta.color,
                        )}>
                          {meta.icon} {TASK_STATUS_LABEL[t.status]}
                        </span>
                      </div>
                      {t.assigneeId && (
                        <p className="text-[10px] text-slate-400 mt-1">
                          Penanggung jawab: <span className="font-semibold text-navy">{state.users.find((u) => u.id === t.assigneeId)?.name || t.assigneeId}</span>
                        </p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </SectionCard>
      )}
    </div>
  );
}
