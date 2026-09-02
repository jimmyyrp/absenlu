'use client';

import { useCallback, useRef, useState } from 'react';

export function useSubmitLock() {
  const lockRef = useRef(false);
  const [locked, setLocked] = useState(false);

  const run = useCallback(async (action: () => void | Promise<void>) => {
    if (lockRef.current) return false;
    lockRef.current = true;
    setLocked(true);
    try {
      await action();
      return true;
    } finally {
      lockRef.current = false;
      setLocked(false);
    }
  }, []);

  return { locked, run };
}