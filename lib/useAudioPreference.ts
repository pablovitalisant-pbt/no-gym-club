// ponytail: localStorage persistence, no deps, no lib
// Default: true (audio enabled)

import { useState, useCallback } from 'react';

const STORAGE_KEY = 'ngc-audio-enabled';

export function useAudioPreference(): [boolean, () => void] {
  const [enabled, setEnabled] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored !== null ? stored === 'true' : true;
    } catch {
      return true;
    }
  });

  const toggle = useCallback(() => {
    setEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch {
        // localStorage not available — silently ignore
      }
      return next;
    });
  }, []);

  return [enabled, toggle];
}
