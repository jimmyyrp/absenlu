import type { OpsState, OpsUser, DecorProject, Task, Attendance, Activity, ActivityPhoto, Expense, DecorStatus, AttendanceCorrection, AuditEntry } from './types';
import { DECOR_CATEGORIES, EXPENSE_CATEGORIES } from './types';

const now = new Date();

function iso(d: Date) {
  return d.toISOString();
}

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

function monthStrMonthsAgo(monthsAgo: number) {
  const d = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

let idCounter = 0;
function nid(prefix: string) {
  return `${prefix}${++idCounter}`;
}

// ── Users ─────────────────────────────────────────────────────────────────
const users: OpsUser[] = [
  { id: 'u1', name: 'Owner BluDecor', username: 'owner', role: 'owner', phone: '081234567890', active: true, createdAt: atOffset(400, 9) },
  { id: 'u2', name: 'Admin Kantor', username: 'admin', role: 'admin', phone: '081233344455', active: true, createdAt: atOffset(380, 10) },
];
const freelancerNames = [
  'Jimmy', 'Rian', 'Fikri', 'Doni', 'Andre', 'Bimo', 'Cahya', 'Dewi', 'Ega', 'Farhan',
  'Gilang', 'Hendra', 'Iqbal', 'Jefri', 'Kevin', 'Lukman', 'Mega',
];
freelancerNames.forEach((name, i) => {
  users.push({
    id: `u${i + 3}`,
    name,
    username: name.toLowerCase(),
    role: 'freelancer',
    phone: `08${(100000000 + i * 999).toString()}`,
    active: true,
    createdAt: atOffset(360 - i * 7, 9),
  });
});
const freelancerIds = users.filter((u) => u.role === 'freelancer').map((u) => u.id);

// ── Decors ────────────────────────────────────────────────────────────────
const decorDefs: { name: string; client: string; category: string; days: number; location: string; status: DecorStatus; revenue: number }[] = [
  { name: 'Pernikahan Rina & Aldi', client: 'Rina & Aldi', category: 'Pernikahan', days: 5, location: 'Hotel Pangeran, Padang', status: 'ongoing', revenue: 8500000 },
  { name: 'Pernikahan Andi & Siska', client: 'Andi & Siska', category: 'Pernikahan', days: 10, location: 'Hotel Grand Inna, Padang', status: 'persiapan', revenue: 10500000 },
  { name: 'Ulang Tahun Kevin', client: 'Keluarga Kevin', category: 'Ulang Tahun', days: 8, location: 'Rumah Kevin, Padang', status: 'persiapan', revenue: 3200000 },
  { name: 'Acara Perusahaan PT Maju Jaya', client: 'PT Maju Jaya', category: 'Acara Perusahaan', days: 12, location: 'Grand Ballroom, Padang', status: 'ready', revenue: 12000000 },
  { name: 'Backdrop Hotel Azizi', client: 'Hotel Azizi', category: 'Backdrop', days: -6, location: 'Hotel Azizi, Padang', status: 'selesai', revenue: 25000000 },
  { name: 'Wisuda Unand', client: 'Universitas Andalas', category: 'Wisuda', days: -10, location: 'GOR H Agus Salim', status: 'selesai', revenue: 30000000 },
  { name: 'Lamaran Maya & Bayu', client: 'Maya & Bayu', category: 'Lamaran', days: 14, location: 'Rumah keluarga', status: 'draft', revenue: 4200000 },
  { name: 'Peluncuran Produk Kopi', client: 'Kopi Nusantara', category: 'Peluncuran', days: 3, location: 'Mall Pelayanan Publik', status: 'ongoing', revenue: 7800000 },
  { name: 'Seminar Teknologi', client: 'STMIK Padang', category: 'Seminar', days: -18, location: 'Aula Kampus', status: 'selesai', revenue: 9500000 },
  { name: 'Booth Pameran UMKM', client: 'Dinas Koperasi', category: 'Pameran', days: -24, location: 'GOR H Agus Salim', status: 'selesai', revenue: 5600000 },
  { name: 'Pesta Sweet 17 Zara', client: 'Keluarga Zara', category: 'Pesta', days: 6, location: 'Grand Ballroom', status: 'persiapan', revenue: 6800000 },
  { name: 'Dekorasi Panggung Fest', client: 'Dinas Pariwisata', category: 'Dekorasi Panggung', days: -15, location: 'Pantai Padang', status: 'selesai', revenue: 15000000 },
  { name: 'Dekorasi Bunga Sari', client: 'Sari & Doni', category: 'Dekorasi Bunga', days: -30, location: 'Hotel Pangeran', status: 'selesai', revenue: 4200000 },
  { name: 'Dekorasi Meja Restoran', client: 'Restoran Sederhana', category: 'Dekorasi Meja', days: -40, location: 'Restoran Jl. Khatib', status: 'selesai', revenue: 2600000 },
  { name: 'Fotobox Event Bank', client: 'Bank SUMBAR', category: 'Booth', days: -35, location: 'Kantor Bank SUMBAR', status: 'selesai', revenue: 4800000 },
  { name: 'Aqiqah Keluarga Rizki', client: 'Keluarga Rizki', category: 'Pesta', days: 4, location: 'Rumah Rizki', status: 'ready', revenue: 2800000 },
  { name: 'Pameran Furniture', client: 'Furniture Jaya', category: 'Pameran', days: 20, location: 'Convention Centre', status: 'draft', revenue: 6000000 },
  { name: 'Pernikahan Pelaminan Tari', client: 'Tari & Budi', category: 'Pernikahan', days: -45, location: 'Kampung Bandar', status: 'selesai', revenue: 7200000 },
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
  note: 'Project dekorasi BluDecor.',
  createdAt: atOffset(Math.max(10, 60 - decorDefs.indexOf(d) * 2), 10),
}));

