'use client';

import React, { useMemo } from 'react';
import { TrendingUp, CalendarRange, Wallet, Clock4, Users, ArrowUpRight, ArrowDownRight, Lightbulb } from 'lucide-react';
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { useOps } from '@/lib/ops/store';
import { monthlyFinancial, monthlyWorkHours, formatIDR, formatIDRCompact, formatDuration, monthlyExpenseBreakdown } from '@/lib/ops/reports';
import { cn } from '@/lib/utils';
import { StatCard, SectionCard, PageHeader } from '../ops-ui';

const CURRENT = new Date();
const MONTHS: { key: string; label: string }[] = [];
for (let i = 5; i >= 0; i--) {
  const d = new Date(CURRENT.getFullYear(), CURRENT.getMonth() - i, 1);
  MONTHS.push({
    key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
    label: d.toLocaleDateString('id-ID', { month: 'short' }),
  });
}

export default function AnalisaPage() {
  const { state, decors, expenses, activities, attendance } = useOps();

  const series = useMemo(
    () =>
      MONTHS.map((m) => {
        const fin = monthlyFinancial(decors, expenses, m.key);
        const hours = monthlyWorkHours(attendance, m.key);
        const acts = activities.filter((a) => a.at.slice(0, 7) === m.key).length;
        const expBreak = monthlyExpenseBreakdown(expenses, m.key);
        return {
          month: m.label,
          key: m.key,
          revenue: fin.revenue,
          expenses: fin.expenses,
          profit: fin.profit,
          decor: fin.decorCount,
          hours: hours.reduce((s, h) => s + h.minutes, 0),
          activities: acts,
          topExpense: expBreak[0]?.name || '—',
        };
      }),
    [decors, expenses, attendance, activities],
  );

  const cur = series[series.length - 1];
  const prev = series[series.length - 2];

  const pct = (a: number, b: number) => (b ? Math.round(((a - b) / b) * 100) : 100);
  const revenuePct = pct(cur?.revenue || 0, prev?.revenue || 0);
  const profitPct = pct(cur?.profit || 0, prev?.profit || 0);
  const hoursPct = pct(cur?.hours || 0, prev?.hours || 0);
  const decorPct = pct(cur?.decor || 0, prev?.decor || 0);

  const totalCrew = state.users.filter((u) => u.role === 'crew' && u.active).length;
  const activeMonthUsers = new Set(
    attendance.filter((a) => a.date.slice(0, 7) === cur?.key && (a.status === 'hadir' || a.status === 'selesai')).map((a) => a.userId),
  ).size;

  const insights = useMemo(() => {
    const out: { icon: string; text: string; up?: boolean }[] = [];
    if (revenuePct >= 0) out.push({ icon: 'omzet', text: `Omzet ${revenuePct >= 0 ? 'meningkat' : 'turun'} ${Math.abs(revenuePct)}% dibanding bulan sebelumnya.`, up: revenuePct >= 0 });
    const d = pct(cur?.decor || 0, prev?.decor || 0);
    out.push({ icon: 'decor', text: `Jumlah decor ${d >= 0 ? 'meningkat' : 'menurun'} ${Math.abs(d)}% (${prev?.decor || 0} → ${cur?.decor || 0} project).`, up: d >= 0 });
    out.push({ icon: 'profit', text: `Profit ${profitPct >= 0 ? 'meningkat' : 'turun'} ${Math.abs(profitPct)}% dibanding bulan sebelumnya.`, up: profitPct >= 0 });
    out.push({ icon: 'jam', text: `Total jam kerja crew ${hoursPct >= 0 ? 'meningkat' : 'turun'} ${Math.abs(hoursPct)}%.`, up: hoursPct >= 0 });
    if (cur?.topExpense && cur.topExpense !== '—') {
      out.push({ icon: 'material', text: `${cur.topExpense} menjadi kategori pengeluaran terbesar bulan ini.`, up: true });
    }
    return out;
  }, [revenuePct, profitPct, hoursPct, cur, prev]);

  const iconMap: Record<string, React.ReactNode> = {
    omzet: <TrendingUp size={16} />,
    decor: <CalendarRange size={16} />,
    profit: <Wallet size={16} />,
    jam: <Clock4 size={16} />,
    material: <Wallet size={16} />,
  };

  return (
    <div>
      <PageHeader title="Analisa BLUDECOR" subtitle="Performa bulanan, keuangan, dan aktivitas tim" />

      {/* Insights */}
      {insights.length > 0 && (
        <SectionCard className="mb-4" title={<span className="flex items-center gap-2"><Lightbulb size={14} /> Insight Otomatis</span>}>
          <ul className="space-y-2.5">
            {insights.map((ins, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-slate-700">
                <span className={ins.up === false ? "text-red-500 mt-0.5" : "text-gold mt-0.5"}>{iconMap[ins.icon]}</span>
                <span>{ins.text}</span>
              </li>
            ))}
          </ul>
        </SectionCard>
      )}

      {/* Performance table */}
      <SectionCard title="Performa Bulanan" className="mb-4">
        <div className="hidden overflow-x-auto no-scrollbar sm:block">
          <table className="w-full min-w-[600px] text-left">
            <thead>
              <tr className="text-[9px] uppercase tracking-widest text-slate-400 border-b border-slate-100">
                <th className="sticky left-0 z-10 bg-white py-2 pr-3">Indikator</th>
                {monthsHeader().map((h) => <th key={h} className="py-2 pr-3">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              <PerfRow label="Decor" values={series.map((s) => String(s.decor))} />
              <PerfRow label="Omzet" values={series.map((s) => formatIDRCompact(s.revenue))} />
              <PerfRow label="Pengeluaran" values={series.map((s) => formatIDRCompact(s.expenses))} />
              <PerfRow label="Profit" values={series.map((s) => formatIDRCompact(s.profit))} highlight />
            </tbody>
          </table>
        </div>
        <div className="space-y-2 sm:hidden">
          {([
            ['Decor', series.map((s) => String(s.decor))],
            ['Omzet', series.map((s) => formatIDRCompact(s.revenue))],
            ['Pengeluaran', series.map((s) => formatIDRCompact(s.expenses))],
            ['Profit', series.map((s) => formatIDRCompact(s.profit))],
          ] as [string, string[]][]).map(([label, values]) => (
            <div key={label} className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-navy">{label}</span>
                <span className="text-[9px] text-slate-400">6 bulan</span>
              </div>
              <div className="grid grid-cols-6 gap-1">
                {values.map((value, index) => (
                  <div key={`${label}-${index}`} className="min-w-0 text-center">
                    <p className="text-[9px] text-slate-400">{MONTHS[index].label}</p>
                    <p className="mt-0.5 truncate text-[10px] font-bold text-slate-700">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <StatCard icon={<CalendarRange size={18} />} label="Decor (bulan ini)" value={cur?.decor || 0} sub={`${statsChange(decorPct)} vs bulan lalu`} tone="navy" />
        <StatCard icon={<Wallet size={18} />} label="Profit" value={formatIDRCompact(cur?.profit || 0)} sub={formatIDR(cur?.profit || 0)} tone="green" />
        <StatCard icon={<Clock4 size={18} />} label="Jam Kerja" value={`${Math.floor((cur?.hours || 0) / 60)} jam`} sub={formatDuration(cur?.hours || 0).label} tone="gold" />
        <StatCard icon={<Users size={18} />} label="Crew Aktif" value={activeMonthUsers} sub={`dari ${totalCrew} anggota`} tone="sky" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <SectionCard title="Omzet vs Pengeluaran (6 Bulan)">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={series}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="#cbd5e1" />
                <YAxis tickFormatter={(v) => `${Math.round(v / 1000000)}jt`} tick={{ fontSize: 10 }} stroke="#cbd5e1" width={38} />
                <Tooltip formatter={(v: number) => formatIDR(v)} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="revenue" name="Omzet" fill="#0B2447" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" name="Pengeluaran" fill="#C5A358" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Profit (6 Bulan)">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="#cbd5e1" />
                <YAxis tickFormatter={(v) => `${Math.round(v / 1000000)}jt`} tick={{ fontSize: 10 }} stroke="#cbd5e1" width={38} />
                <Tooltip formatter={(v: number) => formatIDR(v)} />
                <Line type="monotone" dataKey="profit" name="Profit" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

function monthsHeader() {
  return MONTHS.map((m) => m.label);
}

function statsChange(p: number) {
  const Icon = p >= 0 ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={`inline-flex items-center gap-0.5 ${p >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
      <Icon size={11} /> {Math.abs(p)}%
    </span>
  );
}

function PerfRow({ label, values, highlight }: { label: string; values: string[]; highlight?: boolean }) {
  return (
    <tr className="border-b border-slate-50">
      <td className={cn("sticky left-0 bg-white py-2.5 pr-3 text-[11px] font-black uppercase tracking-widest", highlight ? "text-navy" : "text-slate-400")}>{label}</td>
      {values.map((v, i) => (
        <td key={i} className={cn("py-2.5 pr-3 text-sm", highlight ? "font-bold text-navy" : "text-slate-600")}>{v}</td>
      ))}
    </tr>
  );
}

