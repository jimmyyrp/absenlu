import type { OpsState, OpsUser } from './types';
import { DECOR_CATEGORIES, EXPENSE_CATEGORIES } from './types';

const now = new Date();

function atOffset(days: number, h: number, m = 0) {
  const d = new Date(now);
  d.setDate(d.getDate() - days);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}

// ── Users ─────────────────────────────────────────────────────────────────
// Hanya Owner & Admin. Tanpa data dummy (crew, decor, absensi, dll).
const users: OpsUser[] = [
  { id: 'u1', name: 'Owner BluDecor', username: 'owner', role: 'owner', phone: '081234567890', active: true, createdAt: atOffset(400, 9) },
  { id: 'u2', name: 'Admin Kantor', username: 'admin', role: 'admin', phone: '081233344455', active: true, createdAt: atOffset(380, 10) },
];

const taskTemplate = [
  'Persiapan', 'Pemasangan', 'Penyelesaian', 'Bongkar',
];

const settings = {
  appName: 'BLUDECOR OPS',
  attendanceRequired: false,
  activityTypes: ['Pemasangan', 'Penyelesaian', 'Bongkar', 'Dokumentasi'],
  taskCategories: [...taskTemplate],
  decorCategories: [...DECOR_CATEGORIES],
  expenseCategories: [...EXPENSE_CATEGORIES],
  taskTemplate: [...taskTemplate],
};

export const SEED_STATE: OpsState = {
  currentUserId: 'u1',
  monthlyReportMonth: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
  selectedDecorId: '',
  users,
  decors: [],
  tasks: [],
  attendance: [],
  activities: [],
  photos: [],
  expenses: [],
  corrections: [],
  audit: [],
  settings,
};
