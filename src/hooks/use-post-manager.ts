'use client';

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { compressAndUpload } from '@/lib/image-upload';
import { deleteStaleGalleryFiles } from '@/lib/storage-sweep';

/**
 * Shared post management hook - Blu Decor Padang
 * Extracted from duplicated CRUD logic across home, admin/portfolio, and portfolio pages.
 */

export type GalleryItem = {
  url: string;
  file?: File;
};

export type PostFormData = {
  title: string;
  price: string;
  gallery: GalleryItem[];
  category_ids: number[];
  sub_category_ids: number[];
  theme_id: number | null;
};

export const INITIAL_FORM_DATA: PostFormData = {
  title: '',
  price: '0',
  gallery: [],
  category_ids: [],
  sub_category_ids: [],
  theme_id: null,
};

export function usePostManager() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const savePost = useCallback(async (
    formData: PostFormData,
    editingItem?: any,
    onRevalidate?: () => Promise<void>
  ): Promise<boolean> => {
    if (!formData.title?.trim() || formData.gallery.length === 0) return false;
    setIsSubmitting(true);
    try {
      const postPayload = {
        title: formData.title.trim(),
        price: Math.max(0, parseFloat(formData.price || '0') || 0),
        theme_id: formData.theme_id,
        updated_at: new Date().toISOString()
      };

      let postId: number;
      if (editingItem) {
        const { error } = await supabase.from('posts').update(postPayload).eq('id', editingItem.id);
        if (error) throw error;
        postId = editingItem.id;
      } else {
        const { data, error } = await supabase.from('posts').insert([postPayload]).select().single();
        if (error) throw error;
        postId = data.id;
      }

      // Upload images
      const finalUrls: string[] = [];
      for (let i = 0; i < formData.gallery.length; i++) {
        const item = formData.gallery[i];
        if (item.file) {
          const url = await compressAndUpload(item.file, `${postId}_${Date.now()}_${i}.webp`);
          if (!url) throw new Error('Unggah media gagal. Periksa koneksi dan format gambar.');
          finalUrls.push(url);
        } else {
          finalUrls.push(item.url);
        }
      }

      // Only delete/reinsert post_images if gallery actually changed
      const hasNewImages = formData.gallery.some(item => !!item.file);
      const imagesCountChanged = editingItem && formData.gallery.length !== (editingItem.images?.length || 0);
      const imagesChanged = hasNewImages || imagesCountChanged;

      if (imagesChanged) {
        const { error: delImgErr } = await supabase.from('post_images').delete().eq('post_id', postId);
        if (delImgErr) throw delImgErr;
        if (finalUrls.length > 0) {
          const { error: insImgErr } = await supabase.from('post_images').insert(
            finalUrls.map((url, i) => ({ post_id: postId, url_images: url, urutan: i }))
          );
          if (insImgErr) throw insImgErr;
        }
        await deleteStaleGalleryFiles(supabase, postId, finalUrls);
      }

      // Clean and rebuild categories / sub-categories
      await supabase.from('post_categories').delete().eq('post_id', postId);
      if (formData.category_ids.length > 0) {
        await supabase.from('post_categories').insert(
          formData.category_ids.map(id => ({ post_id: postId, category_id: id }))
        );
      }
      await supabase.from('post_sub_categories').delete().eq('post_id', postId);
      if (formData.sub_category_ids.length > 0) {
        await supabase.from('post_sub_categories').insert(
          formData.sub_category_ids.map(id => ({ post_id: postId, sub_category_id: id }))
        );
      }

      if (onRevalidate) await onRevalidate();
      return true;
    } catch (err) {
      console.error('Post save error:', err);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const softDeletePost = useCallback(async (postId: number): Promise<boolean> => {
    const { error } = await supabase.from('posts').update({ deleted_at: new Date().toISOString() }).eq('id', postId);
    if (error) {
      console.error('Post delete error:', error.message);
      return false;
    }
    return true;
  }, []);

  /**
   * Duplikat karya: menyalin baris posts beserta galeri & relasinya.
   * File storage TIDAK diunggah ulang — URL gambar dipakai bersama (aman,
   * karena pembersih file yatim bekerja per-prefix {postId}_ milik masing-masing).
   */
  const duplicatePost = useCallback(async (post: any): Promise<number | null> => {
    try {
      const { data, error } = await supabase.from('posts').insert([{
        title: `${post.title} - Salinan`.slice(0, 120),
        price: post.price || 0,
        theme_id: post.theme_id ?? null,
        views: 0,
        updated_at: new Date().toISOString()
      }]).select().single();
      if (error) throw error;
      const newId = data.id;

      const images = (post.images || []).map((img: any, i: number) => ({
        post_id: newId, url_images: img.url_images, urutan: img.urutan ?? i
      }));
      const cats = (post.categories || []).map((c: any) => ({ post_id: newId, category_id: c.id }));
      const subs = (post.sub_categories || []).map((sc: any) => ({ post_id: newId, sub_category_id: sc.id }));

      if (images.length > 0) { const r = await supabase.from('post_images').insert(images); if (r.error) throw r.error; }
      if (cats.length > 0) { const r = await supabase.from('post_categories').insert(cats); if (r.error) throw r.error; }
      if (subs.length > 0) { const r = await supabase.from('post_sub_categories').insert(subs); if (r.error) throw r.error; }

      return newId;
    } catch (err) {
      console.error('Duplicate post error:', err);
      return null;
    }
  }, []);

  const loadAllPostData = useCallback(async () => {
    const [postsRes, catRes, subRes, themeRes] = await Promise.all([
      supabase.rpc('get_posts_complete'),
      supabase.from('categories').select('*').filter('deleted_at', 'is', null).order('name'),
      supabase.from('sub_categories').select('*').filter('deleted_at', 'is', null).order('name'),
      supabase.from('themes').select('*').filter('deleted_at', 'is', null).order('name'),
    ]);

    if (postsRes.error) {
      console.error('Failed to load posts:', postsRes.error.message);
    }
    if (catRes.error) {
      console.error('Failed to load categories:', catRes.error.message);
    }

    return {
      posts: postsRes.data || [],
      categories: catRes.data || [],
      subCategories: subRes.data || [],
      themes: themeRes.data || [],
    };
  }, []);

  return { savePost, softDeletePost, duplicatePost, loadAllPostData, isSubmitting };
}
