'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { opsAuthed, opsLogout } from '@/lib/ops/auth';
import {
  LayoutDashboard, CalendarRange, ListChecks, Clock4, Wallet, Image, RotateCcw, Settings, LogOut, HelpCircle,
  BarChart3, FileText, ClipboardList,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { OpsProvider, useOps } from '@/lib/ops/store';
import { DECOR_STATUS_COLOR } from '@/lib/ops/types';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { OpsHelpModal } from '@/components/ops-help-modal';

const NAV = [
  { label: 'Dasbor', href: '/ops', icon: LayoutDashboard },
  { label: 'Decor', href: '/ops/decor', icon: CalendarRange },
  { label: 'Tugas', href: '/ops/todo', icon: ListChecks },
  { label: 'Absensi', href: '/ops/absensi', icon: Clock4 },
  { label: 'Keuangan', href: '/ops/pengeluaran', icon: Wallet },
];

// Bottom nav (mobile style). Isi tab berbeda per role.
const BOTTOM_NAV_OWNER = [
  { label: 'Dasbor', href: '/ops', icon: LayoutDashboard },
  { label: 'Decor', href: '/ops/decor', icon: CalendarRange },
  { label: 'Tugas', href: '/ops/todo', icon: ListChecks },
  { label: 'Absensi', href: '/ops/absensi', icon: Clock4 },
  { label: 'Keuangan', href: '/ops/pengeluaran', icon: Wallet },
];
const BOTTOM_NAV_FREELANCER = [
  { label: 'Dasbor', href: '/ops', icon: LayoutDashboard },
  { label: 'Decor', href: '/ops/decor', icon: CalendarRange },
  { label: 'Tugas', href: '/ops/todo', icon: ListChecks },
  { label: 'Absensi', href: '/ops/absensi', icon: Clock4 },
  { label: 'Dokumentasi', href: '/ops/dokumentasi', icon: Image },
];

const MANAGER_NAV = [
  ...BOTTOM_NAV_OWNER,
  { label: 'Kegiatan', href: '/ops/kegiatan', icon: ClipboardList },
  { label: 'Analisa', href: '/ops/analisa', icon: BarChart3 },
  { label: 'Laporan', href: '/ops/laporan', icon: FileText },
];

function DecorSelector() {
  const { activeDecors, selectedDecorId, selectDecor } = useOps();
  return (
    <Select value={selectedDecorId} onValueChange={selectDecor}>
      <SelectTrigger className="h-9 w-full max-w-[280px] bg-white border-slate-200 text-navy font-bold text-xs">
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

function BottomNav() {
  const pathname = usePathname();
  const { currentUser } = useOps();
  const isFreelancer = currentUser.role === 'freelancer';
  const items = isFreelancer ? BOTTOM_NAV_FREELANCER : BOTTOM_NAV_OWNER;
  const desktopItems = isFreelancer ? BOTTOM_NAV_FREELANCER : MANAGER_NAV;
  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 shadow-[0_-2px_12px_rgba(2,17,44,0.06)] md:hidden">
        <div className="flex items-stretch justify-around max-w-lg mx-auto">
          {desktopItems.map((item) => {
            const isActive = item.href === '/ops'
              ? pathname === '/ops'
              : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 px-2 py-2.5 flex-1 min-w-0 transition-colors",
                  isActive ? "text-navy" : "text-slate-400 hover:text-navy",
                )}
              >
                <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                <span className={cn("text-[9px] font-black uppercase tracking-wider", isActive ? "text-navy" : "")}>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <aside className="hidden md:flex fixed inset-y-0 left-0 z-40 w-64 flex-col border-r border-slate-800 bg-[#081b34] text-white shadow-xl">
        <div className="px-5 py-6 border-b border-white/10">
          <p className="text-[10px] font-black uppercase tracking-[0.38em] text-gold">BluDecor</p>
          <p className="mt-2 text-lg font-bold text-white">OPS</p>
        </div>          <div className="flex-1 p-3 space-y-1.5 overflow-y-auto no-scrollbar">
          {items.map((item) => {
            const isActive = item.href === '/ops' ? pathname === '/ops' : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition-colors",
                  isActive ? "bg-white text-slate-900" : "text-slate-300 hover:bg-white/5 hover:text-white",
                )}
              >
                <item.icon size={17} />
                {item.label}
              </Link>
            );
          })}
        </div>
        <div className="border-t border-white/10 p-3 space-y-2">
          <p className="text-xs text-slate-500 truncate">{currentUser.name}</p>
        </div>
      </aside>
    </>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, selectedDecor } = useOps();
  const [helpOpen, setHelpOpen] = useState(false);
  const ALL_TITLES = [...BOTTOM_NAV_OWNER, ...BOTTOM_NAV_FREELANCER];
  const title = ALL_TITLES.find((n) => (n.href === '/ops' ? pathname === '/ops' : pathname.startsWith(n.href)))?.label
    || MANAGER_NAV.find((n) => pathname.startsWith(n.href))?.label
    || 'Dasbor';
  const isOwner = currentUser.role === 'owner';
  const isManager = currentUser.role === 'owner' || currentUser.role === 'admin';
  const freelancerRoutes = ['/ops', '/ops/decor', '/ops/todo', '/ops/absensi', '/ops/dokumentasi', '/ops/kegiatan'];
  const managerRoutes = [...freelancerRoutes, '/ops/analisa', '/ops/laporan', '/ops/pengeluaran'];
  const ownerRoutes = [...managerRoutes, '/ops/pengaturan'];
  const allowedRoutes = isOwner ? ownerRoutes : isManager ? managerRoutes : freelancerRoutes;

  useEffect(() => {
    const allowed = allowedRoutes.some((route) => route === '/ops' ? pathname === route : pathname.startsWith(route));
    if (!allowed) router.replace('/ops');
  }, [allowedRoutes, pathname, router]);

  if (!allowedRoutes.some((route) => route === '/ops' ? pathname === route : pathname.startsWith(route))) {
    return null;
  }

  function handleLogout() {
    opsLogout();
    router.replace('/login');
  }

  return (
    <div className="min-h-screen bg-[#F6F7FB] font-body pb-20 md:pb-8 md:pl-64">
      <header className="sticky top-0 z-30 bg-white border-b border-slate-100 shadow-sm">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="text-base font-headline font-bold text-navy uppercase tracking-widest truncate">{title}</h1>
            <p className="text-[10px] text-slate-400 truncate">
              {currentUser.name} · {selectedDecor ? selectedDecor.name : 'Belum pilih decor'}
            </p>
          </div>
          <div className="hidden sm:block shrink-0"><DecorSelector /></div>
          {isOwner && <ResetButton />}
          <button
            type="button"
            className="shrink-0 sm:hidden h-9 w-9 rounded-xl border border-slate-200 text-slate-400 hover:border-gold/30 hover:text-gold flex items-center justify-center transition-all"
            onClick={() => setHelpOpen(true)}
            aria-label="Bantuan"
          >
            <HelpCircle size={16} />
          </button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="shrink-0 hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-200 text-slate-400 hover:border-gold/30 hover:text-gold transition-all"
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
        <div className="sm:hidden w-full border-t border-slate-100 px-4 py-2.5 bg-slate-50/70">
          <DecorSelector />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-5 flex flex-col gap-5">
        {children}
      </main>

      <BottomNav />
      <OpsHelpModal open={helpOpen} onOpenChange={setHelpOpen} />
    </div>
  );
}

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