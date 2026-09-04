import mongoose from 'mongoose';
import dns from 'dns';

/**
 * MongoDB Atlas connection — server-only.
 *
 * Reads MONGODB_URI directly, or falls back to composing the connection
 * string from MONGODB_USERNAME + MONGODB_PASSWORD (the Atlas onboarding .env
 * snippet may only contain those two).
 *
 * The connection is cached on `globalThis` so every serverless invocation
 * reuses the same pool instead of opening a new connection.
 */

const MONGODB_URI =
  process.env.MONGODB_URI ||
  (process.env.MONGODB_USERNAME && process.env.MONGODB_PASSWORD
    ? `mongodb+srv://${encodeURIComponent(process.env.MONGODB_USERNAME)}:${encodeURIComponent(process.env.MONGODB_PASSWORD)}@cluster0.ibl3vep.mongodb.net/bludecor?retryWrites=true&w=majority`
    : '');

const g = globalThis as unknown as { __mongoConn?: typeof mongoose };

const PUBLIC_DNS = ['8.8.8.8', '8.8.4.4', '1.1.1.1'];

/**
 * Beberapa jaringan (ISP / proxy lokal) menolak query DNS SRV yang dipakai
 * MongoDB Atlas (mongodb+srv://...). Bila resolver bawaan gagal, beralih ke
 * DNS publik agar koneksi tetap bisa dibuat. Di Vercel/layanan cloud,
 * resolver bawaan berfungsi normal sehingga fallback ini tidak terpakai.
 */
async function ensureSrvResolution(host: string) {
  try {
    await dns.promises.resolveSrv(`_mongodb._tcp.${host}`);
    return;
  } catch {
    // lanjut ke fallback
  }
  try {
    const prev = dns.getServers();
    try {
      dns.setServers(PUBLIC_DNS);
      await dns.promises.resolveSrv(`_mongodb._tcp.${host}`);
    } catch {
      dns.setServers(prev);
    }
  } catch {
    // biarkan mongoose mencoba sendiri
  }
}

function srvHost() {
  try {
    return new URL(MONGODB_URI).hostname;
  } catch {
    const match = MONGODB_URI.match(/^mongodb\+srv:\/\/(?:[^@/?#]+@)?([^/?#]+)/);
    return match ? match[1] : null;
  }
}

export function hasMongoConfig(): boolean {
  return Boolean(MONGODB_URI);
}

export async function connectDB() {
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI / MONGODB_USERNAME + MONGODB_PASSWORD belum dikonfigurasi.');
  }

  if (g.__mongoConn?.connection?.readyState === 1) {
    return g.__mongoConn;
  }

  if (g.__mongoConn?.connection?.readyState === 2) {
    return g.__mongoConn;
  }

  const host = srvHost();
  if (host) {
    await ensureSrvResolution(host);
  }

  g.__mongoConn = await mongoose.connect(MONGODB_URI, {
    dbName: 'bludecor',
    serverSelectionTimeoutMS: 12000,
    connectTimeoutMS: 12000,
  });

  return g.__mongoConn;
}

export async function disconnectDB() {
  if (g.__mongoConn?.connection?.readyState) {
    await g.__mongoConn.disconnect();
    g.__mongoConn = undefined;
  }
}