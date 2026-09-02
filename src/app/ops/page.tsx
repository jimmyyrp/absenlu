'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import {
  CalendarRange, Clock4, ListChecks, ChevronRight,
} from 'lucide-react';
import { useOps, userFirst } from '@/lib/ops/store';
import {
  DECOR_STATUS_COLOR, DECOR_STATUS_LABEL,
} from '@/lib/ops/types';
import {
  monthlyFinancial, monthlyWorkHours, formatIDR, formatIDRCompact, formatDuration,
} from '@/lib/ops/reports';
import { SectionCard, StatusBadge, ProgressBar, formatDateTime } from './ops-ui';
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
        "group relative flex min-h-[84px] flex-col items-center justify-center gap-2 rounded-2xl border p-3 sm:min-h-[112px] sm:p-6 shadow-sm transition-all hover:shadow-lg hover:-translate-y-0.5 bg-white border-slate-100",
      )}
    >
      <div className={cn("h-10 w-10 sm:h-14 sm:w-14 rounded-xl sm:rounded-2xl flex items-center justify-center text-white", color)}>
        {icon}
      </div>
      <div className="text-center">
        <p className="text-xs sm:text-sm font-headline font-bold text-navy">{label}</p>
        {sub && <p className="text-[9px] sm:text-[10px] text-slate-400 mt-0.5 line-clamp-1">{sub}</p>}
      </div>
      <ChevronRight size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-200 group-hover:text-gold transition-colors" />
    </Link>
  );
}

