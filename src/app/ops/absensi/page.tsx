'use client';

import React, { useMemo, useState, useCallback } from 'react';
import {
  Clock4, LogOut, LogIn, ShieldCheck, AlertTriangle,
  BadgeCheck, CalendarCheck, X, UserX, RotateCcw,
  LayoutDashboard, BarChart3, FileEdit, Shield,
} from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useOps, userFirst } from '@/lib/ops/store';
import {
  ATTENDANCE_STATUS_LABEL, ATTENDANCE_STATUS_COLOR,
  type Attendance,
} from '@/lib/ops/types';
import { monthlyWorkHours, formatDuration, minutesBetween } from '@/lib/ops/reports';
import { opsLastLogin, opsDevice } from '@/lib/ops/auth';
import { cn } from '@/lib/utils';
import { PageHeader, SectionCard, StatusBadge, formatDateTime, Pagination } from '../ops-ui';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';

const AUDIT_LABEL: Record<string, { label: string; color: string }> = {
  'absensi.masuk': { label: 'Absen Masuk', color: 'bg-emerald-100 text-emerald-700' },
  'absensi.pulang': { label: 'Absen Pulang', color: 'bg-sky-100 text-sky-700' },
  'absensi.tidak-bekerja': { label: 'Tidak Bekerja', color: 'bg-slate-100 text-slate-600' },
  'absensi.hapus': { label: 'Hapus Session', color: 'bg-red-100 text-red-700' },
  'koreksi.ajukan': { label: 'Koreksi Diajukan', color: 'bg-amber-100 text-amber-700' },
  'koreksi.setujui': { label: 'Koreksi Disetujui', color: 'bg-emerald-100 text-emerald-700' },
  'koreksi.tolak': { label: 'Koreksi Ditolak', color: 'bg-red-100 text-red-700' },
};

