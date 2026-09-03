'use client';

import React, { useMemo } from 'react';
import { ClipboardList } from 'lucide-react';
import { useOps } from '@/lib/ops/store';
import { PageHeader, SectionCard, EmptyState } from '../ops-ui';

export default function KegiatanPage() {
  const { selectedDecor, tasks } = useOps();

  const flowTasks = useMemo(() => {
    if (!selectedDecor) return [];
    return tasks
      .filter((t) => t.decorId === selectedDecor.id)
      .sort((a, b) => a.order - b.order);
  }, [tasks, selectedDecor]);

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
              {flowTasks.length} langkah
            </span>
          }
        >
          {flowTasks.length === 0 ? (
            <EmptyState icon={<ClipboardList size={20} />} title="Belum ada alur pekerjaan" sub="Manager dapat menambahkan langkah kerja dari halaman Tugas." />
          ) : (
            <ol className="relative">
              {flowTasks.map((t, idx) => (
                <li key={t.id} className="relative flex items-start gap-4 pb-6 last:pb-0">
                  {idx < flowTasks.length - 1 && (
                    <span className="absolute left-[19px] top-10 bottom-0 w-px bg-slate-200" />
                  )}
                  <span className="relative z-10 mt-0.5 shrink-0 h-9 w-9 rounded-full flex items-center justify-center text-[12px] font-black border-2 bg-white border-slate-300 text-slate-400">
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0 pt-1.5">
                    <p className="text-sm font-semibold leading-snug text-navy">{t.title}</p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </SectionCard>
      )}
    </div>
  );
}
