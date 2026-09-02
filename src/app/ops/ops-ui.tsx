'use client';

import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function PageHeader({
  title,
  subtitle,
  action,
  backTo,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  backTo?: string;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
      <div>
        {backTo && (
          <Link href={backTo} className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-navy mb-2">
            <ChevronLeft size={13} /> Kembali
          </Link>
        )}
        <h2 className="text-xl font-headline font-bold text-navy">{title}</h2>
        {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function StatCard({
  label, value, sub, icon, tone = 'navy',
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  icon?: React.ReactNode;
  tone?: 'navy' | 'gold' | 'green' | 'red' | 'sky' | 'indigo';
}) {
  const tones: Record<string, string> = {
    navy: 'bg-navy text-white',
    gold: 'bg-gold text-white',
    green: 'bg-emerald-500 text-white',
    red: 'bg-red-500 text-white',
    sky: 'bg-sky-500 text-white',
    indigo: 'bg-indigo-500 text-white',
  };
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
      <div className="flex items-center gap-3">
        {icon && (
          <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0", tones[tone])}>
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
          <p className="text-xl font-headline font-bold text-navy leading-tight">{value}</p>
          {sub && <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>}
        </div>
      </div>
    </div>
  );
}

export function SectionCard({
  title, action, children, className,
}: {
  title?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("bg-white rounded-2xl border border-slate-100 shadow-sm", className)}>
      {(title || action) && (
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          {title ? <h3 className="text-[12px] font-black uppercase tracking-widest text-navy">{title}</h3> : <span />}
          {action}
        </div>
      )}
      <div className="p-4 pt-2">{children}</div>
    </div>
  );
}

export function StatusBadge({ color, label }: { color: string; label: string }) {
  const map: Record<string, string> = {
    'bg-slate-400': 'bg-slate-100 text-slate-600',
    'bg-amber-500': 'bg-amber-100 text-amber-700',
    'bg-sky-500': 'bg-sky-100 text-sky-700',
    'bg-indigo-500': 'bg-indigo-100 text-indigo-700',
    'bg-emerald-500': 'bg-emerald-100 text-emerald-700',
    'bg-red-500': 'bg-red-100 text-red-700',
  };
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest", map[color] || 'bg-slate-100 text-slate-600')}>
      <span className={cn("w-1.5 h-1.5 rounded-full", color)} />
      {label}
    </span>
  );
}

export function ProgressBar({ value, className }: { value: number; className?: string }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className={cn("w-full h-2 bg-slate-100 rounded-full overflow-hidden", className)}>
      <div className="h-full bg-gradient-to-r from-navy to-gold rounded-full transition-all" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function EmptyState({ icon, title, sub }: { icon?: React.ReactNode; title: string; sub?: string }) {
  return (
    <div className="text-center py-12 px-4">
      <div className="mx-auto mb-3 h-12 w-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
        {icon}
      </div>
      <p className="text-sm font-bold text-slate-500">{title}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}

export function formatDateTime(iso: string) {
  try {
    const d = new Date(iso);
    return `${d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })} · ${d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;
  } catch {
    return iso;
  }
}

export function Pagination({
  page, totalPages, onPage, className,
}: {
  page: number;
  totalPages: number;
  onPage: (p: number) => void;
  className?: string;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className={cn("flex items-center justify-between gap-2 pt-3 border-t border-slate-50", className)}>
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onPage(page - 1)}
        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-navy disabled:opacity-30 disabled:pointer-events-none"
      >
        <ChevronLeft size={13} /> Sebelumnya
      </button>
      <span className="text-[10px] font-bold text-slate-400">
        {page} / {totalPages}
      </span>
      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onPage(page + 1)}
        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-navy disabled:opacity-30 disabled:pointer-events-none"
      >
        Berikutnya <ChevronRight size={13} />
      </button>
    </div>
  );
}
