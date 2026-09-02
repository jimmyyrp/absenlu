'use client';

/**
 * Input Sanitizer - Blu Decor Padang
 * Sanitize user inputs to prevent XSS attacks.
 */

/** Remove HTML tags and dangerous characters from text */
export function sanitizeText(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim();
}

/** Strip all HTML tags (for plain text fields) */
export function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, '').trim();
}

/** Validate file is an image before upload */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'];
  const maxSizeMB = 5;

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Format file tidak didukung. Gunakan JPG, PNG, WebP, atau AVIF.' };
  }

  if (file.size > maxSizeMB * 1024 * 1024) {
    return { valid: false, error: `Ukuran file maksimal ${maxSizeMB}MB.` };
  }

  return { valid: true };
}

/** Validate name field (letters, spaces, max length) */
export function validateName(name: string, maxLength: number = 100): { valid: boolean; error?: string } {
  const trimmed = name.trim();
  if (trimmed.length === 0) return { valid: false, error: 'Nama wajib diisi.' };
  if (trimmed.length > maxLength) return { valid: false, error: `Nama maksimal ${maxLength} karakter.` };
  return { valid: true };
}

/** Validate testimonial text */
export function validateTestimonialText(text: string, maxLength: number = 500): { valid: boolean; error?: string } {
  const trimmed = text.trim();
  if (trimmed.length < 10) return { valid: false, error: 'Ulasan minimal 10 karakter.' };
  if (trimmed.length > maxLength) return { valid: false, error: `Ulasan maksimal ${maxLength} karakter.` };
  return { valid: true };
}
