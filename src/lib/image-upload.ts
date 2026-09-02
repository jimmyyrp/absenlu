
'use client';

import imageCompression from 'browser-image-compression';
import { supabase } from './supabase';
import { validateImageFile } from './sanitize';

/**
 * Image Upload Utility - Blu Decor Padang v68.0
 * Compresses, validates, and uploads images to Supabase Storage.
 *
 * cacheControl: 31536000 (1 year) — images are immutable because:
 * - Filenames include {Date.now()} timestamp, so each upload is a unique file
 * - Old files are cleaned up by deleteStaleGalleryFiles(), never modified in-place
 * - Long cache = fewer Supabase origin hits = faster page loads for returning visitors
 */

/** Validate then read an image file to data URL for the cropper. */
export function validateAndReadImage(file: File): Promise<{ dataUrl?: string; error?: string }> {
  const validation = validateImageFile(file);
  if (!validation.valid) return Promise.resolve({ error: validation.error });
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve({ dataUrl: reader.result as string });
    reader.onerror = () => resolve({ error: 'Gagal membaca file gambar.' });
    reader.readAsDataURL(file);
  });
}

export async function compressAndUpload(file: File, fileName: string, bucket: string = 'blu_media'): Promise<string | null> {
  try {
    // Validate file type and size
    const validation = validateImageFile(file);
    if (!validation.valid) {
      console.error('Upload validation failed:', validation.error);
      return null;
    }

    const options = {
      maxSizeMB: 0.8,
      maxWidthOrHeight: 1600,
      useWebWorker: true,
      fileType: 'image/webp' as const,
    };

    const compressedFile = await imageCompression(file, options);
    
    // Sanitize filename (prevent path traversal)
    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/\.\./g, '');
    const filePath = `portfolio/${safeName}`;

    const { error } = await supabase.storage
      .from(bucket)
      .upload(filePath, compressedFile, {
        cacheControl: '31536000',
        upsert: true
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (error) {
    console.error('Blu Storage Error:', error);
    return null;
  }
}