// ── Tasks ────────────────────────────────────────────────────────────────
const taskTemplate = [
  'Survey lokasi', 'Ambil backdrop', 'Muat barang', 'Transportasi', 'Pemasangan backdrop',
  'Pemasangan panggung', 'Pemasangan bunga', 'Pencahayaan', 'Penyelesaian', 'Dokumentasi', 'Bongkar dekor', 'Pembersihan',
];
const taskCategories = ['Persiapan', 'Transportasi', 'Muat Barang', 'Penyetelan', 'Dekorasi', 'Pencahayaan', 'Bunga', 'Penyelesaian', 'Dokumentasi', 'Bongkar', 'Pembersihan'];

const tasks: Task[] = [];
decors.forEach((decor, di) => {
  const count = 8 + (di % 5);
  for (let t = 0; t < count; t++) {
    const done = decor.status === 'selesai' || (decor.status !== 'draft' && t < 3);
    const status: Task['status'] = done ? 'selesai' : (t === 3 ? 'dikerjakan' : 'belum');
    tasks.push({
      id: `t${taskTemplate.length + di * 20 + t}`,
      decorId: decor.id,
      title: taskTemplate[t % taskTemplate.length],
      category: taskCategories[t % taskCategories.length],
      status,
      assigneeId: taskTemplate[t % taskTemplate.length] === 'Pencahayaan' ? freelancerIds[t % freelancerIds.length] : freelancerIds[(t + di) % freelancerIds.length],
      priority: t % 5 === 0 ? 'tinggi' : 'normal',
      deadline: decor.date,
      order: t,
    });
  }
});

