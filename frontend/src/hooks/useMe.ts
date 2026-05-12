import { useEffect, useState } from 'react';
import { ApiError, NetworkError } from '../api/client';
import { getMe } from '../api/endpoints';
import type { Me } from '../api/types';

export interface MeState {
  me: Me | null;
  loading: boolean;
  authenticated: boolean;
  /** Mensaje si la última petición falló por red (no 401). */
  networkError: string | null;
  reload: () => Promise<void>;
}

export function useMe(): MeState {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [networkError, setNetworkError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setNetworkError(null);
    try {
      const data = await getMe();
      setMe(data);
    } catch (err) {
      // 401 = no autenticado, comportamiento esperado → redirige a /login.
      if (err instanceof ApiError && err.status === 401) {
        setMe(null);
        return;
      }
      // Cualquier otro error (red, 500, 403…) NO debe colgar la UI.
      // Tratamos al usuario como no autenticado y dejamos un mensaje para
      // que la pantalla de login pueda mostrarlo.
      setMe(null);
      if (err instanceof NetworkError) {
        setNetworkError(err.message);
      } else if (err instanceof Error) {
        setNetworkError(err.message);
      } else {
        setNetworkError(String(err));
      }
      // Log a consola para depuración sin romper la UI.
      console.error('[useMe] no se pudo obtener /api/me:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  return {
    me,
    loading,
    authenticated: me !== null,
    networkError,
    reload: load,
  };
}
