import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Me } from '../api/types';

export function useRequireAdmin(me: Me | null, loading: boolean) {
  const navigate = useNavigate();
  useEffect(() => {
    if (loading) return;
    if (!me) {
      navigate('/login', { replace: true });
      return;
    }
    if (!me.is_admin) {
      navigate('/', { replace: true });
    }
  }, [me, loading, navigate]);
}
