'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Menu, ChevronLeft, ChevronRight, LogOut, Users, Settings, Terminal, LifeBuoy, ShieldCheck, Eye, EyeOff, Loader2, ArrowLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription, SheetClose } from "@/components/ui/sheet";
import { adminNavLinks } from '@/data/site-data';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { cms } from '@/lib/cms-client';
import { useSiteSettings } from '@/hooks/use-site-settings';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const { settings } = useSiteSettings();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState({ name: 'Admin', role: 'staff' });
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const [logoutArmed, setLogoutArmed] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  // Inline login state
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    try {
      setMounted(true);
      const auth = localStorage.getItem('blu_admin_auth');
      if (auth === 'true') {
        setUser({
          name: localStorage.getItem('blu_user_name') || 'Administrator',
          role: localStorage.getItem('blu_user_role') || 'staff'
        });
      }
      setAuthChecked(true);
    } catch {
      setMounted(true);
      setAuthChecked(true);
    }
  }, []);

  const handleInlineLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginUser || !loginPass) return;
    setLoginLoading(true);
    setLoginError('');
    try {
      const { data, error: queryError } = await cms
        .rpc('login_user', { p_username: loginUser.trim(), p_password: loginPass });
      if (queryError || !data || data.length === 0) {
        setLoginError('Kredensial tidak valid.');
        setLoginLoading(false);
        return;
      }
      const userData = data[0];
      localStorage.setItem('blu_admin_auth', 'true');
      localStorage.setItem('blu_user_role', userData.role);
      localStorage.setItem('blu_user_name', userData.full_name);
      setUser({ name: userData.full_name, role: userData.role });
      setLoginUser('');
      setLoginPass('');
      toast({ title: "Otorisasi Berhasil", description: `Selamat datang, ${userData.full_name}.` });
    } catch {
      setLoginError('Terjadi gangguan pada sistem.');
    } finally {
      setLoginLoading(false);
    }
  }, [loginUser, loginPass, toast]);

  const handleLogout = () => {
    try {
      localStorage.removeItem('blu_admin_auth'); 
      localStorage.removeItem('blu_user_role');
      localStorage.removeItem('blu_user_name');
      localStorage.removeItem('blu_auth_sig');
    } catch {}
    setIsLogoutConfirmOpen(false);
    toast({ title: "Logout Berhasil", description: "Sesi Anda telah berakhir dengan aman." });
    router.replace('/login'); 
  };

  const navigation = useMemo(() => {
    const baseNav = adminNavLinks.filter(link => !['/admin/users', '/admin/settings', '/admin/developer'].includes(link.href));
    
    const extendedNav = [...baseNav];
    
    if (user.role === 'admin' || user.role === 'developer') {
      extendedNav.push({ label: 'Kelola Tim', href: '/admin/users', icon: Users });
      extendedNav.push({ label: 'Pengaturan', href: '/admin/settings', icon: Settings });
    }

    if (user.role === 'developer') {
      extendedNav.push({ label: 'Developer', href: '/admin/developer', icon: Terminal });
    }

    extendedNav.push({ label: 'Panduan', href: '/admin/panduan', icon: LifeBuoy });

    return extendedNav;
  }, [user.role]);

  if (!mounted) return null;

  // Show inline login if not authenticated
  if (authChecked && !localStorage.getItem('blu_admin_auth')) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
        <div className="w-full max-w-[360px] bg-white rounded-[2.5rem] shadow-5xl overflow-hidden animate-fade-up">
          <div className="bg-navy pt-10 pb-8 px-6 text-center">
            <h1 className="text-[11px] font-black uppercase tracking-[0.5em] text-white/90">Portal Internal</h1>
            <p className="text-white/20 font-bold text-[7px] uppercase tracking-[0.4em] mt-1">Otorisasi Tim {settings.app_name}</p>
          </div>
          <form onSubmit={handleInlineLogin} className="p-10 space-y-5">
            {loginError && (
              <div className="bg-red-50 border border-red-100 rounded-xl p-3">
                <p className="text-[9px] font-bold uppercase text-red-500">{loginError}</p>
              </div>
            )}
            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 ml-1">ID Pengguna</label>
              <Input value={loginUser} onChange={(e) => setLoginUser(e.target.value)} autoComplete="username" inputMode="email" className="h-12 rounded-xl bg-slate-50 border-none shadow-inner text-base font-bold" required />
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 ml-1">Kode Akses</label>
              <div className="relative">
                <Input type={showPassword ? 'text' : 'password'} value={loginPass} onChange={(e) => setLoginPass(e.target.value)} autoComplete="current-password" className="h-12 rounded-xl bg-slate-50 border-none shadow-inner pr-12 text-base font-bold" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-gold transition-colors p-1">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <Button disabled={loginLoading} type="submit" className="w-full h-12 bg-navy hover:bg-gold text-white font-black rounded-xl transition-all shadow-xl text-[10px] uppercase tracking-[0.3em] border-none active:scale-95">
              {loginLoading ? <Loader2 className="animate-spin h-4 w-4" /> : <span className="flex items-center gap-2 justify-center">MASUK <ShieldCheck size={14} /></span>}
            </Button>
            <Button type="button" variant="ghost" onClick={() => router.push('/')} className="w-full h-10 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-navy">
              <ArrowLeft size={12} className="mr-2" /> Kembali ke Beranda
            </Button>
          </form>
        </div>
      </div>
    );
  }

  const NavContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className="flex flex-col h-full bg-navy text-white">
      <div className="p-5 border-b border-white/5 flex items-center gap-4">
        <div className="flex flex-col">
          <span className="font-headline font-bold text-[13px] uppercase tracking-[0.4em] text-gold leading-none">{settings.app_name} Portal</span>
          <span className="text-[9px] font-bold text-white/30 uppercase tracking-[0.3em] mt-2">{user.role}</span>
        </div>
      </div>
      <nav className="flex-1 min-h-0 px-2.5 mt-5 space-y-1.5 overflow-y-auto overflow-x-hidden no-scrollbar overscroll-contain pb-3">
        {navigation.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href + '/')) || (item.href === '/admin' && pathname === '/admin');
          const content = (
            <Link key={item.href} href={item.href} className={cn(
              "flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all group w-full",
              isActive ? "bg-gold text-white shadow-lg" : "text-white/40 hover:text-white hover:bg-white/5"
            )}>
              <item.icon size={18} className={cn(isActive ? "text-white" : "group-hover:text-gold transition-colors")} />
              <span className="text-[11px] font-black uppercase tracking-widest">{item.label}</span>
            </Link>
          );

          return isMobile ? (
            <SheetClose key={item.href} asChild>
              {content}
            </SheetClose>
          ) : (
            <div key={item.href}>{content}</div>
          );
        })}
      </nav>
      <div className="p-4 mt-auto border-t border-white/5">
        <Button variant="ghost" onClick={() => setIsLogoutConfirmOpen(true)} 
          className="w-full justify-start text-white/30 hover:text-white hover:bg-red-500/10 rounded-xl h-12 px-4">
          <LogOut size={18} className="mr-3.5" />
          <span className="text-[11px] font-black uppercase tracking-widest">Logout</span>
        </Button>
      </div>
    </div>
  );

  return (
    <div className="h-screen w-full bg-[#F8FAFC] flex overflow-hidden font-body selection:bg-gold/10">
      {/* SIDEBAR HARDENING: Show on Tablet (md) and Desktop (lg) */}
      <aside className={cn("hidden md:flex flex-col bg-navy transition-all duration-500 border-r border-white/5", isSidebarOpen ? "w-60" : "w-0 overflow-hidden")}>
        <NavContent />
      </aside>
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="h-14 sm:h-16 bg-white border-b border-slate-100 flex items-center justify-between px-4 sm:px-6 shrink-0 z-40">
          <div className="flex items-center gap-4">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Buka navigasi admin" className="md:hidden text-slate-400 h-10 w-10 rounded-xl border border-slate-100"><Menu size={20} /></Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 border-none w-64 bg-navy">
                <div className="sr-only"><SheetTitle>Navigasi</SheetTitle><SheetDescription>Admin Portal</SheetDescription></div>
                <NavContent isMobile />
              </SheetContent>
            </Sheet>
            <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="hidden md:flex text-slate-300 hover:text-navy h-9 w-9 transition-all">
              {isSidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
            </Button>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-[12px] font-black text-navy leading-none uppercase tracking-widest">{user.name}</p>
              <p className="text-[9px] text-gold uppercase font-bold tracking-[0.3em] mt-1.5">{user.role}</p>
            </div>
            <div className="h-10 w-10 rounded-full flex items-center justify-center bg-navy text-white font-bold text-[12px] uppercase shadow-sm border border-slate-100">{user.name.charAt(0)}</div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6 no-scrollbar bg-[#F8FAFC]">
          <div className="max-w-7xl mx-auto min-h-[70vh]">{children}</div>
        </main>
      </div>

      <AlertDialog open={isLogoutConfirmOpen} onOpenChange={(open) => { setIsLogoutConfirmOpen(open); if (!open) setLogoutArmed(false); }}>
        <AlertDialogContent className="rounded-2xl sm:rounded-[2.5rem] border-none p-6 sm:p-10 bg-white shadow-5xl text-center w-[92vw] max-w-sm">
           <div className="w-14 h-14 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <LogOut size={28} />
           </div>
           <AlertDialogTitle className="text-base font-headline text-navy uppercase font-bold">Keluar Sistem?</AlertDialogTitle>
           <AlertDialogDescription className="text-slate-400 text-[9px] sm:text-[10px] font-medium italic uppercase tracking-widest mt-1 mb-4">
              Sesi Anda akan berakhir secara aman.
           </AlertDialogDescription>

           {/* Info sesi sebelum logout */}
           <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 mb-5 text-left space-y-1.5">
             <p className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-400">Informasi Sesi</p>
             <div className="flex items-center justify-between text-[11px]">
               <span className="text-slate-400 font-bold uppercase tracking-widest">Pengguna</span>
               <span className="font-black text-navy truncate max-w-[60%]">{user.name}</span>
             </div>
             <div className="flex items-center justify-between text-[11px]">
               <span className="text-slate-400 font-bold uppercase tracking-widest">Peran</span>
               <span className="font-black text-navy uppercase">{user.role}</span>
             </div>
             <p className="text-[9px] text-slate-400 pt-1 border-t border-slate-100">Perangkat akan keluar dari portal dan memerlukan login ulang.</p>
           </div>

           {/* Dual confirm: langkah 1 konfirmasi niat, langkah 2 tombol merah aktif */}
           {!logoutArmed ? (
             <div className="flex gap-2">
               <AlertDialogCancel className="rounded-xl h-11 text-[10px] font-black bg-slate-100 text-navy border-none flex-1">BATAL</AlertDialogCancel>
               <button type="button" onClick={() => setLogoutArmed(true)} className="rounded-xl h-11 flex-1 text-[10px] font-black border border-slate-200 bg-white text-navy shadow-sm active:scale-95 transition-all">YA, LANJUTKAN</button>
             </div>
           ) : (
             <div className="flex gap-2">
               <AlertDialogCancel className="rounded-xl h-11 text-[10px] font-black bg-slate-100 text-navy border-none flex-1">BATAL</AlertDialogCancel>
               <AlertDialogAction onClick={handleLogout} className="gap-2 bg-red-500 text-white rounded-xl h-11 flex-1 text-[10px] font-black border-none shadow-lg active:scale-95 transition-all hover:bg-red-600 focus:ring-red-500/30">
                 <Loader2 size={14} className="animate-spin" /> KLIK LAGI: KELUAR
               </AlertDialogAction>
             </div>
           )}
           <p className="text-[8px] text-slate-300 uppercase tracking-widest mt-3">Konfirmasi ganda aktif — dua langkah untuk keluar.</p>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
