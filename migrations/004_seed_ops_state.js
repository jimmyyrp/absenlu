/**
 * Migration: 004_seed_ops_state
 * =============================
 * Menyiapkan dokumen awal modul OPS (kol. opsstates, key "main") bila belum
 * ada. Dokumen ini dulu memuat user hardcoded (Owner BluDecor / Admin Kantor)
 * — sekarang USERS KOSONG dan diisi otomatis dari akun yang benar-benar login
 * (cmsusers) oleh src/lib/ops/store.tsx. Dengan begitu data tim selalu
 * dinamis dari MongoDB, tanpa akun/password palsu di kode.
 */

'use strict';

const C = require('../scripts/lib/collections');

// Snapshot default setting UI (sumber laiknya: src/lib/ops/types.ts &
// src/lib/ops/seed.ts — dipertahankan agar dokumen ops berdiri sendiri).
const DECOR_CATEGORIES = [
  'Pernikahan', 'Lamaran', 'Ulang Tahun', 'Acara Perusahaan', 'Gathering', 'Seminar',
  'Peluncuran', 'Pameran', 'Booth', 'Wisuda', 'Pesta', 'Dekorasi Rumah',
  'Dekorasi Gedung', 'Dekorasi Panggung', 'Backdrop', 'Dekorasi Meja',
  'Dekorasi Bunga', 'Dekorasi Custom',
];

const EXPENSE_CATEGORIES = [
  'Operasional', 'Transportasi', 'BBM', 'Parkir', 'Tol', 'Sewa Kendaraan', 'Kurir', 'Logistik',
  'Material Decor', 'Bunga', 'Kain', 'Backdrop', 'Kayu', 'Akrilik', 'Balon', 'Pita', 'Lem',
  'Kabel', 'Lighting', 'Properti', 'Printing',
  'Tenaga Kerja', 'Harian', 'Helper', 'Driver', 'Crew', 'Lembur',
  'Operasional Kantor', 'Listrik', 'Internet', 'Sewa', 'ATK', 'Maintenance', 'Peralatan',
  'Lainnya', 'Konsumsi', 'Dokumentasi', 'Administrasi', 'Marketing', 'Biaya Tak Terduga',
];

function monthNow() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

module.exports = {
  version: '004',
  name: 'seed_ops_state',
  async up(db) {
    const opsStates = db.collection(C.OPS_STATES);
    if ((await opsStates.countDocuments({})) > 0) {
      console.log('  Dokumen OPS sudah ada — dilewati.');
      return;
    }

    const taskTemplate = ['Persiapan', 'Pemasangan', 'Penyelesaian', 'Bongkar'];

    const data = {
      currentUserId: '',
      monthlyReportMonth: monthNow(),
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
      settings: {
        appName: 'BLUDECOR OPS',
        attendanceRequired: false,
        activityTypes: ['Pemasangan', 'Penyelesaian', 'Bongkar', 'Dokumentasi'],
        taskCategories: [...taskTemplate],
        decorCategories: [...DECOR_CATEGORIES],
        expenseCategories: [...EXPENSE_CATEGORIES],
        taskTemplate: [...taskTemplate],
      },
    };

    await opsStates.insertOne({
      key: 'main',
      data,
      updatedAt: new Date(),
      updatedBy: 'migration',
    });
    console.log('  Dokumen OPS dibuat (users kosong — diisi otomatis saat login).');
  },
};