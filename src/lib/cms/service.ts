import 'server-only';
import bcrypt from 'bcryptjs';
import { connectDB, hasMongoConfig } from '@/lib/mongodb';
import {
  UserModel, CategoryModel, SubCategoryModel, ThemeModel, TestimonialTokenModel,
  SiteSettingModel, PostModel, EventModel, TestimonialModel, MediaModel,
  nextId, setCounter,
} from './models';

/**
 * CMS Service — semua operasi data situs menggantikan Supabase RPC/REST.
 *
 * Membentuk ulang perilaku fungsi SQL lama:
 * - login_user      → verifikasi bcrypt + return array (client pakai data[0])
 * - insert_user     → hash bcrypt; error code '23505' untuk username duplikat
 * - get_posts_complete → join category/sub_category/theme + images embedded
 * - submit_testimonial_with_token → transaksional, validasi kuota token
 * - delete testimonials → kuota token yang terpakai dikembalikan (trigger lama)
 * - post_images / post_categories / post_sub_categories → operasi pada
 *   array embedded di dokumen posts (setara tabel relasi SQL).
 */

export type CmsFilter = { col: string; op: 'is' | 'eq' | 'neq' | 'in' | 'gt' | 'gte' | 'lt' | 'lte' | string; val: unknown };
export type CmsOrder = { col: string; ascending: boolean };

export type CmsResult<T = any> = {
  data: T | null;
  count?: number;
  error: { message: string; code?: string } | null;
};

const OK = <T = any>(data: T, count?: number): CmsResult<T> => ({ data, ...(count !== undefined ? { count } : {}), error: null });
const ERR = (message: string, code?: string): CmsResult => ({ data: null, error: { message, code } });

const TABLE_MODELS: Record<string, any> = {
  categories: CategoryModel,
  sub_categories: SubCategoryModel,
  themes: ThemeModel,
  testimonial_tokens: TestimonialTokenModel,
  site_settings: SiteSettingModel,
  posts: PostModel,
  events: EventModel,
  testimonials: TestimonialModel,
};

const RESTRICTED_TABLES = ['users', 'media'];

export async function ensureConnected() {
  if (!hasMongoConfig()) throw new Error('MongoDB belum dikonfigurasi.');
  await connectDB();
}

// ─────────────────────────────────────────────────────────────────────────────
// FILTER BUILDER
// ─────────────────────────────────────────────────────────────────────────────

function buildFilter(filters: CmsFilter[] | undefined): Record<string, any> {
  const out: Record<string, any> = {};
  for (const f of filters || []) {
    const col = f.col;
    const val = f.val;
    switch (f.op) {
      case 'in':
        out[col] = { $in: Array.isArray(val) ? val : [val] };
        break;
      case 'neq':
        out[col] = { $ne: val };
        break;
      case 'gt':
        out[col] = { $gt: val };
        break;
      case 'gte':
        out[col] = { $gte: val };
        break;
      case 'lt':
        out[col] = { $lt: val };
        break;
      case 'lte':
        out[col] = { $lte: val };
        break;
      case 'is':
      case 'eq':
      default:
        out[col] = val;
        break;
    }
  }
  return out;
}

function buildSort(orders: CmsOrder[] | undefined): Record<string, 1 | -1> {
  const out: Record<string, 1 | -1> = {};
  for (const o of orders || []) {
    out[o.col] = o.ascending ? 1 : -1;
  }
  return out;
}

function parseColumns(columns: string | undefined): string[] | null {
  if (!columns || columns === '*') return null;
  const cols = columns
    .split(',')
    .map((c) => c.trim().replace(/\s*\(.*\)$/, ''))
    .filter(Boolean);
  return cols.length ? cols : null;
}

function projection(cols: string[] | null): Record<string, 1> {
  const p: Record<string, 1> = {};
  for (const c of cols || []) p[c] = 1;
  return cols ? p : {};
}

