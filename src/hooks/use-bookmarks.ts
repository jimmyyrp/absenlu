
'use client';

import { useState, useEffect, useCallback } from 'react';

const BOOKMARK_EVENT = 'blu-bookmarks-updated';

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  const loadBookmarks = useCallback(() => {
    try {
      const saved = localStorage.getItem('blu_bookmarks');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setBookmarks(parsed.filter((b): b is string => typeof b === 'string'));
        } else {
          setBookmarks([]);
        }
      } else {
        setBookmarks([]);
      }
    } catch (e) {
      console.error("Failed to parse bookmarks", e);
      setBookmarks([]);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    loadBookmarks();

    // Listener untuk sinkronisasi antar komponen dalam satu tab
    const handleUpdate = () => {
      loadBookmarks();
    };

    // Listener untuk sinkronisasi antar tab/window
    const handleStorageUpdate = (e: StorageEvent) => {
      if (e.key === 'blu_bookmarks') {
        loadBookmarks();
      }
    };

    window.addEventListener(BOOKMARK_EVENT, handleUpdate);
    window.addEventListener('storage', handleStorageUpdate);

    return () => {
      window.removeEventListener(BOOKMARK_EVENT, handleUpdate);
      window.removeEventListener('storage', handleStorageUpdate);
    };
  }, [loadBookmarks]);

  const toggleBookmark = (id: string) => {
    let current: string[] = [];
    try {
      const saved = localStorage.getItem('blu_bookmarks');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) current = parsed;
      }
    } catch {}

    const next = current.includes(id)
      ? current.filter((b) => b !== id)
      : [...current, id];
    
    localStorage.setItem('blu_bookmarks', JSON.stringify(next));
    setBookmarks(next);
    
    // Broadcast perubahan ke komponen lain
    window.dispatchEvent(new Event(BOOKMARK_EVENT));
  };

  const isBookmarked = (id: string) => bookmarks.includes(id);

  return { bookmarks, toggleBookmark, isBookmarked, mounted };
}
