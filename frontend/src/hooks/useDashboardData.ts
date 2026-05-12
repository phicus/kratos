import { useCallback, useEffect, useRef, useState } from 'react';
import { admin } from '../api/endpoints';
import type { DashboardData } from '../api/types';

const POLL_INTERVAL_MS = 10_000;

export function useDashboardData() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);

  const reload = useCallback(async () => {
    try {
      const next = await admin.dashboard();
      setData(next);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
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
  }, [reload]);

  return { data, loading, error, reload };
}
