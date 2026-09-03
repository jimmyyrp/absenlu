import type { OpsState, OpsUser, DecorProject, Task, Attendance, Activity, ActivityPhoto, Expense, DecorStatus, AttendanceCorrection, AuditEntry } from './types';
import { DECOR_CATEGORIES, EXPENSE_CATEGORIES } from './types';

const now = new Date();

function atOffset(days: number, h: number, m = 0) {
  const d = new Date(now);
  d.setDate(d.getDate() - days);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}

function dateStr(daysAgo: number) {
  const d = new Date(now);
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

function datePlus(days: number) {
  const d = new Date(now);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

// ── Users ─────────────────────────────────────────────────────────────────
const users: OpsUser[] = [
  { id: 'u1', name: 'Owner BluDecor', username: 'owner', role: 'owner', phone: '081234567890', active: true, createdAt: atOffset(400, 9) },
  { id: 'u2', name: 'Admin Kantor', username: 'admin', role: 'admin', phone: '081233344455', active: true, createdAt: atOffset(380, 10) },
  { id: 'u3', name: 'Rian', username: 'rian123', role: 'crew', phone: '081234567001', active: true, createdAt: atOffset(300, 9) },
  { id: 'u4', name: 'Fikri', username: 'fikri123', role: 'crew', phone: '081234567002', active: true, createdAt: atOffset(280, 9) },
  { id: 'u5', name: 'Doni', username: 'doni123', role: 'crew', phone: '081234567003', active: true, createdAt: atOffset(260, 9) },
];

const crewIds = ['u3', 'u4', 'u5'];

// ── Decors ────────────────────────────────────────────────────────────────
const decorDefs: { name: string; client: string; category: string; days: number; location: string; status: DecorStatus; revenue: number; workStart: string; workEnd: string }[] = [
  { name: 'Pernikahan Rina & Aldi', client: 'Rina & Aldi', category: 'Pernikahan', days: 5, location: 'Hotel Pangeran, Padang', status: 'ongoing', revenue: 8500000, workStart: '08:00', workEnd: '17:00' },
  { name: 'Pernikahan Andi & Siska', client: 'Andi & Siska', category: 'Pernikahan', days: 10, location: 'Hotel Grand Inna, Padang', status: 'persiapan', revenue: 10500000, workStart: '07:00', workEnd: '16:00' },
  { name: 'Acara PT Maju Jaya', client: 'PT Maju Jaya', category: 'Acara Perusahaan', days: 12, location: 'Grand Ballroom, Padang', status: 'ready', revenue: 12000000, workStart: '09:00', workEnd: '18:00' },
  { name: 'Backdrop Hotel Azizi', client: 'Hotel Azizi', category: 'Backdrop', days: -6, location: 'Hotel Azizi, Padang', status: 'selesai', revenue: 25000000, workStart: '', workEnd: '' },
];

const decors: DecorProject[] = decorDefs.map((d) => ({
  id: `d${decorDefs.indexOf(d) + 1}`,
  name: d.name,
  client: d.client,
  eventType: d.category,
  category: d.category,
  date: datePlus(d.days),
  location: d.location,
  status: d.status,
  revenue: d.revenue,
  workStart: d.workStart || undefined,
  workEnd: d.workEnd || undefined,
  note: '',
  createdAt: atOffset(Math.max(10, 60 - decorDefs.indexOf(d) * 2), 10),
}));

// ── Tasks (simpel) ────────────────────────────────────────────────────────
const taskTemplate = [
  'Persiapan', 'Pemasangan', 'Penyelesaian', 'Bongkar',
];

const tasks: Task[] = [];
decors.forEach((decor, di) => {
  const count = 4 + (di % 3);
  for (let t = 0; t < count; t++) {
    const done = decor.status === 'selesai' || (decor.status !== 'draft' && t < 2);
    const status: Task['status'] = done ? 'selesai' : (t === 2 ? 'dikerjakan' : 'belum');
    tasks.push({
      id: `t${di * 10 + t}`,
      decorId: decor.id,
      title: taskTemplate[t % taskTemplate.length],
      category: taskTemplate[t % taskTemplate.length],
      status,
      assigneeId: crewIds[(t + di) % crewIds.length],
      priority: t === 0 ? 'tinggi' : 'normal',
      deadline: decor.date,
      order: t,
    });
  }
});

// ── Attendance (3 crew, ~2 minggu terakhir) ────────────────────────
const attendance: Attendance[] = [];
const daysToCover = 14;
function isWeekday(dayOffset: number) {
  const d = new Date(now);
  d.setDate(d.getDate() - dayOffset);
  const day = d.getDay();
  return day !== 0 && day !== 6;
}
const activeDecorsSeed = decors.filter((d) => d.status !== 'dibatalkan');
for (let day = 0; day < daysToCover; day++) {
  if (!isWeekday(day)) continue;
  const date = dateStr(day);
  for (let k = 0; k < crewIds.length; k++) {
    const userId = crewIds[k];
    const decor = activeDecorsSeed[(day + k) % activeDecorsSeed.length];
    const inH = 7 + ((day + k) % 2);
    const inM = ((k * 13 + day) % 60);
    const outH = 16 + ((day + k) % 2);
    const outM = ((k * 7 + 20 + day) % 60);
    const hadir = (day + k) % 10 !== 0;
    attendance.push({
      id: `a${day}_${k}`,
      userId,
      date,
      status: hadir ? 'selesai' : 'tidak-bekerja',
      decorId: decor.id,
      checkIn: hadir ? `${inH}:${inM < 10 ? '0' : ''}${inM}` : undefined,
      checkOut: hadir ? `${outH}:${outM < 10 ? '0' : ''}${outM}` : undefined,
      note: hadir ? undefined : 'Hari ini tidak bekerja.',
      device: 'Chrome / Android',
      createdAt: atOffset(day, inH, inM),
      updatedAt: hadir ? atOffset(day, outH, outM) : undefined,
    });
  }
}

// ── Corrections ──────────────────────────────────────────────────────────
const corrections: AttendanceCorrection[] = [];
const today0 = dateStr(0);
const myRec = attendance.find((a) => a.userId === 'u3' && a.date === today0) || attendance.find((a) => a.userId === 'u3');
if (myRec) {
  corrections.push({
    id: 'c1',
    attendanceId: myRec.id,
    userId: myRec.userId,
    date: myRec.date,
    requestedCheckOut: '17:05',
    reason: 'Lupa melakukan checkout.',
    status: 'pending',
    createdAt: atOffset(0, 15, 14),
  });
}

const audit: AuditEntry[] = [
  { id: 'au1', at: atOffset(0, 8, 32), userId: 'u3', action: 'absensi.masuk', detail: 'Absen masuk 08:32 · Pernikahan Rina & Aldi', targetId: myRec?.id },
  { id: 'au2', at: atOffset(0, 15, 14), userId: 'u3', action: 'koreksi.ajukan', detail: 'Mengajukan koreksi jam pulang', targetId: 'c1' },
];

// ── Activities (sedikit saja) ────────────────────────────────────────────
const activities: Activity[] = [];
const activityTypes = ['Pemasangan', 'Penyelesaian', 'Bongkar'];
let activityId = 0;
for (let i = 0; i < 12; i++) {
  const day = i % daysToCover;
  const decor = decors[day % decors.length];
  const userId = crewIds[i % crewIds.length];
  const d = new Date(now);
  d.setDate(d.getDate() - day);
  d.setHours(9 + (i % 8), (i * 11) % 60, 0, 0);
  activities.push({
    id: `act${++activityId}`,
    decorId: decor.id,
    userId,
    activityType: activityTypes[i % activityTypes.length],
    description: `${activityTypes[i % activityTypes.length]} — ${decor.name}`,
    status: 'selesai',
    at: d.toISOString(),
  });
}

// ── Photos ───────────────────────────────────────────────────────────────
const photos: ActivityPhoto[] = [
  { id: 'p1', decorId: 'd1', userId: 'u4', caption: 'Muat barang ke lokasi', dataUrl: '', at: atOffset(1, 10, 0) },
  { id: 'p2', decorId: 'd1', userId: 'u3', caption: 'Pemasangan backdrop', dataUrl: '', at: atOffset(0, 11, 20) },
];

// ── Expenses (sedikit) ───────────────────────────────────────────────────
const expenses: Expense[] = [
  { id: 'e1', decorId: 'd1', description: 'Bunga artificial', category: 'Bunga', amount: 350000, date: dateStr(1), createdAt: atOffset(1, 17, 0) },
  { id: 'e2', decorId: 'd1', description: 'Kain backdrop', category: 'Kain', amount: 500000, date: dateStr(2), createdAt: atOffset(2, 17, 0) },
  { id: 'e3', decorId: 'd2', description: 'Printing backdrop', category: 'Printing', amount: 800000, date: dateStr(3), createdAt: atOffset(3, 17, 0) },
];

// ── Settings ─────────────────────────────────────────────────────────────
const settings = {
  appName: 'BLUDECOR OPS',
  attendanceRequired: false,
  activityTypes: [...activityTypes],
  taskCategories: [...taskTemplate],
  decorCategories: [...DECOR_CATEGORIES],
  expenseCategories: [...EXPENSE_CATEGORIES],
  taskTemplate: [...taskTemplate],
};

export const SEED_STATE: OpsState = {
  currentUserId: 'u1',
  monthlyReportMonth: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
  selectedDecorId: 'd1',
  users,
  decors,
  tasks,
  attendance,
  activities,
  photos,
  expenses,
  corrections,
  audit,
  settings,
};