// ── Attendance (1 sesi per user per hari, ~6 bulan) ───────────────────────
const attendance: Attendance[] = [];
const daysToCover = 170;
function isWeekdayDummy(dayOffset: number) {
  const d = new Date(now);
  d.setDate(d.getDate() - dayOffset);
  const day = d.getDay();
  return day !== 0 && day !== 6;
}
const activeDecorsSeed = decors.filter((d) => d.status !== 'dibatalkan');
for (let day = 0; day < daysToCover; day++) {
  if (!isWeekdayDummy(day)) continue;
  const date = dateStr(day);
  // Sebagian freelancer bekerja hari itu (self-report: mengisi atau tidak)
  const working = Math.min(freelancerIds.length, 9 + (day % 7));
  for (let k = 0; k < working; k++) {
    const userId = freelancerIds[(day * 3 + k * 5) % freelancerIds.length];
    const decor = activeDecorsSeed[(day + k) % activeDecorsSeed.length];
    const inH = 7 + ((day + k) % 3);
    const inM = ((k * 13 + day) % 60);
    const outH = 15 + ((day + k) % 3);
    const outM = ((k * 7 + 20 + day) % 60);
    const hadir = (day + k) % 17 !== 0;
    const createdAt = atOffset(day, inH, inM);
    attendance.push({
        id: nid('a'),
        userId,
        date,
        status: hadir ? 'selesai' : 'tidak-bekerja',
        decorId: decor.id,
        checkIn: hadir ? `${inH}:${inM < 10 ? '0' : ''}${inM}` : undefined,
        checkOut: hadir ? `${outH}:${outM < 10 ? '0' : ''}${outM}` : undefined,
        note: hadir ? undefined : 'Hari ini tidak bekerja.',
        device: 'Chrome / Android',
        createdAt,
        updatedAt: hadir ? atOffset(day, outH, outM) : undefined,
      });
    }
}

// ── Corrections & Audit (contoh untuk demo) ──────────────────────────────
const corrections: AttendanceCorrection[] = [];
const today0 = dateStr(0);
const myRec = attendance.find((a) => a.userId === 'u3' && a.date === today0) || attendance.find((a) => a.userId === 'u3');
const simRec = attendance.find((a) => a.userId === 'u4' && a.date === dateStr(1));
if (myRec) {
  corrections.push({
    id: 'c1',
    attendanceId: myRec.id,
    userId: myRec.userId,
    date: myRec.date,
    requestedCheckOut: '17:05',
    reason: 'Lupa melakukan checkout.',
    detail: 'Selesai pemasangan lalu langsung bantu loading barang, jadi lupa catat pulang.',
    status: 'pending',
    createdAt: atOffset(0, 15, 14),
  });
}
if (simRec) {
  corrections.push({
    id: 'c2',
    attendanceId: simRec.id,
    userId: simRec.userId,
    date: simRec.date,
    requestedCheckIn: '08:02',
    reason: 'HP mati saat absen masuk, diisi setelah sampai lokasi.',
    status: 'pending',
    createdAt: atOffset(1, 8, 40),
  });
}

const audit: AuditEntry[] = [
  { id: nid('au'), at: atOffset(0, 8, 32), userId: 'u3', action: 'absensi.masuk', detail: 'Absen masuk 08:32 · Pernikahan Rina & Aldi', targetId: myRec?.id },
  { id: nid('au'), at: atOffset(0, 15, 14), userId: 'u3', action: 'koreksi.ajukan', detail: 'Mengajukan koreksi jam pulang (15:20)', targetId: 'c1' },
  { id: nid('au'), at: atOffset(1, 8, 40), userId: 'u4', action: 'koreksi.ajukan', detail: 'Mengajukan koreksi jam masuk (08:02)', targetId: 'c2' },
  { id: nid('au'), at: atOffset(2, 16, 20), userId: 'u1', action: 'koreksi.setujui', detail: 'Menyetujui koreksi absensi', targetId: 'c0' },
  { id: nid('au'), at: atOffset(3, 9, 5), userId: 'u6', action: 'absensi.masuk', detail: 'Absen masuk 09:05 · Peluncuran Produk Kopi', targetId: undefined },
  { id: nid('au'), at: atOffset(3, 18, 2), userId: 'u6', action: 'absensi.pulang', detail: 'Absen pulang 18:02', targetId: undefined },
];