function parseHM(t?: string) {
  if (!t) return -1;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

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
    state, currentUser, decors, activeDecors, attendanceForDate, clockIn, clockOut,
    declareNoWork, deleteSession, requestCorrection, approveCorrection, rejectCorrection,
    corrections, audit,
  } = useOps();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();

  const rawTab = searchParams.get('tab');
  const sectionTab: SectionTab = (rawTab && VALID_TABS.includes(rawTab)) ? (rawTab as SectionTab) : 'status';

  const setSectionTab = useCallback((newTab: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', newTab);
    router.push(`/ops/absensi?${params.toString()}`, { scroll: false });
  }, [searchParams, router]);

  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const isToday = date === new Date().toISOString().slice(0, 10);
  const month = date.slice(0, 7);

  // dialogs
  const [showNoWork, setShowNoWork] = useState(false);
  const [auditPage, setAuditPage] = useState(1);
  const AUDIT_PAGE_SIZE = 10;

  const records = useMemo<Record<string, Attendance>>(() => attendanceForDate(date), [attendanceForDate, date]);
  const freelancers = useMemo(() => state.users.filter((u) => u.active && u.role === 'freelancer'), [state.users]);
  const my = records[currentUser.id];

  // ── Summary ─────────────────────────────────────────────────────────────
  const summary = useMemo(() => {
    let hadir = 0, selesai = 0, tidakBekerja = 0, mengisi = 0;
    for (const u of freelancers) {
      const r = records[u.id];
      if (!r) continue;
      mengisi++;
      if (r.status === 'hadir') hadir++;
      else if (r.status === 'selesai') selesai++;
      else if (r.status === 'tidak-bekerja') tidakBekerja++;
    }
    return {
      hadir, selesai, tidakBekerja,
      tidakMengisi: freelancers.length - mengisi,
      total: freelancers.length,
    };
  }, [records, freelancers]);

  // ── Perlu ditinjau ──────────────────────────────────────────────────────
  const flags = useMemo(() => {
    const out: { userId: string; text: string; sub: string }[] = [];
    const monthCorr = corrections.filter((c) => c.date.slice(0, 7) === month);
    for (const u of freelancers) {
      const r = records[u.id];
      const corrCount = monthCorr.filter((c) => c.userId === u.id).length;
      if (corrCount >= 3) out.push({ userId: u.id, text: `${u.name.split(' ')[0]} melakukan ${corrCount} koreksi bulan ini.`, sub: 'Koreksi berulang bisa menandakan pola tidak akurat.' });
      if (r && r.checkIn) {
        const hm = parseHM(r.checkIn);
        if (hm >= 0 && (hm < 5 * 60 || hm > 21 * 60)) out.push({ userId: u.id, text: `${u.name.split(' ')[0]} absen masuk ${r.checkIn}.`, sub: 'Jam masuk di luar waktu normal (belum diverifikasi).' });
      }
      if (r && r.status === 'selesai' && r.checkIn && r.checkOut) {
        const dur = minutesBetween(r.checkIn, r.checkOut);
        if (dur > 0 && dur < 30) out.push({ userId: u.id, text: `${u.name.split(' ')[0]} mencatat durasi kerja ${dur} menit.`, sub: 'Terlalu pendek — tinjau kebenarannya.' });
      }
    }
    return out;
  }, [freelancers, records, corrections, month]);

  // ── Rekap bulanan ────────────────────────────────────────────────────────
  const workHours = useMemo(() => monthlyWorkHours(state.attendance, month), [state.attendance, month]);
  const hourMap = new Map(workHours.map((h) => [h.userId, h.minutes]));

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setLocStatus('fail');
      setLocLabel('Geolokasi tidak didukung perangkat.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocStatus('ok');
        setLocLabel(`Lokasi terdeteksi · ±${Math.round(pos.coords.accuracy)} m dari titik GPS`);
      },
      () => {
        setLocStatus('fail');
        setLocLabel('Lokasi tidak tersedia — absen tetap bisa dilanjutkan (opsional).');
      },
      { timeout: 8000 },
    );
  };

  const submitCheckin = () => {
    if (!agree) return;
    const rec = clockIn(currentUser.id, date, decorId === 'none' ? undefined : decorId, note.trim() || undefined, opsDevice());
    if (rec) {
      toast({ title: 'Absen masuk tercatat', description: `${rec.checkIn} WIB · data masuk audit log` });
    } else {
      toast({ title: 'Kamu sudah punya absensi hari ini', description: 'Satu sesi per hari — hubungi owner jika salah.' });
    }
    setShowCheckin(false);
    setNote('');
    setAgree(false);
    setDecorId('');
  };

  const submitNoWork = () => {
    if (!agree) return;
    declareNoWork(currentUser.id, date);
    toast({ title: 'Dicatat', description: 'Kamu menyatakan tidak bekerja hari ini.' });
    setShowNoWork(false);
    setAgree(false);
  };

  const submitCorrection = () => {
    if (!corrIn && !corrOut) {
      setCorrReason('Isi minimal satu jam (masuk atau pulang).');
      return;
    }
    requestCorrection(currentUser.id, date, {
      requestedCheckIn: corrIn || undefined,
      requestedCheckOut: corrOut || undefined,
      reason: corrReason || 'Tidak disebutkan',
      detail: corrDetail.trim() || undefined,
    });
    toast({ title: 'Koreksi diajukan', description: 'Menunggu persetujuan owner.' });
    setShowCorrection(false);
    setCorrIn(''); setCorrOut(''); setCorrReason(''); setCorrDetail('');
  };

  const myDuration = my ? minutesBetween(my.checkIn, my.checkOut) : 0;
  const myDelivered = my?.note;

  const dateLabel = new Date(date + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const isOwner = currentUser.role === 'owner' || currentUser.role === 'admin';
  const hourRows = isOwner ? freelancers : [currentUser];
  const decorName = (id?: string) => decors.find((d) => d.id === id)?.name || 'Umum';
  const userName = (id: string) => state.users.find((u) => u.id === id)?.name || id;

  const pendingCorrections = useMemo(
    () => corrections.filter((c) => c.status === 'pending').sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
    [corrections],
  );

  const myCorrections = useMemo(
    () => corrections.filter((c) => c.userId === currentUser.id).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
    [corrections, currentUser.id],
  );

  const sortedAudit = useMemo(
    () => [...audit].sort((a, b) => (a.at < b.at ? 1 : -1)),
    [audit],
  );
  const auditPageCount = Math.max(1, Math.ceil(sortedAudit.length / AUDIT_PAGE_SIZE));
  const recentAudit = sortedAudit.slice((auditPage - 1) * AUDIT_PAGE_SIZE, auditPage * AUDIT_PAGE_SIZE);

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

      {/* Section tabs */}
      <div className="flex gap-1.5 mb-4 overflow-x-auto no-scrollbar pb-1">
        {SECTION_TABS.map((t) => (
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

      {/* Summary (owner/admin) */}
      {isOwner && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mb-4">
          <SummaryPill color="bg-emerald-500" label="Sedang Bekerja" value={summary.hadir} />
          <SummaryPill color="bg-sky-500" label="Sudah Selesai" value={summary.selesai} />
          <SummaryPill color="bg-slate-400" label="Tidak Bekerja" value={summary.tidakBekerja} />
          <SummaryPill color="bg-slate-300" label="Tidak Mengisi" value={summary.tidakMengisi} />
          <SummaryPill color={flags.length ? 'bg-red-500' : 'bg-slate-300'} label="Perlu Ditinjau" value={flags.length} />
        </div>
      )}

      {sectionTab === 'status' && (
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Kolom kiri: info pribadi */}
        <div className="space-y-4">
          {isOwner ? (
            <SectionCard title="Mode Pengelola">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-slate-600 font-bold text-sm uppercase tracking-widest">
                  <ShieldCheck size={15} /> Anda Pengelola
                </div>
                <p className="text-xs text-slate-400 mt-1">Tidak perlu absensi — lihat rekap tim di bawah. Freelancer yang melakukan absensi sendiri.</p>
              </div>
            </SectionCard>
          ) : (<>
          <SectionCard title="Absensi Hari Ini">
            {!isToday ? (
              <div className="text-sm text-slate-500 rounded-xl bg-slate-50 p-4 text-center">
                <CalendarCheck size={18} className="text-slate-300 mb-2 mx-auto" />
                Absensi hanya bisa dilakukan untuk <b>hari ini</b>.
              </div>
            ) : !my ? (
              <div className="space-y-3">
                <p className="text-sm text-slate-500 text-center">Pencet tombol di bawah untuk catat kehadiran.</p>
                <Button
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-14 text-base font-bold"
                  onClick={() => {
                    const rec = clockIn(currentUser.id, date, selectedDecor?.id || undefined, undefined, opsDevice());
                    if (rec) {
                      toast({ title: 'Hadir tercatat', description: `${rec.checkIn} WIB` });
                    }
                  }}
                >
                  <LogIn size={18} className="mr-2" /> Hadir
                </Button>
                <Button variant="outline" className="w-full h-10 text-slate-500" onClick={() => setShowNoWork(true)}>
                  <UserX size={15} /> Tidak Bekerja Hari Ini
                </Button>
              </div>
            ) : my.status === 'hadir' ? (
              <div className="space-y-3">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center">
                  <p className="text-emerald-700 font-bold text-sm uppercase tracking-widest">Sedang Bekerja</p>
                  <p className="text-xs text-slate-500 mt-1">Masuk {my.checkIn} WIB · {decorName(my.decorId)}</p>
                </div>
                <Button
                  className="w-full bg-sky-600 hover:bg-sky-700 text-white h-14 text-base font-bold"
                  onClick={() => { clockOut(currentUser.id, date); toast({ title: 'Selesai tercatat' }); }}
                >
                  <LogOut size={18} className="mr-2" /> Selesai
                </Button>
              </div>
            ) : my.status === 'selesai' ? (
              <div className="rounded-xl border border-sky-200 bg-sky-50 p-4 text-center">
                <p className="text-sky-700 font-bold text-sm uppercase tracking-widest">Selesai Bekerja</p>
                <div className="mt-2 text-sm text-slate-600">
                  <p><b>Masuk:</b> {my.checkIn} · <b>Keluar:</b> {my.checkOut}</p>
                  {myDuration > 0 && <p className="text-xs text-slate-500 mt-1">Durasi {formatDuration(myDuration).label}</p>}
                </div>
                <p className="text-[10px] text-slate-400 mt-2">Data sudah tercatat.</p>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center">
                <p className="text-slate-600 font-bold text-sm uppercase tracking-widest">Tidak Bekerja Hari Ini</p>
                <div className="flex gap-2 mt-4 justify-center">
                  <Button size="sm" className="bg-navy text-white" onClick={() => { deleteSession(currentUser.id, date); }}>
                    <RotateCcw size={13} /> Ubah ke Hadir
                  </Button>
                </div>
              </div>
            )}
          </SectionCard>

          <SectionCard title="Info">
            <ul className="space-y-2 text-[11px] text-slate-500">
              <li className="flex justify-between"><span className="text-slate-400">Perangkat</span><span className="font-semibold text-navy">{opsDevice()}</span></li>
              <li className="flex justify-between"><span className="text-slate-400">Waktu server</span><span className="font-semibold text-navy">{new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</span></li>
            </ul>
          </SectionCard>
          </>)}
        </div>
        <div className="lg:col-span-2 space-y-4">
          {isOwner && <SectionCard title={`Rekap Tim — ${dateLabel}`} action={<span className="text-[10px] font-bold text-slate-400">{summary.total} orang</span>}>
            <div className="divide-y divide-slate-50">
              {freelancers.map((u) => {
                const r = records[u.id];
                const status = r?.status || 'tidak-mengisi';
                const dur = r ? minutesBetween(r.checkIn, r.checkOut) : 0;
                return (
                  <div key={u.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="h-9 w-9 rounded-full bg-navy text-white text-[11px] font-bold flex items-center justify-center shrink-0">{userFirst(state, u.id)}</span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-navy truncate">{u.name}</p>
                        <p className="text-[10px] text-slate-400 truncate">
                          {r?.status === 'hadir' || r?.status === 'selesai'
                            ? `${r.checkIn} → ${r.checkOut || '…'} · ${decorName(r.decorId)}${dur > 0 ? ` · ${formatDuration(dur).label}` : ''}`
                            : r?.status === 'tidak-bekerja'
                              ? 'Menyatakan tidak bekerja'
                              : 'Tidak mengisi'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <StatusBadge color={ATTENDANCE_STATUS_COLOR[status]} label={ATTENDANCE_STATUS_LABEL[status]} />
                      {isOwner && r && (
                        <button onClick={() => { deleteSession(u.id, date); toast({ title: 'Session dihapus', description: 'Tercatat di audit log.' }); }} className="text-slate-300 hover:text-red-500" aria-label="hapus session">
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionCard>}

          {isOwner && flags.length > 0 && (
            <SectionCard title={<span className="flex items-center gap-1.5"><AlertTriangle size={13} className="text-red-500" /> Perlu Ditinjau</span>}>
              <ul className="space-y-2.5">
                {flags.map((f, i) => (
                  <li key={i} className="flex items-start gap-3 rounded-xl border border-amber-100 bg-amber-50 p-3">
                    <AlertTriangle size={15} className="text-amber-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-navy">{f.text}</p>
                      <p className="text-[11px] text-slate-500">{f.sub}</p>
                    </div>
                    <span className="ml-auto shrink-0 text-[9px] font-black uppercase tracking-widest text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">Menunggu Owner</span>
                  </li>
                ))}
              </ul>
              <p className="text-[10px] text-slate-400 mt-3">Warning saja — bukan hukuman. Owner yang memutuskan.</p>
            </SectionCard>
          )}

          <SectionCard title={isOwner ? "Rekap Jam Kerja Tim" : "Rekap Jam Kerja Saya"}>
            <p className="text-[10px] text-slate-400 mb-3">Dihitung dari sesi yang benar-benar diisi (masuk &amp; pulang) pada bulan ini.</p>
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[9px] uppercase tracking-widest text-slate-400 border-b border-slate-100">
                    <th className="py-2 pr-3">{isOwner ? 'Freelancer' : 'Nama'}</th>
                    <th className="py-2">Total Jam Kerja Bulan Ini</th>
                  </tr>
                </thead>
                <tbody>
                  {hourRows
                    .map((u) => ({ u, minutes: hourMap.get(u.id) || 0 }))
                    .filter((x) => x.minutes > 0)
                    .sort((a, b) => b.minutes - a.minutes)
                    .map(({ u, minutes }) => (
                      <tr key={u.id} className="border-b border-slate-50">
                        <td className="py-2.5 pr-3 text-sm font-semibold text-navy">{u.name}</td>
                        <td className="py-2.5 text-sm text-slate-600">{formatDuration(minutes).label}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </SectionCard>

          {!isOwner && myCorrections.length > 0 && (
            <SectionCard title="Koreksi Saya">
              <ul className="space-y-2.5">
                {myCorrections.map((c) => (
                  <li key={c.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-navy">
                        {new Date(c.date + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                        {c.requestedCheckIn && <> · Masuk → {c.requestedCheckIn}</>}
                        {c.requestedCheckOut && <> · Keluar → {c.requestedCheckOut}</>}
                      </p>
                      <CorrectionBadge status={c.status} />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1"><em>“{c.reason}”</em></p>
                    {c.status === 'rejected' && <p className="text-[10px] text-red-500 mt-1">Ditolak — hubungi owner jika ada yang salah.</p>}
                  </li>
                ))}
              </ul>
          </SectionCard>
          )}
        </div>
      </div>
      )}

      {sectionTab === 'rekap' && (
      <SectionCard title={isOwner ? "Rekap Jam Kerja Tim" : "Rekap Jam Kerja Saya"}>
        <p className="text-[10px] text-slate-400 mb-3">Dihitung dari sesi yang benar-benar diisi (masuk &amp; pulang) pada bulan ini.</p>
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[9px] uppercase tracking-widest text-slate-400 border-b border-slate-100">
                <th className="py-2 pr-3">{isOwner ? 'Freelancer' : 'Nama'}</th>
                <th className="py-2">Total Jam Kerja Bulan Ini</th>
              </tr>
            </thead>
            <tbody>
              {hourRows
                .map((u) => ({ u, minutes: hourMap.get(u.id) || 0 }))
                .filter((x) => x.minutes > 0)
                .sort((a, b) => b.minutes - a.minutes)
                .map(({ u, minutes }) => (
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

      {sectionTab === 'koreksi' && (
      <>
      {/* Koreksi masuk (owner) */}
      {isOwner && pendingCorrections.length > 0 && (
        <SectionCard className="mt-4" title={<span className="flex items-center gap-1.5"><BadgeCheck size={13} className="text-gold" /> Koreksi Masuk ({pendingCorrections.length})</span>}>
          <ul className="space-y-3">
            {pendingCorrections.map((c) => (
              <li key={c.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold text-navy">{userName(c.userId)} · {new Date(c.date + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {c.requestedCheckIn && <>Masuk → <b>{c.requestedCheckIn}</b></>}
                      {c.requestedCheckIn && c.requestedCheckOut && ' · '}
                      {c.requestedCheckOut && <>Keluar → <b>{c.requestedCheckOut}</b></>}
                      {!c.requestedCheckIn && !c.requestedCheckOut && 'Penyesuaian lain'}
                      {c.reason && <> · <em>“{c.reason}”</em></>}
                    </p>
                    {c.detail && <p className="text-[11px] text-slate-400 mt-1">{c.detail}</p>}
                    <p className="text-[9px] text-slate-400 mt-1">Diajukan {formatDateTime(c.createdAt)}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="text-red-600 border-red-200" onClick={() => { rejectCorrection(c.id, currentUser.name); toast({ title: 'Koreksi ditolak' }); }}>
                      Tolak
                    </Button>
                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => { approveCorrection(c.id, currentUser.name); toast({ title: 'Koreksi disetujui', description: 'Jam absensi diperbarui.' }); }}>
                      <BadgeCheck size={14} /> Setujui
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </SectionCard>
      )}

      </>
      )}

      {sectionTab === 'audit' && isOwner && (
        <SectionCard className="mt-4" title={<span className="flex items-center gap-1.5"><ShieldCheck size={13} /> Audit Log</span>}>
          <div className="space-y-2.5">
            {recentAudit.length === 0 && <p className="text-xs text-slate-400 py-4 text-center">Belum ada aktivitas tercatat.</p>}
            {recentAudit.map((a) => {
              const meta = AUDIT_LABEL[a.action] || { label: a.action, color: 'bg-slate-100 text-slate-600' };
              return (
                <div key={a.id} className="flex items-start gap-3">
                  <span className={cn("px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest shrink-0 mt-0.5", meta.color)}>{meta.label}</span>
                  <div className="min-w-0">
                    <p className="text-sm text-slate-600">
                      <span className="font-bold text-navy">{userName(a.userId)}</span>{a.detail ? ` · ${a.detail}` : ''}
                    </p>
                    <p className="text-[9px] text-slate-400 flex items-center gap-1"><Clock4 size={9} /> {formatDateTime(a.at)}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <Pagination page={auditPage} totalPages={auditPageCount} onPage={setAuditPage} />
        </SectionCard>
      )}

      {/* Dialog Tidak Bekerja */}
      <Dialog open={showNoWork} onOpenChange={setShowNoWork}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg text-navy">Tidak Bekerja Hari Ini</DialogTitle>
            <DialogDescription className="text-xs text-slate-400">Tidak akan dibuatkan absensi fiktif. Ini cukup agar owner tidak menanyakannya.</DialogDescription>
          </DialogHeader>
          <div className="flex items-start gap-2.5 rounded-xl border border-slate-200 p-3">
            <Checkbox id="agree-nw" checked={agree} onCheckedChange={(v) => setAgree(Boolean(v))} />
            <label htmlFor="agree-nw" className="text-[11px] text-slate-500 leading-relaxed">
              Saya menyatakan <b>tidak bekerja</b> pada hari ini.
            </label>
          </div>
          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setShowNoWork(false)}>Batal</Button>
            <Button onClick={submitNoWork} disabled={!agree} className="bg-navy text-white">Konfirmasi</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
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

function CorrectionBadge({ status }: { status: 'pending' | 'approved' | 'rejected' }) {
  const map = {
    pending: { label: 'Menunggu Persetujuan', color: 'bg-amber-100 text-amber-700' },
    approved: { label: 'Disetujui', color: 'bg-emerald-100 text-emerald-700' },
    rejected: { label: 'Ditolak', color: 'bg-red-100 text-red-700' },
  } as const;
  const m = map[status];
  return <span className={cn("px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest", m.color)}>{m.label}</span>;
}