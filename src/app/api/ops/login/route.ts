import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectDB, hasMongoConfig } from '@/lib/mongodb';
import { UserModel } from '@/lib/cms/models';
import type { OpsRole } from '@/lib/ops/auth';

export const dynamic = 'force-dynamic';

/**
 * Login OPS — pemverifikasi kredensial dilihat dari MongoDB (cmsusers),
 * bukan dari password hardcoded per-peran seperti versi lama.
 * Role CMS dipetakan ke role OPS:
 *   owner        -> owner
 *   developer / admin -> admin
 *   staff        -> crew
 */

function mapToOpsRole(cmsRole: string): OpsRole | null {
  if (cmsRole === 'owner') return 'owner';
  if (cmsRole === 'developer') return 'developer';
  if (cmsRole === 'admin') return 'admin';
  if (cmsRole === 'staff') return 'crew';
  return null;
}

export async function POST(request: Request) {
  if (!hasMongoConfig()) {
    return NextResponse.json({ error: 'MongoDB belum dikonfigurasi.' }, { status: 503 });
  }
  let body: { username?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body tidak valid.' }, { status: 400 });
  }

  const username = String(body.username || '').trim().toLowerCase();
  const password = String(body.password || '');
  if (!username || !password) {
    return NextResponse.json({ error: 'Masukkan username dan password.' }, { status: 400 });
  }

  try {
    await connectDB();
    const user = await UserModel.findOne({ username, deleted_at: null }).lean();
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return NextResponse.json({ error: 'Username atau password salah.' }, { status: 401 });
    }
    const opsRole = mapToOpsRole(String(user.role || ''));
    if (!opsRole) {
      return NextResponse.json({ error: 'Akun ini tidak memiliki peran OPS.' }, { status: 403 });
    }
    return NextResponse.json({
      ok: true,
      opsRole,
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name || '',
        role: user.role,
      },
    });
  } catch (err) {
    console.error('[ops/login] POST failed:', err);
    return NextResponse.json({ error: 'Gagal memeriksa kredensial di MongoDB.' }, { status: 500 });
  }
}