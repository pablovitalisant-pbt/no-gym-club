'use client';

import { useEffect, useRef, useState } from 'react';

/** cronómetro en segundos; con `limit` se detiene solo al alcanzarlo */
export function useStopwatch(limit?: number) {
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setSeconds((s) => {
        if (limit !== undefined && s + 1 >= limit) {
          setRunning(false);
          return limit;
        }
        return s + 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, limit]);

  return {
    seconds,
    running,
    start: () => {
      setSeconds(0);
      setRunning(true);
    },
    stop: () => setRunning(false),
    reset: () => {
      setRunning(false);
      setSeconds(0);
    },
  };
}
