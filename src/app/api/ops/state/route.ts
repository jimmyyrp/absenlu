import { NextResponse } from 'next/server';
import { connectDB, hasMongoConfig } from '@/lib/mongodb';
import { OpsStateModel, OPS_STATE_KEY } from '@/lib/ops/ops-state-model';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!hasMongoConfig()) {
    return NextResponse.json({ error: 'MongoDB belum dikonfigurasi.' }, { status: 503 });
  }
  try {
    await connectDB();
    const doc = await OpsStateModel.findOne({ key: OPS_STATE_KEY }).lean();
    if (!doc) {
      return NextResponse.json({ state: null });
    }
    return NextResponse.json({ state: doc.data });
  } catch (err) {
    console.error('[ops/state] GET failed:', err);
    return NextResponse.json({ error: 'Gagal membaca data dari MongoDB.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!hasMongoConfig()) {
    return NextResponse.json({ error: 'MongoDB belum dikonfigurasi.' }, { status: 503 });
  }
  try {
    const body = (await request.json()) as { state?: unknown; updatedBy?: string };
    if (!body.state || typeof body.state !== 'object') {
      return NextResponse.json({ error: 'Body wajib berisi state (object).' }, { status: 400 });
    }
    await connectDB();
    const updatedAt = new Date();
    await OpsStateModel.updateOne(
      { key: OPS_STATE_KEY },
      { $set: { data: body.state, updatedAt, updatedBy: body.updatedBy || 'ops' } },
      { upsert: true },
    );
    return NextResponse.json({ ok: true, updatedAt: updatedAt.toISOString() });
  } catch (err) {
    console.error('[ops/state] POST failed:', err);
    return NextResponse.json({ error: 'Gagal menyimpan data ke MongoDB.' }, { status: 500 });
  }
}