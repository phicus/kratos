import { useEffect, useState } from 'react';
import { getPeriod } from '../api/endpoints';
import type { Period } from '../api/types';

export function usePeriod() {
  const [period, setPeriod] = useState<Period | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = async () => {
    setLoading(true);
    try {
      setPeriod(await getPeriod());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
  }, []);

  return { period, loading, reload };
}
