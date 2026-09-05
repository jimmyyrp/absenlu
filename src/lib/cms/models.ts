import mongoose, { Schema, InferSchemaType, model, models } from 'mongoose';

/**
 * CMS Mongoose models — menggantikan Supabase (Postgres) untuk seluruh data
 * situs: katalog, portofolio, testimoni, event, pengaturan, dan tim.
 *
 * Skema meniru tabel SQL lama tetapi dinormalisasi ulang:
 * - posts menyimpan images/categories/sub_categories sebagai relasi embedded
 *   (category_ids / sub_category_ids adalah array id numerik; nama di-join
 *   saat membaca — setara dengan RPC get_posts_complete).
 * - id numerik dipertahankan untuk menjaga URL `/portfolio/{id}` dan filter
 *   `eq('id', ...)` yang dipakai seluruh halaman admin.
 */

const CounterSchema = new Schema({
  _id: { type: String, required: true },
  lastId: { type: Number, default: 0 },
});

export const CounterModel =
  (models.CmsCounter as mongoose.Model<InferSchemaType<typeof CounterSchema>>) ||
  model('CmsCounter', CounterSchema);

export async function nextId(collection: string): Promise<number> {
  const doc = await CounterModel.findByIdAndUpdate(
    collection,
    { $inc: { lastId: 1 } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  ).lean();
  return doc?.lastId ?? 1;
}

export async function setCounter(collection: string, value: number): Promise<void> {
  await CounterModel.updateOne(
    { _id: collection },
    { $max: { lastId: value } },
    { upsert: true },
  );
}

const timestampFields = {
  deleted_at: { type: Date, default: null },
  created_at: { type: Date, default: () => new Date() },
};

const WithId = { _id: false, id: { type: Number, required: true, unique: true } };

const UserSchema = new Schema(
  {
    ...WithId,
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    full_name: String,
    role: { type: String, enum: ['owner', 'developer', 'admin', 'staff'], default: 'staff' },
    ...timestampFields,
  },
  { _id: false },
);

const CategorySchema = new Schema(
  {
    ...WithId,
    name: { type: String, required: true },
    ...timestampFields,
  },
  { _id: false },
);

const SubCategorySchema = new Schema(
  {
    ...WithId,
    name: { type: String, required: true },
    category_id: Number,
    price: { type: Number, default: 0 },
    ...timestampFields,
  },
  { _id: false },
);

const ThemeSchema = new Schema(
  {
    ...WithId,
    name: { type: String, required: true },
    ...timestampFields,
  },
  { _id: false },
);

const TestimonialTokenSchema = new Schema(
  {
    ...WithId,
    token: { type: String, required: true, unique: true },
    usage_limit: { type: Number, default: 1 },
    usage_count: { type: Number, default: 0 },
    ...timestampFields,
  },
  { _id: false },
);

const SiteSettingSchema = new Schema(
  {
    ...WithId,
    key: { type: String, required: true, unique: true },
    value: { type: String, default: '' },
    updated_at: { type: Date, default: () => new Date() },
  },
  { _id: false },
);

const PostImageSchema = new Schema(
  {
    url_images: { type: String, required: true },
    urutan: { type: Number, default: 0 },
  },
  { _id: false },
);

const PostSchema = new Schema(
  {
    ...WithId,
    theme_id: { type: Number, default: null },
    title: { type: String, required: true },
    price: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
    images: { type: [PostImageSchema], default: [] },
    category_ids: { type: [Number], default: [] },
    sub_category_ids: { type: [Number], default: [] },
    ...timestampFields,
  },
  { _id: false },
);

const EventSchema = new Schema(
  {
    ...WithId,
    name: { type: String, required: true },
    slug: { type: String, required: true },
    description: String,
    icon: { type: String, default: '🎉' },
    color: { type: String, default: '#D4AF37' },
    start_date: String,
    end_date: String,
    boost_category_ids: { type: [Number], default: [] },
    boost_sub_category_ids: { type: [Number], default: [] },
    priority: { type: Number, default: 1 },
    banner_text: String,
    banner_bg_color: { type: String, default: '#D4AF37' },
    banner_text_color: { type: String, default: '#1a1a2e' },
    is_active: { type: Boolean, default: true },
    ...timestampFields,
  },
  { _id: false },
);

const TestimonialSchema = new Schema(
  {
    ...WithId,
    name: { type: String, required: true },
    role: { type: String, default: 'Klien Blu Decor' },
    text: { type: String, required: true },
    rating: { type: Number, min: 1, max: 5 },
    token_used: String,
    ...timestampFields,
  },
  { _id: false },
);

const MediaSchema = new Schema({
  postId: { type: Number, default: null },
  filename: String,
  mime: String,
  bytes: Number,
  data: { type: Buffer, required: true },
  created_at: { type: Date, default: () => new Date() },
});

function getModel<T extends mongoose.Schema>(name: string, schema: T) {
  return (mongoose.models[name] as mongoose.Model<any>) || model(name, schema);
}

export const UserModel = getModel('CmsUser', UserSchema);
export const CategoryModel = getModel('CmsCategory', CategorySchema);
export const SubCategoryModel = getModel('CmsSubCategory', SubCategorySchema);
export const ThemeModel = getModel('CmsTheme', ThemeSchema);
export const TestimonialTokenModel = getModel('CmsTestimonialToken', TestimonialTokenSchema);
export const SiteSettingModel = getModel('CmsSiteSetting', SiteSettingSchema);
export const PostModel = getModel('CmsPost', PostSchema);
export const EventModel = getModel('CmsEvent', EventSchema);
export const TestimonialModel = getModel('CmsTestimonial', TestimonialSchema);
export const MediaModel = getModel('CmsMedia', MediaSchema);