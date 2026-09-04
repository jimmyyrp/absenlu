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
 * DNS publik, lalu OLAH seedlist SRV menjadi URI `mongodb://` langsung berisi
 * host:port (TLS aktif) sehingga driver tidak lagi bergantung pada SRV.
 * Di Vercel/layanan cloud, resolver bawaan berfungsi normal sehingga
 * fallback ini tidak terpakai.
 */
async function resolveSeedlist(host: string): Promise<string[]> {
  const tryResolve = async (): Promise<string[] | null> => {
    try {
      const recs = await dns.promises.resolveSrv(`_mongodb._tcp.${host}`);
      if (!recs.length) return null;
      return recs.map((r) => `${r.name}:${r.port}`);
    } catch {
      return null;
    }
  };

  const viaDefault = await tryResolve();
  if (viaDefault) return viaDefault;

  const prev = dns.getServers();
  try {
    dns.setServers(PUBLIC_DNS);
    const viaPublic = await tryResolve();
    return viaPublic ?? [];
  } catch {
    return [];
  } finally {
    dns.setServers(prev);
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

/** Tambahkan `authSource=admin` ke URI bila belum ada (kebiasaan Atlas). */
function withForceAuthSource(uri: string): string {
  if (/[?&]authSource=/.test(uri)) return uri;
  const sep = uri.includes('?') ? '&' : '?';
  return `${uri}${sep}authSource=admin`;
}

/** Ubah URI `mongodb+srv://` menjadi `mongodb://` berisi seedlist host langsung. */
async function toDirectUri(): Promise<string> {
  if (!MONGODB_URI.startsWith('mongodb+srv://')) return withForceAuthSource(MONGODB_URI);

  const schemeLen = 'mongodb+srv://'.length;
  const at = MONGODB_URI.indexOf('@');
  const slash = MONGODB_URI.indexOf('/', schemeLen);

  const host = srvHost();
  if (!host) return withForceAuthSource(MONGODB_URI);
  const seedlist = await resolveSeedlist(host);
  if (!seedlist.length) return withForceAuthSource(MONGODB_URI);

  const auth = at !== -1 ? MONGODB_URI.slice(schemeLen, at) : '';
  const rest = slash !== -1 ? MONGODB_URI.slice(slash) : '';
  const sep = rest.includes('?') ? '&' : '?';
  return `mongodb://${auth}@${seedlist.join(',')}${rest}${sep}tls=true&authSource=admin`;
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

  const uri = await toDirectUri();

  g.__mongoConn = await mongoose.connect(uri, {
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