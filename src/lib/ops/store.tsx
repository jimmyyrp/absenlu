'use client';

import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import type {
  OpsState, OpsUser, DecorProject, Task, Attendance, Activity, ActivityPhoto, Expense,
  AttendanceCorrection, AuditEntry,
  TaskStatus, AttendanceStatus, DecorStatus,
} from './types';
import { SEED_STATE } from './seed';
import { opsUserId, opsRole, opsLogout } from './auth';

const STORAGE_KEY = 'bludecor_ops_state_v3';

type UID = () => string;
const uid: UID = () =>
  Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);

function nowTime() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

interface OpsContextValue {
  state: OpsState;
  currentUser: OpsUser;
  selectedDecor: DecorProject | undefined;
  decors: DecorProject[];
  activeDecors: DecorProject[];
  tasks: Task[];
  activities: Activity[];
  attendance: Attendance[];
  photos: ActivityPhoto[];
  expenses: Expense[];
  // decor
  addDecor: (d: Partial<DecorProject>) => DecorProject;
  updateDecor: (id: string, patch: Partial<DecorProject>) => void;
  deleteDecor: (id: string) => void;
  // users
  addUser: (u: Omit<OpsUser, 'id' | 'createdAt'>) => void;
  updateUser: (id: string, patch: Partial<OpsUser>) => void;
  deleteUser: (id: string) => void;
  setCurrentUser: (id: string) => void;
  // tasks
  addTask: (t: Omit<Task, 'id' | 'order'>) => void;
  updateTask: (id: string, patch: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTask: (id: string) => void;
  // attendance — 1 sesi per user per hari (self-report + audit)
  attendanceForDate: (date: string) => Record<string, Attendance>;
  clockIn: (userId: string, date: string, decorId?: string, note?: string, device?: string) => Attendance | null;
  clockOut: (userId: string, date: string) => void;
  declareNoWork: (userId: string, date: string) => void;
  deleteSession: (userId: string, date: string) => void;
  // corrections
  corrections: AttendanceCorrection[];
  requestCorrection: (userId: string, date: string, patch: { requestedCheckIn?: string; requestedCheckOut?: string; reason: string; detail?: string }) => void;
  approveCorrection: (id: string, decidedBy: string) => void;
  rejectCorrection: (id: string, decidedBy: string) => void;
  // audit
  audit: AuditEntry[];
  addAudit: (userId: string, action: string, detail?: string, targetId?: string) => void;
  // activities
  addActivity: (a: Omit<Activity, 'id' | 'at'>) => Activity;
  deleteActivity: (id: string) => void;
  activitiesForProject: (decorId: string) => Activity[];
  // photos
  addPhoto: (p: Omit<ActivityPhoto, 'id' | 'at'>) => ActivityPhoto;
  deletePhoto: (id: string) => void;
  photosForProject: (decorId: string) => ActivityPhoto[];
  // expenses
  addExpense: (e: Omit<Expense, 'id' | 'createdAt'>) => void;
  updateExpense: (id: string, patch: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;
  expensesForProject: (decorId: string) => Expense[];
  // financial helpers
  decorExpenseTotal: (decorId: string) => number;
  decorProfit: (decorId: string) => number;
  // settings
  updateSettings: (patch: Partial<OpsState['settings']>) => void;
  selectedDecorId: string;
  selectDecor: (id: string) => void;
  monthlyReportMonth: string;
  setMonthlyReportMonth: (m: string) => void;
  resetData: () => void;
}

const OpsContext = createContext<OpsContextValue | null>(null);

function loadState(): OpsState {
  if (typeof window === 'undefined') return SEED_STATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as OpsState;
      return { ...SEED_STATE, ...parsed };
    }
  } catch {
    // ignore
  }
  return SEED_STATE;
}

