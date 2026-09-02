'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { Plus, Trash2, Wallet, Pencil, Search, LayoutGrid } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { useOps } from '@/lib/ops/store';
import { EXPENSE_CATEGORIES, EXPENSE_GROUPS, type Expense } from '@/lib/ops/types';
import { monthlyExpenseBreakdown, formatIDR, formatIDRCompact } from '@/lib/ops/reports';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { PageHeader, SectionCard, StatCard, EmptyState, Pagination } from '../ops-ui';
import { useToast } from '@/hooks/use-toast';
import { useSubmitLock } from '@/hooks/use-submit-lock';

const PIE_COLORS = ['#0B2447', '#8C7216', '#C5A358', '#19376D', '#475569', '#94a3b8', '#f59e0b', '#10b981'];

const MONTH_OPTIONS: string[] = [];
{
  const d = new Date();
  for (let i = 0; i < 7; i++) {
    const m = new Date(d.getFullYear(), d.getMonth() - i, 1);
    MONTH_OPTIONS.push(`${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, '0')}`);
  }
}

function ExpenseForm({
  initial, onClose, decorOptions,
}: {
  initial?: Expense;
  onClose: () => void;
  decorOptions: { id: string; name: string }[];
}) {
  const { addExpense, updateExpense } = useOps();
  const { toast } = useToast();
  const [description, setDescription] = useState(initial?.description || '');
  const [category, setCategory] = useState(initial?.category || 'Material Decor');
  const [amount, setAmount] = useState(initial ? String(initial.amount) : '');
  const [decorId, setDecorId] = useState(initial?.decorId || 'none');
  const [date, setDate] = useState(initial?.date || new Date().toISOString().slice(0, 10));
  const { locked, run } = useSubmitLock();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !amount) return;
    await run(() => {
      const data = { description: description.trim(), category, amount: Number(amount.replace(/[^0-9]/g, '')), decorId: decorId === 'none' ? undefined : decorId, date };
      if (initial) { updateExpense(initial.id, data); toast({ title: 'Pengeluaran diperbarui' }); }
      else { addExpense(data); toast({ title: 'Pengeluaran ditambahkan' }); }
      onClose();
    });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Keterangan *</Label>
        <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="cth. BBM kendaraan" required className="mt-1" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Kategori</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              {EXPENSE_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nominal (Rp) *</Label>
          <Input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="cth. 450000" inputMode="numeric" required className="mt-1" />
        </div>
        <div>
          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Decor</Label>
          <Select value={decorId} onValueChange={setDecorId}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Tidak terkait</SelectItem>
              {decorOptions.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tanggal</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1" />
        </div>
      </div>
      <DialogFooter className="gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onClose}>Batal</Button>
        <Button type="submit" disabled={locked} className="bg-navy hover:bg-gold text-white">{locked ? 'Menyimpan...' : initial ? 'Simpan' : 'Tambah'}</Button>
      </DialogFooter>
    </form>
  );
}

const CATEGORY_TABS = [
  { value: 'all', label: 'Semua', icon: LayoutGrid },
  ...EXPENSE_CATEGORIES.map((c) => ({ value: c, label: c, icon: Wallet })),
] as const;

