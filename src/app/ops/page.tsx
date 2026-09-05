'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import {
  CalendarRange, Clock4, ListChecks, ChevronRight, BarChart3,
} from 'lucide-react';
import { useOps, userFirst } from '@/lib/ops/store';
import {
  DECOR_STATUS_COLOR, DECOR_STATUS_LABEL,
} from '@/lib/ops/types';
import {
  monthlyFinancial, monthlyWorkHours, formatIDR, formatIDRCompact, formatDuration,
} from '@/lib/ops/reports';
import { SectionCard, StatusBadge, formatDateTime } from './ops-ui';
import { cn } from '@/lib/utils';

/* ─── Quick Card ──────────────────────────────────────────────────────────── */
function QuickCard({
  href, icon, label, sub, color,
}: {
  href: string; icon: React.ReactNode; label: string; sub?: string; color: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative flex flex-col items-center justify-center gap-3 rounded-2xl border p-4 sm:p-6 shadow-sm transition-all hover:shadow-lg hover:-translate-y-0.5 bg-white border-slate-100",
      )}
    >
      <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center text-white", color)}>
        {icon}
      </div>
      <div className="text-center">
        <p className="text-base sm:text-lg font-headline font-bold text-navy">{label}</p>
        {sub && <p className="text-xs text-slate-400 mt-1 line-clamp-1">{sub}</p>}
      </div>
    </Link>
  );
}