/* ─── Dashboard ───────────────────────────────────────────────────────────── */
export default function DashboardPage() {
  const { state, currentUser, decors, activeDecors, selectedDecor, tasks, activities, attendance, expenses } = useOps();
  const isFreelancer = currentUser.role === 'freelancer';
  const isOwner = currentUser.role === 'owner';
  const isManager = isOwner || currentUser.role === 'admin';

  const today = new Date().toISOString().slice(0, 10);
  const month = today.slice(0, 7);

  const finance = useMemo(() => monthlyFinancial(decors, expenses, month), [decors, expenses, month]);
  const hourData = useMemo(() => monthlyWorkHours(attendance, month), [attendance, month]);
  const myHours = hourData.find((h) => h.userId === currentUser.id)?.minutes || 0;
  const myDuration = formatDuration(myHours);

  const myDecorIds = useMemo(
    () => new Set(tasks.filter((task) => task.assigneeId === currentUser.id).map((task) => task.decorId)),
    [tasks, currentUser.id],
  );
  const visibleDecors = isFreelancer ? activeDecors.filter((decor) => myDecorIds.has(decor.id)) : activeDecors;
  const visibleSelectedDecor = isFreelancer && selectedDecor && !myDecorIds.has(selectedDecor.id) ? undefined : selectedDecor;

  const freelancerStat = useMemo(() => {
    const hourMap = new Map(hourData.map((h) => [h.userId, h.minutes]));
    const actMap = new Map<string, number>();
    for (const a of activities) {
      if (a.at.slice(0, 7) !== month) continue;
      actMap.set(a.userId, (actMap.get(a.userId) || 0) + 1);
    }
    return state.users
      .filter((u) => u.role === 'freelancer' && u.active)
      .map((u) => ({ user: u, hours: hourMap.get(u.id) || 0, activities: actMap.get(u.id) || 0 }))
      .filter((x) => x.hours > 0 || x.activities > 0)
      .sort((a, b) => b.hours - a.hours);
  }, [state.users, hourData, activities, month]);

  const teamMinutes = freelancerStat.reduce((t, m) => t + m.hours, 0);
  const teamDuration = formatDuration(teamMinutes);

  const selectedTasks = useMemo(() => {
    if (!selectedDecor) return [];
    let base = tasks.filter((t) => t.decorId === selectedDecor.id);
    if (isFreelancer) base = base.filter((t) => t.assigneeId === currentUser.id);
    return base.sort((a, b) => a.order - b.order);
  }, [tasks, selectedDecor, isFreelancer, currentUser.id]);

  const selectedDone = selectedTasks.filter((t) => t.status === 'selesai').length;
  const selectedProgress = selectedTasks.length ? Math.round((selectedDone / selectedTasks.length) * 100) : 0;

  const pendingTasks = isFreelancer
    ? tasks.filter((t) => t.assigneeId === currentUser.id && t.status !== 'selesai').length
    : tasks.filter((t) => t.status !== 'selesai').length;

  const recentActivities = useMemo(() => {
    const base = [...activities].sort((a, b) => (a.at < b.at ? 1 : -1));
    const filtered = isFreelancer ? base.filter((a) => a.userId === currentUser.id) : base;
    return filtered.slice(0, 5);
  }, [activities, isFreelancer, currentUser.id]);

  return (
    <div className="space-y-5">
      {/* ── Greeting ──────────────────────────────────────────────────────── */}
      <div>
        <h2 className="text-xl font-headline font-bold text-navy">
          Halo, {currentUser.name.split(' ')[0]} 👋
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          {new Date(today + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* ── 3 Quick Access Cards ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
        <QuickCard
          href="/ops/absensi"
          icon={<Clock4 size={26} />}
          label="Absensi"
          sub="Catat kehadiran"
          color="bg-emerald-500"
        />
        <QuickCard
          href="/ops/decor"
          icon={<CalendarRange size={26} />}
          label="Decor"
          sub={`${visibleDecors.length} aktif`}
          color="bg-navy"
        />
        <QuickCard
          href="/ops/todo"
          icon={<ListChecks size={26} />}
          label="Tugas"
          sub={`${pendingTasks} pending`}
          color="bg-gold"
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
              <p className="text-2xl font-headline font-bold text-navy">{selectedProgress}<span className="text-sm text-slate-400">%</span></p>
              <p className="text-[9px] text-slate-400">{selectedDone}/{selectedTasks.length} tugas</p>
              <ProgressBar value={selectedProgress} className="w-20 mt-1" />
            </div>
          </div>
        </SectionCard>
      )}

      {/* ── Work Hours ─────────────────────────────────────────────────────── */}
      <SectionCard title={isFreelancer ? 'Jam Kerja Saya' : 'Jam Kerja Tim'}>
        <div className="flex items-baseline gap-2">
          <p className="text-2xl font-headline font-bold text-navy">
            {isFreelancer ? myDuration.h : teamDuration.h}
            <span className="ml-1 text-sm text-slate-400">jam</span>
          </p>
          <p className="text-[10px] text-slate-400">{isFreelancer ? 'bulan ini' : 'total tim'}</p>
        </div>
        {isManager && freelancerStat.length > 0 && (
          <div className="mt-3 overflow-x-auto no-scrollbar">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[9px] uppercase tracking-widest text-slate-400 border-b border-slate-100">
                  <th className="py-2 pr-3">Nama</th>
                  <th className="py-2">Jam</th>
                </tr>
              </thead>
              <tbody>
                {freelancerStat.slice(0, 5).map(({ user, hours }) => (
                  <tr key={user.id} className="border-b border-slate-50">
                    <td className="py-2 pr-3 text-[11px] font-semibold text-navy">{user.name}</td>
                    <td className="py-2 text-[11px] text-slate-600">{formatDuration(hours).label}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {/* ── Recent Activities ──────────────────────────────────────────────── */}
      <SectionCard
        title={isFreelancer ? 'Aktivitas Saya' : 'Aktivitas Terbaru'}
        action={<Link href="/ops/kegiatan" className="text-[10px] font-bold text-gold uppercase tracking-widest">Semua</Link>}
      >
        {recentActivities.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">Belum ada aktivitas.</p>
        ) : (
          <ul className="divide-y divide-slate-50">
            {recentActivities.map((a) => (
              <li key={a.id} className="py-2.5 flex items-start gap-3">
                {!isFreelancer && (
                  <span className="h-7 w-7 rounded-full bg-gold/15 text-gold text-[9px] font-bold flex items-center justify-center shrink-0">
                    {userFirst(state, a.userId)}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] text-slate-600 truncate">
                    {isFreelancer ? (
                      <span className="font-bold text-navy">{a.activityType}</span>
                    ) : (
                      <><span className="font-bold text-navy">{state.users.find((u) => u.id === a.userId)?.name}</span>{' '}&middot; {a.activityType}</>
                    )}
                  </p>
                  <p className="text-[10px] text-slate-500 truncate">{a.description}</p>
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
