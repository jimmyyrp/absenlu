'use client';

import React, { useMemo } from 'react';
import { CalendarRange, Wallet, TrendingUp } from 'lucide-react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell, Pie, PieChart } from 'recharts';
import { useOps } from '@/lib/ops/store';
import { DECOR_STATUS_COLOR, DECOR_STATUS_LABEL } from '@/lib/ops/types';
import {
  monthlyFinancial, monthlyWorkHours, formatIDR, formatIDRCompact, formatDuration,
  monthlyExpenseBreakdown, decorFinancial, type ExpenseBreakdown,
} from '@/lib/ops/reports';
import { Button } from '@/components/ui/button';
import { StatCard, SectionCard, PageHeader, StatusBadge } from '../ops-ui';

const PIE_COLORS = ['#0B2447', '#8C7216', '#C5A358', '#19376D', '#475569', '#94a3b8'];

export default function LaporanPage() {
  const { state, decors, tasks, activities, attendance, expenses, monthlyReportMonth, setMonthlyReportMonth } = useOps();

  const month = monthlyReportMonth;
  const finance = useMemo(() => monthlyFinancial(decors, expenses, month), [decors, expenses, month]);
  const hourData = useMemo(() => monthlyWorkHours(attendance, month), [attendance, month]);
  const totalMinutes = hourData.reduce((s, h) => s + h.minutes, 0);
  const totalDuration = formatDuration(totalMinutes);

  const monthActivities = useMemo(
    () => activities.filter((a) => a.at.slice(0, 7) === month),
    [activities, month],
  );

  const doneTasks = tasks.filter((t) => t.status === 'selesai').length;
  const blockedTasks = tasks.filter((t) => t.status === 'terhambat').length;
  const totalTasks = tasks.length;

  const breakByCat = useMemo<ExpenseBreakdown[]>(() => monthlyExpenseBreakdown(expenses, month), [expenses, month]);

  const breakByGroup = useMemo(() => {
    const groups = [
      { key: 'Material Decor', keys: ['Material Decor', 'Bunga', 'Kain', 'Backdrop', 'Kayu', 'Akrilik', 'Balon', 'Pita', 'Lem', 'Kabel', 'Lighting', 'Properti', 'Printing'], color: '#8C7216' },
      { key: 'Tenaga Kerja', keys: ['Tenaga Kerja', 'Harian', 'Helper', 'Driver', 'Crew', 'Lembur'], color: '#C5A358' },
      { key: 'Transportasi', keys: ['Transportasi', 'BBM', 'Parkir', 'Tol', 'Sewa Kendaraan', 'Kurir', 'Logistik', 'Operasional'], color: '#19376D' },
      { key: 'Operasional Kantor', keys: ['Operasional Kantor', 'Listrik', 'Internet', 'Sewa', 'ATK', 'Maintenance', 'Peralatan'], color: '#475569' },
      { key: 'Lainnya', keys: ['Lainnya', 'Konsumsi', 'Dokumentasi', 'Administrasi', 'Marketing', 'Biaya Tak Terduga'], color: '#94a3b8' },
    ];
    const map = new Map<string, number>();
    for (const e of expenses) {
      if (e.date.slice(0, 7) !== month) continue;
      const g = groups.find((gr) => gr.keys.includes(e.category)) || groups[4];
      map.set(g.key, (map.get(g.key) || 0) + e.amount);
    }
    return Array.from(map.entries()).map(([name, value]) => ({ name, value, color: groups.find((g) => g.key === name)!.color })).sort((a, b) => b.value - a.value);
  }, [expenses, month]);

  const perDecor = useMemo(
    () => decors
      .filter((d) => d.date.slice(0, 7) === month)
      .map((d) => ({ decor: d, fin: decorFinancial(d, expenses) }))
      .sort((a, b) => b.fin.profit - a.fin.profit),
    [decors, expenses, month],
  );

  const crewAct = useMemo(() => {
    return state.users
      .filter((u) => u.role === 'crew')
      .map((u) => {
        const h = hourData.find((x) => x.userId === u.id);
        const acts = monthActivities.filter((a) => a.userId === u.id).length;
        return { u, hours: h?.minutes || 0, acts };
      })
      .filter((x) => x.hours > 0 || x.acts > 0)
      .sort((a, b) => b.hours - a.hours);
  }, [state.users, monthActivities, hourData]);

  const shiftMonth = (dir: number) => {
    const [y, m] = month.split('-').map(Number);
    const d = new Date(y, m - 1 + dir, 1);
    setMonthlyReportMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  const monthLabel = new Date(month + '-01').toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

  return (
    <div>
      <PageHeader
        title="Rekap Bulanan"
        subtitle="Ringkasan keuangan & performa project per bulan"
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => shiftMonth(-1)}><ChevronLeft size={16} /></Button>
            <span className="text-sm font-bold text-navy w-36 text-center capitalize">{monthLabel}</span>
            <Button variant="outline" size="icon" onClick={() => shiftMonth(1)}><ChevronRight size={16} /></Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={<CalendarRange size={18} />} label="Total Decor" value={finance.decorCount} sub={monthLabel} tone="navy" />
        <StatCard icon={<Wallet size={18} />} label="Omzet" value={formatIDRCompact(finance.revenue)} sub={formatIDR(finance.revenue)} tone="gold" />
        <StatCard icon={<Wallet size={18} />} label="Pengeluaran" value={formatIDRCompact(finance.expenses)} sub={formatIDR(finance.expenses)} tone="sky" />
        <StatCard icon={<TrendingUp size={18} />} label="Profit" value={formatIDRCompact(finance.profit)} sub={`${finance.revenue ? Math.round((finance.profit / finance.revenue) * 100) : 0}% margin`} tone="green" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mt-4">
        <SectionCard title="Breakdown Pengeluaran">
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={breakByGroup} dataKey="value" nameKey="name" innerRadius={40} outerRadius={70} paddingAngle={2}>
                  {breakByGroup.map((_, i) => <Cell key={i} fill={breakByGroup[i].color} />)}
                </Pie>
                <Tooltip formatter={(v: number) => formatIDR(v)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="space-y-2 mt-2">
            {breakByGroup.length === 0 && <p className="text-xs text-slate-400 text-center">Belum ada pengeluaran.</p>}
            {breakByGroup.map((g) => (
              <li key={g.name} className="flex items-center justify-between text-[11px]">
                <span className="flex items-center gap-2 text-slate-600">
                  <span className="w-2 h-2 rounded-full" style={{ background: g.color }} />
                  {g.name}
                </span>
                <span className="font-bold text-navy">{formatIDRCompact(g.value)}</span>
              </li>
            ))}
          </ul>
        </SectionCard>

        <div className="lg:col-span-2 space-y-4">
          <SectionCard title="Pengeluaran per Kategori">
            {breakByCat.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">Belum ada data.</p>
            ) : (
              <ul className="space-y-2.5">
                {breakByCat.slice(0, 8).map((b, i) => (
                  <li key={b.name} className="flex items-center gap-3">
                    <span className="w-20 text-[11px] text-slate-600 truncate">{b.name}</span>
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gold" style={{ width: `${b.pct}%` }} />
                    </div>
                    <span className="w-20 text-right text-[11px] font-bold text-navy truncate">{formatIDRCompact(b.value)}</span>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          <SectionCard title={`Jam Kerja Crew — ${monthLabel}`}>
            <div className="mb-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Jam Kerja Bulan Ini</p>
              <p className="text-2xl font-headline font-bold text-navy">
                {totalDuration.h} <span className="text-base text-slate-400">jam {totalDuration.m} menit</span>
              </p>
            </div>
            <div className="hidden sm:block overflow-x-auto no-scrollbar">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[9px] uppercase tracking-widest text-slate-400 border-b border-slate-100">
                    <th className="py-2 pr-3">Crew</th>
                    <th className="py-2 pr-3">Jam Kerja</th>
                    <th className="py-2">Aktivitas</th>
                  </tr>
                </thead>
                <tbody>
                  {crewAct.map(({ u, hours, acts }) => (
                    <tr key={u.id} className="border-b border-slate-50">
                      <td className="py-2 pr-3 text-sm font-semibold text-navy">{u.name}</td>
                      <td className="py-2 pr-3 text-sm text-slate-600">{formatDuration(hours).label}</td>
                      <td className="py-2 text-sm text-slate-600">{acts}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="sm:hidden space-y-2">
              {crewAct.map(({ u, hours, acts }) => (
                <div key={u.id} className="flex items-center justify-between bg-white rounded-xl border border-slate-100 p-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-navy">{u.name}</p>
                    <p className="text-[10px] text-slate-400">{acts} aktivitas</p>
                  </div>
                  <p className="text-sm font-bold text-navy">{formatDuration(hours).label}</p>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>

      {/* Rekap per decor */}
      <SectionCard className="mt-4" title="Rekap Profit per Decor" action={<span className="text-[10px] font-bold text-slate-400">{monthLabel}</span>}>
        {perDecor.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">Tidak ada decor pada bulan ini.</p>
        ) : (
          <div className="hidden sm:block overflow-x-auto no-scrollbar">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[9px] uppercase tracking-widest text-slate-400 border-b border-slate-100">
                  <th className="py-2 pr-3">Decor</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3 text-right">Omzet</th>
                  <th className="py-2 pr-3 text-right">Pengeluaran</th>
                  <th className="py-2 pr-3 text-right">Profit</th>
                  <th className="py-2 text-right">Margin</th>
                </tr>
              </thead>
              <tbody>
                {perDecor.map(({ decor, fin }) => (
                  <tr key={decor.id} className="border-b border-slate-50">
                    <td className="py-2.5 pr-3">
                      <p className="text-sm font-semibold text-navy">{decor.name}</p>
                      <p className="text-[10px] text-slate-400">{decor.category} · {decor.client}</p>
                    </td>
                    <td className="py-2.5 pr-3"><StatusBadge color={DECOR_STATUS_COLOR[decor.status]} label={DECOR_STATUS_LABEL[decor.status]} /></td>
                    <td className="py-2.5 pr-3 text-right text-sm text-slate-600 whitespace-nowrap">{formatIDR(fin.revenue)}</td>
                    <td className="py-2.5 pr-3 text-right text-sm text-slate-600 whitespace-nowrap">{formatIDR(fin.expenses)}</td>
                    <td className={cnProfit(fin.profit)}>{formatIDR(fin.profit)}</td>
                    <td className="py-2.5 text-right text-sm font-bold text-navy">{fin.margin}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="sm:hidden space-y-2.5">
            {perDecor.map(({ decor, fin }) => (
              <div key={decor.id} className="bg-white rounded-xl border border-slate-100 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-navy leading-snug">{decor.name}</p>
                    <p className="text-[10px] text-slate-400">{decor.category} · {decor.client}</p>
                  </div>
                  <StatusBadge color={DECOR_STATUS_COLOR[decor.status]} label={DECOR_STATUS_LABEL[decor.status]} />
                </div>
                <div className="mt-2.5 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Omzet</span>
                    <span className="font-semibold text-navy">{formatIDR(fin.revenue)}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Pengeluaran</span>
                    <span className="font-semibold text-navy">{formatIDR(fin.expenses)}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] border-t border-slate-100 pt-1.5">
                    <span className="text-slate-400">Profit</span>
                    <span className={cn("font-bold", fin.profit >= 0 ? "text-emerald-600" : "text-red-500")}>{formatIDR(fin.profit)}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Margin</span>
                    <span className="font-bold text-navy">{fin.margin}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Bar omzet vs pengeluaran per decor */}
      <SectionCard className="mt-4" title="Omzet vs Pengeluaran per Decor">
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={perDecor.slice(0, 8).map((p) => ({
              name: p.decor.name.length > 12 ? p.decor.name.slice(0, 11) + '…' : p.decor.name,
              omzet: p.fin.revenue,
              pengeluaran: p.fin.expenses,
            }))}>
              <XAxis dataKey="name" tick={{ fontSize: 9 }} stroke="#cbd5e1" interval={0} angle={-15} textAnchor="end" height={50} />
              <YAxis tick={{ fontSize: 10 }} stroke="#cbd5e1" width={40} />
              <Tooltip formatter={(v: number) => formatIDR(v)} />
              <Bar dataKey="omzet" name="Omzet" fill="#0B2447" radius={[4, 4, 0, 0]} />
              <Bar dataKey="pengeluaran" name="Pengeluaran" fill="#C5A358" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </SectionCard>
    </div>
  );
}

function cnProfit(profit: number) {
  return `py-2.5 pr-3 text-right text-sm font-bold whitespace-nowrap ${profit >= 0 ? 'text-emerald-600' : 'text-red-500'}`;
}
