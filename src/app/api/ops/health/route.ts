import { NextResponse } from 'next/server';
import { connectDB, hasMongoConfig } from '@/lib/mongodb';
import { OpsStateModel, OPS_STATE_KEY } from '@/lib/ops/ops-state-model';

export const dynamic = 'force-dynamic';

export interface OpsHealth {
  configured: boolean;
  connected: boolean;
  hasData: boolean;
  updatedAt: string | null;
  docStats: {
    users: number;
    decors: number;
    tasks: number;
    attendance: number;
    activities: number;
    photos: number;
    expenses: number;
    corrections: number;
    audit: number;
  };
}

export async function GET() {
  const base: OpsHealth = {
    configured: hasMongoConfig(),
    connected: false,
    hasData: false,
    updatedAt: null,
    docStats: {
      users: 0,
      decors: 0,
      tasks: 0,
      attendance: 0,
      activities: 0,
      photos: 0,
      expenses: 0,
      corrections: 0,
      audit: 0,
    },
  };

  if (!hasMongoConfig()) {
    return NextResponse.json(base, { status: 503 });
  }

  try {
    await connectDB();
    const doc = await OpsStateModel.findOne({ key: OPS_STATE_KEY }).lean();
    if (!doc) {
      base.connected = true;
      return NextResponse.json(base);
    }
    const data = doc.data as {
      users?: unknown[];
      decors?: unknown[];
      tasks?: unknown[];
      attendance?: unknown[];
      activities?: unknown[];
      photos?: unknown[];
      expenses?: unknown[];
      corrections?: unknown[];
      audit?: unknown[];
    };
    base.connected = true;
    base.hasData = true;
    base.updatedAt = doc.updatedAt?.toISOString?.() ?? null;
    base.docStats = {
      users: data.users?.length ?? 0,
      decors: data.decors?.length ?? 0,
      tasks: data.tasks?.length ?? 0,
      attendance: data.attendance?.length ?? 0,
      activities: data.activities?.length ?? 0,
      photos: data.photos?.length ?? 0,
      expenses: data.expenses?.length ?? 0,
      corrections: data.corrections?.length ?? 0,
      audit: data.audit?.length ?? 0,
    };
    return NextResponse.json(base);
  } catch (err) {
    console.error('[ops/health] failed:', err);
    return NextResponse.json(base, { status: 500 });
  }
}