// ── Activities ───────────────────────────────────────────────────────────
const activities: Activity[] = [];
const activityTypes = ['Muat Barang', 'Pemasangan', 'Penyelesaian', 'Bongkar', 'Dokumentasi', 'Perawatan', 'Lainnya'];
let activityId = 0;
for (let i = 0; i < 286; i++) {
  const day = i % daysToCover;
  const decor = decors[day % decors.length];
  const userId = freelancerIds[(i * 7) % freelancerIds.length];
  const hours = 8 + (i % 9);
  const mins = (i * 11) % 60;
  const d = new Date(now);
  d.setDate(d.getDate() - day);
  d.setHours(hours, mins, 0, 0);
  activities.push({
    id: `act${++activityId}`,
    decorId: decor.id,
    userId,
    activityType: activityTypes[i % activityTypes.length],
    description: `Aktivitas ${activityTypes[i % activityTypes.length]} untuk ${decor.name}`,
    status: i % 17 === 0 ? 'terhambat' : 'selesai',
    note: i % 5 === 0 ? `Catatan aktivitas ke-${i + 1}` : undefined,
    at: d.toISOString(),
  });
}

// ── Photos ───────────────────────────────────────────────────────────────
const photos: ActivityPhoto[] = [
  { id: 'p1', decorId: 'd1', userId: 'u4', caption: 'Muat barang ke lokasi', dataUrl: '', at: atOffset(1, 10, 0) },
  { id: 'p2', decorId: 'd1', userId: 'u3', caption: 'Pemasangan backdrop pelaminan', dataUrl: '', at: atOffset(0, 11, 20) },
  { id: 'p3', decorId: 'd5', userId: 'u4', caption: 'Backdrop hotel selesai', dataUrl: '', at: atOffset(5, 16, 0) },
];

// ── Expenses (spanning ~6 months) ────────────────────────────────────────
const expenses: Expense[] = [];
let expenseId = 0;
const expenseKinds: [string, string, (d: DecorProject) => boolean][] = [
  ['BBM kendaraan', 'BBM', () => true],
  ['Sewa truk angkut', 'Sewa Kendaraan', () => true],
  ['Bunga artificial', 'Bunga', () => true],
  ['Kain backdrop', 'Kain', () => true],
  ['Printing backdrop', 'Printing', () => true],
  ['Honor freelancer setup', 'Freelancer', () => true],
  ['Helper harian', 'Harian', () => true],
  ['Kabel & pencahayaan', 'Lighting', () => true],
  ['Balon & pita', 'Balon', () => true],
  ['Konsumsi tim', 'Konsumsi', () => true],
  ['Tol & parkir', 'Tol', () => true],
  ['Dokumentasi', 'Dokumentasi', () => true],
  ['Kayu & properti', 'Kayu', () => true],
  ['Akrilik dekor', 'Akrilik', () => true],
  ['Listrik kantor', 'Listrik', () => true],
];
for (let i = 0; i < 60; i++) {
  const day = i % daysToCover;
  const decor = decors[day % decors.length];
  const [desc, cat] = expenseKinds[i % expenseKinds.length];
  expenses.push({
    id: nid('e'),
    decorId: Math.random() > 0.25 ? decor.id : undefined,
    description: `${desc} — ${decor.name}`,
    category: cat,
    amount: (250000 + ((i * 137) % 12) * 125000) * (Math.floor(i / 60) + 1),
    date: dateStr(day),
    createdAt: atOffset(day, 17, 0),
  });
}

// ── Settings ─────────────────────────────────────────────────────────────
const settings = {
  appName: 'BLUDECOR OPS',
  attendanceRequired: false,
  activityTypes: [...activityTypes],
  taskCategories: [...taskCategories],
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

export { monthStrMonthsAgo };
