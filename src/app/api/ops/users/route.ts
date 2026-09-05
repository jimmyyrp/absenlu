import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectDB, hasMongoConfig } from '@/lib/mongodb';
import { UserModel, nextId } from '@/lib/cms/models';
import type { UserRole as OpsUserRole } from '@/lib/ops/types';

export const dynamic = 'force-dynamic';

/**
 * Kelola akun OPS = akun cmsusers terpadu.
 *
 * Setiap anggota Tim di /ops/pengaturan adalah akun `cmsusers` (username +
 * password bcrypt) sehingga satu kredensial berlaku untuk login CMS `/admin`
 * dan OPS `/login`. Endpoint ini menciptakan/memperbarui/menghapus akun
 * `cmsusers` yang bersangkutan — pemanggil harus owner (diverifikasi
 * server-side dari `actor`).
 */

function opsToCmsRole(role: string): string | null {
  if (role === 'owner') return 'owner';
  if (role === 'admin') return 'admin';
  if (role === 'crew') return 'staff';
  return null;
}

function cleanUsername(raw: string): string | null {
  const u = String(raw || '').trim().toLowerCase().replace(/\s/g, '');
  if (!u || !/^[a-z0-9._-]+$/.test(u) || u.length > 40) return null;
  return u;
}

async function verifyOwner(actor: string): Promise<string | null> {
  const username = cleanUsername(actor);
  if (!username) return null;
  await connectDB();
  const user = await UserModel.findOne({ username, deleted_at: null }).lean();
  return user?.role === 'owner' ? username : null;
}

export async function POST(request: Request) {
  if (!hasMongoConfig()) {
    return NextResponse.json({ error: 'MongoDB belum dikonfigurasi.' }, { status: 503 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body tidak valid.' }, { status: 400 });
  }

  const action = String(body.action || '');
  const actor = String(body.actor || '');
  const user = body.user || {};

  if (!['create', 'update', 'delete'].includes(action)) {
    return NextResponse.json({ error: 'Aksi tidak valid.' }, { status: 400 });
  }

  try {
    const owner = await verifyOwner(actor);
    if (!owner) {
      return NextResponse.json({ error: 'Hanya owner yang dapat mengelola akun.' }, { status: 403 });
    }

    const username = cleanUsername(action === 'delete' ? String(body.username || '') : user.username);
    const name = typeof user.name === 'string' ? String(user.name).trim().slice(0, 100) : '';
    const role = opsToCmsRole(String(user.role || ''));
    const password = typeof user.password === 'string' ? user.password : '';

    if (action === 'create') {
      if (!username) return NextResponse.json({ error: 'Username tidak valid.' }, { status: 400 });
      if (!name) return NextResponse.json({ error: 'Nama lengkap wajib diisi.' }, { status: 400 });
      if (!role) return NextResponse.json({ error: 'Role tidak valid.' }, { status: 400 });
      if (password.length < 6) return NextResponse.json({ error: 'Password minimal 6 karakter.' }, { status: 400 });

      const exists = await UserModel.findOne({ username }).lean();
      if (exists) {
        return NextResponse.json({ error: 'Username sudah terpakai (akun CMS).' }, { status: 409 });
      }
      const created = await UserModel.create({
        id: await nextId('users'),
        username,
        password: bcrypt.hashSync(password, 10),
        full_name: name,
        role,
      });
      return NextResponse.json({ ok: true, cmsId: created.id });
    }

    if (action === 'update') {
      if (!username) return NextResponse.json({ error: 'Username tidak valid.' }, { status: 400 });
      const target = await UserModel.findOne({ username }).lean();
      if (!target) {
        return NextResponse.json({ error: 'Akun tidak ditemukan.' }, { status: 404 });
      }

      const patch: Record<string, any> = {};
      if (name) patch.full_name = name;
      if (role) {
        if (target.username === owner && role !== 'owner') {
          return NextResponse.json({ error: 'Tidak bisa menurunkan peran akun Anda sendiri.' }, { status: 400 });
        }
        patch.role = role;
      }
      if (typeof user.active === 'boolean') {
        if (target.username === owner && user.active === false) {
          return NextResponse.json({ error: 'Tidak bisa menonaktifkan akun Anda sendiri.' }, { status: 400 });
        }
        patch.deleted_at = user.active ? null : new Date();
      }
      if (password.length > 0) {
        if (password.length < 6) return NextResponse.json({ error: 'Password minimal 6 karakter.' }, { status: 400 });
        patch.password = bcrypt.hashSync(password, 10);
      }

      const newUsername = typeof user.username === 'string' ? cleanUsername(user.username) : null;
      if (newUsername && newUsername !== username) {
        if (target.username === owner) {
          return NextResponse.json({ error: 'Tidak bisa mengganti username akun Anda sendiri.' }, { status: 400 });
        }
        const dup = await UserModel.findOne({ username: newUsername }).lean();
        if (dup) return NextResponse.json({ error: 'Username sudah terpakai (akun CMS).' }, { status: 409 });
        patch.username = newUsername;
      }

      if (Object.keys(patch).length === 0) return NextResponse.json({ ok: true });
      await UserModel.updateOne({ id: target.id }, { $set: patch });
      return NextResponse.json({ ok: true });
    }

    // delete
    const targetUser = await UserModel.findOne({ username }).lean();
    if (!targetUser) return NextResponse.json({ error: 'Akun tidak ditemukan.' }, { status: 404 });
    if (targetUser.username === owner) {
      return NextResponse.json({ error: 'Tidak bisa menghapus akun Anda sendiri.' }, { status: 400 });
    }
    if (targetUser.role === 'owner') {
      const ownerCount = await UserModel.countDocuments({ role: 'owner', deleted_at: null });
      if (ownerCount <= 1) {
        return NextResponse.json({ error: 'Tidak bisa menghapus owner terakhir.' }, { status: 400 });
      }
    }
    await UserModel.deleteOne({ id: targetUser.id });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(`[ops/users] ${action} failed:`, err);
    return NextResponse.json({ error: 'Gagal memproses permintaan di MongoDB.' }, { status: 500 });
  }
}