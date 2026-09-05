/**
 * Nama koleksi MongoDB yang dipakai seluruh aplikasi (satu-satunya sumber).
 * Model Mongoose menurunkan nama ini dari nama model:
 *   CmsUser            -> cmsusers
 *   CmsCategory        -> cmscategories
 *   CmsSubCategory     -> cmssubcategories
 *   CmsTheme           -> cmsthemes
 *   CmsTestimonialToken-> cmstestimonialtokens
 *   CmsSiteSetting     -> cmssitesettings
 *   CmsPost            -> cmsposts
 *   CmsEvent           -> cmsevents
 *   CmsTestimonial     -> cmstestimonials
 *   CmsMedia           -> cmsmedia
 *   OpsState           -> opsstates
 *   CmsCounter         -> cmscounters
 */

module.exports = {
  USERS: 'cmsusers',
  CATEGORIES: 'cmscategories',
  SUB_CATEGORIES: 'cmssubcategories',
  THEMES: 'cmsthemes',
  TESTIMONIAL_TOKENS: 'cmstestimonialtokens',
  SITE_SETTINGS: 'cmssitesettings',
  POSTS: 'cmsposts',
  EVENTS: 'cmsevents',
  TESTIMONIALS: 'cmstestimonials',
  MEDIA: 'cmsmedia',
  OPS_STATES: 'opsstates',
  COUNTERS: 'cmscounters',
  MIGRATIONS: 'migrations',
};

/**
 * Kunci auto-increment di `cmscounters` - harus SAMA dengan nama "tabel"
 * yang dipakai nextId() pada aplikasi (src/lib/cms/service.ts): posts,
 * categories, sub_categories, themes, events, testimonials, tokens,
 * site_settings, users. Jangan pakai nama koleksi agar id tidak bentrok.
 */
const COUNTER_KEYS = {
  USERS: 'users',
  CATEGORIES: 'categories',
  SUB_CATEGORIES: 'sub_categories',
  THEMES: 'themes',
  SITE_SETTINGS: 'site_settings',
};

module.exports.COUNTER_KEYS = COUNTER_KEYS;