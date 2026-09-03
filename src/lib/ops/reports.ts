import type { DecorProject, Expense, Attendance } from './types';

export interface MonthFinancial {
  revenue: number;
  expenses: number;
  profit: number;
  decorCount: number;
}

function monthKey(d: string) {
  return d.slice(0, 7);
}

export function minutesBetween(checkIn?: string, checkOut?: string): number {
  if (!checkIn || !checkOut) return 0;
  const parse = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };
  const diff = parse(checkOut) - parse(checkIn);
  return diff > 0 ? diff : 0;
}

export function monthlyFinancial(
  decors: DecorProject[],
  expenses: Expense[],
  month: string,
): MonthFinancial {
  const inMonthDecors = decors.filter((d) => monthKey(d.date) === month && d.status !== 'dibatalkan');
  const revenue = inMonthDecors.reduce((s, d) => s + (d.revenue || 0), 0);
  const exp = expenses.filter((e) => monthKey(e.date) === month);
  const expenseTotal = exp.reduce((s, e) => s + e.amount, 0);
  return {
    revenue,
    expenses: expenseTotal,
    profit: revenue - expenseTotal,
    decorCount: inMonthDecors.length,
  };
}

export interface UserHours {
  userId: string;
  minutes: number;
}

export function monthlyWorkHours(attendance: Attendance[], month: string): UserHours[] {
  const map = new Map<string, number>();
  for (const a of attendance) {
    if (monthKey(a.date) !== month) continue;
    if (a.status !== 'hadir' && a.status !== 'selesai') continue;
    const mins = minutesBetween(a.checkIn, a.checkOut);
    if (mins > 0) map.set(a.userId, (map.get(a.userId) || 0) + mins);
  }
  return Array.from(map.entries()).map(([userId, minutes]) => ({ userId, minutes }));
}

export function formatDuration(totalMinutes: number): { h: number; m: number; label: string } {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return { h, m, label: h > 0 ? `${h} jam ${m} menit` : `${m} menit` };
}

export function formatIDR(amount: number): string {
  return `Rp ${Math.round(amount).toLocaleString('id-ID')}`;
}

export function formatIDRCompact(amount: number): string {
  const numeric = Math.round(amount);

  if (numeric >= 1_000_000_000) {
    return `Rp ${(numeric / 1_000_000_000).toFixed(1).replace('.', ',')} M`;
  }
  if (numeric >= 1_000_000) {
    return `Rp ${(numeric / 1_000_000).toFixed(1).replace('.', ',')} jt`;
  }
  if (numeric >= 1_000) {
    return `Rp ${(numeric / 1_000).toFixed(1).replace('.', ',')} rb`;
  }
  return `Rp ${numeric.toLocaleString('id-ID')}`;
}

export interface ExpenseBreakdown {
  name: string;
  value: number;
  pct: number;
}

export function monthlyExpenseBreakdown(expenses: Expense[], month: string): ExpenseBreakdown[] {
  const map = new Map<string, number>();
  for (const e of expenses) {
    if (monthKey(e.date) !== month) continue;
    map.set(e.category, (map.get(e.category) || 0) + e.amount);
  }
  const total = Array.from(map.values()).reduce((s, v) => s + v, 0);
  return Array.from(map.entries())
    .map(([name, value]) => ({ name, value, pct: total ? Math.round((value / total) * 100) : 0 }))
    .sort((a, b) => b.value - a.value);
}

export function decorFinancial(
  decor: DecorProject,
  expenses: Expense[],
): { revenue: number; expenses: number; profit: number; margin: number } {
  const exp = expenses
    .filter((e) => e.decorId === decor.id)
    .reduce((s, e) => s + e.amount, 0);
  const revenue = decor.revenue || 0;
  return {
    revenue,
    expenses: exp,
    profit: revenue - exp,
    margin: revenue ? Math.round(((revenue - exp) / revenue) * 100) : 0,
  };
}

export type DecorScheduleState =
  | 'no-schedule' // decor tanpa jadwal jam kerja -> fleksibel
  | 'future' // belum sampai hari kerja decor
  | 'before-start' // hari kerja, sebelum jam mulai
  | 'running' // sedang dalam rentang jadwal kerja
  | 'finished'; // sudah melewati jadwal selesai -> locked

function toMinutes(hhmm?: string): number | null {
  if (!hhmm) return null;
  const [h, m] = hhmm.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

export function sameDay(d1: string, d2: string): boolean {
  return d1.slice(0, 10) === d2.slice(0, 10);
}

export function decorScheduleState(decor: DecorProject, now = new Date()): DecorScheduleState {
  if (decor.status === 'dibatalkan' || decor.status === 'selesai') return 'finished';
  if (!decor.workStart || !decor.workEnd || !decor.date) return 'no-schedule';

  const workMin = toMinutes(decor.workStart);
  const endMin = toMinutes(decor.workEnd);
  if (workMin === null || endMin === null) return 'no-schedule';
  if (!sameDay(decor.date, now.toISOString().slice(0, 10))) {
    return decor.date < now.toISOString().slice(0, 10) ? 'finished' : 'future';
  }

  const nowMin = now.getHours() * 60 + now.getMinutes();
  if (nowMin < workMin) return 'before-start';
  if (nowMin <= endMin) return 'running';
  return 'finished';
}

export function decorScheduleLabel(decor: DecorProject | undefined): string {
  if (!decor || !decor.workStart || !decor.workEnd) return 'Tanpa jadwal';
  return `${decor.workStart} – ${decor.workEnd}`;
}

export function decorScheduleLocked(decor: DecorProject | undefined, now = new Date()): boolean {
  if (!decor) return false;
  const s = decorScheduleState(decor, now);
  return s === 'finished' || s === 'before-start' || s === 'future';
}

export function decorScheduleLockReason(decor: DecorProject | undefined, now = new Date()): string | null {
  if (!decor) return null;
  const s = decorScheduleState(decor, now);
  if (s === 'finished') return 'Jadwal kerja decor sudah lewat.';
  if (s === 'before-start') return 'Jadwal kerja decor belum dimulai.';
  if (s === 'future') return 'Hari kerja decor belum tiba.';
  return null;
}


