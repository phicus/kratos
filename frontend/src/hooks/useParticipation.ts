import { useCallback, useEffect, useRef, useState } from 'react';
import { admin } from '../api/endpoints';
import { ApiError } from '../api/client';
import type { ParticipationData } from '../api/types';

const POLL_INTERVAL_MS = 10_000;

export function useParticipation(enabled: boolean) {
  const [data, setData] = useState<ParticipationData | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);

  const reload = useCallback(async () => {
    if (!enabled) return;
    try {
      const next = await admin.participation();
      setData(next);
      setError(null);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setData(null);
        setError(null);
      } else {
        setError(err instanceof Error ? err.message : String(err));
      }
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setData(null);
      setLoading(false);
      return;
    }
    let cancelled = false;

    const tick = async () => {
      if (cancelled) return;
      await reload();
    };

    const start = () => {
      if (timerRef.current !== null) return;
      timerRef.current = window.setInterval(tick, POLL_INTERVAL_MS);
    };
    const stop = () => {
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        void tick();
        start();
      } else {
        stop();
      }
    };

    void tick();
    if (document.visibilityState === 'visible') start();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      cancelled = true;
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [enabled, reload]);

  return { data, loading, error, reload };
}