/* ─── Dashboard ───────────────────────────────────────────────────────────── */
export default function DashboardPage() {
  const { state, currentUser, decors, activeDecors, selectedDecor, tasks, activities, attendance, expenses, audit } = useOps();
  const isCrew = currentUser.role === 'crew';
  const isOwner = currentUser.role === 'owner';
  const isManager = isOwner || currentUser.role === 'admin';

  const today = new Date().toISOString().slice(0, 10);
  const month = today.slice(0, 7);

  const finance = useMemo(() => monthlyFinancial(decors, expenses, month), [decors, expenses, month]);
  const hourData = useMemo(() => monthlyWorkHours(attendance, month), [attendance, month]);
  const myHours = hourData.find((h) => h.userId === currentUser.id)?.minutes || 0;
  const myDuration = formatDuration(myHours);

  const visibleDecors = activeDecors;
  const visibleSelectedDecor = selectedDecor;

  const crewStat = useMemo(() => {
    const hourMap = new Map(hourData.map((h) => [h.userId, h.minutes]));
    const actMap = new Map<string, number>();
    for (const a of activities) {
      if (a.at.slice(0, 7) !== month) continue;
      actMap.set(a.userId, (actMap.get(a.userId) || 0) + 1);
    }
    return state.users
      .filter((u) => u.role === 'crew' && u.active)
      .map((u) => ({ user: u, hours: hourMap.get(u.id) || 0, activities: actMap.get(u.id) || 0 }))
      .filter((x) => x.hours > 0 || x.activities > 0)
      .sort((a, b) => b.hours - a.hours);
  }, [state.users, hourData, activities, month]);

  const teamMinutes = crewStat.reduce((t, m) => t + m.hours, 0);
  const teamDuration = formatDuration(teamMinutes);

  const selectedTasks = useMemo(() => {
    if (!selectedDecor) return [];
    let base = tasks.filter((t) => t.decorId === selectedDecor.id);
    return base.sort((a, b) => a.order - b.order);
  }, [tasks, selectedDecor]);

  // Aktivitas terbaru: khusus pencatatan absensi (dari audit log)
  const recentActivities = useMemo(() => {
    const base = audit
      .filter((a) => a.action.startsWith('absensi.'))
      .sort((a, b) => (a.at < b.at ? 1 : -1));
    const filtered = isCrew ? base.filter((a) => a.userId === currentUser.id) : base;
    return filtered.slice(0, 5);
  }, [audit, isCrew, currentUser.id]);

  const auditLabel = (a: { action: string }) => {
    switch (a.action) {
      case 'absensi.masuk': return 'Absen Masuk';
      case 'absensi.pulang': return 'Absen Pulang';
      case 'absensi.tidak-bekerja': return 'Tidak Bekerja';
      case 'absensi.hapus': return 'Session Dihapus';
      default: return a.action;
    }
  };

  const auditColor = (a: { action: string }) => {
    switch (a.action) {
      case 'absensi.masuk': return 'bg-emerald-100 text-emerald-700';
      case 'absensi.pulang': return 'bg-sky-100 text-sky-700';
      case 'absensi.tidak-bekerja': return 'bg-slate-100 text-slate-600';
      case 'absensi.hapus': return 'bg-red-100 text-red-600';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  return (
    <div className="space-y-5">
      {/* ── Greeting ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
        <div>
          <h2 className="text-xl font-headline font-bold text-navy">
            Halo, {currentUser.name.split(' ')[0]} 👋
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {new Date(today + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        {isManager && (
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Hari ini:</span>
            <span className="text-sm font-bold text-navy">
              {new Date(today + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
            </span>
          </div>
        )}
      </div>

      {/* ── 4 Quick Access Cards ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <QuickCard
          href="/ops/absensi"
          icon={<Clock4 size={28} />}
          label="Absensi"
          sub="Catat kehadiran"
          color="bg-emerald-500"
        />
        <QuickCard
          href="/ops/decor"
          icon={<CalendarRange size={28} />}
          label="Decor"
          sub={`${visibleDecors.length} aktif`}
          color="bg-navy"
        />
        <QuickCard
          href="/ops/todo"
          icon={<ListChecks size={28} />}
          label="Tugas"
          sub={`${tasks.length} langkah`}
          color="bg-gold"
        />
        <QuickCard
          href="/ops/pengeluaran"
          icon={<BarChart3 size={28} />}
          label="Pengeluaran"
          sub={isManager ? 'Catat biaya proses' : 'Khusus manajer'}
          color="bg-sky-500"
        />
      </div>

      {/* ── Owner: Financial Quick Stats ──────────────────────────────────── */}
      {isOwner && (
        <SectionCard title="Keuangan Bulan Ini">
          <div className="flex items-center gap-4">
            <div className="flex-1 text-center">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Omzet</p>
              <p className="text-sm font-headline font-bold text-navy">{formatIDRCompact(finance.revenue)}</p>
            </div>
            <div className="h-8 w-px bg-slate-100" />
            <div className="flex-1 text-center">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Pengeluaran</p>
              <p className="text-sm font-headline font-bold text-navy">{formatIDRCompact(finance.expenses)}</p>
            </div>
            <div className="h-8 w-px bg-slate-100" />
            <div className="flex-1 text-center">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Profit</p>
              <p className="text-sm font-headline font-bold text-emerald-600">{formatIDRCompact(finance.profit)}</p>
            </div>
          </div>
        </SectionCard>
      )}

      {/* ── Selected Decor ─────────────────────────────────────────────────── */}
      {visibleSelectedDecor && (
        <SectionCard
          title="Decor Aktif"
          action={<Link href="/ops/decor" className="text-[10px] font-bold text-gold uppercase tracking-widest">Lihat Semua</Link>}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-headline font-bold text-navy truncate">{visibleSelectedDecor.name}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {visibleSelectedDecor.location}{visibleSelectedDecor.date ? ` · ${new Date(visibleSelectedDecor.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}` : ''}
              </p>
              <div className="mt-1.5">
                <StatusBadge color={DECOR_STATUS_COLOR[visibleSelectedDecor.status]} label={DECOR_STATUS_LABEL[visibleSelectedDecor.status]} />
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-2xl font-headline font-bold text-navy">{selectedTasks.length}</p>
              <p className="text-[9px] text-slate-400">langkah kerja</p>
            </div>
          </div>
        </SectionCard>
      )}

      {/* ── Work Hours ─────────────────────────────────────────────────────── */}
      <SectionCard title={isCrew ? 'Jam Kerja Saya' : 'Jam Kerja Tim'}>
        <div className="flex items-baseline gap-2">
          <p className="text-2xl font-headline font-bold text-navy">
            {isCrew ? myDuration.h : teamDuration.h}
            <span className="ml-1 text-sm text-slate-400">jam</span>
          </p>
          <p className="text-[10px] text-slate-400">{isCrew ? 'bulan ini' : 'total tim'}</p>
        </div>
        {isManager && crewStat.length > 0 && (
          <>
            <div className="mt-3 hidden sm:block overflow-x-auto no-scrollbar">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[9px] uppercase tracking-widest text-slate-400 border-b border-slate-100">
                    <th className="py-2 pr-3">Nama</th>
                    <th className="py-2">Jam</th>
                  </tr>
                </thead>
                <tbody>
                  {crewStat.slice(0, 5).map(({ user, hours }) => (
                    <tr key={user.id} className="border-b border-slate-50">
                      <td className="py-2 pr-3 text-[11px] font-semibold text-navy">{user.name}</td>
                      <td className="py-2 text-[11px] text-slate-600">{formatDuration(hours).label}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 sm:hidden space-y-2">
              {crewStat.slice(0, 5).map(({ user, hours }) => (
                <div key={user.id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-white px-3 py-2.5">
                  <span className="text-[12px] font-semibold text-navy">{user.name}</span>
                  <span className="text-[12px] font-bold text-slate-600">{formatDuration(hours).label}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </SectionCard>

      {/* ── Recent Activities ──────────────────────────────────────────────── */}
      <SectionCard
        title={isCrew ? 'Aktivitas Saya' : 'Aktivitas Terbaru'}
        action={<Link href="/ops/kegiatan" className="text-[10px] font-bold text-gold uppercase tracking-widest">Semua</Link>}
      >
        {recentActivities.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">Belum ada aktivitas.</p>
        ) : (
          <ul className="divide-y divide-slate-50">
            {recentActivities.map((a) => (
              <li key={a.id} className="py-2.5 flex items-start gap-3">
                <span className="h-7 w-7 rounded-full bg-gold/15 text-gold text-[9px] font-bold flex items-center justify-center shrink-0">
                  {userFirst(state, a.userId)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] flex items-center gap-2">
                    {!isCrew && (
                      <span className="font-bold text-navy shrink-0">{state.users.find((u) => u.id === a.userId)?.name}</span>
                    )}
                    <span className={`px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider ${auditColor(a)}`}>
                      {auditLabel(a)}
                    </span>
                  </p>
                  <p className="text-[10px] text-slate-500 truncate">{a.detail || auditLabel(a)}</p>
                  <p className="text-[9px] text-slate-400 mt-0.5">{formatDateTime(a.at)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}
