"use client";

import React, { useState, useEffect, useMemo } from 'react';
import {
  ImageIcon, Loader2, Users, Eye, CheckCircle2, ArrowRight,
  Settings, BookOpen, Terminal, Star, Pencil, ExternalLink, LayoutDashboard,
  Briefcase, MessageSquare, TrendingUp, Images, Quote, MoreHorizontal, Calendar
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { formatViews } from '@/lib/formatters';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useSiteSettings } from '@/hooks/use-site-settings';

/**
 * AdminDashboard v140.0 - ANALYTICS SUITE
 * Dasbor analitik lengkap & responsif: ringkasan, grafik karya & kategori,
 * konten terbaru, testimoni masuk, dan alat cepat. Aman terhadap data kosong.
 */

const PIE_COLORS = ['#B08D3E', '#0f172a', '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#94a3b8'];

function StatCard({ label, value, icon: Icon, color, chip, hint }: { label: string; value: string | number; icon: any; color: string; chip: string; hint?: string }) {
  return (
    <div className="bg-white rounded-[1.6rem] border border-slate-100 shadow-sm p-5 md:p-6 flex items-start justify-between gap-3 hover:shadow-md transition-shadow">
      <div className="min-w-0">
        <p className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.25em] text-slate-400">{label}</p>
        <p className={cn("text-xl md:text-3xl font-headline font-black tracking-tight mt-2 truncate", color)}>{value}</p>
        {hint && <p className="text-[8px] font-bold uppercase tracking-widest text-slate-300 mt-1 truncate">{hint}</p>}
      </div>
      <div className={cn("w-10 h-10 md:w-12 md:h-12 shrink-0 rounded-2xl flex items-center justify-center", chip)} aria-hidden="true">
        <Icon size={20} className={color} />
      </div>
    </div>
  );
}

function Panel({ title, subtitle, children, className }: { title: string; subtitle?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("bg-white rounded-[1.8rem] border border-slate-100 shadow-sm p-5 md:p-7 flex flex-col", className)}>
      <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-50 mb-5">
        <div>
          <h2 className="text-[11px] md:text-sm font-headline font-bold text-navy uppercase tracking-wide">{title}</h2>
          {subtitle && <p className="text-[8px] font-bold uppercase tracking-[0.25em] text-slate-300 mt-1">{subtitle}</p>}
        </div>
      </div>
      <div className="flex-1 min-h-0">{children}</div>
    </div>
  );
}

