import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { MediaModel } from '@/lib/cms/models';

export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await connectDB();
    const doc = await MediaModel.findById(id).lean();
    if (!doc || !doc.data) {
      return new NextResponse('Not Found', { status: 404 });
    }
    return new NextResponse(doc.data.buffer, {
      status: 200,
      headers: {
        'Content-Type': doc.mime || 'image/webp',
        'Content-Length': String(doc.data.byteLength),
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (err) {
    console.error('[media] GET failed:', err);
    return new NextResponse('Not Found', { status: 404 });
  }
}