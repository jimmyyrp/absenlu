export type UserRole = 'owner' | 'admin' | 'developer' | 'crew';

export interface OpsUser {
  id: string;
  name: string;
  username: string;
  role: UserRole;
  phone?: string;
  active: boolean;
  createdAt: string;
}

export type DecorStatus = 'draft' | 'persiapan' | 'ready' | 'ongoing' | 'selesai' | 'dibatalkan';

export const DECOR_STATUSES: { value: DecorStatus; label: string; color: string }[] = [
  { value: 'draft', label: 'Draf', color: 'bg-slate-400' },
  { value: 'persiapan', label: 'Persiapan', color: 'bg-amber-500' },
  { value: 'ready', label: 'Siap', color: 'bg-sky-500' },
  { value: 'ongoing', label: 'Sedang Berjalan', color: 'bg-indigo-500' },
  { value: 'selesai', label: 'Selesai', color: 'bg-emerald-500' },
  { value: 'dibatalkan', label: 'Dibatalkan', color: 'bg-red-500' },
];

export const DECOR_STATUS_LABEL: Record<DecorStatus, string> = {
  draft: 'Draf',
  persiapan: 'Persiapan',
  ready: 'Siap',
  ongoing: 'Sedang Berjalan',
  selesai: 'Selesai',
  dibatalkan: 'Dibatalkan',
};

export const DECOR_STATUS_COLOR: Record<DecorStatus, string> = {
  draft: 'bg-slate-400',
  persiapan: 'bg-amber-500',
  ready: 'bg-sky-500',
  ongoing: 'bg-indigo-500',
  selesai: 'bg-emerald-500',
  dibatalkan: 'bg-red-500',
};

export interface DecorProject {
  id: string;
  name: string;
  client?: string;
  eventType: string;
  category: string;
  date: string;
  location: string;
  status: DecorStatus;
  revenue?: number; // omzet / nilai project
  workStart?: string; // HH:mm — jam mulai jadwal kerja decor
  workEnd?: string; // HH:mm — jam selesai jadwal kerja decor
  note?: string;
  createdAt: string;
}

export const DECOR_CATEGORIES = [
  'Pernikahan', 'Lamaran', 'Ulang Tahun', 'Acara Perusahaan', 'Gathering', 'Seminar',
  'Peluncuran', 'Pameran', 'Booth', 'Wisuda', 'Pesta', 'Dekorasi Rumah',
  'Dekorasi Gedung', 'Dekorasi Panggung', 'Backdrop', 'Dekorasi Meja',
  'Dekorasi Bunga', 'Dekorasi Custom',
] as const;

export const EXPENSE_CATEGORIES = [
  'Operasional', 'Transportasi', 'BBM', 'Parkir', 'Tol', 'Sewa Kendaraan', 'Kurir', 'Logistik',
  'Material Decor', 'Bunga', 'Kain', 'Backdrop', 'Kayu', 'Akrilik', 'Balon', 'Pita', 'Lem',
  'Kabel', 'Lighting', 'Properti', 'Printing',
  'Tenaga Kerja', 'Harian', 'Helper', 'Driver', 'Crew', 'Lembur',
  'Operasional Kantor', 'Listrik', 'Internet', 'Sewa', 'ATK', 'Maintenance', 'Peralatan',
  'Lainnya', 'Konsumsi', 'Dokumentasi', 'Administrasi', 'Marketing', 'Biaya Tak Terduga',
] as const;

export const EXPENSE_GROUPS = [
  { label: 'Transportasi & Logistik', colors: 'bg-sky-100 text-sky-700', keys: ['Transportasi', 'BBM', 'Parkir', 'Tol', 'Sewa Kendaraan', 'Kurir', 'Logistik', 'Operasional'] },
  { label: 'Material Decor', colors: 'bg-emerald-100 text-emerald-700', keys: ['Material Decor', 'Bunga', 'Kain', 'Backdrop', 'Kayu', 'Akrilik', 'Balon', 'Pita', 'Lem', 'Kabel', 'Lighting', 'Properti', 'Printing'] },
  { label: 'Tenaga Kerja', colors: 'bg-amber-100 text-amber-700', keys: ['Tenaga Kerja', 'Harian', 'Helper', 'Driver', 'Crew', 'Lembur'] },
  { label: 'Operasional Kantor', colors: 'bg-indigo-100 text-indigo-700', keys: ['Operasional Kantor', 'Listrik', 'Internet', 'Sewa', 'ATK', 'Maintenance', 'Peralatan'] },
  { label: 'Lainnya', colors: 'bg-slate-100 text-slate-600', keys: ['Lainnya', 'Konsumsi', 'Dokumentasi', 'Administrasi', 'Marketing', 'Biaya Tak Terduga'] },
];

