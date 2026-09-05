import {
  BarChart3, CalendarRange, ClipboardList, Clock4, FileText, Image,
  LayoutDashboard, ListChecks, Settings, Wallet,
} from 'lucide-react';

export const PRIMARY_NAV = [
  { label: 'Dasbor', href: '/ops', icon: LayoutDashboard },
  { label: 'Decor', href: '/ops/decor', icon: CalendarRange },
  { label: 'Tugas', href: '/ops/todo', icon: ListChecks },
  { label: 'Absensi', href: '/ops/absensi', icon: Clock4 },
  { label: 'Keuangan', href: '/ops/pengeluaran', icon: Wallet },
] as const;

export const CREW_PRIMARY_NAV = PRIMARY_NAV.filter((item) => item.href !== '/ops/pengeluaran');

export const SECONDARY_NAV = [
  { label: 'Kegiatan', href: '/ops/kegiatan', icon: ClipboardList },
  { label: 'Analisa', href: '/ops/analisa', icon: BarChart3 },
  { label: 'Laporan', href: '/ops/laporan', icon: FileText },
] as const;

export const CREW_NAV = [
  ...CREW_PRIMARY_NAV,
  { label: 'Dokumentasi', href: '/ops/dokumentasi', icon: Image },
] as const;

export const MANAGER_NAV = [...PRIMARY_NAV, ...SECONDARY_NAV] as const;
export const OWNER_NAV = [...MANAGER_NAV, { label: 'Pengaturan', href: '/ops/pengaturan', icon: Settings }] as const;

export const CREW_ROUTES = ['/ops', '/ops/decor', '/ops/todo', '/ops/absensi', '/ops/dokumentasi', '/ops/kegiatan'] as const;
export const MANAGER_ROUTES = [...CREW_ROUTES, '/ops/analisa', '/ops/laporan', '/ops/pengeluaran'] as const;
export const OWNER_ROUTES = [...MANAGER_ROUTES, '/ops/pengaturan'] as const;

export function isActivePath(pathname: string, href: string) {
  return href === '/ops' ? pathname === '/ops' : pathname === href || pathname.startsWith(`${href}/`);
}

export function isAllowedRoute(pathname: string, routes: readonly string[]) {
  return routes.some((route) => route === '/ops' ? pathname === route : pathname === route || pathname.startsWith(`${route}/`));
}

export function isDeveloper(role: string): boolean {
  return role === 'developer';
}

export function isOwnerOrDeveloper(role: string): boolean {
  return role === 'owner' || role === 'developer';
}

export function isManagerOrDeveloper(role: string): boolean {
  return role === 'owner' || role === 'admin' || role === 'developer';
}
