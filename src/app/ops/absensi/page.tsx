'use client';

import React, { useMemo, useState, useCallback } from 'react';
import {
  Clock4, LogOut, LogIn, ShieldCheck, AlertTriangle,
  BadgeCheck, CalendarCheck, X, UserX, RotateCcw,
  LayoutDashboard, BarChart3, FileEdit, Shield, ListChecks,
} from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useOps, userFirst } from '@/lib/ops/store';
import {
  ATTENDANCE_STATUS_LABEL, ATTENDANCE_STATUS_COLOR,
  type Attendance, type AttendanceCorrection,
} from '@/lib/ops/types';
import { monthlyWorkHours, formatDuration, minutesBetween } from '@/lib/ops/reports';
import { opsDevice } from '@/lib/ops/auth';
import { cn } from '@/lib/utils';
import { PageHeader, SectionCard, StatusBadge, Pagination } from '../ops-ui';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

const AUDIT_LABEL: Record<string, { label: string; color: string }> = {
  'absensi.masuk': { label: 'Absen Masuk', color: 'bg-emerald-100 text-emerald-700' },
  'absensi.pulang': { label: 'Absen Pulang', color: 'bg-sky-100 text-sky-700' },
  'absensi.tidak-bekerja': { label: 'Tidak Bekerja', color: 'bg-slate-100 text-slate-600' },
  'absensi.hapus': { label: 'Hapus Session', color: 'bg-red-100 text-red-700' },
  'koreksi.ajukan': { label: 'Koreksi Diajukan', color: 'bg-amber-100 text-amber-700' },
  'koreksi.setujui': { label: 'Koreksi Disetujui', color: 'bg-emerald-100 text-emerald-700' },
  'koreksi.tolak': { label: 'Koreksi Ditolak', color: 'bg-red-100 text-red-700' },
};

const SECTION_TABS = [
  { value: 'status', label: 'Status', icon: LayoutDashboard },
  { value: 'rekap', label: 'Rekap', icon: BarChart3 },
  { value: 'koreksi', label: 'Koreksi', icon: FileEdit },
  { value: 'audit', label: 'Audit', icon: Shield },
] as const;

type SectionTab = typeof SECTION_TABS[number]['value'];
const VALID_TABS: string[] = ['status', 'rekap', 'koreksi', 'audit'];