export function OpsProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<OpsState>(SEED_STATE);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const loaded = loadState();
    // User aktif mengikuti role yang login (u1=owner u2=admin u3=freelancer)
    const uid = opsUserId();
    const role = opsRole();
    const username = localStorage.getItem('bludecor_ops_username')?.trim().toLowerCase();
    const sessionUser = username
      ? loaded.users.find((u) => u.active && u.username.toLowerCase() === username)
      : loaded.users.find((u) => u.active && uid && u.id === uid);
    if (sessionUser && (!role || sessionUser.role === role)) {
      loaded.currentUserId = sessionUser.id;
    } else {
      opsLogout();
      window.location.replace('/login');
      return;
    }
    setState(loaded);
    setReady(true);
    const handler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          setState({ ...SEED_STATE, ...JSON.parse(e.newValue) });
        } catch {}
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  useEffect(() => {
    if (ready) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch {}
    }
  }, [state, ready]);

  const patchState = useCallback((fn: (prev: OpsState) => OpsState) => {
    setState((prev) => fn(prev));
  }, []);

  const currentUser = useMemo(
    () => state.users.find((u) => u.id === state.currentUserId) ?? state.users.find((u) => u.active) ?? state.users[0],
    [state.users, state.currentUserId],
  );

  const selectedDecor = useMemo(
    () => state.decors.find((d) => d.id === state.selectedDecorId),
    [state.decors, state.selectedDecorId],
  );

  const activeDecors = useMemo(
    () => state.decors.filter((d) => d.status !== 'selesai' && d.status !== 'dibatalkan'),
    [state.decors],
  );
  const isOwner = currentUser.role === 'owner';
  const isManager = isOwner || currentUser.role === 'admin';

  const value: OpsContextValue = {
    state,
    currentUser,
    selectedDecor,
    decors: state.decors,
    activeDecors,
    tasks: state.tasks,
    activities: state.activities,
    attendance: state.attendance,
    photos: state.photos,
    expenses: state.expenses,
    corrections: state.corrections,
    audit: state.audit,
    selectedDecorId: state.selectedDecorId,
    selectDecor: (id) => patchState((p) => ({ ...p, selectedDecorId: id })),

    addDecor: (d) => {
      const decor: DecorProject = {
        id: uid(),
        name: d.name || '',
        client: d.client,
        eventType: d.eventType || 'Lainnya',
        category: d.category || d.eventType || 'Lainnya',
        date: d.date || new Date().toISOString().slice(0, 10),
        location: d.location || '',
        status: d.status || 'draft',
        revenue: d.revenue,
        note: d.note,
        createdAt: new Date().toISOString(),
      };
      patchState((p) => ({ ...p, decors: [decor, ...p.decors] }));
      return decor;
    },
    updateDecor: (id, patch) => {
      if (!isManager) return;
      patchState((p) => ({
        ...p,
        decors: p.decors.map((d) => (d.id === id ? { ...d, ...patch } : d)),
      }));
    },
    deleteDecor: (id) => {
      if (!isManager) return;
      patchState((p) => ({
        ...p,
        decors: p.decors.filter((d) => d.id !== id),
        tasks: p.tasks.filter((t) => t.decorId !== id),
        attendance: p.attendance.map((a) =>
          a.decorId === id ? { ...a, decorId: undefined, updatedAt: new Date().toISOString() } : a,
        ),
        activities: p.activities.filter((a) => a.decorId !== id),
        photos: p.photos.filter((ph) => ph.decorId !== id),
        expenses: p.expenses.filter((e) => e.decorId !== id),
        selectedDecorId:
          p.selectedDecorId === id ? p.decors[0]?.id || '' : p.selectedDecorId,
      }));
    },

    addUser: (u) => {
      if (!isOwner) return;
      patchState((p) => ({
        ...p,
        users: [
          ...p.users,
          { ...u, id: uid(), createdAt: new Date().toISOString() },
        ],
      }));
    },
    updateUser: (id, patch) => {
      if (!isOwner) return;
      patchState((p) => ({
        ...p,
        users: p.users.map((u) => (u.id === id ? { ...u, ...patch } : u)),
      }));
    },
    deleteUser: (id) => {
      if (!isOwner) return;
      patchState((p) => {
        // Guardrail: jangan hapus user yang punya tugas belum selesai
        const hasActiveTasks = p.tasks.some((t) => t.assigneeId === id && t.status !== 'selesai');
        if (hasActiveTasks) return p;
        return { ...p, users: p.users.filter((u) => u.id !== id) };
      });
    },
    setCurrentUser: (id) => patchState((p) => ({ ...p, currentUserId: id })),

    addTask: (t) =>
      patchState((p) => {
        const maxOrder = p.tasks
          .filter((x) => x.decorId === t.decorId)
          .reduce((m, x) => Math.max(m, x.order), -1);
        return { ...p, tasks: [...p.tasks, { ...t, id: uid(), order: maxOrder + 1 }] };
      }),
    updateTask: (id, patch) =>
      patchState((p) => ({
        ...p,
        tasks: p.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
      })),
    deleteTask: (id) =>
      patchState((p) => ({ ...p, tasks: p.tasks.filter((t) => t.id !== id) })),
    toggleTask: (id) =>
      patchState((p) => ({
        ...p,
        tasks: p.tasks.map((t) =>
          t.id === id
            ? { ...t, status: t.status === 'selesai' ? 'belum' : 'selesai' as TaskStatus }
            : t,
        ),
      })),

    attendanceForDate: (date) => {
      const map: Record<string, Attendance> = {};
      for (const a of state.attendance) if (a.date === date) map[a.userId] = a;
      return map;
    },
    clockIn: (userId, date, decorId, note, device) => {
      const time = nowTime();
      const at = new Date().toISOString();
      let result: Attendance | null = null;
      patchState((p) => {
        const existing = p.attendance.find((a) => a.userId === userId && a.date === date);
        if (existing && (existing.status === 'hadir' || existing.status === 'selesai')) return p;
        // Guardrail: hanya bisa absen hari ini
        const today = new Date().toISOString().slice(0, 10);
        if (date !== today) return p;
        // Guardrail: jam abnormal (sebelum 05:00 atau sesudah 23:00)
        const [h] = time.split(':').map(Number);
        if (h < 5 || h >= 23) return p;
        const decorName = p.decors.find((d) => d.id === decorId)?.name || 'Umum';
        const rec: Attendance = {
          id: existing?.id || uid(),
          userId,
          date,
          status: 'hadir',
          decorId,
          checkIn: time,
          checkOut: undefined,
          note,
          device,
          createdAt: existing?.createdAt || at,
          updatedAt: at,
        };
        result = rec;
        return {
          ...p,
          attendance: existing
            ? p.attendance.map((a) => (a.id === existing.id ? rec : a))
            : [...p.attendance, rec],
          audit: [...p.audit, { id: uid(), at, userId, action: 'absensi.masuk', detail: `Absen masuk ${time} · ${decorName}`, targetId: rec.id }],
        };
      });
      return result;
    },
    clockOut: (userId, date) => {
      const time = nowTime();
      const at = new Date().toISOString();
      patchState((p) => {
        const idx = p.attendance.findIndex((a) => a.userId === userId && a.date === date);
        if (idx < 0) return p;
        const rec: Attendance = { ...p.attendance[idx], status: 'selesai', checkOut: time, updatedAt: at };
        const next = [...p.attendance];
        next[idx] = rec;
        return {
          ...p,
          attendance: next,
          audit: [...p.audit, { id: uid(), at, userId, action: 'absensi.pulang', detail: `Absen pulang ${time}`, targetId: rec.id }],
        };
      });
    },
    declareNoWork: (userId, date) => {
      const at = new Date().toISOString();
      patchState((p) => {
        const existing = p.attendance.find((a) => a.userId === userId && a.date === date);
        if (existing && (existing.status === 'hadir' || existing.status === 'selesai')) return p;
        const rec: Attendance = {
          id: existing?.id || uid(),
          userId,
          date,
          status: 'tidak-bekerja',
          note: 'Hari ini tidak bekerja.',
          createdAt: existing?.createdAt || at,
          updatedAt: at,
        };
        return {
          ...p,
          attendance: existing
            ? p.attendance.map((a) => (a.id === existing.id ? rec : a))
            : [...p.attendance, rec],
          audit: [...p.audit, { id: uid(), at, userId, action: 'absensi.tidak-bekerja', detail: 'Menyatakan tidak bekerja hari ini', targetId: rec.id }],
        };
      });
    },
    deleteSession: (userId, date) => {
      const at = new Date().toISOString();
      patchState((p) => ({
        ...p,
        attendance: p.attendance.filter((a) => !(a.userId === userId && a.date === date)),
        audit: [...p.audit, { id: uid(), at, userId, action: 'absensi.hapus', detail: 'Session absensi dihapus', targetId: userId }],
      }));
    },
    requestCorrection: (userId, date, patch) => {
      const at = new Date().toISOString();
      patchState((p) => {
        const att = p.attendance.find((a) => a.userId === userId && a.date === date);
        if (!att) return p;
        // Guardrail: max 3 koreksi pending per bulan per user
        const monthKey = date.slice(0, 7);
        const pendingCount = p.corrections.filter((c) => c.userId === userId && c.status === 'pending' && c.date.startsWith(monthKey)).length;
        if (pendingCount >= 3) return p;
        // Guardrail: koreksi maksimal 3 hari ke belakang
        const diffMs = Date.now() - new Date(date + 'T23:59:59').getTime();
        if (diffMs > 3 * 24 * 60 * 60 * 1000) return p;
        const corr: AttendanceCorrection = {
          id: uid(),
          attendanceId: att.id,
          userId,
          date,
          requestedCheckIn: patch.requestedCheckIn,
          requestedCheckOut: patch.requestedCheckOut,
          reason: patch.reason,
          detail: patch.detail,
          status: 'pending',
          createdAt: at,
        };
        return {
          ...p,
          corrections: [...p.corrections, corr],
          audit: [...p.audit, { id: uid(), at, userId, action: 'koreksi.ajukan', detail: patch.reason, targetId: corr.id }],
        };
      });
    },
    approveCorrection: (id, decidedBy) => {
      const at = new Date().toISOString();
      patchState((p) => {
        const corr = p.corrections.find((c) => c.id === id && c.status === 'pending');
        if (!corr) return p;
        return {
          ...p,
          corrections: p.corrections.map((c) => (c.id === id ? { ...c, status: 'approved' as const, decidedAt: at, decidedBy } : c)),
          attendance: p.attendance.map((a) =>
            a.id === corr.attendanceId
              ? { ...a, checkIn: corr.requestedCheckIn ?? a.checkIn, checkOut: corr.requestedCheckOut ?? a.checkOut, updatedAt: at }
              : a,
          ),
          audit: [...p.audit, { id: uid(), at, userId: decidedBy, action: 'koreksi.setujui', detail: `Menyetujui koreksi ${corr.date}`, targetId: corr.id }],
        };
      });
    },
    rejectCorrection: (id, decidedBy) => {
      const at = new Date().toISOString();
      patchState((p) => {
        const corr = p.corrections.find((c) => c.id === id && c.status === 'pending');
        if (!corr) return p;
        return {
          ...p,
          corrections: p.corrections.map((c) => (c.id === id ? { ...c, status: 'rejected' as const, decidedAt: at, decidedBy } : c)),
          audit: [...p.audit, { id: uid(), at, userId: decidedBy, action: 'koreksi.tolak', detail: `Menolak koreksi ${corr.date}`, targetId: corr.id }],
        };
      });
    },
    addAudit: (userId, action, detail, targetId) =>
      patchState((p) => ({
        ...p,
        audit: [...p.audit, { id: uid(), at: new Date().toISOString(), userId, action, detail, targetId }],
      })),

    addActivity: (a) => {
      const act: Activity = { ...a, id: uid(), at: new Date().toISOString() };
      patchState((p) => ({ ...p, activities: [act, ...p.activities] }));
      return act;
    },
    deleteActivity: (id) =>
      patchState((p) => ({ ...p, activities: p.activities.filter((a) => a.id !== id) })),
    activitiesForProject: (decorId) =>
      state.activities
        .filter((a) => a.decorId === decorId)
        .sort((a, b) => (a.at < b.at ? 1 : -1)),

    addPhoto: (p) => {
      const ph: ActivityPhoto = { ...p, id: uid(), at: new Date().toISOString() };
      patchState((st) => ({ ...st, photos: [ph, ...st.photos] }));
      return ph;
    },
    deletePhoto: (id) =>
      patchState((p) => ({ ...p, photos: p.photos.filter((ph) => ph.id !== id) })),
    photosForProject: (decorId) =>
      state.photos.filter((ph) => ph.decorId === decorId).reverse(),

    addExpense: (e) => {
      if (!isManager) return;
      patchState((p) => ({
        ...p,
        expenses: [
          ...p.expenses,
          { ...e, id: uid(), createdAt: new Date().toISOString() },
        ],
      }));
    },
    updateExpense: (id, patch) => {
      if (!isManager) return;
      patchState((p) => ({
        ...p,
        expenses: p.expenses.map((e) => (e.id === id ? { ...e, ...patch } : e)),
      }));
    },
    deleteExpense: (id) => {
      if (!isManager) return;
      patchState((p) => ({ ...p, expenses: p.expenses.filter((e) => e.id !== id) }));
    },
    expensesForProject: (decorId) => state.expenses.filter((e) => e.decorId === decorId),
    decorExpenseTotal: (decorId) =>
      state.expenses.filter((e) => e.decorId === decorId).reduce((s, e) => s + e.amount, 0),
    decorProfit: (decorId) => {
      const decor = state.decors.find((d) => d.id === decorId);
      const revenue = decor?.revenue ?? 0;
      const expenseTotal = state.expenses
        .filter((e) => e.decorId === decorId)
        .reduce((s, e) => s + e.amount, 0);
      return revenue - expenseTotal;
    },

    updateSettings: (patch) => {
      if (!isOwner) return;
      patchState((p) => ({ ...p, settings: { ...p.settings, ...patch } }));
    },

    monthlyReportMonth: state.monthlyReportMonth,
    setMonthlyReportMonth: (m) => patchState((p) => ({ ...p, monthlyReportMonth: m })),
    resetData: () => {
      if (!isOwner) return;
      setState((prev) => {
        const uid2 = opsUserId();
        const seedWithRole = uid2 && SEED_STATE.users.some((u) => u.id === uid2)
          ? { ...SEED_STATE, currentUserId: uid2 }
          : SEED_STATE;
        localStorage.removeItem(STORAGE_KEY);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(seedWithRole));
        } catch {}
        return seedWithRole;
      });
    },
  };

  return <OpsContext.Provider value={value}>{children}</OpsContext.Provider>;
}

export function useOps() {
  const ctx = useContext(OpsContext);
  if (!ctx) throw new Error('useOps must be used within OpsProvider');
  return ctx;
}

export function userFirst(state: OpsState, id?: string) {
  const u = state.users.find((x) => x.id === id);
  return u ? u.name.charAt(0) : '?';
}
