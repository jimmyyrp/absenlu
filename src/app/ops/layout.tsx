'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { opsAuthed, opsLogout } from '@/lib/ops/auth';
import { RotateCcw, LogOut, HelpCircle, MoreHorizontal, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { OpsProvider, useOps } from '@/lib/ops/store';
import { DECOR_STATUS_COLOR } from '@/lib/ops/types';
import {
  PRIMARY_NAV, CREW_PRIMARY_NAV, CREW_NAV, MANAGER_NAV, OWNER_NAV, SECONDARY_NAV,
  isActivePath, isAllowedRoute, isOwnerOrDeveloper, isManagerOrDeveloper,
} from './navigation';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { OpsHelpModal } from '@/components/ops-help-modal';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

function DecorSelector() {
  const { activeDecors, selectedDecorId, selectDecor } = useOps();
  return (
    <Select value={selectedDecorId} onValueChange={selectDecor}>
      <SelectTrigger className="h-9 w-full max-w-[240px] bg-white border-slate-200 text-navy font-bold text-xs">
        <SelectValue placeholder="Pilih decor" />
      </SelectTrigger>
      <SelectContent>
        {activeDecors.length === 0 && (
          <div className="px-3 py-2 text-xs text-slate-400">Tidak ada decor aktif</div>
        )}
        {activeDecors.map((d) => (
          <SelectItem key={d.id} value={d.id}>
            <span className="flex items-center gap-2">
              <span className={cn("w-2 h-2 rounded-full", DECOR_STATUS_COLOR[d.status])} />
              {d.name}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function ResetButton() {
  const { resetData } = useOps();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="ghost" size="sm" className="text-slate-400 hover:text-red-500 text-[10px] uppercase tracking-widest" onClick={() => setOpen(true)}>
        <RotateCcw size={13} /> Reset
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base text-navy">Ulangi semua data?</DialogTitle>
            <DialogDescription className="text-sm text-slate-500">
              Semua perubahan yang Anda simpan akan dihapus dan data kembali ke contoh awal.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button className="bg-red-500 hover:bg-red-600 text-white" onClick={() => { resetData(); setOpen(false); }}>
              Ya, Ulangi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* ─── Mobile Bottom Nav (max 5 items + overflow) ─────────────────────── */
function BottomNav() {
  const pathname = usePathname();
  const { currentUser } = useOps();
  const isCrew = currentUser.role === 'crew';
  const isManager = isManagerOrDeveloper(currentUser.role);
  const isOwner = isOwnerOrDeveloper(currentUser.role);

  // Primary: always 5 items max for mobile
  const primaryItems = isCrew ? CREW_PRIMARY_NAV : PRIMARY_NAV;
  // Overflow: secondary items for managers (Kegiatan, Analisa, Laporan) + Pengaturan for owner
  const overflowItems = isManager ? [
    ...SECONDARY_NAV,
    ...(isOwner ? [{ label: 'Pengaturan', href: '/ops/pengaturan', icon: Settings }] : []),
  ] : [];

  const hasOverflow = overflowItems.length > 0;
  const isOverflowActive = hasOverflow && overflowItems.some((item) => isActivePath(pathname, item.href));

  return (
    <>
      {/* ── Mobile bottom bar ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 shadow-[0_-2px_12px_rgba(2,17,44,0.08)] pb-safe md:hidden">
        <div className="flex items-stretch justify-around max-w-lg mx-auto">
          {primaryItems.map((item) => {
            const active = isActivePath(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex flex-1 min-w-0 flex-col items-center justify-center gap-1 py-3 px-1 transition-colors",
                  active ? "text-navy" : "text-slate-400 hover:text-navy",
                )}
              >
                {active && <span className="absolute top-0 inset-x-6 h-0.5 rounded-full bg-gold" />}
                <item.icon size={24} strokeWidth={active ? 2.5 : 1.8} />
                <span className={cn("text-[11px] font-bold leading-none tracking-wide", active ? "text-navy font-black" : "")}>{item.label}</span>
              </Link>
            );
          })}
          {/* Overflow menu for managers */}
          {hasOverflow && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" className={cn(
                  "relative flex flex-1 min-w-0 flex-col items-center justify-center gap-1 py-3 px-1 transition-colors",
                  isOverflowActive ? "text-navy" : "text-slate-400 hover:text-navy",
                )} aria-label="Buka menu lainnya">
                  {isOverflowActive && <span className="absolute top-0 inset-x-6 h-0.5 rounded-full bg-gold" />}
                  <MoreHorizontal size={24} strokeWidth={isOverflowActive ? 2.5 : 1.8} />
                  <span className={cn("text-[11px] font-bold leading-none tracking-wide", isOverflowActive ? "text-navy font-black" : "")}>Lainnya</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" side="top" className="mb-3 min-w-[190px]">
                <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-slate-400">Menu OPS</DropdownMenuLabel>
                {overflowItems.map((item) => (
                  <DropdownMenuItem key={item.href} asChild className="py-3 text-sm font-semibold">
                    <Link href={item.href}><item.icon size={17} />{item.label}</Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </nav>

      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 z-40 w-60 flex-col border-r border-slate-800 bg-[#081b34] text-white shadow-xl">
        <div className="px-5 py-5 border-b border-white/10">
          <p className="text-[10px] font-black uppercase tracking-[0.38em] text-gold">BluDecor</p>
          <p className="mt-1.5 text-lg font-bold text-white">OPS</p>
        </div>
        <div className="flex-1 p-3 space-y-1 overflow-y-auto no-scrollbar">
          {(isOwner ? OWNER_NAV : isManager ? MANAGER_NAV : CREW_NAV).map((item) => {
            const active = isActivePath(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition-colors",
                  active ? "bg-white text-slate-900" : "text-slate-300 hover:bg-white/5 hover:text-white",
                )}
              >
                <item.icon size={17} />
                {item.label}
              </Link>
            );
          })}
        </div>
        <div className="border-t border-white/10 p-3">
          <p className="text-xs text-slate-500 truncate">{currentUser.name}</p>
        </div>
      </aside>
    </>
  );
}

/* ─── Main Shell ──────────────────────────────────────────────────────── */
function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, selectedDecor } = useOps();
  const [helpOpen, setHelpOpen] = useState(false);
  const isOwner = isOwnerOrDeveloper(currentUser.role);
  const isManager = isManagerOrDeveloper(currentUser.role);

  // Find title from all nav lists
  const allNav = [...OWNER_NAV];
  const title = allNav.find((n) => isActivePath(pathname, n.href))?.label || 'Dasbor';

  // Route guards — developer gets full owner access
  const allowedRoutes = isOwner
    ? ['/ops', '/ops/decor', '/ops/todo', '/ops/absensi', '/ops/dokumentasi', '/ops/kegiatan', '/ops/analisa', '/ops/laporan', '/ops/pengeluaran', '/ops/pengaturan']
    : isManager
      ? ['/ops', '/ops/decor', '/ops/todo', '/ops/absensi', '/ops/dokumentasi', '/ops/kegiatan', '/ops/analisa', '/ops/laporan', '/ops/pengeluaran']
      : ['/ops', '/ops/decor', '/ops/todo', '/ops/absensi', '/ops/dokumentasi', '/ops/kegiatan'];

  useEffect(() => {
    const allowed = isAllowedRoute(pathname, allowedRoutes);
    if (!allowed) router.replace('/ops');
  }, [allowedRoutes, pathname, router]);

  if (!isAllowedRoute(pathname, allowedRoutes)) {
    return null;
  }

  function handleLogout() {
    opsLogout();
    router.replace('/login');
  }

  return (
    <div className="min-h-screen bg-[#F6F7FB] font-body pb-28 md:pb-6 md:pl-60">
      {/* ── Header ── */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-100 shadow-sm pt-safe">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="text-base font-headline font-bold text-navy uppercase tracking-widest truncate">{title}</h1>
            <p className="text-[10px] text-slate-400 truncate">
              {currentUser.name} · {selectedDecor ? selectedDecor.name : 'Belum pilih decor'}
            </p>
          </div>
          {/* Desktop: inline decor selector + actions */}
          <div className="hidden md:block shrink-0"><DecorSelector /></div>
          {isOwner && <div className="hidden md:block"><ResetButton /></div>}
          <button
            type="button"
            className="shrink-0 md:hidden h-9 w-9 rounded-xl border border-slate-200 text-slate-400 hover:border-gold/30 hover:text-gold flex items-center justify-center transition-all"
            onClick={() => setHelpOpen(true)}
            aria-label="Bantuan"
          >
            <HelpCircle size={16} />
          </button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="shrink-0 hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-200 text-slate-400 hover:border-gold/30 hover:text-gold transition-all"
            onClick={() => setHelpOpen(true)}
          >
            <HelpCircle size={14} /> Bantuan
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="shrink-0 text-slate-500 hover:bg-red-50 hover:text-red-600"
            onClick={handleLogout}
            aria-label="Keluar dari OPS"
          >
            <LogOut size={15} />
            <span className="hidden sm:inline">Keluar</span>
          </Button>
        </div>
        {/* Mobile: decor selector in a slim row */}
        <div className="md:hidden w-full border-t border-slate-100 px-4 py-2 bg-slate-50/70">
          <DecorSelector />
        </div>
      </header>

      {/* ── Main content ── */}
      <main className="mx-auto max-w-6xl px-4 py-5 flex flex-col gap-5">
        {children}
      </main>

      <BottomNav />
      <OpsHelpModal open={helpOpen} onOpenChange={setHelpOpen} />
    </div>
  );
}

/* ─── Layout Entry ────────────────────────────────────────────────────── */
export default function OpsLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!opsAuthed()) {
      router.replace('/login');
    } else {
      setChecking(false);
    }
  }, [router]);

  if (checking) {
    return (
      <div className="h-screen bg-[#0B2447] flex items-center justify-center">
        <div className="text-gold font-bold text-sm uppercase tracking-[0.4em] animate-pulse">BluDecor OPS</div>
      </div>
    );
  }

  return (
    <OpsProvider>
      <Shell>{children}</Shell>
    </OpsProvider>
  );
}
