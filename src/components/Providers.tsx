'use client';

import React, { useEffect, useState } from 'react';
import { Toaster } from '@/components/ui/toaster';

const APP_VERSION = process.env.NEXT_PUBLIC_BUILD_TIME || 'ops-v1';
const VERSION_KEY = 'blu_app_version';
const PRESERVED_KEYS = [
  'blu_admin_auth',
  'blu_auth_sig',
  'blu_user_name',
  'blu_user_role',
  'bludecor_ops_auth',
  'bludecor_ops_username',
  'bludecor_ops_lastlogin',
  'bludecor_ops_role',
  'bludecor_ops_userid',
  'bludecor_ops_state_v2',
];

function cacheBust() {
  try {
    if (localStorage.getItem(VERSION_KEY) === APP_VERSION) return;

    const preserved: Record<string, string | null> = {};
    for (const key of PRESERVED_KEYS) preserved[key] = localStorage.getItem(key);
    localStorage.clear();
    for (const key of PRESERVED_KEYS) {
      const value = preserved[key];
      if (value !== null) localStorage.setItem(key, value);
    }
    localStorage.setItem(VERSION_KEY, APP_VERSION);

    if ('serviceWorker' in navigator && 'caches' in window) {
      caches.keys().then((names) => names.forEach((name) => caches.delete(name))).catch(() => {});
    }
  } catch {
    // Cache cleanup must never prevent the application from loading.
  }
}

export function ClientProviders({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    cacheBust();
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-navy/10 border-t-gold rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      {children}
      <Toaster />
    </>
  );
}
