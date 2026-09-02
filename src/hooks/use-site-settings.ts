"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

type SiteSettings = {
  app_name: string;
  app_tagline: string;
  phone: string;
  instagram: string;
  tiktok: string;
  address: string;
  message: string;
  whatsapp: string;
  [key: string]: string;
};

const CACHE_KEY = "blu_site_settings";
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const DEFAULTS: SiteSettings = {
  app_name: "BluDecor",
  app_tagline: "Arsitek Event Premium",
  phone: "",
  instagram: "",
  tiktok: "",
  address: "",
  message: "",
  whatsapp: "",
};

function getCached(): SiteSettings | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) return null;
    return { ...DEFAULTS, ...data };
  } catch {
    return null;
  }
}

function setCache(data: SiteSettings) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() }));
  } catch {}
}

export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings>(() => {
    return getCached() || DEFAULTS;
  });
  const [loading, setLoading] = useState(!getCached());

  const fetchSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("site_settings")
        .select("key, value");

      if (error || !data) return;

      const mapped: Record<string, string> = {};
      data.forEach((item: { key: string; value: string }) => {
        mapped[item.key] = item.value;
      });

      const merged = { ...DEFAULTS, ...mapped };
      setSettings(merged);
      setCache(merged);
    } catch (err) {
      console.error("Fetch site settings error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return { settings, loading, refresh: fetchSettings };
}

/**
 * Server-side fetch for generateMetadata.
 * Uses Supabase service client.
 */
export async function getServerSettings(): Promise<SiteSettings> {
  try {
    const { data } = await supabase
      .from("site_settings")
      .select("key, value");

    if (!data) return DEFAULTS;

    const mapped: Record<string, string> = {};
    data.forEach((item) => {
      mapped[item.key] = item.value;
    });

    return { ...DEFAULTS, ...mapped };
  } catch {
    return DEFAULTS;
  }
}