export default function AbsensiPage() {
  const {
    state, currentUser, decors, tasks, attendanceForDate, clockIn, clockOut,
    declareNoWork, deleteSession, requestCorrection, approveCorrection, rejectCorrection,
    corrections, audit,
  } = useOps();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();

  const rawTab = searchParams.get('tab');
  const requestedTab: SectionTab = (rawTab && VALID_TABS.includes(rawTab)) ? (rawTab as SectionTab) : 'status';

  const setSectionTab = useCallback((newTab: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', newTab);
    router.push(`/ops/absensi?${params.toString()}`, { scroll: false });
  }, [searchParams, router]);

  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const isToday = date === new Date().toISOString().slice(0, 10);
  const month = date.slice(0, 7);

  const [showNoWork, setShowNoWork] = useState(false);
  const [auditPage, setAuditPage] = useState(1);
  const AUDIT_PAGE_SIZE = 10;

  // Multi-session: array of attendance for this date
  const dayRecords = useMemo(() => attendanceForDate(date), [attendanceForDate, date]);

  // Freelancers list
  const freelancers = useMemo(() => state.users.filter((u) => u.active && u.role === 'freelancer'), [state.users]);

  // Decors that currentUser has tasks for (sorted by date, then name)
  const myDecorTasks = useMemo(() => {
    const map = new Map<string, { decorId: string; decorName: string; total: number; done: number }>();
    for (const t of tasks) {
      if (t.assigneeId !== currentUser.id) continue;
      const existing = map.get(t.decorId);
      const decorName = decors.find((d) => d.id === t.decorId)?.name || '?';
      if (existing) {
        existing.total++;
        if (t.status === 'selesai') existing.done++;
      } else {
        map.set(t.decorId, { decorId: t.decorId, decorName, total: 1, done: t.status === 'selesai' ? 1 : 0 });
      }
    }
    return Array.from(map.values()).sort((a, b) => {
      const dA = decors.find((d) => d.id === a.decorId);
      const dB = decors.find((d) => d.id === b.decorId);
      return (dA?.date || '').localeCompare(dB?.date || '');
    });
  }, [tasks, currentUser.id, decors]);

  // Owner: all freelancers with tasks
  const allDecorWithTasks = useMemo(() => {
    const map = new Map<string, { decorId: string; decorName: string; assignees: Set<string> }>();
    for (const t of tasks) {
      if (!t.assigneeId) continue;
      const existing = map.get(t.decorId);
      const decorName = decors.find((d) => d.id === t.decorId)?.name || '?';
      if (existing) {
        existing.assignees.add(t.assigneeId);
      } else {
        map.set(t.decorId, { decorId: t.decorId, decorName, assignees: new Set([t.assigneeId]) });
      }
    }
    return Array.from(map.values());
  }, [tasks, decors]);

  // My records today (filtered from dayRecords)
  const myRecords = useMemo(() => dayRecords.filter((r) => r.userId === currentUser.id), [dayRecords, currentUser.id]);

  // Summary for owner
  const summary = useMemo(() => {
    let hadir = 0, selesai = 0, tidakBekerja = 0, tidakMengisi = 0;
    for (const u of freelancers) {
      const userRecords = dayRecords.filter((r) => r.userId === u.id);
      if (userRecords.length === 0) {
        tidakMengisi++;
        continue;
      }
      for (const r of userRecords) {
        if (r.status === 'hadir') hadir++;
        else if (r.status === 'selesai') selesai++;
        else if (r.status === 'tidak-bekerja') tidakBekerja++;
      }
    }
    return { hadir, selesai, tidakBekerja, tidakMengisi, total: freelancers.length };
  }, [dayRecords, freelancers]);

  // Flags
  const flags = useMemo(() => {
    const out: { userId: string; text: string; sub: string }[] = [];
    const monthCorr = corrections.filter((c) => c.date.slice(0, 7) === month);
    for (const u of freelancers) {
      const corrCount = monthCorr.filter((c) => c.userId === u.id).length;
      if (corrCount >= 3) out.push({ userId: u.id, text: `${u.name.split(' ')[0]} melakukan ${corrCount} koreksi bulan ini.`, sub: 'Koreksi berulang bisa menandakan pola tidak akurat.' });
      const userRecords = dayRecords.filter((r) => r.userId === u.id);
      for (const r of userRecords) {
        if (r.checkIn) {
          const hm = r.checkIn.split(':').map(Number);
          const mins = hm[0] * 60 + hm[1];
          if (mins < 5 * 60 || mins > 21 * 60) out.push({ userId: u.id, text: `${u.name.split(' ')[0]} absen masuk ${r.checkIn}.`, sub: 'Jam masuk di luar waktu normal.' });
        }
        if (r.status === 'selesai' && r.checkIn && r.checkOut) {
          const dur = minutesBetween(r.checkIn, r.checkOut);
          if (dur > 0 && dur < 30) out.push({ userId: u.id, text: `${u.name.split(' ')[0]} mencatat durasi ${dur} menit.`, sub: 'Terlalu pendek — tinjau kebenarannya.' });
        }
      }
    }
    return out;
  }, [freelancers, dayRecords, corrections, month]);

  const workHours = useMemo(() => monthlyWorkHours(state.attendance, month), [state.attendance, month]);
  const hourMap = new Map(workHours.map((h) => [h.userId, h.minutes]));

  const isOwner = currentUser.role === 'owner' || currentUser.role === 'admin';
  const hourRows = isOwner ? freelancers : [currentUser];
  const decorName = (id?: string) => decors.find((d) => d.id === id)?.name || 'Umum';
  const userName = (id: string) => state.users.find((u) => u.id === id)?.name || id;

  const pendingCorrections = useMemo(
    () => corrections.filter((c) => c.status === 'pending').sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
    [corrections],
  );

  const sortedAudit = useMemo(() => [...audit].sort((a, b) => (a.at < b.at ? 1 : -1)), [audit]);
  const auditPageCount = Math.max(1, Math.ceil(sortedAudit.length / AUDIT_PAGE_SIZE));
  const recentAudit = sortedAudit.slice((auditPage - 1) * AUDIT_PAGE_SIZE, auditPage * AUDIT_PAGE_SIZE);

  // Total duration for user today
  const myTotalDuration = useMemo(
    () => myRecords.reduce((sum, r) => sum + minutesBetween(r.checkIn, r.checkOut), 0),
    [myRecords],
  );

  const dateLabel = new Date(date + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  // Freelancer hanya lihat tab: status & rekap
  const visibleTabs = isOwner ? SECTION_TABS : SECTION_TABS.filter((t) => t.value === 'status' || t.value === 'rekap' || t.value === 'koreksi');
  const sectionTab = visibleTabs.some((tab) => tab.value === requestedTab) ? requestedTab : 'status';

  return (
    <div>
      <PageHeader
        title="Absensi"
        subtitle="Self-report: tidak wajib, tapi setiap data harus jujur & bisa dipertanggungjawabkan"
        action={
          isOwner ? (
            <input
              type="date"
              value={date}
              max={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setDate(e.target.value)}
              className="h-9 rounded-lg border border-slate-200 px-3 text-sm bg-white"
            />
          ) : (
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hari Ini</span>
          )
        }
      />

      {/* Tabs */}
      <div className="flex gap-1.5 mb-4 overflow-x-auto no-scrollbar pb-1">
        {visibleTabs.map((t) => (
          <button
            key={t.value}
            onClick={() => setSectionTab(t.value)}
            className={cn(
              "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border shrink-0 select-none",
              sectionTab === t.value ? "bg-navy text-white border-navy shadow-sm" : "bg-white text-slate-400 border-slate-200 hover:border-slate-300 hover:text-slate-500",
            )}
          >
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      {/* Summary — owner/admin only */}
      {isOwner && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mb-4">
          <SummaryPill color="bg-emerald-500" label="Sedang Bekerja" value={summary.hadir} />
          <SummaryPill color="bg-sky-500" label="Sudah Selesai" value={summary.selesai} />
          <SummaryPill color="bg-slate-400" label="Tidak Bekerja" value={summary.tidakBekerja} />
          <SummaryPill color="bg-slate-300" label="Tidak Mengisi" value={summary.tidakMengisi} />
          <SummaryPill color={flags.length ? 'bg-red-500' : 'bg-slate-300'} label="Perlu Ditinjau" value={flags.length} />
        </div>
      )}

      {/* ═══ TAB: STATUS ═══ */}
      {sectionTab === 'status' && (
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="space-y-4">
          {isOwner ? (
            <SectionCard title="Mode Pengelola">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-slate-600 font-bold text-sm uppercase tracking-widest">
                  <ShieldCheck size={15} /> Anda Pengelola
                </div>
                <p className="text-xs text-slate-400 mt-1">Tidak perlu absensi — lihat rekap tim di bawah.</p>
              </div>
            </SectionCard>
          ) : (<>
          {/* Absensi per Decor — Freelancer */}
          <SectionCard title="Absensi Hari Ini" action={
            isToday && myRecords.length > 0 && (
              <span className="text-[10px] font-bold text-slate-400">Total: {formatDuration(myTotalDuration).label}</span>
            )
          }>
            {!isToday ? (
              <div className="text-sm text-slate-500 rounded-xl bg-slate-50 p-4 text-center">
                <CalendarCheck size={18} className="text-slate-300 mb-2 mx-auto" />
                Absensi hanya bisa dilakukan untuk <b>hari ini</b>.
              </div>
            ) : myDecorTasks.length === 0 ? (
              <div className="text-sm text-slate-500 rounded-xl bg-slate-50 p-4 text-center">
                <ListChecks size={18} className="text-slate-300 mb-2 mx-auto" />
                Tidak ada tugas yang ditugaskan untuk Anda.
              </div>
            ) : (
              <div className="space-y-3">
                {myDecorTasks.map((dt) => {
                  const activeRecord = myRecords.find((r) => r.decorId === dt.decorId && r.status === 'hadir');
                  const doneRecord = myRecords.find((r) => r.decorId === dt.decorId && r.status === 'selesai');
                  const hasRecord = !!activeRecord || !!doneRecord;
                  const allDone = dt.done === dt.total;

                  return (
                    <div key={dt.decorId} className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-navy truncate">{dt.decorName}</p>
                          <p className="text-[10px] text-slate-400">{dt.done}/{dt.total} tugas selesai</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {doneRecord ? (
                            <StatusBadge color="bg-sky-500" label="Selesai Bekerja" />
                          ) : activeRecord ? (
                            <StatusBadge color="bg-emerald-500" label="Sedang Bekerja" />
                          ) : null}
                        </div>
                      </div>

                      {/* Detail sesi yang sudah ada */}
                      {doneRecord && (
                        <p className="text-[11px] text-slate-500 mb-2">
                          Masuk {doneRecord.checkIn} · Keluar {doneRecord.checkOut}
                          {doneRecord.checkIn && doneRecord.checkOut && <> · {formatDuration(minutesBetween(doneRecord.checkIn, doneRecord.checkOut)).label}</>}
                        </p>
                      )}
                      {activeRecord && (
                        <p className="text-[11px] text-emerald-600 font-semibold mb-2">
                          Masuk {activeRecord.checkIn} WIB — sedang bekerja...
                        </p>
                      )}

                      {/* Aksi */}
                      {!hasRecord ? (
                        <Button
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-10 text-sm font-bold"
                          onClick={() => {
                            const rec = clockIn(currentUser.id, date, dt.decorId, undefined, opsDevice());
                            if (rec) {
                              toast({ title: 'Hadir tercatat', description: `${rec.checkIn} WIB · ${dt.decorName}` });
                            } else {
                              toast({ title: 'Gagal mencatat', description: 'Anda sudah absen atau tidak ada tugas untuk decor ini.', variant: 'destructive' });
                            }
                          }}
                        >
                          <LogIn size={15} className="mr-2" /> Absen Masuk — {dt.decorName}
                        </Button>
                      ) : activeRecord ? (
                        <Button
                          className={cn(
                            "w-full h-10 text-sm font-bold",
                            allDone
                              ? "bg-sky-600 hover:bg-sky-700 text-white"
                              : "bg-slate-200 text-slate-400 cursor-not-allowed"
                          )}
                          disabled={!allDone}
                          onClick={() => {
                            clockOut(currentUser.id, date, dt.decorId);
                            toast({ title: 'Selesai tercatat', description: `${dt.decorName}` });
                          }}
                          title={!allDone ? `Selesaikan semua tugas dulu (${dt.done}/${dt.total})` : undefined}
                        >
                          <LogOut size={15} className="mr-2" />
                          {allDone ? `Selesai — ${dt.decorName}` : `Tugas belum selesai (${dt.done}/${dt.total})`}
                        </Button>
                      ) : null}

                      {/* Selesai — sudah record */}
                      {doneRecord && (
                        <div className="rounded-lg border border-sky-200 bg-sky-50 p-2.5 text-center mt-2">
                          <p className="text-[11px] text-sky-700 font-bold">✓ Sudah absen pulang</p>
                        </div>
                      )}
                    </div>
                  );
                })}

                <Button variant="outline" className="w-full h-10 text-slate-500" onClick={() => setShowNoWork(true)}>
                  <UserX size={15} /> Tidak Bekerja Hari Ini
                </Button>
              </div>
            )}
          </SectionCard>
          <SectionCard title="Info">
            <ul className="space-y-2 text-[11px] text-slate-500">
              <li className="flex justify-between"><span className="text-slate-400">Perangkat</span><span className="font-semibold text-navy">{opsDevice()}</span></li>
              <li className="flex justify-between"><span className="text-slate-400">Waktu server</span><span className="font-semibold text-navy">{new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</span></li>
              <li className="flex justify-between"><span className="text-slate-400">Sesi hari ini</span><span className="font-semibold text-navy">{myRecords.length} sesi</span></li>
            </ul>
          </SectionCard>
          </>)}
        </div>

        {/* Kolom kanan — rekap */}
        <div className="lg:col-span-2 space-y-4">
          {/* Owner: Rekap tim per decor */}
          {isOwner && (
            <SectionCard title={`Rekap Tim — ${dateLabel}`} action={<span className="text-[10px] font-bold text-slate-400">{allDecorWithTasks.length} decor aktif</span>}>
              {allDecorWithTasks.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">Tidak ada decor dengan tugas hari ini.</p>
              ) : (
                <div className="space-y-3">
                  {allDecorWithTasks.map((dt) => {
                    const decorRecords = dayRecords.filter((r) => r.decorId === dt.decorId);
                    return (
                      <div key={dt.decorId} className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
                        <p className="text-sm font-bold text-navy mb-2">{dt.decorName}</p>
                        <div className="divide-y divide-slate-100">
                          {Array.from(dt.assignees).map((uid) => {
                            const userRecord = decorRecords.find((r) => r.userId === uid);
                            const user = state.users.find((u) => u.id === uid);
                            const dur = userRecord ? minutesBetween(userRecord.checkIn, userRecord.checkOut) : 0;
                            const status = userRecord?.status || 'tidak-mengisi';
                            return (
                              <div key={uid} className="py-2.5 flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                  <span className="h-8 w-8 rounded-full bg-navy text-white text-[10px] font-bold flex items-center justify-center shrink-0">{userFirst(state, uid)}</span>
                                  <div className="min-w-0">
                                    <p className="text-sm font-semibold text-navy truncate">{user?.name || uid}</p>
                                    <p className="text-[10px] text-slate-400 truncate">
                                      {userRecord?.status === 'hadir' || userRecord?.status === 'selesai'
                                        ? `${userRecord.checkIn} → ${userRecord.checkOut || '…'}${dur > 0 ? ` · ${formatDuration(dur).label}` : ''}`
                                        : userRecord?.status === 'tidak-bekerja' ? 'Tidak bekerja' : 'Tidak mengisi'}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <StatusBadge color={ATTENDANCE_STATUS_COLOR[status]} label={ATTENDANCE_STATUS_LABEL[status]} />
                                  {isOwner && userRecord && (
                                    <button onClick={() => { deleteSession(userRecord.id); toast({ title: 'Session dihapus' }); }} className="text-slate-300 hover:text-red-500" aria-label="hapus"><X size={14} /></button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </SectionCard>
          )}

          {isOwner && flags.length > 0 && (
            <SectionCard title={<span className="flex items-center gap-1.5"><AlertTriangle size={13} className="text-red-500" /> Perlu Ditinjau</span>}>
              <ul className="space-y-2.5">
                {flags.map((f, i) => (
                  <li key={i} className="flex items-start gap-3 rounded-xl border border-amber-100 bg-amber-50 p-3">
                    <AlertTriangle size={15} className="text-amber-500 mt-0.5 shrink-0" />
                    <div><p className="text-sm font-semibold text-navy">{f.text}</p><p className="text-[11px] text-slate-500">{f.sub}</p></div>
                  </li>
                ))}
              </ul>
            </SectionCard>
          )}

          <SectionCard title={isOwner ? "Rekap Jam Kerja Tim" : "Rekap Jam Kerja Saya"}>
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[9px] uppercase tracking-widest text-slate-400 border-b border-slate-100">
                    <th className="py-2 pr-3">{isOwner ? 'Freelancer' : 'Nama'}</th>
                    <th className="py-2">Total Jam Bulan Ini</th>
                  </tr>
                </thead>
                <tbody>
                  {hourRows.map((u) => ({ u, minutes: hourMap.get(u.id) || 0 })).filter((x) => x.minutes > 0).sort((a, b) => b.minutes - a.minutes).map(({ u, minutes }) => (
                    <tr key={u.id} className="border-b border-slate-50">
                      <td className="py-2.5 pr-3 text-sm font-semibold text-navy">{u.name}</td>
                      <td className="py-2.5 text-sm text-slate-600">{formatDuration(minutes).label}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </div>
      </div>
      )}

      {/* ═══ TAB: REKAP ═══ */}
      {sectionTab === 'rekap' && (
        <SectionCard title={isOwner ? "Rekap Jam Kerja Tim" : "Rekap Jam Kerja Saya"}>
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[9px] uppercase tracking-widest text-slate-400 border-b border-slate-100">
                  <th className="py-2 pr-3">{isOwner ? 'Freelancer' : 'Nama'}</th>
                  <th className="py-2">Total Jam Bulan Ini</th>
                </tr>
              </thead>
              <tbody>
                {hourRows.map((u) => ({ u, minutes: hourMap.get(u.id) || 0 })).filter((x) => x.minutes > 0).sort((a, b) => b.minutes - a.minutes).map(({ u, minutes }) => (
                  <tr key={u.id} className="border-b border-slate-50">
                    <td className="py-2.5 pr-3 text-sm font-semibold text-navy">{u.name}</td>
                    <td className="py-2.5 text-sm text-slate-600">{formatDuration(minutes).label}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}

      {/* ═══ TAB: KOREKSI ═══ */}
      {sectionTab === 'koreksi' && (
        <div className="space-y-4">
          {/* Freelancer: form ajukan koreksi */}
          {!isOwner && (
            <KoreksiForm
              records={myRecords}
              userName={userName}
              onSubmit={(attendanceId, patch) => {
                requestCorrection(attendanceId, patch);
                toast({ title: 'Koreksi diajukan', description: 'Menunggu persetujuan pengelola.' });
              }}
            />
          )}

          {/* Owner: daftar koreksi pending */}
          {isOwner && pendingCorrections.length > 0 && (
            <SectionCard title={<span className="flex items-center gap-1.5"><BadgeCheck size={13} className="text-gold" /> Koreksi Masuk ({pendingCorrections.length})</span>}>
              <ul className="space-y-3">
                {pendingCorrections.map((c) => {
                  const corrAtt = state.attendance.find((a) => a.id === c.attendanceId);
                  const corrDecor = corrAtt?.decorId ? decors.find((d) => d.id === corrAtt.decorId) : undefined;
                  return (
                  <li key={c.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-bold text-navy">{userName(c.userId)} · {new Date(c.date + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</p>
                        {corrDecor && (
                          <p className="text-[10px] text-slate-400 mt-0.5">Decor: <span className="font-semibold text-navy">{corrDecor.name}</span></p>
                        )}
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {c.requestedCheckIn && <>Masuk → <b>{c.requestedCheckIn}</b></>}
                          {c.requestedCheckIn && c.requestedCheckOut && ' · '}
                          {c.requestedCheckOut && <>Keluar → <b>{c.requestedCheckOut}</b></>}
                          {c.reason && <> · <em>"{c.reason}"</em></>}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="text-red-600 border-red-200" onClick={() => { rejectCorrection(c.id, currentUser.name); toast({ title: 'Koreksi ditolak' }); }}>Tolak</Button>
                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => { approveCorrection(c.id, currentUser.name); toast({ title: 'Koreksi disetujui' }); }}><BadgeCheck size={14} /> Setujui</Button>
                      </div>
                    </div>
                  </li>
                  );
                })}
              </ul>
            </SectionCard>
          )}

          {/* Owner: empty state */}
          {isOwner && pendingCorrections.length === 0 && (
            <SectionCard title={<span className="flex items-center gap-1.5"><BadgeCheck size={13} className="text-gold" /> Koreksi Masuk</span>}>
              <p className="text-xs text-slate-400 py-4 text-center">Tidak ada koreksi yang menunggu persetujuan.</p>
            </SectionCard>
          )}

          {/* Freelancer: riwayat koreksi saya */}
          {!isOwner && (
            <MyCorrections userId={currentUser.id} corrections={corrections} userName={userName} date={date} />
          )}
        </div>
      )}

      {/* ═══ TAB: AUDIT (owner only) ═══ */}
      {sectionTab === 'audit' && isOwner && (
        <SectionCard title={<span className="flex items-center gap-1.5"><ShieldCheck size={13} /> Audit Log</span>}>
          <div className="hidden overflow-x-auto sm:block">
            <table className="w-full min-w-[620px] text-left">
              <thead>
                <tr className="border-b border-slate-100 text-[9px] uppercase tracking-widest text-slate-400">
                  <th className="py-2 pr-3">Waktu</th>
                  <th className="py-2 pr-3">Pengguna</th>
                  <th className="py-2 pr-3">Aksi</th>
                  <th className="py-2">Detail</th>
                </tr>
              </thead>
              <tbody>
                {recentAudit.map((a) => {
                  const meta = AUDIT_LABEL[a.action] || { label: a.action, color: 'bg-slate-100 text-slate-600' };
                  return (
                    <tr key={a.id} className="border-b border-slate-50 text-xs text-slate-600">
                      <td className="py-3 pr-3 whitespace-nowrap text-[10px] text-slate-400">{new Date(a.at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })} · {new Date(a.at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</td>
                      <td className="py-3 pr-3 font-bold text-navy">{userName(a.userId)}</td>
                      <td className="py-3 pr-3"><span className={cn("inline-flex rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-widest", meta.color)}>{meta.label}</span></td>
                      <td className="py-3 max-w-[280px] truncate">{a.detail || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="space-y-2.5 sm:hidden">
            {recentAudit.length === 0 && <p className="text-xs text-slate-400 py-4 text-center">Belum ada aktivitas tercatat.</p>}
            {recentAudit.map((a) => {
              const meta = AUDIT_LABEL[a.action] || { label: a.action, color: 'bg-slate-100 text-slate-600' };
              return (
                <div key={a.id} className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                  <div className="flex items-start justify-between gap-2">
                  <span className={cn("px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest shrink-0 mt-0.5", meta.color)}>{meta.label}</span>
                  <p className="text-[9px] text-slate-400"><Clock4 size={9} className="inline" /> {new Date(a.at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })} · {new Date(a.at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <p className="mt-2 text-xs text-slate-600"><span className="font-bold text-navy">{userName(a.userId)}</span>{a.detail ? ` · ${a.detail}` : ''}</p>
                </div>
              );
            })}
          </div>
          <Pagination page={auditPage} totalPages={auditPageCount} onPage={setAuditPage} />
        </SectionCard>
      )}

      {/* Dialog Tidak Bekerja */}
      <Dialog open={showNoWork} onOpenChange={setShowNoWork}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base text-navy">Tidak Bekerja Hari Ini</DialogTitle>
            <DialogDescription className="text-xs text-slate-400">Konfirmasi bahwa Anda tidak bekerja hari ini.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNoWork(false)}>Batal</Button>
            <Button className="bg-navy text-white" onClick={() => {
              declareNoWork(currentUser.id, date);
              toast({ title: 'Dicatat' });
              setShowNoWork(false);
            }}>Konfirmasi</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ─── Koreksi Form (freelancer) — multi-sesi ──────────────────────────── */
function KoreksiForm({
  records, userName, onSubmit,
}: {
  records: Attendance[];
  userName: (id: string) => string;
  onSubmit: (attendanceId: string, patch: { requestedCheckIn?: string; requestedCheckOut?: string; reason: string; detail?: string }) => void;
}) {
  const [selectedId, setSelectedId] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [reason, setReason] = useState('');
  const [detail, setDetail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // Set default selection to first record
  const selectedRecord = records.find((r) => r.id === selectedId);

  const handleSelect = (id: string) => {
    setSelectedId(id);
    const rec = records.find((r) => r.id === id);
    if (rec) {
      setCheckIn(rec.checkIn || '');
      setCheckOut(rec.checkOut || '');
    }
  };

  const canSubmit = selectedId && reason.trim().length >= 3 && (checkIn || checkOut);

  const handleSubmit = () => {
    if (!canSubmit || !selectedId) return;
    onSubmit(selectedId, {
      requestedCheckIn: checkIn || undefined,
      requestedCheckOut: checkOut || undefined,
      reason: reason.trim(),
      detail: detail.trim() || undefined,
    });
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <SectionCard title={<span className="flex items-center gap-1.5"><BadgeCheck size={13} className="text-gold" /> Ajukan Koreksi</span>}>
        <div className="text-center py-6">
          <BadgeCheck size={28} className="text-emerald-500 mx-auto mb-2" />
          <p className="text-sm font-bold text-navy">Koreksi sudah diajukan</p>
          <p className="text-xs text-slate-400 mt-1">Menunggu persetujuan dari pengelola.</p>
        </div>
      </SectionCard>
    );
  }

  if (records.length === 0) {
    return (
      <SectionCard title={<span className="flex items-center gap-1.5"><FileEdit size={13} className="text-gold" /> Ajukan Koreksi</span>}>
        <p className="text-xs text-slate-400 py-4 text-center">Tidak ada sesi absensi hari ini untuk dikoreksi.</p>
      </SectionCard>
    );
  }

  return (
    <SectionCard title={<span className="flex items-center gap-1.5"><FileEdit size={13} className="text-gold" /> Ajukan Koreksi</span>}>
      <p className="text-xs text-slate-400 mb-3">Lupa absen masuk/keluar? Pilih sesi lalu ajukan koreksi. Pengelola akan meninjau.</p>

      {/* Pilih sesi */}
      <div>
        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pilih Sesi Absensi *</Label>
        <div className="space-y-2 mt-2">
          {records.map((r) => (
            <button
              key={r.id}
              onClick={() => handleSelect(r.id)}
              className={cn(
                "w-full text-left rounded-xl border p-3 transition-all",
                selectedId === r.id ? "border-navy bg-navy/5 shadow-sm" : "border-slate-200 bg-white hover:border-slate-300",
              )}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-navy">{r.decorId ? 'Decor' : 'Sesi'}</p>
                  <p className="text-[10px] text-slate-400">
                    Masuk: {r.checkIn || '—'} · Keluar: {r.checkOut || '—'}
                    {r.status === 'selesai' && <> · {formatDuration(minutesBetween(r.checkIn, r.checkOut)).label}</>}
                  </p>
                </div>
                <StatusBadge color={ATTENDANCE_STATUS_COLOR[r.status]} label={ATTENDANCE_STATUS_LABEL[r.status]} />
              </div>
            </button>
          ))}
        </div>
      </div>

      {selectedRecord && (
        <>
          <div className="grid sm:grid-cols-2 gap-3 mt-4">
            <div>
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Jam Masuk yang Benar</Label>
              <Input type="time" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} className="mt-1" placeholder="HH:mm" />
            </div>
            <div>
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Jam Keluar yang Benar</Label>
              <Input type="time" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} className="mt-1" placeholder="HH:mm" />
            </div>
          </div>
          <div className="mt-3">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Alasan * <span className="text-slate-300 normal-case">(minimal 3 karakter)</span></Label>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="cth. Lupa absen masuk karena jaringan error" className="mt-1" />
          </div>
          <div className="mt-3">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Detail Tambahan <span className="text-slate-300 normal-case">(opsional)</span></Label>
            <Input value={detail} onChange={(e) => setDetail(e.target.value)} placeholder="Keterangan lebih lanjut" className="mt-1" />
          </div>
          <Button
            className="mt-4 w-full bg-navy hover:bg-gold text-white"
            disabled={!canSubmit}
            onClick={handleSubmit}
          >
            <FileEdit size={15} className="mr-2" /> Kirim Koreksi
          </Button>
        </>
      )}
    </SectionCard>
  );
}

/* ─── My Corrections (freelancer history) ────────────────────────────── */
function MyCorrections({
  userId, corrections, userName, date,
}: {
  userId: string;
  corrections: AttendanceCorrection[];
  userName: (id: string) => string;
  date: string;
}) {
  const myCorrections = useMemo(
    () => corrections
      .filter((c) => c.userId === userId)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
    [corrections, userId],
  );

  const statusBadge = (s: string) => {
    if (s === 'pending') return <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-amber-100 text-amber-700">Menunggu</span>;
    if (s === 'approved') return <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-100 text-emerald-700">Disetujui</span>;
    return <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-red-100 text-red-700">Ditolak</span>;
  };

  return (
    <SectionCard title="Riwayat Koreksi Saya">
      {myCorrections.length === 0 ? (
        <p className="text-xs text-slate-400 py-4 text-center">Belum ada riwayat koreksi.</p>
      ) : (
        <ul className="space-y-2.5">
          {myCorrections.map((c) => (
            <li key={c.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-navy">
                    {new Date(c.date + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {c.requestedCheckIn && <>Masuk → <b>{c.requestedCheckIn}</b></>}
                    {c.requestedCheckIn && c.requestedCheckOut && ' · '}
                    {c.requestedCheckOut && <>Keluar → <b>{c.requestedCheckOut}</b></>}
                    {c.reason && <> · <em>"{c.reason}"</em></>}
                  </p>
                </div>
                {statusBadge(c.status)}
              </div>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}

function SummaryPill({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-3 shadow-sm">
      <p className="text-lg font-headline font-bold text-navy leading-none">{value}</p>
      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-1.5 flex items-center gap-1.5">
        <span className={cn("w-1.5 h-1.5 rounded-full", color)} /> {label}
      </p>
    </div>
  );
}
