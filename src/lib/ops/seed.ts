import type { OpsState } from './types';
import { DECOR_CATEGORIES, EXPENSE_CATEGORIES } from './types';

const now = new Date();

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
  currentUserId: '',
  monthlyReportMonth: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
  selectedDecorId: '',
  users: [],
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
