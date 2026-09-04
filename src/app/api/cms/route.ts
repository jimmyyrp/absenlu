import { NextResponse } from 'next/server';
import { hasMongoConfig } from '@/lib/mongodb';
import { handleCmsOp } from '@/lib/cms/service';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  if (!hasMongoConfig()) {
    return NextResponse.json({ data: null, error: { message: 'MongoDB belum dikonfigurasi.' } }, { status: 503 });
  }
  try {
    const body = await request.json();
    const result = await handleCmsOp(body);
    return NextResponse.json(result);
  } catch (err) {
    console.error('[cms] POST failed:', err);
    return NextResponse.json({ data: null, error: { message: err instanceof Error ? err.message : 'Gagal memproses permintaan.' } }, { status: 500 });
  }
}