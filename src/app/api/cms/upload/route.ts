import { NextResponse } from 'next/server';
import { connectDB, hasMongoConfig } from '@/lib/mongodb';
import { MediaModel } from '@/lib/cms/models';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  if (!hasMongoConfig()) {
    return NextResponse.json({ error: 'MongoDB belum dikonfigurasi.' }, { status: 503 });
  }
  try {
    const form = await request.formData();
    const file = form.get('file');
    const postIdRaw = form.get('postId');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'File wajib diisi.' }, { status: 400 });
    }
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Ukuran file maksimal 5MB.' }, { status: 400 });
    }
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'];
    if (!allowed.includes(file.type)) {
      return NextResponse.json({ error: 'Format gambar tidak didukung.' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const postId = postIdRaw ? Number(postIdRaw) : null;

    await connectDB();
    const doc = await MediaModel.create({
      postId,
      filename: (file.name || '').replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120),
      mime: file.type,
      bytes: buffer.byteLength,
      data: buffer,
    });

    return NextResponse.json({ url: `/api/media/${doc._id}`, ok: true });
  } catch (err) {
    console.error('[cms/upload] failed:', err);
    return NextResponse.json({ error: 'Gagal mengunggah media.' }, { status: 500 });
  }
}