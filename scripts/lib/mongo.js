/**
 * Bantuan koneksi + skema MongoDB untuk skrip CLI (seed & import).
 * Koleksi sama persis dengan model aplikasi (src/lib/cms/models.ts).
 * Meniru fallback DNS + authSource=admin dari src/lib/mongodb.ts.
 */
const fs = require('fs');
const path = require('path');
const dns = require('dns');

const PUBLIC_DNS = ['8.8.8.8', '8.8.4.4', '1.1.1.1'];
let envLoaded = false;

function loadEnv() {
  if (envLoaded) return;
  envLoaded = true;
  const envPath = path.join(__dirname, '..', '..', '.env');
  if (!fs.existsSync(envPath)) return;
  fs.readFileSync(envPath, 'utf-8').split(/\r?\n/).forEach((l) => {
    const t = l.trim();
    if (!t || t.startsWith('#')) return;
    const i = t.indexOf('=');
    if (i > 0 && !process.env[t.slice(0, i).trim()]) {
      process.env[t.slice(0, i).trim()] = t.slice(i + 1).trim().replace(/^"|"$/g, '');
    }
  });
}

async function resolveSeedlist(host) {
  const tryResolve = async () => {
    try {
      const recs = await dns.promises.resolveSrv(`_mongodb._tcp.${host}`);
      return recs.length ? recs.map((r) => `${r.name}:${r.port}`) : null;
    } catch {
      return null;
    }
  };
  const viaDefault = await tryResolve();
  if (viaDefault) return viaDefault;
  const prev = dns.getServers();
  try {
    dns.setServers(PUBLIC_DNS);
    return (await tryResolve()) || [];
  } finally {
    dns.setServers(prev);
  }
}

async function mongoUri() {
  loadEnv();
  const MONGODB_URI = process.env.MONGODB_URI || '';
  const forceAuth = (u) => (/[?&]authSource=/.test(u) ? u : `${u}${u.includes('?') ? '&' : '?'}authSource=admin`);

  if (!MONGODB_URI.startsWith('mongodb+srv://')) return MONGODB_URI ? forceAuth(MONGODB_URI) : '';

  const schemeLen = 'mongodb+srv://'.length;
  const at = MONGODB_URI.indexOf('@');
  const slash = MONGODB_URI.indexOf('/', schemeLen);
  const host = slash !== -1 ? MONGODB_URI.slice(schemeLen, slash) : MONGODB_URI.slice(schemeLen);
  const auth = at !== -1 ? MONGODB_URI.slice(schemeLen, at) : '';
  const rest = slash !== -1 ? MONGODB_URI.slice(slash) : '';
  const seedlist = await resolveSeedlist(host);
  if (!seedlist.length) return forceAuth(MONGODB_URI);
  const sep = rest.includes('?') ? '&' : '?';
  return `mongodb://${auth}@${seedlist.join(',')}${rest}${sep}tls=true&authSource=admin`;
}

async function connectMongo() {
  loadEnv();
  const mongoose = require('mongoose');
  const uri = await mongoUri();
  if (!uri) throw new Error('MONGODB_URI / MONGODB_USERNAME + MONGODB_PASSWORD belum dikonfigurasi di .env.');
  await mongoose.connect(uri, { dbName: 'bludecor', serverSelectionTimeoutMS: 20000, connectTimeoutMS: 20000 });
  return mongoose;
}

function ts() {
  return {
    deleted_at: { type: Date, default: null },
    created_at: { type: Date, default: () => new Date() },
  };
}

const schemas = {
  cmsusers: new (require('mongoose').Schema)({ _id: false, id: { type: Number, required: true, unique: true }, username: { type: String, required: true, unique: true }, password: String, full_name: String, role: String, ...ts() }),
  cmscategories: new (require('mongoose').Schema)({ _id: false, id: { type: Number, required: true, unique: true }, name: String, ...ts() }),
  cmssubcategories: new (require('mongoose').Schema)({ _id: false, id: { type: Number, required: true, unique: true }, name: String, category_id: Number, price: Number, ...ts() }),
  cmsthemes: new (require('mongoose').Schema)({ _id: false, id: { type: Number, required: true, unique: true }, name: String, ...ts() }),
  cmstestimonialtokens: new (require('mongoose').Schema)({ _id: false, id: { type: Number, required: true, unique: true }, token: { type: String, unique: true }, usage_limit: Number, usage_count: Number, ...ts() }),
  cmssitesettings: new (require('mongoose').Schema)({ _id: false, id: { type: Number, required: true, unique: true }, key: { type: String, unique: true }, value: String, updated_at: Date }),
  cmsposts: new (require('mongoose').Schema)({ _id: false, id: { type: Number, required: true, unique: true }, theme_id: Number, title: String, price: Number, views: Number, images: { type: [{ url_images: String, urutan: Number }], default: [] }, category_ids: { type: [Number], default: [] }, sub_category_ids: { type: [Number], default: [] }, ...ts() }),
  cmsevents: new (require('mongoose').Schema)({ _id: false, id: { type: Number, required: true, unique: true }, name: String, slug: String, description: String, icon: String, color: String, start_date: String, end_date: String, boost_category_ids: [Number], boost_sub_category_ids: [Number], priority: Number, banner_text: String, banner_bg_color: String, banner_text_color: String, is_active: Boolean, ...ts() }),
  cmstestimonials: new (require('mongoose').Schema)({ _id: false, id: { type: Number, required: true, unique: true }, name: String, role: String, text: String, rating: Number, token_used: String, ...ts() }),
};

function model(col) {
  const mongoose = require('mongoose');
  return mongoose.models[col] || mongoose.model(col, schemas[col], col);
}

function counterModel() {
  const mongoose = require('mongoose');
  return mongoose.models.CmsCounter || mongoose.model('CmsCounter', new mongoose.Schema({ _id: String, lastId: Number }), 'cmscounters');
}

function nextId(collection) {
  return counterModel().findByIdAndUpdate(collection, { $inc: { lastId: 1 } }, { upsert: true, new: true, setDefaultsOnInsert: true }).lean().then((d) => d.lastId);
}

function setCounter(collection, value) {
  return counterModel().updateOne({ _id: collection }, { $max: { lastId: value } }, { upsert: true });
}

module.exports = { loadEnv, connectMongo, model, counterModel, nextId, setCounter, schemas };