export interface Expense {
  id: string;
  decorId?: string;
  description: string;
  category: string;
  amount: number;
  date: string; // YYYY-MM-DD
  createdAt: string;
}

export const TASK_CATEGORIES = [
  'Persiapan', 'Transportasi', 'Muat Barang', 'Penyetelan', 'Dekorasi', 'Pencahayaan',
  'Bunga', 'Penyelesaian', 'Dokumentasi', 'Bongkar', 'Pembersihan',
] as const;

export type TaskPriority = 'rendah' | 'normal' | 'tinggi';

export type TaskStatus = 'belum' | 'dikerjakan' | 'selesai' | 'terhambat';

export const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
  belum: 'Belum Dikerjakan',
  dikerjakan: 'Sedang Dikerjakan',
  selesai: 'Selesai',
  terhambat: 'Terhambat',
};

export const TASK_STATUS_COLOR: Record<TaskStatus, string> = {
  belum: 'bg-slate-400',
  dikerjakan: 'bg-amber-500',
  selesai: 'bg-emerald-500',
  terhambat: 'bg-red-500',
};

export interface Task {
  id: string;
  decorId: string;
  title: string;
  category?: string;
  status: TaskStatus;
  assigneeId?: string;
  priority?: TaskPriority;
  deadline?: string;
  order: number;
}

export type AttendanceStatus = 'hadir' | 'selesai' | 'tidak-bekerja' | 'tidak-mengisi';

export const ATTENDANCE_STATUS_LABEL: Record<AttendanceStatus, string> = {
  hadir: 'Sedang Bekerja',
  selesai: 'Selesai Bekerja',
  'tidak-bekerja': 'Tidak Bekerja',
  'tidak-mengisi': 'Tidak Mengisi',
};

export const ATTENDANCE_STATUS_COLOR: Record<AttendanceStatus, string> = {
  hadir: 'bg-emerald-500',
  selesai: 'bg-sky-500',
  'tidak-bekerja': 'bg-slate-400',
  'tidak-mengisi': 'bg-slate-300',
};

export interface Attendance {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  decorId?: string; // project yang dipilih saat absen masuk
  checkIn?: string; // HH:mm (waktu-klik, tidak bisa diedit langsung)
  checkOut?: string; // HH:mm
  note?: string;
  device?: string;
  createdAt: string;
  updatedAt?: string;
}

export type CorrectionStatus = 'pending' | 'approved' | 'rejected';

export interface AttendanceCorrection {
  id: string;
  attendanceId: string;
  userId: string;
  date: string;
  requestedCheckIn?: string;
  requestedCheckOut?: string;
  reason: string;
  detail?: string;
  status: CorrectionStatus;
  createdAt: string;
  decidedAt?: string;
  decidedBy?: string;
}

export interface AuditEntry {
  id: string;
  at: string; // ISO timestamp
  userId: string;
  action: string; // mis. 'absensi.masuk', 'absensi.pulang', 'koreksi.ajukan', 'koreksi.setujui'
  detail?: string;
  targetId?: string;
}

export interface Activity {
  id: string;
  decorId: string;
  userId: string;
  taskId?: string;
  activityType: string;
  description: string;
  status: 'selesai' | 'dikerjakan' | 'terhambat' | 'pending';
  note?: string;
  at: string; // ISO timestamp
}

export interface ActivityPhoto {
  id: string;
  decorId: string;
  userId: string;
  caption?: string;
  dataUrl: string;
  at: string;
}

export interface SystemSettings {
  appName: string;
  attendanceRequired: boolean;
  activityTypes: string[];
  taskTemplate: string[];
  taskCategories: string[];
  decorCategories: string[];
  expenseCategories: string[];
}

export interface OpsState {
  users: OpsUser[];
  decors: DecorProject[];
  tasks: Task[];
  attendance: Attendance[];
  activities: Activity[];
  photos: ActivityPhoto[];
  expenses: Expense[];
  corrections: AttendanceCorrection[];
  audit: AuditEntry[];
  settings: SystemSettings;
  currentUserId: string;
  selectedDecorId: string;
  monthlyReportMonth: string; // YYYY-MM
}
