
'use client';

import React, { useState, useEffect } from 'react';
import { Terminal, Database, Download, ShieldCheck, Loader2, RefreshCw, Zap, Activity, Trash2, HardDrive } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cms } from '@/lib/cms-client';
import { useToast } from "@/hooks/use-toast";
import { auditStorage, purgeOrphanFiles, ORPHAN_GRACE_DAYS, type StorageAuditReport } from '@/lib/storage-sweep';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const formatBytes = (bytes: number): string => {
  if (!bytes || bytes <= 0) return '0 KB';
  const units = ['B', 'KB', 'MB', 'GB'];
  let val = bytes;
  let i = 0;
  while (val >= 1024 && i < units.length - 1) { val /= 1024; i++; }
  return `${val.toFixed(val >= 100 || i === 0 ? 0 : 1)} ${units[i]}`;
};

export default function DeveloperPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [maintenanceLoading, setMaintenanceLoading] = useState(false);
  const [cacheLoading, setCacheLoading] = useState(false);
  const [role, setRole] = useState('');
  const [mounted, setMounted] = useState(false);
  const [systemStats, setSystemStats] = useState({ users: 0 });
  const [audit, setAudit] = useState<StorageAuditReport | null>(null);
  const [auditLoading, setAuditLoading] = useState(false);
  const [sweepLoading, setSweepLoading] = useState(false);
  const [sweepConfirmOpen, setSweepConfirmOpen] = useState(false);
  const [maintenanceConfirmOpen, setMaintenanceConfirmOpen] = useState(false);
  const [sweepArmed, setSweepArmed] = useState(false);
  const [maintenanceArmed, setMaintenanceArmed] = useState(false);

  useEffect(() => {
    setRole(localStorage.getItem('blu_user_role') || '');
    setMounted(true);
    fetchSystemMeta();
  }, []);

  const fetchSystemMeta = async () => {
    try {
      const { data: users } = await cms.rpc('get_team_members');
      setSystemStats({ users: users?.length || 0 });
    } catch (e) {}
  };

  const handleBackupSQL = async () => {
    setLoading(true);
    try {
      const tables = [
        'categories', 'sub_categories', 'themes', 'posts', 
        'testimonials', 'site_settings', 'testimonial_tokens', 'events'
      ];
      
      let sqlContent = `-- =============================================================\n`;
      sqlContent += `-- BLU DECOR PADANG - ARCHITECTURAL DEEP BLUEPRINT\n`;
      sqlContent += `-- Generated: ${new Date().toLocaleString()}\n`;
      sqlContent += `-- =============================================================\n\n`;
      sqlContent += `BEGIN;\n\n`;

      for (const table of tables) {
        const { data, error } = await cms.from(table).select('*');
        if (error) continue;

        if (data && data.length > 0) {
          sqlContent += `-- Table: ${table}\n`;
          const columns = Object.keys(data[0]);
          
          for (const row of data) {
            const values = columns.map(col => {
              const val = row[col];
              if (val === null) return 'NULL';
              if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
              if (typeof val === 'number') return val;
              if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
              return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
            });

            sqlContent += `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${values.join(', ')}) ON CONFLICT DO NOTHING;\n`;
          }
          
          if (columns.includes('id')) {
            sqlContent += `\nSELECT setval(pg_get_serial_sequence('${table}', 'id'), COALESCE(MAX(id), 1));\n`;
          }
          sqlContent += `\n`;
        }
      }

      sqlContent += `COMMIT;\n`;

      const blob = new Blob([sqlContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.body.appendChild(document.createElement('a'));
      link.href = url;
      link.download = `blu_backup_${new Date().toISOString().split('T')[0]}.sql`;
      link.click();
      document.body.removeChild(link);
      
      toast({ title: "Ekspor Berhasil", description: "Arsip SQL telah diunduh." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Gagal Backup", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const runMaintenance = async () => {
    setMaintenanceLoading(true);
    try {
      const res = await fetch('/api/maintenance', { method: 'POST' });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(text || `HTTP ${res.status}`);
      }
      const data = await res.json();
      if (data.success) {
        toast({ title: "Maintenance Berhasil", description: "Protokol pembersihan telah dieksekusi." });
      } else {
        throw new Error(data.message);
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Maintenance Gagal", description: err.message });
    } finally {
      setMaintenanceLoading(false);
    }
  };

  const purgeCache = async () => {
    setCacheLoading(true);
    try {
      const res = await fetch('/api/revalidate', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Cache Dihapus", description: "Seluruh halaman telah direvalidasi." });
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Gagal Purge", description: err.message });
    } finally {
      setCacheLoading(false);
    }
  };

  // ---- STORAGE AUDIT (baca-saja, tidak mengubah apa pun) ----
  const runStorageAudit = async () => {
    setAuditLoading(true);
    try {
      const report = await auditStorage();
      setAudit(report);
      toast({
        title: "Audit Selesai",
        description: `${report.totalFiles} aset diperiksa — ${report.orphanCount} yatim terdeteksi.`,
      });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Audit Gagal", description: err.message });
    } finally {
      setAuditLoading(false);
    }
  };

  const runStorageSweep = async () => {
    setSweepConfirmOpen(false);
    setSweepLoading(true);
    try {
      const { removed, failed, report } = await purgeOrphanFiles();
      setAudit(report);
      if (removed.length === 0 && failed.length > 0) {
        toast({
          variant: "destructive",
          title: "Akses Hapus Ditolak",
          description: "Gagal menghapus media MongoDB. Periksa koneksi database, lalu coba lagi.",
        });
      } else if (removed.length === 0) {
        toast({ title: "Tidak Ada yang Dihapus", description: `Belum ada file yatim berumur >= ${ORPHAN_GRACE_DAYS} hari.` });
      } else {
        toast({
          title: "Pembersihan Selesai",
          description: `${removed.length} file yatim dihapus${failed.length ? `, ${failed.length} gagal` : ''}.`,
        });
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Sweep Gagal", description: err.message });
    } finally {
      setSweepLoading(false);
    }
  };

  if (!mounted) return (
    <div className="py-20 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-gold" /></div>
  );

  if (role !== 'developer') return (
    <div className="flex flex-col items-center justify-center py-32 text-center space-y-6">
      <div className="w-20 h-20 bg-red-50 rounded-[2.5rem] flex items-center justify-center text-red-500 shadow-inner">
        <ShieldCheck size={40} />
      </div>
      <h1 className="text-xl font-headline font-bold text-navy uppercase tracking-widest">Akses Root Terkunci</h1>
      <Button variant="outline" onClick={() => window.location.href = '/admin'}>KEMBALI KE DASBOR</Button>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-up pb-20 text-left">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 text-gold text-[10px] font-black uppercase tracking-[0.4em]">
             <Terminal size={12} /> System Command Center
          </div>
          <h1 className="text-2xl font-headline font-bold text-navy tracking-tight uppercase">Developer Tools</h1>
        </div>
        <div className="px-4 py-2 rounded-xl bg-navy text-white flex items-center gap-3 shadow-lg">
           <Zap size={14} className="text-gold animate-pulse" />
           <span className="text-[10px] font-black uppercase tracking-widest">Root Active</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden group">
              <CardHeader className="p-8 border-b border-slate-50 bg-slate-50/30">
                <div className="flex items-center gap-3">
                  <Database className="text-gold" size={20} />
                  <CardTitle className="text-[12px] font-black text-navy uppercase tracking-widest">Deep Blueprint SQL</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-8 space-y-5">
                <p className="text-[11px] text-slate-500 italic leading-relaxed">Ekspor seluruh skema dan data ke SQL dengan sinkronisasi ID otomatis.</p>
                <Button onClick={handleBackupSQL} disabled={loading} className="w-full bg-navy hover:bg-gold text-white rounded-[1.2rem] h-12 text-[10px] font-black uppercase tracking-widest shadow-xl border-none">
                  {loading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Download size={14} className="mr-2" />} JALANKAN EKSPOR (.SQL)
                </Button>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden group">
              <CardHeader className="p-8 border-b border-slate-50 bg-slate-50/30">
                <div className="flex items-center gap-3">
                  <RefreshCw className="text-gold" size={20} />
                  <CardTitle className="text-[12px] font-black text-navy uppercase tracking-widest">Cache Control</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-8 space-y-5">
                <p className="text-[11px] text-slate-500 italic leading-relaxed">Memicu revalidasi seluruh halaman untuk menghapus data lama dari cache server.</p>
                <Button onClick={purgeCache} disabled={cacheLoading} variant="outline" className="w-full rounded-[1.2rem] h-12 text-[10px] font-black uppercase tracking-widest transition-all hover:bg-blue-50 hover:text-blue-600 border-slate-100">
                  {cacheLoading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <RefreshCw size={14} className="mr-2" />} PURGE SYSTEM CACHE
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden">
            <CardHeader className="p-8 border-b border-slate-50 bg-slate-50/30">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <HardDrive className="text-gold" size={20} />
                  <CardTitle className="text-[12px] font-black text-navy uppercase tracking-widest">Audit Storage Media</CardTitle>
                </div>
                <Button onClick={runStorageAudit} disabled={auditLoading} variant="outline" size="sm" className="rounded-xl h-9 px-4 text-[9px] font-black uppercase tracking-widest border-slate-100">
                  {auditLoading ? <Loader2 className="animate-spin h-3.5 w-3.5 mr-2" /> : <RefreshCw size={12} className="mr-2" />} Pindai Aset
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              {!audit && !auditLoading && (
                <p className="text-[11px] text-slate-500 italic leading-relaxed">
                  Pindai membandingkan seluruh file di bucket <span className="font-mono not-italic">blu_media/portfolio</span> dengan referensi tabel <span className="font-mono not-italic">post_images</span>. Operasi baca-saja — tidak ada file yang diubah.
                </p>
              )}
              {audit && (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <StatTile label="Total Aset" value={`${audit.totalFiles}`} sub={formatBytes(audit.totalBytes)} tone="navy" />
                    <StatTile label="Terpakai DB" value={`${audit.referencedCount}`} sub={formatBytes(audit.referencedBytes)} tone="green" />
                    <StatTile label="Referensi Rusak" value={`${audit.brokenReferences}`} sub={audit.brokenReferences === 0 ? 'database sehat' : 'perlu diperiksa'} tone={audit.brokenReferences === 0 ? 'green' : 'red'} />
                    <StatTile label="Total Yatim" value={`${audit.orphanCount}`} sub={formatBytes(audit.orphanBytes)} tone="amber" />
                    <StatTile label={`Menunggu (<${ORPHAN_GRACE_DAYS} hari)`} value={`${audit.waitingCount}`} sub={formatBytes(audit.waitingBytes)} tone="slate" />
                    <StatTile label={`Siap Hapus (≥${ORPHAN_GRACE_DAYS} hari)`} value={`${audit.purgeableCount}`} sub={formatBytes(audit.purgeableBytes)} tone={audit.purgeableCount > 0 ? 'red' : 'green'} />
                  </div>

                  {audit.sampleOrphans.length > 0 && (
                    <div className="bg-slate-900 rounded-2xl p-5 font-mono text-[10px] text-slate-400 space-y-1 max-h-40 overflow-y-auto">
                      <p className="text-green-400">// contoh file yatim:</p>
                      {audit.sampleOrphans.map(f => (
                        <p key={f.path} className="truncate">{f.path} <span className="text-slate-600">({formatBytes(f.size)})</span></p>
                      ))}
                      {audit.orphanCount > audit.sampleOrphans.length && (
                        <p className="text-slate-600">…dan {audit.orphanCount - audit.sampleOrphans.length} lainnya</p>
                      )}
                    </div>
                  )}

                  <AlertDialog open={sweepConfirmOpen} onOpenChange={(open) => { setSweepConfirmOpen(open); if (!open) setSweepArmed(false); }}>
                    <AlertDialogContent className="rounded-[2rem] border-none p-8 bg-white w-[92vw] max-w-md">
                      <AlertDialogTitle className="text-sm font-headline text-navy uppercase font-bold">Hapus File Yatim?</AlertDialogTitle>
                      <AlertDialogDescription className="text-slate-500 text-[11px] leading-relaxed mt-2">
                        Hanya file tanpa referensi database berumur minimal {ORPHAN_GRACE_DAYS} hari yang akan dihapus
                        ({audit.purgeableCount} file, {formatBytes(audit.purgeableBytes)}). File yang masih dirujuk konten TIDAK akan tersentuh.
                      </AlertDialogDescription>
                      <div className="flex gap-2 mt-6">
                        <AlertDialogCancel className="rounded-xl h-11 text-[10px] font-black bg-slate-100 text-navy border-none flex-1">BATAL</AlertDialogCancel>
                        {!sweepArmed ? (
                          <button type="button" onClick={() => setSweepArmed(true)} className="rounded-xl h-11 flex-1 text-[10px] font-black border border-slate-200 bg-white text-navy shadow-sm active:scale-95 transition-all">YA, LANJUTKAN</button>
                        ) : (
                        <AlertDialogAction onClick={runStorageSweep} disabled={sweepLoading || audit.purgeableCount === 0} className="bg-red-600 text-white rounded-xl h-11 flex-1 text-[10px] font-black border-none shadow-lg active:scale-95 transition-all">
                          YA, BERSIHKAN
                        </AlertDialogAction>
                        )}
                      </div>
                    </AlertDialogContent>
                  </AlertDialog>

                  <AlertDialog open={maintenanceConfirmOpen} onOpenChange={(open) => { setMaintenanceConfirmOpen(open); if (!open) setMaintenanceArmed(false); }}>
                    <AlertDialogContent className="rounded-[2rem] border-none p-8 bg-white w-[92vw] max-w-md">
                      <div className="w-14 h-14 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4"><Trash2 size={26} /></div>
                      <AlertDialogTitle className="text-sm font-headline text-navy uppercase font-bold text-center">Hapus Permanen?</AlertDialogTitle>
                      <AlertDialogDescription className="text-slate-500 text-[11px] leading-relaxed mt-2 text-center">
                        Seluruh data yang sudah soft-delete melewati masa retensi 7 hari akan dihapus permanen dari server. Tindakan ini tidak dapat dibatalkan.
                      </AlertDialogDescription>
                      <div className="flex gap-2 mt-6">
                        <AlertDialogCancel className="rounded-xl h-11 text-[10px] font-black bg-slate-100 text-navy border-none flex-1">BATAL</AlertDialogCancel>
                        {!maintenanceArmed ? (
                          <button type="button" onClick={() => setMaintenanceArmed(true)} className="rounded-xl h-11 flex-1 text-[10px] font-black border border-slate-200 bg-white text-navy shadow-sm active:scale-95 transition-all">YA, LANJUTKAN</button>
                        ) : (
                        <AlertDialogAction onClick={runMaintenance} disabled={maintenanceLoading} className="bg-red-600 text-white rounded-xl h-11 flex-1 text-[10px] font-black border-none shadow-lg active:scale-95 transition-all disabled:opacity-50">
                          {maintenanceLoading ? <Loader2 className="animate-spin h-4 w-4 mx-auto" /> : "YA, HAPUS PERMANEN"}
                        </AlertDialogAction>
                        )}
                      </div>
                    </AlertDialogContent>
                  </AlertDialog>

                  <Button onClick={() => setSweepConfirmOpen(true)} disabled={sweepLoading || audit.purgeableCount === 0} className="w-full bg-red-600 hover:bg-red-700 text-white rounded-[1.2rem] h-12 text-[10px] font-black uppercase tracking-widest shadow-xl border-none disabled:opacity-40">
                    {sweepLoading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Trash2 size={14} className="mr-2" />}
                    {audit.purgeableCount === 0 ? 'TIDAK ADA FILE YANG SIAP DIHAPUS' : `BERSIHKAN ${audit.purgeableCount} FILE YATIM`}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden">
             <CardHeader className="p-8 border-b border-slate-50">
                <div className="flex items-center gap-3">
                   <Activity className="text-gold" size={18} />
                   <CardTitle className="text-[12px] font-black text-navy uppercase tracking-widest">System Logs</CardTitle>
                </div>
             </CardHeader>
             <CardContent className="p-0">
                <div className="bg-slate-900 p-8 font-mono text-[11px] text-green-400 space-y-2 min-h-[200px]">
                   <p className="opacity-50">[SYSTEM] Architectural Kernel Active...</p>
                   <p>[CACHE] Invalidation Protocol Ready</p>
                   <p>[DB] Status: Connected to MongoDB</p>
                   <p className="text-gold">[CMD] Monitoring blueprint stream...</p>
                   <p className="animate-pulse">_</p>
                </div>
             </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="border-none shadow-sm rounded-[2rem] bg-navy text-white p-8 space-y-6 relative overflow-hidden">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-gold shadow-inner border border-white/5"><Zap size={24} /></div>
              <div>
                <h3 className="text-[13px] font-black uppercase tracking-widest text-white">Otoritas Root</h3>
                <p className="text-[10px] text-white/40 uppercase font-medium">Developer Privilege</p>
              </div>
            </div>
            <ul className="space-y-3">
               <li className="text-[11px] text-white/60 flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-gold" /> Revalidation Path: '/'</li>
               <li className="text-[11px] text-white/60 flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-gold" /> Hard-Delete Protocol Active</li>
            </ul>
          </Card>
          
           <Card className="border-none shadow-sm rounded-[2rem] bg-red-50 p-8 space-y-5">
              <div className="flex items-center gap-3 text-red-600">
                 <Trash2 size={20} />
                 <CardTitle className="text-[12px] font-black uppercase tracking-widest">Danger Zone</CardTitle>
              </div>
              <p className="text-[10px] text-red-500 leading-relaxed italic">Hapus permanen data soft-delete yang sudah melewati masa retensi 7 hari secara paksa.</p>
              <Button onClick={() => setMaintenanceConfirmOpen(true)} disabled={maintenanceLoading} className="w-full bg-red-600 hover:bg-red-700 text-white rounded-xl h-12 text-[10px] font-black uppercase tracking-widest border-none">
                 {maintenanceLoading ? <Loader2 className="animate-spin h-3 w-3 mr-2" /> : "TRIGGER HARD-DELETE"}
              </Button>
           </Card>
        </div>
      </div>
    </div>
  );
}

const statTone: Record<string, string> = {
  navy: 'text-navy',
  green: 'text-emerald-600',
  red: 'text-red-500',
  amber: 'text-amber-500',
  slate: 'text-slate-400',
};

function StatTile({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: keyof typeof statTone }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50/40 p-4 space-y-1">
      <p className="text-[8px] font-black uppercase tracking-[0.25em] text-slate-400 leading-tight">{label}</p>
      <p className={`text-xl font-headline font-bold leading-none ${statTone[tone || 'navy']}`}>{value}</p>
      {sub && <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{sub}</p>}
    </div>
  );
}