function pick<T extends Record<string, any>>(doc: T, cols: string[] | null): T {
  if (!cols) return doc;
  const out: Record<string, any> = {};
  for (const c of cols) if (c in doc) out[c] = doc[c];
  return out as T;
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS — serialisasi ke bentuk RPC lama
// ─────────────────────────────────────────────────────────────────────────────

async function loadCatalog() {
  const [categories, subCategories, themes] = await Promise.all([
    CategoryModel.find({ deleted_at: null }).lean(),
    SubCategoryModel.find({ deleted_at: null }).lean(),
    ThemeModel.find({ deleted_at: null }).lean(),
  ]);
  const catById = new Map(categories.map((c: any) => [c.id, c]));
  const subById = new Map(subCategories.map((s: any) => [s.id, s]));
  const themeById = new Map(themes.map((t: any) => [t.id, t]));
  return { catById, subById, themeById };
}

async function enrichPost(raw: any, catalog?: Awaited<ReturnType<typeof loadCatalog>>) {
  const cat = catalog || (await loadCatalog());
  return {
    id: raw.id,
    title: raw.title,
    price: raw.price,
    views: raw.views,
    theme_id: raw.theme_id ?? null,
    theme_name: raw.theme_id != null ? cat.themeById.get(raw.theme_id)?.name ?? null : null,
    categories: (raw.category_ids || [])
      .map((cid: number) => cat.catById.get(cid))
      .filter(Boolean)
      .map((c: any) => ({ id: c.id, name: c.name })),
    sub_categories: (raw.sub_category_ids || [])
      .map((sid: number) => cat.subById.get(sid))
      .filter(Boolean)
      .map((s: any) => ({ id: s.id, name: s.name, price: s.price })),
    images: (raw.images || []).map((im: any, i: number) => ({
      id: i + 1,
      url_images: im.url_images,
      urutan: im.urutan ?? i,
    })),
    created_at: raw.created_at,
    updated_at: raw.updated_at,
  };
}

async function getPostsComplete() {
  const catalog = await loadCatalog();
  const posts = await PostModel.find({ deleted_at: null }).sort({ id: -1 }).lean();
  return Promise.all(posts.map((p) => enrichPost(p, catalog)));
}

async function getPostDetail(targetId: number) {
  const catalog = await loadCatalog();
  const post = await PostModel.findOne({ id: targetId, deleted_at: null }).lean();
  if (!post) return null;
  return enrichPost(post, catalog);
}

/** Untuk sitemap — daftar id + timestamp post aktif tanpa join/relasi. */
export async function getPostsForSitemap() {
  await ensureConnected();
  const posts = await PostModel.find({ deleted_at: null }).sort({ id: 1 }).lean();
  return posts.map((p: any) => ({ id: p.id, updated_at: p.updated_at, created_at: p.created_at }));
}

// ─────────────────────────────────────────────────────────────────────────────
// SELECT
// ─────────────────────────────────────────────────────────────────────────────

async function selectRow(table: string, filters: CmsFilter[], orders: CmsOrder[], extra: any): Promise<CmsResult> {
  const cols = parseColumns(extra.columns);
  if (table === 'post_categories' || table === 'post_sub_categories') {
    const idCol = table === 'post_categories' ? 'category_ids' : 'sub_category_ids';
    const key = table === 'post_categories' ? 'category_id' : 'sub_category_id';
    const inFilter = filters.find((f) => f.op === 'in' && f.col === key) || filters.find((f) => f.op === 'eq' && f.col === key);
    const ids = Array.isArray(inFilter?.val) ? inFilter!.val : [inFilter?.val];
    const posts = await PostModel.find({ deleted_at: null, [idCol]: { $in: ids } }).lean();
    const used = new Set<number>();
    for (const p of posts) for (const id of p[idCol] as number[]) if (ids.includes(id)) used.add(id);
    let rows = Array.from(used).map((id) => ({ [key]: id }));
    rows = pick(rows as any, cols) as any;
    return OK(rows);
  }

  const model = TABLE_MODELS[table];
  if (!model) return ERR(`Tabel "${table}" tidak didukung.`);
  if (RESTRICTED_TABLES.includes(table)) return ERR(`Akses langsung ke tabel "${table}" tidak diizinkan.`);

  const filter = buildFilter(filters);
  const sort = buildSort(orders);

  if (extra.head && extra.count === 'exact') {
    const count = await model.countDocuments(filter);
    return OK([], count);
  }

  if (extra.single === 'single' || extra.single === 'maybeSingle') {
    const doc = await model.findOne(filter).sort(sort).lean();
    if (!doc && extra.single === 'single') return ERR('Data tidak ditemukan.');
    if (!doc) return OK(null);
    return OK(doc);
  }

  let query = model.find(filter).sort(sort);
  if (typeof extra.limit === 'number') query = query.limit(extra.limit);
  if (typeof extra.offset === 'number') query = query.skip(extra.offset);
  let docs = await query.lean();

  if (table === 'sub_categories' && cols && cols.some((c) => c.includes('categories')) && !cols.includes('categories')) {
    // fallback: kolom categories(...) hanya dibutuhkan untuk join nama induk
  }
  if (table === 'sub_categories') {
    const catById = new Map((await CategoryModel.find({ deleted_at: null }).lean()).map((c: any) => [c.id, c]));
    docs = docs.map((d: any) => ({ ...d, categories: d.category_id != null ? { id: d.category_id, name: catById.get(d.category_id)?.name ?? null } : null }));
  }
  if (cols) docs = docs.map((d: any) => pick(d, cols));
  return OK(docs);
}

// ─────────────────────────────────────────────────────────────────────────────
// INSERT / UPDATE / DELETE
// ─────────────────────────────────────────────────────────────────────────────

async function insertRows(table: string, rows: any[]): Promise<CmsResult> {
  if (!rows?.length) return OK([]);
  if (table === 'post_images') {
    for (const row of rows) {
      if (row.post_id == null) continue;
      await PostModel.updateOne(
        { id: row.post_id },
        { $push: { images: { url_images: row.url_images, urutan: row.urutan ?? 0 } } },
      );
    }
    return OK([], 0);
  }
  if (table === 'post_categories') {
    for (const row of rows) {
      if (row.post_id == null || row.category_id == null) continue;
      await PostModel.updateOne({ id: row.post_id }, { $addToSet: { category_ids: row.category_id } });
    }
    return OK([], 0);
  }
  if (table === 'post_sub_categories') {
    for (const row of rows) {
      if (row.post_id == null || row.sub_category_id == null) continue;
      await PostModel.updateOne({ id: row.post_id }, { $addToSet: { sub_category_ids: row.sub_category_id } });
    }
    return OK([], 0);
  }

  const model = TABLE_MODELS[table];
  if (!model) return ERR(`Tabel "${table}" tidak didukung.`);
  if (RESTRICTED_TABLES.includes(table)) return ERR(`Akses langsung ke tabel "${table}" tidak diizinkan.`);

  const created: any[] = [];
  for (const row of rows) {
    const doc = {
      id: await nextId(table),
      ...row,
      created_at: new Date(),
    };
    if (table === 'posts') {
      doc.images = row.images || [];
      doc.category_ids = row.category_ids || [];
      doc.sub_category_ids = row.sub_category_ids || [];
      doc.views = row.views ?? 0;
      doc.updated_at = new Date();
      doc.deleted_at = row.deleted_at ?? null;
    }
    await model.create(doc);
    const lean = await model.findOne({ id: doc.id }).lean();
    created.push(table === 'posts' ? await enrichPost(lean!) : lean);
  }
  return OK(created);
}

async function updateRows(table: string, filters: CmsFilter[], updates: Record<string, any>): Promise<CmsResult> {
  const model = TABLE_MODELS[table];
  if (!model) return ERR(`Tabel "${table}" tidak didukung.`);
  if (RESTRICTED_TABLES.includes(table)) return ERR(`Akses langsung ke tabel "${table}" tidak diizinkan.`);
  const filter = buildFilter(filters);
  const patch = { ...updates };
  if (table === 'posts' || table === 'site_settings') patch.updated_at = new Date();
  if (table === 'site_settings') delete patch.key;
  await model.updateMany(filter, { $set: patch });
  return OK([]);
}

async function deleteRows(table: string, filters: CmsFilter[]): Promise<CmsResult> {
  if (table === 'post_images') {
    const postIds = filters.filter((f) => f.col === 'post_id').map((f) => f.val);
    if (postIds.length) await PostModel.updateMany({ id: { $in: postIds } }, { $set: { images: [] } });
    return OK([]);
  }
  if (table === 'post_categories') {
    const postIds = filters.filter((f) => f.col === 'post_id').map((f) => f.val);
    if (postIds.length) await PostModel.updateMany({ id: { $in: postIds } }, { $set: { category_ids: [] } });
    return OK([]);
  }
  if (table === 'post_sub_categories') {
    const postIds = filters.filter((f) => f.col === 'post_id').map((f) => f.val);
    if (postIds.length) await PostModel.updateMany({ id: { $in: postIds } }, { $set: { sub_category_ids: [] } });
    return OK([]);
  }

  if (table === 'testimonials') {
    const filter = buildFilter(filters);
    const targets = await TestimonialModel.find(filter).lean();
    const tokens = new Set<string>();
    for (const t of targets) if (t.token_used) tokens.add(t.token_used);
    await TestimonialModel.deleteMany(filter);
    for (const token of tokens) {
      await TestimonialTokenModel.updateOne(
        { token },
        [{ $set: { usage_count: { $max: [{ $subtract: ['$usage_count', 1] }, 0] } } }],
      );
    }
    return OK([]);
  }

  const model = TABLE_MODELS[table];
  if (!model) return ERR(`Tabel "${table}" tidak didukung.`);
  if (RESTRICTED_TABLES.includes(table)) return ERR(`Akses langsung ke tabel "${table}" tidak diizinkan.`);
  const filter = buildFilter(filters);
  await model.deleteMany(filter);
  return OK([]);
}

// ─────────────────────────────────────────────────────────────────────────────
// UPSERT (site_settings onConflict key)
// ─────────────────────────────────────────────────────────────────────────────

async function upsertRows(table: string, rows: any[], onConflict?: string): Promise<CmsResult> {
  const model = TABLE_MODELS[table];
  if (!model) return ERR(`Tabel "${table}" tidak didukung.`);
  for (const row of rows) {
    if (table === 'site_settings' && onConflict === 'key') {
      const existing = await SiteSettingModel.findOne({ key: row.key }).lean();
      if (existing) {
        await SiteSettingModel.updateOne({ id: existing.id }, { $set: { value: row.value, updated_at: new Date() } });
      } else {
        await SiteSettingModel.create({ id: await nextId('site_settings'), key: row.key, value: row.value });
      }
    } else if (table === 'site_settings') {
      await SiteSettingModel.create({ id: await nextId('site_settings'), key: row.key, value: row.value });
    } else if (onConflict) {
      const conflictCol = onConflict;
      const existing = await model.findOne({ [conflictCol]: row[conflictCol] }).lean();
      if (existing) {
        await model.updateOne({ [conflictCol]: row[conflictCol] }, { $set: row });
      } else {
        await model.create({ id: await nextId(table), ...row });
      }
    } else {
      await model.create({ id: await nextId(table), ...row });
    }
  }
  return OK([]);
}

// ─────────────────────────────────────────────────────────────────────────────
// RPC — setara fungsi security definer Postgres
// ─────────────────────────────────────────────────────────────────────────────

async function runRpc(name: string, args: Record<string, any> = {}): Promise<CmsResult> {
  switch (name) {
    case 'get_posts_complete': {
      const data = await getPostsComplete();
      return OK(data);
    }
    case 'get_post_detail': {
      const id = Number(args.target_post_id ?? args.p_post_id ?? args.postId);
      const data = await getPostDetail(id);
      return data ? OK([data]) : OK([]);
    }
    case 'get_team_members': {
      const data = await UserModel.find({ deleted_at: null }).sort({ id: 1 }).lean();
      return OK(data.map((u: any) => ({ id: u.id, username: u.username, full_name: u.full_name, role: u.role, created_at: u.created_at })));
    }
    case 'login_user': {
      const username = String(args.p_username || '').trim().toLowerCase();
      const password = String(args.p_password || '');
      const user = await UserModel.findOne({ username, deleted_at: null }).lean();
      if (!user || !bcrypt.compareSync(password, user.password)) return OK([]);
      return OK([{ id: user.id, username: user.username, full_name: user.full_name, role: user.role }]);
    }
    case 'insert_user': {
      const username = String(args.p_username || '').trim().toLowerCase();
      const exists = await UserModel.findOne({ username }).lean();
      if (exists) return ERR('Username sudah terpakai.', '23505');
      await UserModel.create({
        id: await nextId('users'),
        username,
        password: bcrypt.hashSync(String(args.p_password || ''), 10),
        full_name: String(args.p_full_name || '').trim(),
        role: args.p_role || 'staff',
      });
      return OK(true, 0);
    }
    case 'delete_users': {
      const ids = (args.p_ids as number[]) || [];
      if (ids.length) await UserModel.deleteMany({ id: { $in: ids } });
      return OK(null, 0);
    }
    case 'submit_testimonial_with_token': {
      const token = String(args.p_token || '');
      const tok = await TestimonialTokenModel.findOne({ token, deleted_at: null }).lean();
      if (!tok) return ERR('Token testimoni tidak ditemukan atau tidak valid.');
      if ((tok.usage_count || 0) >= (tok.usage_limit || 1)) return ERR('Batas kuota penggunaan token ini telah habis.');
      await TestimonialModel.create({
        id: await nextId('testimonials'),
        name: String(args.p_name || '').trim(),
        role: String(args.p_role || 'Klien Blu Decor'),
        text: String(args.p_text || '').trim(),
        rating: Math.min(5, Math.max(1, Math.round(Number(args.p_rating) || 5))),
        token_used: token,
      });
      await TestimonialTokenModel.updateOne({ id: tok.id }, { $inc: { usage_count: 1 } });
      return OK(true, 0);
    }
    case 'increment_post_views': {
      const id = Number(args.target_id ?? args.p_target_id ?? args.postId);
      if (id) await PostModel.updateOne({ id, deleted_at: null }, { $inc: { views: 1 } });
      return OK(null, 0);
    }
    case 'get_active_events': {
      const today = new Date().toLocaleDateString('sv-SE');
      const data = await EventModel.find({
        is_active: true,
        deleted_at: null,
        start_date: { $lte: today },
        end_date: { $gte: today },
      }).sort({ priority: -1 }).lean();
      return OK(data.map((e: any) => ({
        id: e.id, name: e.name, slug: e.slug, description: e.description, icon: e.icon,
        color: e.color, start_date: e.start_date, end_date: e.end_date,
        boost_category_ids: e.boost_category_ids || [], boost_sub_category_ids: e.boost_sub_category_ids || [],
        priority: e.priority, banner_text: e.banner_text, banner_bg_color: e.banner_bg_color,
        banner_text_color: e.banner_text_color,
      })));
    }
    case 'cleanup_deleted_records': {
      const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const models = [PostModel, CategoryModel, SubCategoryModel, ThemeModel, TestimonialModel, TestimonialTokenModel, EventModel, UserModel];
      for (const m of models) {
        await (m as any).deleteMany({ deleted_at: { $lt: cutoff } });
      }
      return OK(null, 0);
    }
    case 'audit_media': {
      return OK(await auditMedia());
    }
    case 'purge_orphan_media': {
      return OK(await purgeOrphanMedia());
    }
    case 'cleanup_stale_media': {
      const postId = Number(args.post_id ?? args.postId);
      const keep = new Set<string>((args.keep_urls as string[]) || []);
      if (!postId) return OK(0, 0);
      const media = await MediaModel.find({ postId }).lean();
      let removed = 0;
      for (const m of media) {
        const url = `/api/media/${m._id}`;
        if (!keep.has(url)) {
          await MediaModel.deleteOne({ _id: m._id });
          removed++;
        }
      }
      return OK(removed, 0);
    }
    default:
      return ERR(`RPC "${name}" tidak dikenal.`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// MEDIA — audit & pembersihan (pengganti Supabase Storage sweep)
// ─────────────────────────────────────────────────────────────────────────────

export const ORPHAN_GRACE_DAYS = 7;

export type MediaAuditReport = {
  totalFiles: number;
  totalBytes: number;
  referencedCount: number;
  referencedBytes: number;
  orphanCount: number;
  orphanBytes: number;
  purgeableCount: number;
  purgeableBytes: number;
  waitingCount: number;
  waitingBytes: number;
  brokenReferences: number;
  oldestOrphanAt: string | null;
  sampleOrphans: { path: string; size: number }[];
};

async function collectPostMediaUrls(): Promise<Set<string>> {
  const posts = await PostModel.find({}).lean();
  const urls = new Set<string>();
  for (const p of posts) for (const im of p.images || []) if (im.url_images) urls.add(im.url_images);
  return urls;
}

async function auditMedia(): Promise<MediaAuditReport> {
  const [files, referenced] = await Promise.all([MediaModel.find({}).lean(), collectPostMediaUrls()]);
  const report: MediaAuditReport = {
    totalFiles: 0, totalBytes: 0, referencedCount: 0, referencedBytes: 0,
    orphanCount: 0, orphanBytes: 0, purgeableCount: 0, purgeableBytes: 0,
    waitingCount: 0, waitingBytes: 0, brokenReferences: 0, oldestOrphanAt: null, sampleOrphans: [],
  };
  const cutoff = Date.now() - ORPHAN_GRACE_DAYS * 24 * 60 * 60 * 1000;
  report.totalFiles = files.length;
  for (const f of files) {
    const url = `/api/media/${f._id}`;
    report.totalBytes += f.bytes || 0;
    if (referenced.has(url)) {
      report.referencedCount++;
      report.referencedBytes += f.bytes || 0;
      continue;
    }
    report.orphanCount++;
    report.orphanBytes += f.bytes || 0;
    const ts = new Date(f.created_at).getTime();
    if (Number.isNaN(ts) || ts >= cutoff) {
      report.waitingCount++;
      report.waitingBytes += f.bytes || 0;
    } else {
      report.purgeableCount++;
      report.purgeableBytes += f.bytes || 0;
      if (report.oldestOrphanAt === null || new Date(f.created_at).toISOString() < report.oldestOrphanAt) {
        report.oldestOrphanAt = new Date(f.created_at).toISOString();
      }
    }
    if (report.sampleOrphans.length < 12) report.sampleOrphans.push({ path: url, size: f.bytes || 0 });
  }
  return report;
}

async function purgeOrphanMedia() {
  const [files, referenced] = await Promise.all([MediaModel.find({}).lean(), collectPostMediaUrls()]);
  const cutoff = Date.now() - ORPHAN_GRACE_DAYS * 24 * 60 * 60 * 1000;
  const targets = files.filter((f) => {
    const url = `/api/media/${f._id}`;
    if (referenced.has(url)) return false;
    const ts = new Date(f.created_at).getTime();
    return !Number.isNaN(ts) && ts < cutoff;
  });
  const removed: string[] = [];
  const failed: string[] = [];
  for (const t of targets) {
    const url = `/api/media/${t._id}`;
    try {
      await MediaModel.deleteOne({ _id: t._id });
      removed.push(url);
    } catch {
      failed.push(url);
    }
  }
  return { removed, failed, report: await auditMedia() };
}

// ─────────────────────────────────────────────────────────────────────────────
// ENTRY — panggilan dari route /api/cms
// ─────────────────────────────────────────────────────────────────────────────

export async function handleCmsOp(body: any): Promise<CmsResult> {
  await ensureConnected();

  if (body?.op === 'rpc') return runRpc(body.name, body.args);
  const table = body?.table;
  if (!table) return ERR('Field "table" wajib diisi.');

  if (body?.insert !== undefined) {
    if (!Array.isArray(body.insert)) return ERR('"insert" harus berupa array.');
    return insertRows(table, body.insert);
  }
  if (body?.upsert !== undefined) {
    return upsertRows(table, body.upsert?.rows || [], body.upsert?.onConflict);
  }
  if (body?.updates !== undefined) {
    return updateRows(table, body.filters || [], body.updates);
  }
  if (body?.delete === true) {
    return deleteRows(table, body.filters || []);
  }
  return selectRow(table, body.filters || [], body.orders || [], {
    columns: body.columns,
    limit: body.limit,
    offset: body.offset,
    head: body.head,
    count: body.count,
    single: body.single,
  });
}