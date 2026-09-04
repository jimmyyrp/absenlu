'use client';

import imageCompression from 'browser-image-compression';
import { validateImageFile } from './sanitize';

/**
 * Image Upload Utility — Blu Decor Padang
 * Compress, validasi, lalu unggah gambar ke MongoDB (bukan Supabase Storage).
 * URL yang dikembalikan menunjuk ke route `GET /api/media/[id]` (immutable,
 * cache 1 tahun — media disimpan base64 di MongoDB).
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

/** Compress + unggah gambar; mengembalikan URL `/api/media/<id>` atau null. */
export async function compressAndUpload(file: File, fileName: string, postId: number | string): Promise<string | null> {
  try {
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
    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/\.\./g, '');

    const form = new FormData();
    form.append('file', compressedFile, safeName);
    form.append('postId', String(postId));

    const res = await fetch('/api/cms/upload', { method: 'POST', body: form });
    const data = await res.json();
    if (!res.ok || !data.url) {
      throw new Error(data.error || `Unggah gagal (HTTP ${res.status})`);
    }
    return data.url;
  } catch (error) {
    console.error('Blu Storage Error:', error);
    return null;
  }
}