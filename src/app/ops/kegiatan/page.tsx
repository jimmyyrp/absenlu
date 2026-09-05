'use client';

import React, { useMemo } from 'react';
import { ClipboardList } from 'lucide-react';
import { useOps } from '@/lib/ops/store';
import { PageHeader, EmptyState } from '../ops-ui';

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
        <div className="space-y-4">
          {flowTasks.length === 0 ? (
            <EmptyState icon={<ClipboardList size={20} />} title="Belum ada alur pekerjaan" sub="Manager dapat menambahkan langkah kerja dari halaman Tugas." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {flowTasks.map((t, idx) => (
                <div
                  key={t.id}
                  className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <span className="relative z-10 mt-0.5 shrink-0 h-9 w-9 rounded-full flex items-center justify-center text-[12px] font-black border-2 bg-navy text-white">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-base font-semibold leading-snug text-navy">{t.title}</p>
                      <p className="text-[10px] text-slate-400 mt-1">Langkah {idx + 1} dari {flowTasks.length}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