function EmptyState({ icon: Icon, text }: { icon: any; text: string }) {
  return (
    <div className="h-full min-h-[160px] flex flex-col items-center justify-center gap-3 text-center py-10">
      <Icon size={32} className="text-slate-100" />
      <p className="text-[9px] font-black uppercase tracking-widest text-slate-300">{text}</p>
    </div>
  );
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState('');
  const [statsData, setStatsData] = useState({ users: 0, portfolio: 0, views: 0, testimonials: 0, images: 0 });
  const [popularWorks, setPopularWorks] = useState<any[]>([]);
  const [categoryDist, setCategoryDist] = useState<{ name: string; value: number }[]>([]);
  const [recentPosts, setRecentPosts] = useState<any[]>([]);
  const [recentReviews, setRecentReviews] = useState<any[]>([]);
  const { settings } = useSiteSettings();

  useEffect(() => {
    try { setRole(localStorage.getItem('blu_user_role') || ''); } catch {}
    async function fetchDashboardData() {
      setLoading(true);
      try {
        const [portfolioRes, teamRes, testCountRes, testListRes] = await Promise.all([
          supabase.rpc('get_posts_complete'),
          supabase.rpc('get_team_members'),
          supabase.from('testimonials').select('id', { count: 'exact', head: true }).filter('deleted_at', 'is', null),
          supabase.from('testimonials').select('name, role, text, rating')
            .filter('deleted_at', 'is', null)
            .order('id', { ascending: false })
            .limit(4)
        ]);

        const posts = portfolioRes.data || [];
        const totalViews = posts.reduce((acc: number, curr: any) => acc + (curr.views || 0), 0);
        const totalImages = posts.reduce((acc: number, curr: any) => acc + ((curr.images || []).length || (curr.post_images || []).length), 0);

        setStatsData({
          users: teamRes.data?.length || 0,
          portfolio: posts.length,
          views: totalViews,
          testimonials: testCountRes.count || 0,
          images: totalImages
        });

        setPopularWorks(
          [...posts]
            .sort((a: any, b: any) => (b.views || 0) - (a.views || 0))
            .slice(0, 5)
            .map(p => ({ name: p.title?.substring(0, 10) || '?', views: p.views || 0, fullName: p.title }))
        );

        // Distribusi kategori dari relasi post_categories
        const catMap = new Map<string, number>();
        posts.forEach((p: any) => {
          (p.categories || []).forEach((c: any) => {
            if (!c?.name) return;
            catMap.set(c.name, (catMap.get(c.name) || 0) + 1);
          });
        });
        const dist = Array.from(catMap.entries())
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value);
        if (dist.length > 6) {
          const top = dist.slice(0, 5);
          const rest = dist.slice(5).reduce((s, d) => s + d.value, 0);
          top.push({ name: 'Lainnya', value: rest });
          setCategoryDist(top);
        } else {
          setCategoryDist(dist);
        }

        const sortedRecent = [...posts]
          .sort((a: any, b: any) => {
            const da = new Date(a.created_at || 0).getTime();
            const db = new Date(b.created_at || 0).getTime();
            return db - da || b.id - a.id;
          })
          .slice(0, 5);
        setRecentPosts(sortedRecent);

        setRecentReviews(testListRes.data || []);
      } catch (err) {
        console.error("Dashboard Load Error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboardData();
  }, []);

  const stats = [
    { label: 'Total Tayangan', value: formatViews(statsData.views), icon: Eye, color: 'text-gold', chip: 'bg-gold/10', hint: 'Seluruh arsip' },
    { label: 'Arsip Karya', value: statsData.portfolio, icon: ImageIcon, color: 'text-green-600', chip: 'bg-green-500/10', hint: `${statsData.images} media visual` },
    { label: 'Testimoni', value: statsData.testimonials, icon: CheckCircle2, color: 'text-blue-600', chip: 'bg-blue-500/10', hint: 'Ulasan klien' },
    { label: 'Tim Pengelola', value: statsData.users, icon: Users, color: 'text-purple-600', chip: 'bg-purple-500/10', hint: 'Akun aktif' },
  ];

  const quickTools = [
    { label: 'Kelola Karya', desc: 'Terbitkan & sunting', href: '/admin/portfolio', icon: ImageIcon, color: 'text-gold' },
    { label: 'Katalog Layanan', desc: 'Kategori & tema', href: '/admin/services', icon: Briefcase, color: 'text-blue-600' },
    { label: 'Testimoni', desc: 'Token & ulasan', href: '/admin/testimonials', icon: MessageSquare, color: 'text-green-600' },
    { label: 'Event', desc: 'Promo & boost', href: '/admin/events', icon: Calendar, color: 'text-amber-500' },
    ...(role === 'admin' || role === 'developer' ? [{ label: 'Pengaturan', desc: 'Identitas situs', href: '/admin/settings', icon: Settings, color: 'text-slate-500' }] : []),
    ...(role === 'admin' || role === 'developer' ? [{ label: 'Kelola Tim', desc: 'Akses personel', href: '/admin/users', icon: Users, color: 'text-purple-600' }] : []),
    { label: 'Panduan', desc: 'Pusat bantuan', href: '/admin/panduan', icon: BookOpen, color: 'text-amber-600' },
    ...(role === 'developer' ? [{ label: 'Developer', desc: 'Diagnostik sistem', href: '/admin/developer', icon: Terminal, color: 'text-purple-500' }] : []),
  ];

  const maxBar = Math.max(1, ...popularWorks.map(w => w.views || 0));

  return (
    <div className="space-y-5 md:space-y-6 animate-fade-up text-left pb-20 w-full max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-headline font-bold text-navy tracking-tighter uppercase">Ringkasan Utama</h1>
          <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">Analitik performa {settings.app_name}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:items-center gap-2.5 w-full lg:w-auto">
          {role === 'developer' && (
            <Button asChild variant="outline" className="rounded-xl h-11 px-4 font-bold text-[10px] uppercase tracking-widest border-purple-100 text-purple-600 hover:bg-purple-50 transition-all w-full lg:w-auto">
              <Link href="/admin/developer" className="flex items-center justify-center gap-2"><Terminal size={14} /> Pengembang</Link>
            </Button>
          )}
          <Button variant="outline" asChild className="rounded-xl h-11 px-5 font-bold text-[10px] uppercase tracking-widest border-slate-200 hover:bg-slate-50 transition-all w-full lg:w-auto">
            <Link href="/" target="_blank" className="flex items-center justify-center">Lihat Situs</Link>
          </Button>
          <Button asChild className="bg-navy hover:bg-gold text-white rounded-xl h-11 px-6 text-[10px] font-bold uppercase tracking-widest shadow-lg border-none active:scale-95 transition-all w-full sm:col-span-2 lg:col-span-1 lg:w-auto">
            <Link href="/admin/portfolio" className="flex items-center justify-center">Terbitkan Karya</Link>
          </Button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {loading
          ? Array(4).fill(0).map((_, i) => (
              <div key={i} className="bg-white rounded-[1.6rem] border border-slate-100 p-5 md:p-6 animate-pulse">
                <div className="h-2.5 w-16 bg-slate-100 rounded-full" />
                <div className="h-6 md:h-8 w-20 bg-slate-100 rounded-lg mt-3" />
              </div>
            ))
          : stats.map(s => <StatCard key={s.label} {...s} />)
        }
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 md:gap-5">
        <Panel title="Karya Terpopuler" subtitle="5 tertinggi berdasar tayangan" className="xl:col-span-3">
          {loading ? (
            <div className="h-[240px] flex items-center justify-center"><Loader2 className="animate-spin text-gold" size={22} /></div>
          ) : popularWorks.length === 0 ? (
            <EmptyState icon={TrendingUp} text="Belum ada data tayangan" />
          ) : (
            <>
              <div className="h-[220px] md:h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={popularWorks} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }} axisLine={false} tickLine={false} interval={0} />
                    <YAxis tick={{ fontSize: 9, fill: '#cbd5e1' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      cursor={{ fill: 'rgba(176,141,62,0.06)' }}
                      contentStyle={{ borderRadius: 16, border: 'none', boxShadow: '0 10px 30px rgba(15,23,42,.12)', fontSize: 11 }}
                      formatter={(v: any) => [`${formatViews(Number(v))} tayangan`, '']}
                      labelFormatter={(label: any, payload: any) => payload?.[0]?.payload?.fullName || label}
                    />
                    <Bar dataKey="views" radius={[8, 8, 0, 0]} maxBarSize={46}>
                      {popularWorks.map((_, i) => (
                        <Cell key={i} fill={i === 0 ? '#B08D3E' : i === 1 ? '#0f172a' : '#cbd5e1'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 space-y-1.5">
                {popularWorks.slice(0, 3).map((w, i) => (
                  <div key={i} className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-wider">
                    <span className={cn("w-4 h-4 rounded-md flex items-center justify-center text-[8px] text-white shrink-0", i === 0 ? "bg-gold" : i === 1 ? "bg-navy" : "bg-slate-300")}>{i + 1}</span>
                    <span className="truncate text-navy/70 flex-1 min-w-0">{w.fullName}</span>
                    <span className="text-slate-400 shrink-0">{formatViews(w.views)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </Panel>

        <Panel title="Distribusi Kategori" subtitle="Sebaran karya per kategori" className="xl:col-span-2">
          {loading ? (
            <div className="h-[240px] flex items-center justify-center"><Loader2 className="animate-spin text-gold" size={22} /></div>
          ) : categoryDist.length === 0 ? (
            <EmptyState icon={Images} text="Belum ada kategori terpakai" />
          ) : (
            <>
              <div className="h-[180px] md:h-[210px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryDist}
                      dataKey="value"
                      nameKey="name"
                      innerRadius="58%"
                      outerRadius="88%"
                      paddingAngle={3}
                      strokeWidth={0}
                    >
                      {categoryDist.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ borderRadius: 16, border: 'none', boxShadow: '0 10px 30px rgba(15,23,42,.12)', fontSize: 11 }}
                      formatter={(v: any, n: any) => [`${v} karya`, n]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl md:text-3xl font-headline font-black text-navy">{statsData.portfolio}</span>
                  <span className="text-[7px] font-black uppercase tracking-[0.3em] text-slate-400">Total Karya</span>
                </div>
              </div>
              <div className="mt-3 space-y-1.5 max-h-[110px] overflow-y-auto no-scrollbar">
                {categoryDist.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-wider">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="truncate text-navy/70 flex-1 min-w-0">{d.name}</span>
                    <span className="text-slate-400 shrink-0">{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </Panel>
      </div>

      {/* Lists */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-5">
        <Panel title="Konten Terbaru" subtitle="5 karya tersimpan terakhir">
          {loading ? (
            <div className="space-y-3">
              {Array(4).fill(0).map((_, i) => <div key={i} className="h-14 bg-slate-50 rounded-2xl animate-pulse" />)}
            </div>
          ) : recentPosts.length === 0 ? (
            <EmptyState icon={ImageIcon} text="Arsip masih kosong" />
          ) : (
            <div className="space-y-2.5">
              {recentPosts.map(p => {
                const thumb = p.images?.[0]?.url_images || p.post_images?.[0]?.url_images;
                return (
                  <div key={p.id} className="flex items-center gap-3 p-2 rounded-2xl hover:bg-slate-50 transition-colors">
                    <div className="w-12 h-10 md:w-14 md:h-11 relative rounded-xl overflow-hidden bg-slate-100 border border-slate-100 shrink-0">
                      {thumb ? (
                        <img src={thumb} alt="" loading="lazy" decoding="async" className="absolute inset-0 w-full h-full object-cover" />
                      ) : (
                        <ImageIcon size={14} className="absolute inset-0 m-auto text-slate-300" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] md:text-[11px] font-bold text-navy uppercase truncate">{p.title || '-'}</p>
                      <p className="text-[8px] font-bold uppercase tracking-widest text-slate-400 mt-0.5 flex items-center gap-2">
                        <Eye size={9} /> {formatViews(p.views)} · #{p.id}
                      </p>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <DropdownMenu modal={false}>
                        <DropdownMenuTrigger asChild>
                          <button className="h-8 w-8 rounded-lg text-slate-400 hover:text-navy hover:bg-slate-100 flex items-center justify-center transition-colors">
                            <MoreHorizontal size={14} />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40 rounded-2xl border-none shadow-5xl bg-white p-1.5">
                          <DropdownMenuItem asChild className="rounded-xl text-[10px] font-bold uppercase tracking-wider text-navy gap-2 py-2.5 cursor-pointer">
                            <Link href={`/admin/portfolio?edit=${p.id}`}><Pencil size={13} className="text-blue-500" /> Sunting</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild className="rounded-xl text-[10px] font-bold uppercase tracking-wider text-navy gap-2 py-2.5 cursor-pointer">
                            <Link href={`/portfolio?id=${p.id}`} target="_blank"><ExternalLink size={13} className="text-gold" /> Lihat Publik</Link>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })}
              <Button asChild variant="ghost" className="w-full h-10 rounded-xl text-[9px] font-black uppercase tracking-[0.3em] text-navy/60 hover:text-navy hover:bg-slate-50 mt-1">
                <Link href="/admin/portfolio" className="flex items-center justify-center gap-2">Kelola Semua Karya <ArrowRight size={12} /></Link>
              </Button>
            </div>
          )}
        </Panel>

        <Panel title="Testimoni Masuk" subtitle="Suara klien terakhir">
          {loading ? (
            <div className="space-y-3">
              {Array(3).fill(0).map((_, i) => <div key={i} className="h-16 bg-slate-50 rounded-2xl animate-pulse" />)}
            </div>
          ) : recentReviews.length === 0 ? (
            <EmptyState icon={Quote} text="Belum ada ulasan masuk" />
          ) : (
            <div className="space-y-2.5">
              {recentReviews.map((r: any, i: number) => (
                <div key={i} className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100">
                  <div className="flex items-center gap-1 mb-1.5">
                    {[...Array(Math.min(5, Math.max(0, r.rating || 0)))].map((_, s) => (
                      <Star key={s} size={10} className="fill-gold text-gold" />
                    ))}
                  </div>
                  <p className="text-[10px] md:text-[11px] text-slate-500 italic leading-relaxed line-clamp-2">&ldquo;{r.text || '-'}&rdquo;</p>
                  <p className="text-[8px] font-black uppercase tracking-widest text-navy/70 mt-1.5 truncate">
                    {r.name || 'Anonim'}{r.role ? <span className="text-slate-300"> · {r.role}</span> : null}
                  </p>
                </div>
              ))}
              <Button asChild variant="ghost" className="w-full h-10 rounded-xl text-[9px] font-black uppercase tracking-[0.3em] text-navy/60 hover:text-navy hover:bg-slate-50 mt-1">
                <Link href="/admin/testimonials" className="flex items-center justify-center gap-2">Buat Token Ulasan <ArrowRight size={12} /></Link>
              </Button>
            </div>
          )}
        </Panel>
      </div>

      {/* Quick Tools */}
      <Panel title="Alat Cepat" subtitle="Akses langsung modul manajemen">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {quickTools.map(t => (
            <Link
              key={t.href}
              href={t.href}
              className="group flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100"
            >
              <t.icon size={16} className={cn("shrink-0 group-hover:scale-110 transition-transform", t.color)} />
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest text-navy leading-tight truncate">{t.label}</p>
                <p className="text-[8px] font-bold uppercase tracking-wider text-slate-400 mt-0.5 truncate">{t.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </Panel>

      {/* Footer note */}
      <div className="flex items-center justify-center gap-2 pt-2 opacity-40">
        <LayoutDashboard size={12} className="text-navy" />
        <span className="text-[8px] font-black uppercase tracking-[0.35em] text-navy">{settings.app_name} Portal · Dasbor</span>
      </div>
    </div>
  );
}