export default function PengeluaranPage() {
  const { state, expenses, decors, addExpense, updateExpense, deleteExpense } = useOps();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [month, setMonth] = useState(state.monthlyReportMonth);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | undefined>(undefined);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const rawFilter = searchParams.get('tab');
  type ExpenseFilter = 'all' | typeof EXPENSE_CATEGORIES[number];
  const filter: ExpenseFilter = rawFilter && (
    rawFilter === 'all' || EXPENSE_CATEGORIES.includes(rawFilter as typeof EXPENSE_CATEGORIES[number])
  ) ? rawFilter as ExpenseFilter : 'all';

  const setFilter = useCallback((newFilter: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', newFilter);
    router.push(`/ops/pengeluaran?${params.toString()}`, { scroll: false });
  }, [searchParams, router]);

  const monthExpenses = useMemo(
    () => expenses.filter((e) => e.date.slice(0, 7) === month),
    [expenses, month],
  );

  const filtered = useMemo(
    () => monthExpenses
      .filter((e) => filter === 'all' || e.category === filter)
      .filter((e) => !search.trim() || e.description.toLowerCase().includes(search.trim().toLowerCase()))
      .sort((a, b) => (a.date < b.date ? 1 : -1)),
    [monthExpenses, filter, search],
  );

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const shown = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const total = monthExpenses.reduce((s, e) => s + e.amount, 0);
  const breakdown = useMemo(() => monthlyExpenseBreakdown(expenses, month), [expenses, month]);
  const handledExpenses = useMemo(() => {
    const g = new Map<string, number>();
    for (const e of monthExpenses) {
      const group = EXPENSE_GROUPS.find((gr) => gr.keys.includes(e.category));
      const key = group?.label || 'Lainnya';
      g.set(key, (g.get(key) || 0) + e.amount);
    }
    return Array.from(g.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [monthExpenses]);

  const decorOptions = decors.map((d) => ({ id: d.id, name: d.name }));
  const decorName = (id?: string) => decors.find((d) => d.id === id)?.name;

  const openCreate = () => { setEditing(undefined); setOpen(true); };
  const openEdit = (e: Expense) => { setEditing(e); setOpen(true); };

  return (
    <div>
      <PageHeader
        title="Pengeluaran"
        subtitle="Kelola biaya operasional, material, dan tenaga kerja"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Select value={month} onValueChange={setMonth}>
              <SelectTrigger className="w-[150px] h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                {MONTH_OPTIONS.map((m) => (
                  <SelectItem key={m} value={m}>
                    {new Date(m + '-01').toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={openCreate} className="bg-navy hover:bg-gold text-white"><Plus size={15} /> Tambah</Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={<Wallet size={18} />} label="Total Pengeluaran" value={formatIDRCompact(total)} sub="bulan ini" tone="navy" />
        <StatCard label="Transaksi" value={monthExpenses.length} sub="bulan ini" tone="sky" />
        <StatCard label="Kategori Terbesar" value={breakdown[0]?.name || '—'} sub={breakdown[0] ? formatIDRCompact(breakdown[0].value) : ''} tone="gold" />
        <StatCard label="Terikat Decor" value={monthExpenses.filter((e) => e.decorId).length} sub="transaksi" tone="indigo" />
      </div>

      {/* Category tabs */}
      <div className="flex gap-1.5 mb-4 overflow-x-auto no-scrollbar pb-1">
        {CATEGORY_TABS.map((t) => {
          const isActive = t.value === filter;
          const count = t.value === 'all' ? monthExpenses.length : monthExpenses.filter((e) => e.category === t.value).length;
          return (
            <button
              key={t.value}
              onClick={() => { setFilter(t.value); setPage(1); }}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border shrink-0 select-none",
                isActive ? "bg-navy text-white border-navy shadow-sm" : "bg-white text-slate-400 border-slate-200 hover:border-slate-300",
              )}
            >
              {t.label}
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

      <div className="grid lg:grid-cols-3 gap-4 mt-4">
        <SectionCard title="Breakdown Pengeluaran">
          {handledExpenses.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">Belum ada data bulan ini.</p>
          ) : (
            <>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={handledExpenses} dataKey="value" nameKey="name" innerRadius={40} outerRadius={70} paddingAngle={2}>
                      {handledExpenses.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => formatIDR(v)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="space-y-2 mt-2">
                {handledExpenses.map((g, i) => (
                  <li key={g.name} className="flex items-center justify-between text-[11px]">
                    <span className="flex items-center gap-2 text-slate-600">
                      <span className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      {g.name}
                    </span>
                    <span className="font-bold text-navy">{formatIDRCompact(g.value)}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </SectionCard>

        <SectionCard className="lg:col-span-2" title="Transaksi Pengeluaran" action={            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-300" />
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Cari keterangan..."
                className="h-8 w-[160px] rounded-lg border border-slate-200 pl-7 pr-2 text-[11px] bg-white focus:outline-none focus:ring-2 focus:ring-gold/30"
              />
            </div>
        }>
          {filtered.length === 0 ? (
            <EmptyState icon={<Wallet size={20} />} title="Tidak ada transaksi" sub="Tambahkan pengeluaran bulan ini." />
          ) : (
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[9px] uppercase tracking-widest text-slate-400 border-b border-slate-100">
                    <th className="py-2 pr-3">Tanggal</th>
                    <th className="py-2 pr-3">Keterangan</th>
                    <th className="py-2 pr-3">Kategori</th>
                    <th className="py-2 pr-3">Decor</th>
                    <th className="py-2 pr-3 text-right">Nominal</th>
                    <th className="py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((e) => (
                    <tr key={e.id} className="border-b border-slate-50">
                      <td className="py-2.5 pr-3 text-[11px] text-slate-500 whitespace-nowrap">
                        {new Date(e.date + 'T00:00:00').toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                      </td>
                      <td className="py-2.5 pr-3 text-sm font-medium text-navy">{e.description}</td>
                      <td className="py-2.5 pr-3">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[9px] font-bold uppercase tracking-widest">{e.category}</span>
                      </td>
                      <td className="py-2.5 pr-3 text-[11px] text-slate-500">{decorName(e.decorId) || '—'}</td>
                      <td className="py-2.5 pr-3 text-right text-sm font-bold text-navy whitespace-nowrap">{formatIDR(e.amount)}</td>
                      <td className="py-2.5">
                        <div className="flex gap-1 justify-end">
                          <button onClick={() => openEdit(e)} className="text-slate-300 hover:text-navy" aria-label="edit"><Pencil size={14} /></button>
                          <button onClick={() => { deleteExpense(e.id); toast({ title: 'Pengeluaran dihapus' }); }} className="text-slate-300 hover:text-red-500" aria-label="hapus"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={4} className="py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Total</td>
                    <td className="py-3 text-right font-headline font-bold text-navy">{formatIDR(total)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
          <Pagination page={page} totalPages={pageCount} onPage={setPage} />
        </SectionCard>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg text-navy flex items-center gap-2">{editing ? <><Pencil size={16} /> Edit Pengeluaran</> : <><Plus size={16} /> Tambah Pengeluaran</>}</DialogTitle>
            <DialogDescription className="text-xs text-slate-400">Catat biaya operasional BLUDECOR.</DialogDescription>
          </DialogHeader>
          <ExpenseForm initial={editing} onClose={() => setOpen(false)} decorOptions={decorOptions} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
